import { describe, expect, it } from "bun:test";
import { FrameworkError, ValidationError } from "#errors";
import { loadConfig, parseDotEnv, resolveEnvironment } from "#config";
import { object, optional, string, transform } from "#validate";

describe("config", () => {
  it("Given loadConfig with env and schema Then it returns the validated value", async () => {
    const schema = object({ name: string() });
    const value = await loadConfig(schema, { env: { name: "app" }, envFile: ".env.missing" });
    expect(value).toEqual({ name: "app" });
  });

  it("Given transform in schema Then coercion from string works", async () => {
    const schema = object({ name: string(), port: transform(string(), (v) => Number(v)) });
    const value = await loadConfig(schema, { env: { name: "app", port: "8080" }, envFile: ".env.missing" });
    expect(value).toEqual({ name: "app", port: 8080 });
  });

  it("Given invalid env Then loadConfig rejects with ValidationError", async () => {
    const schema = object({ name: string() });
    let error: unknown;
    try {
      await loadConfig(schema, { env: { name: 42 as unknown as string }, envFile: ".env.missing" });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ValidationError);
    if (error instanceof ValidationError) {
      expect(error.issues.length).toBeGreaterThan(0);
    }
  });

  it("Given secrets list with missing value Then loadConfig throws FrameworkError", async () => {
    const schema = object({ apiKey: optional(string()) });
    let error: unknown;
    try {
      await loadConfig(schema, { env: { API_KEY: "" }, envFile: ".env.missing", secrets: ["API_KEY"] });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });

  it("Given environments for the environment name Then values are merged into env", async () => {
    const schema = object({ level: optional(string()), base: string() });
    const value = await loadConfig(schema, {
      env: { base: "x" },
      envFile: ".env.missing",
      environment: "production",
      environments: { production: { level: "debug" } },
    });
    expect(value).toEqual({ base: "x", level: "debug" });
  });

  it("Given resolveEnvironment Then APP_ENV/NODE_ENV/ENVIRONMENT or development", () => {
    expect(resolveEnvironment({ APP_ENV: "staging" })).toBe("staging");
    expect(resolveEnvironment({ NODE_ENV: "test" })).toBe("test");
    expect(resolveEnvironment({ ENVIRONMENT: "ci" })).toBe("ci");
    expect(resolveEnvironment({})).toBe("development");
  });

  it("Given parseDotEnv Then it parses KEY=value lines, comments and quotes", () => {
    const text = ["# comment", "A=1", "B = two words", 'C="quoted"', "D='single'", ""].join("\n");
    expect(parseDotEnv(text)).toEqual({ A: "1", B: "two words", C: "quoted", D: "single" });
  });

  it("Given parseDotEnv with a malformed line Then it throws FrameworkError", () => {
    let error: unknown;
    try {
      parseDotEnv("NO_EQUALS_HERE\n");
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });
});
