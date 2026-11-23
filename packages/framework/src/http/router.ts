/**
 * Roteamento de padrões: `/users/:id`, `*` como segmento final.
 */

import type { Handler } from "./ctx";

/** Info de rota — retornado por `app.routes()`. */
export interface RouteInfo {
  readonly method: string;
  readonly pattern: string;
}

/** Rota interna: método, padrão e handler. */
export interface Route {
  readonly method: string;
  readonly pattern: string;
  readonly handler: Handler;
}

/** Resultado de `matchPath`/`Router.find`. */
export interface Match {
  readonly route: Route | undefined;
  readonly params: Record<string, string>;
  readonly methods: readonly string[];
}

function segments(value: string): string[] {
  return value.split("/").filter((segment) => segment !== "");
}

/** Casa `pattern` contra `pathname`; retorna params ou `undefined`. */
export function matchPath(pattern: string, pathname: string): Record<string, string> | undefined {
  const patternSegments = segments(pattern);
  const pathSegments = segments(pathname);
  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i];
    if (patternSegment === undefined) return undefined;
    if (patternSegment === "*") {
      params["*"] = pathSegments.slice(i).join("/");
      return params;
    }
    const pathSegment = pathSegments[i];
    if (pathSegment === undefined) return undefined;
    const decoded = decodeURIComponent(pathSegment);
    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decoded;
    } else if (patternSegment !== decoded) {
      return undefined;
    }
  }
  if (pathSegments.length !== patternSegments.length) return undefined;
  return params;
}

/** Tabela de rotas — `add` + `find` + `info`. */
export class Router {
  private readonly routes: Route[] = [];
  private readonly exactRoutes = new Map<string, Route>();

  add(method: string, pattern: string, handler: Handler): void {
    const route = { method, pattern, handler };
    this.routes.push(route);
    if (!pattern.includes(":") && !pattern.includes("*")) {
      this.exactRoutes.set(`${method} ${pattern}`, route);
    }
  }

  info(): readonly RouteInfo[] {
    return this.routes.map((route) => ({ method: route.method, pattern: route.pattern }));
  }

  find(method: string, pathname: string): Match {
    const exact = this.exactRoutes.get(`${method} ${pathname}`);
    if (exact !== undefined) return { route: exact, params: {}, methods: [exact.method] };

    const methods: string[] = [];
    for (const route of this.routes) {
      const params = matchPath(route.pattern, pathname);
      if (params === undefined) continue;
      methods.push(route.method);
      if (route.method === method || route.method === "*") {
        return { route, params, methods };
      }
    }
    return { route: undefined, params: {}, methods };
  }
}
