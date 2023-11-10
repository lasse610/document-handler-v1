import { publicProcedure } from "~/server/api/trpc";
import { observable } from "@trpc/server/observable";
import ee from "~/server/eventEmitter";

export const sharepointChangeSubscription = publicProcedure.subscription(() => {
  return observable<string>((emit) => {
    function onFileChange() {
      emit.next("change");
    }

    ee.on("fileChange", onFileChange);

    // Unsubscribe from the "newToken" events and stop the interval when the subscription ends
    return () => {
      ee.off("fileChange", onFileChange);
    };
  });
});
