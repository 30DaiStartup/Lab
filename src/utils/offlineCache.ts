/**
 * Offline Cache Utilities
 *
 * Provides localStorage-based caching for offline data access.
 * Used to cache API responses so they can be displayed when offline.
 */

const CACHE_PREFIX = 'offline_cache_';
const CACHE_METADATA_KEY = 'offline_cache_metadata';

interface CacheMetadata {
  key: string;
  timestamp: number;
  expiresAt?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Get all cache metadata
 */
function getCacheMetadata(): CacheMetadata[] {
  try {
    const metadata = localStorage.getItem(CACHE_METADATA_KEY);
    return metadata ? JSON.parse(metadata) : [];
  } catch {
    return [];
  }
}

/**
 * Update cache metadata
 */
function updateCacheMetadata(key: string, timestamp: number, expiresAt?: number): void {
  try {
    const metadata = getCacheMetadata();
    const existingIndex = metadata.findIndex((m) => m.key === key);

    const entry: CacheMetadata = { key, timestamp, expiresAt };

    if (existingIndex >= 0) {
      metadata[existingIndex] = entry;
    } else {
      metadata.push(entry);
    }

    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('[OfflineCache] Failed to update metadata:', error);
  }
}

/**
 * Remove key from cache metadata
 */
function removeCacheMetadata(key: string): void {
  try {
    const metadata = getCacheMetadata();
    const filtered = metadata.filter((m) => m.key !== key);
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.warn('[OfflineCache] Failed to remove metadata:', error);
  }
}

/**
 * Cache data with a given key
 *
 * @param key - Unique identifier for the cached data
 * @param data - Data to cache (must be JSON-serializable)
 * @param ttlMs - Optional time-to-live in milliseconds
 */
export function cacheData<T>(key: string, data: T, ttlMs?: number): void {
  try {
    const timestamp = Date.now();
    const expiresAt = ttlMs ? timestamp + ttlMs : undefined;

    const entry: CacheEntry<T> = {
      data,
      timestamp,
      expiresAt,
    };

    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    updateCacheMetadata(key, timestamp, expiresAt);

    console.log(`[OfflineCache] Cached data for key: ${key}`);
  } catch (error) {
    // Handle localStorage quota exceeded or other errors
    console.warn('[OfflineCache] Failed to cache data:', error);

    // Try to free up space by removing oldest entries
    try {
      const metadata = getCacheMetadata();
      if (metadata.length > 0) {
        // Sort by timestamp (oldest first) and remove the oldest
        metadata.sort((a, b) => a.timestamp - b.timestamp);
        const oldestKey = metadata[0].key;
        localStorage.removeItem(CACHE_PREFIX + oldestKey);
        removeCacheMetadata(oldestKey);

        // Retry caching
        cacheData(key, data, ttlMs);
      }
    } catch {
      // Give up if we still can't cache
      console.error('[OfflineCache] Unable to cache data even after cleanup');
    }
  }
}

/**
 * Get cached data by key
 *
 * @param key - Unique identifier for the cached data
 * @returns The cached data or null if not found/expired
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);

    if (!stored) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(stored);

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      // Remove expired entry
      localStorage.removeItem(CACHE_PREFIX + key);
      removeCacheMetadata(key);
      console.log(`[OfflineCache] Expired cache removed for key: ${key}`);
      return null;
    }

    console.log(`[OfflineCache] Retrieved cached data for key: ${key}`);
    return entry.data;
  } catch (error) {
    console.warn('[OfflineCache] Failed to get cached data:', error);
    return null;
  }
}

/**
 * Get cached data with metadata
 *
 * @param key - Unique identifier for the cached data
 * @returns Object containing data, timestamp, and isStale flag
 */
export function getCachedDataWithMetadata<T>(key: string): {
  data: T | null;
  timestamp: number | null;
  isStale: boolean;
} {
  try {
    const stored = localStorage.getItem(CACHE_PREFIX + key);

    if (!stored) {
      return { data: null, timestamp: null, isStale: true };
    }

    const entry: CacheEntry<T> = JSON.parse(stored);
    const isStale = entry.expiresAt ? Date.now() > entry.expiresAt : false;

    return {
      data: entry.data,
      timestamp: entry.timestamp,
      isStale,
    };
  } catch {
    return { data: null, timestamp: null, isStale: true };
  }
}

/**
 * Remove a specific cached item
 *
 * @param key - Unique identifier for the cached data to remove
 */
export function removeCachedData(key: string): void {
  try {
    localStorage.removeItem(CACHE_PREFIX + key);
    removeCacheMetadata(key);
    console.log(`[OfflineCache] Removed cache for key: ${key}`);
  } catch (error) {
    console.warn('[OfflineCache] Failed to remove cached data:', error);
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  try {
    const metadata = getCacheMetadata();

    // Remove all cached items
    metadata.forEach(({ key }) => {
      localStorage.removeItem(CACHE_PREFIX + key);
    });

    // Clear metadata
    localStorage.removeItem(CACHE_METADATA_KEY);

    console.log('[OfflineCache] All cache cleared');
  } catch (error) {
    console.warn('[OfflineCache] Failed to clear cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  itemCount: number;
  totalSize: number;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
} {
  try {
    const metadata = getCacheMetadata();

    let totalSize = 0;
    metadata.forEach(({ key }) => {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (item) {
        totalSize += item.length * 2; // Approximate bytes (UTF-16)
      }
    });

    const timestamps = metadata.map((m) => m.timestamp).sort((a, b) => a - b);

    return {
      itemCount: metadata.length,
      totalSize,
      oldestTimestamp: timestamps[0] || null,
      newestTimestamp: timestamps[timestamps.length - 1] || null,
    };
  } catch {
    return {
      itemCount: 0,
      totalSize: 0,
      oldestTimestamp: null,
      newestTimestamp: null,
    };
  }
}
