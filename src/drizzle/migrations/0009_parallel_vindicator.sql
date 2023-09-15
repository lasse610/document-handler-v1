ALTER TABLE "sharepointDocument" DROP CONSTRAINT "sharepointDocument_id_document_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sharepointDocument" ADD CONSTRAINT "sharepointDocument_id_document_id_fk" FOREIGN KEY ("id") REFERENCES "document"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
