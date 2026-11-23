/**
 * `createApp`: app com router + middleware + WebSockets + arquivos estáticos.
 */

import type { Server } from "bun";
import {
  HttpError,
  InternalServerError,
  isHttpError,
  NotFoundError,
  toProblemJson,
  UnauthorizedError,
} from "#errors";
import { createCorsMiddleware, type CorsOptions } from "./cors";
import { createCtx, type Ctx, type Handler, type Middleware } from "./ctx";
import { securityHeaders } from "./security";
import { Router, type Match, type RouteInfo } from "./router";
import { serveStaticFile } from "./static";
import { buildWebsocketHandlers, matchWsPath, type WsData, type WsHandlers, type WsRoute } from "./ws";
import { createLogger, type Logger } from "#log";

/** Error handler — mapeia erros para respostas (ver `ctx.error`). */
export type ErrorHandler = (ctx: Ctx, error: unknown) => Response | Promise<Response>;

/** Opções de `createApp`. */
export interface CreateAppOptions {
  /** Security headers aplicados por padrão (`true`). */
  readonly securityHeaders?: boolean;
  /** Error handler personalizado. */
  readonly onError?: ErrorHandler;
  /** Logger do app (erros não tratados). */
  readonly logger?: Logger;
}

/** Opções de `app.listen`. */
export interface ListenOptions {
  readonly hostname?: string;
  readonly port?: number;
  readonly idleTimeout?: number;
}

/** App: rota + middleware HTTP (ver `createApp`). */
export interface App {
  /** Logger do app (erros não tratados). */
  readonly logger: Logger;
  /** Rota + middleware para um app em memória. */
  handle(request: Request): Promise<Response>;
  /** Registra middleware — aplica a todas as requisições. */
  use(...middlewares: readonly Middleware[]): App;
  get(pattern: string, handler: Handler): App;
  post(pattern: string, handler: Handler): App;
  put(pattern: string, handler: Handler): App;
  patch(pattern: string, handler: Handler): App;
  delete(pattern: string, handler: Handler): App;
  all(pattern: string, handler: Handler): App;
  /** Registra WebSocket — `app.ws("/chat", { open, message, close })`. */
  ws(pattern: string, handlers: WsHandlers): App;
  /** Registra arquivos estáticos — `app.static("/assets", "public/assets")`. */
  static(urlPath: string, dir: string): App;
  /** Habilita CORS (preflight + headers). */
  cors(options?: CorsOptions): App;
  /** Define error handler. */
  setErrorHandler(handler: ErrorHandler): App;
  /** Inicia `Bun.serve` e retorna o Server. */
  listen(options?: ListenOptions): Server<WsData>;
  /** Rotas registradas. */
  routes(): readonly RouteInfo[];
}

class AppImpl implements App {
  readonly logger: Logger;
  readonly router = new Router();
  private readonly userMiddlewares: Middleware[] = [];
  private readonly coreMiddlewares: Middleware[] = [];
  private readonly wsRoutes: WsRoute[] = [];
  private errorHandler: ErrorHandler;
  private corsEnabled = false;
  private server?: Server<WsData>;

  constructor(options: CreateAppOptions = {}) {
    this.logger = options.logger ?? createLogger();
    this.errorHandler = options.onError ?? ((ctx, error) => this.defaultErrorHandler(ctx, error));
    if (options.securityHeaders !== false) {
      this.coreMiddlewares.push(securityHeaders);
    }
  }

  use(...middlewares: readonly Middleware[]): App {
    this.userMiddlewares.push(...middlewares);
    return this;
  }

  private add(method: string, pattern: string, handler: Handler): App {
    this.router.add(method, pattern, handler);
    return this;
  }

  get(pattern: string, handler: Handler): App {
    return this.add("GET", pattern, handler);
  }

  post(pattern: string, handler: Handler): App {
    return this.add("POST", pattern, handler);
  }

  put(pattern: string, handler: Handler): App {
    return this.add("PUT", pattern, handler);
  }

  patch(pattern: string, handler: Handler): App {
    return this.add("PATCH", pattern, handler);
  }

  delete(pattern: string, handler: Handler): App {
    return this.add("DELETE", pattern, handler);
  }

  all(pattern: string, handler: Handler): App {
    return this.add("*", pattern, handler);
  }

  ws(pattern: string, handlers: WsHandlers): App {
    this.wsRoutes.push({ pattern, handlers });
    return this;
  }

  static(urlPath: string, dir: string): App {
    const prefix = urlPath.replace(/\/+$/, "");
    const pattern = prefix === "" ? "/*" : `${prefix}/*`;
    const handler: Handler = async (ctx) => {
      const rel = ctx.params["*"] ?? "";
      if (rel === "") throw new NotFoundError();
      return serveStaticFile(ctx, dir, rel);
    };
    this.router.add("GET", pattern, handler);
    this.router.add("HEAD", pattern, handler);
    return this;
  }

  cors(options?: CorsOptions): App {
    if (!this.corsEnabled) {
      this.corsEnabled = true;
      this.coreMiddlewares.push(createCorsMiddleware(options));
    }
    return this;
  }

  setErrorHandler(handler: ErrorHandler): App {
    this.errorHandler = handler;
    return this;
  }

  async handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const match = this.router.find(request.method.toUpperCase(), url.pathname);
    const ctx = createCtx(request, match.params, url);
    const middlewares = [...this.coreMiddlewares, ...this.userMiddlewares];
    const runAt = (index: number): Promise<Response> => {
      const middleware = middlewares[index];
      if (middleware === undefined) return this.invokeRoute(match, ctx);
      const result = middleware(ctx, () => runAt(index + 1));
      return result instanceof Promise ? result : Promise.resolve(result);
    };
    try {
      return await runAt(0);
    } catch (error) {
      return await this.errorHandler(ctx, error);
    }
  }

  listen(options: ListenOptions = {}): Server<WsData> {
    const server = Bun.serve({
      port: options.port ?? 3000,
      fetch: (request, server) => this.handleFetch(request, server),
      websocket: buildWebsocketHandlers(this.wsRoutes),
      ...(options.hostname !== undefined ? { hostname: options.hostname } : {}),
      ...(options.idleTimeout !== undefined ? { idleTimeout: options.idleTimeout } : {}),
    });
    this.server = server;
    return server;
  }

  routes(): readonly RouteInfo[] {
    return this.router.info();
  }

  private async invokeRoute(match: Match, ctx: Ctx): Promise<Response> {
    const route = match.route;
    if (route === undefined) {
      if (match.methods.length > 0) {
        const response = ctx.error(new HttpError(405, "Method Not Allowed"));
        response.headers.set("Allow", match.methods.join(", "));
        return response;
      }
      return ctx.error(new NotFoundError());
    }
    const result = await route.handler(ctx);
    if (result instanceof Response) return result;
    return ctx.raw(null);
  }

  private async defaultErrorHandler(ctx: Ctx, error: unknown): Promise<Response> {
    if (isHttpError(error)) {
      const response = ctx.json(toProblemJson(error, { url: ctx.req.url }), { status: error.status });
      response.headers.set("Content-Type", "application/problem+json; charset=utf-8");
      return response;
    }
    this.logger.error("unhandled error while handling request", {
      pathname: ctx.pathname,
      method: ctx.method,
      error: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
    const response = ctx.json(toProblemJson(new InternalServerError(), { url: ctx.req.url }), { status: 500 });
    response.headers.set("Content-Type", "application/problem+json; charset=utf-8");
    return response;
  }

  private async handleFetch(request: Request, server: Server<WsData>): Promise<Response | undefined> {
    const outcome = await this.upgrade(request, server);
    if (outcome === "upgraded") return undefined;
    if (outcome === "auth-failed") {
      return this.errorHandler(createCtx(request, {}), new UnauthorizedError());
    }
    return this.handle(request);
  }

  private async upgrade(request: Request, server: Server<WsData>): Promise<"upgraded" | "auth-failed" | "not-upgraded"> {
    const url = new URL(request.url);
    if (request.headers.get("upgrade") !== "websocket") return "not-upgraded";
    const route = matchWsPath(this.wsRoutes, url.pathname);
    if (route === undefined) return "not-upgraded";
    const auth = route.handlers.auth;
    if (auth !== undefined && !(await auth(createCtx(request, {})))) {
      return "auth-failed";
    }
    server.upgrade(request, { data: { route } });
    return "upgraded";
  }
}

/** Cria um `App` (ver `App`). */
export function createApp(options: CreateAppOptions = {}): App {
  return new AppImpl(options);
}
