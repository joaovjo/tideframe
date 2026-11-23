/**
 * Security headers: aplicado por padrão (`createApp()`).
 */

import type { Middleware } from "./ctx";

/** Middleware de security headers. */
export const securityHeaders: Middleware = (ctx, next) => {
  ctx.headers.set("X-Content-Type-Options", "nosniff");
  ctx.headers.set("X-Frame-Options", "SAMEORIGIN");
  ctx.headers.set("X-DNS-Prefetch-Control", "off");
  ctx.headers.set("Referrer-Policy", "no-referrer-when-downgrade");
  return next();
};
