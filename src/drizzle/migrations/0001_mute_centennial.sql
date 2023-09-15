ALTER TABLE "sessions" RENAME TO "session";--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "sessions_userId_users_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
