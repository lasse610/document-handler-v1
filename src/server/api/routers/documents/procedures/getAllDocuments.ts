import { eq } from "drizzle-orm";
import { z } from "zod";
import { documents } from "~/drizzle";
import { publicProcedure } from "~/server/api/trpc";

export const getAllDocumentsProcedure = publicProcedure
  .input(z.object({ type: z.enum(["source", "destination", "sharepoint"]) }))
  .query(async ({ ctx, input }) => {
    return await ctx.drizzle
      .select()
      .from(documents)
      .where(eq(documents.type, input.type))
      .execute();
  });
