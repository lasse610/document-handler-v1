import { httpBatchLink } from "@trpc/client/links/httpBatchLink";
import { loggerLink } from "@trpc/client/links/loggerLink";
import { wsLink, createWSClient } from "@trpc/client/links/wsLink";
import { createTRPCNext } from "@trpc/next";
import { TRPCError, type inferProcedureOutput } from "@trpc/server";
import { type NextPageContext } from "next";
import type { AppRouter } from "../server/api/root";
import superjson from "superjson";
import { env } from "../env.mjs";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { signIn } from "next-auth/react";
import { TRPCClientError } from "@trpc/client";
// ℹ️ Type-only import:
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export

const { NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WS_URL } = env;

function getEndingLink(ctx: NextPageContext | undefined) {
  if (typeof window === "undefined") {
    return httpBatchLink({
      url: `${NEXT_PUBLIC_APP_URL}/api/trpc`,
      headers() {
        if (!ctx?.req?.headers) {
          return {};
        }
        // on ssr, forward client's headers to the server
        return {
          ...ctx.req.headers,
          "x-ssr": "1",
        };
      },
    });
  }
  const client = createWSClient({
    url: NEXT_PUBLIC_WS_URL,
  });
  return wsLink<AppRouter>({
    client,
  });
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @link https://trpc.io/docs/react#3-create-trpc-hooks
 */
export const api = createTRPCNext<AppRouter>({
  config({ ctx }) {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @link https://trpc.io/docs/ssr
     */

    return {
      /**
       * @link https://trpc.io/docs/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            (process.env.NODE_ENV === "development" &&
              typeof window !== "undefined") ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        getEndingLink(ctx),
      ],
      /**
       * @link https://trpc.io/docs/data-transformers
       */
      transformer: superjson,
      /**
       * @link https://tanstack.com/query/v4/docs/react/reference/QueryClient
       */
      //queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } }, queryCache: new QueryCac},
      queryClient: new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60,
            retry: (failureCount: number, error: unknown) => {
              console.log("retrying...");
              if (handleUnauthorizedErrorsOnClient(error)) return false;
              return failureCount < 3;
            },
          },
        },
        queryCache: new QueryCache({
          onError: (err) => {
            console.log(err);
            console.log(
              "err instanceof TRPCClientError",
              err instanceof TRPCClientError,
            );
            //eslint-disable-next-line
            /*
            if (err instanceof TRPCClientError && isUnauthorized(err.data)) {
              console.log("unauthorized");
              await signIn();
            }
            */
          },
        }),
      }),
    };
  },
  /**
   * @link https://trpc.io/docs/ssr
   */
  ssr: false,
});

// export const transformer = superjson;
/**
 * This is a helper method to infer the output of a query resolver
 * @example type HelloOutput = inferQueryOutput<'hello'>
 */
export type inferQueryOutput<
  TRouteKey extends keyof AppRouter["_def"]["queries"],
> = inferProcedureOutput<AppRouter["_def"]["queries"][TRouteKey]>;

function handleUnauthorizedErrorsOnClient(error: unknown) {
  console.log("handleUnauthorizedErrorsOnClient");
  if (typeof window === "undefined") return false;
  if (!(error instanceof TRPCClientError)) {
    console.log("not trpc error");
    return false;
  }
  if (isUnauthorized(error.data)) {
    console.log("unauthorized");
    console.log(JSON.stringify(error));
    return true;
  }
  console.log(error.data);
  return false;
}

function isUnauthorized(obj: unknown) {
  return (
    typeof obj === "object" &&
    obj &&
    "code" in obj &&
    obj.code === "UNAUTHORIZED"
  );
}
