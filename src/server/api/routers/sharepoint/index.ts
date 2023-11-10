import { get } from "http";
import { getSharepointSitesProcedure } from "./procedures/getSharepointSites";
import { createTRPCRouter } from "../../trpc";
import { updateSyncedSharepointSites } from "./procedures/updateSyncedSharepointSites";
import { sharepointChangeSubscription } from "../changes/procedures/sharepointChangeSubscription";
import { updateSharepointFileProcedure } from "./procedures/updateSharepointFile";

export const sharepointRouterV2 = createTRPCRouter({
  getAllSyncedSites: getSharepointSitesProcedure,
  updateSyncedSites: updateSyncedSharepointSites,
  updateSharepointFile: updateSharepointFileProcedure,
});
