import { describe, expect, it } from "bun:test";
import { FrameworkError } from "#errors";
import { Container, createContainer, runWithRequest, Token } from "#di";

describe("di", () => {
  it("Given a token and a container Then set/get returns the instance", () => {
    const token = new Token<string>("name");
    const container = new Container();
    container.set(token, "tide");
    expect(container.get(token)).toBe("tide");
    expect(container.has(token)).toBe(true);
  });

  it("Given createContainer Then it returns a usable container", () => {
    const container = createContainer();
    const token = new Token<number>("x");
    container.set(token, 7);
    expect(container.get(token)).toBe(7);
  });

  it("Given a class provider Then the container constructs it", () => {
    class Greeter {
      static readonly inject: readonly Token<unknown>[] = [];
      readonly greeting = "hello";
    }
    const token = new Token<Greeter>("greeter");
    const container = new Container();
    container.set(token, Greeter);
    expect(container.get(token).greeting).toBe("hello");
  });

  it("Given a class with inject Then deps are resolved and passed to the constructor", () => {
    const configToken = new Token<string>("config");
    class Service {
      static readonly inject: readonly Token<unknown>[] = [configToken];
      readonly greeting: string;
      constructor(config: string) {
        this.greeting = `hello ${config}`;
      }
    }
    const serviceToken = new Token<Service>("service");
    const container = new Container();
    container.set(configToken, "world");
    container.set(serviceToken, Service);
    expect(container.get(serviceToken).greeting).toBe("hello world");
  });

  it("Given a factory and transient scope Then each get calls it", () => {
    let calls = 0;
    const token = new Token<number>("f");
    const container = new Container();
    container.set(token, () => ++calls, "transient");
    expect(container.get(token)).toBe(1);
    expect(container.get(token)).toBe(2);
  });

  it("Given singleton scope Then repeated get returns the same instance", () => {
    let calls = 0;
    const token = new Token<number>("s");
    const container = new Container();
    container.set(token, () => ++calls);
    expect(container.get(token)).toBe(1);
    expect(container.get(token)).toBe(1);
    expect(calls).toBe(1);
  });

  it("Given request scope inside runWithRequest Then one instance per request map", () => {
    const token = new Token<number>("r");
    let calls = 0;
    const container = new Container();
    container.set(token, () => ++calls, "request");
    let a = 0;
    let b = 0;
    runWithRequest(() => {
      a = container.get(token);
      b = container.get(token);
    });
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(calls).toBe(1);
  });

  it("Given an unregistered token Then get throws FrameworkError", () => {
    const container = new Container();
    let error: unknown;
    try {
      container.get(new Token<string>("missing"));
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(FrameworkError);
  });
});
