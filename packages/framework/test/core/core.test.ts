import { describe, expect, it } from "bun:test";
import { err, isErr, isOk, newId, ok } from "#core";
import {
  BadRequestError,
  FrameworkError,
  InternalServerError,
  isHttpError,
  NotFoundError,
  toProblemJson,
  ValidationError,
} from "#errors";

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
    expect(isOk(good)).toBe(true);
    expect(isErr(bad)).toBe(true);
    if (isOk(good)) expect(good.value).toBe(42);
    if (isErr(bad)) expect(bad.error).toBe("falhou");
  });
});

describe("errors", () => {
  it("Given a NotFoundError Then it is an HttpError with status 404 and its name", () => {
    const error = new NotFoundError();
    expect(isHttpError(error)).toBe(true);
    expect(error.status).toBe(404);
    expect(error.name).toBe("NotFoundError");
  });

  it("Given a BadRequestError Then it maps to status 400", () => {
    const error = new BadRequestError("O nome é obrigatório");
    expect(error.status).toBe(400);
    expect(error.message).toBe("O nome é obrigatório");
  });

  it("Given a ValidationError Then it carries issues and maps to 422", () => {
    const error = new ValidationError([
      { path: "email", message: "Expected an email" },
      { path: "users.0", message: "Expected a string" },
    ]);
    expect(error.status).toBe(422);
    expect(error.issues).toEqual([
      { path: "email", message: "Expected an email" },
      { path: "users.0", message: "Expected a string" },
    ]);
  });

  it("Given toProblemJson on an HttpError Then it returns a RFC 9457 problem+json", () => {
    const error = new BadRequestError("Escreva um nome");
    const problem = toProblemJson(error, { url: "http://localhost:3000/users" });
    expect(problem.title).toBe("Escreva um nome");
    expect(problem.status).toBe(400);
    expect(problem.type).toBe("https://tideframe.dev/errors/BadRequestError");
    expect(problem.instance).toBe("http://localhost:3000/users");
  });

  it("Given a ValidationError in toProblemJson Then issues are exposed", () => {
    const error = new ValidationError([{ path: "name", message: "Expected a string" }]);
    const problem = toProblemJson(error);
    expect(problem.status).toBe(422);
    expect(problem.errors).toEqual([{ path: "name", message: "Expected a string" }]);
  });

  it("Given a plain FrameworkError in toProblemJson Then status is 500", () => {
    const problem = toProblemJson(new FrameworkError("boom"));
    expect(problem.status).toBe(500);
  });

  it("Given an InternalServerError Then it is an HttpError with status 500", () => {
    const error = new InternalServerError();
    expect(isHttpError(error)).toBe(true);
    expect(error.status).toBe(500);
  });
});
