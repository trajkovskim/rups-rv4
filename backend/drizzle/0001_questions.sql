CREATE TYPE "public"."question_category" AS ENUM('capitals', 'countries', 'cities', 'landforms', 'seas', 'islands', 'lakes', 'rivers', 'basins', 'guess_country');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" integer PRIMARY KEY NOT NULL,
	"category" "question_category" NOT NULL,
	"prompt" text NOT NULL,
	"hint" text NOT NULL,
	"fact" text NOT NULL,
	"answer" text,
	"lng" double precision NOT NULL,
	"lat" double precision NOT NULL,
	"country" text
);
