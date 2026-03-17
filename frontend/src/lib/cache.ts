import type { RedisClientType } from 'redis'
import redisClient from './redis'

// In-memory fallback cache (TTL in ms)
const memoryCache = new Map<string, { value: unknown; exp: number }>()

let redisBackoffUntil = 0
const REDIS_BACKOFF_MS = 60_000
const DISABLE_REDIS = process.env.REDIS_DISABLED === '1' || process.env.NEXT_PUBLIC_DISABLE_REDIS === '1'

async function ensureRedis(): Promise<RedisClientType | null> {
  try {
    if (DISABLE_REDIS) return null
    if (Date.now() < redisBackoffUntil) return null
    const client: RedisClientType = redisClient as RedisClientType
    if (!client) return null
    if (!client.isOpen) {
      await client.connect()
    }
    return client
  } catch {
    redisBackoffUntil = Date.now() + REDIS_BACKOFF_MS
    return null
  }
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const client = await ensureRedis()
  if (client) {
    try {
      const raw = await client.get(key)
      if (!raw) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return null
      }
    } catch {
      redisBackoffUntil = Date.now() + REDIS_BACKOFF_MS
    }
  }
  // Fallback memory
  const mem = memoryCache.get(key)
  if (!mem) return null
  if (Date.now() > mem.exp) {
    memoryCache.delete(key)
    return null
  }
  return mem.value as T
}

export async function setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = await ensureRedis()
  const str = JSON.stringify(value)
  if (client) {
    try {
      if (ttlSeconds > 0) {
        await client.set(key, str, { EX: ttlSeconds })
      } else {
        await client.set(key, str)
      }
      return
    } catch {
      redisBackoffUntil = Date.now() + REDIS_BACKOFF_MS
    }
  }
  // Fallback memory
  const exp = Date.now() + ttlSeconds * 1000
  memoryCache.set(key, { value, exp })
}

export async function del(key: string): Promise<void> {
  const client = await ensureRedis()
  if (client) {
    try {
      await client.del(key)
    } catch {
      redisBackoffUntil = Date.now() + REDIS_BACKOFF_MS
    }
  }
  memoryCache.delete(key)
}

export async function delByPrefix(prefix: string): Promise<void> {
  const client = await ensureRedis()
  if (client) {
    try {
      const iter = client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })
      for await (const k of iter as any) {
        await client.del(k as string)
      }
    } catch {
      redisBackoffUntil = Date.now() + REDIS_BACKOFF_MS
    }
  }
  // Memory cleanup
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix)) memoryCache.delete(k)
  }
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await getJSON<T>(key)
  if (cached !== null) return cached
  const data = await fetcher()
  await setJSON<T>(key, data, ttlSeconds)
  return data
}
