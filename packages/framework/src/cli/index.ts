/**
 * CLI do framework: `routes <appFile>` e `doctor <files>` — ver `runCli`.
 */

import type { App } from "#http";
import { pathToFileURL } from "node:url";

/** Descoberta de catches vazios — sem mudar nada. */
export interface DoctorFinding {
  readonly file: string;
  readonly line: number;
  readonly message: string;
}

/** Encontra catches vazios (`catch { }`) em `files`. */
export async function doctorFiles(files: readonly string[]): Promise<DoctorFinding[]> {
  const findings: DoctorFinding[] = [];
  for (const file of files) {
    const text = await Bun.file(file).text();
    const pattern = /catch\s*(\([^)]*\))?\s*\{\s*\}/g;
    let match: RegExpExecArray | null = pattern.exec(text);
    while (match !== null) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.push({ file, line, message: "Empty catch block — add logging or rethrow" });
      match = pattern.exec(text);
    }
  }
  return findings;
}

async function runRoutes(args: readonly string[]): Promise<number> {
  const appPath = args[1];
  if (appPath === undefined) {
    console.error("Usage: routes <appFile>");
    return 1;
  }
  const module = await import(pathToFileURL(appPath).href);
  const app = (module as { app?: App }).app;
  if (app === undefined) {
    console.error(`No "app" export found in ${appPath}`);
    return 1;
  }
  for (const route of app.routes()) {
    console.log(`${route.method} ${route.pattern}`);
  }
  return 0;
}

async function runDoctor(args: readonly string[]): Promise<number> {
  const findings = await doctorFiles(args.slice(1));
  if (findings.length === 0) {
    console.log("No silent failures found.");
    return 0;
  }
  for (const finding of findings) {
    console.log(`${finding.file}:${finding.line}: ${finding.message}`);
  }
  return 1;
}

/** Executa o CLI do framework — ver `runCli` — `routes <appFile>` / `doctor <files>`. */
export async function runCli(args: readonly string[]): Promise<number> {
  const command = args[0];
  if (command === undefined) {
    console.log("tideframe CLI — usage: routes <appFile> | doctor <files>");
    return 0;
  }
  if (command === "routes") return await runRoutes(args);
  if (command === "doctor") return await runDoctor(args);
  console.error(`Unknown command: ${command}`);
  return 1;
}
