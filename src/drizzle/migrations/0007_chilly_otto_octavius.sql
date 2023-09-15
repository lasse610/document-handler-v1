ALTER TYPE "document_type" ADD VALUE 'sharepoint';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "internalDocument" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"embedding" json NOT NULL,
	"updated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sharepointDocument" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "type" "document_type" NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointDocument" ADD CONSTRAINT "sharepointDocument_id_document_id_fk" FOREIGN KEY ("id") REFERENCES "document"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "text";--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "createdAt";--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "updatedAt";--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "document_type";--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "embedding";--> statement-breakpoint
ALTER TABLE "document" DROP COLUMN IF EXISTS "updated";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "internalDocument" ADD CONSTRAINT "internalDocument_id_document_id_fk" FOREIGN KEY ("id") REFERENCES "document"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "sharepointDocument" ADD CONSTRAINT "external_id" UNIQUE("sharepointId","driveId","siteId");