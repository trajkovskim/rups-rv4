import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { questions } from "../db/schema.js";
import { scoreAnswer, scoreCountryAnswer, type LngLat } from "../scoring.js";

const QUESTIONS_PER_GAME = 10;

// Način igre na frontendu in kategorija vprašanj, ki jo uporablja
const gameModeCategories = {
  cities: "capitals",
  countries: "countries",
} as const;

const isGameMode = (value: unknown): value is keyof typeof gameModeCategories =>
  typeof value === "string" && Object.hasOwn(gameModeCategories, value);

const isLngLat = (value: unknown): value is LngLat => {
  const { lng, lat } = (value ?? {}) as Record<string, unknown>;
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 90
  );
};

export const questionsRouter = Router();

questionsRouter.get("/", async (req, res) => {
  const { type } = req.query;
  if (!isGameMode(type)) {
    res.status(400).json({ error: `Parameter type mora biti eden od: ${Object.keys(gameModeCategories).join(", ")}` });
    return;
  }

  // Brez lng in lat, da pravilni odgovor ni viden pred oddajo
  const rows = await db
    .select({
      id: questions.id,
      prompt: questions.prompt,
      hint: questions.hint,
      fact: questions.fact,
    })
    .from(questions)
    .where(eq(questions.category, gameModeCategories[type]))
    .orderBy(sql`random()`)
    .limit(QUESTIONS_PER_GAME);

  res.json(rows);
});

questionsRouter.post("/check", async (req, res) => {
  const { questionId, answer } = (req.body ?? {}) as Record<string, unknown>;
  if (!Number.isInteger(questionId) || !isLngLat(answer)) {
    res.status(400).json({ error: "Telo zahteve mora vsebovati questionId in answer z lng in lat" });
    return;
  }

  const [question] = await db
    .select({ lng: questions.lng, lat: questions.lat, country: questions.country })
    .from(questions)
    .where(eq(questions.id, questionId as number));

  if (!question) {
    res.status(404).json({ error: `Vprašanje ${questionId} ne obstaja` });
    return;
  }

  const { country, ...correctAnswer } = question;
  const score = country
    ? scoreCountryAnswer(answer, correctAnswer, country)
    : scoreAnswer(answer, correctAnswer);

  res.json({ correctAnswer, ...score });
});
