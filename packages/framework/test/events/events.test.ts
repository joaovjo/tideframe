import { describe, expect, it } from "bun:test";
import { createBus, createTypedBus, type EventListener } from "#events";

describe("events", () => {
  it("Given on + emit Then the listener receives the payload", async () => {
    const bus = createBus();
    const seen: unknown[] = [];
    bus.on("user.created", (payload) => {
      seen.push(payload);
    });
    await bus.emit("user.created", { id: 1 });
    expect(seen).toEqual([{ id: 1 }]);
  });

  it("Given wildcard patterns Then 'user.*' matches 'user.created' and '*' matches everything", async () => {
    const bus = createBus();
    const seen: string[] = [];
    bus.on("user.*", () => { seen.push("user.*"); });
    bus.on("*", () => { seen.push("*"); });
    bus.on("other", () => { seen.push("other"); });
    await bus.emit("user.created");
    expect(seen.sort()).toEqual(["*", "user.*"]);
  });

  it("Given off Then the listener is removed", async () => {
    const bus = createBus();
    const seen: string[] = [];
    bus.on("a", () => { seen.push("x"); });
    bus.off("a");
    await bus.emit("a");
    expect(seen).toEqual([]);
  });

  it("Given a listener that throws Then emit resolves (error isolation)", async () => {
    const bus = createBus();
    const seen: string[] = [];
    bus.on("a", () => { throw new Error("boom"); });
    bus.on("a", () => { seen.push("ok"); });
    await bus.emit("a");
    expect(seen).toEqual(["ok"]);
  });

  it("Given async listeners Then emit awaits them", async () => {
    const bus = createBus();
    let done = false;
    bus.on("a", async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      done = true;
    });
    await bus.emit("a");
    expect(done).toBe(true);
  });

  it("Given a typed bus Then on/emit types flow from EventsMap", () => {
    const bus = createTypedBus<{ "user.created": { id: string } }>();
    const seen: Array<{ id: string }> = [];
    const listener: EventListener<{ id: string }> = (payload) => { seen.push(payload); };
    bus.on("user.created", listener);
    void bus.emit("user.created", { id: "1" });
    expect(seen.length).toBe(0);
  });
});
