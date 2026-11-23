/**
 * Auth: sessão (cookie), token opaco, JWT HMAC, guards, roles/permissions,
 * CSRF e rate limit.
 */

import { ForbiddenError, TooManyRequestsError, UnauthorizedError } from "#errors";
import { newId } from "#core";
import type { Ctx, Middleware } from "#http";

// --- token opaco -------------------------------------------------------------

/** Gera um token opaco aleatório (hex). */
export function createToken(lengthBytes = 32): string {
  const bytes = new Uint8Array(lengthBytes);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

// --- JWT HMAC (Web Crypto) ----------------------------------------------------

/** Payload de JWT. */
export interface JwtPayload {
  readonly [key: string]: unknown;
  readonly sub: string | number;
  readonly iat?: number;
  readonly exp?: number;
}

/** Opções de `jwtEncode`. */
export interface JwtOptions {
  readonly secret: string;
  /** Duração do token em ms (padrão: `15 min`). */
  readonly expiresInMs?: number;
}

/** JWT codificado. */
export interface Jwt {
  readonly token: string;
  readonly payload: JwtPayload;
}

async function hmacSign(data: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function hmacVerify(expected: Uint8Array, actual: Uint8Array): Promise<boolean> {
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= (expected[i] ?? 0) ^ (actual[i] ?? 0);
  }
  return diff === 0;
}

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64urlDecode(text: string): Uint8Array {
  const normalized = text.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Codifica um JWT HMAC-SHA256. */
export async function jwtEncode(payload: JwtPayload, options: JwtOptions): Promise<Jwt> {
  const now = Date.now();
  const claims: JwtPayload = {
    ...payload,
    iat: payload.iat ?? now,
    exp: payload.exp ?? now + (options.expiresInMs ?? 15 * 60_000),
  };
  const header = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = await hmacSign(`${header}.${body}`, options.secret);
  return { token: `${header}.${body}.${base64urlEncode(signature)}`, payload: claims };
}

/** Decodifica/valida um JWT (lança `UnauthorizedError` se inválido ou expirado). */
export async function jwtDecode(token: string, secret: string): Promise<Jwt> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new UnauthorizedError("Invalid token");
  const [header, body, signature] = parts;
  if (header === undefined || body === undefined || signature === undefined) {
    throw new UnauthorizedError("Invalid token");
  }
  const expected = await hmacSign(`${header}.${body}`, secret);
  if (!(await hmacVerify(expected, base64urlDecode(signature)))) {
    throw new UnauthorizedError("Invalid token signature");
  }
  const payload: JwtPayload = JSON.parse(new TextDecoder().decode(base64urlDecode(body)));
  const exp = payload.exp;
  if (exp !== undefined && Date.now() > exp) throw new UnauthorizedError("Token expired");
  return { token, payload };
}

// --- sessões ------------------------------------------------------------------

/** Sessão de autenticação. */
export interface Session {
  readonly id: string;
  readonly userId: string;
  readonly expiresAt: number;
  readonly createdAt: number;
}

/** Store de sessões. */
export interface SessionStore {
  create(userId: string, options?: { readonly ttlMs?: number }): Promise<Session>;
  get(id: string): Promise<Session | undefined>;
  destroy(id: string): Promise<void>;
  rotate(id: string): Promise<Session | undefined>;
  clear(): Promise<void>;
}

/** Store de sessões em memória. */
export function createMemorySessionStore(options: { readonly ttlMs?: number } = {}): SessionStore {
  const ttlMs = options.ttlMs ?? 15 * 60_000;
  const sessions = new Map<string, Session>();
  const isExpired = (session: Session): boolean => session.expiresAt <= Date.now();
  return {
    async create(userId) {
      const session: Session = { id: newId(), userId, expiresAt: Date.now() + ttlMs, createdAt: Date.now() };
      sessions.set(session.id, session);
      return session;
    },
    async get(id) {
      const session = sessions.get(id);
      if (session === undefined) return undefined;
      if (isExpired(session)) {
        sessions.delete(id);
        return undefined;
      }
      return session;
    },
    async destroy(id) {
      sessions.delete(id);
    },
    async rotate(id) {
      const session = sessions.get(id);
      if (session === undefined) return undefined;
      sessions.delete(id);
      const rotated: Session = { ...session, id: newId() };
      sessions.set(rotated.id, rotated);
      return rotated;
    },
    async clear() {
      sessions.clear();
    },
  };
}

// --- auth ---------------------------------------------------------------------

/** Usuário autenticado — o que `loadUser` retorna. */
export interface AuthUser {
  readonly id: string;
  readonly roles?: readonly string[];
  readonly permissions?: readonly string[];
  readonly [key: string]: unknown;
}

/** Opções de `createAuth`. */
export interface AuthOptions {
  /** Store de sessões. */
  readonly sessions: SessionStore;
  /** Função que carrega um usuário por `userId`. */
  readonly loadUser: (userId: string) => Promise<AuthUser | undefined>;
  /** Nome do cookie de sessão (padrão: `session`). */
  readonly cookieName?: string;
  /** TTL da sessão em ms (padrão: `15 min`). */
  readonly ttlMs?: number;
}

/** Auth: sessão por cookie + `login`/`logout`/`user`/`requireUser`/`middleware`. */
export interface Auth {
  /** Middleware — atualiza `ctx.locals.user` se houver sessão válida. */
  middleware(): Middleware;
  /** Cria sessão e registra `Set-Cookie` no `ctx`. */
  login(ctx: Ctx, user: AuthUser): Promise<void>;
  /** Destrói a sessão. */
  logout(ctx: Ctx): Promise<void>;
  /** Retorna o usuário ou `undefined`. */
  user(ctx: Ctx): Promise<AuthUser | undefined>;
  /** Requer usuário — lança `UnauthorizedError` se ausente. */
  requireUser(ctx: Ctx): Promise<AuthUser>;
}

/** Usuário em `ctx.locals.user` (set por `auth().middleware()`/`login`). */
export function ctxUser(ctx: Ctx): AuthUser | undefined {
  return ctx.locals.user as AuthUser | undefined;
}

function readCookieValue(req: Request, name: string): string | undefined {
  const header = req.headers.get("Cookie");
  if (header === null) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1);
  }
  return undefined;
}

/** Cria um `Auth`. */
export function createAuth(options: AuthOptions): Auth {
  const cookieName = options.cookieName ?? "session";
  const sessions = options.sessions;
  const loadUser = options.loadUser;
  const readSessionId = (ctx: Ctx): string | undefined => readCookieValue(ctx.req, cookieName);

  const auth: Auth = {
    middleware(): Middleware {
      return async (ctx, next) => {
        const user = await auth.user(ctx);
        if (user !== undefined) ctx.locals.user = user;
        return await next();
      };
    },

    async login(ctx: Ctx, user: AuthUser): Promise<void> {
      const session = await sessions.create(String(user.id), options.ttlMs === undefined ? undefined : { ttlMs: options.ttlMs });
      const secure = ctx.req.url.startsWith("https:") ? "; Secure" : "";
      ctx.headers.set("Set-Cookie", `${cookieName}=${session.id}; Path=/; HttpOnly; SameSite=Lax${secure}`);
      ctx.locals.user = user;
    },

    async logout(ctx: Ctx): Promise<void> {
      const sessionId = readSessionId(ctx);
      if (sessionId !== undefined) await sessions.destroy(sessionId);
      ctx.headers.set("Set-Cookie", `${cookieName}=; Path=/; Max-Age=0`);
    },

    async user(ctx: Ctx): Promise<AuthUser | undefined> {
      const sessionId = readSessionId(ctx);
      if (sessionId === undefined) return undefined;
      const session = await sessions.get(sessionId);
      if (session === undefined) return undefined;
      return await loadUser(session.userId);
    },

    async requireUser(ctx: Ctx): Promise<AuthUser> {
      const user = await auth.user(ctx);
      if (user === undefined) throw new UnauthorizedError("Authentication required");
      return user;
    },
  };
  return auth;
}

// --- roles/permissions ----------------------------------------------------------

/** Usuário tem papel? */
export function hasRole(user: AuthUser, role: string): boolean {
  return (user.roles ?? []).includes(role);
}

/** Usuário tem permissão? (`permissions` + `roles` + wildcard `"*"`). */
export function hasPermission(user: AuthUser, permission: string): boolean {
  const granted = [...(user.permissions ?? []), ...(user.roles ?? [])];
  return granted.includes(permission) || granted.includes("*");
}

/** Middleware: requer permissão — lança `UnauthorizedError`/`ForbiddenError`. */
export function requirePermission(permission: string): Middleware {
  return async (ctx, next) => {
    const user = ctxUser(ctx);
    if (user === undefined) throw new UnauthorizedError("Authentication required");
    if (!hasPermission(user, permission)) throw new ForbiddenError(`Permission "${permission}" required`);
    return await next();
  };
}

/** Middleware: requer papel. */
export function requireRole(role: string): Middleware {
  return async (ctx, next) => {
    const user = ctxUser(ctx);
    if (user === undefined) throw new UnauthorizedError("Authentication required");
    if (!hasRole(user, role)) throw new ForbiddenError(`Role "${role}" required`);
    return await next();
  };
}

// --- CSRF ------------------------------------------------------------------------

/** CSRF: token por sessão, validado em `X-CSRF-Token` para métodos mutáveis. */
export function createCsrf(cookieName = "session"): {
  readonly middleware: Middleware;
  /** Registra e retorna o token para o `ctx`. */
  readonly issue: (ctx: Ctx) => string;
} {
  const tokens = new Map<string, string>();
  const mutableMethods = ["POST", "PUT", "PATCH", "DELETE"];
  return {
    issue: (ctx) => {
      const sessionId = readCookieValue(ctx.req, cookieName) ?? "anonymous";
      const token = newId();
      tokens.set(sessionId, token);
      return token;
    },
    middleware: async (ctx, next) => {
      if (!mutableMethods.includes(ctx.method)) return await next();
      const sessionId = readCookieValue(ctx.req, cookieName) ?? "anonymous";
      const expected = tokens.get(sessionId);
      const actual = ctx.req.headers.get("X-CSRF-Token");
      if (expected === undefined || actual === null || !timingSafeEqual(expected, actual)) {
        throw new ForbiddenError("CSRF check failed");
      }
      return await next();
    },
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufferA = new TextEncoder().encode(a);
  const bufferB = new TextEncoder().encode(b);
  if (bufferA.length !== bufferB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufferA.length; i++) {
    diff |= (bufferA[i] ?? 0) ^ (bufferB[i] ?? 0);
  }
  return diff === 0;
}

// --- rate limit -------------------------------------------------------------------

/** Rate limit: memória, chave por campo — middleware que lança `TooManyRequestsError`. */
export function createRateLimiter(options: {
  readonly limit: number;
  readonly windowMs: number;
  readonly key?: (ctx: Ctx) => string;
}): Middleware {
  const limit = options.limit;
  const windowMs = options.windowMs;
  const keyOf = options.key ?? (() => "all");
  const hits = new Map<string, number[]>();
  return async (ctx, next) => {
    const key = keyOf(ctx);
    const now = Date.now();
    const windowStart = now - windowMs;
    const times = (hits.get(key) ?? []).filter((time) => time > windowStart);
    if (times.length >= limit) {
      throw new TooManyRequestsError();
    }
    times.push(now);
    hits.set(key, times);
    return await next();
  };
}
