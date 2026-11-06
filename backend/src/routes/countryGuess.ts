import { and, asc, eq, ne, sql } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { countryGuessGames, countryGuessRounds, guessCountries } from "../db/schema.js";
import { isAcceptedCountryName } from "../countryGuess.js";

const QUESTIONS_PER_GAME = 10;
const MAX_ANSWER_LENGTH = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });

// Zaklene igro, da se hkratni zahtevi za isto igro ne prepletata
const lockGame = async (tx: Transaction, gameId: string) => {
  const [game] = UUID_PATTERN.test(gameId)
    ? await tx.select().from(countryGuessGames).where(eq(countryGuessGames.id, gameId)).for("update")
    : [];
  if (!game) {
    throw httpError(404, `Igra ${gameId} ne obstaja`);
  }
  return game;
};

const lockRunningGame = async (tx: Transaction, gameId: string) => {
  const game = await lockGame(tx, gameId);
  if (game.finishedAt) {
    throw httpError(409, "Igra je že končana");
  }
  if (game.pausedAt) {
    throw httpError(409, "Igra je začasno ustavljena");
  }
  return game;
};

const pendingRounds = (tx: Transaction, gameId: string) =>
  tx
    .select({
      position: countryGuessRounds.position,
      countryId: countryGuessRounds.countryId,
      name: guessCountries.name,
      aliases: guessCountries.aliases,
    })
    .from(countryGuessRounds)
    .innerJoin(guessCountries, eq(countryGuessRounds.countryId, guessCountries.id))
    .where(and(eq(countryGuessRounds.gameId, gameId), eq(countryGuessRounds.status, "pending")))
    .orderBy(asc(countryGuessRounds.position));

type PendingRound = Awaited<ReturnType<typeof pendingRounds>>[number];

// Igralec lahko odgovarja samo na trenutno državo, zato se vrstni red igre ne more pokvariti
const requireCurrentRound = (pending: PendingRound[], questionId: unknown) => {
  const [round] = pending;
  if (!round || round.countryId !== questionId) {
    throw httpError(409, `Država ${questionId} ni trenutno vprašanje te igre`);
  }
  return round;
};

const endRound = async (
  tx: Transaction,
  gameId: string,
  pending: PendingRound[],
  status: "correct" | "skipped",
  lastAnswer?: string,
) => {
  const [round, ...remaining] = pending;
  await tx
    .update(countryGuessRounds)
    .set({ status, ...(lastAnswer === undefined ? {} : { lastAnswer }) })
    .where(and(eq(countryGuessRounds.gameId, gameId), eq(countryGuessRounds.position, round.position)));

  const finished = remaining.length === 0;
  if (finished) {
    await tx.update(countryGuessGames).set({ finishedAt: new Date() }).where(eq(countryGuessGames.id, gameId));
  }
  return { isCorrect: status === "correct", correctAnswer: round.name, finished };
};

export const countryGuessRouter = Router();

// Generira novo igro z naključnimi državami. Imena za odgovor ne pošlje, mapCountries pa frontend rabi za označevanje.
countryGuessRouter.post("/games", async (_req, res) => {
  const result = await db.transaction(async (tx) => {
    const countries = await tx
      .select({ id: guessCountries.id, mapCountries: guessCountries.mapCountries })
      .from(guessCountries)
      .orderBy(sql`random()`)
      .limit(QUESTIONS_PER_GAME);
    if (countries.length === 0) {
      throw httpError(503, "V bazi ni držav. Poženi npm run db:seed.");
    }

    const [game] = await tx.insert(countryGuessGames).values({}).returning({ id: countryGuessGames.id });
    await tx.insert(countryGuessRounds).values(
      countries.map(({ id }, position) => ({ gameId: game.id, position, countryId: id })),
    );

    return {
      id: game.id,
      questions: countries.map(({ id, mapCountries }) => ({
        id,
        prompt: "Katera država je označena?",
        hint: "",
        fact: "",
        mapCountries,
      })),
    };
  });

  res.status(201).json(result);
});

countryGuessRouter.post("/games/:gameId/guess", async (req, res) => {
  const { gameId } = req.params;
  const { questionId, answer } = (req.body ?? {}) as Record<string, unknown>;
  if (
    !Number.isInteger(questionId) ||
    typeof answer !== "string" ||
    !answer.trim() ||
    answer.length > MAX_ANSWER_LENGTH
  ) {
    res.status(400).json({ error: "Telo zahteve mora vsebovati questionId in neprazen answer" });
    return;
  }

  const result = await db.transaction(async (tx) => {
    await lockRunningGame(tx, gameId);
    const pending = await pendingRounds(tx, gameId);
    const round = requireCurrentRound(pending, questionId);

    if (isAcceptedCountryName(answer, [round.name, ...round.aliases])) {
      return endRound(tx, gameId, pending, "correct", answer);
    }

    await tx
      .update(countryGuessRounds)
      .set({ lastAnswer: answer })
      .where(and(eq(countryGuessRounds.gameId, gameId), eq(countryGuessRounds.position, round.position)));
    // Pravilnega imena ne razkrije, sicer bi ga igralec dobil z vsakim napačnim odgovorom
    return { isCorrect: false, correctAnswer: null, finished: false };
  });

  res.json(result);
});

countryGuessRouter.post("/games/:gameId/skip", async (req, res) => {
  const { gameId } = req.params;
  const { questionId } = (req.body ?? {}) as Record<string, unknown>;
  if (!Number.isInteger(questionId)) {
    res.status(400).json({ error: "Telo zahteve mora vsebovati questionId" });
    return;
  }

  const result = await db.transaction(async (tx) => {
    await lockRunningGame(tx, gameId);
    const pending = await pendingRounds(tx, gameId);
    requireCurrentRound(pending, questionId);
    return endRound(tx, gameId, pending, "skipped");
  });

  res.json(result);
});

countryGuessRouter.post("/games/:gameId/pause", async (req, res) => {
  const { gameId } = req.params;
  await db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (game.finishedAt) {
      throw httpError(409, "Igra je že končana");
    }
    if (!game.pausedAt) {
      await tx.update(countryGuessGames).set({ pausedAt: new Date() }).where(eq(countryGuessGames.id, gameId));
    }
  });

  res.json({ gameId });
});

const pausedTimeSoFar = (game: { pausedAt: Date | null; pausedMs: number }, now: Date) =>
  game.pausedMs + (game.pausedAt ? now.getTime() - game.pausedAt.getTime() : 0);

countryGuessRouter.post("/games/:gameId/resume", async (req, res) => {
  const { gameId } = req.params;
  await db.transaction(async (tx) => {
    const game = await lockGame(tx, gameId);
    if (game.finishedAt) {
      throw httpError(409, "Igra je že končana");
    }
    if (game.pausedAt) {
      await tx
        .update(countryGuessGames)
        .set({ pausedAt: null, pausedMs: pausedTimeSoFar(game, new Date()) })
        .where(eq(countryGuessGames.id, gameId));
    }
  });

  res.json({ gameId });
});

// Konča igro, tudi predčasno, in vrne rezultat. Lahko se pokliče večkrat.
countryGuessRouter.post("/games/:gameId/finish", async (req, res) => {
  const { gameId } = req.params;
  const result = await db.transaction(async (tx) => {
    let game = await lockGame(tx, gameId);
    if (!game.finishedAt) {
      const now = new Date();
      [game] = await tx
        .update(countryGuessGames)
        .set({ finishedAt: now, pausedAt: null, pausedMs: pausedTimeSoFar(game, now) })
        .where(eq(countryGuessGames.id, gameId))
        .returning();
    }

    const totalQuestions = await tx.$count(countryGuessRounds, eq(countryGuessRounds.gameId, gameId));
    // Samo odigrane države; imen držav, do katerih igralec ni prišel, ne razkrije
    const rounds = await tx
      .select({
        questionId: countryGuessRounds.countryId,
        correctAnswer: guessCountries.name,
        submittedAnswer: countryGuessRounds.lastAnswer,
        status: countryGuessRounds.status,
      })
      .from(countryGuessRounds)
      .innerJoin(guessCountries, eq(countryGuessRounds.countryId, guessCountries.id))
      .where(and(eq(countryGuessRounds.gameId, gameId), ne(countryGuessRounds.status, "pending")))
      .orderBy(asc(countryGuessRounds.position));

    return {
      hits: rounds.filter(({ status }) => status === "correct").length,
      totalQuestions,
      elapsedMs: game.finishedAt!.getTime() - game.startedAt.getTime() - game.pausedMs,
      rounds: rounds.map(({ status, ...round }) => ({ ...round, isCorrect: status === "correct" })),
    };
  });

  res.json(result);
});
