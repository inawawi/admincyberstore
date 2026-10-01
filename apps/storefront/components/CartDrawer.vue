<template>
  <div>
    <!-- Backdrop Overlay -->
    <transition name="fade">
      <div
        v-if="cartStore.isCartDrawerOpen"
        @click="cartStore.closeCart()"
        class="cart-backdrop"
      ></div>
    </transition>

    <!-- Slide-over Drawer -->
    <transition name="slide">
      <div v-if="cartStore.isCartDrawerOpen" class="cart-drawer">
        <!-- Drawer Header -->
        <div class="drawer-header">
          <div class="drawer-title-group">
            <Icon name="lucide:shopping-bag" class="w-5 h-5 text-cyan" />
            <h3 class="drawer-title">Keranjang Belanja</h3>
            <span class="badge badge-cyan">{{ cartStore.totalItems }} Item</span>
          </div>
          <button @click="cartStore.closeCart()" class="close-btn" aria-label="Tutup Keranjang">
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>
        </div>

        <!-- MABA Campus Banner in Drawer -->
        <div v-if="authStore.isAuthenticated && cartStore.hasEventMaba" class="drawer-maba-banner">
          <div class="drawer-maba-icon">
            <Icon name="lucide:graduation-cap" class="w-4 h-4 text-bsi" />
          </div>
          <div class="drawer-maba-info">
            <div class="drawer-maba-title-row">
              <strong class="drawer-maba-title">Pengambilan Kampus UBSI</strong>
              <span class="badge badge-purple" style="font-size: 0.65rem;">MABA</span>
            </div>
            <p class="drawer-maba-campus-name">{{ cartStore.mabaCampusLocation }}</p>
            <button type="button" @click="isCampusModalOpen = true" class="drawer-maba-change-btn">
              <Icon name="lucide:arrow-left-right" class="w-3 h-3 mr-0.5" />
              <span>Tukar Kampus</span>
            </button>
          </div>
        </div>

        <!-- Drawer Body -->
        <div class="drawer-body">
          <!-- Guest State (Belum Login) -->
          <div v-if="!authStore.isAuthenticated" class="empty-cart-state">
            <div class="empty-icon-box" style="background: rgba(0, 51, 153, 0.08); border: 1.5px solid rgba(0, 51, 153, 0.2);">
              <Icon name="lucide:lock" class="empty-svg w-12 h-12 text-bsi" />
            </div>
            <h4>Masuk ke Akun Anda</h4>
            <p>Silakan masuk terlebih dahulu untuk melihat dan menambahkan produk ke keranjang belanja.</p>
            <NuxtLink to="/auth/login" @click="cartStore.closeCart()" class="btn btn-primary">
              <Icon name="lucide:log-in" class="w-4 h-4 mr-1.5 inline" />
              <span>Masuk Sekarang</span>
            </NuxtLink>
          </div>

          <!-- Empty Cart State -->
          <div v-else-if="cartStore.items.length === 0" class="empty-cart-state">
            <div class="empty-icon-box">
              <Icon name="lucide:shopping-cart" class="empty-svg w-12 h-12 text-muted" />
            </div>
            <h4>Keranjang Masih Kosong</h4>
            <p>Jelajahi produk teknologi masa depan dan temukan gear impianmu sekarang!</p>
            <NuxtLink to="/products" @click="cartStore.closeCart()" class="btn btn-primary">
              Mulai Belanja
            </NuxtLink>
          </div>

          <!-- Items List -->
          <div v-else class="cart-items-list">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="cart-item-card"
            >
              <!-- Thumbnail -->
              <img
                :src="getImageUrl(item.product.main_photo)"
                :alt="item.product.name"
                class="cart-item-img"
              />

              <!-- Info -->
              <div class="cart-item-info">
                <NuxtLink
                  :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.productId}`"
                  @click="cartStore.closeCart()"
                  class="cart-item-name"
                >
                  {{ item.product.name }}
                </NuxtLink>

                <div class="cart-item-variants">
                  <!-- Quick Size Switcher Dropdown in Drawer -->
                  <div v-if="item.selectedSize || item.product.is_event_maba || (item.product.sizes && item.product.sizes.length)" class="drawer-size-swap-box">
                    <span class="variant-chip size-chip font-bold">
                      Size: {{ item.selectedSize || 'Pilih' }}
                    </span>
                    <div class="drawer-size-select-wrap">
                      <select
                        :value="item.selectedSize"
                        @change="onHandleChangeSize(item.id, ($event.target as HTMLSelectElement).value)"
                        class="drawer-select-size"
                        title="Tukar Ukuran"
                      >
                        <option
                          v-for="s in getItemSizes(item)"
                          :key="s"
                          :value="s"
                        >
                          Size {{ s }}
                        </option>
                      </select>
                      <Icon name="lucide:chevron-down" class="drawer-chevron-mini" />
                    </div>
                  </div>

                  <span v-if="item.selectedColor" class="variant-chip color-chip">Color: {{ item.selectedColor }}</span>
                  <span v-if="item.nim" class="variant-chip" style="background: rgba(139, 92, 246, 0.15); color: #7c3aed; border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 700;">
                    NIM: {{ item.nim }}
                  </span>
                  <span v-if="item.product.is_event_maba" class="variant-chip" style="background: #eff6ff; color: #004aad; border: 1px solid #bfdbfe; font-weight: 700;">
                    Maks. 1 unit
                  </span>
                </div>

                <div class="cart-item-price-row">
                  <span class="item-price">{{ formatRupiah(item.product.price) }}</span>
                </div>

                <!-- Quantity Stepper -->
                <div class="cart-item-controls">
                  <div class="qty-stepper" :class="{ 'stepper-locked': item.product.is_event_maba }">
                    <button
                      type="button"
                      @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                      class="qty-btn"
                      :disabled="item.quantity <= 1 || item.product.is_event_maba"
                      :title="item.product.is_event_maba ? 'Maksimal 1 unit untuk Event Maba' : item.quantity <= 1 ? 'Minimal 1 unit' : undefined"
                      aria-label="Kurangi Jumlah"
                    >
                      -
                    </button>
                    <span class="qty-val" :title="item.product.is_event_maba ? 'Kuantitas terkunci 1 unit untuk Event MABA' : undefined">
                      {{ item.quantity }}
                    </span>
                    <button
                      type="button"
                      @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                      class="qty-btn"
                      :disabled="item.quantity >= (item.product.is_event_maba ? 1 : item.product.stock)"
                      :title="item.product.is_event_maba ? 'Maksimal 1 unit untuk produk Event Maba' : undefined"
                      aria-label="Tambah Jumlah"
                    >
                      +
                    </button>
                  </div>

                  <button
                    @click="cartStore.removeFromCart(item.id)"
                    class="remove-item-btn"
                    title="Hapus Item"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Drawer Footer -->
        <div v-if="authStore.isAuthenticated && cartStore.items.length > 0" class="drawer-footer">
          <div class="subtotal-row">
            <span class="subtotal-label">Subtotal Belanja:</span>
            <span class="subtotal-value">{{ formatRupiah(cartStore.subtotal) }}</span>
          </div>
          <div class="footer-actions">
            <NuxtLink
              to="/cart"
              @click="cartStore.closeCart()"
              class="btn btn-secondary w-full"
            >
              Lihat Keranjang
            </NuxtLink>
            <NuxtLink
              to="/checkout"
              @click="cartStore.closeCart()"
              class="btn btn-primary w-full"
            >
              Checkout Sekarang
            </NuxtLink>
          </div>
        </div>
      </div>
    </transition>

    <!-- Modal Tukar Kampus UBSI -->
    <CampusPickupModal
      :is-open="isCampusModalOpen"
      :selected-campus-name="cartStore.mabaCampusLocation"
      @close="isCampusModalOpen = false"
      @select="handleSelectCampus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore, type CartItem } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import CampusPickupModal from '~/components/CampusPickupModal.vue'
import type { UbsiCampus } from '~/utils/ubsi-campuses'

const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()
const { formatRupiah } = useFormat()
const { getImageUrl } = useApi()

const isCampusModalOpen = ref(false)

const getItemSizes = (item: CartItem): string[] => {
  if (Array.isArray(item.product?.sizes) && item.product.sizes.length > 0) {
    return item.product.sizes
  }
  if (item.product?.is_event_maba) {
    return ['S', 'M', 'L', 'XL', 'XXL', '3XL']
  }
  return item.selectedSize ? [item.selectedSize] : ['S', 'M', 'L', 'XL']
}

const onHandleChangeSize = (itemId: string, newSize: string) => {
  if (!newSize) return
  const success = cartStore.changeItemSize(itemId, newSize)
  if (success) {
    toast.success(`Ukuran produk berhasil ditukar ke: ${newSize}`, {
      title: 'Ukuran Diperbarui',
      duration: 3000,
    })
  }
}

const handleSelectCampus = (campus: UbsiCampus) => {
  cartStore.setAllMabaCampus(campus.name)
  toast.success(`Lokasi pengambilan kampus berhasil diubah ke: ${campus.name}`, {
    title: 'Lokasi Kampus Diperbarui',
    duration: 3500,
  })
}
</script>

<style scoped>
.cart-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-left: 1px solid var(--border-subtle);
  z-index: 1001;
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 35px rgba(0, 51, 153, 0.15);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-title-group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.drawer-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.text-cyan {
  color: #004aad;
}

.close-btn {
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Drawer MABA Banner */
.drawer-maba-banner {
  background: #f0f7ff;
  border-bottom: 1.5px solid #bfdbfe;
  padding: 0.85rem 1.25rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.drawer-maba-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.drawer-maba-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.drawer-maba-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-maba-title {
  font-size: 0.8rem;
  color: #003399;
}

.drawer-maba-campus-name {
  font-size: 0.75rem;
  color: #334155;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}

.drawer-maba-change-btn {
  font-size: 0.7rem;
  font-weight: 700;
  color: #004aad;
  background: transparent;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  margin-top: 0.25rem;
  padding: 0;
  text-decoration: underline;
}

.drawer-maba-change-btn:hover {
  color: #003399;
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
}

.empty-cart-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1rem;
}

.empty-icon-box {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #eff6ff;
  border: 1.5px dashed #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-svg {
  width: 38px;
  height: 38px;
  color: #004aad;
}

.empty-cart-state h4 {
  font-size: 1.15rem;
  color: #0f172a;
}

.empty-cart-state p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 280px;
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item-card {
  display: flex;
  gap: 1rem;
  padding: 0.85rem;
  background: #f8fafc;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
}

.cart-item-img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: #e2e8f0;
}

.cart-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cart-item-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cart-item-name:hover {
  color: #003399;
}

.cart-item-variants {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  align-items: center;
}

.drawer-size-swap-box {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.drawer-size-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.drawer-select-size {
  appearance: none;
  background: #ffffff;
  border: 1px solid #004aad;
  border-radius: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  color: #004aad;
  padding: 1px 16px 1px 6px;
  cursor: pointer;
}

.drawer-chevron-mini {
  position: absolute;
  right: 3px;
  width: 10px;
  height: 10px;
  color: #004aad;
  pointer-events: none;
}

.variant-chip {
  font-size: 0.7rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 1px 6px;
  border-radius: 4px;
  color: #003399;
  font-weight: 600;
}

.color-chip {
  background: #faf5ff;
  border-color: #e9d5ff;
  color: #7e22ce;
}

.item-price {
  font-size: 0.925rem;
  font-weight: 800;
  color: #003399;
}

.cart-item-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.25rem;
}

.qty-stepper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
}

.qty-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
}

.qty-btn:hover:not(:disabled) {
  background: #004aad;
  color: #ffffff;
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: #f1f5f9;
  color: #94a3b8;
}

.qty-val {
  width: 30px;
  text-align: center;
  font-size: 0.825rem;
  font-weight: 700;
  color: #0f172a;
}

.remove-item-btn {
  color: #94a3b8;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.remove-item-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.drawer-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subtotal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.subtotal-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.subtotal-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #003399;
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
