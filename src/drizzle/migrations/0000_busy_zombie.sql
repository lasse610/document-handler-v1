DO $$ BEGIN
 CREATE TYPE "document_type" AS ENUM('source', 'destination', 'sharepoint');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "file_change_type" AS ENUM('created', 'updated', 'deleted');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT account_provider_providerAccountId PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sharepointDrive" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"siteId" text NOT NULL,
	"siteName" text NOT NULL,
	"driveId" text NOT NULL,
	"driveName" text NOT NULL,
	"deltaLink" text,
	CONSTRAINT "sharepointDrive_siteId_driveId_unique" UNIQUE("siteId","driveId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sharepointFile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itemId" text NOT NULL,
	"name" text NOT NULL,
	"sharepointDriveId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"embedding" json NOT NULL,
	"cTag" text NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sharepointSubscription" (
	"id" uuid PRIMARY KEY NOT NULL,
	"dbDriveId" uuid NOT NULL,
	"expirationDateTime" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "document_type" NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"embedding" json NOT NULL,
	"updated" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sharepointDocument" (
	"id" uuid PRIMARY KEY NOT NULL,
	"fileName" text NOT NULL,
	"sharepointId" text NOT NULL,
	"driveId" text NOT NULL,
	"siteId" text NOT NULL,
	CONSTRAINT "external_id" UNIQUE("sharepointId","driveId","siteId")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sharepointFileChange" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dbSharepointFileId" uuid NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"changeType" "file_change_type" NOT NULL,
	"time" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"oldContent" text,
	"newContent" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT verificationToken_identifier_token PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointFile" ADD CONSTRAINT "sharepointFile_sharepointDriveId_sharepointDrive_id_fk" FOREIGN KEY ("sharepointDriveId") REFERENCES "sharepointDrive"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointSubscription" ADD CONSTRAINT "sharepointSubscription_dbDriveId_sharepointDrive_id_fk" FOREIGN KEY ("dbDriveId") REFERENCES "sharepointDrive"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointFileChange" ADD CONSTRAINT "sharepointFileChange_dbSharepointFileId_sharepointFile_id_fk" FOREIGN KEY ("dbSharepointFileId") REFERENCES "sharepointFile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
