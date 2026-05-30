CREATE TABLE "todos" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" text NOT NULL
);

--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;
