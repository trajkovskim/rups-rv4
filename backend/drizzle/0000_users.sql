CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower_idx" ON "users" USING btree (lower("username"));