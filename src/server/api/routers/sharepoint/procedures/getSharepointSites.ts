import {
  getSharepointDrives,
  getSharepointSites,
  initMicrosoftGraphClient,
} from "~/server/packages/sharepoint/graphApi";
import { publicProcedure } from "../../../trpc";
import { dbSharepointDrives } from "~/drizzle";

export const getSharepointSitesProcedure = publicProcedure.query(
  async ({ ctx, input }) => {
    const { client } = await initMicrosoftGraphClient();
    const sites = await getSharepointSites(client);

    const syncedSites = (
      await ctx.drizzle.select().from(dbSharepointDrives).execute()
    ).map((drive) => {
      return { ...drive, synced: true };
    });

    const res = sites.flatMap(async (site) => {
      const siteId = site.id;
      const siteName = site.name;

      if (!siteId || !siteName) return [];

      const drives = await getSharepointDrives(client, siteId);

      return drives.flatMap((drive) => {
        if (!drive.id || !drive.name) return [];

        return {
          siteId,
          siteName,
          driveId: drive.id,
          driveName: drive.name,
          synced: false,
        };
      });
    });

    const awaitedRes = (await Promise.all(res))
      .flat()
      .filter(
        (drive) =>
          !syncedSites.some(
            (syncedDrive) =>
              syncedDrive.driveId === drive.driveId &&
              syncedDrive.siteId === drive.siteId,
          ),
      );

    return [...awaitedRes, ...syncedSites];
  },
);
