import { createTRPCRouter } from "../../trpc";
import { getFileChangesProcedure } from "./procedures/getChanges";
import { nextTokenSubscription } from "./procedures/newToken";
import { runUpdateForChangesProcedure } from "./procedures/runUpdate";
import { sharepointChangeSubscription } from "./procedures/sharepointChangeSubscription";

export const fileChangeRouter = createTRPCRouter({
  getFileChanges: getFileChangesProcedure,
  changeSubscription: sharepointChangeSubscription,
  nextTokenSubscription: nextTokenSubscription,
  runUpdateForChange: runUpdateForChangesProcedure,
});
