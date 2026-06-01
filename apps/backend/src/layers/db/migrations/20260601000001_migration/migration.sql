CREATE TABLE "projects" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"created_at" text NOT NULL
);

--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"project_id" text NOT NULL,
	"created_at" text NOT NULL
);

--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;
