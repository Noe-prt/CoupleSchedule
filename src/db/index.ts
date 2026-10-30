import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let database: ReturnType<typeof connect> | undefined;
function connect() {
  if (!process.env.DATABASE_URL)
    throw new Error(
      "Database is not configured. Set DATABASE_URL and run npm run db:migrate.",
    );
  return drizzle(
    postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 3,
      idle_timeout: 20,
      connect_timeout: 10,
    }),
    { schema },
  );
}
export function db() {
  return (database ??= connect());
}
