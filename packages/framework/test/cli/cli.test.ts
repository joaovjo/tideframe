import { describe, expect, it } from "bun:test";
import { doctorFiles, runCli } from "#cli";

describe("cli", () => {
  it("Given doctorFiles with an empty catch Then it is found", async () => {
    const path = "cli-doctor-fixture.txt";
    await Bun.write(path, "async function f() { try { 1; } catch (e) {} }\n");
    const findings = await doctorFiles([path]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.file).toBe(path);
    await Bun.file(path).unlink();
  });

  it("Given doctorFiles with a non-empty catch Then it is not found", async () => {
    const path = "cli-doctor-fixture2.txt";
    await Bun.write(path, "async function f() { try { 1; } catch (e) { console.error(e); } }\n");
    const findings = await doctorFiles([path]);
    expect(findings).toHaveLength(0);
    await Bun.file(path).unlink();
  });

  it("Given runCli routes with a fixture app Then it prints routes and returns 0", async () => {
    const path = "cli-routes-fixture.ts";
    await Bun.write(
      path,
      'import { createApp } from "tideframe/http"; export const app = createApp(); app.get("/a", (ctx) => ctx.text("a")); app.post("/b", (ctx) => ctx.text("b"));',
    );
    expect(await runCli(["routes", path])).toBe(0);
    await Bun.file(path).unlink();
  });

  it("Given runCli routes without an app export Then returns 1", async () => {
    const path = "cli-routes-fixture2.ts";
    await Bun.write(path, "export const notApp = 1;");
    expect(await runCli(["routes", path])).toBe(1);
    await Bun.file(path).unlink();
  });

  it("Given runCli without args Then prints help and returns 0", async () => {
    expect(await runCli([])).toBe(0);
  });
});
