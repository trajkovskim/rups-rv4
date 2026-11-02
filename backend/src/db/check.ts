import { sql } from "drizzle-orm";
import { db, pool } from "./index.js";
import { users } from "./schema.js";

// Hiter preizkus: ali se povežemo z bazo in ali so migracije izvedene
try {
  const { rows } = await db.execute<{ version: string }>(sql`select version()`);
  console.log(`Povezava deluje: ${rows[0].version.split(" on ")[0]}`);

  const count = await db.$count(users);
  console.log(`Tabela users obstaja, uporabnikov: ${count}`);
} catch (error) {
  console.error("Preizkus ni uspel:", error instanceof Error ? error.message : error);
  console.error("Ali baza teče (docker compose up -d db) in ali so migracije izvedene (npm run db:migrate)?");
  process.exitCode = 1;
} finally {
  await pool.end();
}
