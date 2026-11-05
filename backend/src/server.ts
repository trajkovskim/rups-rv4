import "dotenv/config";
import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { countryGuessRouter } from "./routes/countryGuess.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { questionsRouter } from "./routes/questions.js";

const port = Number(process.env.PORT ?? 8080);

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());

app.use("/api/questions", questionsRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/country-guess", countryGuessRouter);

const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  // Napake odjemalca, npr. neveljaven JSON, imajo status že nastavljen
  const status = error.status ?? 500;
  if (status >= 500) {
    console.error(error);
  }
  res.status(status).json({ error: status >= 500 ? "Napaka na strežniku" : error.message });
};

app.use(handleError);

app.listen(port, () => {
  console.log(`API teče na http://localhost:${port}/api`);
});
