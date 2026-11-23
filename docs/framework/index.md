# Framework — tideframe

Backend framework TypeScript 7.x, Bun-first, batteries-included, zero runtime dependencies, frontend-agnostic.

- [Estrutura do Framework](estrutura.md) — monorepo, layout, dependência entre módulos, configuração de empacotamento.
- [Módulos](modulos.md) — tabela de APIs públicas por módulo e decisões/escopo.

## Início rápido

```ts
import { createApp } from "tideframe/http";

const app = createApp();
app.get("/", (ctx) => ctx.json({ hello: "world" }));
app.listen({ port: 3000 });
```

Verificação: `bun run example` (app de exemplo `examples/hello` — smoke test bate em todas as rotas).
