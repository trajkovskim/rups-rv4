import { notInArray, sql } from "drizzle-orm";
import { db, pool } from "./index.js";
import { guessCountries, questions } from "./schema.js";
import { seedGuessCountries } from "./seedGuessCountries.js";
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

    await tx.delete(guessCountries).where(
      notInArray(
        guessCountries.id,
        seedGuessCountries.map(({ id }) => id),
      ),
    );
    await tx
      .insert(guessCountries)
      .values(seedGuessCountries)
      .onConflictDoUpdate({
        target: guessCountries.id,
        set: {
          name: sql`excluded.name`,
          mapCountries: sql`excluded.map_countries`,
          aliases: sql`excluded.aliases`,
        },
      });
  });

  const count = await db.$count(questions);
  const countryCount = await db.$count(guessCountries);
  console.log(`Seed uspešen, vprašanj v bazi: ${count}, držav za ugibanje: ${countryCount}`);
} catch (error) {
  console.error("Seed ni uspel:", error instanceof Error ? error.message : error);
  console.error("Ali baza teče (docker compose up -d db) in ali so migracije izvedene (npm run db:migrate)?");
  process.exitCode = 1;
} finally {
  await pool.end();
}
