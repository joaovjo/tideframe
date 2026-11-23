/**
 * CORS: preflight (`OPTIONS`) + headers de resposta.
 */

import type { Middleware } from "./ctx";

/** Opções de CORS. */
export interface CorsOptions {
  /** Origem permitida: string, array de strings ou `true` (ecoar a origem da requisição). */
  readonly origin?: string | readonly string[] | true;
  /** Permitir cookies. */
  readonly credentials?: boolean;
  /** Métodos permitidos. */
  readonly methods?: readonly string[];
  /** Cabeçalhos permitidos. */
  readonly headers?: readonly string[];
}

/** Cria o middleware de CORS. */
export function createCorsMiddleware(options: CorsOptions = {}): Middleware {
  const origin = options.origin ?? "*";
  const credentials = options.credentials ?? false;
  const methods = options.methods ?? ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"];
  const headers = options.headers;
  return async (ctx, next) => {
    let originHeader: string;
    if (origin === true) {
      originHeader = ctx.req.headers.get("origin") ?? "*";
    } else if (typeof origin === "string") {
      originHeader = origin;
    } else {
      const requestOrigin = ctx.req.headers.get("origin");
      originHeader = requestOrigin !== null && origin.includes(requestOrigin) ? requestOrigin : origin[0] ?? "*";
    }
    ctx.headers.set("Access-Control-Allow-Origin", originHeader);
    if (credentials) {
      ctx.headers.set("Access-Control-Allow-Credentials", "true");
    }
    if (ctx.method === "OPTIONS") {
      ctx.headers.set("Access-Control-Allow-Methods", methods.join(", "));
      const requested = ctx.req.headers.get("Access-Control-Request-Headers");
      const allowHeaders = requested ?? headers?.join(", ") ?? "";
      if (allowHeaders.trim() !== "") {
        ctx.headers.set("Access-Control-Allow-Headers", allowHeaders);
      }
      return ctx.raw(null, { status: 204 });
    }
    return await next();
  };
}
