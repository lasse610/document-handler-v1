import { publicProcedure } from "~/server/api/trpc";
import { observable } from "@trpc/server/observable";
import { DBSharepointFile, type Document } from "~/drizzle";
import ee from "~/server/eventEmitter";
import { Subject } from "rxjs";
import { mergeMap, groupBy, auditTime } from "rxjs/operators";
import z from "zod";

export const nextTokenSubscription = publicProcedure
  .input(z.object({ changeId: z.string() }))
  .subscription(({ input }) => {
    return observable<{ document: DBSharepointFile; changes: string }>(
      (emit) => {
        const subject = new Subject<{
          document: DBSharepointFile;
          changes: string;
        }>();

        // Group messages by document ID
        const groupedMessages = subject.pipe(
          groupBy((message) => message.document.itemId),
          mergeMap((group) => group.pipe(auditTime(150))),
        );

        // Listen to "newToken" events and push them to the subject
        function onNewToken(
          changeId: string,
          document: DBSharepointFile,
          changes: string,
        ) {
          if (changeId !== input.changeId) return;
          subject.next({ document, changes });
        }
        ee.on("newTokenV2", onNewToken);

        // Emit the grouped and throttled messages
        groupedMessages.subscribe((message) => {
          emit.next(message); // Emit the latest message for each document ID
        });

        // Unsubscribe from the "newToken" events and stop the interval when the subscription ends
        return () => {
          ee.off("newTokenV2", onNewToken);
          subject.complete();
        };
      },
    );
  });
