/**
 * Benchmarks seguindo https://bun.com/docs/project/benchmarking:
 * - microbenchmarks: medidos com `mitata`, dependência de desenvolvimento;
 * - carga HTTP: `fetch` com semáforos no processo embutido;
 * - cold start: `performance.now()` em torno do `import()` do app.
 *
 * Execução: `bun run benchmarks/bench.ts` — reporta avg, p50, p99, p99.9, max e RSS.
 */

import type { App } from "tideframe/http";
import { createApp } from "tideframe/http";
import { createContainer, Token } from "tideframe/di";
import { object, parse, string } from "tideframe/validate";
import { bench, run } from "mitata";

const app: App = createApp();
app.get("/", (ctx) => ctx.json({ hello: "world" }));
app.get("/health", (ctx) => ctx.json({ status: "ok" }));
const UserSchema = object({ name: string() });
app.post("/users", async (ctx) => {
  const user = parse(UserSchema, await ctx.req.json());
  return ctx.json({ created: true, ...user });
});

function percentile(sorted: readonly number[], p: number): number {
  const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

interface LoadResult {
  readonly requests: number;
  readonly durationMs: number;
  readonly reqPerSec: number;
  readonly p50Ms: number;
  readonly p99Ms: number;
  readonly p99_9Ms: number;
  readonly maxMs: number;
  readonly rssBytes: number;
}

function printLoad(name: string, result: LoadResult): void {
  console.log(
    `${name}: ${result.reqPerSec.toFixed(0)} req/s — avg ${(result.durationMs / result.requests).toFixed(3)} ms, ` +
      `p50 ${result.p50Ms.toFixed(3)} ms, p99 ${result.p99Ms.toFixed(3)} ms, p99.9 ${result.p99_9Ms.toFixed(3)} ms, ` +
      `max ${result.maxMs.toFixed(3)} ms — rss ${(result.rssBytes / 1024 / 1024).toFixed(1)} MB — requests ${result.requests}`,
  );
}

async function loadTest(
  method: string,
  path: string,
  requests: number,
  concurrency: number,
): Promise<LoadResult> {
  const server = app.listen({ port: 0 });
  const url = `http://localhost:${server.port}${path}`;
  const init: RequestInit = method === "POST"
    ? { method, body: JSON.stringify({ name: "Ada" }), headers: { "Content-Type": "application/json" } }
    : { method };
  const latencies: number[] = [];
  try {
    for (let i = 0; i < 50; i++) {
      const warmup = await fetch(url, init);
      await warmup.arrayBuffer();
    }
    let next = 0;
    const worker = async (): Promise<void> => {
      for (;;) {
        const index = next;
        next += 1;
        if (index >= requests) return;
        const start = performance.now();
        const response = await fetch(url, init);
        await response.arrayBuffer();
        latencies.push(performance.now() - start);
      }
    };
    const started = performance.now();
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    const durationMs = performance.now() - started;
    const sorted = [...latencies].sort((a, b) => a - b);
    return {
      requests: latencies.length,
      durationMs,
      reqPerSec: (latencies.length / durationMs) * 1000,
      p50Ms: percentile(sorted, 50),
      p99Ms: percentile(sorted, 99),
      p99_9Ms: percentile(sorted, 99.9),
      maxMs: sorted[sorted.length - 1] ?? 0,
      rssBytes: process.memoryUsage().rss,
    };
  } finally {
    server.stop(true);
  }
}

function microBench(name: string, runs: number, fn: () => void): void {
  bench(name, fn);
}

async function main(): Promise<void> {
  console.log("== microbenchmarks ==");
  const token = new Token<number>("n");
  const container = createContainer();
  container.set(token, 42);
  microBench("di.get(singleton)", 100_000, () => {
    container.get(token);
  });
  microBench("validate.parse(object)", 100_000, () => {
    parse(UserSchema, { name: "Ada" });
  });
  await run({ colors: false });

  console.log("== load (GET /) — 10k requests, 100 concurrent ==");
  const get = await loadTest("GET", "/", 10_000, 100);
  printLoad("GET / (json)", get);

  console.log("== load (POST /users) — 10k requests, 100 concurrent ==");
  const post = await loadTest("POST", "/users", 10_000, 100);
  printLoad("POST /users (validated)", post);

  console.log("== cold start ==");
  const start = performance.now();
  await import("../examples/hello/index");
  console.log(`cold start (import app): ${(performance.now() - start).toFixed(2)} ms`);
}

await main();
