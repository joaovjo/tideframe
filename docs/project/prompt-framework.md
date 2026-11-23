---
type: Prompt
title: Prompt do Framework
description: Definição canônica em PT-BR da especificação do framework backend TypeScript 7.x, Bun-first, batteries-included e frontend-agnóstico.
tags: [prompt, framework, bun, typescript, arquitetura]
sources:
  - id: prompt-abyssal-garden
    resource: https://raw.githubusercontent.com/Noniv/abyssal-garden/refs/heads/main/prompt.txt
    title: prompt.txt do Abyssal Garden
    author: Noniv
  - id: bun-docs
    resource: https://bun.com/docs
    title: Bun Documentation
    author: Bun
  - id: typescript-style
    resource: https://ts.dev/style/
    title: TypeScript Style Guide
    author: TypeScript
  - id: standard-schema
    resource: https://standardschema.dev/
    title: Standard Schema
    author: Standard Schema
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
status: stable
---

# Prompt do Framework

> Esta é a definição canônica em PT-BR. A versão em inglês (`prompt.txt`, na raiz) é a tradução usada por modelos de código. Mudanças começam aqui.

Construa um framework backend completo em TypeScript 7.x, Bun-first, batteries-included, zero dependências de runtime e frontend-agnóstico.

## PRIORIDADES (nesta ordem quando houver conflito)

1. Simplicidade e correção.
2. DX amigável e previsível.
3. Manutenibilidade e superfície mínima.
4. Performance dentro do alvo.

## RESTRIÇÕES

- TypeScript 7.x estrito; siga https://ts.dev/style/ e https://google.github.io/styleguide/tsguide.html. Consulte https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ e https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/ para a versão alvo. Ative `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Bun é o runtime. Use as APIs do Bun primeiro. A documentação oficial do Bun é a fonte de verdade: https://bun.com/docs, https://bun.com/llms.txt, https://bun.com/llms-full.txt, https://bun.com/docs/runtime/sql. Consulte antes de usar ou desenhar contra qualquer API do Bun; não confie na memória. Registre a versão do Bun e a data da documentação consultada.
- Benchmarking segue a orientação oficial do Bun (https://bun.com/docs/project/benchmarking): `Bun.nanoseconds()` / `performance.now()` para medir tempo, `mitata` para microbenchmarks, `bombardier` ou `oha` para teste de carga HTTP, `hyperfine` para CLI. Dependências de desenvolvimento são permitidas; não confunda ferramentas de desenvolvimento com dependências de runtime.
- Zero dependências de runtime; dev deps são permitidas e podem incluir Bun, TypeScript e as ferramentas de benchmarking recomendadas na documentação do Bun (mitata, bombardier, oha, hyperfine). Os packages do workspace são internos.
- Simplicidade primeiro. Prefira o design mais simples que atenda à especificação. Sem abstrações especulativas, sem features além do pedido, sem configuração para futuros hipotéticos. Se um engenheiro sênior chamar de complicado, simplifique.
- DX amigável. Nomes previsíveis, erros consistentes, mensagens úteis, boilerplate mínimo. Um novo usuário deve ser produtivo em minutos.
- Manutenibilidade. Módulos pequenos, dependências explícitas, sem estado global escondido, sem mágica, sem reflexão. Atualizar um módulo não pode quebrar outro. Cada módulo deve ser entendível isoladamente.
- Fail loud. Sem `catch` vazio, sem fallback silencioso, sem retry infinito, sem valor padrão escondendo dado faltando. Erros devem ser visíveis e acionáveis.
- Escala de microapp a enterprise. O framework é modular e incremental: um microapp usa só `core` + `http`; um app enterprise adota todos os módulos. Sem layout de projeto obrigatório. O monorepo é a estrutura de desenvolvimento, não a estrutura exigida do consumidor.
- BDD + TDD. Todo módulo começa com uma spec BDD que falha, em `bun:test` (`describe`/`it`, Given/When/Then nos nomes dos testes). Red → green → refactor. Nenhuma implementação sem um teste que falhe primeiro. Sem dependência de Gherkin.
- Sem wrappers finos sobre o Bun. Regra de decisão:
  * Bun tem o primitivo → chame direto; API do framework só se adicionar tipagem, ciclo de vida, config ou composição.
  * Bun tem parcialmente → estenda/componha, não embrulhe 1:1.
  * Bun não tem → implemente.
- Frontend agnóstico; sem template engine; sem acoplamento a React/Vue/Svelte. Sirva JSON, texto, HTML, streams, SSE e arquivos.
- Monorepo estilo Next.js: `packages/framework` contém o framework e todas as batteries como módulos internos; pacotes auxiliares (`create-framework`, etc.) são separados. Não há pacotes separados por battery. As batteries embarcam juntas e são adotadas por importação, não por instalação.
- Sem camada de compatibilidade com Node.js.
- A API pública é do framework; não re-exporte internos do Bun. Nada de `export * from 'bun:*'`.
- Sem `any` em tipos públicos; sem `@ts-ignore`; sem enums, namespaces, parameter properties ou decorators.
- Tree-shakeable; importar um módulo não pode puxar o framework inteiro.
- Erros tipados com status HTTP.
- Validação implementa Standard Schema v1 (https://standardschema.dev/). Schemas expõem `~standard.validate`; sem zod.
- Bancos: PostgreSQL, MySQL, MariaDB e SQLite via `Bun.SQL` (`sql`, `SQL` de `bun`), conforme https://bun.com/docs/runtime/sql#database-support. `bun:sqlite` está disponível para acesso direto ao SQLite. Sem drivers de terceiros.

## ALVO

- Bun 1.3+ (estável mais recente no momento do build), TypeScript 7.x (notas do 7.1 beta consultadas), Windows 11 / Linux / macOS.
- 50 mil req/s em uma rota JSON, 100 conexões concorrentes, resposta de ~1 KB, em Ryzen 7 7700X / Apple M3 Pro.
- p99 < 5 ms a 10 mil req/s.
- Cold start < 100 ms.
- RSS < 50 MB hello world; < 100 MB com ORM.
- Typecheck < 5 s quente; testes < 30 s.
- API pública: nenhum subpath com mais de 100 exports; sem vazamento de tipos internos.
- Sem erros ou warnings no console ao iniciar.

## ARQUITETURA

- Módulos internos: `core`, `http`, `di`, `config`, `log`, `errors`, `validate`, `orm`, `auth`, `cache`, `queue`, `ws`, `events`, `storage`, `mailer`, `cli`, `test`.
- Direção de dependência: `core` ← `errors`/`log`/`config`/`di`/`validate` ← `http` ← `orm`/`auth`/`cache`/`queue`/`ws`/`events`/`storage`/`mailer` ← `cli`.
- Sem dependências circulares; imports internos via `#`; imports públicos via subpath exports.
- `packages/framework` tem um `package.json` com `exports` e `imports` (`#*`); cada módulo tem `src/<module>/` e `test/<module>/`. Pacotes auxiliares ficam em `packages/*`.
- Todas as batteries embarcam no mesmo `packages/framework`. Um microapp importa só `core` + `http`; um app enterprise importa todos. Sem instalação separada; sem layout obrigatório.
- Estrutura de desenvolvimento:

```text
package.json          # workspaces: ["packages/*"], private
tsconfig.json
tsconfig.base.json
packages/
  framework/
    package.json      # name: "<framework>", exports, imports (#*)
    src/
      core/ http/ di/ config/ log/ errors/ validate/ orm/ auth/
      cache/ queue/ ws/ events/ storage/ mailer/ cli/ test/
    test/
  create-framework/   # CLI de scaffold
examples/
benchmarks/
integration/
docs/
```

## FEATURES

| Área | O que entra |
|---|---|
| HTTP | Bun.serve, router, middleware, request/response, SSE, arquivos estáticos, security headers, CORS |
| DI | tokens, injeção por construtor, escopos (singleton/transient/request) |
| Config | tipada, env, .env, validação, secrets, por ambiente |
| Log | estruturado, níveis, sinks, contexto da request, redação |
| Errors | hierarquia tipada, mapeamento de status, problem+json, error handler |
| Validation | Standard Schema v1; schema, coerção, aninhados, regras customizadas, saída tipada; sem zod |
| ORM | PostgreSQL, MySQL, MariaDB, SQLite via `Bun.SQL`; query builder, relações, hooks, timestamps, soft deletes, transações, migrations, seeders/factories |
| Auth | sessão, token opaco, JWT HMAC, Bun.password, guards, roles/permissions, CSRF, rate limit |
| Cache | memória + adapter Redis se o Bun expuser; TTL, tags, stampede |
| Queue | memória + adapter Redis se disponível; workers, retries, backoff, DLQ, cron |
| WebSockets | rooms, pub/sub, auth, mensagens tipadas, backpressure |
| Events | in-process, tipados, wildcards, isolamento de erro |
| Storage | local (Bun.file/Bun.write) + S3 (Bun.s3) + interface de adapter |
| Mailer | interface + transporte log/memory + cliente SMTP mínimo (EHLO, STARTTLS, AUTH, MAIL FROM, RCPT TO, DATA); não é um MTA |
| CLI | create, dev, build, migrate, db:seed, routes, test, doctor |
| Test | BDD + TDD com bun:test; specs antes do código; app factory, inject, fake time/queue/mail, type tests |
| Diagnostics | comando `doctor`: catch vazio, fallback silencioso, retry infinito, valor padrão escondendo dado faltando; lista antes de corrigir |

## API SURFACE

Hello world:

```ts
import { createApp } from '<framework>/http';

const app = createApp();
app.get('/', (ctx) => ctx.json({ hello: 'world' }));
app.listen({ port: 3000 });
```

Middleware + validação + DI:

```ts
import { createApp } from '<framework>/http';
import { createContainer } from '<framework>/di';
import { z } from '<framework>/validate';

const container = createContainer();
container.set(Logger, new ConsoleLogger());

const app = createApp({ container });
app.use(async (ctx, next) => { await next(); });
app.post('/users', async (ctx) => {
  const body = z.object({ name: z.string() }).parse(await ctx.json());
  return ctx.json({ id: crypto.randomUUID(), name: body.name });
});
```

ORM + migrations:

```ts
import { defineModel, migrate } from '<framework>/orm';
import { Database } from 'bun:sqlite';

const db = new Database('app.db');
const User = defineModel('users', {
  id: { type: 'integer', primary: true },
  name: { type: 'string' },
  email: { type: 'string', unique: true },
  createdAt: { type: 'datetime', default: () => new Date() },
});
await migrate(db, [User]);
const user = await User.query().where('email', 'a@b.com').first();
```

Auth:

```ts
import { auth } from '<framework>/auth';
app.use(auth({ session: { secret: config.auth.secret } }));
app.get('/me', (ctx) => ctx.json(ctx.user));
```

WebSockets:

```ts
app.ws('/chat', {
  open(ws) { ws.subscribe('chat'); },
  message(ws, msg) { ws.publish('chat', msg); },
});
```

Naming:

- `createApp`, `defineConfig`, `defineModel`, `migrate`, `inject`, `ctx.json/text/html/redirect/stream/file`.
- Erros terminam com `Error`; guards com `Guard`; adapters com `Adapter`.

## DIAGNOSTICS

O framework inclui um comando `doctor` que encontra todo lugar do app onde um erro acontece e ninguém fica sabendo: `catch` vazio, fallback silencioso, retry infinito, valor padrão escondendo dado faltando. Ele lista todas as ocorrências antes de mudar qualquer coisa.

```bash
bunx <framework> doctor
```

Instrução literal: "Encontra todo lugar do meu app onde um erro acontece e ninguém fica sabendo: try/catch vazio, fallback silencioso, retry infinito, valor padrão escondendo dado faltando. Me mostra a lista antes de mudar qualquer coisa."

## REFERÊNCIAS

- Bun docs: https://bun.com/docs, https://bun.com/llms.txt, https://bun.com/llms-full.txt, https://bun.com/docs/runtime/sql, https://bun.com/docs/runtime/sql#database-support, https://bun.com/docs/project/benchmarking.
- TypeScript: https://ts.dev/style/, https://google.github.io/styleguide/tsguide.html, https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/, https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/.
- Standard Schema: https://standardschema.dev/.
- `exemplos/`: 16 repositórios de referência. Consulte para padrões de API; não copie código; registre achados em `docs/referencias/`.
- `docs/`: base de conhecimento do projeto; atualize a cada decisão e aprendizado.

## VERIFICAÇÃO

- BDD specs para toda feature, escritas antes da implementação; `bun test` passa (unit + integration), cobertura >= 90% no core.
- TDD: red → green → refactor; nenhum módulo implementado sem uma spec que falhe primeiro.
- `bun run typecheck` (`tsc --noEmit`) limpo.
- `bun run example` (app inicia; smoke test bate em todas as rotas).
- `bun run bench` segue https://bun.com/docs/project/benchmarking: mitata para microbenchmarks, bombardier/oha para carga HTTP, `Bun.nanoseconds()` para cold start; reporte avg, p99, max, RSS.
- Crítico independente: vê spec, README, exemplos, tipos públicos e respostas do app; nunca o código interno ou o raciocínio do agente. Retorna defeitos priorizados; itere até não haver nada acima de "minor".
- Sem erros/warnings no console; sem `any` em tipos públicos; sem `@ts-ignore`.
- Docs do Bun e guias do TypeScript consultados; versão/data registradas no `README.md`.
- `bunx <framework> doctor` lista zero falhas silenciosas não listadas; todo achado é resolvido ou explicitamente aceito.

## DONE WHEN

- Todos os gates passam.
- Entregáveis: monorepo com `packages/framework`, tipos, testes, app de exemplo, README, relatório de performance, review do crítico.
- O app de exemplo demonstra todas as batteries.
- `docs/` atualizado com o prompt, referências e decisões.
- `doctor` não reporta erros escondidos.

## NON-GOALS

- Renderização de frontend / template engine.
- Compatibilidade com Node.js.
- Ecossistema de plugins.
- Ferramentas de deploy.
- MTA SMTP completo (o framework traz um cliente SMTP mínimo, não um servidor de email).
- Drivers de banco de terceiros; apenas os adapters do Bun.SQL (PostgreSQL, MySQL, MariaDB, SQLite).
- Layout de projeto rígido; o framework não impõe um.
- Compatibilidade retroativa antes do 1.0.