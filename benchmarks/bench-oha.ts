/**
 * Carga HTTP externa usando oha.
 *
 * Requer o binário oficial `oha`: https://github.com/hatoo/oha
 * Instalação local: cargo install oha --locked
 */

const port = 3456;
const hostname = "127.0.0.1";

async function runOha(args: readonly string[]): Promise<void> {
  const process = Bun.spawn(["oha", ...args], {
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await process.exited;
  if (exitCode !== 0) throw new Error(`oha exited with code ${exitCode}`);
}

async function main(): Promise<void> {
  const server = Bun.spawn(["bun", "run", "benchmarks/server.ts"], {
    cwd: process.cwd(),
    env: { ...process.env, BENCH_PORT: String(port), BENCH_MODE: "framework" },
    stdout: "pipe",
    stderr: "inherit",
  });

  try {
    await Bun.sleep(500);

    console.log("== oha (GET /) — 10k requests, 100 concurrent ==");
    await runOha([
      "--no-tui",
      "--output-format",
      "text",
      "-n",
      "10000",
      "-c",
      "100",
      `http://${hostname}:${port}/`,
    ]);

    console.log("== oha (POST /users) — 10k requests, 100 concurrent ==");
    await runOha([
      "--no-tui",
      "--output-format",
      "text",
      "-n",
      "10000",
      "-c",
      "100",
      "-m",
      "POST",
      "-H",
      "content-type: application/json",
      "-d",
      '{"name":"Ada"}',
      `http://${hostname}:${port}/users`,
    ]);
  } finally {
    server.kill();
    await server.exited;
  }
}

export { main };
await main();
