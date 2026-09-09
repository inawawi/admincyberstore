<template>
  <div class="product-card cyber-card">
    <!-- Image Wrapper with Badges -->
    <div class="card-image-box">
      <NuxtLink :to="productUrl" class="image-link">
        <img
          :src="getImageUrl(product.main_photo)"
          :alt="product.name"
          loading="lazy"
          class="product-image"
          @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }"
        />
      </NuxtLink>

      <!-- Badges (Compact) -->
      <div class="card-badges">
        <span v-if="product.is_event_maba" class="mini-badge badge-maba inline-flex items-center gap-1">
          <Icon name="lucide:graduation-cap" class="w-3 h-3" />
          <span>Event Maba</span>
        </span>
      </div>

      <!-- Quick Add to Cart Floating Button -->
      <button
        @click.prevent="handleQuickAdd"
        :disabled="product.stock <= 0"
        class="quick-add-btn"
        :title="product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
      </button>
    </div>

    <!-- Product Content -->
    <div class="card-content">
      <!-- Category & Stock Status -->
      <div class="card-meta-row">
        <span class="category-name">
          {{ product.category?.name || 'Tech Gear' }}
        </span>
        <span v-if="product.stock > 0" class="stock-status in-stock">
          Stok: {{ product.stock }}
        </span>
        <span v-else class="stock-status out-of-stock">
          Habis
        </span>
      </div>

      <!-- Product Title -->
      <h3 class="product-title">
        <NuxtLink :to="productUrl">
          {{ product.name }}
        </NuxtLink>
      </h3>

      <!-- Rating & Reviews -->
      <div class="rating-row">
        <div class="stars-box">
          <Icon name="lucide:star" class="star-icon w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span class="rating-score">{{ product.rating || '5.0' }}</span>
        </div>
        <span class="reviews-count">({{ product.reviews_count || 0 }} ulasan)</span>
      </div>

      <!-- Price Row -->
      <div class="price-row">
        <div class="price-group">
          <span class="price-current">{{ formatRupiah(product.price) }}</span>
          <span v-if="product.original_price && product.original_price > product.price" class="price-original">
            {{ formatRupiah(product.original_price) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'
import { useCartStore } from '~/stores/cart'

const props = defineProps<{
  product: any
}>()

const { formatRupiah, calculateDiscount } = useFormat()
const { getImageUrl } = useApi()
const cartStore = useCartStore()

const discountPercent = computed(() => {
  return calculateDiscount(props.product.price, props.product.original_price)
})

const productUrl = computed(() => {
  return `/products/${props.product.slug || props.product.encrypted_id || props.product.id}`
})

const handleQuickAdd = () => {
  if (props.product.stock <= 0) return
  // Produk event maba wajib input NIM di detail page
  if (props.product.is_event_maba) {
    navigateTo(productUrl.value)
    return
  }
  // If product has sizes or colors, take the first option by default
  const defaultSize = props.product.sizes?.length ? props.product.sizes[0] : null
  const defaultColor = props.product.colors?.length ? props.product.colors[0] : null
  cartStore.addToCart(props.product, 1, defaultSize, defaultColor)
}
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.card-image-box {
  position: relative;
  width: 100%;
  padding-top: 85%; /* 4:3.4 Aspect Ratio */
  background: #f8fafc;
  overflow: hidden;
  border-bottom: 1px solid #f1f5f9;
}

.image-link {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.product-card:hover .product-image {
  transform: scale(1.06);
}

.card-badges {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
  max-width: calc(100% - 3.25rem);
  z-index: 2;
  pointer-events: none;
}

.mini-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.4rem;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1.15;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.badge-maba {
  background: rgba(124, 58, 237, 0.9);
  border: 1px solid rgba(167, 139, 250, 0.5);
  color: #ffffff;
}

.badge-discount {
  background: rgba(225, 29, 72, 0.92);
  color: #ffffff;
  border: 1px solid rgba(253, 164, 175, 0.4);
}

.badge-pick {
  background: rgba(0, 74, 173, 0.9);
  color: #ffffff;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.quick-add-btn {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #004aad;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 2;
}

.product-card:hover .quick-add-btn {
  opacity: 1;
  transform: translateY(0);
}

.quick-add-btn:hover {
  background: #003399;
  transform: scale(1.1) !important;
  box-shadow: 0 4px 16px rgba(0, 51, 153, 0.4);
}

.quick-add-btn:disabled {
  background: #cbd5e1;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.card-content {
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 0.5rem;
}

.card-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.category-name {
  color: #004aad;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stock-status {
  font-weight: 600;
}

.stock-status.in-stock {
  color: var(--text-muted);
}

.stock-status.out-of-stock {
  color: var(--accent-coral);
}

.product-title {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}

.product-title a {
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-title a:hover {
  color: #003399;
}

.rating-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
}

.stars-box {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #fbbf24;
}

.star-icon {
  width: 14px;
  height: 14px;
}

.rating-score {
  font-weight: 700;
  color: #0f172a;
}

.reviews-count {
  color: var(--text-muted);
}

.price-row {
  margin-top: auto;
  padding-top: 0.5rem;
}

.price-group {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.price-current {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  color: #003399;
}

.price-original {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

@media (max-width: 640px) {
  .card-badges {
    top: 0.35rem;
    left: 0.35rem;
    gap: 0.2rem;
    max-width: calc(100% - 2.5rem);
  }
  .mini-badge {
    padding: 0.1rem 0.3rem;
    font-size: 0.58rem;
    border-radius: 3px;
  }
  .card-content {
    padding: 0.75rem;
  }
  .product-title {
    font-size: 0.85rem;
  }
  .price-current {
    font-size: 0.95rem;
  }
  .quick-add-btn {
    opacity: 1;
    transform: none;
    width: 30px;
    height: 30px;
  }
}
</style>
