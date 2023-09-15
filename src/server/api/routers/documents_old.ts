import { z } from "zod";
import { documents } from "~/drizzle";
import { eq, asc, and, or } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import * as Diff from "diff";

import {
  deleteEmbeddingFromQdrant,
  searchSimilarEmbeddingsInQdrant,
} from "~/server/packages/qdrant";
import { checkIfDocumentNeedsUpdate } from "./documents/helpers/llm";
import { UpdateStatus, type UpdatedResponse } from "../../../types";

export const oldDocumentRouter = createTRPCRouter({
  deleteFile: publicProcedure
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
          trx.rollback();
          throw new TRPCError({
            message: "failed to delete document",
            code: "INTERNAL_SERVER_ERROR",
          });
        }
        // Delete Embedding from Qdrant
        await deleteEmbeddingFromQdrant(deletedFile.id);

        return deletedFile;
      });
    }),
  runUpdate: publicProcedure
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

        const baselineText = updatedDocument.text;

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

        const resArray = await Promise.all(
          similarDocuments.map((document) =>
            checkIfDocumentNeedsUpdate(baselineText, document),
          ),
        );

        const updatedDocuments = resArray.filter(
          (res) => res.type === UpdateStatus.Updated,
        ) as UpdatedResponse[];
        const completionResponse = updatedDocuments.map((updatedDocument) => {
          const diff = Diff.diffWords(
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
    }),
  test: publicProcedure.mutation(async ({}) => {
    const timeout = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const random = Math.random();
    const randomLength = Math.floor(random * 30);
    const arr = [];
    for (let i = 0; i < randomLength; i++) {
      arr.push(Math.floor(Math.random() * 1000));
    }

    await timeout(random * 5000);

    return arr;
  }),
});
