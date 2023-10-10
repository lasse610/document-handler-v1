import { get } from "http";
import { getSharepointSitesProcedure } from "./procedures/getSharepointSites";
import { createTRPCRouter } from "../../trpc";
import { updateSyncedSharepointSites } from "./procedures/updateSyncedSharepointSites";
import { sharepointChangeSubscription } from "../changes/procedures/sharepointChangeSubscription";

export const sharepointRouterV2 = createTRPCRouter({
  sites: getSharepointSitesProcedure,
  update: updateSyncedSharepointSites,
});
