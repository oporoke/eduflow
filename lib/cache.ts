type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs: number = 60000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
}

export function invalidateCache(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

// Cache durations
export const CACHE_TTL = {
  SHORT: 30 * 1000,        // 30 seconds — user-specific data
  MEDIUM: 5 * 60 * 1000,   // 5 minutes — class/subject data
  LONG: 30 * 60 * 1000,    // 30 minutes — stable data like curriculum
  VERY_LONG: 60 * 60 * 1000, // 1 hour — rarely changing data
};