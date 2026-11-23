---
type: Concept
title: Módulos do Framework
description: Tabela de APIs públicas por módulo e decisões de escopo da implementação tideframe.
tags: [framework, modulos, tideframe, api]
sources:
  - id: prompt-framework
    resource: ../project/prompt-framework.md
    title: Prompt do Framework (PT-BR)
    author: agent:opencode/v2
  - id: bun-docs-bench
    resource: https://bun.com/docs/project/benchmarking
    title: Bun Benchmarking
    author: Bun
status: stable
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
---

# Módulos — tideframe

Módulos internos do framework e suas APIs públicas. Ver detalhes em [Estrutura](estrutura.md).

## Tabela

| Módulo | API pública |
|---|---|
| `tideframe/core` | `newId()`, `Result` (`ok`/`err`/`isOk`/`isErr`) e tipos do Standard Schema v1. |
| `tideframe/errors` | `FrameworkError`, `HttpError` + subclasses (400–504), `ValidationError` (422), `toProblemJson()`. |
| `tideframe/validate` | `string()`, `number()`, `boolean()`, `literal()`, `nullable()`, `optional()`, `array()`, `object()`, `union()`, `transform()`, `check()`, `custom()`, `parse()`, `safeParse()`, `is()`. |
| `tideframe/log` | `createLogger()`, `Logger` (`debug/info/warn/error/fatal`, `child()`), `createConsoleSink()`, `createMemorySink()`, `runWithContext()`, redação por chave sensível. |
| `tideframe/config` | `loadConfig()`, `resolveEnvironment()`, `parseDotEnv()` — tipado via Standard Schema; `secrets` obrigatórios; `environments` por ambiente. |
| `tideframe/di` | `Token<T>`, `Container` (`set`/`get`/`has`), `createContainer()`, `runWithRequest()`; escopos `singleton`/`transient`/`request`; injeção por construtor via `static inject`. |
| `tideframe/http` | `createApp()`, `App` (`use/get/post/put/patch/delete/all/ws/static/cors/routes/listen/handle/setErrorHandler`), `Ctx` (`json/text/html/redirect/file/stream/sse/error`), `Middleware`, `Router`, `matchPath()`, `securityHeaders`, `createCorsMiddleware()`, `createCtx()`. |
| `tideframe/events` | `createBus()`, `createTypedBus<EventsMap>()`, wildcards (`*`, `user.*`). |
| `tideframe/ws` | `WsHandlers`/`WsRoute`/`WsData`, `buildWebsocketHandlers()`, `matchWsPath()`. |
| `tideframe/cache` | `createCache()` — TTL por chave, tags, stampede (deduplicação de loads em voo). |
| `tideframe/queue` | `createQueue()` — workers, retries, backoff exponencial, `onComplete`/`onError`; memória. |
| `tideframe/storage` | `LocalStorage` (Bun.file/Bun.write), `S3Storage` (Bun.s3) — interface de adapter. |
| `tideframe/orm` | `defineModel()`, `migrate()`, `transaction()`, `QueryBuilder` (`where/whereIn/orderBy/limit/offset/all/first/count/update`); hooks, timestamps, soft deletes. |
| `tideframe/mailer` | `createMemoryMailer()`, `createLogMailer()`, `SmtpMailer` — cliente SMTP mínimo (EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO, DATA); não é MTA. |
| `tideframe/auth` | `createAuth()` (`login`/`logout`/`user`/`requireUser`/`middleware`), `jwtEncode()`/`jwtDecode()` (HMAC-SHA256 via `crypto.subtle`), `createToken()`, `createMemorySessionStore()`, `hasPermission()`/`hasRole()`, `requirePermission()`/`requireRole()`, `createCsrf()`, `createRateLimiter()`. |
| `tideframe/cli` | `runCli()` (`routes <appFile>`, `doctor <files>`), `doctorFiles()`. |
| `tideframe/test` | `createTestApp()`, `inject()`, re-exports de `bun:test`. |

## Decisões e escopo

Verificadas na implementação:

* **ORM (v0.1)**: `migrate()` = `CREATE TABLE IF NOT EXISTS` por modelo (idempotente, sem histórico de versões — a chave primária é `id` por padrão e o DDL cobre tipos `integer/number/string/boolean/datetime/json`, PK/UNIQUE/NOT NULL/AUTOINCREMENT).
  - Relações não foram implementadas — use `where`/`whereIn`/`join`-equivalent manual via `database` no `Builder`.
  - Seeders/factories não foram implementados.
  - `sql.begin(fn)` (transações) via `transaction()`.
* **Mailer**: SMTP mínimo por `node:net`/`node:tls` (Bun suporta). Sem suporte a MIME complexo (anexos), message-id, list-unsubscribe.
* **Auth**: cookies (HttpOnly, SameSite=Lax); JWT HMAC via `crypto.subtle` (Web Crypto, sem `Buffer`).
* **DI**: sem decorators — `static inject: readonly Token[]` no construtor.
* **wstests**: `app.ws()` — rooms/pub-sub via `ws.subscribe()`/`ws.publish()` (ServerWebSocket do Bun); backpressure via `ws.getBufferedAmount()`.
* **Bench**: microbenchmarks medidos com `performance.now()` e carga HTTP via `fetch` com semáforos. A especificação agora permite as ferramentas de benchmarking recomendadas pelo Bun (mitata, bombardier, oha, hyperfine) como dev deps; a implementação atual usa equivalentes manuais e pode adotá-las sem violar a política de zero dependências de runtime.
* **Recursos da especificação ainda não entregues (escopo):** restarts automáticos/HMR (`bun --hot` recomendado), workers de queue com filas Redis/Kafka (versão em memória entregue), rate-limit de auth com fila filtrada por IP (chave padrão `() => "all"`).
