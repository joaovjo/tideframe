/**
 * `Ctx` — contexto de request passado aos handlers: `req`, `method`,
 * `pathname`, `params`, `query`, `headers` e builders de resposta
 * (`json`/`text`/`html`/`redirect`/`file`/`stream`/`sse`/`error`).
 */

import { InternalServerError, isHttpError, toProblemJson } from "#errors";
import type { SseSend } from "./sse";
import { sseResponse } from "./sse";

/** Handler de rota: retorna `Response` (ou `void`/`undefined` → 200 vazio). */
export type Handler = (ctx: Ctx) => Response | Promise<Response> | void | Promise<void>;

/** Middleware: executa algo, chama `next()` e retorna a resposta. */
export type Middleware = (ctx: Ctx, next: () => Promise<Response>) => Response | Promise<Response>;

/** Contexto de request. */
export interface Ctx {
  /** Request original. */
  readonly req: Request;
  /** Método normalizado (UPPERCASE). */
  readonly method: string;
  /** Pathname decodificado. */
  readonly pathname: string;
  /** Params de rota (`/users/:id` → `{ id: "42" }`). */
  readonly params: Record<string, string>;
  /** Query string. */
  readonly query: URLSearchParams;
  /** Headers da resposta (aplicados ao final do ciclo de request). */
  readonly headers: Headers;
  /** Valores compartilhados com middleware/handlers. */
  readonly locals: Record<string, unknown>;

  /** Corpo JSON. */
  json(value: unknown, init?: ResponseInit): Response;
  /** Corpo de texto (`text/plain`). */
  text(value: string, init?: ResponseInit): Response;
  /** Corpo HTML. */
  html(value: string, init?: ResponseInit): Response;
  /** Corpo bruto (`BunFile`, `Stream`, `null`...). */
  raw(body: BodyInit | null, init?: ResponseInit): Response;
  /** Redirecionamento (padrão 302). */
  redirect(url: string | URL, status?: 302 | 303 | 307 | 308): Response;
  /** Stream de resposta. */
  stream(stream: ReadableStream, init?: ResponseInit): Response;
  /** Arquivo local. */
  file(path: string, init?: ResponseInit): Response;
  /** Eventos SSE. */
  sse(handler: (send: SseSend, ctx: Ctx) => void | Promise<void>, init?: ResponseInit): Response;
  /** Resposta problem+json de erro (status do `HttpError` ou 500). */
  error(error: unknown): Response;
  /** Define header de resposta. */
  setHeader(name: string, value: string): void;
}

function mergeHeaders(base: Headers, init?: ResponseInit): Headers {
  const headers = new Headers(base);
  if (init !== undefined && init.headers !== undefined) {
    for (const [key, value] of new Headers(init.headers)) {
      headers.set(key, value);
    }
  }
  return headers;
}

function respond(ctx: Ctx, body: BodyInit | null, init?: ResponseInit): Response {
  if (init === undefined) return new Response(body, { headers: ctx.headers });
  const headers = mergeHeaders(ctx.headers, init);
  return new Response(body, init === undefined ? { headers } : { ...init, headers });
}

/** Cria um `Ctx` para uma request HTTP. */
export function createCtx(req: Request, params: Record<string, string>, url?: URL): Ctx {
  const requestUrl = url ?? new URL(req.url);
  const headers = new Headers();
  const locals: Record<string, unknown> = {};
  const ctx: Ctx = {
    req,
    method: req.method.toUpperCase(),
    pathname: requestUrl.pathname,
    params,
    query: requestUrl.searchParams,
    headers,
    locals,

    json(value, init) {
      headers.set("Content-Type", "application/json; charset=utf-8");
      return respond(ctx, JSON.stringify(value), init);
    },

    text(value, init) {
      headers.set("Content-Type", "text/plain; charset=utf-8");
      return respond(ctx, value, init);
    },

    html(value, init) {
      headers.set("Content-Type", "text/html; charset=utf-8");
      return respond(ctx, value, init);
    },

    raw(body, init) {
      return respond(ctx, body, init);
    },

    redirect(url, status = 302) {
      headers.set("Location", String(url));
      return respond(ctx, null, { status });
    },

    stream(stream, init) {
      return respond(ctx, stream, init);
    },

    file(path, init) {
      return respond(ctx, Bun.file(path), init);
    },

    sse(handler, init) {
      return sseResponse(ctx, handler, init);
    },

    error(error) {
      const httpError = isHttpError(error) ? error : undefined;
      const response = ctx.json(
        toProblemJson(httpError ?? new InternalServerError(), { url: req.url }),
        { status: httpError ? httpError.status : 500 },
      );
      response.headers.set("Content-Type", "application/problem+json; charset=utf-8");
      return response;
    },

    setHeader(name, value) {
      headers.set(name, value);
    },
  };
  return ctx;
}
