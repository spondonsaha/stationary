import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Connection pooling is handled by postgres.js. For PgBouncer in transaction
 * mode append ?prepare=false to DATABASE_URL (see .env.example).
 */
const globalForDb = globalThis as unknown as {
  sqlClient: ReturnType<typeof postgres> | undefined;
};

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    // Friendly errors include the query position in dev only.
    debug: false,
  });
}

const sql = globalForDb.sqlClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.sqlClient = sql;

export const db = drizzle(sql, { schema });
export type Db = typeof db;
