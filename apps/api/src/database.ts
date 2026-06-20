import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

export type SqlRow = Record<string, unknown>;

export interface SqlResult<T extends SqlRow = SqlRow> {
  rows: T[];
  affectedRows: number;
}

export interface SqlExecutor {
  query<T extends SqlRow = SqlRow>(
    sql: string,
    params?: unknown[]
  ): Promise<SqlResult<T>>;
  exec(sql: string): Promise<void>;
}

export interface DatabaseClient extends SqlExecutor {
  readonly kind: "pglite" | "postgresql";
  ready(): Promise<void>;
  transaction<T>(work: (executor: SqlExecutor) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

class PGliteDatabase implements DatabaseClient {
  readonly kind = "pglite" as const;
  private readonly database: PGlite;

  constructor(dataDirectory?: string) {
    if (dataDirectory && dataDirectory !== "memory://") {
      mkdirSync(dataDirectory, { recursive: true });
    }
    this.database = new PGlite(dataDirectory);
  }

  async ready() {
    await this.database.waitReady;
  }

  async query<T extends SqlRow = SqlRow>(sql: string, params: unknown[] = []) {
    const result = await this.database.query<T>(sql, params);
    return {
      rows: result.rows,
      affectedRows: result.affectedRows ?? 0
    };
  }

  async exec(sql: string) {
    await this.database.exec(sql);
  }

  async transaction<T>(work: (executor: SqlExecutor) => Promise<T>) {
    return this.database.transaction(async (transaction) =>
      work({
        query: async <TRow extends SqlRow = SqlRow>(
          sql: string,
          params: unknown[] = []
        ) => {
          const result = await transaction.query<TRow>(sql, params);
          return {
            rows: result.rows,
            affectedRows: result.affectedRows ?? 0
          };
        },
        exec: async (sql: string) => {
          await transaction.exec(sql);
        }
      })
    );
  }

  async close() {
    await this.database.close();
  }
}

class PostgreSqlDatabase implements DatabaseClient {
  readonly kind = "postgresql" as const;
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000
    });
  }

  async ready() {
    await this.pool.query("select 1");
  }

  async query<T extends SqlRow = SqlRow>(sql: string, params: unknown[] = []) {
    const result = await this.pool.query<T>(sql, params);
    return { rows: result.rows, affectedRows: result.rowCount ?? 0 };
  }

  async exec(sql: string) {
    await this.pool.query(sql);
  }

  async transaction<T>(work: (executor: SqlExecutor) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await work({
        query: async <TRow extends SqlRow = SqlRow>(
          sql: string,
          params: unknown[] = []
        ) => {
          const queryResult = await client.query<TRow>(sql, params);
          return {
            rows: queryResult.rows,
            affectedRows: queryResult.rowCount ?? 0
          };
        },
        exec: async (sql: string) => {
          await client.query(sql);
        }
      });
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

export interface CreateDatabaseOptions {
  connectionString?: string;
  dataDirectory?: string;
  memory?: boolean;
}

const defaultDataDirectory = fileURLToPath(
  new URL("../../../data/postgres", import.meta.url)
);

export function createDatabase(
  options: CreateDatabaseOptions = {}
): DatabaseClient {
  const connectionString = options.connectionString ?? process.env.DATABASE_URL;
  if (connectionString) return new PostgreSqlDatabase(connectionString);

  const dataDirectory = options.memory
    ? "memory://"
    : options.dataDirectory ??
      process.env.RESUME_BUILDER_DATA_DIR ??
      defaultDataDirectory;
  return new PGliteDatabase(dataDirectory);
}
