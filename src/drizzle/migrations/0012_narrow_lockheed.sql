ALTER TABLE "sharepointDrive" DROP CONSTRAINT "test_id";--> statement-breakpoint
ALTER TABLE "sharepointDrive" ADD CONSTRAINT "sharepointDrive_siteId_driveId_unique" UNIQUE("siteId","driveId");