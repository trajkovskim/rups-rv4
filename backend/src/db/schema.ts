import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
