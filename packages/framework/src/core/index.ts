/**
 * Módulo base do framework: identidade (`newId`), tipo `Result` e as tipos
 * da especificação Standard Schema v1 (https://standardschema.dev/).
 *
 * Nenhum módulo depende de outro — todos importam a partir de `#core`.
 */

// --- Result -----------------------------------------------------------------

/** Resultado polimórfico: `Ok<T>` carrega o valor, `Err<E>` carrega o erro. */
export type Result<T, E> = Ok<T> | Err<E>;

/** Variação de `Result` de sucesso. */
export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

/** Variação de `Result` de falha. */
export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

/** Monta um resultado de sucesso. */
export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

/** Monta um resultado de falha. */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Refinamento de `Result` para o ramo de sucesso. */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/** Refinamento de `Result` para o ramo de erro. */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

/** Gera um identificador único (`crypto.randomUUID()`). */
export function newId(): string {
  return crypto.randomUUID();
}

// --- Standard Schema v1 -----------------------------------------------------

/** Segmento de caminho de campo dentro de `Issue.path`. */
export interface PathSegment {
  readonly key: PropertyKey;
}

/** Segmento do caminho de uma Issue: string, número ou `PathSegment`. */
export type PathPart = PropertyKey | PathSegment;

/** Issue de validação: mensagem e caminho do campo. */
export interface Issue {
  readonly message: string;
  readonly path?: readonly PathPart[] | undefined;
}

/** Resultado de validação de sucesso. */
export interface SuccessResult<Output> {
  readonly value: Output;
}

/** Resultado de validação de falha. */
export interface FailureResult {
  readonly issues: readonly Issue[];
}

/** Resultado que `Props.validate` retorna. */
export type StandardResult<Output> = SuccessResult<Output> | FailureResult;

/** Tipo phantom dos tipos de input/output de um schema. */
export interface Types<Input = unknown, Output = Input> {
  readonly input: Input;
  readonly output: Output;
}

/** Propriedades padrão de todo schema. */
export interface Props<Input = unknown, Output = Input> {
  readonly version: 1;
  readonly vendor: string;
  readonly validate: (value: unknown) => StandardResult<Output> | Promise<StandardResult<Output>>;
  readonly types?: Types<Input, Output> | undefined;
}

/** Interface comum dos schemas — implementa a especificação Standard Schema v1. */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": Props<Input, Output>;
}

/** Formata um caminho de campo (issue path) como string. */
export function pathToString(path: readonly PathPart[]): string {
  let out = "";
  for (const part of path) {
    if (typeof part === "object") {
      out += (out === "" ? "" : ".") + String(part.key);
    } else if (typeof part === "number") {
      out += `[${String(part)}]`;
    } else {
      out += (out === "" ? "" : ".") + String(part);
    }
  }
  return out;
}
