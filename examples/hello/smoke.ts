/**
 * Smoke test do app de exemplo: inicia o app, hita cada rota e verifica
 * status 200. Execução: `bun run examples/hello/smoke.ts`.
 */

import { app } from "./index";

interface Check {
  readonly method: string;
  readonly path: string;
  readonly status: number;
}

const checks: readonly Check[] = [
  { method: "GET", path: "/", status: 200 },
  { method: "GET", path: "/health", status: 200 },
  { method: "GET", path: "/greet", status: 200 },
  { method: "GET", path: "/users-count", status: 200 },
  { method: "GET", path: "/storage", status: 200 },
  { method: "GET", path: "/cache", status: 200 },
  { method: "GET", path: "/queue", status: 200 },
  { method: "GET", path: "/events", status: 200 },
  { method: "POST", path: "/users", status: 200 },
  { method: "POST", path: "/login", status: 200 },
];

async function main(): Promise<number> {
  const server = app.listen({ port: 0 });
  const base = `http://localhost:${server.port}`;
  let failures = 0;
  try {
    for (const { method, path, status } of checks) {
      const init: RequestInit = method === "POST" && path === "/users"
        ? { method, body: JSON.stringify({ name: "Ada", age: 36 }), headers: { "Content-Type": "application/json" } }
        : { method };
      const response = await fetch(base + path, init);
      if (response.status !== status) {
        console.error(`FAIL ${method} ${path}: expected ${status}, got ${response.status}`);
        failures++;
      } else {
        console.log(`ok ${method} ${path} -> ${response.status}`);
      }
    }
  } finally {
    server.stop(true);
  }
  if (failures > 0) {
    console.error(`smoke FAILED (${failures} failures)`);
    return 1;
  }
  console.log("smoke OK");
  return 0;
}

process.exit(await main());
