import { describe, expect, it } from "bun:test";
import { SQL } from "bun";
import { defineModel, migrate, transaction, type Model } from "#orm";

interface UserRow {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly age: number;
  readonly createdAt: string;
}

const UserSchema = defineModel<UserRow>("users", {
  id: { type: "integer", primary: true, autoIncrement: true },
  name: { type: "string" },
  email: { type: "string", unique: true },
  age: { type: "integer", default: 0 },
  createdAt: { type: "datetime" },
}, { database: new SQL("sqlite://:memory:") });

describe("orm", () => {
  it("Given defineModel + migrate Then create/find/update/delete work", async () => {
    const db = new SQL("sqlite://:memory:");
    const User = defineModel<UserRow>("users", {
      id: { type: "integer", primary: true, autoIncrement: true },
      name: { type: "string" },
      email: { type: "string", unique: true },
      age: { type: "integer", default: 0 },
    }, { database: db });
    await migrate(db, [User]);
    const created = await User.create({ name: "Ada", email: "a@b.c" });
    expect(created.id).toBeGreaterThan(0);
    expect(created.name).toBe("Ada");
    expect(created.age).toBe(0);
    const found = await User.find(created.id);
    expect(found?.name).toBe("Ada");
    expect(await User.find(9999)).toBeUndefined();
    const updated = await User.update(created.id, { name: "Ada Lovelace" });
    expect(updated?.name).toBe("Ada Lovelace");
    await User.delete(created.id);
    expect(await User.find(created.id)).toBeUndefined();
  });

  it("Given query builder Then where/whereIn/limit/all/count/first work", async () => {
    const db = new SQL("sqlite://:memory:");
    const Item = defineModel<{ id: number; name: string }>("items", {
      id: { type: "integer", primary: true, autoIncrement: true },
      name: { type: "string" },
    }, { database: db });
    await migrate(db, [Item]);
    await Item.create({ name: "a" });
    await Item.create({ name: "b" });
    await Item.create({ name: "a" });
    const all = await Item.query().all();
    expect(all.length).toBe(3);
    expect(await Item.query().count()).toBe(3);
    const byName = await Item.query().where("name", "b").first();
    expect(byName?.name).toBe("b");
    const limited = await Item.query().where("name", "a").limit(2).all();
    expect(limited.length).toBe(2);
    const none = await Item.query().where("name", "zzz").first();
    expect(none).toBeUndefined();
    const inFilter = await Item.query().whereIn("name", ["a"]).all();
    expect(inFilter.length).toBe(2);
  });

  it("Given findWhere/updateWhere/deleteWhere/createMany Then work", async () => {
    const db = new SQL("sqlite://:memory:");
    const Item = defineModel<{ id: number; name: string; flag: boolean }>("items2", {
      id: { type: "integer", primary: true, autoIncrement: true },
      name: { type: "string" },
      flag: { type: "boolean", default: false },
    }, { database: db });
    await migrate(db, [Item]);
    const many = await Item.createMany([{ name: "x" }, { name: "y" }]);
    expect(many.length).toBe(2);
    const found = await Item.findWhere({ name: "x" });
    expect(found?.name).toBe("x");
    const updated = await Item.updateWhere({ name: "y" }, { flag: true });
    expect(updated.length).toBe(1);
    const deleted = await Item.deleteWhere({ name: "x" });
    expect(deleted).toBe(1);
    expect(await Item.query().count()).toBe(1);
  });

  it("Given transaction Then rolls back on error", async () => {
    const db = new SQL("sqlite://:memory:");
    const Item = defineModel<{ id: number; name: string }>("items3", {
      id: { type: "integer", primary: true, autoIncrement: true },
      name: { type: "string" },
    }, { database: db });
    await migrate(db, [Item]);
    await transaction(db, async () => {
      await Item.create({ name: "inside" });
      throw new Error("rollback");
    }).catch(() => undefined);
    expect(await Item.all()).toEqual([]);
    await transaction(db, async () => {
      await Item.create({ name: "committed" });
    });
    expect((await Item.all()).map((row) => row.name)).toEqual(["committed"]);
  });

  it("Given timestamps: true Then createdAt/updatedAt are set on create", async () => {
    const db = new SQL("sqlite://:memory:");
    const Note = defineModel<{ id: number; text: string; createdAt: string; updatedAt: string }>("notes", {
      id: { type: "integer", primary: true, autoIncrement: true },
      text: { type: "string" },
      createdAt: { type: "datetime" },
      updatedAt: { type: "datetime" },
    }, { database: db });
    await migrate(db, [Note]);
    const note = await Note.create({ text: "hi" });
    expect(note.createdAt).toBeDefined();
    expect(note.updatedAt).toBeDefined();
  });
});
