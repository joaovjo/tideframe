/**
 * Servidor de carga dos benchmarks.
 *
 * `BENCH_MODE=framework` (padrão) exercita o tideframe completo.
 * `BENCH_MODE=raw` é o baseline mínimo de `Bun.serve` — mesma resposta,
 * sem router/middleware/contexto, para medir o overhead do framework.
 */

import { createApp } from "tideframe/http";
import { object, parse, string } from "tideframe/validate";

const mode = process.env["BENCH_MODE"] ?? "framework";
const port = Number(process.env["BENCH_PORT"] ?? "3456");
const hostname = "127.0.0.1";

if (mode === "raw") {
  Bun.serve({
    port,
    hostname,
    fetch(request) {
      const pathname = new URL(request.url).pathname;
      if (pathname === "/health") return Response.json({ status: "ok" });
      if (pathname === "/users" && request.method === "POST") {
        return Response.json({ created: true, name: "Ada" });
      }
      return Response.json({ hello: "world" });
    },
  });
} else {
  const app = createApp();
  app.get("/", (ctx) => ctx.json({ hello: "world" }));
  app.get("/health", (ctx) => ctx.json({ status: "ok" }));
  const UserSchema = object({ name: string() });
  app.post("/users", async (ctx) => {
    const user = parse(UserSchema, await ctx.req.json());
    return ctx.json({ created: true, ...user });
  });
  app.listen({ port, hostname });
}

console.log(`ready ${hostname}:${port} mode=${mode}`);
