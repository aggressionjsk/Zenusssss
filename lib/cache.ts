/**
 * Simple in-memory cache implementation
 */

type CacheData = {
  [key: string]: {
    value: any;
    expiry: number | null;
  };
};

class Cache {
  private static instance: Cache;
  private cache: CacheData = {};

  private constructor() {}

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  /**
   * Set a value in the cache with an optional expiry time
   */
  public set(key: string, value: any, expiryInMs?: number): void {
    const expiry = expiryInMs ? Date.now() + expiryInMs : null;
    this.cache[key] = { value, expiry };
  }

  /**
   * Get a value from the cache
   */
  public get(key: string): any {
    const item = this.cache[key];
    
    // If item doesn't exist, return null
    if (!item) return null;
    
    // If item has expired, delete it and return null
    if (item.expiry && item.expiry < Date.now()) {
      delete this.cache[key];
      return null;
    }
    
    return item.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  public has(key: string): boolean {
    const item = this.cache[key];
    if (!item) return false;
    if (item.expiry && item.expiry < Date.now()) {
      delete this.cache[key];
      return false;
    }
    return true;
  }

  /**
   * Delete a key from the cache
   */
  public delete(key: string): void {
    delete this.cache[key];
  }

  /**
   * Clear all items from the cache
   */
  public clear(): void {
    this.cache = {};
  }
}

// Export a singleton instance
export const cache = Cache.getInstance();