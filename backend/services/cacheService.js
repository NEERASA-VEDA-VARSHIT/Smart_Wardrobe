// Simple in-memory cache for recommendations
class CacheService {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Generate cache key for recommendation request
   * @param {string} userId - User ID
   * @param {Object} params - Request parameters
   * @returns {string} - Cache key
   */
  generateKey(userId, params) {
    const { query, occasion, weather, season, formality } = params;
    return `rec_${userId}_${JSON.stringify({ query, occasion, weather, season, formality })}`;
  }

  /**
   * Get cached recommendation
   * @param {string} key - Cache key
   * @returns {Object|null} - Cached data or null
   */
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('🎯 Cache hit for key:', key);
      return cached.data;
    }
    
    if (cached) {
      // Remove expired cache
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Set cached recommendation
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 Cached recommendation for key:', key);
  }

  /**
   * Clear cache for specific user
   * @param {string} userId - User ID
   */
  clearUserCache(userId) {
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.startsWith(`rec_${userId}_`)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries for user ${userId}`);
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear();
    console.log('🗑️ Cleared all cache');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache) {
      if (now - value.timestamp < this.CACHE_TTL) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTTL: this.CACHE_TTL
    };
  }
}

// Export singleton instance
export const cacheService = new CacheService();
