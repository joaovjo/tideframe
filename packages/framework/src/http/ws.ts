/**
 * WebSockets: tipos de handlers e handshake via `server.upgrade`.
 */

import type { ServerWebSocket } from "bun";
import { matchPath } from "./router";
import type { Ctx } from "./ctx";

/** Dados que carregamos no WebSocket via `server.upgrade` (`App` interno). */
export interface WsData {
  readonly route: WsRoute;
}

/** Handlers de um WebSocket (padrão `app.ws`). */
export interface WsHandlers {
  /** Chamado quando a conexão abre. */
  open?: (ws: ServerWebSocket<WsData>) => void;
  /** Chamado por mensagem: `data` é string/ArrayBuffer (também `Uint8Array`). */
  message?: (ws: ServerWebSocket<WsData>, data: string | ArrayBuffer | Uint8Array) => void;
  /** Chamado ao fechar: `code`/`reason` do close. */
  close?: (ws: ServerWebSocket<WsData>, code: number, reason: string) => void;
  /** Chamado quando o socket está drenado. */
  drain?: (ws: ServerWebSocket<WsData>) => void;
  /** Chamado por erro de transporte. */
  error?: (ws: ServerWebSocket<WsData>, error: Error) => void;
  /** Hook de autorização: retorna `false` para negar o upgrade. */
  auth?: (ctx: Ctx) => boolean | Promise<boolean>;
}

/** Handlers do `websocket` do `Bun.serve` — retornados por `buildWebsocketHandlers`. */
export interface ServeWebSocketOptions {
  open(ws: ServerWebSocket<WsData>): void;
  message(ws: ServerWebSocket<WsData>, data: string | ArrayBuffer | Uint8Array): void;
  close(ws: ServerWebSocket<WsData>, code: number, reason: string): void;
  drain(ws: ServerWebSocket<WsData>): void;
  error(error: Error, ws: ServerWebSocket<WsData>): void;
}

/** Rota de WebSocket registrada em `app.ws`. */
export interface WsRoute {
  readonly pattern: string;
  readonly handlers: WsHandlers;
}

/** Handlers do `websocket` do `Bun.serve` — retornados por `buildWebsocketHandlers`. */
export interface ServeWebSocketOptions {
  open(ws: ServerWebSocket<WsData>): void;
  message(ws: ServerWebSocket<WsData>, data: string | ArrayBuffer | Uint8Array): void;
  close(ws: ServerWebSocket<WsData>, code: number, reason: string): void;
  drain(ws: ServerWebSocket<WsData>): void;
  error(error: Error, ws: ServerWebSocket<WsData>): void;
}

/** Cria os handlers do `websocket` do `Bun.serve` a partir das rotas WS. */
export function buildWebsocketHandlers(routes: readonly WsRoute[]): ServeWebSocketOptions {
  return {
    open: (ws) => {
      ws.data.route.handlers.open?.(ws);
    },
    message: (ws, data) => {
      ws.data.route.handlers.message?.(ws, data);
    },
    close: (ws, code, reason) => {
      ws.data.route.handlers.close?.(ws, code, reason);
    },
    drain: (ws) => {
      ws.data.route.handlers.drain?.(ws);
    },
    error: (error, ws) => {
      ws.data.route.handlers.error?.(ws, error);
    },
  };
}

/** Resolve a rota WS para um `pathname`. */
export function matchWsPath(routes: readonly WsRoute[], pathname: string): WsRoute | undefined {
  for (const route of routes) {
    if (matchPath(route.pattern, pathname) !== undefined) return route;
  }
  return undefined;
}
