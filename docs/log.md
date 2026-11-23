# Histórico de Atualizações

## 2026-11-23

* **Benchmark**: `oha 1.17.0` integrado ao runner local e aos workflows; desktop registrou 1901.60 req/s em GET / e 1124.73 req/s em POST /users.
* **Update**: benchmark migrado para `mitata`; dependências de desenvolvimento são permitidas e o benchmark segue as ferramentas recomendadas pelo Bun.
* **Update**: política de benchmark — dependências de desenvolvimento são permitidas; microbenchmarks usam `mitata` e carga HTTP/CLI segue ferramentas recomendadas pelo [Bun Benchmarking](https://bun.com/docs/project/benchmarking).
* **Benchmark**: GitHub Actions Ubuntu registrou 23185 req/s em GET / e 24044 req/s em POST /users, com cold start de 10.47 ms.
* **Create**: [Ambiente e Benchmark](project/ambiente-benchmark.md) — registro do Ryzen 5 3400G/Windows 11, metodologia e comparação local Hono/Elysia/Tideframe.
* **Optimize**: rota estática em tabela direta, reutilização de `URL`, resposta sem clone de headers e middleware de segurança síncrono; cold start ~115 ms -> ~38 ms.
* **Workflow**: GitHub Actions para benchmark em push, PR e execução manual.
* **Update**: [Módulos](framework/modulos.md) e [Estrutura](framework/estrutura.md) — documentação de implementação alinhada à nova política de dev deps (Bun, TypeScript e ferramentas de benchmarking do Bun).
* **Update**: [Prompt do Framework](project/prompt-framework.md) e `prompt.txt` — dev deps agora incluem as ferramentas de benchmarking recomendadas pelo Bun (mitata, bombardier, oha, hyperfine).
* **Create**: `prompt.txt` (EN) na raiz com a especificação do framework.
* **Create**: [Prompt do Framework](project/prompt-framework.md) (PT-BR, canônico).
* **Create**: [Referências](referencias/index.md) com análise dos 16 repositórios em `exemplos/`.
* **Implement**: framework `tideframe` — monorepo `packages/framework` com 17 módulos internos (`core, errors, log, config, validate, di, http, events, ws, cache, queue, storage, orm, mailer, auth, cli, test`).
* **Create**: [Estrutura do Framework](framework/estrutura.md) e [Módulos](framework/modulos.md).
* **Create**: `README.md` com uso, módulos, benchmark e versões/doc consultada.
* **Tests**: `bun test packages/framework/test` — todos verdes; `bunx tsc --noEmit` limpo.
* **Example**: `examples/hello` — app de exemplo que demonstra as baterias (http, validate, di, log, cache, queue, events, storage, auth, orm); smoke hits todas as rotas — `bun run examples/hello/smoke.ts`.
* **Benchmark**: `benchmarks/bench.ts` — microbenchmarks + carga HTTP conforme `https://bun.com/docs/project/benchmarking`; resultados registrados no README.
* **Fix**: `LocalStorage.delete` usado antes da leitura no rota `/storage` do exemplo.

## 2026-11-22

* **Init**: Criação do bundle `docs` e das seções `prompt-engineering` e `project`.
* **Create**: [Princípios de Prompt Engineering](prompt-engineering/principios.md).
* **Create**: [Abyssal Garden — Estudo de Caso](prompt-engineering/estudo-de-caso-abyssal-garden.md).
* **Create**: [Fragilidades e Lacunas do Formato](prompt-engineering/fragilidades-e-lacunas.md).
* **Create**: [Direção do Projeto](project/direcao.md).
* **Create**: [Gestão do Banco de Conhecimento](project/gestao-do-conhecimento.md).
* **Create**: `AGENTS.md` na raiz com as regras de uso do bundle.
* **Benchmark**: integração oficial de `oha` para carga HTTP externa via `cargo install oha --locked` e `bun run bench:oha`; microbenchmarks continuam em `mitata`.