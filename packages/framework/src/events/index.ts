/**
 * Events: pub/sub em processo, tipado, wildcards, isolamento de erro.
 */

/** Listener de evento: `payload` opcional. */
export type EventListener<T = unknown> = (payload: T) => void | Promise<void>;

/** Bus de events em processo. */
export interface EventBus {
  /** Registra `listener` para `pattern` — `*` casa qualquer evento; `user.*` casa `user.x`. */
  on(pattern: string, listener: EventListener): void;
  /** Remove listeners do `pattern` (ou um listener específico). */
  off(pattern: string, listener?: EventListener): void;
  /** Emite um evento — listeners são isolados; erros não propagam. */
  emit(name: string, payload?: unknown): Promise<void>;
}

/** Bus tipado: associa listeners a tipos de payload por evento (`EventsMap`). */
export interface TypedEventBus<EventsMap extends Record<string, unknown>> extends EventBus {
  on<Key extends keyof EventsMap>(pattern: string, listener: EventListener<EventsMap[Key]>): void;
  emit<Key extends keyof EventsMap>(name: string, payload?: EventsMap[Key]): Promise<void>;
}

function matches(pattern: string, name: string): boolean {
  if (pattern === "*") return true;
  const patternSegments = pattern.split(".").filter((segment) => segment !== "");
  const nameSegments = name.split(".").filter((segment) => segment !== "");
  if (patternSegments.length !== nameSegments.length) return false;
  return patternSegments.every((segment, index) => segment === "*" || segment === nameSegments[index]);
}

/** Cria um bus de events em processo. */
export function createBus(): EventBus {
  const listeners = new Map<string, Set<EventListener>>();
  return {
    on(pattern, listener) {
      const set = listeners.get(pattern) ?? new Set<EventListener>();
      set.add(listener);
      listeners.set(pattern, set);
    },

    off(pattern, listener) {
      const set = listeners.get(pattern);
      if (set === undefined) return;
      if (listener === undefined) set.clear();
      else set.delete(listener);
      if (set.size === 0) listeners.delete(pattern);
    },

    async emit(name, payload) {
      const invocations: Array<Promise<void>> = [];
      for (const [pattern, set] of listeners) {
        if (!matches(pattern, name)) continue;
        for (const listener of set) {
          invocations.push(
            Promise.resolve()
              .then(() => listener(payload))
              .catch((error: unknown) => {
                console.error("tideframe: event listener falhou", error);
              }),
          );
        }
      }
      await Promise.all(invocations);
    },
  };
}

/** Cria um bus tipado — `bus.on("user.created", (payload) => ...)` com `payload: EventsMap[Key]`. */
export function createTypedBus<EventsMap extends Record<string, unknown>>(): TypedEventBus<EventsMap> {
  return createBus() as TypedEventBus<EventsMap>;
}
