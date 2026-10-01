interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

/**
 * High-performance In-Memory LRU Cache with TTL support.
 * Designed for sub-millisecond response caching without external dependencies.
 */
export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxSize: number;
  private defaultTtlMs: number;
  private hits = 0;
  private misses = 0;

  constructor(options?: { maxSize?: number; defaultTtlMs?: number }) {
    this.maxSize = options?.maxSize ?? 1000;
    this.defaultTtlMs = options?.defaultTtlMs ?? 3 * 60 * 1000; // 3 menit default
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Periksa apakah sudah kedaluwarsa (TTL expired)
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    // LRU: Hapus dan masukkan kembali agar menjadi paling baru digunakan (Most Recently Used)
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits++;
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    // Jika key sudah ada, hapus dulu agar posisi urutan LRU terbarui
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Evict item paling lama tidak digunakan (Least Recently Used / first entry in Map)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  invalidatePattern(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Singleton cache untuk katalog & pencarian produk
 */
export const catalogCache = new MemoryCache({
  maxSize: 1000,
  defaultTtlMs: 3 * 60 * 1000, // 3 menit
});

/**
 * Singleton cache untuk pencarian & query daftar di Admin Panel
 */
export const adminSearchCache = new MemoryCache({
  maxSize: 2000,
  defaultTtlMs: 2 * 60 * 1000, // 2 menit
});

/**
 * Bersihkan seluruh cache katalog (dipanggil saat admin menambah, mengubah, atau menghapus produk/kategori)
 */
export function clearCatalogCache(): void {
  catalogCache.clear();
}

/**
 * Bersihkan cache pencarian admin (bisa per modul atau seluruhnya)
 */
export function clearAdminSearchCache(resourceKey?: string): void {
  if (resourceKey) {
    adminSearchCache.invalidatePattern(`admin:${resourceKey}`);
  } else {
    adminSearchCache.clear();
  }
}

