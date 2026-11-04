import { Router } from "express";

export const leaderboardRouter = Router();

// Rezultatov še ne shranjujemo, zato je lestvica prazna
leaderboardRouter.get("/", (req, res) => {
  if (!/^\d+$/.test(String(req.query.gameModeId))) {
    res.status(400).json({ error: "Parameter gameModeId mora biti število" });
    return;
  }

  res.json([]);
});
