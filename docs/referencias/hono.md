---
type: Reference
title: Hono — Core sobre Web Standards com Adapters por Runtime
description: Framework web pequeno e sem dependências de runtime, com core único sobre Request/Response, roteadores plugáveis, middleware isolado, adapters por runtime e benchmarks separados.
resource: exemplos/hono
tags: [hono, web-standards, fetch, adapters, routers, middleware, benchmarks, bun]
sources:
  - id: hono
    resource: exemplos/hono
    title: Hono 4.13.21
    author: Hono
generated:
  by: agent:opencode/deepseek-v4.1-flash-free
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework HTTP (v4.13.21) sem dependências de runtime, cujo núcleo é uma função `fetch(Request) -> Response`. Um único pacote em `src/` cobre routing, contexto, middleware, validação, JSX e client; `adapters/*` são pacotes à parte publicados com `peerDependencies: hono`. O escopo para em HTTP: não há ORM, auth, filas, CLI nem migrations.

# Padrões relevantes

- **Core mínimo:** `src/hono-base.ts` define a classe base sem router; `src/hono.ts` só escolhe `SmartRouter([RegExpRouter, TrieRouter])` e `src/preset/{tiny,quick}.ts` trocam o router. `fetch()` (linha ~498) é a única porta de entrada; `request()` reutiliza o mesmo caminho com `Request` sintético, o que torna testes sem socket triviais.
- **Web Standards:** não existe abstração própria de request/response; `Context` envolve `Request`/`Response` e `HonoRequest` guarda o `raw: Request` mais cache de body (`src/request.ts`). `HEAD` é resolvido despachando `GET` e descartando o corpo (`src/hono-base.ts`, ~432).
- **Routing plugável:** interface `Router` em `src/router.ts` com cinco implementações (`reg-exp`, `trie`, `pattern`, `linear`, `smart`). `SmartRouter` acumula rotas, tenta cada router no primeiro `match` e então troca o próprio método pelo vencedor (`src/router/smart-router/router.ts`, ~46), caindo para o próximo em `UnsupportedPathError`.
- **Middleware:** `src/compose.ts` é um compose estilo Koa, com guarda contra `next()` duplo, `onError`/`onNotFound` e exigência de `context.finalized`. Cada middleware é um diretório autocontido com `index.ts` em `src/middleware/*`; `use()` aceita caminho e múltiplos handlers.
- **Despacho rápido:** requisição com um único handler ignora o compose (`src/hono-base.ts`, ~448); `#addRoute` grava a rota no router e em `this.routes`, usado por `route()`/`mount()` para espelhar sub-apps via wildcard (`~401`).
- **Estrutura de pacote:** `package.json` expõe ~90 subpaths (`.` mais uma capacidade por import) e `jsr.json` replica o mesmo mapa apontando para `src/*.ts`, permitindo publicar no JSR sem build. `tsconfig.base.json` (`composite`, ES2022) é dividido em `tsconfig.build.json` (emite `.d.ts` para `dist/types`) e `tsconfig.spec.json` (`noEmit`, `vitest/globals`).
- **Adapters:** `adapters/bun` é um pacote próprio com `peerDependencies: hono`, build e teste independentes; o adapter em `src/adapter/bun/` está marcado `@deprecated` e sai no v5. `@hono/node-server` é a única peça que abre socket.
- **Testes:** `*.test.ts` convive com o código; suíte de tipos separada. `runtime-tests/{bun,node,deno,workerd,fastly}` exercitam cada runtime, com Bun via `bun test --jsx-import-source ../../src/jsx runtime-tests/bun`. `src/helper/testing` monta um `testClient` tipado sobre `hc` + `app.request`.
- **Benchmarks:** pastas isoladas (`benchmarks/fetch`, `routers`, `jsx`, `http-server`), cada uma com seu `package.json`/lockfile; `benchmarks/fetch/compare.sh` compara working tree com um git ref em processos novos e mede a mediana de rodadas.

# O que evitar

- Um pacote com ~90 subpaths e adapters de oito runtimes no mesmo repositório: superfície grande para um framework Bun-first.
- Manter adapters dentro do core até depreciá-los (caso `src/adapter/bun`): separar desde o início.
- Cinco roteadores e escolha adiada no primeiro `match`; o fallback silencioso e o erro `Fatal error` dificultam diagnóstico. Escolher um router.
- JSX, JSX-DOM e client dentro do pacote de servidor: contraria frontend-agnóstico.
- 27 middlewares com utilitários repetidos: baterias devem formar módulos coerentes, não uma pasta por header.
- Benchmark com lockfile por pasta: deriva de dependências; usar um workspace só.
- Escopo HTTP puro: sem ORM, auth, filas, CLI ou config — nada disso deve ser esperado do core.

# Arquivos

- `src/hono-base.ts`, `src/hono.ts`, `src/preset/{tiny,quick}.ts`, `src/compose.ts`, `src/context.ts`, `src/request.ts`
- `src/router.ts`, `src/router/{reg-exp,trie,pattern,linear,smart}-router/`
- `src/middleware/*`, `src/helper/{factory,testing,route,websocket}/`, `src/validator/`
- `src/adapter/*`, `adapters/bun/`, `package.json`, `jsr.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.build.json`, `tsconfig.spec.json`, `bunfig.toml`
- `benchmarks/{fetch,routers,jsx,http-server}/`, `runtime-tests/{bun,node,deno,workerd}/`, `perf-measures/`

# Aplicação no <framework>

- Copiar o core: um `fetch(Request, env, ctx) -> Response` como contrato único, adiando socket, TLS e static para o adapter Bun.
- Um roteador só (radix/trie), decidido na construção do app, sem AOT e sem seleção adiada; rotas expostas para introspecção e `mount`.
- Middleware como compose com guarda de `next()`, erro central e checagem de resposta final; cada middleware num módulo com subpath próprio.
- Pacote raiz enxuto e capacidades em subpaths (`./orm`, `./auth`, `./queue`, `./cli`), todos com dependências explícitas; zero deps no core.
- Testes em duas camadas: handler chamado com `Request` (sem socket) e suíte por runtime, com um comando Bun dedicado; tipos compilados à parte.
- Benchmarks em workspace único, com script que compara refs em processos novos e reporta mediana — evidência para a diretriz de quantificar.
- Rejeitar JSX/DOM/client e adapters não-Bun: manter o framework frontend-agnóstico e focado no runtime alvo.
