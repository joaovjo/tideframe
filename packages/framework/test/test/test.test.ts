import { describe, expect, it } from "bun:test";
import { Container, Token } from "#di";
import { createTestApp, inject } from "#test";

describe("test", () => {
  it("Given inject Then returns the token value from container", () => {
    const token = new Token<string>("t");
    const container = new Container();
    container.set(token, "v");
    expect(inject(container, token)).toBe("v");
  });

  it("Given createTestApp Then returns an App with handle()", async () => {
    const app = createTestApp();
    app.get("/health", (ctx) => ctx.json({ ok: true }));
    const response = await app.handle(new Request("http://localhost/health"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});
