import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { documents, sharepointDocuments } from "~/drizzle";
import { publicProcedure } from "~/server/api/trpc";
import { deleteEmbeddingFromQdrant } from "~/server/packages/qdrant";
import {
  DeleteSharepointFile,
  initMicrosoftGraphClient,
} from "~/server/packages/sharepoint";

export const deleteDocumentProcedure = publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ input, ctx }) => {
    await ctx.drizzle.transaction(async (trx) => {
      const deletedFile = (
        await trx
          .delete(documents)
          .where(eq(documents.id, input.id))
          .returning()
          .execute()
      )[0];

      if (!deletedFile) {
        throw new TRPCError({
          message: "failed to delete document",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
      // Delete Embedding from Qdrant
      await deleteEmbeddingFromQdrant(deletedFile.id);

      if (deletedFile.type === "sharepoint") {
        const client = initMicrosoftGraphClient();
        const deletedSharepointEntry = (
          await trx
            .delete(sharepointDocuments)
            .where(eq(sharepointDocuments.id, input.id))
            .returning()
            .execute()
        )[0];

        if (!deletedSharepointEntry) {
          throw new TRPCError({
            message: "failed to delete sharepoint document",
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        // Delete file from Sharepoint
        await DeleteSharepointFile(client, deletedSharepointEntry.sharepointId);
      }

      return deletedFile;
    });
  });
