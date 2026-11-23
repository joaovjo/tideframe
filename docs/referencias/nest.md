---
type: Reference
title: NestJS — Monorepo, DI Modular e Pipeline
description: Framework Node.js 12.6.0 em monorepo ESM; pacotes por runtime, DI modular com escopos, routing com detecção de conflito e testes em três camadas.
resource: exemplos/nest
tags: [nestjs, monorepo, di, modules, routing, middleware, testing, typescript]
sources:
  - id: nest
    resource: exemplos/nest
    title: NestJS 12.6.0
    author: NestJS
generated:
  by: agent:opencode/deepseek-v4.1-flash-free
  at: 2026-11-23T00:00:00Z
status: stable
---

# Resumo

NestJS 12.6.0 (`package.json`, `lerna.json`), ESM puro (`"type": "module"`, Node >= 20). Monorepo npm workspaces: `packages/*` publica dez pacotes por runtime (`common`, `core`, `microservices`, `testing`, `websockets` e cinco `platform-*`); `integration/` (29 apps e2e) e `sample/` (39 apps) ficam fora da publicação. A tese é um grafo de módulos resolvido em runtime por decorators, com o transporte HTTP atrás de adapters (Express 5, Fastify 5, `node:http`).

# Padrões relevantes

- **Monorepo:** workspaces no `package.json`, Lerna só para versionar/publicar; build com `tsc -b` e referências em `packages/tsconfig.json` → `tsconfig.build.json` por pacote, um `tsconfig.json` para IDE e outro para spec.
- **Camadas:** `core` é dividido por responsabilidade, não por feature — `injector/`, `router/`, `middleware/`, `guards/`, `interceptors/`, `pipes/`, `discovery/`, `adapters/`, `errors/`, `inspector/`, `repl/`, `security/`. `common` concentra decorators, interfaces e exceções.
- **DI modular:** `@Module` grava metadata via `Reflect.defineMetadata` (`packages/common/decorators/modules/module.decorator.ts`). `NestContainer`/`ModulesContainer`/`InstanceWrapper` (`packages/core/injector/`) montam o grafo; `Injector` resolve `useClass`/`useValue`/`useFactory`/`useExisting`, `forwardRef` e escopos `DEFAULT`/`REQUEST`/`TRANSIENT`, com providers duráveis e `LazyModuleLoader`. Identidade de módulo dinâmico em `opaque-key-factory/` (referência ou hash profundo).
- **Routing:** `RouterExplorer` + `RoutesResolver` + `RoutePathFactory` (`path-to-regexp` 8) geram paths com prefixo global e versionamento; `RouteSpecificitySorter` ordena rotas estáticas antes de params/wildcards; `RouteConflictDetector` acusa duplicata/sombreada com política `off|warn|error` (`RouteConflictPolicy` em `common/interfaces`). `legacy-route-converter.ts` cobre a migração para Express 5; `request/` dá o contexto por request.
- **Middleware:** `consumer.apply(...).forRoutes(...)` em `middleware/builder.ts`; `container.ts` e `routes-mapper.ts` resolvem paths e métodos; middleware de classe entra no DI, função não.
- **Testes:** 361 specs ao lado do código, Vitest com alias por pacote (`vitest.config.mts`) e plugin que resolve imports `.js` para `.ts`; `integration/` replica apps reais com `_support/register-local-packages.ts`; `@nestjs/testing` expõe `TestingModuleBuilder` com `overrideProvider`/`overrideGuard`/`overrideInterceptor`/`overrideModule` e `createNestApplication`.
- **Type safety:** decorators legados + `emitDecoratorMetadata` (Oxc configurado no Vitest); `strictNullChecks` ligado, mas `noImplicitAny: false`. Validação aceita Standard Schema — Zod 4 e Valibot nos samples 35/36 — além de `class-validator` opcional.

# O que evitar

- Decorators + `reflect-metadata` como mecanismo de DI: dependem de metadata emitida, atrapalham tree-shaking e `erasableSyntaxOnly`, e escondem o grafo.
- `noImplicitAny: false` no tsconfig raiz: a base não é `strict` plena.
- Dez pacotes publicados com peers opcionais e `@nestjs/common/internal` exposto: contrato entre pacotes vaza para o app.
- Dependências de runtime pesadas no essencial (`rxjs`, `iterare`, `path-to-regexp`, `uid`, `fast-safe-stringify`): contraria zero deps.
- CLI fora do repo (`@nestjs/cli`; só há `nest-cli.json` nos samples): build, watch e schematics não são testados aqui.
- `sample/` com 39 apps e versões defasadas (12.5.1) duplica `integration/`; tende a apodrecer.

# Arquivos

- Raiz: `package.json`, `lerna.json`, `tsconfig.json`, `tsconfig.spec.json`, `vitest.config.mts`, `gulpfile.mjs`
- `packages/{common,core,microservices,testing,websockets}/`, `packages/platform-{express,fastify,node,ws,socket.io}/`
- `packages/core/{injector,router,middleware,adapters,discovery,inspector,repl}/`
- `packages/common/{decorators,interfaces,module-utils,pipes,serializer}/`
- `integration/{hello-world,injector,scopes,lazy-modules,route-conflict,versioning,testing-module-override}/`, `_support/`
- `sample/01..39-*/`

# Aplicação no <framework>

- Copiar a organização por capacidade em `packages/*` com subpath exports, mantendo `integration/` como contrato executável entre pacotes; samples, se houver, apontam para a versão local.
- DI por token explícito, sem decorators: módulos declarativos registram providers e escopos `singleton`/`request` no mesmo grafo, com erro claro em dependência circular.
- Adotar ordenação por especificidade e política de conflito de rota (`warn` por padrão, `error` em CI), com versionamento por prefixo; compilar rotas na construção, sem AOT por `new Function`.
- Middleware como função pura com ordem declarada; middleware de classe só se entrar no container.
- Testes em três camadas: unidade por pacote, contrato em `integration/` e tipos compilados (`tsc` + `expect-type`); zero deps obriga substituir `path-to-regexp`, `rxjs` e `reflect-metadata`.
- Entregar CLI (`dev`, `build`, `test`, `generate`) e validação nativa por Standard Schema, sem `class-validator`; `strict: true` desde o início.
