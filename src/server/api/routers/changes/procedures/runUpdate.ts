import { TRPCError } from "@trpc/server";
import { diffWords } from "diff";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { dbSharepointFiles, sharepointFileChanges } from "~/drizzle";
import { publicProcedure } from "~/server/api/trpc";
import { searchSimilarEmbeddingsInQdrant } from "~/server/packages/qdrant";
import { UpdateStatus, type UpdatedResponseV2 } from "~/types";
import htmlDiff from "node-htmldiff";
import { checkIfDocumentNeedsUpdate } from "../helpers/llm";

export const runUpdateForChangesProcedure = publicProcedure
  .input(z.object({ changeId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.drizzle.transaction(async (trx) => {
      const change = (
        await trx
          .update(sharepointFileChanges)
          .set({ processed: true })
          .where(
            and(
              eq(sharepointFileChanges.id, input.changeId),
              eq(sharepointFileChanges.processed, false),
            ),
          )
          .returning()
          .execute()
      )[0];

      if (!change) {
        trx.rollback();
        throw new TRPCError({
          message: "Change not found",
          code: "NOT_FOUND",
        });
      }

      const diff = htmlDiff(change.newContent, change.oldContent ?? "");

      const dbSharepointFile = (
        await trx
          .select()
          .from(dbSharepointFiles)
          .where(eq(dbSharepointFiles.id, change.dbSharepointFileId))
          .execute()
      )[0];

      if (!dbSharepointFile) {
        throw new TRPCError({
          message: "Document not found",
          code: "NOT_FOUND",
        });
      }

      // search for similar documents
      const searchResponse = await searchSimilarEmbeddingsInQdrant(
        dbSharepointFile.embedding,
        dbSharepointFile.id,
      );

      const similarDocuments = await trx
        .select()
        .from(dbSharepointFiles)
        .where(
          or(
            ...searchResponse.map((s) =>
              eq(dbSharepointFiles.id, s.id.toString()),
            ),
          ),
        )
        .execute();
      const promises = similarDocuments.map((document) =>
        checkIfDocumentNeedsUpdate(
          dbSharepointFile,
          document,
          input.changeId,
          diff,
        ),
      );
      const resArray = await Promise.all(promises);

      const updatedDocuments = resArray.filter(
        (res) => res.type === UpdateStatus.Updated,
      ) as UpdatedResponseV2[];
      const completionResponse = updatedDocuments.map((updatedDocument) => {
        const diff = htmlDiff(
          updatedDocument.document.content,
          updatedDocument.new,
        );
        return {
          document: updatedDocument.document,
          changes: diff,
        };
      });

      return completionResponse;
    });
  });
