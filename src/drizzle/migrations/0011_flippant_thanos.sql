CREATE TABLE IF NOT EXISTS "sharepointDrive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"siteId" text NOT NULL,
	"siteName" text NOT NULL,
	"driveId" text NOT NULL,
	"driveName" text NOT NULL,
	CONSTRAINT "test_id" UNIQUE("siteId","driveId")
);
