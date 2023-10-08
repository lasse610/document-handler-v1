ALTER TABLE "sharepointSubscription" RENAME COLUMN "driveId" TO "dbDriveId";--> statement-breakpoint
ALTER TABLE "sharepointSubscription" DROP CONSTRAINT "sharepointSubscription_driveId_sharepointDrive_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointSubscription" ADD CONSTRAINT "sharepointSubscription_dbDriveId_sharepointDrive_id_fk" FOREIGN KEY ("dbDriveId") REFERENCES "sharepointDrive"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
