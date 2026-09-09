<template>
  <div class="cart-page container">
    <div class="cart-page-header">
      <h1 class="page-title">Keranjang Belanja Kamu</h1>
      <p class="page-subtitle">Periksa kembali daftar gear dan hardware sebelum melanjutkan ke proses pembayaran.</p>
    </div>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="empty-cart-box cyber-card">
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
                    <span v-if="item.selectedSize" class="variant-tag">Ukuran: {{ item.selectedSize }}</span>
                    <span v-if="item.selectedColor" class="variant-tag">Warna: {{ item.selectedColor }}</span>
                    <span v-if="item.nim" class="variant-tag"
                      style="background: rgba(139, 92, 246, 0.2); border-color: rgba(139, 92, 246, 0.4); color: #c4b5fd; font-weight: 700;">
                      <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1" />
                      NIM: {{ item.nim }}
                    </span>
                  </div>
                  <span class="item-weight">Berat: {{ item.product.weight || 500 }}g</span>
                </div>
              </div>

              <!-- Price -->
              <div class="row-price text-right">
                <span class="price-val">{{ formatRupiah(item.product.price) }}</span>
              </div>

              <!-- Quantity Controls -->
              <div class="row-qty">
                <div class="qty-stepper">
                  <button @click="cartStore.updateQuantity(item.id, item.quantity - 1)" class="qty-btn"
                    aria-label="Kurang">
                    -
                  </button>
                  <span class="qty-num">{{ item.quantity }}</span>
                  <button @click="cartStore.updateQuantity(item.id, item.quantity + 1)" class="qty-btn"
                    aria-label="Tambah">
                    +
                  </button>
                </div>
              </div>

              <!-- Line Total -->
              <div class="row-total text-right">
                <span v-if="item.quantity > 1" class="mobile-subtotal-hint">
                  {{ item.quantity }} × {{ formatRupiah(item.product.price) }}
                </span>
                <span class="line-total-val">{{ formatRupiah(item.product.price * item.quantity) }}</span>
              </div>

              <!-- Remove Action -->
              <div class="row-action text-right">
                <button @click="cartStore.removeFromCart(item.id)" class="remove-btn" title="Hapus Item">
                  <Icon name="lucide:trash-2" class="w-5 h-5" />
                </button>
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

          <!-- Promo Voucher Box -->
          <!-- <div class="voucher-box">
            <label class="voucher-label">Punya Kode Promo / Voucher?</label>
            <div class="voucher-input-group">
              <input
                v-model="voucherCode"
                type="text"
                placeholder="Misal: CYBER2026"
                class="input-cyber voucher-input"
              />
              <button @click="applyVoucher" class="btn btn-secondary voucher-btn">Gunakan</button>
            </div>
            <span v-if="voucherApplied" class="voucher-success">
              ✓ Voucher CYBER2026 berhasil diterapkan (Diskon Rp 50.000)
            </span>
          </div> -->

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
            <!-- <div v-if="voucherApplied" class="calc-row text-coral">
              <span class="calc-label">Potongan Diskon Voucher:</span>
              <span class="calc-val">-{{ formatRupiah(50000) }}</span>
            </div> -->
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
              <Icon name="lucide:lock" class="w-4 h-4 text-bsi" />
              <span>Transaksi aman dan terpercaya</span>
            </div>
            <div class="perk-row">
              <Icon name="lucide:zap" class="w-4 h-4 text-bsi" />
              <span>100% Produk Original</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const router = useRouter()
const cartStore = useCartStore()
const { formatRupiah } = useFormat()
const { getImageUrl } = useApi()

const voucherCode = ref('')
const voucherApplied = ref(false)

const applyVoucher = () => {
  if (voucherCode.value.trim().toUpperCase() === 'CYBER2026') {
    voucherApplied.value = true
  } else {
    alert('Kode voucher tidak valid atau sudah kedaluwarsa.')
  }
}

const finalTotal = computed(() => {
  const discount = voucherApplied.value ? 50000 : 0
  return Math.max(0, cartStore.subtotal - discount)
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
  padding-top: 2rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cart-page-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.page-title {
  font-size: clamp(1.4rem, 3.5vw, 2.25rem);
  font-weight: 800;
  color: #0f172a;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  line-height: 1.5;
}

/* Empty State */
.empty-cart-box {
  padding: 5rem 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.empty-icon-circle {
  width: 90px;
  height: 90px;
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
  gap: 2rem;
  align-items: start;
}

.cart-table-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

/* Desktop Table Header */
.table-header {
  display: grid;
  grid-template-columns: 2.5fr 1fr 1fr 1fr 40px;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.825rem;
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
  padding: 1.25rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.row-product {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.item-thumbnail {
  width: 68px;
  height: 68px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.item-name {
  font-size: 0.925rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.35;
  transition: color 0.2s ease;
  word-break: break-word;
}

.item-name:hover {
  color: #003399;
}

.item-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.variant-tag {
  font-size: 0.7rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 2px 7px;
  border-radius: 4px;
  color: #003399;
  font-weight: 600;
  line-height: 1.3;
}

.item-weight {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.price-val {
  font-size: 0.95rem;
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
  width: 30px;
  height: 30px;
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

.qty-btn:hover {
  background: #004aad;
  color: #ffffff;
}

.qty-num {
  padding: 0 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  min-width: 28px;
  text-align: center;
}

.mobile-subtotal-hint {
  display: none;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.line-total-val {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
  color: #003399;
}

.remove-btn {
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.remove-btn:hover {
  color: #ef4444;
  background: #fee2e2;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  gap: 1rem;
}

.continue-shopping {
  font-size: 0.875rem;
  font-weight: 700;
  color: #003399;
  transition: color 0.2s ease;
}

.continue-shopping:hover {
  color: #002266;
  text-decoration: underline;
}

.clear-cart-btn {
  font-size: 0.85rem;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: color 0.2s ease;
}

.clear-cart-btn:hover {
  color: #ef4444;
}

/* Summary Card */
.summary-card {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: sticky;
  top: 90px;
}

.summary-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  border-bottom: 1px solid var(--border-subtle);
  padding-bottom: 0.75rem;
}

.calc-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 1rem 0;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: #475569;
}

.calc-val {
  color: #0f172a;
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.total-row {
  margin-top: 0.35rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #cbd5e1;
  align-items: baseline;
}

.total-label {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.total-val {
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 3vw, 1.65rem);
  font-weight: 800;
  color: #003399;
}

.btn-checkout {
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.25);
  transition: all 0.2s ease;
}

.btn-checkout:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 51, 153, 0.35);
}

.btn-checkout svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.btn-checkout:hover svg {
  transform: translateX(3px);
}

.summary-perks {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.775rem;
  color: var(--text-secondary);
  padding-top: 0.25rem;
}

.perk-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================= */

/* 1. Laptops / Compact Desktops (<= 1100px) */
@media (max-width: 1100px) {
  .cart-layout {
    grid-template-columns: 1fr 330px;
    gap: 1.5rem;
  }

  .table-header,
  .cart-row {
    grid-template-columns: 2.2fr 1fr 1fr 1fr 36px;
  }
}

/* 2. Tablet Viewports (<= 900px) */
@media (max-width: 900px) {
  .cart-layout {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .summary-card {
    position: static;
  }
}

/* 3. Mobile Phones (<= 640px) - Modern Card Layout */
@media (max-width: 640px) {
  .cart-page {
    padding-top: 1rem;
    padding-bottom: 3.5rem;
    gap: 1.25rem;
  }

  .cart-table-card {
    padding: 1rem 0.85rem;
  }

  /* Hide raw table header on mobile */
  .table-header {
    display: none;
  }

  /* Restructure cart row into a spacious 2-row card */
  .cart-row {
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: 0.85rem;
    column-gap: 0.5rem;
    padding: 1rem 0;
    align-items: center;
  }

  .row-product {
    grid-column: 1 / 2;
    gap: 0.75rem;
    align-items: flex-start;
  }

  .item-thumbnail {
    width: 60px;
    height: 60px;
  }

  .item-name {
    font-size: 0.875rem;
    line-height: 1.3;
  }

  .row-action {
    grid-column: 2 / 3;
    align-self: flex-start;
  }

  .remove-btn {
    width: 32px;
    height: 32px;
    background: #fef2f2;
    color: #ef4444;
  }

  /* Unit price hidden or merged in mobile-subtotal-hint */
  .row-price {
    display: none;
  }

  .row-total {
    grid-column: 1 / 2;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .mobile-subtotal-hint {
    display: block;
    font-size: 0.725rem;
    color: var(--text-muted);
  }

  .line-total-val {
    font-size: 1.05rem;
  }

  .row-qty {
    grid-column: 2 / 3;
    justify-self: end;
  }

  .qty-stepper {
    margin: 0;
  }

  .qty-btn {
    width: 32px;
    height: 32px;
    font-size: 1.05rem;
  }

  .qty-num {
    padding: 0 0.5rem;
    min-width: 30px;
    font-size: 0.9rem;
  }

  /* Table Footer on Mobile */
  .table-footer {
    flex-direction: column-reverse;
    gap: 0.75rem;
    align-items: stretch;
    padding-top: 1.25rem;
  }

  .continue-shopping {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    border-radius: var(--radius-sm);
    text-decoration: none !important;
    font-size: 0.85rem;
  }

  .clear-cart-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 38px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-sm);
    color: #ef4444;
  }

  /* Summary Card Mobile */
  .summary-card {
    padding: 1.25rem 1rem;
    gap: 1rem;
  }

  .btn-checkout {
    min-height: 48px;
    font-size: 0.95rem;
  }
}

/* 4. Extra Narrow Phones (<= 375px) */
@media (max-width: 375px) {
  .cart-table-card {
    padding: 0.85rem 0.65rem;
  }

  .item-thumbnail {
    width: 52px;
    height: 52px;
  }

  .item-name {
    font-size: 0.825rem;
  }

  .variant-tag {
    font-size: 0.65rem;
    padding: 1px 5px;
  }

  .line-total-val {
    font-size: 0.95rem;
  }

  .qty-btn {
    width: 28px;
    height: 28px;
  }

  .qty-num {
    min-width: 24px;
    font-size: 0.825rem;
  }
}
</style>
