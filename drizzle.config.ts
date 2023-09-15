import type { Config } from 'drizzle-kit';

export default {
  schema: './src/drizzle/index.ts',
  out: './src/drizzle/migrations',
} satisfies Config;
