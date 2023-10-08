DO $$ BEGIN
 CREATE TYPE "file_change_type" AS ENUM('created', 'updated', 'deleted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sharepointFileChange" (
	"id" uuid PRIMARY KEY NOT NULL,
	"itemId" text NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"changeType" "file_change_type" NOT NULL,
	"time" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"oldContent" text,
	"newContent" text NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointFileChange" ADD CONSTRAINT "sharepointFileChange_itemId_sharepointFile_itemId_fk" FOREIGN KEY ("itemId") REFERENCES "sharepointFile"("itemId") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
