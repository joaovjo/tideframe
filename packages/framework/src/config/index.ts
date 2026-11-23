/**
 * Configuração tipada: valores de `env` + `.env`, validados via Standard
 * Schema, com `secrets` obrigatórios e suporte a ambientes (`environments`).
 */

import type { Issue, StandardResult, StandardSchemaV1 } from "#core";
import { pathToString } from "#core";
import { FrameworkError, ValidationError, type ValidationIssue } from "#errors";

/** Tipos de ambiente. */
export type Environment = string;

/** Variáveis específicas de um ambiente, keyed por nome do ambiente. */
export type Environments = Readonly<Record<Environment, Readonly<Record<string, string | undefined>>>>;

/** Opções de `loadConfig`. */
export interface LoadConfigOptions {
  /** Ambiente (padrão: `resolveEnvironment(env)`). */
  readonly environment?: Environment;
  /** Variáveis específicas do ambiente, mescladas após `env`. */
  readonly environments?: Environments;
  /** Arquivo `.env` (padrão: `.env`). */
  readonly envFile?: string;
  /** Variáveis explícitas (padrão: `Bun.env`). */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /** Nomes de secrets obrigatórios — devem existir e não estar vazios. */
  readonly secrets?: readonly string[];
}

/** Resolve o ambiente a partir de `APP_ENV`, `NODE_ENV`, `ENVIRONMENT` ou `development`. */
export function resolveEnvironment(env: Readonly<Record<string, string | undefined>> = Bun.env): Environment {
  for (const key of ["APP_ENV", "NODE_ENV", "ENVIRONMENT"] as const) {
    const value = env[key];
    if (value !== undefined && value !== "") return value;
  }
  return "development";
}

/** Parser de arquivos `.env` (linhas `KEY=value`, comentários e aspas). */
export function parseDotEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) {
      throw new FrameworkError(`Malformed .env line (missing "="): ${line}`);
    }
    const key = line.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new FrameworkError(`Invalid .env key: ${key}`);
    }
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2) {
      const first = value.charAt(0);
      const last = value.charAt(value.length - 1);
      if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        value = value.slice(1, -1);
      }
    }
    out[key] = value;
  }
  return out;
}

async function readDotEnv(file: string): Promise<Record<string, string>> {
  const file1 = Bun.file(file);
  if (!(await file1.exists())) return {};
  return parseDotEnv(await file1.text());
}

function toValidationIssues(issues: readonly Issue[]): readonly ValidationIssue[] {
  return issues.map((issue) => ({ path: pathToString(issue.path ?? []), message: issue.message }));
}

/**
 * Carrega e valida a configuração: `env` + `.env` + `environments[environment]`.
 * Lance `ValidationError` (422) se o schema falhar, ou `FrameworkError` se um
 * secret obrigatório estiver ausente ou vazio.
 */
export async function loadConfig<Output>(
  schema: StandardSchemaV1<unknown, Output>,
  options: LoadConfigOptions = {},
): Promise<Output> {
  const env = options.env ?? Bun.env;
  const environment = options.environment ?? resolveEnvironment(env);
  const dotEnv = await readDotEnv(options.envFile ?? ".env");
  const envSpecific = options.environments?.[environment] ?? {};
  const merged: Record<string, string | undefined> = { ...dotEnv, ...envSpecific, ...env };
  const result: StandardResult<Output> | Promise<StandardResult<Output>> = schema["~standard"].validate(merged);
  const validated = await result;
  if ("issues" in validated) {
    throw new ValidationError(toValidationIssues(validated.issues));
  }
  const missing = (options.secrets ?? []).filter((name) => {
    const value = merged[name];
    return value === undefined || value.trim() === "";
  });
  if (missing.length > 0) {
    throw new FrameworkError(`Missing required configuration secrets: ${missing.join(", ")}`);
  }
  return validated.value;
}
