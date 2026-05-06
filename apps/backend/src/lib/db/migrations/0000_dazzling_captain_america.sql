CREATE TABLE "todos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);
