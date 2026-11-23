import { describe, expect, it } from "bun:test";
import { createCache } from "#cache";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe("cache", () => {
  it("Given set/get Then get returns the value", () => {
    const cache = createCache();
    cache.set("k", "v");
    expect(cache.get("k")).toBe("v");
    expect(cache.has("k")).toBe(true);
  });

  it("Given ttlMs Then the entry expires", async () => {
    const cache = createCache();
    cache.set("k", "v", { ttlMs: 5 });
    expect(cache.get("k")).toBe("v");
    await sleep(8);
    expect(cache.get("k")).toBeUndefined();
    expect(cache.has("k")).toBe(false);
  });

  it("Given invalidateByTag Then entries with the tag are removed", () => {
    const cache = createCache();
    cache.set("a", 1, { tags: ["x"] });
    cache.set("b", 2, { tags: ["x", "y"] });
    cache.set("c", 3);
    expect(cache.invalidateByTag("x")).toBe(2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("Given getOrSet with a loader Then it loads once and caches", async () => {
    const cache = createCache();
    let calls = 0;
    const a = await cache.getOrSet("k", () => {
      calls++;
      return `value-${calls}`;
    });
    const b = await cache.getOrSet("k", () => {
      calls++;
      return `value-${calls}`;
    });
    expect(a).toBe("value-1");
    expect(b).toBe("value-1");
    expect(calls).toBe(1);
  });

  it("Given concurrent getOrSet Then the loader runs once (stampede)", async () => {
    const cache = createCache();
    let calls = 0;
    const loader = async () => {
      calls++;
      await sleep(5);
      return calls;
    };
    const [a, b, c] = await Promise.all([cache.getOrSet("k", loader), cache.getOrSet("k", loader), cache.getOrSet("k", loader)]);
    expect(calls).toBe(1);
    expect([a, b, c]).toEqual([1, 1, 1]);
  });

  it("Given delete/clear Then entries are removed", () => {
    const cache = createCache();
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.delete("a")).toBe(true);
    expect(cache.get("a")).toBeUndefined();
    cache.clear();
    expect(cache.get("b")).toBeUndefined();
  });
});
