/**
 * App de exemplo — demonstra as baterias do framework (http, validate, di,
 * log, cache, queue, events, storage, auth, orm).
 *
 * Rotas:
 * - `GET /` — hello world (JSON);
 * - `GET /health` — rota de saúde;
 * - `POST /users` — body validado por `validate`;
 * - `GET /greet` — serviço do container DI (`greeter`);
 * - `POST /login` — autenticação (`auth.login`);
 * - `GET /users-count` — ORM (`User.query().count()`);
 * - `GET /storage` — storage local (`LocalStorage`);
 * - `GET /cache` — cache em memória;
 * - `GET /queue` — fila em memória (`queue.size()`);
 * - `GET /events` — bus de events.
 *
 * `bun run examples/hello/smoke.ts` roda um smoke test (hita todas as rotas).
 * `bun run examples/hello/index.ts` inicia o app em `port 3000`.
 */

import { SQL } from "bun";
import { createCache } from "tideframe/cache";
import { createAuth, createMemorySessionStore } from "tideframe/auth";
import { createBus } from "tideframe/events";
import { createApp } from "tideframe/http";
import { createLogger } from "tideframe/log";
import { createContainer, Token } from "tideframe/di";
import { defineModel, migrate } from "tideframe/orm";
import { LocalStorage } from "tideframe/storage";
import { createQueue } from "tideframe/queue";
import { number, object, parse, string } from "tideframe/validate";

const logger = createLogger({ level: "info" });

// DI: serviço com dependência resolvida pelo container (`static inject`).
const configToken = new Token<string>("config");
class Greeter {
  readonly greeting: string;
  constructor(config: string) {
    this.greeting = `hello from ${config}`;
  }
}
const greeterToken = new Token<Greeter>("greeter");

const container = createContainer();
container.set(configToken, "tideframe-hello");
container.set(greeterToken, Greeter);

// Baterias: cache, queue, events, storage, auth, orm.
const cache = createCache();
const queue = createQueue();
const bus = createBus();
const storage = new LocalStorage();
const sessions = createMemorySessionStore();
const auth = createAuth({ sessions, loadUser: async () => ({ id: "1" }) });
const db = new SQL("sqlite://:memory:");
const User = defineModel<{ id: number; name: string }>("users", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string" },
}, { database: db });
await migrate(db, [User]);

/** App de exemplo. */
export const app = createApp({ logger });

const UserSchema = object({ name: string({ minLength: 1 }), age: number({ min: 0 }) });

app.get("/", (ctx) => ctx.json({ hello: "world" }));
app.get("/health", (ctx) => ctx.json({ status: "ok" }));
app.post("/users", async (ctx) => {
  const user = parse(UserSchema, await ctx.req.json());
  return ctx.json({ created: true, ...user });
});
app.get("/greet", (ctx) => ctx.json({ greeting: container.get(greeterToken).greeting }));
app.post("/login", async (ctx) => {
  await auth.login(ctx, { id: "1" });
  return ctx.json({ ok: true });
});
app.get("/users-count", async (ctx) => ctx.json({ count: await User.query().count() }));
app.get("/storage", async (ctx) => {
  await storage.write("hello.txt", "hi");
  const file = await storage.read("hello.txt");
  const text = file !== null ? await file.text() : "";
  await storage.delete("hello.txt");
  return ctx.text(text);
});
app.get("/cache", (ctx) => {
  cache.set("k", "v");
  return ctx.json({ value: cache.get("k") ?? null });
});
app.get("/queue", (ctx) => ctx.json({ size: queue.size() }));
app.get("/events", (ctx) => {
  bus.on("example", () => { /* registrado */ });
  return ctx.json({ ok: true });
});
if (import.meta.main) {
  const server = app.listen({ port: 3000 });
  logger.info("listening", { port: server.port });
}
