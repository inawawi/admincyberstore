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

        <!-- Drawer Body -->
        <div class="drawer-body">
          <!-- Empty Cart State -->
          <div v-if="cartStore.items.length === 0" class="empty-cart-state">
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
                  <span v-if="item.selectedSize" class="variant-chip">Size: {{ item.selectedSize }}</span>
                  <span v-if="item.selectedColor" class="variant-chip">Color: {{ item.selectedColor }}</span>
                </div>

                <div class="cart-item-price-row">
                  <span class="item-price">{{ formatRupiah(item.product.price) }}</span>
                </div>

                <!-- Quantity Stepper -->
                <div class="cart-item-controls">
                  <div class="qty-stepper">
                    <button
                      @click="cartStore.updateQuantity(item.id, item.quantity - 1)"
                      class="qty-btn"
                      aria-label="Kurangi Jumlah"
                    >
                      -
                    </button>
                    <span class="qty-val">{{ item.quantity }}</span>
                    <button
                      @click="cartStore.updateQuantity(item.id, item.quantity + 1)"
                      class="qty-btn"
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
        <div v-if="cartStore.items.length > 0" class="drawer-footer">
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
              to="/cart"
              @click="cartStore.closeCart()"
              class="btn btn-primary w-full"
            >
              Checkout Sekarang
            </NuxtLink>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const cartStore = useCartStore()
const { formatRupiah } = useFormat()
const { getImageUrl } = useApi()
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

.qty-btn:hover {
  background: #004aad;
  color: #ffffff;
}

.qty-val {
  padding: 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #0f172a;
}

.remove-item-btn {
  color: var(--text-muted);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-item-btn svg {
  width: 14px;
  height: 14px;
  min-width: 14px;
  flex-shrink: 0;
}

.remove-item-btn:hover {
  color: var(--accent-coral);
  background: #fef2f2;
}

.drawer-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.subtotal-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subtotal-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
}

.subtotal-value {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
  color: #003399;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.footer-actions .btn {
  padding: 0.6rem 0.85rem;
  font-size: 0.825rem;
}

.w-full {
  flex: 1;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Responsive */
@media (max-width: 480px) {
  .cart-drawer {
    max-width: 100%;
  }

  .drawer-header {
    padding: 1rem 1.15rem;
  }

  .drawer-body {
    padding: 1rem 1.15rem;
  }

  .drawer-footer {
    padding: 1rem 1.15rem;
  }

  .cart-item-img {
    width: 60px;
    height: 60px;
  }

  .cart-item-name {
    font-size: 0.825rem;
  }

  .item-price {
    font-size: 0.875rem;
  }

  .footer-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-actions .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 360px) {
  .drawer-title {
    font-size: 1rem;
  }

  .subtotal-value {
    font-size: 1.1rem;
  }
}
</style>
