<template>
  <div class="cart-page container">
    <div class="cart-page-header">
      <h1 class="page-title">Keranjang Belanja Kamu</h1>
      <p class="page-subtitle">Periksa kembali daftar gear dan perlengkapan sebelum melanjutkan ke proses pembayaran.
      </p>
    </div>

    <!-- Event MABA Banner & Campus Pickup Box in Cart -->
    <div v-if="authStore.isAuthenticated && cartStore.hasEventMaba" class="maba-cart-banner-card cyber-card">
      <div class="maba-banner-content">
        <div class="maba-banner-icon-circle">
          <Icon name="lucide:graduation-cap" class="w-6 h-6 text-bsi" />
        </div>
        <div class="maba-banner-text">
          <div class="maba-banner-tag-row">
            <span class="badge badge-purple font-bold">EVENT MABA UBSI</span>
            <span class="badge badge-emerald">Bebas Ongkir Pengambilan Kampus</span>
          </div>
          <h3 class="maba-banner-title">Pengambilan Perlengkapan Kuliah di Kampus UBSI</h3>
          <p class="maba-banner-desc">
            Pesanan Event MABA akan diambil langsung di area kampus yang Anda pilih saat pelaksanaan kegiatan Ormik
            &amp; Semot.
          </p>
          <div class="maba-selected-campus-box">
            <div class="campus-current-info">
              <Icon name="lucide:map-pin" class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div class="campus-name-wrap">
                <span class="campus-label">Lokasi Kampus Pengambilan:</span>
                <strong class="campus-name-highlight">{{ cartStore.mabaCampusLocation }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest State (Belum Login) -->
    <div v-if="!authStore.isAuthenticated" class="empty-cart-box cyber-card">
      <div class="empty-icon-circle"
        style="background: rgba(0, 51, 153, 0.08); border: 1.5px solid rgba(0, 51, 153, 0.2);">
        <Icon name="lucide:lock" class="w-12 h-12 text-bsi" />
      </div>
      <h2>Masuk ke Akun Anda</h2>
      <p>Silakan masuk ke akun Anda terlebih dahulu untuk melihat dan mengelola keranjang belanja.</p>
      <NuxtLink to="/auth/login" class="btn btn-primary">
        <Icon name="lucide:log-in" class="w-4 h-4 mr-1.5" />
        <span>Masuk Sekarang</span>
      </NuxtLink>
    </div>

    <!-- Empty State -->
    <div v-else-if="cartStore.items.length === 0" class="empty-cart-box cyber-card">
      <div class="empty-icon-circle">
        <Icon name="lucide:shopping-cart" class="w-12 h-12 text-cyan" />
      </div>
      <h2>Keranjang Belanja Masih Kosong</h2>
      <p>Kamu belum menambahkan produk apa pun ke dalam keranjang belanja.</p>
      <NuxtLink to="/products" class="btn btn-primary">
        <span>Jelajahi Produk Sekarang</span>
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- Cart Layout -->
    <div v-else class="cart-layout">
      <!-- Left: Cart Items List -->
      <div class="cart-items-col">
        <div class="cart-table-card cyber-card">
          <div class="table-header">
            <span>Produk</span>
            <span class="text-right">Harga Satuan</span>
            <span class="text-center">Kuantitas</span>
            <span class="text-right">Total</span>
            <span></span>
          </div>

          <div class="table-body">
            <div v-for="item in cartStore.items" :key="item.id" class="cart-row">
              <!-- Product info & photo -->
              <div class="row-product">
                <img :src="getImageUrl(item.product.main_photo)" :alt="item.product.name" class="item-thumbnail" />
                <div class="item-meta">
                  <NuxtLink :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.productId}`"
                    class="item-name">
                    {{ item.product.name }}
                  </NuxtLink>

                  <div class="item-variants">
                    <!-- Size Display & Switcher -->
                    <div
                      v-if="item.selectedSize || item.product.is_event_maba || (item.product.sizes && item.product.sizes.length)"
                      class="size-switcher-inline">
                      <span class="variant-tag size-active-tag">
                        <Icon name="lucide:shirt" class="w-3 h-3 inline mr-1" />
                        Ukuran: <strong>{{ item.selectedSize || 'Pilih Ukuran' }}</strong>
                      </span>

                      <!-- Quick Size Swap Dropdown -->
                      <div class="quick-size-select-wrap">
                        <label :for="`size-select-${item.id}`" class="sr-only">Tukar Ukuran</label>
                        <select :id="`size-select-${item.id}`" :value="item.selectedSize"
                          @change="onHandleChangeSize(item.id, ($event.target as HTMLSelectElement).value)"
                          class="select-size-mini" title="Tukar Ukuran Produk">
                          <option v-for="s in getItemSizes(item)" :key="s" :value="s">
                            Tukar ke: Size {{ s }}
                          </option>
                        </select>
                        <Icon name="lucide:chevron-down" class="select-chevron-mini" />
                      </div>
                    </div>

                    <span v-if="item.selectedColor" class="variant-tag color-tag">
                      <Icon name="lucide:palette" class="w-3 h-3 inline mr-1" />
                      Warna: {{ item.selectedColor }}
                    </span>

                    <span v-if="item.nim" class="variant-tag nim-tag">
                      <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1" />
                      NIM: {{ item.nim }}
                    </span>

                    <span v-if="item.product.is_event_maba" class="variant-tag maba-limit-tag">
                      Maks. 1 unit (Event MABA)
                    </span>
                  </div>

                  <!-- MABA Campus Location Indicator per Item -->
                  <div v-if="item.product.is_event_maba" class="item-campus-row">
                    <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-bsi flex-shrink-0" />
                    <span class="campus-item-text">
                      Pengambilan: <strong>{{ item.campus_location || cartStore.mabaCampusLocation }}</strong>
                    </span>
                    <button type="button" @click="isCampusModalOpen = true" class="btn-item-swap-campus"
                      title="Pilih Lokasi kampus pengambilan">
                      Pilih Lokasi
                    </button>
                  </div>

                  <span class="item-weight">Berat: {{ item.product.weight || 500 }}g</span>

                  <!-- Mobile Unit Price Display -->
                  <div class="mobile-unit-price">
                    <span class="mobile-price-label">Harga Satuan:</span>
                    <span class="mobile-price-val">{{ formatRupiah(item.product.price) }}</span>
                  </div>
                </div>
              </div>

              <!-- Price (Desktop Only) -->
              <div class="row-price text-right desktop-only">
                <span class="price-val">{{ formatRupiah(item.product.price) }}</span>
              </div>

              <!-- Bottom Controls Wrap (Seamless on Desktop with display: contents, flex row on Mobile) -->
              <div class="row-controls-wrap">
                <!-- Quantity Controls -->
                <div class="row-qty">
                  <div class="qty-stepper" :class="{ 'stepper-locked': item.product.is_event_maba }">
                    <button type="button" @click="cartStore.updateQuantity(item.id, item.quantity - 1)" class="qty-btn"
                      :disabled="item.quantity <= 1 || item.product.is_event_maba"
                      :title="item.product.is_event_maba ? 'Maksimal 1 unit untuk Event Maba' : item.quantity <= 1 ? 'Minimal 1 unit' : undefined"
                      aria-label="Kurangi kuantitas">
                      -
                    </button>
                    <span class="qty-num"
                      :title="item.product.is_event_maba ? 'Kuantitas terkunci 1 unit untuk Event MABA' : undefined">
                      {{ item.quantity }}
                    </span>
                    <button type="button" @click="cartStore.updateQuantity(item.id, item.quantity + 1)" class="qty-btn"
                      :disabled="item.quantity >= (item.product.is_event_maba ? 1 : item.product.stock)"
                      :title="item.product.is_event_maba ? 'Maksimal 1 unit untuk produk Event Maba' : undefined"
                      aria-label="Tambah kuantitas">
                      +
                    </button>
                  </div>
                </div>

                <!-- Line Total -->
                <div class="row-total text-right">
                  <span class="mobile-total-label">Subtotal:</span>
                  <span class="line-total-val">{{ formatRupiah(item.product.price * item.quantity) }}</span>
                </div>

                <!-- Remove Action -->
                <div class="row-action text-right">
                  <button @click="cartStore.removeFromCart(item.id)" class="remove-btn" title="Hapus Item"
                    aria-label="Hapus Item">
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="table-footer">
            <NuxtLink to="/products" class="continue-shopping">
              <Icon name="lucide:arrow-left" class="w-4 h-4 inline mr-1" />
              Lanjut Belanja Produk Lain
            </NuxtLink>
            <button @click="cartStore.clearCart()" class="clear-cart-btn">
              Kosongkan Keranjang
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Summary Sidebar -->
      <aside class="cart-summary-col">
        <div class="summary-card cyber-card">
          <h3 class="summary-title">Ringkasan Belanja</h3>

          <!-- Event Maba Delivery Info in Summary -->
          <div v-if="cartStore.hasEventMaba" class="summary-maba-badge-box">
            <div class="summary-maba-header">
              <Icon name="lucide:truck" class="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <strong class="text-emerald-700 text-xs uppercase tracking-wider">Pengiriman Khusus MABA</strong>
            </div>
            <p class="summary-maba-text">
              Diambil langsung di <strong>{{ cartStore.mabaCampusLocation }}</strong> saat kegiatan berlangsung.
            </p>
          </div>

          <!-- Price Calculation Breakdown -->
          <div class="calc-list">
            <div class="calc-row">
              <span class="calc-label">Total Item:</span>
              <span class="calc-val">{{ cartStore.totalItems }} barang</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Estimasi Berat Paket:</span>
              <span class="calc-val">{{ (cartStore.totalWeight / 1000).toFixed(2) }} kg ({{ cartStore.totalWeight
              }}g)</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Subtotal:</span>
              <span class="calc-val font-bold">{{ formatRupiah(cartStore.subtotal) }}</span>
            </div>
            <div class="calc-row total-row">
              <span class="total-label">Total Belanja:</span>
              <span class="total-val">{{ formatRupiah(finalTotal) }}</span>
            </div>
          </div>

          <!-- Checkout Button -->
          <button @click="handleProceedCheckout" class="btn btn-primary btn-checkout">
            <span>Lanjut ke Checkout</span>
            <Icon name="lucide:arrow-right" class="w-5 h-5" />
          </button>

          <!-- Security Assurance -->
          <div class="summary-perks">
            <div class="perk-row">
              <Icon name="lucide:lock" class="w-4 h-4 text-bsi flex-shrink-0" />
              <span>Transaksi aman dan terpercaya</span>
            </div>
            <div class="perk-row">
              <Icon name="lucide:zap" class="w-4 h-4 text-bsi flex-shrink-0" />
              <span>100% Produk Original Kampus</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Modal Tukar Kampus Pengambilan UBSI -->
    <CampusPickupModal :is-open="isCampusModalOpen" :selected-campus-name="cartStore.mabaCampusLocation"
      @close="isCampusModalOpen = false" @select="handleSelectCampus" />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore, type CartItem } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import CampusPickupModal from '~/components/CampusPickupModal.vue'
import type { UbsiCampus } from '~/utils/ubsi-campuses'

const router = useRouter()
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
    toast.success(`Ukuran produk berhasil diubah menjadi: ${newSize}`, {
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

const finalTotal = computed(() => {
  return Math.max(0, cartStore.subtotal)
})

const handleProceedCheckout = () => {
  router.push('/checkout')
}

useHead({
  title: 'Keranjang Belanja | Cyber Store',
})
</script>

<style scoped>
/* Page Container */
.cart-page {
  padding-top: 1.5rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

.cart-page-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.page-title {
  font-size: clamp(1.35rem, 3.5vw, 2rem);
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  line-height: 1.5;
}

/* Event MABA Banner Card */
.maba-cart-banner-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%);
  border: 1.5px solid #93c5fd;
  border-radius: 14px;
  padding: 1.15rem 1.35rem;
  box-shadow: 0 4px 14px rgba(0, 74, 173, 0.08);
}

.maba-banner-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.maba-banner-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ffffff;
  border: 1.5px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 74, 173, 0.12);
}

.maba-banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.maba-banner-tag-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.maba-banner-title {
  font-size: 1rem;
  font-weight: 800;
  color: #003399;
  margin: 0;
  word-break: break-word;
}

.maba-banner-desc {
  font-size: 0.825rem;
  color: #334155;
  margin: 0;
  line-height: 1.45;
  word-break: break-word;
}

.maba-selected-campus-box {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  background: #ffffff;
  border-radius: 10px;
  border: 1.5px solid #bfdbfe;
  flex-wrap: wrap;
}

.campus-current-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.campus-name-wrap {
  display: flex;
  flex-direction: column;
}

.campus-label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.campus-name-highlight {
  font-size: 0.875rem;
  color: #0f172a;
  font-weight: 700;
  word-break: break-word;
}

/* Empty State */
.empty-cart-box {
  padding: 4rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.empty-icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--accent-cyan-dim);
  border: 1px dashed rgba(0, 240, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-cyan {
  color: var(--accent-cyan);
}

.empty-cart-box h2 {
  font-size: clamp(1.2rem, 3vw, 1.5rem);
  font-weight: 800;
  color: #0f172a;
}

.empty-cart-box p {
  color: var(--text-secondary);
  max-width: 380px;
  font-size: 0.9rem;
  line-height: 1.5;
}

/* Cart Layout */
.cart-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1.5rem;
  align-items: start;
  width: 100%;
}

.cart-items-col {
  width: 100%;
  min-width: 0;
}

.cart-table-card {
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

/* Desktop Table Header */
.table-header {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr 40px;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  align-items: center;
}

.text-right {
  text-align: right;
}

.text-center {
  text-align: center;
}

.table-body {
  display: flex;
  flex-direction: column;
}

/* Desktop Cart Row */
.cart-row {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr 40px;
  align-items: center;
  padding: 1.15rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.row-controls-wrap {
  display: contents;
}

.mobile-unit-price,
.mobile-total-label {
  display: none;
}

.row-product {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  min-width: 0;
}

.item-thumbnail {
  width: 68px;
  height: 68px;
  border-radius: 8px;
  object-fit: contain;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
}

.item-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  transition: color 0.2s ease;
  word-break: break-word;
  text-decoration: none;
}

.item-name:hover {
  color: #003399;
}

.item-variants {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.size-switcher-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.size-active-tag {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #004aad;
  font-weight: 700;
}

.quick-size-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.select-size-mini {
  appearance: none;
  background: #ffffff;
  border: 1.5px solid #004aad;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #004aad;
  padding: 2px 20px 2px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.select-size-mini:hover {
  background: #f0f7ff;
}

.select-chevron-mini {
  position: absolute;
  right: 5px;
  width: 12px;
  height: 12px;
  color: #004aad;
  pointer-events: none;
}

.variant-tag {
  font-size: 0.7rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 7px;
  border-radius: 6px;
  color: #475569;
  font-weight: 600;
  line-height: 1.3;
  display: inline-flex;
  align-items: center;
}

.color-tag {
  background: #faf5ff;
  border-color: #e9d5ff;
  color: #7e22ce;
}

.nim-tag {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.3);
  color: #6d28d9;
  font-weight: 700;
}

.maba-limit-tag {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
  font-weight: 700;
}

.item-campus-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.74rem;
  color: #334155;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  padding: 3px 8px;
  border-radius: 6px;
  flex-wrap: wrap;
}

.campus-item-text {
  flex: 1;
  min-width: 120px;
}

.btn-item-swap-campus {
  font-size: 0.7rem;
  font-weight: 700;
  color: #004aad;
  background: transparent;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.btn-item-swap-campus:hover {
  color: #003399;
}

.item-weight {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.price-val {
  font-size: 0.925rem;
  font-weight: 700;
  color: #0f172a;
}

.qty-stepper {
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
  margin: 0 auto;
}

.qty-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #334155;
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
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

.qty-num {
  width: 32px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.line-total-val {
  font-size: 0.95rem;
  font-weight: 800;
  color: #004aad;
  font-family: monospace;
}

.remove-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  background: #fff5f5;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: auto;
}

.remove-btn:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 1.15rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 0.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.continue-shopping {
  font-size: 0.85rem;
  font-weight: 700;
  color: #004aad;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
  text-decoration: none;
}

.continue-shopping:hover {
  color: #003399;
}

.clear-cart-btn {
  font-size: 0.8rem;
  font-weight: 600;
  color: #ef4444;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.clear-cart-btn:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* Right Summary Column */
.cart-summary-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.summary-card {
  padding: 1.35rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.summary-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.summary-maba-badge-box {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-maba-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.summary-maba-text {
  font-size: 0.78rem;
  color: #065f46;
  margin: 0;
  line-height: 1.35;
}

.calc-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.85rem;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #475569;
}

.calc-val {
  color: #0f172a;
}

.total-row {
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.85rem;
  margin-top: 0.25rem;
  font-size: 1rem;
}

.total-label {
  font-weight: 800;
  color: #0f172a;
}

.total-val {
  font-weight: 800;
  font-size: 1.2rem;
  color: #004aad;
  font-family: monospace;
}

.btn-checkout {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 8px;
}

.summary-perks {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 0.85rem;
}

.perk-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: #64748b;
}

/* ==========================================================================
   RESPONSIVE MEDIA QUERIES (TABLET & SMARTPHONE)
   ========================================================================== */
@media (max-width: 991px) {
  .cart-layout {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .cart-summary-col {
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .cart-page {
    padding-top: 1rem;
    padding-bottom: 4rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    gap: 1rem;
  }

  .table-header {
    display: none;
  }

  .cart-table-card {
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .table-body {
    gap: 0.85rem;
  }

  .cart-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  }

  .desktop-only {
    display: none !important;
  }

  .mobile-unit-price {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.2rem;
  }

  .mobile-price-label {
    font-size: 0.72rem;
    color: #64748b;
  }

  .mobile-price-val {
    font-size: 0.825rem;
    font-weight: 700;
    color: #003399;
  }

  .row-controls-wrap {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px dashed #e2e8f0;
    width: 100%;
  }

  .row-qty {
    display: flex;
    align-items: center;
  }

  .row-total {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex: 1;
    justify-content: flex-end;
    text-align: right;
    margin-right: 0.25rem;
  }

  .mobile-total-label {
    display: inline;
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 600;
  }

  .line-total-val {
    font-size: 0.925rem;
  }

  .table-footer {
    padding: 1rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-top: 0.25rem;
    flex-direction: column-reverse;
    gap: 0.85rem;
    text-align: center;
  }

  .continue-shopping {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .maba-banner-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .maba-selected-campus-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .campus-current-info {
    min-width: 100%;
  }

  .item-thumbnail {
    width: 60px;
    height: 60px;
  }

  .item-name {
    font-size: 0.85rem;
  }

  .row-controls-wrap {
    flex-wrap: wrap;
    gap: 0.65rem;
  }

  .row-total {
    order: 2;
  }

  .row-action {
    order: 3;
  }
}
</style>
