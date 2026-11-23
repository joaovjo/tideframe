---
type: BenchmarkReport
title: Ambiente e Benchmark do Tideframe
description: Hardware local, metodologia de carga e resultados comparativos dos benchmarks HTTP.
tags: [benchmark, performance, windows, bun, hono, elysia]
status: stable
---

# Ambiente

Os benchmarks locais foram executados em Windows 11 Professional x64, build 26300.10075.

- CPU: AMD Ryzen 5 3400G, 4 cores / 8 threads, 12 nm
- Cache: 4 x 32 KB L1D, 4 x 512 KB L1I, 4 x 512 KB L2 e 4 MB L3
- Memória: 16 GB DDR4, dois módulos PNY/Sk Hynix de 8 GB
- Runtime: Bun 1.4.5
- TypeScript: 7.0.2

O arquivo bruto `WIN11.txt` é específico do ambiente e não deve ser versionado.

# Metodologia

As cargas de comparação usam o [`oha`](https://github.com/hatoo/oha), instalação oficial via Cargo. Microbenchmarks usam `mitata`. O benchmark integrado pode ser executado com `bun run bench:oha`.

- GET: `GET /`, resposta JSON `{"hello":"world"}`
- POST: `POST /users`, JSON `{"name":"Ada"}`
- Cada servidor foi iniciado em processo separado.
- Os resultados são de uma execução local nesta máquina; variações podem alterar a ordem numérica.

# Resultados

| Framework | GET req/s | POST req/s |
|---|---:|---:|
| Hono 4.13.21 | 3590 | 3617 |
| Tideframe 0.1.0 | 3553 | 3445 |
| Elysia 1.4.32 | 2174 | 2141 |

O Tideframe ficou cerca de 1% abaixo de Hono no GET e 5% abaixo no POST. Superou Elysia em cerca de 63% nos dois casos.

Na carga real com `oha 1.17.0`, o desktop obteve 1901.60 req/s no GET e 1124.73 req/s no POST, com 100 conexões e 10 mil requisições por rota. A latência p50 foi 25.0 ms no GET e 38.8 ms no POST.

# GitHub Actions

Uma execução reproduzível no runner Ubuntu do workflow `Benchmark`, usando `oha 1.17.0`, registrou:

- GET `/`: 13564.59 req/s, média 7.28 ms, p50 7.06 ms, p99 19.25 ms
- POST `/users`: 14176.42 req/s, média 6.97 ms, p50 6.10 ms, p99 14.72 ms
- Microbenchmarks `mitata`: DI 12.65 ns/iter, validação 216.01 ns/iter

# Otimizações aplicadas

- Roteamento direto por chave `method pathname` para rotas estáticas.
- Reutilização da instância `URL` entre lookup e criação de contexto.
- Resposta sem clonagem de `Headers` quando não há `ResponseInit`.
- Middleware de headers de segurança síncrono no núcleo da request.
- Cold start medido caiu de aproximadamente 115 ms para 38 ms após as otimizações.
