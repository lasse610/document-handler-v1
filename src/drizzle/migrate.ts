import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { env } from "../env.mjs";

async function main() {
  const sql = postgres(env.DATABASE_URL, {
    max: 1,
  });
  const db = drizzle(sql);

  await migrate(db, { migrationsFolder: "./src/drizzle/migrations" });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
