/**
 * WebSockets: módulo público — registro via `app.ws` + tipos.
 */

export { buildWebsocketHandlers, matchWsPath } from "#http";
export type { ServeWebSocketOptions, WsData, WsHandlers, WsRoute } from "#http";
