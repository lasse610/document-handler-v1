DROP TABLE "internalDocument";--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "embedding" json NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "updated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sharepointDocument" DROP COLUMN IF EXISTS "text";--> statement-breakpoint
ALTER TABLE "sharepointDocument" DROP COLUMN IF EXISTS "createdAt";--> statement-breakpoint
ALTER TABLE "sharepointDocument" DROP COLUMN IF EXISTS "updatedAt";--> statement-breakpoint
ALTER TABLE "sharepointDocument" DROP COLUMN IF EXISTS "embedding";