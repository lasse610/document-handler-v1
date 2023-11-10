import { TRPCError } from "@trpc/server";
import { diffWords } from "diff";
import { and, eq, or } from "drizzle-orm";
import { z } from "zod";
import { documents } from "~/drizzle";
import { publicProcedure } from "~/server/api/trpc";
import { searchSimilarEmbeddingsInQdrant } from "~/server/packages/qdrant";
import { checkIfDocumentNeedsUpdate_deprecated } from "../helpers/llm";
import { UpdateStatus, type UpdatedResponse } from "~/types";
import htmlDiff from "node-htmldiff";

export const runUpdateForDocumentsProcedure = publicProcedure
  .input(z.object({ id: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    return await ctx.drizzle.transaction(async (trx) => {
      const updatedDocument = (
        await trx
          .update(documents)
          .set({ updated: false })
          .where(and(eq(documents.id, input.id), eq(documents.updated, true)))
          .returning()
          .execute()
      )[0];

      if (!updatedDocument) {
        trx.rollback();
        throw new TRPCError({
          message: "Document not found",
          code: "NOT_FOUND",
        });
      }

      // search for similar documents
      const searchResponse = await searchSimilarEmbeddingsInQdrant(
        updatedDocument.embedding,
      );

      const similarDocuments = await trx
        .select()
        .from(documents)
        .where(
          or(...searchResponse.map((s) => eq(documents.id, s.id.toString()))),
        )
        .execute();
      const promises = similarDocuments.map((document) =>
        checkIfDocumentNeedsUpdate_deprecated(updatedDocument, document),
      );
      const resArray = await Promise.all(promises);

      const updatedDocuments = resArray.filter(
        (res) => res.type === UpdateStatus.Updated,
      ) as UpdatedResponse[];
      const completionResponse = updatedDocuments.map((updatedDocument) => {
        const diff = htmlDiff(
          updatedDocument.document.text,
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
