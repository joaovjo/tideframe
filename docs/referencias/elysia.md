---
type: Reference
title: Elysia — Lifecycle Tipado sobre Bun
description: Framework Bun-first com schema como fonte única de tipos e validação, cadeia de hooks e adapters de runtime; sem ORM, auth, filas ou CLI no core.
resource: exemplos/elysia
tags: [elysia, bun, typescript, type-safety, lifecycle, plugins, adapters]
sources:
  - id: elysia
    resource: exemplos/elysia
    title: Elysia 1.4.32
    author: Elysia
generated:
  by: agent:opencode/deepseek-v4.1-flash-free
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

Framework HTTP Bun-first, versão 1.4.32, em pacote único (`src/`, `test/`, `example/`). A tese central é o schema como fonte única: a mesma definição gera validação em runtime, tipos TypeScript e documentação. O core cobre routing, hooks, WebSocket e adapters; ORM, auth, filas e CLI ficam em plugins externos (`@elysiajs/*`), não neste repositório.

# Padrões relevantes

- **Routing:** árvore de rotas em `memoirist`, instanciada em `src/index.ts` (`~http` para AOT, `~dynamic` para JIT). Rotas estáticas viram tabela separada e respostas estáticas são delegadas ao Bun (`static`, `nativeStaticResponse`); parâmetros opcionais são expandidos em `src/adapter/bun/index.ts`.
- **Middleware:** cadeia fixa de lifecycle em `src/compose.ts` (`onRequest` → `onParse` → `onTransform` → `resolve` → `onBeforeHandle` → handler → `onAfterHandle` → `mapResponse` → `onAfterResponse`, com `onError`, `onStart`/`onStop`). Hooks locais aceitam array por rota; `guard`/`group` aplicam escopo e `as('global'|'scoped')` promove hooks (`src/index.ts`).
- **Composição:** `macro` empacota um conjunto de hooks ativado por flag na rota (`test/macro/macro.test.ts`), evitando repetir guards. Plugins são instâncias com `name`/`seed` e deduplicação por checksum.
- **DI sem container:** `state` (store mutável global), `decorate` (valor por instância), `derive` (por request) e `resolve` (uma vez por request, antes da validação). A injeção é feita pelo objeto de contexto e inferida via o genérico `Singleton` em `src/index.ts`/`src/types.ts`; não há tokens nem grafo de dependências.
- **Type safety:** `src/schema.ts` aceita TypeBox e Standard Schema (Zod, Valibot, ArkType) com provider `'typebox' | 'standard'`; `t.Transform` e `encodeSchema` convertem entrada/saída; respostas são validadas por status. `src/type-system/` cobre coerção e formatos.
- **WebSockets:** `app.ws(path, handler)` com `open`/`message`/`close`/`drain`, `subscribe`/`publish` e validação de mensagem e resposta (`src/ws/index.ts`, `src/ws/bun.ts`); o adapter repassa `websocket` ao `Bun.serve` (`src/adapter/bun/index.ts`).
- **Config:** objeto único `ElysiaConfig` em `src/types.ts` (`prefix`, `serve`, `websocket`, `cookie`, `aot`, `precompile`, `strictPath`, `normalize`, `nativeStaticResponse`, `allowUnsafeValidationDetails`), com defaults conservadores.
- **Erros e observabilidade:** hierarquia tipada e `status()` em `src/error.ts`; `app.trace` emite eventos `begin`/`end` por etapa (`src/trace.ts`).
- **Testes:** `bun:test`, uma pasta por área (`test/core`, `test/lifecycle`, `test/validator`, `test/ws`, `test/plugins`). Handlers são exercitados via `app.handle(new Request(...))` com helpers em `test/utils.ts`, sem abrir socket. Tipos têm suíte própria em `test/types/**`, compilada por `tsconfig.test.json` com `expect-type`. Há smoke tests separados para Node CJS/ESM e Cloudflare Worker.
- **Pacote:** `exports` com subpaths (`./ws`, `./compose`, `./adapter/bun`, `./universal`, `./type-system`) para import granular; `build.ts` usa tsup (ESM+CJS) e `tsc` para `.d.ts`; três tsconfigs (src, dts, test) e `knip.json` para código morto. `example/` tem um arquivo por feature.

# O que evitar

- `src/index.ts` com ~8 mil linhas: concentra classe, rotas, hooks e tipos. Difícil de navegar e revisar; dividir por responsabilidade.
- Codegen e JIT em runtime: `src/sucrose.ts` analisa o corpo de funções e `src/dynamic-handle.ts` gera handlers; `src/manifest.ts` (gerador de rotas) está comentado. Custo alto de manutenção para ganho marginal.
- Deduplicação de plugin por checksum/`seed` é mágica implícita; registro explícito é previsível.
- `state` é store global mutável compartilhado entre requests: risco de vazamento de dados.
- Camada `src/universal/` e adapters para Web Standards/Cloudflare só se justificam por portabilidade; um framework Bun-first não precisa pagar esse custo.
- Quatro dependências de runtime (`memoirist`, `cookie`, `exact-mirror`, `fast-decode-uri-component`) contrariam zero deps.
- Escopo incompleto: não há ORM, auth, filas, CLI, migrations nem loader de config.

# Arquivos

- `src/index.ts`, `src/types.ts`, `src/context.ts`, `src/compose.ts`, `src/dynamic-handle.ts`
- `src/adapter/{bun,web-standard,cloudflare-worker}/`, `src/universal/`
- `src/ws/`, `src/schema.ts`, `src/type-system/`, `src/error.ts`, `src/trace.ts`, `src/sucrose.ts`
- `build.ts`, `package.json`, `tsconfig.json`, `tsconfig.dts.json`, `tsconfig.test.json`, `knip.json`
- `test/<área>/`, `test/types/`, `test/node/{cjs,esm}/`, `test/cloudflare/`, `example/`

# Aplicação no <framework>

- Copiar o melhor: schema único para validação + tipos + OpenAPI, lifecycle em cadeia com hooks locais em array, `macro` para bundles reutilizáveis e subpath exports por capacidade.
- Routing próprio (radix tree) com tabela estática e `strictPath` opcional, mas sem AOT por `new Function`; compilar handlers na construção do app.
- DI explícita por token para ORM, filas e serviços; `derive`/`resolve` apenas para dados de request. Não replicar `state` global mutável.
- Entregar nativamente o que Elysia terceiriza: ORM, auth, filas, CLI, migrations e config validada — cada um em subpath (`./orm`, `./auth`, `./queue`, `./cli`).
- Testes em duas camadas: comportamento chamando o handler com `Request` (sem socket) e tipos compilados por `tsc` com `expect-type`; uma pasta por área.
- Config central e declarativa, com validação e defaults; sem deduplicação por checksum.
