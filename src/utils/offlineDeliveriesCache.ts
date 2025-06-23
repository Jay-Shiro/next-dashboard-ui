/**
 * Cache utility specifically optimized for offline deliveries
 * NOTE: This cache utility has been disabled to ensure data is always fetched fresh.
 * It remains as a stub implementation that doesn't actually cache anything.
 */

import { OfflineDeliveryResponse } from "@/app/(dashboard)/list/offline/types";

interface CacheEntry {
  data: OfflineDeliveryResponse;
  timestamp: number;
  filters: Record<string, string>;
}

class OfflineDeliveriesCache {
  private static instance: OfflineDeliveriesCache;
  // Cache disabled - using empty map
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 0; // Cache disabled - TTL set to 0
  private defaultData: OfflineDeliveryResponse | null = null;
  private defaultTimestamp: number = 0;

  private constructor() {}

  public static getInstance(): OfflineDeliveriesCache {
    if (!OfflineDeliveriesCache.instance) {
      OfflineDeliveriesCache.instance = new OfflineDeliveriesCache();
    }
    return OfflineDeliveriesCache.instance;
  }

  /**
   * Generate a cache key from filters
   */
  private generateCacheKey(filters: Record<string, string | number>): string {
    return Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== "")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  /**
   * Get cached data based on filters
   * NOTE: Caching has been disabled - this always returns null
   */
  public get(
    filters: Record<string, string | number> = {},
    ttl = this.defaultTTL
  ): OfflineDeliveryResponse | null {
    // Cache disabled - always return null
    return null;
  }

  /**
   * Store data in cache
   * NOTE: Caching has been disabled - this is a no-op
   */
  public set(
    data: OfflineDeliveryResponse,
    filters: Record<string, string | number> = {}
  ): void {
    // Cache disabled - do nothing
    return;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.defaultData = null;
    this.defaultTimestamp = 0;
  }

  /**
   * Prefetch data in the background
   * NOTE: Caching has been disabled - this is a no-op
   */
  public async prefetch(): Promise<void> {
    // Cache disabled - do nothing
    return;
  }

  /**
   * Check if cache has data for a specific set of filters
   * NOTE: Caching has been disabled - always returns false
   */
  public has(filters: Record<string, string | number> = {}): boolean {
    // Cache disabled - always return false
    return false;
  }
}

// Export singleton instance
export default OfflineDeliveriesCache.getInstance();
