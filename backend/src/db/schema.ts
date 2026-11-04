import { sql } from "drizzle-orm";
import {
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    username: varchar("username", { length: 50 }).notNull(),
    // Nikoli gesla, samo hash (bcrypt ali argon2), ki ga naredi API ob registraciji
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  // Unikatnost ne loči velikih in malih črk, da Luka@... in luka@... nista dva računa
  (t) => [
    uniqueIndex("users_email_lower_idx").on(sql`lower(${t.email})`),
    uniqueIndex("users_username_lower_idx").on(sql`lower(${t.username})`),
  ],
);

export const questionCategory = pgEnum("question_category", [
  "capitals",
  "countries",
  "cities",
  "landforms",
  "seas",
  "islands",
  "lakes",
  "rivers",
  "basins",
  "guess_country",
]);

export const questions = pgTable("questions", {
  // Brez samodejnega štetja, ker seed določi stalne številke vprašanj
  id: integer("id").primaryKey(),
  category: questionCategory("category").notNull(),
  prompt: text("prompt").notNull(),
  hint: text("hint").notNull(),
  fact: text("fact").notNull(),
  // Besedilni odgovor, samo pri vprašanjih iz kategorije guess_country
  answer: text("answer"),
  // Pravilni odgovor, ki ga API razkrije šele po oddanem odgovoru
  lng: doublePrecision("lng").notNull(),
  lat: doublePrecision("lat").notNull(),
  // Ime v europe.geo.json, nastavljeno samo, ko je odgovor država
  country: text("country"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
