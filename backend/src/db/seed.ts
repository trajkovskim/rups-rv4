import { notInArray, sql } from "drizzle-orm";
import { db, pool } from "./index.js";
import { questions } from "./schema.js";
import { seedQuestions } from "./seedQuestions.js";

// Ob ponovnem zagonu obstoječa vprašanja posodobi in odstrani tista, ki jih ni več v seznamu
try {
  await db.transaction(async (tx) => {
    await tx.delete(questions).where(
      notInArray(
        questions.id,
        seedQuestions.map(({ id }) => id),
      ),
    );
    await tx
      .insert(questions)
      .values(seedQuestions)
      .onConflictDoUpdate({
        target: questions.id,
        set: {
          category: sql`excluded.category`,
          prompt: sql`excluded.prompt`,
          hint: sql`excluded.hint`,
          fact: sql`excluded.fact`,
          answer: sql`excluded.answer`,
          lng: sql`excluded.lng`,
          lat: sql`excluded.lat`,
          country: sql`excluded.country`,
        },
      });
  });

  const count = await db.$count(questions);
  console.log(`Seed uspešen, vprašanj v bazi: ${count}`);
} catch (error) {
  console.error("Seed ni uspel:", error instanceof Error ? error.message : error);
  console.error("Ali baza teče (docker compose up -d db) in ali so migracije izvedene (npm run db:migrate)?");
  process.exitCode = 1;
} finally {
  await pool.end();
}
