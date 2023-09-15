CREATE TABLE IF NOT EXISTS "sharepointDocument" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fileName" text NOT NULL,
	"sharepointId" text NOT NULL,
	"driveId" text NOT NULL,
	"siteId" text NOT NULL,
	"text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"embedding" json NOT NULL
);
