import { describe, expect, it } from "bun:test";
import type { PathPart } from "#validate";
import { array, boolean, check, custom, is, literal, nullable, number, object, optional, parse, safeParse, string, transform, union } from "#validate";
import { ValidationError } from "#errors";

describe("validate", () => {
  it("Given string() Then it validates strings and rejects other types", () => {
    expect(is(string(), "hello")).toBe(true);
    expect(is(string(), 42)).toBe(false);
    expect(is(string(), null)).toBe(false);
    expect(is(string({ minLength: 2, maxLength: 4 }), "abc")).toBe(true);
    expect(is(string({ minLength: 2, maxLength: 4 }), "a")).toBe(false);
    expect(is(string({ minLength: 2, maxLength: 4 }), "abcde")).toBe(false);
    expect(is(string({ startsWith: "http" }), "https://example.com")).toBe(true);
    expect(is(string({ endsWith: ".com" }), "example.org")).toBe(false);
    expect(is(string({ pattern: /^\d+$/ }), "123")).toBe(true);
    expect(is(string({ pattern: /^\d+$/ }), "12a")).toBe(false);
  });

  it("Given number() Then it validates numbers and rejects other types", () => {
    expect(is(number(), 3.14)).toBe(true);
    expect(is(number({ integer: true }), 3)).toBe(true);
    expect(is(number({ integer: true }), 3.5)).toBe(false);
    expect(is(number({ min: 2, max: 10 }), 1)).toBe(false);
    expect(is(number({ min: 2, max: 10 }), 11)).toBe(false);
    expect(is(number({ min: 2, max: 10 }), 7)).toBe(true);
    expect(is(number(), "3")).toBe(false);
    expect(is(number(), NaN)).toBe(false);
    expect(is(number({ finite: true }), Infinity)).toBe(false);
  });

  it("Given boolean()/literal() Then they validate literals", () => {
    expect(is(boolean(), true)).toBe(true);
    expect(is(boolean(), "true")).toBe(false);
    expect(is(literal("a"), "a")).toBe(true);
    expect(is(literal("a"), "b")).toBe(false);
    expect(is(literal(1), 1)).toBe(true);
    expect(is(literal(1), "1")).toBe(false);
  });

  it("Given array(string()) Then it parses arrays and rejects non-arrays", () => {
    const schema = array(string());
    const result = safeParse(schema, ["a", "b"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(["a", "b"]);
    expect(is(schema, "not-array")).toBe(false);
    const bad = safeParse(schema, ["a", 2]);
    expect(bad.ok).toBe(false);
  });

  it("Given object() Then it parses nested fields and strips unknown keys by default", () => {
    const schema = object({
      name: string(),
      age: optional(number()),
    });
    const result = safeParse(schema, { name: "Ada", extra: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ name: "Ada" });
  });

  it("Given object() with onExcess error Then unknown keys produce issues", () => {
    const schema = object({ name: string() }, { onExcess: "error" });
    const result = safeParse(schema, { name: "Ada", extra: true });
    expect(result.ok).toBe(false);
  });

  it("Given object() on a missing required field Then it produces an issue", () => {
    const schema = object({ name: string(), age: number() });
    const result = safeParse(schema, { age: 3 });
    expect(result.ok).toBe(false);
  });

  it("Given object() Then parse() returns the typed output", () => {
    const schema = object({ name: string(), age: optional(number()) });
    expect(parse(schema, { name: "Ada" })).toEqual({ name: "Ada" });
  });

  it("Given union() Then it accepts any of the members", () => {
    const schema = union(string(), number());
    expect(is(schema, "a")).toBe(true);
    expect(is(schema, 5)).toBe(true);
    expect(is(schema, true)).toBe(false);
  });

  it("Given nullable()/optional() Then they accept null/undefined and delegate otherwise", () => {
    expect(is(nullable(string()), null)).toBe(true);
    expect(is(nullable(string()), "a")).toBe(true);
    expect(is(nullable(string()), 5)).toBe(false);
    expect(is(optional(string()), undefined)).toBe(true);
    expect(is(optional(string()), "a")).toBe(true);
    expect(is(optional(string()), 5)).toBe(false);
  });

  it("Given transform() Then the output is the transformed value", () => {
    const schema = transform(string(), (v) => v.toUpperCase());
    expect(is(schema, "abc")).toBe(true);
    if (is(schema, "abc")) expect(schema.parse("abc")).toEqual({ ok: true, value: "ABC" });
  });

  it("Given check() Then failing the predicate produces an issue with message", () => {
    const schema = check(string(), (v) => v.length > 3);
    expect(is(schema, "abcde")).toBe(true);
    expect(is(schema, "ab")).toBe(false);
    const withMessage = check(string(), (v) => v.length > 3, "Muito curto");
    const result = safeParse(withMessage, "ab");
    expect(result.ok).toBe(false);
  });

  it("Given custom() Then it delegates to the predicate", () => {
    const schema = custom<string>((v) => typeof v === "string" && v.startsWith("tide"));
    expect(is(schema, "tideframe")).toBe(true);
    expect(is(schema, "other")).toBe(false);
  });

  it("Given parse() on a failing schema Then it throws ValidationError with issues", () => {
    const schema = object({ name: string() });
    let error: unknown;
    try {
      parse(schema, {});
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ValidationError);
    if (error instanceof ValidationError) {
      expect(error.status).toBe(422);
      expect(error.issues.length).toBeGreaterThan(0);
    }
  });

  it("Given issuesToLines(safeParse result) Then lines contain path and message", () => {
    const schema = object({ user: object({ email: string() }) });
    const result = safeParse(schema, { user: {} });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const lines = result.error.map((i) => `${pathLine(i.path ?? [])}: ${i.message}`);
      expect(lines.join("\n")).toContain("email");
    }
  });
});

function pathLine(path: readonly PathPart[]): string {
  return path.map((part) => (typeof part === "object" ? String(part.key) : String(part))).join(".");
}
