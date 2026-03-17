export type CacheEntry<T> = { v: T; e: number };

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { v: value, e: Date.now() + Math.max(0, ttlMs) };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {}
}

export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (!parsed || typeof parsed !== "object" || typeof parsed.e !== "number") return null;
    if (Date.now() > parsed.e) {
      try { localStorage.removeItem(key); } catch {}
      return null;
    }
    return parsed.v as T;
  } catch {
    return null;
  }
}

export function delCache(key: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(key); } catch {}
}
