---
type: Concept
title: Estrutura do Framework
description: Monorepo, layout dos módulos, dependência entre eles e a configuração de empacotamento.
tags: [framework, estrutura, monorepo]
sources:
  - id: bun-docs-sql
    resource: https://bun.com/docs/runtime/sql
    title: Bun.SQL
    author: Bun
  - id: bun-docs-test
    resource: https://bun.com/docs/test
    title: Bun Test Runner
    author: Bun
  - id: bun-docs-bench
    resource: https://bun.com/docs/project/benchmarking
    title: Bun Benchmarking
    author: Bun
status: stable
generated:
  by: agent:opencode/v2
  at: 2026-11-23T00:00:00Z
---

# Estrutura do Framework

## Monorepo

```text
package.json            # workspaces: ["packages/*"], private
tsconfig.json           # extends tsconfig.base.json
tsconfig.base.json
packages/
  framework/            # "tideframe"
    package.json        # exports + imports (#*)
    tsconfig.json
    src/                # um index.ts por módulo
      core/ errors/ log/ config/ validate/ di/
      http/ events/ ws/ cache/ queue/ storage/ orm/
      mailer/ auth/ cli/ test/
    test/               # specs BDD por módulo (bun:test)
      core/ errors/ log/ config/ validate/ di/ http/
      events/ ws/ cache/ queue/ storage/ orm/ mailer/ auth/ cli/ test/
examples/
benchmarks/
docs/
```

Todos os módulos embarcam no mesmo `packages/framework`. Um microapp importa
só `tideframe/core` + `tideframe/http`; um app enterprise importa todos. Não há
instalação separada e nenhum layout obrigatório do consumidor.

## Imports

- **Públicos**: `import { createApp } from "tideframe/http"` — via `exports` do package.json.
- **Internos**: `import { ok } from "#core"` — via `imports` (`#`) do package.json.
- **Subpaths internos de testes/CLI**: `#http`, `#http/ctx` (via `#http/*`).

Regra: sem re-export de APIs internas do Bun — APIs públicas são propriedade do framework.

## Dependência entre módulos

```text
core ← errors ← log ← config ← di ← validate ← http
       ← auth ← cache ← queue ← storage ← orm
       ← mailer ← events? — actual: events abaixo de http
       ws ← http
       cli ← (todos)
```

Ordem real (sem ciclos):

```text
core
errors, log, config, di, validate (dependem de core)
http (depende de log, errors, validate, di, http/ws interno)
events, ws (dependem de http — registrados via app.ws)
auth, cache, queue, storage, mailer, orm (dependem de http/errors/core)
cli, test (dependem de tudo relevante)
```

Detalhe técnico: `transaction()` do ORM usa `SQL#begin` (`database.begin(fn)`) do Bun — documentado em `bun.com/docs/runtime/sql#transactions` (consultado em 2026-11-23).

## tsconfig.base.json

```json
{
  "compilerOptions": {
    "strict": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "es2022",
    "lib": ["es2022", "dom", "dom.iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "skipLibCheck": true,
    "types": ["bun"],
    "noEmit": true,
    "allowImportingTsExtensions": true
  }
}
```

## Engenharia de especificação (do repositório)

A especificação canônica (PT-BR) está em [Prompt do Framework](../project/prompt-framework.md)
(tradução de `prompt.txt`); a versão em inglês (`prompt.txt`) é a usada por modelos.
`docs/project/direcao.md` traz os princípios que orientam a implementação (especificação
antes de implementação, aprovação por evidência, crítico independente).

## Versões e doc consultada (Bun/TS)

- **Bun 1.4.5** (Windows 11, 2026-11-23). Docs consultadas: `bun.com/docs/runtime` (runtime), `bun.com/docs/runtime/sql` (Bun.SQL, 2026-11-23), `bun.com/docs/runtime/s3` via bun-mcp (Bun.s3, 2026-11-23), `bun.com/docs/test`, `bun.com/docs/project/benchmarking`.
- **TypeScript 7.0.2** (devDep instalado em 2026-11-23; `bunx tsc --version`). Docs consultadas: devblogs Microsoft "Announcing TypeScript 7.0" (2026-07-08) e "Announcing TypeScript 7.1 Beta" (2026-10-20).
