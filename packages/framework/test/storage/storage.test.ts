import { describe, expect, it } from "bun:test";
import { LocalStorage, S3Storage } from "#storage";

describe("storage", () => {
  it("Given LocalStorage Then read/write/exists/delete roundtrip", async () => {
    const storage = new LocalStorage();
    await storage.write("hello.txt", "hi");
    expect(await storage.exists("hello.txt")).toBe(true);
    const file = await storage.read("hello.txt");
    expect(file).not.toBeNull();
    expect(await file?.text()).toBe("hi");
    await storage.delete("hello.txt");
    expect(await storage.exists("hello.txt")).toBe(false);
  });

  it("Given LocalStorage read missing file Then null", async () => {
    const storage = new LocalStorage();
    expect(await storage.read("definitely-missing-storage-file.txt")).toBeNull();
  });

  it("Given S3Storage Then adapter shape (sem rede nesse ambiente)", () => {
    const storage = new S3Storage();
    expect(typeof storage.read).toBe("function");
    expect(typeof storage.write).toBe("function");
    expect(typeof storage.exists).toBe("function");
    expect(typeof storage.delete).toBe("function");
  });
});
