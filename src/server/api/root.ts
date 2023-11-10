import { createTRPCRouter } from "~/server/api/trpc";
import { sharepointRouterV2 } from "./routers/sharepoint";
import { fileChangeRouter } from "./routers/changes";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  sharepoint: sharepointRouterV2,
  fileChanges: fileChangeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
