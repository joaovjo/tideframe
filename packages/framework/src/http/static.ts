/**
 * Arquivos estáticos (`app.static`): resolvedor de caminhos seguro.
 */

import { NotFoundError } from "#errors";
import type { Ctx } from "./ctx";

/** Resolve `dir + "/" + rel` rejeitando atravessamento (`..`) — `undefined` se inseguro. */
export function resolveStaticPath(dir: string, rel: string): string | undefined {
  const parts: string[] = [dir];
  for (const segment of rel.split("/").filter((segment) => segment !== "" && segment !== ".")) {
    if (segment === "..") {
      parts.pop();
      if (parts.length === 0) return undefined;
      continue;
    }
    parts.push(segment);
  }
  return parts.join("/");
}

/** Serva um arquivo estático (404 `NotFoundError` se faltar). */
export async function serveStaticFile(ctx: Ctx, dir: string, rel: string): Promise<Response> {
  const fullPath = resolveStaticPath(dir, rel);
  if (fullPath === undefined) throw new NotFoundError(rel);
  const file = Bun.file(fullPath);
  if (!(await file.exists())) throw new NotFoundError(rel);
  return ctx.raw(file);
}
