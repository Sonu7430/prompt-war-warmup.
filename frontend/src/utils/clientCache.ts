/**
 * Client-Side Tier-1 Persistent Cache (LocalStorage / In-Memory).
 * Guarantees 0ms latency and 0 token spend for repeated queries:
 * - Scam Shield text signature hashing (instant cache hit)
 * - Daily Routine & Weather (30-minute in-memory & localStorage TTL)
 */

import type { ScamVerdict, DailyPulse } from '../types';

// In-memory hot caches
const inMemoryScamCache = new Map<string, ScamVerdict>();
let inMemoryDailyPulseCache: { data: DailyPulse; timestamp: number } | null = null;
const DAILY_PULSE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fast deterministic string hashing (FNV-1a 32-bit hex)
 * Normalizes punctuation, casing, and extra whitespace to maximize hit rates.
 */
export function hashQueryText(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Get cached ScamVerdict by query signature.
 * Checks fast in-memory map first (<0.1ms), then persistent localStorage.
 */
export function getCachedScamAnalysis(queryText: string): ScamVerdict | null {
  const key = hashQueryText(queryText);

  // 1. In-memory hot lookup (0ms)
  if (inMemoryScamCache.has(key)) {
    return inMemoryScamCache.get(key)!;
  }

  // 2. Persistent storage lookup
  try {
    const raw = localStorage.getItem(`scam_sig_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as ScamVerdict;
      inMemoryScamCache.set(key, parsed);
      return parsed;
    }
  } catch {
    // Graceful storage fallback
  }

  return null;
}

/**
 * Persist ScamVerdict in Tier-1 cache.
 */
export function setCachedScamAnalysis(queryText: string, verdict: ScamVerdict): void {
  const key = hashQueryText(queryText);
  inMemoryScamCache.set(key, verdict);

  try {
    localStorage.setItem(`scam_sig_${key}`, JSON.stringify(verdict));
  } catch {
    // Storage quota or private mode protection
  }
}

/**
 * Get cached Daily Pulse if within 30-minute freshness window.
 */
export function getCachedDailyPulse(): DailyPulse | null {
  const now = Date.now();

  // 1. In-memory check
  if (inMemoryDailyPulseCache && (now - inMemoryDailyPulseCache.timestamp < DAILY_PULSE_TTL_MS)) {
    return inMemoryDailyPulseCache.data;
  }

  // 2. LocalStorage check
  try {
    const raw = localStorage.getItem('nestor_daily_pulse_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.timestamp && (now - parsed.timestamp < DAILY_PULSE_TTL_MS)) {
        inMemoryDailyPulseCache = parsed;
        return parsed.data;
      }
    }
  } catch {
    // Graceful fallback
  }

  return null;
}

/**
 * Store Daily Pulse in 30-minute cache.
 */
export function setCachedDailyPulse(pulse: DailyPulse): void {
  const entry = { data: pulse, timestamp: Date.now() };
  inMemoryDailyPulseCache = entry;

  try {
    localStorage.setItem('nestor_daily_pulse_cache', JSON.stringify(entry));
  } catch {
    // LocalStorage quota protection
  }
}
