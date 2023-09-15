import { createTRPCRouter } from "~/server/api/trpc";
import { oldDocumentRouter } from "./routers/documents_old";
import { sharepointRouter } from "./routers/sharepoint";
import { newDocumentRouter } from "./routers//documents";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  documents_old: oldDocumentRouter,
  sharepoint_old: sharepointRouter,
  documents: newDocumentRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
