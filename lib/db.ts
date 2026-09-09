import mysql, {
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as {
  cyberStorePool?: mysql.Pool;
};

export const db =
  globalForDb.cyberStorePool ??
  mysql.createPool({
    ...env.db,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    decimalNumbers: true,
    dateStrings: false,
    charset: "utf8mb4",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.cyberStorePool = db;
}

export async function rows<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  values: unknown[] = [],
): Promise<T[]> {
  const [result] = await db.execute<T[]>(sql, values as never[]);
  return result;
}

export async function row<T extends RowDataPacket = RowDataPacket>(
  sql: string,
  values: unknown[] = [],
): Promise<T | null> {
  const result = await rows<T>(sql, values);
  return result[0] ?? null;
}

export async function execute(
  sql: string,
  values: unknown[] = [],
): Promise<ResultSetHeader> {
  const [result] = await db.execute<ResultSetHeader>(sql, values as never[]);
  return result;
}

export interface TransactionDb {
  rows<T extends RowDataPacket = RowDataPacket>(
    sql: string,
    values?: unknown[],
  ): Promise<T[]>;
  row<T extends RowDataPacket = RowDataPacket>(
    sql: string,
    values?: unknown[],
  ): Promise<T | null>;
  execute(sql: string, values?: unknown[]): Promise<ResultSetHeader>;
  connection: PoolConnection;
}

export async function transaction<T>(
  callback: (tx: TransactionDb) => Promise<T>,
): Promise<T> {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  const tx: TransactionDb = {
    connection,
    async rows<R extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []): Promise<R[]> {
      const [result] = await connection.execute<R[]>(sql, values as never[]);
      return result;
    },
    async row<R extends RowDataPacket = RowDataPacket>(sql: string, values: unknown[] = []): Promise<R | null> {
      const [result] = await connection.execute<R[]>(sql, values as never[]);
      return result[0] ?? null;
    },
    async execute(sql: string, values: unknown[] = []): Promise<ResultSetHeader> {
      const [result] = await connection.execute<ResultSetHeader>(sql, values as never[]);
      return result;
    },
  };

  try {
    const value = await callback(tx);
    await connection.commit();
    return value;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function healthcheck() {
  const startedAt = Date.now();
  const result = await row<{ ok: number } & RowDataPacket>("SELECT 1 AS ok");
  return { ok: result?.ok === 1, latencyMs: Date.now() - startedAt };
}
