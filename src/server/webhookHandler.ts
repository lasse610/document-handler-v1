import express, { type Request, type RequestHandler } from "express";
import type MicrosoftGraphTypes from "@microsoft/microsoft-graph-types";
import { env } from "~/env.mjs";
import { drizzleClient } from "~/drizzle/client";
import {
  dbSharepointDrives,
  dbSharepointFiles,
  dbSharepointSubscription,
  sharepointFileChanges,
} from "~/drizzle";
import { or, eq } from "drizzle-orm";
import {
  getSharepointDriveContentDelta,
  getSharepointUpdatedDelta,
  initMicrosoftGraphClient,
} from "./packages/sharepoint/graphApi";
import { createNewDbSharepointFile } from "./packages/sharepoint/helpers";

interface SubscriptionRequest extends MicrosoftGraphTypes.Subscription {
  subscriptionId: string;
}

type ReqBody = { value: SubscriptionRequest[] };
type ReqQuery = { validationToken?: string };
type ResBody = string;

type SomeHandlerRequest = Request<unknown, ResBody, ReqBody, ReqQuery>;

export const webhookRouter = express.Router();

webhookRouter.post("/webhook", (async (req: SomeHandlerRequest, res) => {
  const validationToken = req.query.validationToken;
  // if request is for validation, send back the token

  if (validationToken) {
    res.status(200).send(validationToken);
    return;
  }
  const { value: subscriptions } = req.body;

  // validate that the request is coming from Microsoft Graph
  for (const subscription of subscriptions) {
    if (subscription.clientState !== env.MSWEBHOOK_SECRET_TOKEN) {
      res.status(401).send("Unauthorized");
      return;
    }

    if (!subscription.subscriptionId) {
      res.status(400).send("Bad request");
      return;
    }
  }
  console.log(req.body);

  // fetch subscription from database
  const dbSubscriptions = await drizzleClient
    .select()
    .from(dbSharepointSubscription)
    .where(
      or(
        ...subscriptions.map((s) =>
          eq(dbSharepointSubscription.id, s.subscriptionId),
        ),
      ),
    )
    .execute();

  if (dbSubscriptions.length === 0) {
    res.status(404).send("Subscription not found");
    return;
  }

  res.status(202).send("Accepted");

  // Do re indexing logic here
  const { client, token } = await initMicrosoftGraphClient();

  for (const dbSubscription of dbSubscriptions) {
    await drizzleClient.transaction(async (trx) => {
      try {
        // get drive associated with subscription
        const drive = (
          await trx
            .select()
            .from(dbSharepointDrives)
            .where(eq(dbSharepointDrives.id, dbSubscription.dbDriveId))
            .execute()
        )[0];

        if (!drive) {
          throw new Error("Drive not found");
        }
        // get delta link
        const deltaLink = drive.deltaLink;

        const changes = deltaLink
          ? await getSharepointUpdatedDelta(token, deltaLink)
          : await getSharepointDriveContentDelta(
              client,
              drive.siteId,
              drive.driveId,
            );
        const newDeltaLink = changes["@odata.deltaLink"];

        if (!newDeltaLink) throw new Error("Delta link not found");
        // fetch delta
        await trx
          .update(dbSharepointDrives)
          .set({ deltaLink: newDeltaLink })
          .where(eq(dbSharepointDrives.id, drive.id))
          .execute();

        // update changes

        const files = changes.value?.filter((item) => item.file);

        for (const file of files ?? []) {
          const itemId = file.id;
          if (!itemId) throw new Error("No item id");

          const dbFile = (
            await trx
              .select()
              .from(dbSharepointFiles)
              .where(eq(dbSharepointFiles.itemId, itemId))
              .execute()
          )[0];

          if (!dbFile) {
            if (file.deleted?.state === "deleted") {
              console.log("file deleted before indexing");
              continue;
            }

            const newDbFile = await createNewDbSharepointFile(
              client,
              drive,
              file,
            );

            if (!newDbFile) {
              console.log("file not created. It is probably deleted");
              continue;
            }
            await trx.insert(dbSharepointFiles).values(newDbFile).execute();

            continue;
          }
          // check if file is deleted
          if (file.deleted?.state === "deleted") {
            await trx
              .delete(dbSharepointFiles)
              .where(eq(dbSharepointFiles.itemId, dbFile.itemId))
              .execute();
            continue;
          }

          // check cTag
          const isModified = dbFile.cTag !== file.cTag;
          // if not modified, return
          if (!isModified) {
            continue;
          }
          // if modified, update
          const newDbFile = await createNewDbSharepointFile(
            client,
            drive,
            file,
          );

          if (!newDbFile) {
            console.log("file not created. It is probably deleted");
            continue;
          }

          await trx.insert(sharepointFileChanges).values({
            changeType: "updated",
            itemId: dbFile.itemId,
            oldContent: dbFile.content,
            newContent: newDbFile.content,
          });

          await trx
            .update(dbSharepointFiles)
            .set({ ...newDbFile, updatedAt: new Date(), updated: true })
            .where(eq(dbSharepointFiles.itemId, dbFile.itemId))
            .execute();
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    });
  }
  console.log("done");
}) as RequestHandler);
