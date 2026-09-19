// src/utils/cache.ts
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 mins

export const getCachedResponse = (key: string) => {
  const raw = localStorage.getItem(`cache_${key}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
};

export const setCachedResponse = (key: string, data: any) => {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({ timestamp: Date.now(), data }));
  } catch {
    // Graceful fallback if storage is restricted or full
  }
};
