/**
 * DI: tokens, container, escopos (singleton/transient/request) e injeção por
 * construtor via `static inject` (sem decorators).
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { FrameworkError } from "#errors";

/** Identificador de tipo-seguro para uma dependência. */
export class Token<T> {
  readonly id: string;

  constructor(id: string) {
    this.id = id;
  }
}

/** Escopo de uma dependência. */
export type Scope = "singleton" | "transient" | "request";

/** Provedor de uma dependência: valor, factory ou classe com `static inject`. */
export type Provider<T> = T | (() => T) | (new (...dependencies: never[]) => T);

/** Container de dependências. */
export class Container {
  private readonly entries = new Map<string, Entry>();
  private readonly singletons = new Map<string, unknown>();

  /** Registra/rebinds um provedor (`scope` default: `singleton`). */
  set<T>(token: Token<T>, provider: Provider<T>, scope: Scope = "singleton"): this {
    this.entries.set(token.id, { provider: provider as Provider<unknown>, scope });
    this.singletons.delete(token.id);
    return this;
  }

  /** Registrado? */
  has(token: Token<unknown>): boolean {
    return this.entries.has(token.id);
  }

  /** Resolve uma dependência. */
  get<T>(token: Token<T>): T {
    const entry = this.entries.get(token.id);
    if (entry === undefined) {
      throw new FrameworkError(`No provider registered for token "${token.id}"`);
    }
    if (entry.scope === "transient") {
      return this.create(entry.provider) as T;
    }
    if (entry.scope === "request") {
      const store = requestStore.getStore();
      if (store !== undefined) {
        const hit = store.get(token.id);
        if (hit !== undefined) return hit as T;
        const value = this.create(entry.provider) as T;
        store.set(token.id, value);
        return value;
      }
      const cached = this.singletons.get(token.id);
      if (cached !== undefined) return cached as T;
      const value = this.create(entry.provider) as T;
      this.singletons.set(token.id, value);
      return value;
    }
    const cached = this.singletons.get(token.id);
    if (cached !== undefined) return cached as T;
    const value = this.create(entry.provider) as T;
    this.singletons.set(token.id, value);
    return value;
  }

  private create(provider: Provider<unknown>): unknown {
    const shape = provider as { inject?: readonly Token<unknown>[]; prototype?: unknown };
    if (Array.isArray(shape.inject)) {
      const ctor = provider as new (...dependencies: unknown[]) => unknown;
      return new ctor(...shape.inject.map((token) => this.get(token)));
    }
    if (typeof provider === "function" && shape.prototype !== undefined) {
      const ctor = provider as new () => unknown;
      return new ctor();
    }
    if (typeof provider === "function") {
      return (provider as () => unknown)();
    }
    return provider;
  }
}

interface Entry {
  readonly provider: Provider<unknown>;
  readonly scope: Scope;
}

const requestStore = new AsyncLocalStorage<Map<string, unknown>>();

/** Roda `fn` com um mapa de request scope (`runWithRequest`). */
export function runWithRequest<T>(fn: () => T): T {
  return requestStore.run(new Map<string, unknown>(), fn);
}

/** Mapa de request scope atual, se houver. */
export function currentRequestMap(): ReadonlyMap<string, unknown> | undefined {
  return requestStore.getStore();
}

/** Cria um container vazio. */
export function createContainer(): Container {
  return new Container();
}
