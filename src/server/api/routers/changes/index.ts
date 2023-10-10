import { createTRPCRouter } from "../../trpc";
import { getFileChangesProcedure } from "./procedures/getChanges";
import { sharepointChangeSubscription } from "./procedures/sharepointChangeSubscription";

export const fileChangeRouter = createTRPCRouter({
  getFileChanges: getFileChangesProcedure,
  changeSubscription: sharepointChangeSubscription,
});
