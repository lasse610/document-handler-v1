import { get } from "http";
import { getSharepointSitesProcedure } from "./procedures/getSharepointSites";
import { createTRPCRouter } from "../../trpc";
import { updateSyncedSharepointSites } from "./procedures/updateSyncedSharepointSites";

export const sharepointRouterV2 = createTRPCRouter({
  sites: getSharepointSitesProcedure,
  update: updateSyncedSharepointSites,
});
