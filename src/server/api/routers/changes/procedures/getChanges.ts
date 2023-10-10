import { eq } from "drizzle-orm";
import {
  dbSharepointDrives,
  dbSharepointFiles,
  sharepointFileChanges,
} from "~/drizzle";
import { publicProcedure } from "~/server/api/trpc";

export const getFileChangesProcedure = publicProcedure.query(
  async ({ ctx }) => {
    const changes = await ctx.drizzle
      .select()
      .from(sharepointFileChanges)
      .innerJoin(
        dbSharepointFiles,
        eq(sharepointFileChanges.itemId, dbSharepointFiles.itemId),
      )
      .innerJoin(
        dbSharepointDrives,
        eq(dbSharepointFiles.sharepointDriveId, dbSharepointDrives.id),
      )
      .orderBy(sharepointFileChanges.createdAt)
      .execute();

    return changes;
  },
);
