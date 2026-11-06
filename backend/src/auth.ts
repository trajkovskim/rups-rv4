import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hash, verify } from "argon2";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

const TOKEN_LIFETIME = "7d";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET mora imeti vsaj 32 znakov. Vrednost za razvoj je v .env.example.");
}

// Če računa ni, geslo vseeno preverimo, da se po času odziva ne da ugotoviti, kdo ima račun
const dummyHash = await hash(randomUUID());

export const hashPassword = (password: string) => hash(password);

export const checkPassword = (passwordHash: string | undefined, password: string) =>
  verify(passwordHash ?? dummyHash, password);

export const createToken = (userId: string) =>
  jwt.sign({}, jwtSecret, { algorithm: "HS256", subject: userId, expiresIn: TOKEN_LIFETIME });

const readUserId = (header = "") => {
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  try {
    const { sub } = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }) as jwt.JwtPayload;
    return sub && UUID_PATTERN.test(sub) ? sub : null;
  } catch {
    return null;
  }
};

// Poti za tem middlewarom dobijo prijavljenega uporabnika v res.locals.userId
export const requireAuth: RequestHandler = (req, res, next) => {
  const userId = readUserId(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Prijava je potrebna" });
    return;
  }
  res.locals.userId = userId;
  next();
};
