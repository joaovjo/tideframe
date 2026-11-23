/**
 * Validação via a especificação Standard Schema v1 (https://standardschema.dev/)
 * — sem dependências externas (zod segue feliz em casa).
 *
 * Os builders (`string()`, `object()`, ...) criam `Schema`s que expõem
 * `~standard.validate`. `parse`/`safeParse`/`is` fazem parse tipado; falhas
 * lançam `ValidationError` (um `HttpError` 422).
 */

import { err, isOk, ok, pathToString } from "#core";
import type { Issue, PathPart, Result, StandardResult, StandardSchemaV1 } from "#core";
import { ValidationError } from "#errors";
import type { ValidationIssue } from "#errors";

export type {
  FailureResult,
  Issue,
  PathPart,
  PathSegment,
  Props,
  StandardResult,
  StandardSchemaV1,
  SuccessResult,
  Types,
} from "#core";

/** Vendor dos schemas criados pelo framework. */
export const VENDOR = "tideframe";

/** Tipo de um schema validável: `StandardSchemaV1` + `parse` interno. */
export interface Schema<Output = unknown> extends StandardSchemaV1<unknown, Output> {
  /** Validação interna (contratualmente com `~standard.validate`). */
  readonly parse: (value: unknown) => Result<Output, Issue[]>;
}

/** Tipo de saída de um `Schema` (condicional, sem restrição). */
export type InferOutput<S> = S extends StandardSchemaV1<unknown, infer Output> ? Output : never;

/** Tipo do resultado de `object` — campos com saída que inclui `undefined` (`optional`) são opcionais. */
export type InferObject<Fields extends Record<string, Schema<unknown>>> = {
  [Key in keyof Fields as undefined extends InferOutput<Fields[Key]> ? never : Key]: InferOutput<Fields[Key]>;
} & {
  [Key in keyof Fields as undefined extends InferOutput<Fields[Key]> ? Key : never]?: InferOutput<Fields[Key]>;
};

// --- interno ----------------------------------------------------------------

function toStandardResult<Output>(result: Result<Output, Issue[]>): StandardResult<Output> {
  return isOk(result) ? { value: result.value } : { issues: result.error };
}

function make<Output>(parse: (value: unknown) => Result<Output, Issue[]>): Schema<Output> {
  return {
    "~standard": {
      version: 1,
      vendor: VENDOR,
      types: undefined,
      validate: (value) => toStandardResult(parse(value)),
    },
    parse,
  };
}

function issue(message: string, path: readonly PathPart[] = []): Issue {
  return { message, path };
}

function describeType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function toValidationIssues(issues: readonly Issue[]): readonly ValidationIssue[] {
  return issues.map((entry) => ({ path: pathToString(entry.path ?? []), message: entry.message }));
}

// --- builders ---------------------------------------------------------------

export function string(options?: {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly startsWith?: string;
  readonly endsWith?: string;
}): Schema<string> {
  return make((value) => {
    if (typeof value !== "string") {
      return err([issue(`Expected a string, received ${describeType(value)}`)]);
    }
    const startsWith = options?.startsWith;
    if (startsWith !== undefined && !value.startsWith(startsWith)) {
      return err([issue(`Expected a string starting with "${startsWith}"`)]);
    }
    const endsWith = options?.endsWith;
    if (endsWith !== undefined && !value.endsWith(endsWith)) {
      return err([issue(`Expected a string ending with "${endsWith}"`)]);
    }
    const minLength = options?.minLength;
    if (minLength !== undefined && value.length < minLength) {
      return err([issue(`Expected a string of at least ${minLength} characters`)]);
    }
    const maxLength = options?.maxLength;
    if (maxLength !== undefined && value.length > maxLength) {
      return err([issue(`Expected a string of at most ${maxLength} characters`)]);
    }
    const pattern = options?.pattern;
    if (pattern !== undefined && !pattern.test(value)) {
      return err([issue(`Expected a string matching /${pattern.source}/`)]);
    }
    return ok(value);
  });
}

export function number(options?: {
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly finite?: boolean;
}): Schema<number> {
  return make((value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return err([issue(`Expected a number, received ${describeType(value)}`)]);
    }
    if (options?.finite === true && !Number.isFinite(value)) {
      return err([issue("Expected a finite number")]);
    }
    const min = options?.min;
    if (min !== undefined && value < min) {
      return err([issue(`Expected a number >= ${min}`)]);
    }
    const max = options?.max;
    if (max !== undefined && value > max) {
      return err([issue(`Expected a number <= ${max}`)]);
    }
    if (options?.integer === true && !Number.isInteger(value)) {
      return err([issue("Expected an integer")]);
    }
    return ok(value);
  });
}

export function boolean(): Schema<boolean> {
  return make((value) =>
    typeof value === "boolean" ? ok(value) : err([issue(`Expected a boolean, received ${describeType(value)}`)]));
}

export function literal<T extends string | number | boolean>(value: T): Schema<T> {
  return make((input) => {
    if (typeof input !== "boolean" && typeof input !== "number" && typeof input !== "string") {
      return err([issue(`Expected ${JSON.stringify(value)}, received ${describeType(input)}`)]);
    }
    if (input === value) {
      return ok(value);
    }
    return err([issue(`Expected ${JSON.stringify(value)}, received ${JSON.stringify(input)}`)]);
  });
}

export function nullable<T>(schema: Schema<T>): Schema<T | null> {
  return make((value) => {
    if (value === null) return ok(null);
    return schema.parse(value);
  });
}

export function optional<T>(schema: Schema<T>): Schema<T | undefined> {
  return make((value) => {
    if (value === undefined) return ok(undefined);
    return schema.parse(value);
  });
}

export function array<T>(item: Schema<T>): Schema<T[]> {
  return make((value) => {
    if (!Array.isArray(value)) {
      return err([issue(`Expected an array, received ${describeType(value)}`)]);
    }
    const output: T[] = [];
    const issues: Issue[] = [];
    for (let i = 0; i < value.length; i++) {
      const element: unknown = value[i];
      const result = item.parse(element);
      if (isOk(result)) {
        output.push(result.value);
      } else {
        issues.push(...result.error.map((entry) => ({ message: entry.message, path: [i, ...(entry.path ?? [])] })));
      }
    }
    if (issues.length > 0) return err(issues);
    return ok(output);
  });
}

export function object<Fields extends Record<string, Schema<unknown>>>(
  fields: Fields,
  options?: { readonly onExcess?: "strip" | "error" },
): Schema<InferObject<Fields>> {
  return make((value) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return err([issue(`Expected an object, received ${describeType(value)}`)]);
    }
    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    const issues: Issue[] = [];
    for (const [key, field] of Object.entries(fields)) {
      const present = Object.hasOwn(record, key);
      const result = field.parse(present ? record[key] : undefined);
      if (isOk(result)) {
        output[key] = result.value;
      } else {
        issues.push(...result.error.map((entry) => ({ message: entry.message, path: [key, ...(entry.path ?? [])] })));
      }
    }
    if (options?.onExcess === "error") {
      for (const key of Object.keys(record)) {
        if (!(key in fields)) {
          issues.push(issue(`Unknown field "${key}"`));
        }
      }
    }
    if (issues.length > 0) return err(issues);
    return ok(output as InferObject<Fields>);
  });
}

export function union<T extends readonly Schema<unknown>[]>(...members: T): Schema<InferOutput<T[number]>> {
  return make((value) => {
    const issues: Issue[] = [];
    for (const member of members) {
      const result = member.parse(value);
      if (isOk(result)) return ok(result.value as InferOutput<T[number]>);
      issues.push(...result.error);
    }
    return err(issues);
  });
}

export function transform<Input, Output>(schema: Schema<Input>, fn: (value: Input) => Output): Schema<Output> {
  return make((value) => {
    const result = schema.parse(value);
    if (!isOk(result)) return result;
    let transformed: Output;
    try {
      transformed = fn(result.value);
    } catch (error) {
      return err([issue(error instanceof Error ? error.message : String(error))]);
    }
    return ok(transformed);
  });
}

export function check<Output>(
  schema: Schema<Output>,
  predicate: (value: Output) => boolean | string,
  message = "Value failed the custom check",
): Schema<Output> {
  return make((value) => {
    const result = schema.parse(value);
    if (!isOk(result)) return result;
    const passed = predicate(result.value);
    if (passed === true) return ok(result.value);
    if (passed === false) return err([issue(message)]);
    return err([issue(passed)]);
  });
}

export function custom<T>(predicate: (value: unknown) => boolean, message = "Invalid value"): Schema<T> {
  return make((value) => {
    if (!predicate(value)) return err([issue(message)]);
    return ok(value as T);
  });
}

// --- parse ------------------------------------------------------------------

export function parse<Output>(schema: Schema<Output>, value: unknown): Output {
  const result = schema.parse(value);
  if (isOk(result)) return result.value;
  throw new ValidationError(toValidationIssues(result.error));
}

export function safeParse<Output>(schema: Schema<Output>, value: unknown): Result<Output, Issue[]> {
  return schema.parse(value);
}

export function is<Output>(schema: Schema<Output>, value: unknown): value is Output {
  return schema.parse(value).ok;
}

export function issuesToLines(issues: readonly Issue[]): string[] {
  return issues.map((entry) => {
    const path = pathToString(entry.path ?? []);
    return path === "" ? entry.message : `${path}: ${entry.message}`;
  });
}
