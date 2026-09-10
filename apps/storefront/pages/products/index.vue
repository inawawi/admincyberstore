<template>
  <div class="catalog-page container">
    <!-- Breadcrumb & Header -->
    <div class="catalog-header">
      <div class="breadcrumb">
        <NuxtLink to="/">Beranda</NuxtLink>
        <span>/</span>
        <span class="current">Katalog Produk</span>
      </div>
      <h1 class="catalog-title">Semua Produk Gear & Hardware</h1>
      <p class="catalog-subtitle">Temukan koleksi lengkap produk teknologi mutakhir dengan jaminan garansi resmi.</p>
    </div>

    <!-- Quick Category Horizontal Pills (Touch scrollable) -->
    <div class="quick-category-bar">
      <button
        type="button"
        :class="['category-pill', { active: !selectedCategory && !isRecommendedOnly && !isEventMabaOnly }]"
        @click="resetFilters"
      >
        Semua Produk
      </button>

      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        :class="['category-pill', { active: selectedCategory === String(cat.id) }]"
        @click="selectQuickCategory(String(cat.id))"
      >
        {{ cat.name }}
      </button>

      <button
        type="button"
        :class="['category-pill pill-pick', { active: isRecommendedOnly }]"
        @click="toggleRecommended"
      >
        <Icon name="lucide:zap" class="w-3.5 h-3.5 inline mr-1" />
        Cyber Picks
      </button>

      <button
        type="button"
        :class="['category-pill pill-maba', { active: isEventMabaOnly }]"
        @click="toggleEventMaba"
      >
        <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1" />
        Event Maba
      </button>
    </div>

    <!-- Backdrop Overlay for Mobile Drawer -->
    <div
      v-if="isMobileFilterOpen"
      class="drawer-backdrop"
      @click="closeMobileFilter"
    ></div>

    <div class="catalog-layout">
      <!-- Sidebar Filters (Desktop Sticky & Mobile Drawer) -->
      <aside :class="['catalog-sidebar', { 'mobile-drawer-open': isMobileFilterOpen }]">
        <div class="filter-card cyber-card">
          <!-- Mobile Drawer Header -->
          <div class="mobile-drawer-header">
            <div class="drawer-title-box">
              <Icon name="lucide:sliders-horizontal" class="w-5 h-5 text-ubsi" />
              <h3>Filter Produk</h3>
              <span v-if="activeFilterCount > 0" class="filter-count-badge">
                {{ activeFilterCount }}
              </span>
            </div>
            <button
              type="button"
              class="drawer-close-btn"
              @click="closeMobileFilter"
              aria-label="Tutup Filter"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Desktop Filter Header -->
          <div class="filter-header desktop-only">
            <div class="filter-title-group">
              <Icon name="lucide:sliders-horizontal" class="w-4 h-4 text-ubsi" />
              <h3>Filter Produk</h3>
            </div>
            <button
              v-if="activeFilterCount > 0"
              type="button"
              @click="resetFilters"
              class="reset-filter-btn"
            >
              Reset
            </button>
          </div>

          <!-- Scrollable Filter Content -->
          <div class="filter-scrollable-body">
            <!-- Search Filter -->
            <div class="filter-group">
              <label class="filter-label">Cari Nama Produk</label>
              <div class="filter-input-box">
                <Icon name="lucide:search" class="search-box-icon w-4 h-4 text-muted" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Ketik kata kunci..."
                  class="input-cyber filter-search-input"
                  @keyup.enter="applyFilters"
                />
              </div>
            </div>

            <!-- Category Filter -->
            <div class="filter-group">
              <label class="filter-label">Kategori</label>
              <div class="category-radio-list">
                <label class="radio-label">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    v-model="selectedCategory"
                    @change="applyFilters"
                  />
                  <span class="custom-radio"></span>
                  <span class="radio-text">Semua Kategori</span>
                </label>

                <label
                  v-for="cat in categories"
                  :key="cat.id"
                  class="radio-label"
                >
                  <input
                    type="radio"
                    name="category"
                    :value="String(cat.id)"
                    v-model="selectedCategory"
                    @change="applyFilters"
                  />
                  <span class="custom-radio"></span>
                  <span class="radio-text">{{ cat.name }}</span>
                </label>
              </div>
            </div>

            <!-- Recommendation & Event Filter -->
            <div class="filter-group">
              <label class="filter-label">Kurasi Khusus</label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="isRecommendedOnly"
                  @change="applyFilters"
                />
                <span class="custom-checkbox"></span>
                <span class="checkbox-text inline-flex items-center gap-1">
                  <Icon name="lucide:zap" class="w-3.5 h-3.5 text-gold" />
                  <span>Hanya Cyber Picks</span>
                </span>
              </label>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="isEventMabaOnly"
                  @change="applyFilters"
                />
                <span class="custom-checkbox"></span>
                <span class="checkbox-text text-maba inline-flex items-center gap-1">
                  <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 text-gold" />
                  <span>Khusus Event Maba</span>
                </span>
              </label>
            </div>
          </div>

          <!-- Mobile Drawer Action Buttons -->
          <div class="mobile-drawer-footer">
            <button
              type="button"
              class="btn-drawer-reset"
              @click="resetFilters"
            >
              Reset
            </button>
            <button
              type="button"
              class="btn btn-primary btn-drawer-apply"
              @click="applyFilters"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </aside>

      <!-- Products Content Area -->
      <main class="catalog-main">
        <!-- Top Toolbar -->
        <div class="catalog-toolbar cyber-card">
          <!-- Mobile Filter Button & Product Count -->
          <div class="toolbar-left">
            <button
              type="button"
              class="btn-filter-mobile"
              @click="toggleMobileFilter"
            >
              <Icon name="lucide:sliders-horizontal" class="w-4 h-4" />
              <span>Filter</span>
              <span v-if="activeFilterCount > 0" class="filter-count-badge">
                {{ activeFilterCount }}
              </span>
            </button>

            <div class="toolbar-info">
              <span class="count-text">
                Menampilkan <strong>{{ totalProducts }}</strong> produk
              </span>
            </div>
          </div>

          <!-- Sorting Dropdown -->
          <div class="toolbar-sort">
            <label for="sortSelect" class="sort-label">Urutkan:</label>
            <div class="select-wrapper">
              <select
                id="sortSelect"
                v-model="sortBy"
                class="sort-select"
                @change="applySorting"
              >
                <option value="latest">Terbaru</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Active Filter Badges (Chips Bar) -->
        <div v-if="activeFilterCount > 0" class="active-chips-bar">
          <span class="chips-label">Filter Aktif:</span>

          <span v-if="searchQuery" class="active-chip">
            "{{ searchQuery }}"
            <button type="button" @click="removeSearch" title="Hapus pencarian"><Icon name="lucide:x" class="w-3 h-3" /></button>
          </span>

          <span v-if="selectedCategory" class="active-chip">
            Kategori: {{ selectedCategoryName || 'Dipilih' }}
            <button type="button" @click="removeCategory" title="Hapus kategori"><Icon name="lucide:x" class="w-3 h-3" /></button>
          </span>

          <span v-if="isRecommendedOnly" class="active-chip">
            <Icon name="lucide:zap" class="w-3.5 h-3.5 text-gold inline mr-0.5" /> Cyber Picks
            <button type="button" @click="toggleRecommended" title="Hapus Cyber Picks"><Icon name="lucide:x" class="w-3 h-3" /></button>
          </span>

          <span v-if="isEventMabaOnly" class="active-chip chip-maba">
            <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 text-gold inline mr-0.5" /> Event Maba
            <button type="button" @click="toggleEventMaba" title="Hapus Event Maba"><Icon name="lucide:x" class="w-3 h-3" /></button>
          </span>

          <button type="button" class="btn-clear-all" @click="resetFilters">
            Hapus Semua
          </button>
        </div>

        <!-- Skeletons Loading -->
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

        <!-- Empty Filter Result -->
        <div v-else-if="products.length === 0" class="empty-state cyber-card">
          <div class="empty-icon">
            <Icon name="lucide:search-x" class="w-12 h-12 text-muted" />
          </div>
          <h3>Produk Tidak Ditemukan</h3>
          <p>Coba gunakan kata kunci lain atau reset filter untuk melihat koleksi lainnya.</p>
          <button @click="resetFilters" class="btn btn-primary btn-reset-empty">
            Reset Semua Filter
          </button>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid-products">
          <ProductCard
            v-for="product in sortedProducts"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- Pagination -->
        <div v-if="lastPage > 1" class="pagination-wrapper">
          <button
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="page-btn prev-btn"
            aria-label="Halaman Sebelumnya"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
            <span class="btn-text">Sebelumnya</span>
          </button>

          <div class="page-numbers-scroll">
            <div class="page-numbers">
              <button
                v-for="p in lastPage"
                :key="p"
                @click="changePage(p)"
                :class="['page-num-btn', { active: currentPage === p }]"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <button
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= lastPage"
            class="page-btn next-btn"
            aria-label="Halaman Berikutnya"
          >
            <span class="btn-text">Berikutnya</span>
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const router = useRouter()
const { fetchProducts, fetchCategories } = useApi()

// Filters state
const searchQuery = ref(route.query.search ? String(route.query.search) : '')
const selectedCategory = ref(route.query.category_id ? String(route.query.category_id) : '')
const isRecommendedOnly = ref(route.query.is_recommended === '1' || route.query.is_recommended === 'true')
const isEventMabaOnly = ref(route.query.is_event_maba === '1' || route.query.is_event_maba === 'true')
const currentPage = ref(route.query.page ? parseInt(String(route.query.page), 10) : 1)
const sortBy = ref('latest')

// Mobile Filter Drawer state
const isMobileFilterOpen = ref(false)

const toggleMobileFilter = () => {
  isMobileFilterOpen.value = !isMobileFilterOpen.value
  if (import.meta.client) {
    document.body.style.overflow = isMobileFilterOpen.value ? 'hidden' : ''
  }
}

const closeMobileFilter = () => {
  isMobileFilterOpen.value = false
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
}

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})

// Fetch Categories with cache
const { data: catData } = await useAsyncData(
  'catalog-categories',
  () => fetchCategories(),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)
const categories = computed(() => catData.value?.categories || [])

// Active Filters Count
const activeFilterCount = computed(() => {
  let count = 0
  if (searchQuery.value) count++
  if (selectedCategory.value) count++
  if (isRecommendedOnly.value) count++
  if (isEventMabaOnly.value) count++
  return count
})

const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const cat = categories.value.find((c: any) => String(c.id) === String(selectedCategory.value))
  return cat ? cat.name : ''
})

// Quick Category Select
const selectQuickCategory = (catId: string) => {
  if (selectedCategory.value === catId) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = catId
  }
  applyFilters()
}

// Fetch Products based on filters
const fetchCurrentProducts = () => {
  const params: any = {
    page: currentPage.value,
    per_page: 12,
  }
  if (searchQuery.value) params.search = searchQuery.value
  if (selectedCategory.value) params.category_id = selectedCategory.value
  if (isRecommendedOnly.value) params.is_recommended = 1
  if (isEventMabaOnly.value) params.is_event_maba = 1

  return fetchProducts(params)
}

const { data: productResponse, pending, refresh } = await useAsyncData(
  'catalog-products-list',
  () => fetchCurrentProducts(),
  {
    lazy: true,
    watch: [() => route.query],
  }
)

const rawProducts = computed(() => {
  if (!productResponse.value) return []
  if (Array.isArray(productResponse.value)) return productResponse.value
  if (Array.isArray(productResponse.value.data)) return productResponse.value.data
  return []
})
const totalProducts = computed(() => productResponse.value?.total ?? rawProducts.value.length)
const lastPage = computed(() => productResponse.value?.last_page || 1)

// Sorting logic
const sortedProducts = computed(() => {
  const list = [...rawProducts.value]
  if (sortBy.value === 'price_asc') {
    return list.sort((a, b) => a.price - b.price)
  }
  if (sortBy.value === 'price_desc') {
    return list.sort((a, b) => b.price - a.price)
  }
  return list
})

const products = computed(() => sortedProducts.value)

const applyFilters = () => {
  currentPage.value = 1
  syncUrl()
  closeMobileFilter()
}

const applySorting = () => {
  // Handled by sortedProducts computed
}

const changePage = (p: number) => {
  if (p < 1 || p > lastPage.value) return
  currentPage.value = p
  syncUrl()
  if (import.meta.client) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const resetFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  isRecommendedOnly.value = false
  isEventMabaOnly.value = false
  currentPage.value = 1
  router.push({ path: '/products' })
  closeMobileFilter()
}

const removeSearch = () => {
  searchQuery.value = ''
  applyFilters()
}

const removeCategory = () => {
  selectedCategory.value = ''
  applyFilters()
}

const toggleRecommended = () => {
  isRecommendedOnly.value = !isRecommendedOnly.value
  applyFilters()
}

const toggleEventMaba = () => {
  isEventMabaOnly.value = !isEventMabaOnly.value
  applyFilters()
}

const syncUrl = () => {
  const query: any = {}
  if (searchQuery.value) query.search = searchQuery.value
  if (selectedCategory.value) query.category_id = selectedCategory.value
  if (isRecommendedOnly.value) query.is_recommended = '1'
  if (isEventMabaOnly.value) query.is_event_maba = '1'
  if (currentPage.value > 1) query.page = currentPage.value

  router.push({ path: '/products', query })
}

// Watch query changes in URL
watch(
  () => route.query,
  (newQ) => {
    searchQuery.value = newQ.search ? String(newQ.search) : ''
    selectedCategory.value = newQ.category_id ? String(newQ.category_id) : ''
    isRecommendedOnly.value = newQ.is_recommended === '1' || newQ.is_recommended === 'true'
    isEventMabaOnly.value = newQ.is_event_maba === '1' || newQ.is_event_maba === 'true'
    currentPage.value = newQ.page ? parseInt(String(newQ.page), 10) : 1
    refresh()
  }
)

useHead({
  title: 'Katalog Produk | Cyber Store',
  meta: [
    { name: 'description', content: 'Jelajahi seluruh katalog produk gaming, gadget, dan komputer dengan harga terbaik dan garansi resmi.' },
  ],
})
</script>

<style scoped>
/* Page Layout */
.catalog-page {
  padding-top: 1.75rem;
  padding-bottom: 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.catalog-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.breadcrumb a:hover {
  color: var(--accent-cyan);
}

.breadcrumb .current {
  color: var(--text-secondary);
}

.catalog-title {
  font-size: clamp(1.5rem, 3.2vw, 2.25rem);
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
  margin: 0;
}

.catalog-subtitle {
  color: var(--text-secondary);
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  margin: 0;
  line-height: 1.5;
}

/* Quick Category Bar */
.quick-category-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.4rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.quick-category-bar::-webkit-scrollbar {
  display: none;
}

.category-pill {
  white-space: nowrap;
  padding: 0.45rem 1rem;
  font-size: 0.825rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  background: #ffffff;
  border: 1.5px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.category-pill:hover {
  border-color: #004aad;
  color: #003399;
  background: #f0f7ff;
}

.category-pill.active {
  background: #003399;
  color: #ffffff;
  border-color: #002266;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
}

.pill-pick.active {
  background: #0284c7;
  border-color: #0369a1;
}

.pill-maba.active {
  background: #7c3aed;
  border-color: #6d28d9;
}

/* Main Grid Layout */
.catalog-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
}

/* Sidebar Filters (Desktop Sticky) */
.catalog-sidebar {
  position: sticky;
  top: 90px;
}

.filter-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--bg-surface);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.75rem;
}

.filter-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-title-group h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.reset-filter-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: #004aad;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.reset-filter-btn:hover {
  text-decoration: underline;
  color: #002266;
}

.filter-scrollable-body {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.filter-input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box-icon {
  position: absolute;
  left: 0.75rem;
  width: 1rem;
  height: 1rem;
  color: var(--text-muted);
  pointer-events: none;
}

.filter-search-input {
  padding-left: 2.25rem;
  font-size: 0.85rem;
  width: 100%;
}

.category-radio-list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--text-primary);
  cursor: pointer;
  user-select: none;
}

.radio-label input, .checkbox-label input {
  display: none;
}

.custom-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--border-subtle);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.radio-label input:checked + .custom-radio {
  border-color: #004aad;
  background: #004aad;
  box-shadow: 0 0 8px rgba(0, 74, 173, 0.35);
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid var(--border-subtle);
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-label input:checked + .custom-checkbox {
  border-color: #004aad;
  background: #004aad;
  box-shadow: 0 0 8px rgba(0, 74, 173, 0.35);
}

.text-maba {
  color: #7c3aed;
  font-weight: 700;
}

/* Main Area */
.catalog-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

/* Toolbar */
.catalog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.25rem;
  gap: 0.75rem;
  background: #ffffff;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-filter-mobile {
  display: none;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: #f8fafc;
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-filter-mobile:hover {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
}

.filter-count-badge {
  background: #004aad;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: var(--radius-full);
}

.count-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.count-text strong {
  color: #003399;
  font-weight: 800;
}

.toolbar-sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sort-label {
  font-size: 0.825rem;
  color: var(--text-secondary);
  font-weight: 600;
  white-space: nowrap;
}

.select-wrapper {
  position: relative;
}

.sort-select {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #0f172a;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-sm);
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.sort-select:focus {
  border-color: #004aad;
  box-shadow: 0 0 0 2px rgba(0, 74, 173, 0.15);
}

/* Active Filter Chips */
.active-chips-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.25rem 0;
}

.chips-label {
  font-size: 0.775rem;
  color: var(--text-muted);
  font-weight: 600;
}

.active-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #eff6ff;
  border: 1px solid rgba(0, 74, 173, 0.3);
  color: #003399;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-full);
}

.active-chip button {
  background: transparent;
  border: none;
  color: #003399;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  line-height: 1;
}

.active-chip.chip-maba {
  background: #f5f3ff;
  border-color: rgba(124, 58, 237, 0.3);
  color: #7c3aed;
}

.active-chip.chip-maba button {
  color: #7c3aed;
}

.btn-clear-all {
  background: transparent;
  border: none;
  color: var(--accent-coral);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  text-decoration: underline;
}

/* Skeletons */
.skeleton-card {
  height: 320px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 0.75rem;
}

.skeleton-img {
  height: 170px;
  width: 100%;
}

.skeleton-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-text-sm {
  height: 12px;
  width: 40%;
}

.skeleton-text-lg {
  height: 18px;
  width: 85%;
}

.skeleton-text-md {
  height: 16px;
  width: 60%;
}

/* Empty State */
.empty-state {
  padding: 3.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon {
  font-size: 3rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  max-width: 400px;
  margin: 0;
}

.btn-reset-empty {
  padding: 0.65rem 1.5rem;
  font-size: 0.85rem;
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-sm);
  color: #334155;
  font-size: 0.825rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  border-color: #004aad;
  color: #003399;
  background: #eff6ff;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers-scroll {
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  max-width: 100%;
}

.page-numbers-scroll::-webkit-scrollbar {
  display: none;
}

.page-numbers {
  display: flex;
  gap: 0.35rem;
}

.page-num-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #334155;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.page-num-btn:hover:not(.active) {
  border-color: #004aad;
  color: #003399;
  background: #eff6ff;
}

.page-num-btn.active {
  background: #003399;
  color: #ffffff;
  border-color: #002266;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

.text-ubsi {
  color: #004aad;
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS (ALL DEVICES)
   ========================================================================== */

/* Large Tablets & Small Laptops (<= 1100px) */
@media (max-width: 1100px) {
  .catalog-layout {
    grid-template-columns: 250px 1fr;
    gap: 1.5rem;
  }
}

/* Tablets & Mobile Screens (<= 992px) */
@media (max-width: 992px) {
  .catalog-layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  /* Drawer Backdrop */
  .drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    z-index: 998;
    animation: fadeIn 0.2s ease;
  }

  /* Sidebar transforms to Off-canvas Mobile Drawer */
  .catalog-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: 320px;
    max-width: 86vw;
    background: #ffffff;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 4px 0 25px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .catalog-sidebar.mobile-drawer-open {
    transform: translateX(0);
  }

  .filter-card {
    height: 100%;
    border-radius: 0;
    border: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .desktop-only {
    display: none;
  }

  /* Drawer Header */
  .mobile-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.15rem 1.25rem;
    border-bottom: 1px solid var(--border-subtle);
    background: #ffffff;
  }

  .drawer-title-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .drawer-title-box h3 {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
  }

  .drawer-close-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f1f5f9;
    border: none;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .filter-scrollable-body {
    padding: 1.25rem;
    overflow-y: auto;
    flex: 1;
  }

  /* Drawer Footer */
  .mobile-drawer-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-subtle);
    background: #ffffff;
    box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.04);
  }

  .btn-drawer-reset {
    flex: 1;
    padding: 0.75rem;
    border-radius: var(--radius-sm);
    background: #f8fafc;
    border: 1.5px solid var(--border-subtle);
    color: var(--text-primary);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
  }

  .btn-drawer-apply {
    flex: 2;
    padding: 0.75rem;
    font-size: 0.85rem;
    border-radius: var(--radius-sm);
  }

  .btn-filter-mobile {
    display: inline-flex;
  }
}

/* Mobile Devices (<= 640px) */
@media (max-width: 640px) {
  .catalog-page {
    padding-top: 1.25rem;
    padding-bottom: 3rem;
    gap: 1.25rem;
  }

  .catalog-toolbar {
    padding: 0.65rem 0.85rem;
  }

  .count-text {
    font-size: 0.8rem;
  }

  .sort-label {
    display: none;
  }

  .sort-select {
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
  }

  .skeleton-card {
    height: 270px;
    padding: 0.65rem;
  }

  .skeleton-img {
    height: 130px;
  }

  .pagination-wrapper {
    gap: 0.5rem;
  }

  .page-btn {
    padding: 0.45rem 0.65rem;
  }

  .page-btn .btn-text {
    display: none;
  }

  .page-num-btn {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
}

/* Ultra Narrow Mobile Phones (<= 380px) */
@media (max-width: 380px) {
  .catalog-title {
    font-size: 1.35rem;
  }

  .toolbar-left {
    gap: 0.4rem;
  }

  .btn-filter-mobile {
    padding: 0.4rem 0.65rem;
    font-size: 0.775rem;
  }

  .sort-select {
    max-width: 130px;
    font-size: 0.75rem;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
