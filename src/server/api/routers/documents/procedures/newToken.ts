import { publicProcedure } from "~/server/api/trpc";
import { observable } from "@trpc/server/observable";
import { type Document } from "~/drizzle";
import ee from "~/server/eventEmitter";
import { Subject } from "rxjs";
import { mergeMap, groupBy, auditTime } from "rxjs/operators";

export const nextTokenSubscription = publicProcedure.subscription(() => {
  return observable<{ document: Document; changes: string }>((emit) => {
    const subject = new Subject<{ document: Document; changes: string }>();

    // Group messages by document ID
    const groupedMessages = subject.pipe(
      groupBy((message) => message.document.id),
      mergeMap((group) => group.pipe(auditTime(150))),
    );

    // Listen to "newToken" events and push them to the subject
    function onNewToken(document: Document, changes: string) {
      subject.next({ document, changes });
    }
    ee.on("newToken", onNewToken);

    // Emit the grouped and throttled messages
    groupedMessages.subscribe((message) => {
      emit.next(message); // Emit the latest message for each document ID
    });

    // Unsubscribe from the "newToken" events and stop the interval when the subscription ends
    return () => {
      ee.off("newToken", onNewToken);
      subject.complete();
    };
  });
});
