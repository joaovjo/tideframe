import { describe, expect, it } from "bun:test";
import { createApp } from "#http";
import { NotFoundError } from "#errors";
import { object, parse, string } from "#validate";

describe("http", () => {
  it("Given a GET route Then handle returns the JSON response", async () => {
    const app = createApp();
    app.get("/hello", (ctx) => ctx.json({ hello: "world" }));
    const response = await app.handle(new Request("http://localhost/hello"));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual({ hello: "world" });
  });

  it("Given route params Then ctx.params has decoded values", async () => {
    const app = createApp();
    app.get("/users/:id", (ctx) => ctx.text(ctx.params.id ?? ""));
    const response = await app.handle(new Request("http://localhost/users/42"));
    expect(await response.text()).toBe("42");
  });

  it("Given query string Then ctx.query exposes it", async () => {
    const app = createApp();
    app.get("/search", (ctx) => ctx.json({ term: ctx.query.get("term") ?? "" }));
    const response = await app.handle(new Request("http://localhost/search?term=bun"));
    expect(await response.json()).toEqual({ term: "bun" });
  });

  it("Given POST + validation Then invalid body yields 422 problem+json, valid body yields 200", async () => {
    const app = createApp();
    const UserSchema = object({ name: string() });
    app.post("/users", async (ctx) => {
      const body = parse(UserSchema, await ctx.req.json());
      return ctx.json(body);
    });
    const bad = await app.handle(
      new Request("http://localhost/users", {
        method: "POST",
        body: JSON.stringify({ name: 3 }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(bad.status).toBe(422);
    const problem = (await bad.json()) as { status: number; errors: Array<{ path: string; message: string }> };
    expect(problem.status).toBe(422);
    expect(problem.errors[0]?.path).toBe("name");
    const okResponse = await app.handle(
      new Request("http://localhost/users", {
        method: "POST",
        body: JSON.stringify({ name: "Ada" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(okResponse.status).toBe(200);
    expect(await okResponse.json()).toEqual({ name: "Ada" });
  });

  it("Given no matching route Then 404", async () => {
    const app = createApp();
    app.get("/a", () => new Response("a"));
    const response = await app.handle(new Request("http://localhost/nope"));
    expect(response.status).toBe(404);
  });

  it("Given method mismatch Then 405 with Allow header", async () => {
    const app = createApp();
    app.get("/a", () => new Response("a"));
    const response = await app.handle(new Request("http://localhost/a", { method: "POST" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("GET");
  });

  it("Given middleware Then it runs in order via next()", async () => {
    const app = createApp();
    const order: string[] = [];
    app.use(async (_ctx, next) => {
      order.push("before");
      const response = await next();
      order.push("after");
      return response;
    });
    app.get("/a", () => {
      order.push("route");
      return new Response("a");
    });
    const response = await app.handle(new Request("http://localhost/a"));
    expect(await response.text()).toBe("a");
    expect(order).toEqual(["before", "route", "after"]);
  });

  it("Given default app Then security headers are set", async () => {
    const app = createApp();
    app.get("/a", (ctx) => ctx.text("a"));
    const response = await app.handle(new Request("http://localhost/a"));
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("Given createApp({ securityHeaders: false }) Then default headers are absent", async () => {
    const app = createApp({ securityHeaders: false });
    app.get("/a", (ctx) => ctx.text("a"));
    const response = await app.handle(new Request("http://localhost/a"));
    expect(response.headers.get("X-Content-Type-Options")).toBeNull();
  });

  it("Given a handler throwing NotFoundError Then 404 problem+json", async () => {
    const app = createApp();
    app.get("/missing", () => {
      throw new NotFoundError("Sem o recurso");
    });
    const response = await app.handle(new Request("http://localhost/missing"));
    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("problem+json");
  });

  it("Given ctx.sse Then the response is text/event-stream with data frames", async () => {
    const app = createApp();
    app.get("/sse", (ctx) =>
      ctx.sse(async (send) => {
        send("hello");
        send("ping", { event: "ping", id: "1", retry: 100 });
      }),
    );
    const response = await app.handle(new Request("http://localhost/sse"));
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain("data: hello");
    expect(text).toContain("event: ping");
    expect(text).toContain("id: 1");
    expect(text).toContain("retry: 100");
  });

  it("Given app.static Then serves files under the prefix", async () => {
    await Bun.write("test-static-hello.txt", "hi");
    const app = createApp();
    app.static("/", ".");
    const response = await app.handle(new Request("http://localhost/test-static-hello.txt"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("hi");
    await Bun.file("test-static-hello.txt").unlink();
  });

  it("Given app.routes Then it lists method+pattern", () => {
    const app = createApp();
    app.get("/users/:id", () => new Response("x"));
    app.post("/users", () => new Response("y"));
    expect(app.routes()).toEqual([
      { method: "GET", pattern: "/users/:id" },
      { method: "POST", pattern: "/users" },
    ]);
  });

  it("Given app.listen({ port: 0 }) Then it serves over real HTTP", async () => {
    const app = createApp();
    app.get("/hello", (ctx) => ctx.json({ hello: "world" }));
    const server = app.listen({ port: 0 });
    try {
      expect(server.port).toBeGreaterThan(0);
      const response = await fetch(`http://localhost:${server.port}/hello`);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ hello: "world" });
    } finally {
      server.stop(true);
    }
  });
});
