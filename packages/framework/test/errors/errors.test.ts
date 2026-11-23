import { describe, expect, it } from "bun:test";
import { FrameworkError } from "#errors";
import { newId, ok, err } from "#core";

describe("core", () => {
  it("Given newId Then it returns a unique UUID string", () => {
    const a = newId();
    const b = newId();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(a).not.toBe(b);
  });

  it("Given ok(err) Then isOk/isErr discriminate the branch", () => {
    const good = ok(42);
    const bad = err("falhou");
    expect(good.ok).toBe(true);
    expect(bad.ok).toBe(false);
    if (good.ok) expect(good.value).toBe(42);
    if (!bad.ok) expect(bad.error).toBe("falhou");
    expect(FrameworkError).toBeDefined();
  });
});
