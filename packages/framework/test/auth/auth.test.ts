import { describe, expect, it } from "bun:test";
import {
  createAuth,
  createCsrf,
  createMemorySessionStore,
  createRateLimiter,
  createToken,
  hasPermission,
  hasRole,
  jwtDecode,
  jwtEncode,
  requirePermission,
} from "#auth";
import { ForbiddenError, TooManyRequestsError, UnauthorizedError } from "#errors";
import { createCtx } from "#http";

describe("auth", () => {
  it("Given createMemorySessionStore Then create/get/destroy/rotate work", async () => {
    const sessions = createMemorySessionStore();
    const session = await sessions.create("user-1");
    expect(await sessions.get(session.id)).toEqual(session);
    const rotated = await sessions.rotate(session.id);
    expect(rotated?.id).not.toBe(session.id);
    await sessions.destroy(rotated?.id ?? "");
    expect(await sessions.get(rotated?.id ?? "")).toBeUndefined();
  });

  it("Given jwtEncode/jwtDecode Then roundtrip works", async () => {
    const jwt = await jwtEncode({ sub: "1" }, { secret: "s3cret" });
    expect(typeof jwt.token).toBe("string");
    const decoded = await jwtDecode(jwt.token, "s3cret");
    expect(decoded.payload.sub).toBe("1");
  });

  it("Given jwtDecode with wrong secret Then it throws UnauthorizedError", async () => {
    const jwt = await jwtEncode({ sub: "1" }, { secret: "a" });
    let error: unknown;
    try {
      await jwtDecode(jwt.token, "b");
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("Given jwtDecode expired token Then it throws UnauthorizedError", async () => {
    const jwt = await jwtEncode({ sub: "1" }, { secret: "a", expiresInMs: 1 });
    await new Promise((resolve) => setTimeout(resolve, 5));
    let error: unknown;
    try {
      await jwtDecode(jwt.token, "a");
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("Given createToken Then tokens are unique hex strings", () => {
    const a = createToken();
    const b = createToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("Given createAuth Then login/logout/user/requireUser work", async () => {
    const sessions = createMemorySessionStore();
    const auth = createAuth({ sessions, loadUser: async (id) => ({ id: id ?? "missing" }) });
    const ctx = createCtx(new Request("http://localhost/login"), {});
    await auth.login(ctx, { id: "user-1", roles: [] });
    const cookieHeader = ctx.headers.get("Set-Cookie") ?? "";
    expect(cookieHeader).toContain("session=");
    const sessionId = cookieHeader.split(";")[0]?.split("=")[1] ?? "";
    const ctx2 = createCtx(new Request("http://localhost/me", { headers: { Cookie: `session=${sessionId}` } }), {});
    const user = await auth.user(ctx2);
    expect(user?.id).toBe("user-1");
    expect((await auth.requireUser(ctx2)).id).toBe("user-1");
    await auth.logout(ctx2);
    expect(await auth.user(ctx2)).toBeUndefined();
  });

  it("Given auth middleware Then it sets ctx.locals.user", async () => {
    const sessions = createMemorySessionStore();
    const auth = createAuth({ sessions, loadUser: async (id) => ({ id: id ?? "missing" }) });
    const ctx = createCtx(new Request("http://localhost/me"), {});
    await auth.login(ctx, { id: "u1" });
    const sessionId = (ctx.headers.get("Set-Cookie") ?? "").split(";")[0]?.split("=")[1] ?? "";
    const ctx2 = createCtx(new Request("http://localhost/me", { headers: { Cookie: `session=${sessionId}` } }), {});
    await auth.middleware()(ctx2, async () => new Response("ok"));
    expect((ctx2.locals.user as { id: string } | undefined)?.id).toBe("u1");
  });

  it("Given hasPermission/hasRole Then role/permission/wildcard semantics", () => {
    const admin = { id: "1", roles: ["admin"], permissions: [] };
    const reader = { id: "2", roles: [], permissions: ["users:read"] };
    const all = { id: "3", roles: ["admin"], permissions: ["*"] };
    expect(hasPermission(admin, "admin")).toBe(true);
    expect(hasPermission(admin, "users:write")).toBe(false);
    expect(hasPermission(reader, "users:read")).toBe(true);
    expect(hasPermission(reader, "admin")).toBe(false);
    expect(hasPermission(all, "anything")).toBe(true);
    expect(hasRole(admin, "admin")).toBe(true);
    expect(hasRole(reader, "admin")).toBe(false);
  });

  it("Given requirePermission middleware Then 403 when missing", async () => {
    const mw = requirePermission("users:write");
    const ctx = createCtx(new Request("http://localhost/x"), {});
    ctx.locals.user = { id: "1", roles: [], permissions: [] };
    let error: unknown;
    try {
      await mw(ctx, async () => new Response("ok"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ForbiddenError);
  });

  it("Given requirePermission middleware Then passes when allowed", async () => {
    const mw = requirePermission("users:read");
    const ctx = createCtx(new Request("http://localhost/x"), {});
    ctx.locals.user = { id: "1", permissions: ["users:read"] };
    const response = await mw(ctx, async () => new Response("ok"));
    expect(response.status).toBe(200);
  });

  it("Given createCsrf Then issue+middleware validate the token", async () => {
    const csrf = createCsrf();
    const ctx = createCtx(new Request("http://localhost/x", { method: "POST", headers: { Cookie: "session=abc" } }), {});
    const token = csrf.issue(ctx);
    let error: unknown;
    try {
      await csrf.middleware(ctx, async () => new Response("ok"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ForbiddenError);
    ctx.req.headers.set("X-CSRF-Token", token);
    const response = await csrf.middleware(ctx, async () => new Response("ok"));
    expect(response.status).toBe(200);
  });

  it("Given createRateLimiter Then 429 after limit", async () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    const ctx = createCtx(new Request("http://localhost/x"), {});
    for (let i = 0; i < 2; i++) {
      const response = await limiter(ctx, async () => new Response("ok"));
      expect(response.status).toBe(200);
    }
    let error: unknown;
    try {
      await limiter(ctx, async () => new Response("ok"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(TooManyRequestsError);
  });
});
