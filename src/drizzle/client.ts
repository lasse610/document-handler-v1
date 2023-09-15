import {env} from "../env.mjs"
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './index';

const client = postgres(env.DATABASE_URL);
export const drizzleClient = drizzle(client, { schema });

export type DrizzleClient = typeof drizzleClient;
