import { drizzleClient, type DrizzleClient } from "~/drizzle/client";

import { env } from "~/env.mjs";

const globalForDrizzle = globalThis as unknown as {
  drizzle: DrizzleClient | undefined;
};

export const drizzle =
  globalForDrizzle.drizzle ??
   drizzleClient;

if (env.NODE_ENV !== "production") globalForDrizzle.drizzle = drizzle;
