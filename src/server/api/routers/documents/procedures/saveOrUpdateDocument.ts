import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { documents, sharepointDocuments } from "~/drizzle";
import { createEmbedding } from "~/server/packages/openAI";
import {
  DownloadSharepointFileAndWriteToDisk,
  GetSharepointFileInfo,
  UpdateSharepointFile,
  UploadSharepointFile,
  initMicrosoftGraphClient,
} from "~/server/packages/sharepoint/graphApi";
import { publicProcedure } from "../../../trpc";
import {
  updateEmbeddingInQdrant,
  uploadEmbeddingToQdrant,
} from "~/server/packages/qdrant";
import { excecutePandoc } from "~/server/packages/pandoc";

const refrenceDocPath = "./data/reference/";
const resultDocPath = "./data/result/";

const siteId =
  "4rkscv.sharepoint.com,02a94695-f4f7-44d5-b3d9-6aeefa128271,17c4a475-732d-41a7-8156-7317e88700c4";

const driveId =
  "b!lUapAvf01USz2Wru-hKCcXWkxBctc6dBgVZzF-iHAMRaiwR_Z8jHQJiP1Fie7yxZ";

export const saveOrUpdateDocumentProcedure = publicProcedure
  .input(
    z.object({
      id: z.string().optional(),
      text: z.string().min(1),
      title: z.string().min(1),
      type: z.enum(["source", "destination", "sharepoint"]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    if (input.id) {
      // Check document type
      return await ctx.drizzle.transaction(async (trx) => {
        const validatedEmbedding = await createEmbedding(input.text);

        const updatedDocument = (
          await trx
            .update(documents)
            .set({
              text: input.text,
              title: input.title,
              embedding: validatedEmbedding,
              updatedAt: new Date(),
              updated: true,
            })
            .where(eq(documents.id, input.id!))
            .returning()
            .execute()
        )[0];

        if (!updatedDocument) {
          throw new TRPCError({
            message: "failed to update document",
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        // Update Embedding in Qdrant
        await updateEmbeddingInQdrant(updatedDocument.id, validatedEmbedding);

        // Document type is sharepoint
        if (updatedDocument.type === "sharepoint") {
          const { client } = await initMicrosoftGraphClient();

          const sharepointDocument = (
            await trx
              .select()
              .from(sharepointDocuments)
              .where(eq(sharepointDocuments.id, updatedDocument.id))
              .execute()
          )[0];

          if (!sharepointDocument)
            throw new Error("sharepoint document not found");

          // Download Reference File from Sharepoint
          const referenceFile = await GetSharepointFileInfo(
            client,
            sharepointDocument.sharepointId,
          );
          const referenceFileDownloadUrl =
            referenceFile["@microsoft.graph.downloadUrl"]!;
          const success = await DownloadSharepointFileAndWriteToDisk(
            referenceFileDownloadUrl,
            `${refrenceDocPath}${sharepointDocument.fileName}`,
          );
          if (!success) throw new Error("failed to download reference file");

          const escapedName = sharepointDocument.fileName?.replace(/ /g, "\\ ");
          // Convert new html to docx
          // Command line args need escaped spaces
          await excecutePandoc(Buffer.from(updatedDocument.text), [
            "-f",
            "html",
            "--reference-doc",
            `${refrenceDocPath}${escapedName}`,
            "-o",
            `${resultDocPath}${escapedName}`,
          ]);

          // Upload new docx to Sharepoint
          await UpdateSharepointFile(
            client,
            `${resultDocPath}${sharepointDocument.fileName}`,
            siteId,
            driveId,
            sharepointDocument.sharepointId,
          );
          return updatedDocument;
        }
        // Document type is not sharepoint

        return updatedDocument;
      });
    } else {
      return ctx.drizzle.transaction(async (trx) => {
        const html = await excecutePandoc(Buffer.from(input.text), [
          "-t",
          "html",
        ]);
        const validatedEmbedding = await createEmbedding(html);

        const newDocument = (
          await trx
            .insert(documents)
            .values({
              title: input.title,
              text: html,
              embedding: validatedEmbedding,
              type: input.type,
            })
            .returning()
            .execute()
        )[0];

        if (!newDocument) {
          throw new TRPCError({
            message: "failed to create document",
            code: "INTERNAL_SERVER_ERROR",
          });
        }

        await uploadEmbeddingToQdrant(newDocument.id, validatedEmbedding);

        if (input.type === "sharepoint") {
          const { client } = await initMicrosoftGraphClient();
          const escapedName = newDocument.title.replace(/ /g, "\\ ");
          // Convert new html to docx
          // Command line args need escaped spaces
          await excecutePandoc(Buffer.from(html), [
            "-f",
            "html",
            "-o",
            `${resultDocPath}${escapedName}.docx`,
          ]);
          // Upload new docx to Sharepoint
          const driveItem = await UploadSharepointFile(
            client,
            `${escapedName}.docx`,
            `${resultDocPath}${escapedName}.docx`,
          );
          const sharepointId = driveItem.id;
          const sharepointFileName = driveItem.name;
          const driveId = driveItem.parentReference?.driveId;
          const siteId = driveItem.parentReference?.siteId;
          if (!sharepointId || !sharepointFileName || !driveId || !siteId) {
            throw new Error("failed to upload file to sharepoint");
          }

          await trx
            .insert(sharepointDocuments)
            .values({
              id: newDocument.id,
              sharepointId: sharepointId,
              fileName: sharepointFileName,
              driveId: driveId,
              siteId: siteId,
            })
            .execute();
        }

        return newDocument;
      });
    }
  });
