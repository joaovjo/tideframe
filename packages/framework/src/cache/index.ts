/**
 * Cache: memória — TTL, tags e stampede (deduplicação de loads concorrentes).
 */

interface Entry {
  readonly value: unknown;
  readonly expiresAt: number;
  readonly tags: readonly string[];
}

/** Opções de `set`: TTL por chave + tags. */
export interface SetOptions {
  readonly ttlMs?: number;
  readonly tags?: readonly string[];
}

/** Cache — agrupa `get`/`set`/`has`/`delete`/`invalidateByTag`/`getOrSet`. */
export interface Cache {
  /** Retorna o valor ou `undefined` (entrada expirada → removida). */
  get<T = unknown>(key: string): T | undefined;
  /** Registra `value` com TTL/tags. */
  set(key: string, value: unknown, options?: SetOptions): void;
  /** Registrado e não expirado? */
  has(key: string): boolean;
  /** Remove uma entrada. */
  delete(key: string): boolean;
  /** Remove todas as entradas com a `tag` — retorna a quantidade removida. */
  invalidateByTag(tag: string): number;
  /** Remove todas as entradas. */
  clear(): void;
  /** `get` ou `loader` (até um em voo) — stampede-safe. */
  getOrSet<T>(key: string, loader: () => T | Promise<T>, options?: SetOptions): Promise<T>;
}

/** Cria um cache em memória. */
export function createCache(options: { readonly defaultTtlMs?: number } = {}): Cache {
  const defaultTtlMs = options.defaultTtlMs ?? 0; // 0 = nunca expira
  const entries = new Map<string, Entry>();
  const inFlight = new Map<string, Promise<unknown>>();

  const isExpired = (entry: Entry): boolean => entry.expiresAt !== 0 && entry.expiresAt <= Date.now();

  const cache: Cache = {
    get<T = unknown>(key: string): T | undefined {
      const entry = entries.get(key);
      if (entry === undefined) return undefined;
      if (isExpired(entry)) {
        entries.delete(key);
        return undefined;
      }
      return entry.value as T;
    },

    set(key, value, options) {
      const ttlMs = options?.ttlMs ?? defaultTtlMs;
      entries.set(key, { value, expiresAt: ttlMs === 0 ? 0 : Date.now() + ttlMs, tags: options?.tags ?? [] });
    },

    has(key) {
      const entry = entries.get(key);
      if (entry === undefined) return false;
      if (isExpired(entry)) {
        entries.delete(key);
        return false;
      }
      return true;
    },

    delete(key) {
      return entries.delete(key);
    },

    invalidateByTag(tag) {
      let removed = 0;
      for (const [key, entry] of entries) {
        if (entry.tags.includes(tag)) {
          entries.delete(key);
          removed++;
        }
      }
      return removed;
    },

    clear() {
      entries.clear();
    },

    async getOrSet<T>(key: string, loader: () => T | Promise<T>, options?: SetOptions): Promise<T> {
      const hit = cache.get<T>(key);
      if (hit !== undefined) return hit;
      const existing = inFlight.get(key);
      if (existing !== undefined) return existing as Promise<T>;
      const promise = Promise.resolve()
        .then(() => loader())
        .then((value) => {
          cache.set(key, value, options);
          return value;
        })
        .finally(() => {
          inFlight.delete(key);
        });
      inFlight.set(key, promise);
      return promise;
    },
  };
  return cache;
}
