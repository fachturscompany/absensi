import { createClient } from "redis";

const DISABLE_REDIS = process.env.REDIS_DISABLED === '1' || process.env.NEXT_PUBLIC_DISABLE_REDIS === '1'
const url = process.env.REDIS_URL || ''

// If Redis is disabled or URL not provided, export a nullish client so callers can fail-soft
let redis: any = null

if (!DISABLE_REDIS && url) {
  try {
    redis = createClient({ url });
    redis.on("error", (err: unknown) => {
      console.error("Redis Error:", err);
    });
  } catch (e) {
    // On constructor failure, keep it null to let cache.ts skip Redis
    redis = null
  }
}

// Lazy connect happens in cache.ts
export default redis as any;
