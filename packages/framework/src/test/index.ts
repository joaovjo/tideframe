/**
 * Módulo `test`: `createTestApp` (app factory), `inject` e re-export de `bun:test`.
 */

import { createApp, type CreateAppOptions, type App } from "#http";
import { type Container, type Token } from "#di";

/** Injeta uma dependência do container — alias de `container.get(token)`. */
export function inject<T>(container: Container, token: Token<T>): T {
  return container.get(token);
}

/** Cria um `App` para testes (factory). */
export function createTestApp(options: CreateAppOptions = {}): App {
  return createApp(options);
}

export { describe, expect, it, mock, spyOn, test, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";
