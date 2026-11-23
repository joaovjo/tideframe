# tideframe

Backend framework TypeScript 7.x, Bun-first, batteries-included, zero runtime dependencies, frontend-agnóstico.

Versão: `0.1.0` (desenvolvimento ativo, 2026-11-23).

## Início rápido

```ts
import { createApp } from "tideframe/http";

const app = createApp();
app.get("/", (ctx) => ctx.json({ hello: "world" }));
app.listen({ port: 3000 });
```

```bash
bun run example    # smoke test do app de exemplo (examples/hello — hita todas as rotas)
```

## Módulos (17)

| Módulo | API pública |
|---|---|
| `tideframe/core` | `newId()`, `Result` (`ok`/`err`/`isOk`/`isErr`), tipos do Standard Schema v1. |
| `tideframe/errors` | `FrameworkError`, `HttpError` (400–504), `ValidationError` (422), `toProblemJson()`. |
| `tideframe/validate` | `string()`, `number()`, `boolean()`, `literal()`, `nullable()`, `optional()`, `array()`, `object()`, `union()`, `transform()`, `check()`, `custom()`, `parse()`, `safeParse()`, `is()`. |
| `tideframe/log` | `createLogger()`, `Logger`, `runWithContext()`, `createConsoleSink()`, `createMemorySink()`; redação por chave sensível por padrão. |
| `tideframe/config` | `loadConfig()`, `resolveEnvironment()`, `parseDotEnv()` — tipado via Standard Schema; `secrets` obrigatórios; `environments` por ambiente. |
| `tideframe/di` | `Token<T>`, `Container` (`set`/`get`/`has`), `runWithRequest()`; escopos `singleton`/`transient`/`request`; injeção por construtor via `static inject`. |
| `tideframe/http` | `createApp()`, `App` (`use`/`get`/`post`/`put`/`patch`/`delete`/`all`/`ws`/`static`/`cors`/`routes`/`listen`/`handle`/`setErrorHandler`), `Ctx`, `Middleware`, `Router`, `matchPath()`, security headers, CORS, SSE, arquivos estáticos. |
| `tideframe/events` | `createBus()`, `createTypedBus()` — pub/sub em processo, wildcards (`*`, `user.*`), isolamento de erro. |
| `tideframe/ws` | `WsHandlers`/`WsRoute`, `buildWebsocketHandlers()`, `matchWsPath()` (rooms/pub-sub via `app.ws`). |
| `tideframe/cache` | `createCache()` — TTL, tags, stampede (deduplicação de loads em voo). |
| `tideframe/queue` | `createQueue()` — workers, retries, backoff exponencial, `onComplete`/`onError`. |
| `tideframe/storage` | `LocalStorage` (Bun.file/Bun.write), `S3Storage` (Bun.s3) — interface de adapter. |
| `tideframe/orm` | `defineModel()`, `migrate()`, `transaction()`, `QueryBuilder`; hooks, timestamps, soft deletes. |
| `tideframe/mailer` | `createMemoryMailer()`, `createLogMailer()`, `SmtpMailer` (cliente SMTP mínimo — EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO, DATA). |
| `tideframe/auth` | `createAuth()` (`login`/`logout`/`user`/`requireUser`/`middleware`), `jwtEncode()`/`jwtDecode()` (HMAC-SHA256), `createToken()`, `createMemorySessionStore()`, `hasPermission()`/`hasRole()`, `requirePermission()`/`requireRole()`, `createCsrf()`, `createRateLimiter()`. |
| `tideframe/cli` | `runCli()` (`routes <appFile>`, `doctor <files>`), `doctorFiles()`. |
| `tideframe/test` | `createTestApp()`, `inject()`, re-exports de `bun:test`. |

Detalhes e decisões de escopo: [docs/framework/modulos.md](docs/framework/modulos.md).
Monorepo/arquitetura: [docs/framework/estrutura.md](docs/framework/estrutura.md).
Histórico: [docs/log.md](docs/log.md).

## Benchmarks (`bun run bench`)

Medidos conforme [Bun Benchmarking](https://bun.com/docs/project/benchmarking) — `performance.now()` para microbenchmarks e `fetch` com semáforos para carga HTTP (equivalentes do `mitata`/`oha`, não instalados conforme "dev deps only Bun + TypeScript").

| Métrica | Resultado |
|---|---|
| `GET /` (JSON) | **3284 req/s** — avg 0.304 ms, p99 86.0 ms, max 111.2 ms — rss 47.4 MB |
| `POST /users` (validado) | **3188 req/s** — avg 0.314 ms, p99 159.2 ms, max 239.4 ms — rss 46.9 MB |
| `di.get(singleton)` (micro) | avg 0.0001 ms |
| `validate.parse(object)` (micro) | avg 0.0003 ms |
| Cold start (import do app) | ~29 ms |

10.000 requisições, 100 conexões concorrentes. Nota: o alvo do spec era 50k req/s em Ryzen 7 7700X / Apple M3 Pro; nesta máquina (Windows, similar) medido até ~3.2k req/s — gap conhecido, candidato: caminho do router + `Response` por rota (HTTP nativo `Bun.serve` direto) — nota registrada, otimização futura.

## Desenvolvimento

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test packages/framework/test
bun run example     # smoke test do app de exemplo
bun run bench       # benchmarks
```

## Versões e doc consultada

- **Bun 1.4.5** (2026-11-23). Docs consultadas: `bun.com/docs/runtime` (runtime), `bun.com/docs/runtime/sql` (Bun.SQL — 2026-11-23), `bun.com/docs/runtime/s3` via bun-mcp (Bun.s3 — 2026-11-23), `bun.com/docs/test`, `bun.com/docs/project/benchmarking`.
- **TypeScript 7.0.2** (devDep, `bun install` em 2026-11-23). Docs consultadas: devblogs Microsoft "Announcing TypeScript 7.0" (2026-07-08) e "Announcing TypeScript 7.1 Beta" (2026-10-20).
- Sem `any` em tipos públicos, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` e `erasableSyntaxOnly` ativados conforme o spec.
