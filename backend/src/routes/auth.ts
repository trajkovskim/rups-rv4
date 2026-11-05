import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import { checkPassword, createToken, hashPassword, requireAuth } from "../auth.js";
import { db } from "../db/index.js";
import { users, type User } from "../db/schema.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[\p{L}\p{N}_.-]{3,50}$/u;
const MAX_EMAIL_LENGTH = 255;
const MIN_PASSWORD_LENGTH = 8;
// Zgornja meja, da zelo dolga gesla ne zasedejo strežnika z računanjem hasha
const MAX_PASSWORD_LENGTH = 128;

const duplicateErrors: Record<string, string> = {
  users_email_lower_idx: "E-pošta je že v uporabi",
  users_username_lower_idx: "Uporabniško ime je že zasedeno",
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

// Hash gesla nikoli ne sme iz API-ja
const publicUser = ({ id, email, username, createdAt }: User) => ({ id, email, username, createdAt });

const registrationError = (email: unknown, username: unknown, password: unknown) => {
  if (typeof email !== "string" || typeof username !== "string" || typeof password !== "string") {
    return "Telo zahteve mora vsebovati email, username in password";
  }
  if (email.trim().length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email.trim())) {
    return "E-pošta ni veljavna";
  }
  if (!USERNAME_PATTERN.test(username.trim())) {
    return "Uporabniško ime mora imeti od 3 do 50 znakov in lahko vsebuje samo črke, številke, pike, vezaje in podčrtaje";
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return `Geslo mora imeti od ${MIN_PASSWORD_LENGTH} do ${MAX_PASSWORD_LENGTH} znakov`;
  }
  return null;
};

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const { email, username, password } = (req.body ?? {}) as Record<string, string>;
  const error = registrationError(email, username, password);
  if (error) {
    res.status(400).json({ error });
    return;
  }

  try {
    const [user] = await db
      .insert(users)
      .values({
        email: normalizeEmail(email),
        username: username.trim(),
        passwordHash: await hashPassword(password),
      })
      .returning();

    res.status(201).json({ token: createToken(user.id), user: publicUser(user) });
  } catch (error) {
    // Podvojene račune zanesljivo ujame samo baza, tudi pri hkratnih registracijah
    const { code, constraint } = ((error as Error).cause ?? {}) as { code?: string; constraint?: string };
    if (code === "23505" && constraint && duplicateErrors[constraint]) {
      res.status(409).json({ error: duplicateErrors[constraint] });
      return;
    }
    throw error;
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = (req.body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || typeof password !== "string") {
    res.status(400).json({ error: "Telo zahteve mora vsebovati email in password" });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${normalizeEmail(email)}`);

  // Isto sporočilo za napačno e-pošto in geslo, da se ne da ugotoviti, kdo ima račun
  const validPassword =
    password.length <= MAX_PASSWORD_LENGTH && (await checkPassword(user?.passwordHash, password));
  if (!user || !validPassword) {
    res.status(401).json({ error: "Napačna e-pošta ali geslo" });
    return;
  }

  res.json({ token: createToken(user.id), user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (_req, res) => {
  const [user] = await db.select().from(users).where(eq(users.id, res.locals.userId));
  if (!user) {
    res.status(401).json({ error: "Prijava je potrebna" });
    return;
  }

  res.json({ user: publicUser(user) });
});
