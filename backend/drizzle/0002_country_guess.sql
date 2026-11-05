CREATE TYPE "public"."country_guess_round_status" AS ENUM('pending', 'correct', 'skipped');--> statement-breakpoint
CREATE TABLE "country_guess_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_at" timestamp with time zone,
	"paused_ms" integer DEFAULT 0 NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "country_guess_rounds" (
	"game_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"country_id" integer NOT NULL,
	"status" "country_guess_round_status" DEFAULT 'pending' NOT NULL,
	"last_answer" text,
	CONSTRAINT "country_guess_rounds_game_id_position_pk" PRIMARY KEY("game_id","position")
);
--> statement-breakpoint
CREATE TABLE "guess_countries" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"map_countries" text[] NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
ALTER TABLE "country_guess_rounds" ADD CONSTRAINT "country_guess_rounds_game_id_country_guess_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."country_guess_games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_guess_rounds" ADD CONSTRAINT "country_guess_rounds_country_id_guess_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."guess_countries"("id") ON DELETE cascade ON UPDATE no action;