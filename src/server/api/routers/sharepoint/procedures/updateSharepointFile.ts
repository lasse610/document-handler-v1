import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { dbSharepointDrives, dbSharepointFiles } from "~/drizzle";
import { createEmbedding } from "~/server/packages/openAI";
import {
  DownloadSharepointFileAndWriteToDisk,
  type DriveItemFile,
  UpdateSharepointFile,
  getSharepointDriveItem,
  initMicrosoftGraphClient,
} from "~/server/packages/sharepoint/graphApi";
import { publicProcedure } from "../../../trpc";
import { updateEmbeddingInQdrant } from "~/server/packages/qdrant";
import { excecutePandoc } from "~/server/packages/pandoc";

const refrenceDocPath = "./data/reference/";
const resultDocPath = "./data/result/";
export const updateSharepointFileProcedure = publicProcedure
  .input(
    z.object({
      itemId: z.string(),
      content: z.string().min(1),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Check document type
    return await ctx.drizzle.transaction(async (trx) => {
      const validatedEmbedding = await createEmbedding(input.content);

      const updatedDocument = (
        await trx
          .update(dbSharepointFiles)
          .set({
            content: input.content,
            embedding: validatedEmbedding,
            updatedAt: new Date(),
          })
          .where(eq(dbSharepointFiles.itemId, input.itemId))
          .returning()
          .execute()
      )[0];

      if (!updatedDocument) {
        throw new TRPCError({
          message: "failed to update document",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      const sharepointDrive = (
        await trx
          .select()
          .from(dbSharepointDrives)
          .where(eq(dbSharepointDrives.id, updatedDocument.sharepointDriveId))
          .execute()
      )[0];

      if (!sharepointDrive) {
        throw new TRPCError({
          message: "failed to update document",
          code: "INTERNAL_SERVER_ERROR",
        });
      }

      // Update Embedding in Qdrant
      await updateEmbeddingInQdrant(updatedDocument.id, validatedEmbedding);

      // Document type is sharepoint
      const { client } = await initMicrosoftGraphClient();

      // Download Reference File from Sharepoint
      const referenceFile = (await getSharepointDriveItem(
        client,
        sharepointDrive.siteId,
        sharepointDrive.driveId,
        updatedDocument.itemId,
      )) as DriveItemFile;
      const referenceFileDownloadUrl =
        referenceFile["@microsoft.graph.downloadUrl"]!;
      const success = await DownloadSharepointFileAndWriteToDisk(
        referenceFileDownloadUrl,
        `${refrenceDocPath}${updatedDocument.itemId}`,
      );
      if (!success) throw new Error("failed to download reference file");

      // Convert new html to docx
      // Command line args need escaped spaces
      await excecutePandoc(Buffer.from(updatedDocument.content), [
        "-f",
        "html",
        "-t",
        "docx",
        "--reference-doc",
        `${refrenceDocPath}${updatedDocument.itemId}`,
        "-o",
        `${resultDocPath}${updatedDocument.itemId}`,
      ]);

      // Upload new docx to Sharepoint
      const updatedFile = await UpdateSharepointFile(
        client,
        `${resultDocPath}${updatedDocument.itemId}`,
        sharepointDrive.siteId,
        sharepointDrive.driveId,
        updatedDocument.itemId,
      );

      // update cTag
      if (!updatedFile.cTag) throw new Error("No cTag in updated file");
      await trx
        .update(dbSharepointFiles)
        .set({ cTag: updatedFile.cTag })
        .where(eq(dbSharepointFiles.id, updatedDocument.id))
        .execute();

      return updatedDocument;
    });
  });
