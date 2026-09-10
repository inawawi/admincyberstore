<template>
  <div class="homepage">
    <!-- Hero Banner Section -->
    <section class="hero-section">
      <div class="container">
        <BannerSlider :banners="banners" />
      </div>
    </section>

    <!-- Trust Features Bar -->
    <TrustBar />

    <!-- Categories Section -->
    <section class="section-container">
      <div class="container">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-subtitle">KATEGORI PRODUK</span>
            <h2 class="section-title">Pilih Kategori Kebutuhanmu</h2>
          </div>
          <NuxtLink to="/products" class="view-all-link">
            Lihat Semua
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <CategoryList :categories="categories" />
      </div>
    </section>

    <!-- Event Maba (Ormik & Semot) Section -->
    <EventMabaSection :products="eventMabaProducts" />

    <!-- Cyber Picks / Recommended Section -->
    <section v-if="recommendedProducts.length > 0" class="section-container">
      <div class="container">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-subtitle text-coral inline-flex items-center gap-1">
              <Icon name="lucide:flame" class="w-4 h-4 text-coral" />
              <span>PILIHAN TERBAIK</span>
            </span>
            <h2 class="section-title">Cyber Picks Recommended</h2>
          </div>
          <NuxtLink to="/products?is_recommended=1" class="view-all-link">
            Lihat Koleksi Rekomendasi
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <div class="grid-products">
          <ProductCard v-for="product in recommendedProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <!-- Latest Products Section -->
    <section class="section-container">
      <div class="container">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-subtitle">PRODUK TERBARU</span>
            <h2 class="section-title">Latest Tech Drops 2026</h2>
          </div>
          <NuxtLink to="/products" class="view-all-link">
            Semua Produk
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="pending" class="grid-products">
          <div v-for="i in 8" :key="i" class="cyber-card skeleton-card">
            <div class="skeleton-img skeleton"></div>
            <div class="skeleton-body">
              <div class="skeleton-text-sm skeleton"></div>
              <div class="skeleton-text-lg skeleton"></div>
              <div class="skeleton-text-md skeleton"></div>
            </div>
          </div>
        </div>

        <!-- Empty Products State -->
        <div v-else-if="latestProducts.length === 0" class="empty-products-box cyber-card">
          <div class="empty-icon">
            <Icon name="lucide:package-open" class="w-12 h-12 text-muted" />
          </div>
          <h3>Belum Ada Produk Tersedia</h3>
          <p>Silakan tambahkan data produk melalui Admin Panel backend untuk menampilkannya di sini.</p>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid-products">
          <ProductCard v-for="product in latestProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useApi } from '~/composables/useApi'

const { fetchProducts, fetchCategories, fetchBanners } = useApi()

// Fetch homepage data in parallel with non-blocking lazy transition & payload cache
const { data: homeData, pending } = await useAsyncData(
  'homepage-composite-data',
  async () => {
    const [banners, categories, eventMaba, products, recommended] = await Promise.all([
      fetchBanners().catch(() => ({ banners: [] })),
      fetchCategories().catch(() => ({ categories: [] })),
      fetchProducts({ is_event_maba: 1, per_page: 4 }).catch(() => ({ data: [] })),
      fetchProducts({ per_page: 8 }).catch(() => ({ data: [] })),
      fetchProducts({ is_recommended: 1, per_page: 4 }).catch(() => ({ data: [] })),
    ])
    return { banners, categories, eventMaba, products, recommended }
  },
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)

const banners = computed(() => {
  const b = homeData.value?.banners
  if (Array.isArray(b)) return b
  return b?.banners || []
})

const categories = computed(() => {
  const c = homeData.value?.categories
  if (Array.isArray(c)) return c
  return c?.categories || []
})

const eventMabaProducts = computed(() => {
  const e = homeData.value?.eventMaba
  if (!e) return []
  if (Array.isArray(e)) return e
  if (Array.isArray(e.data)) return e.data
  return []
})

const latestProducts = computed(() => {
  const p = homeData.value?.products
  if (!p) return []
  if (Array.isArray(p)) return p
  if (Array.isArray(p.data)) return p.data
  return []
})

const recommendedProducts = computed(() => {
  const r = homeData.value?.recommended
  if (!r) return []
  if (Array.isArray(r)) return r
  if (Array.isArray(r.data)) return r.data
  return []
})
</script>

<style scoped>
.homepage {
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
  padding-top: 1.5rem;
}

.hero-section {
  width: 100%;
}

/* Common Section Layout */
.section-container {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.75rem;
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-subtitle {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #004aad;
}

.text-coral {
  color: #e11d48 !important;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #003399;
  transition: all 0.2s ease;
}

.view-all-link:hover {
  color: #004aad;
  transform: translateX(3px);
}

/* Skeleton loader */
.skeleton-card {
  height: 340px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
}

.skeleton-img {
  height: 180px;
  width: 100%;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-text-sm {
  height: 14px;
  width: 40%;
}

.skeleton-text-lg {
  height: 20px;
  width: 85%;
}

.skeleton-text-md {
  height: 18px;
  width: 60%;
}

/* Empty State */
.empty-products-box {
  padding: 4rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-icon {
  font-size: 3rem;
}

.empty-products-box h3 {
  font-size: 1.35rem;
}

.empty-products-box p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  max-width: 400px;
}

@media (max-width: 640px) {
  .section-title {
    font-size: 1.35rem;
  }
}
</style>
