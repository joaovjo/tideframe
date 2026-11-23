/**
 * ORM: modelos sobre `Bun.SQL` — query builder, hooks, timestamps, soft deletes.
 * Consultar: https://bun.com/docs/runtime/sql (Bun.SQL; transações via `sql.begin`).
 */

import { SQL, sql } from "bun";

/** Tipo do banco de dados: cliente `SQL` do `bun` (`Bun.SQL`). */
export type Database = SQL;

/** Fragmento SQL interno (resultado de `sql\`...\`` — `SQL.Query<any>`). */
type Fragment = SQL.Query<any>;

/** Definição de coluna. */
export interface Column {
  readonly type: "integer" | "number" | "string" | "boolean" | "datetime" | "json";
  readonly primary?: boolean;
  readonly unique?: boolean;
  readonly notNull?: boolean;
  readonly autoIncrement?: boolean;
  readonly default?: unknown;
}

/** Hooks de ciclo de vida do modelo. */
export interface ModelHooks<Row = Record<string, unknown>> {
  readonly beforeCreate?: (row: Record<string, unknown>) => void | Promise<void>;
  readonly afterCreate?: (row: Row) => void | Promise<void>;
  readonly beforeUpdate?: (changes: Record<string, unknown>, id: string | number) => void | Promise<void>;
  readonly afterUpdate?: (row: Row) => void | Promise<void>;
  readonly beforeDelete?: (id: string | number) => void | Promise<void>;
  readonly afterDelete?: (id: string | number) => void | Promise<void>;
}

/** Opções de `defineModel`. */
export interface ModelOptions<Row = Record<string, unknown>> {
  /** Chave primária (padrão: `id`). */
  readonly primaryKey?: string;
  /** Auto-preenche `createdAt`/`updatedAt` (padrão: `true`). */
  readonly timestamps?: boolean;
  /** Soft delete: `update`/`delete` marcam `deletedAt` (padrão: `false`). */
  readonly softDeletes?: boolean;
  /** Hooks. */
  readonly hooks?: ModelHooks<Row>;
  /** Cliente `SQL` (padrão: `Bun.sql`). */
  readonly database?: Database;
}

/** `Where`: mapa de igualdade por coluna. */
export type Where = Readonly<Record<string, unknown>>;

/** Modelo — criado via [`defineModel`](#definemodel). */
export interface Model<Row = Record<string, unknown>> {
  readonly table: string;
  readonly primaryKey: string;
  readonly columns: Readonly<Record<string, Column>>;
  readonly database: Database;
  readonly timestamps: boolean;
  readonly softDeletes: boolean;
  /** Insere `row` (faz `RETURNING *`). */
  create(row: Partial<Row>): Promise<Row>;
  /** Insere várias linhas. */
  createMany(rows: ReadonlyArray<Partial<Row>>): Promise<Row[]>;
  /** Query builder novo. */
  query(): QueryBuilder<Row>;
  /** Por chave primária. */
  find(id: string | number): Promise<Row | undefined>;
  /** Por `Where` (igualdade). */
  findWhere(where: Where): Promise<Row | undefined>;
  /** Primeira linha do builder. */
  first(): Promise<Row | undefined>;
  /** Todas as linhas do builder. */
  all(): Promise<Row[]>;
  /** Contagem do builder. */
  count(): Promise<number>;
  /** Atualiza por `id` (`RETURNING *`). */
  update(id: string | number, changes: Partial<Row>): Promise<Row | undefined>;
  /** Atualiza por `Where` (`RETURNING *`). */
  updateWhere(where: Where, changes: Partial<Row>): Promise<Row[]>;
  /** Deleta por `id` (soft delete se habilitado). */
  delete(id: string | number): Promise<void>;
  /** Deleta por `Where` — retorna quantidade removida. */
  deleteWhere(where: Where): Promise<number>;
}

/** Query builder — fluent: `where`/`whereIn`/`orderBy`/`limit`/`offset`. */
export interface QueryBuilder<Row = Record<string, unknown>> {
  where(column: string, value: unknown): QueryBuilder<Row>;
  whereIn(column: string, values: readonly unknown[]): QueryBuilder<Row>;
  orderBy(column: string, direction?: "asc" | "desc"): QueryBuilder<Row>;
  limit(n: number): QueryBuilder<Row>;
  offset(n: number): QueryBuilder<Row>;
  first(): Promise<Row | undefined>;
  all(): Promise<Row[]>;
  count(): Promise<number>;
  update(changes: Partial<Row>): Promise<Row[]>;
}

class Builder<Row> implements QueryBuilder<Row> {
  private readonly model: Model<Row>;
  private readonly conditions: Array<{ readonly column: string; readonly value: unknown }> = [];
  private readonly inConditions: Array<{ readonly column: string; readonly values: readonly unknown[] }> = [];
  private readonly orderFragments: Fragment[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(model: Model<Row>) {
    this.model = model;
  }

  where(column: string, value: unknown): QueryBuilder<Row> {
    this.conditions.push({ column, value });
    return this;
  }

  whereIn(column: string, values: readonly unknown[]): QueryBuilder<Row> {
    this.inConditions.push({ column, values });
    return this;
  }

  orderBy(column: string, direction: "asc" | "desc" = "asc"): QueryBuilder<Row> {
    this.orderFragments.push(sql`${sql(column)} ${direction === "desc" ? sql`DESC` : sql`ASC`}`);
    return this;
  }

  limit(n: number): QueryBuilder<Row> {
    this.limitValue = n;
    return this;
  }

  offset(n: number): QueryBuilder<Row> {
    this.offsetValue = n;
    return this;
  }

  async first(): Promise<Row | undefined> {
    return (await this.all())[0];
  }

  async all(): Promise<Row[]> {
    const parts = this.buildParts();
    const query = parts.length === 0
      ? this.model.database`SELECT * FROM ${sql(this.model.table)}`
      : this.model.database`SELECT * FROM ${sql(this.model.table)} ${parts}`;
    return (await query) as Row[];
  }

  async count(): Promise<number> {
    return (await this.all()).length;
  }

  async update(changes: Partial<Row>): Promise<Row[]> {
    const values: Record<string, unknown> = { ...changes };
    const parts = this.buildParts();
    const query = parts.length === 0
      ? this.model.database`UPDATE ${sql(this.model.table)} SET ${sql(values)} RETURNING *`
      : this.model.database`UPDATE ${sql(this.model.table)} SET ${sql(values)} ${parts} RETURNING *`;
    return (await query) as Row[];
  }

  private buildParts(): Fragment[] {
    const conditions: Fragment[] = [
      ...this.conditions.map(({ column, value }) => sql`${sql(column)} = ${value}`),
      ...this.inConditions.map(({ column, values }) => sql`${sql(column)} IN ${sql(values)}`),
    ];
    const parts: Fragment[] = [];
    if (conditions.length > 0) {
      const whereFragments = conditions.map((condition, index) => (index === 0 ? condition : sql`AND ${condition}`));
      parts.push(sql`WHERE ${whereFragments}`);
    }
    for (const fragment of this.orderFragments) {
      parts.push(sql`ORDER BY ${fragment}`);
    }
    if (this.limitValue !== undefined) parts.push(sql`LIMIT ${this.limitValue}`);
    if (this.offsetValue !== undefined) parts.push(sql`OFFSET ${this.offsetValue}`);
    return parts;
  }
}

/** Define um modelo — ver [`Model`](#model). */
export function defineModel<Row = Record<string, unknown>>(
  table: string,
  columns: Record<string, Column>,
  options: ModelOptions<Row> = {},
): Model<Row> {
  const primaryKey = options.primaryKey ?? "id";
  const timestamps = options.timestamps ?? true;
  const softDeletes = options.softDeletes ?? false;
  const hooks = options.hooks ?? {};
  const database = options.database ?? Bun.sql;

  const model: Model<Row> = {
    table,
    primaryKey,
    columns,
    database,
    timestamps,
    softDeletes,

    async create(row: Partial<Row>): Promise<Row> {
      const values: Record<string, unknown> = { ...row };
      await hooks.beforeCreate?.(values);
      if (timestamps) {
        if (columns["createdAt"] !== undefined && values.createdAt === undefined) {
          values.createdAt = new Date().toISOString();
        }
        if (columns["updatedAt"] !== undefined && values.updatedAt === undefined) {
          values.updatedAt = new Date().toISOString();
        }
      }
      for (const [column, def] of Object.entries(columns)) {
        if (values[column] === undefined && def.default !== undefined) {
          const fallback = def.default;
          values[column] = typeof fallback === "function" ? (fallback as () => unknown)() : fallback;
        }
      }
      const result = await database`INSERT INTO ${sql(table)} ${sql(values)} RETURNING *`;
      const inserted = result[0] as Row;
      await hooks.afterCreate?.(inserted);
      return inserted;
    },

    async createMany(rows: ReadonlyArray<Partial<Row>>): Promise<Row[]> {
      const out: Row[] = [];
      for (const row of rows) {
        out.push(await model.create(row));
      }
      return out;
    },

    query(): QueryBuilder<Row> {
      return new Builder<Row>(model);
    },

    async find(id: string | number): Promise<Row | undefined> {
      return model.query().where(primaryKey, id).limit(1).first();
    },

    async findWhere(where: Where): Promise<Row | undefined> {
      const builder = model.query();
      for (const [column, value] of Object.entries(where)) {
        builder.where(column, value);
      }
      return builder.limit(1).first();
    },

    async first(): Promise<Row | undefined> {
      return (await model.query().all())[0];
    },

    async all(): Promise<Row[]> {
      return await model.query().all();
    },

    async count(): Promise<number> {
      return (await model.query().all()).length;
    },

    async update(id: string | number, changes: Partial<Row>): Promise<Row | undefined> {
      await hooks.beforeUpdate?.(changes, id);
      const values: Record<string, unknown> = { ...changes };
      if (timestamps && columns["updatedAt"] !== undefined && values.updatedAt === undefined) {
        values.updatedAt = new Date().toISOString();
      }
      const result = await database`UPDATE ${sql(table)} SET ${sql(values, ...Object.keys(values))} WHERE ${sql(primaryKey)} = ${id} RETURNING *`;
      const updated = result[0] as Row | undefined;
      if (updated !== undefined) await hooks.afterUpdate?.(updated);
      return updated;
    },

    async updateWhere(where: Where, changes: Partial<Row>): Promise<Row[]> {
      const builder = model.query();
      for (const [column, value] of Object.entries(where)) {
        builder.where(column, value);
      }
      return await builder.update(changes);
    },

    async delete(id: string | number): Promise<void> {
      await hooks.beforeDelete?.(id);
      if (softDeletes) {
        await database`UPDATE ${sql(table)} SET ${sql("deletedAt")} = ${new Date().toISOString()} WHERE ${sql(primaryKey)} = ${id}`;
      } else {
        await database`DELETE FROM ${sql(table)} WHERE ${sql(primaryKey)} = ${id}`;
      }
      await hooks.afterDelete?.(id);
    },

    async deleteWhere(where: Where): Promise<number> {
      const conditions: Fragment[] = Object.entries(where).map(([column, value]) => sql`${sql(column)} = ${value}`);
      const whereFragments = conditions.map((condition, index) => (index === 0 ? condition : sql`AND ${condition}`));
      const result = await database`DELETE FROM ${sql(table)} WHERE ${whereFragments}`;
      return Number(result.count ?? 0);
    },
  };
  return model;
}

/** Executa `fn` dentro de uma transação — ver `sql.begin`. */
export async function transaction<T>(database: Database, fn: (tx: Database) => Promise<T>): Promise<T> {
  return await database.begin(fn);
}

/** Cria as tabelas dos modelos via `CREATE TABLE IF NOT EXISTS`. */
export async function migrate(database: Database, models: readonly Model<unknown>[]): Promise<void> {
  for (const model of models) {
    await database.unsafe(buildCreateTableSql(model));
  }
}

function buildCreateTableSql(model: Model<unknown>): string {
  const parts: string[] = [];
  for (const [column, def] of Object.entries(model.columns)) {
    let ddl = `"${column}" ${sqlType(def.type)}`;
    if (def.primary) ddl += " PRIMARY KEY";
    if (def.autoIncrement) ddl += " AUTOINCREMENT";
    if (def.notNull) ddl += " NOT NULL";
    if (def.unique) ddl += " UNIQUE";
    parts.push(ddl);
  }
  return `CREATE TABLE IF NOT EXISTS "${model.table}" (${parts.join(", ")})`;
}

function sqlType(type: Column["type"]): string {
  switch (type) {
    case "integer": return "INTEGER";
    case "number": return "REAL";
    case "string": return "TEXT";
    case "boolean": return "BOOLEAN";
    case "datetime": return "TIMESTAMP";
    case "json": return "JSON";
  }
}
