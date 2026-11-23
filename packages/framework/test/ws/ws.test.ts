import { describe, expect, it } from "bun:test";
import type { ServerWebSocket } from "bun";
import { buildWebsocketHandlers, matchWsPath, type WsRoute } from "#ws";

describe("ws", () => {
  it("Given matchWsPath Then it matches registered patterns", () => {
    const route: WsRoute = { pattern: "/chat", handlers: {} };
    expect(matchWsPath([route], "/chat")).toBe(route);
    expect(matchWsPath([route], "/other")).toBeUndefined();
  });

  it("Given buildWebsocketHandlers Then it returns handlers for every hook", () => {
    const handlers = buildWebsocketHandlers([]);
    expect(typeof handlers.open).toBe("function");
    expect(typeof handlers.message).toBe("function");
    expect(typeof handlers.close).toBe("function");
    expect(typeof handlers.drain).toBe("function");
    expect(typeof handlers.error).toBe("function");
  });

  it("Given buildWebsocketHandlers Then hooks dispatch to route handlers", () => {
    const calls: string[] = [];
    const route: WsRoute = {
      pattern: "/x",
      handlers: {
        open: () => { calls.push("open"); },
        message: () => { calls.push("message"); },
        close: () => { calls.push("close"); },
        drain: () => { calls.push("drain"); },
        error: () => { calls.push("error"); },
      },
    };
    const handlers = buildWebsocketHandlers([route]);
    const fakeWs = { data: { route } } as unknown as ServerWebSocket<WsRouteData>;
    handlers.open(fakeWs);
    handlers.message(fakeWs, "hi");
    handlers.close(fakeWs, 1000, "");
    handlers.drain(fakeWs);
    handlers.error(new Error("e"), fakeWs);
    expect(calls).toEqual(["open", "message", "close", "drain", "error"]);
  });
});

interface WsRouteData {
  readonly route: WsRoute;
}
