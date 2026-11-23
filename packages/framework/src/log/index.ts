/**
 * Logger estruturado: níveis, sinks, campos, redação e contexto de request
 * via `AsyncLocalStorage`.
 */

import { AsyncLocalStorage } from "node:async_hooks";

/** Níveis do logger, em ordem de severidade crescente. */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/** Ordem dos níveis. */
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

/** Número numérico de um nível (interno). */
export function levelNumber(level: LogLevel): number {
  return LOG_LEVELS[level];
}

/** Contexto de request/trace propagado por `runWithContext`. */
export type LogContext = Record<string, unknown>;

/** Um registro de log estruturado. */
export interface LogRecord {
  readonly level: LogLevel;
  readonly time: string;
  readonly message: string;
  readonly fields: Record<string, unknown>;
  readonly context: Record<string, unknown>;
}

const contextStorage = new AsyncLocalStorage<LogContext>();

/** Roda `fn` com `context` como contexto de log atual. */
export function runWithContext<T>(context: LogContext, fn: () => T): T {
  return contextStorage.run(context, fn);
}

/** Contexto de log atual, se houver. */
export function currentContext(): LogContext | undefined {
  return contextStorage.getStore();
}

// --- redação ----------------------------------------------------------------

/** Chaves redriadas por padrão (sensíveis). */
export const DEFAULT_REDACT_KEYS: readonly string[] = [
  "password",
  "passwd",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "apikey",
  "authorization",
  "cookie",
  "set-cookie",
  "privatekey",
];

function isSensitiveKey(key: string, keys: readonly string[]): boolean {
  const lower = key.toLowerCase();
  return keys.some((sensitive) => sensitive.toLowerCase() === lower);
}

function redactInner(value: unknown, keys: readonly string[], seen: Set<object>, depth: number): unknown {
  if (typeof value !== "object" || value === null) {
    return value;
  }
  if (depth > 8 || seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redactInner(item, keys, seen, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isSensitiveKey(key, keys) ? "[REDACTED]" : redactInner(item, keys, seen, depth + 1);
  }
  return out;
}

/** Reduz valores sob chaves sensíveis para `"[REDACTED]"` (profundamente). */
export function redactValue<T>(value: T, keys: readonly string[] = DEFAULT_REDACT_KEYS): T {
  return redactInner(value, keys, new Set(), 0) as T;
}

// --- sinks ------------------------------------------------------------------

/** Sink de log — recebe um registro estruturado. */
export type LogSink = (record: LogRecord) => void | Promise<void>;

/** Sink console: uma linha JSON por registro, no stream adequado. */
export function createConsoleSink(): LogSink {
  return (record) => {
    const json = JSON.stringify(record);
    if (record.level === "error" || record.level === "fatal") console.error(json);
    else if (record.level === "warn") console.warn(json);
    else console.log(json);
  };
}

/** Sink em memória — útil em testes. */
export interface MemorySink {
  readonly sink: LogSink;
  readonly records: readonly LogRecord[];
}

/** Cria um sink em memória que coleta registros sem imprimir. */
export function createMemorySink(): MemorySink {
  const records: LogRecord[] = [];
  return { records, sink: (record) => { records.push(record); } };
}

// --- logger -----------------------------------------------------------------

/** Opções de `createLogger`. */
export interface CreateLoggerOptions {
  readonly level?: LogLevel;
  readonly sinks?: readonly LogSink[];
  readonly fields?: Record<string, unknown>;
  readonly redactKeys?: readonly string[];
}

/** Logger estruturado. */
export class Logger {
  private minLevel: LogLevel;
  private readonly sinks: readonly LogSink[];
  private readonly fields: Record<string, unknown>;
  private readonly redactKeys: readonly string[];

  constructor(options: CreateLoggerOptions = {}) {
    this.minLevel = options.level ?? "info";
    this.sinks = options.sinks ?? [createConsoleSink()];
    this.fields = options.fields ?? {};
    this.redactKeys = options.redactKeys ?? DEFAULT_REDACT_KEYS;
  }

  /** Define o nível mínimo de logging. */
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /** Registra um registro com nível mínimo ativado. */
  log(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    if (levelNumber(level) < levelNumber(this.minLevel)) return;
    const record: LogRecord = {
      level,
      time: new Date().toISOString(),
      message,
      fields: redactValue({ ...this.fields, ...(fields ?? {}) }, this.redactKeys) as Record<string, unknown>,
      context: redactValue(currentContext() ?? {}, this.redactKeys) as Record<string, unknown>,
    };
    for (const sink of this.sinks) {
      try {
        const result = sink(record);
        if (result instanceof Promise) {
          result.catch((error: unknown) => {
            console.error("tideframe: log sink falhou", error);
          });
        }
      } catch (error) {
        console.error("tideframe: log sink falhou", error);
      }
    }
  }

  debug(message: string, fields?: Record<string, unknown>): void {
    this.log("debug", message, fields);
  }

  info(message: string, fields?: Record<string, unknown>): void {
    this.log("info", message, fields);
  }

  warn(message: string, fields?: Record<string, unknown>): void {
    this.log("warn", message, fields);
  }

  error(message: string, fields?: Record<string, unknown>): void {
    this.log("error", message, fields);
  }

  fatal(message: string, fields?: Record<string, unknown>): void {
    this.log("fatal", message, fields);
  }

  /** Deriva um logger com campos adicionais (fluent). */
  child(fields: Record<string, unknown>): Logger {
    return new Logger({
      level: this.minLevel,
      sinks: this.sinks,
      redactKeys: this.redactKeys,
      fields: { ...this.fields, ...fields },
    });
  }
}

/** Cria um logger estruturado. */
export function createLogger(options: CreateLoggerOptions = {}): Logger {
  return new Logger(options);
}
