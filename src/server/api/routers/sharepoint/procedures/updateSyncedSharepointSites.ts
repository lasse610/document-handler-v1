import { publicProcedure } from "~/server/api/trpc";
import {
  type NewDBSharepointFile,
  dbSharepointDrives,
  DBSharepointDrive,
  dbSharepointFiles,
  dbSharepointSubscription,
} from "~/drizzle";
import { eq, or, and } from "drizzle-orm";
import z from "zod";
import {
  DownloadSharepointFile,
  type DriveItemFile,
  getSharepointDriveContentDelta,
  getSharepointDriveItem,
  initMicrosoftGraphClient,
  createDriveChangeSubscription,
  deleteDriveChangeSubscription,
} from "~/server/packages/sharepoint/graphApi";
import { excecutePandoc } from "~/server/packages/pandoc";
import { type Client } from "@microsoft/microsoft-graph-client";
import { createNewDbSharepointFile } from "~/server/packages/sharepoint/helpers";
import {
  deleteEmbeddingFromQdrant,
  uploadEmbeddingToQdrant,
} from "~/server/packages/qdrant";

export const updateSyncedSharepointSites = publicProcedure
  .input(
    z.array(
      z.object({
        siteId: z.string(),
        siteName: z.string(),
        driveId: z.string(),
        driveName: z.string(),
        synced: z.boolean(),
      }),
    ),
  )

  .mutation(async ({ ctx, input }) => {
    const currentlySynced = await ctx.drizzle
      .select()
      .from(dbSharepointDrives)
      .execute();

    const drivesToAdd = input.filter(
      (drive) =>
        drive.synced &&
        !currentlySynced.some(
          (currentDrive) => currentDrive.driveId === drive.driveId,
        ),
    );
    const drivesToDelete = input.filter(
      (drive) =>
        !drive.synced &&
        currentlySynced.some(
          (currentDrive) => currentDrive.driveId === drive.driveId,
        ),
    );

    await ctx.drizzle.transaction(async (trx) => {
      const { client } = await initMicrosoftGraphClient();

      // Handle addition of drives
      if (drivesToAdd.length > 0) {
        const addedDrives = await trx
          .insert(dbSharepointDrives)
          .values(drivesToAdd)
          .onConflictDoNothing()
          .returning()
          .execute();

        for (const drive of addedDrives) {
          // create subscription for drive
          const subscription = await createDriveChangeSubscription(
            client,
            drive.siteId,
            drive.driveId,
          );
          if (!subscription.id || !subscription.expirationDateTime)
            throw new Error("Subscription not created");

          await trx
            .insert(dbSharepointSubscription)
            .values({
              dbDriveId: drive.id,
              id: subscription.id,
              expirationDateTime: new Date(subscription.expirationDateTime),
            })
            .execute();

          // fetch initial delta from drive and filter for word documents
          // Todo: add logic for handling next delta link
          const delta = await getSharepointDriveContentDelta(
            client,
            drive.siteId,
            drive.driveId,
          );
          const nextDeltaLink = delta["@odata.deltaLink"];

          // save delta link to database
          if (!nextDeltaLink) {
            throw new Error("No delta link");
          }
          await trx
            .update(dbSharepointDrives)
            .set({ deltaLink: nextDeltaLink })
            .where(
              and(
                eq(dbSharepointDrives.siteId, drive.siteId),
                eq(dbSharepointDrives.driveId, drive.driveId),
              ),
            )
            .execute();

          const deltas =
            delta.value?.filter(
              (file) =>
                file.file?.mimeType ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ) ?? [];
          // Loop over all files in delta
          for (const file of deltas) {
            // Get Drive item from /drives/{drive-id}/items/{item-id}. It coontains the download url
            const dbSharepointFile = await createNewDbSharepointFile(
              client,
              drive,
              file,
            );

            if (!dbSharepointFile) {
              continue;
            }
            // Insert into database
            const insertedFile = (
              await trx
                .insert(dbSharepointFiles)
                .values(dbSharepointFile)
                .returning()
                .onConflictDoNothing()
                .execute()
            )[0];

            if (!insertedFile) {
              throw new Error("Failed to insert file");
            }
            // upload embedding
            await uploadEmbeddingToQdrant(
              insertedFile.id,
              insertedFile.embedding,
            );
          }
        }
      }

      // Handle deletion of drives
      if (drivesToDelete.length > 0) {
        // fetch drives that will be deleted
        const dbDrives = await trx
          .select()
          .from(dbSharepointDrives)
          .where(
            or(
              ...drivesToDelete.map((driveObject) =>
                and(
                  eq(dbSharepointDrives.siteId, driveObject.siteId),
                  eq(dbSharepointDrives.driveId, driveObject.driveId),
                ),
              ),
            ),
          )
          .execute();

        const files = await trx
          .select()
          .from(dbSharepointFiles)
          .where(
            or(
              ...dbDrives.map((driveObject) =>
                eq(dbSharepointFiles.sharepointDriveId, driveObject.id),
              ),
            ),
          )
          .execute();
        // delete embeddings
        for (const file of files) {
          await deleteEmbeddingFromQdrant(file.id);
        }
        // fetch subscriptions for drives
        const subscriptions = await trx
          .delete(dbSharepointSubscription)
          .where(
            or(
              ...dbDrives.map((driveObject) =>
                eq(dbSharepointSubscription.dbDriveId, driveObject.id),
              ),
            ),
          )
          .returning()
          .execute();

        // delete subscriptions
        for (const subscription of subscriptions) {
          await deleteDriveChangeSubscription(client, subscription.id);
        }

        await trx
          .delete(dbSharepointDrives)
          .where(
            or(
              ...dbDrives.map((driveObject) =>
                eq(dbSharepointDrives.id, driveObject.id),
              ),
            ),
          )
          .execute();
      }
    });

    return "Success";
  });
