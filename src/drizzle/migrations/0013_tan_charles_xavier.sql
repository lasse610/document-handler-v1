CREATE TABLE IF NOT EXISTS "sharepointFile" (
	"itemId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sharepointDriveId" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"embedding" json NOT NULL,
	"updated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointFile" ADD CONSTRAINT "sharepointFile_sharepointDriveId_sharepointDrive_id_fk" FOREIGN KEY ("sharepointDriveId") REFERENCES "sharepointDrive"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
