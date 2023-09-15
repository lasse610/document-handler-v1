import { createTRPCRouter, publicProcedure } from "../trpc";
import { documents, sharepointDocuments } from "~/drizzle";
import {
  DownloadSharepointFile,
  GetSharepointFileInfos,
  initMicrosoftGraphClient,
} from "~/server/packages/sharepoint";
import { excecutePandoc } from "~/server/packages/pandoc";
import { eq } from "drizzle-orm";
import { createEmbedding } from "~/server/packages/openAI";
import {
  updateEmbeddingInQdrant,
  uploadEmbeddingToQdrant,
} from "~/server/packages/qdrant";

export const sharepointRouter = createTRPCRouter({
  downloadFiles: publicProcedure.mutation(async ({ ctx }) => {
    const client = initMicrosoftGraphClient();

    const allSharepointDocuments = await ctx.drizzle
      .select()
      .from(sharepointDocuments)
      .execute();

    const files = (await GetSharepointFileInfos(client)).value ?? [];
    for (const file of files) {
      await ctx.drizzle.transaction(async (trx) => {
        const unescapedName = file.name;
        const escapedName = unescapedName?.replace(/ /g, "\\ ");
        const escapedFilename = escapedName?.split(".")[0];
        const fileType = escapedName?.split(".")[1];
        const sharepointId = file.id;
        const driveId = file.parentReference?.driveId;
        const siteId = file.parentReference?.siteId;
        const downloadUrl = file["@microsoft.graph.downloadUrl"];
        const response = await DownloadSharepointFile(downloadUrl);

        if (
          !escapedName ||
          !escapedFilename ||
          !fileType ||
          !sharepointId ||
          !driveId ||
          !siteId ||
          !unescapedName
        ) {
          return;
        }
        // Command line args need escaped spaces
        const html = await excecutePandoc(response.data, [
          "-f",
          "docx",
          "--extract-media",
          `./public/media/${escapedFilename}`,
          "-t",
          "html",
        ]);

        const embedding = await createEmbedding(html);

        const exists = allSharepointDocuments.find(
          (doc) => doc.sharepointId === sharepointId,
        );

        if (exists) {
          await trx
            .update(documents)
            .set({
              title: unescapedName,
              text: html,
              embedding: embedding,
              type: "sharepoint",
            })
            .where(eq(documents.id, exists.id))
            .execute();

          await trx
            .update(sharepointDocuments)
            .set({
              fileName: unescapedName,
              driveId: driveId,
              siteId: siteId,
            })
            .where(eq(sharepointDocuments.id, exists.id))
            .execute();

          await updateEmbeddingInQdrant(exists.id, embedding);
          return;
        }

        const document = (
          await trx
            .insert(documents)
            .values({
              title: unescapedName,
              text: html,
              embedding: embedding,
              type: "sharepoint",
            })
            .returning()
            .execute()
        )[0];
        if (document === undefined)
          throw new Error("Failed to create document");

        await trx
          .insert(sharepointDocuments)
          .values({
            id: document.id,
            fileName: unescapedName,
            sharepointId: sharepointId,
            driveId: driveId,
            siteId: siteId,
          })
          .execute();

        await uploadEmbeddingToQdrant(document.id, embedding, "sharepoint");
      });
    }
    return files;
  }),
});
