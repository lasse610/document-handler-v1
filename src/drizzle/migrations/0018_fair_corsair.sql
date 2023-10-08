CREATE TABLE IF NOT EXISTS "sharepointSubscription" (
	"id" uuid PRIMARY KEY NOT NULL,
	"driveId" uuid NOT NULL,
	"expirationDateTime" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sharepointFile" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointSubscription" ADD CONSTRAINT "sharepointSubscription_driveId_sharepointDrive_id_fk" FOREIGN KEY ("driveId") REFERENCES "sharepointDrive"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
