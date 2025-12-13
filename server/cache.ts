interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class TTLCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000);
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const cache = new TTLCache();

export const CACHE_TTL = {
  CATEGORIES: 3600,
  FORMULATIONS: 1800,
  FORMULATION: 1800,
  CATEGORY: 3600,
  SAMPLE_PRODUCTS: 3600,
  BLOG_POSTS: 1800,
  PAGES: 3600,
  ACTIVITY: 60,
};

export const CACHE_KEYS = {
  CATEGORIES: 'categories:all',
  FORMULATIONS: 'formulations:all',
  FORMULATION: (slug: string) => `formulation:${slug}`,
  FORMULATION_BY_ID: (id: string) => `formulation:id:${id}`,
  CATEGORY: (slug: string) => `category:${slug}`,
  CATEGORY_BY_ID: (id: string) => `category:id:${id}`,
  CATEGORY_FORMULATIONS: (categoryId: string) => `formulations:category:${categoryId}`,
  SAMPLE_PRODUCTS: 'sample_products:all',
  BLOG_POSTS: 'blog_posts:published',
  PAGES: 'pages:all',
  PAGE: (slug: string) => `page:${slug}`,
};

export function invalidateFormulationCache(): void {
  cache.delete(CACHE_KEYS.FORMULATIONS);
  cache.deleteByPrefix('formulation:');
  cache.deleteByPrefix('formulations:category:');
}

export function invalidateCategoryCache(): void {
  cache.delete(CACHE_KEYS.CATEGORIES);
  cache.deleteByPrefix('category:');
}

export function invalidateAllCache(): void {
  cache.clear();
}
