<template>
  <div class="orders-page container">
    <!-- Header with Breadcrumbs -->
    <div class="orders-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Beranda</NuxtLink>
        <span class="breadcrumb-separator">/</span>
        <span class="current">Pesanan Saya</span>
      </nav>
      <div class="header-content-row">
        <div>
          <h1 class="page-title">Riwayat Transaksi & Pelacakan</h1>
          <p class="page-subtitle">Pantau status pengiriman paket secara real-time, nomor resi kurir, dan riwayat
            belanja Anda.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-refresh-orders" @click="refreshOrders()"
          :disabled="isRefreshing">
          <Icon name="lucide:refresh-cw" :class="['w-4 h-4 mr-1 inline-block', { 'animate-spin': isRefreshing }]" />
          <span>{{ isRefreshing ? 'Memuat...' : 'Segarkan Data' }}</span>
        </button>
      </div>
    </div>

    <!-- If not authenticated -->
    <div v-if="!authStore.isAuthenticated" class="auth-required-box cyber-card">
      <div class="lock-icon-circle">
        <Icon name="lucide:lock" class="w-8 h-8 text-bsi" />
      </div>
      <h2>Silakan Masuk Terlebih Dahulu</h2>
      <p>Masuk ke akun Anda untuk melihat daftar transaksi dan melacak pesanan Anda.</p>
      <NuxtLink to="/auth/login?redirect=/account/orders" class="btn btn-primary btn-auth-login">
        <span>Masuk Akun</span>
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </NuxtLink>
    </div>

    <div v-else class="orders-main-content">
      <!-- Search and Status Filter Bar -->
      <div class="filter-search-container">
        <!-- Status Tabs -->
        <div class="status-tabs-scroll">
          <button v-for="tab in statusTabs" :key="tab.key"
            :class="['status-tab-btn', { active: activeStatus === tab.key }]" @click="activeStatus = tab.key">
            <span>{{ tab.label }}</span>
            <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Search Input -->
        <div class="orders-search-wrapper">
          <Icon name="lucide:search" class="search-icon w-4 h-4" />
          <input v-model="searchQuery" type="text" placeholder="Cari no. invoice, nama produk, penerima..."
            class="orders-search-input" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">
            <Icon name="lucide:x" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="pending && !orders.length" class="orders-list">
        <div v-for="i in 3" :key="i" class="order-card skeleton-card">
          <div class="skeleton-header skeleton"></div>
          <div class="skeleton-item-row skeleton"></div>
          <div class="skeleton-footer skeleton"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredOrders.length === 0" class="empty-orders-box cyber-card">
        <div class="empty-icon-circle">
          <Icon name="lucide:package-open" class="w-10 h-10 text-muted" />
        </div>
        <h2>Tidak Ada Pesanan Ditemukan</h2>
        <p v-if="searchQuery || activeStatus !== 'all'">
          Tidak ada transaksi dengan status atau kata kunci yang Anda cari. Coba pilih status lain.
        </p>
        <p v-else>
          Kamu belum pernah melakukan transaksi pembelian di Cyber Store. Temukan perlengkapan kuliah terbaik sekarang!
        </p>
        <NuxtLink to="/products" class="btn btn-primary">
          <span>Lihat Katalog Produk</span>
          <Icon name="lucide:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>

      <!-- Orders List -->
      <div v-else class="orders-list">
        <div v-for="order in filteredOrders" :key="order.id" class="order-card cyber-card">
          <!-- 1. Card Header -->
          <div class="order-card-header">
            <div class="order-meta-left">
              <div class="order-invoice-row">
                <span class="invoice-label">No. Invoice:</span>
                <strong class="order-invoice font-mono">{{ order.invoice_number || `ORD-#${order.id}` }}</strong>
                <button type="button" class="btn-copy-invoice" @click="copyText(order.invoice_number)"
                  title="Salin No Invoice">
                  <Icon name="lucide:copy" class="w-3.5 h-3.5" />
                </button>
                <button v-if="isOrderPaid(order)" type="button" class="btn-print-icon" @click="openInvoiceModal(order)"
                  title="Cetak Bukti Pembayaran / Invoice">
                  <Icon name="lucide:printer" class="w-3.5 h-3.5" />
                </button>
              </div>
              <span class="order-date">{{ formatDateTime(order.created_at) }}</span>
            </div>

            <div class="order-meta-right">
              <span :class="['badge', getStatusBadgeClass(order.status)]">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
          </div>

          <!-- 2. Ordered Items List -->
          <div class="order-items-list">
            <div v-for="item in (order.items || [])" :key="item.id" class="order-item-row">
              <img :src="getImageUrl(item.product?.main_photo)" :alt="item.product_name || item.product?.name"
                class="order-item-img" />
              <div class="order-item-details">
                <NuxtLink :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.product_id}`"
                  class="order-item-title">
                  {{ item.product_name || item.product?.name }}
                </NuxtLink>
                <div class="order-item-sub">
                  <span v-if="item.size" class="variant-tag">Ukuran: {{ item.size }}</span>
                  <span v-if="item.color" class="variant-tag">Warna: {{ item.color }}</span>
                  <span v-if="item.nim" class="variant-tag nim-tag">
                    <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1" />
                    NIM: {{ item.nim }}
                  </span>
                  <span class="item-qty-price">{{ item.quantity }}x {{ formatRupiah(item.price) }}</span>
                </div>
              </div>
              <div class="order-item-right-wrap">
                <div class="order-item-total font-mono">
                  {{ formatRupiah(item.total || (item.price * item.quantity)) }}
                </div>
                <!-- Tombol Nilai / Lihat Penilaian per produk jika sudah tiba / selesai -->
                <div v-if="isOrderArrivedOrCompleted(order)" class="order-item-action-btns">
                  <NuxtLink
                    v-if="!isItemReviewed(item)"
                    :to="getItemReviewUrl(order, item, true)"
                    class="btn btn-xs btn-item-review"
                    title="Beri penilaian untuk produk ini"
                  >
                    <Icon name="lucide:star" class="w-3 h-3 mr-1 inline text-amber-500" />
                    <span>Nilai</span>
                  </NuxtLink>
                  <NuxtLink
                    v-else
                    :to="getItemReviewUrl(order, item, false)"
                    class="btn btn-xs btn-item-view"
                    title="Lihat ulasan dan penilaian produk ini"
                  >
                    <Icon name="lucide:check-circle-2" class="w-3 h-3 mr-1 inline text-emerald-500" />
                    <span>Lihat Penilaian</span>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Courier & Tracking Snapshot -->
          <div class="shipping-tracking-bar">
            <div class="courier-badge-box">
              <Icon name="lucide:truck" class="w-4 h-4 text-emerald" />
              <span class="courier-text">
                <strong>{{ order.expedition?.name || 'Kurir Ekspedisi' }}</strong>
                <span class="courier-svc">({{ order.expedition?.service || 'REG' }})</span>
              </span>
            </div>

            <div v-if="order.resi_number" class="resi-snapshot">
              <span class="resi-label">No. Resi:</span>
              <span class="resi-value font-mono">{{ order.resi_number }}</span>
              <button type="button" class="btn-copy-resi" @click="copyText(order.resi_number)" title="Salin No Resi">
                <Icon name="lucide:copy" class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Latest Tracking Event Pill -->
            <div v-if="order.trackings && order.trackings.length > 0" class="latest-tracking-pill">
              <span class="tracking-dot"></span>
              <span class="tracking-text">
                {{ order.trackings[0].description }}
                <strong v-if="order.trackings[0].location">({{ order.trackings[0].location }})</strong>
              </span>
            </div>
          </div>

          <!-- 4. Card Footer with Total & Actions -->
          <div class="order-card-footer">
            <div class="order-total-group">
              <span class="total-label">Total Belanja:</span>
              <strong class="total-amount font-display">{{ formatRupiah(order.grand_total || order.subtotal) }}</strong>
            </div>

            <div class="order-action-buttons">
              <!-- Detail / Track Button: Disembunyikan (hilang) jika pesanan sudah dinilai oleh user -->
              <button v-if="!isOrderReviewed(order)" type="button" class="btn btn-secondary btn-sm" @click="openTrackingModal(order)">
                <Icon name="lucide:map-pin" class="w-4 h-4 mr-1 inline-block text-bsi" />
                <span>Lacak & Rincian</span>
              </button>

              <!-- Tombol Nilai / Lihat Penilaian: Muncul ketika produk tiba/selesai -->
              <template v-if="isOrderArrivedOrCompleted(order)">
                <!-- Belum dinilai: Muncul button Nilai -->
                <NuxtLink
                  v-if="!isOrderReviewed(order)"
                  :to="getOrderReviewUrl(order, true)"
                  class="btn btn-primary btn-sm btn-order-review-action"
                  title="Beri penilaian produk"
                >
                  <Icon name="lucide:star" class="w-3.5 h-3.5 mr-1 inline-block text-amber-300" />
                  <span>Nilai</span>
                </NuxtLink>

                <!-- Sudah dinilai: Berubah menjadi Lihat Penilaian -->
                <NuxtLink
                  v-else
                  :to="getOrderReviewUrl(order, false)"
                  class="btn btn-secondary btn-sm btn-view-review-action"
                  title="Lihat ulasan dan penilaian yang telah dibuat"
                >
                  <Icon name="lucide:message-square" class="w-3.5 h-3.5 mr-1 inline-block text-bsi" />
                  <span>Lihat Penilaian</span>
                </NuxtLink>
              </template>

              <!-- Check Payment Status Button if Waiting Payment -->
              <button v-if="order.status === 'pending_payment'" type="button"
                class="btn btn-secondary btn-sm btn-sync-status" :disabled="syncingOrderId === order.id || isRefreshing"
                @click="handleCheckPaymentStatus(order)" title="Periksa status pembayaran">
                <Icon name="lucide:refresh-cw"
                  :class="['w-3.5 h-3.5 mr-1 inline-block', { 'animate-spin': syncingOrderId === order.id }]" />
                <span>{{ syncingOrderId === order.id ? 'Mengecek...' : 'Cek Status' }}</span>
              </button>

              <!-- Pay with Midtrans Button if Waiting Payment -->
              <button v-if="order.status === 'pending_payment'" type="button"
                class="btn btn-primary btn-sm btn-pay-action" :disabled="openingPayment" @click="handlePayWithMidtrans(order)">
                <Icon name="lucide:lock" class="w-4 h-4 mr-1 inline-block" />
                <span>Bayar Sekarang</span>
              </button>

              <!-- Confirm Arrival if Arrived -->
              <button v-if="order.status === 'arrived'" type="button" class="btn btn-emerald btn-sm"
                :disabled="completingOrderId === order.id" @click="openCompleteModal(order)">
                <Icon :name="completingOrderId === order.id ? 'lucide:loader-2' : 'lucide:check'"
                  :class="['w-4 h-4 mr-1 inline-block', { 'animate-spin': completingOrderId === order.id }]" />
                <span>{{ completingOrderId === order.id ? 'Memproses...' : 'Selesaikan Pesanan' }}</span>
              </button>

              <!-- Status Pengajuan Pembatalan (Jika sedang diproses Admin) -->
              <p v-if="order.cancel_request_status === 'refund_processing'" role="status">Pembatalan sedang dikonfirmasi ke Midtrans. Pengembalian dana mengikuti proses penyedia pembayaran.</p>
              <p v-if="order.cancel_request_status === 'approved'" role="status">Pembatalan disetujui. Lihat riwayat pesanan untuk proses pengembalian dana ke metode pembayaran asal.</p>
              <p v-if="order.cancel_request_status === 'rejected'" role="status">Pengajuan pembatalan ditolak admin. Pesanan dilanjutkan.</p>
              <div v-if="order.cancel_request_status === 'pending'" class="cancel-pending-tag">
                <span class="pulse-amber-dot"></span>
                <span>Pembatalan Diajukan</span>
              </div>

              <!-- Button Batalkan Pesanan (Berlaku hanya 1 hari & sebelum toko memperbarui status menjadi diproses) -->
              <button v-else-if="isOrderCancellable(order)" type="button"
                class="btn btn-outline-danger btn-sm btn-cancel-order" @click="openCancelModal(order)"
                :title="`Dapat dibatalkan dalam 1 hari sejak pemesanan (Sisa waktu: ${getCancelTimeRemaining(order.created_at)})`">
                <Icon name="lucide:x-circle" class="w-3.5 h-3.5 mr-1 inline-block" />
                <span>Batalkan Pesanan</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tracking Modal Component -->
    <OrderTrackingModal :is-open="isTrackingModalOpen" :order="selectedOrder" @close="isTrackingModalOpen = false"
      @refresh="refreshOrders" @pay="handlePayWithMidtrans" @cancel="openCancelModal" @complete="openCompleteModal"
      @print-invoice="openInvoiceModal" />

    <!-- Order Cancellation Confirmation Modal -->
    <OrderCancelModal :is-open="isCancelModalOpen" :order="orderToCancel" @close="isCancelModalOpen = false"
      @confirm="handleConfirmCancel" />

    <!-- Order Completion Confirmation Modal -->
    <OrderCompleteModal :is-open="isCompleteModalOpen" :order="orderToComplete"
      :is-submitting="completingOrderId === orderToComplete?.id" @close="isCompleteModalOpen = false"
      @confirm="handleConfirmComplete" />

    <!-- Official Order Invoice Printable Modal -->
    <OrderInvoiceModal :is-open="isInvoiceModalOpen" :order="orderForInvoice" @close="isInvoiceModalOpen = false" />

    <!-- Payment Success Modal with Checklist Icon -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isPaymentSuccessModalOpen && paidSuccessOrder" class="checkout-success-backdrop" @click.self="handlePaymentSuccessOk">
          <div class="checkout-success-card cyber-card" role="dialog" aria-modal="true">
            <!-- Animated Checklist Icon Badge -->
            <div class="success-icon-badge">
              <Icon name="lucide:check-circle-2" class="w-12 h-12 text-emerald-500 checkmark-pulse-icon" />
            </div>
            <h2 class="success-title">Pembayaran Berhasil!</h2>
            <p class="success-desc">
              Terima kasih! Pembayaran Anda telah terverifikasi secara resmi. Toko akan segera mengemas dan mengirimkan pesanan Anda.
            </p>

            <!-- Product Purchased Preview Box -->
            <div v-if="primaryPurchasedProduct" class="success-product-preview">
              <span class="preview-tag-label">
                <Icon name="lucide:package-check" class="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                Produk Berhasil Dibayar:
              </span>
              <div class="preview-product-card">
                <img :src="getImageUrl(primaryPurchasedProduct.photo)" :alt="primaryPurchasedProduct.name"
                  class="preview-product-thumb"
                  @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }" />
                <div class="preview-product-info">
                  <h4 class="preview-product-name">{{ primaryPurchasedProduct.name }}</h4>
                  <div class="preview-product-meta">
                    <span v-if="primaryPurchasedProduct.size" class="meta-pill">Ukuran: {{ primaryPurchasedProduct.size }}</span>
                    <span v-if="primaryPurchasedProduct.color" class="meta-pill">Warna: {{ primaryPurchasedProduct.color }}</span>
                    <span class="meta-qty">{{ primaryPurchasedProduct.quantity }}x</span>
                  </div>
                  <span class="preview-product-price font-mono">{{ formatRupiah(primaryPurchasedProduct.price) }}</span>
                </div>
              </div>
            </div>

            <!-- Order Summary Details -->
            <div class="success-order-box">
              <div class="success-box-row">
                <span class="box-label">Nomor Invoice:</span>
                <strong class="box-val font-mono text-bsi">{{ paidSuccessOrder.invoice_number || `ORD-#${paidSuccessOrder.id}` }}</strong>
              </div>
              <div class="success-box-row">
                <span class="box-label">Total Pembayaran:</span>
                <strong class="box-val font-mono text-emerald-600 font-bold">{{ formatRupiah(paidSuccessOrder.grand_total || paidSuccessOrder.subtotal) }}</strong>
              </div>
              <div class="success-box-row">
                <span class="box-label">Status:</span>
                <span class="badge badge-emerald inline-flex items-center gap-1">
                  <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5 text-white" />
                  LUNAS (PAID)
                </span>
              </div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="success-actions">
              <button type="button" class="btn btn-primary btn-success-ok" @click="handlePaymentSuccessOk">
                <Icon name="lucide:check" class="w-5 h-5 mr-1" />
                <span>Oke</span>
              </button>

              <div class="success-secondary-row">
                <button type="button" class="btn btn-secondary btn-sm" @click="openInvoiceModal(paidSuccessOrder); isPaymentSuccessModalOpen = false;">
                  <Icon name="lucide:printer" class="w-4 h-4 mr-1" />
                  <span>Cetak Invoice</span>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" @click="isPaymentSuccessModalOpen = false">
                  <Icon name="lucide:x" class="w-4 h-4 mr-1" />
                  <span>Tutup</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Floating Toast Notification -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="toast.show" :class="['orders-floating-toast', `toast-${toast.type}`]">
          <div class="toast-indicator-icon">
            <Icon v-if="toast.type === 'success'" name="lucide:check-circle-2" class="w-5 h-5 text-emerald-600" />
            <Icon v-else-if="toast.type === 'info'" name="lucide:info" class="w-5 h-5 text-bsi" />
            <Icon v-else name="lucide:alert-circle" class="w-5 h-5 text-rose-600" />
          </div>
          <div class="toast-body">
            <span class="toast-title">{{ toast.title }}</span>
            <p class="toast-text">{{ toast.message }}</p>
          </div>
          <button type="button" class="toast-close-btn" @click="toast.show = false" aria-label="Tutup notifikasi">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
definePageMeta({
  middleware: 'auth',
})

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { useMidtrans } from '~/composables/useMidtrans'
import OrderTrackingModal from '~/components/OrderTrackingModal.vue'
import OrderCancelModal from '~/components/OrderCancelModal.vue'
import OrderCompleteModal from '~/components/OrderCompleteModal.vue'
import OrderInvoiceModal from '~/components/OrderInvoiceModal.vue'

const router = useRouter()
const authStore = useAuthStore()
authStore.initAuth()

const { fetchOrders, fetchOrderDetail, checkPaymentStatus, completeOrder, cancelOrder, getImageUrl } = useApi()
const { formatRupiah } = useFormat()
const { pay: payWithMidtrans, loadSnap: loadMidtransScript } = useMidtrans()

// Payment Success Modal State
const isPaymentSuccessModalOpen = ref(false)
const paidSuccessOrder = ref<any>(null)

const primaryPurchasedProduct = computed(() => {
  const orderItems = paidSuccessOrder.value?.items
  if (Array.isArray(orderItems) && orderItems.length > 0) {
    const firstItem = orderItems[0]
    const prod = firstItem.product || firstItem
    return {
      id: prod.slug || prod.encrypted_id || prod.id || firstItem.product_id,
      name: prod.name || firstItem.product_name,
      photo: prod.main_photo || firstItem.product_photo || firstItem.photo,
      price: firstItem.price || prod.price,
      quantity: firstItem.quantity,
      size: firstItem.size,
      color: firstItem.color,
    }
  }
  return null
})

const handlePaymentSuccessOk = () => {
  isPaymentSuccessModalOpen.value = false
  const targetId = primaryPurchasedProduct.value?.id
  if (targetId) {
    router.push(`/products/${targetId}`)
  } else {
    router.push('/products')
  }
}

const isRefreshing = ref(false)
const syncingOrderId = ref<number | string | null>(null)
const completingOrderId = ref<number | string | null>(null)
const activeStatus = ref('all')
const searchQuery = ref('')

// Tracking Modal State
const isTrackingModalOpen = ref(false)
const selectedOrder = ref<any>(null)

// Cancel Modal State
const isCancelModalOpen = ref(false)
const orderToCancel = ref<any>(null)

// Complete Modal State
const isCompleteModalOpen = ref(false)
const orderToComplete = ref<any>(null)

const openCompleteModal = (order: any) => {
  orderToComplete.value = order
  isCompleteModalOpen.value = true
}

// Invoice Modal State
const isInvoiceModalOpen = ref(false)
const orderForInvoice = ref<any>(null)

const openInvoiceModal = (order: any) => {
  orderForInvoice.value = order
  isInvoiceModalOpen.value = true
}

// Floating Toast State
const toast = ref<{
  show: boolean
  message: string
  title: string
  type: 'success' | 'error' | 'info'
}>({
  show: false,
  message: '',
  title: '',
  type: 'info',
})

let toastTimer: any = null
const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', title?: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = {
    show: true,
    message,
    type,
    title: title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Peringatan' : 'Informasi'),
  }
  toastTimer = setTimeout(() => {
    toast.value.show = false
  }, 4000)
}

const isOrderPaid = (order: any) => {
  if (!order || !order.status) return false
  return ['paid', 'packed', 'shipped', 'arrived', 'completed'].includes(order.status)
}

// Fetch orders with useAsyncData and reactive watcher
const { data: ordersResponse, pending, refresh } = await useAsyncData(
  'my-orders-list',
  async () => {
    if (authStore.isAuthenticated) {
      return await fetchOrders()
    }
    return { data: [] }
  },
  {
    watch: [() => authStore.token],
  }
)

// Normalize orders array from paginator response
const orders = computed<any[]>(() => {
  const res = ordersResponse.value
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data?.data)) return res.data.data
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.orders?.data)) return res.orders.data
  if (Array.isArray(res.orders)) return res.orders
  return []
})


// Status Tabs with Live Count
const statusTabs = computed(() => {
  const allCount = orders.value.length
  const pendingCount = orders.value.filter(o => o.status === 'pending_payment').length
  const processingCount = orders.value.filter(o => ['paid', 'packed'].includes(o.status)).length
  const shippedCount = orders.value.filter(o => ['shipped', 'arrived'].includes(o.status)).length
  const completedCount = orders.value.filter(o => o.status === 'completed').length
  const cancelledCount = orders.value.filter(o => o.status === 'cancelled').length

  return [
    { key: 'all', label: 'Semua Pesanan', count: allCount },
    { key: 'pending_payment', label: 'Menunggu Bayar', count: pendingCount },
    { key: 'processing', label: 'Diproses / Dikemas', count: processingCount },
    { key: 'shipped', label: 'Dikirim', count: shippedCount },
    { key: 'completed', label: 'Selesai', count: completedCount },
    { key: 'cancelled', label: 'Dibatalkan', count: cancelledCount },
  ]
})

// Filtered and Searched Orders
const filteredOrders = computed(() => {
  let list = orders.value

  // Status filtering
  if (activeStatus.value !== 'all') {
    if (activeStatus.value === 'processing') {
      list = list.filter(o => ['paid', 'packed'].includes(o.status))
    } else if (activeStatus.value === 'shipped') {
      list = list.filter(o => ['shipped', 'arrived'].includes(o.status))
    } else {
      list = list.filter(o => o.status === activeStatus.value)
    }
  }

  // Search filtering
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(o => {
      const invMatch = (o.invoice_number || '').toLowerCase().includes(q)
      const receiverMatch = (o.address?.receiver_name || '').toLowerCase().includes(q)
      const cityMatch = (o.address?.city || '').toLowerCase().includes(q)
      const resiMatch = (o.resi_number || '').toLowerCase().includes(q)
      const itemsMatch = (o.items || []).some((it: any) =>
        (it.product_name || it.product?.name || '').toLowerCase().includes(q)
      )
      return invMatch || receiverMatch || cityMatch || resiMatch || itemsMatch
    })
  }

  return list
})

// Refresh order list with automatic payment status sync for pending orders
const refreshOrders = async (silent: boolean | unknown = false) => {
  const isSilent = silent === true
  if (!isSilent) isRefreshing.value = true
  try {
    const prevStatuses = new Map<any, string>()
    orders.value.forEach(o => {
      if (o?.id) prevStatuses.set(o.id, o.status)
    })

    // If there are pending orders, sync their payment status with Midtrans first
    const pendingOrders = orders.value.filter(o => o.status === 'pending_payment')
    if (pendingOrders.length > 0) {
      await Promise.allSettled(
        pendingOrders.map(async o => {
          if (o.payment?.id) {
            return checkPaymentStatus(o.payment.id)
          } else {
            return fetchOrderDetail(o.id)
          }
        })
      )
    }
    await refresh()

    // Detect if any order was successfully paid during polling
    for (const o of orders.value) {
      const oldStatus = prevStatuses.get(o.id)
      if (oldStatus === 'pending_payment' && o.status === 'paid') {
        showToast(
          `Pembayaran pesanan ${o.invoice_number || `ORD-#${o.id}`} berhasil diverifikasi! Pesanan Anda telah lunas.`,
          'success',
          'Pembayaran Berhasil'
        )
      }
    }

    // Keep selectedOrder for tracking modal updated if modal is currently open
    if (isTrackingModalOpen.value && selectedOrder.value?.id) {
      const freshSelected = orders.value.find(o => o.id === selectedOrder.value.id)
      if (freshSelected) {
        selectedOrder.value = { ...freshSelected }
      }
    }
  } finally {
    if (!isSilent) isRefreshing.value = false
  }
}

// Check and sync single order payment status directly with Midtrans
const handleCheckPaymentStatus = async (order: any, silent = false) => {
  syncingOrderId.value = order.id
  try {
    let res: any = null
    if (order.payment?.id) {
      res = await checkPaymentStatus(order.payment.id)
    } else {
      res = await fetchOrderDetail(order.id)
    }

    await refresh()

    const currentStatus = res?.order?.status || res?.payment?.status
    if (currentStatus === 'paid') {
      if (isTrackingModalOpen.value && selectedOrder.value?.id === order.id) {
        selectedOrder.value.status = 'paid'
      }
      if (!silent) {
        showToast('Pembayaran berhasil diverifikasi! Pesanan Anda telah lunas.', 'success', 'Pembayaran Berhasil')
      }
    } else if (currentStatus === 'cancelled') {
      if (!silent) {
        showToast('Pesanan dibatalkan (Waktu pembayaran habis atau transaksi dibatalkan).', 'error', 'Pesanan Dibatalkan')
      }
    } else {
      if (!silent) {
        showToast(res?.message || 'Status pembayaran berhasil dicek. Masih menunggu pembayaran.', 'info', 'Status Pembayaran')
      }
    }
  } catch (err: any) {
    if (!silent) {
      showToast(err.data?.message || err.message || 'Gagal mengecek status pembayaran.', 'error', 'Cek Status Gagal')
    }
  } finally {
    syncingOrderId.value = null
  }
}

// Open Tracking Modal and sync detail in background
const openTrackingModal = async (order: any) => {
  selectedOrder.value = { ...order }
  isTrackingModalOpen.value = true

  // Background fetch to ensure fresh trackings & sync status if pending
  try {
    const res = await fetchOrderDetail(order.id)
    if (res?.order) {
      selectedOrder.value = res.order
      if (res.order.status !== order.status) {
        await refresh()
      }
    }
  } catch (e) {
    console.warn('Failed background sync of order detail:', e)
  }
}

// Open Cancellation Modal
const openCancelModal = (order: any) => {
  orderToCancel.value = order
  isCancelModalOpen.value = true
}

// Validasi apakah pesanan dapat dibatalkan oleh pengguna:
// 1. Toko BELUM memperbarui status menjadi diproses (status: packed, shipped, arrived, completed, cancelled)
// 2. Berlaku hanya 1 hari (24 jam = 86.400.000 ms) sejak pesanan dibuat
const currentTime = ref(Date.now())
let clockTimer: any = null

const isOrderCancellable = (order: any): boolean => {
  if (!order) return false

  // Jika toko sudah mengubah status menjadi diproses (packed) atau lebih lanjut, tombol otomatis hilang
  const nonCancellableStatuses = ['packed', 'shipped', 'arrived', 'completed', 'cancelled']
  if (nonCancellableStatuses.includes(order.status)) {
    return false
  }

  // Jika sudah mengajukan pembatalan dan sedang menunggu persetujuan toko/admin
  if (['pending', 'approved', 'refund_processing'].includes(order.cancel_request_status)) {
    return false
  }

  // Cek batas waktu 1 hari (24 jam) sejak pesanan dibuat
  if (!order.created_at) return false
  const orderTime = new Date(order.created_at).getTime()
  if (isNaN(orderTime)) return false

  const oneDayInMs = 24 * 60 * 60 * 1000 // 24 jam = 1 hari
  const elapsed = currentTime.value - orderTime

  // Jika sudah lebih dari 24 jam, tombol otomatis hilang
  if (elapsed > oneDayInMs || elapsed < 0) {
    return false
  }

  return true
}

// Menghitung sisa waktu pembatalan yang tersisa
const getCancelTimeRemaining = (createdAt: string): string => {
  if (!createdAt) return ''
  const orderTime = new Date(createdAt).getTime()
  if (isNaN(orderTime)) return ''

  const oneDayInMs = 24 * 60 * 60 * 1000
  const remaining = (orderTime + oneDayInMs) - currentTime.value

  if (remaining <= 0) return ''

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}j ${minutes}m`
  }
  return `${minutes}m`
}

// Confirm Cancel
const handleConfirmCancel = async ({ orderId, reason }: { orderId: number | string; reason: string }) => {
  try {
    await cancelOrder(orderId, reason)
    isCancelModalOpen.value = false
    if (isTrackingModalOpen.value) {
      isTrackingModalOpen.value = false
    }
    await refreshOrders()
    showToast('Pengajuan dikirim. Menunggu keputusan admin.', 'success', 'Pengajuan Pembatalan')
  } catch (err: any) {
    showToast(err.data?.message || err.message || 'Gagal membatalkan pesanan.', 'error', 'Gagal Membatalkan')
  }
}

// Open Complete Order Confirmation Modal
const handleCompleteOrder = (order: any) => {
  openCompleteModal(order)
}

// Confirm Complete Order via Modal
const handleConfirmComplete = async (order: any) => {
  const target = order || orderToComplete.value
  if (!target || !target.id) {
    console.error('[CompleteOrder] Order data invalid:', target)
    showToast('Data pesanan tidak valid.', 'error', 'Peringatan')
    return
  }
  completingOrderId.value = target.id
  try {
    console.log('[CompleteOrder] Completing order:', target.id, 'Status:', target.status)
    await completeOrder(target.id)
    console.log('[CompleteOrder] Success for order:', target.id)
    if (isTrackingModalOpen.value && selectedOrder.value?.id === target.id) {
      selectedOrder.value.status = 'completed'
    }
    isCompleteModalOpen.value = false
    await refreshOrders()
    showToast('Terima kasih! Pesanan Anda telah selesai dan siap dinilai.', 'success', 'Pesanan Selesai')
  } catch (err: any) {
    console.error('[CompleteOrder] Error:', err)
    const message = err?.data?.message || err?.statusMessage || err?.message || 'Gagal menyelesaikan pesanan.'
    showToast(message, 'error', 'Gagal Selesaikan Pesanan')
  } finally {
    completingOrderId.value = null
  }
}

// Helper untuk mengecek apakah status pesanan sudah tiba / selesai (layak dinilai)
const isOrderArrivedOrCompleted = (order: any): boolean => {
  if (!order || !order.status) return false
  return ['arrived', 'completed'].includes(order.status)
}

// Helper untuk mengecek apakah item produk tertentu sudah dinilai oleh user
const isItemReviewed = (item: any): boolean => {
  if (!item) return false
  return Boolean(item.is_reviewed || item.review || item.has_reviewed)
}

// Helper untuk mengecek apakah pesanan sudah dinilai oleh user (semua item sudah dinilai atau order ditandai telah dinilai)
const isOrderReviewed = (order: any): boolean => {
  if (!order) return false
  if (order.is_reviewed || order.has_reviewed) return true
  const items = order.items || []
  if (items.length > 0) {
    return items.every((it: any) => isItemReviewed(it))
  }
  return false
}

// URL menuju halaman penilaian produk (dengan openModal jika belum dinilai)
const getItemReviewUrl = (order: any, item: any, openModal = false): string => {
  const prodKey = item?.product?.slug || item?.product?.encrypted_id || item?.product_id || ''
  const base = `/products/${prodKey}/reviews?order_id=${order?.id}`
  return openModal ? `${base}&openModal=true` : base
}

const getOrderReviewUrl = (order: any, openModal = false): string => {
  const items = order?.items || []
  const targetItem = items.find((it: any) => !isItemReviewed(it)) || items[0]
  if (!targetItem) return '/account/orders'
  return getItemReviewUrl(order, targetItem, openModal)
}

// Pay with Midtrans Snap
const openingPayment = ref(false)
const handlePayWithMidtrans = async (order: any) => {
  const snapToken = order.payment?.snap_token || order.snap_token
  const snapUrl = order.payment?.snap_url || order.snap_url

  if (openingPayment.value) return
  openingPayment.value = true
  try {
    if (snapToken) {
      await payWithMidtrans(snapToken, {
        onSuccess: async (result: any) => {
          console.log('Pembayaran Berhasil:', result)
          await handleCheckPaymentStatus(order, true)
          await refreshOrders()
          if (isTrackingModalOpen.value) {
            isTrackingModalOpen.value = false
          }
          const updated = orders.value.find((o: any) => o.id === order.id) || order
          paidSuccessOrder.value = updated
          isPaymentSuccessModalOpen.value = true
        },
        onPending: async (result: any) => {
          console.log('Pembayaran Pending:', result)
          await handleCheckPaymentStatus(order, true)
          await refreshOrders()
        },
        onError: (result: any) => {
          console.error('Pembayaran Error:', result)
          showToast('Pembayaran gagal atau dibatalkan.', 'error', 'Pembayaran Gagal')
        },
        onClose: async () => {
          await handleCheckPaymentStatus(order, true)
          await refreshOrders()
        },
      })
    } else if (snapUrl) {
      window.location.href = snapUrl
    } else {
      showToast('Token transaksi tidak ditemukan untuk pesanan ini.', 'error', 'Token Pembayaran')
    }
  } catch (err: any) {
    showToast(err?.message || 'Gagal membuka pembayaran. Silakan coba lagi.', 'error', 'Pembayaran')
  } finally {
    openingPayment.value = false
  }
}

// Helper formats
const copyText = (text: string) => {
  if (!text) return
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text)
    showToast(`"${text}" berhasil disalin ke clipboard!`, 'success', 'Tersalin')
  }
}

const formatDateTime = (iso: string) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  } catch {
    return iso
  }
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending_payment: 'Menunggu Pembayaran',
    paid: 'Pembayaran Berhasil',
    packed: 'Sedang Dikemas',
    shipped: 'Dalam Pengiriman',
    arrived: 'Pesanan Tiba',
    completed: 'Pesanan Selesai',
    cancelled: 'Dibatalkan',
  }
  return map[status] || status || 'Diproses'
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'completed':
      return 'badge-emerald'
    case 'shipped':
    case 'arrived':
      return 'badge-cyan'
    case 'paid':
    case 'packed':
      return 'badge-purple'
    case 'pending_payment':
      return 'badge-amber'
    case 'cancelled':
      return 'badge-coral'
    default:
      return 'badge-cyan'
  }
}

// Auto polling timer in background
let autoPollTimer: any = null

const startOrdersAutoPoll = () => {
  stopOrdersAutoPoll()
  autoPollTimer = setInterval(async () => {
    if (!authStore.isAuthenticated || typeof document === 'undefined') return
    if (document.hidden) return

    // Auto poll if there are active orders
    const hasActiveOrders = orders.value.some(o =>
      ['pending_payment', 'paid', 'packed', 'shipped', 'arrived'].includes(o.status)
    )

    if (hasActiveOrders) {
      await refreshOrders(true)
    }
  }, 5000)
}

const stopOrdersAutoPoll = () => {
  if (autoPollTimer) {
    clearInterval(autoPollTimer)
    autoPollTimer = null
  }
}

// Auto refresh on window focus / tab visibility change (e.g. user returns after paying on simulator / other tab)
const handleVisibilityOrFocus = async () => {
  if (authStore.isAuthenticated && typeof document !== 'undefined' && !document.hidden && !isRefreshing.value) {
    await refreshOrders(true)
  }
}

onMounted(() => {
  // Snap manages its own overlay visibility when pay() is called.
  loadMidtransScript().catch(() => {
    console.warn('Midtrans Snap script failed to load.')
  })
  clockTimer = setInterval(() => {
    currentTime.value = Date.now()
  }, 60000)

  startOrdersAutoPoll()

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
  }

  // Ensure fresh orders are fetched immediately on client mount
  if (authStore.isAuthenticated) {
    refreshOrders(true)
  }
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth) {
      refreshOrders(true)
    }
  })

  // Check if directed with print_invoice or invoice query parameter
  const route = useRoute()
  const checkInvoiceFromQuery = () => {
    if (!orders.value || orders.value.length === 0) return
    const queryVal = route.query.print_invoice || route.query.invoice
    if (queryVal) {
      const invTarget = String(queryVal).trim().toLowerCase()
      const target = invTarget === 'latest'
        ? orders.value.find((o: any) => isOrderPaid(o))
        : orders.value.find((o: any) =>
          String(o.id).toLowerCase() === invTarget ||
          String(o.invoice_number || '').toLowerCase() === invTarget
        )
      if (target && isOrderPaid(target)) {
        openInvoiceModal(target)
      }
    }
  }

  watch(() => [orders.value, route.query.print_invoice, route.query.invoice], () => {
    checkInvoiceFromQuery()
  }, { immediate: true })
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
  stopOrdersAutoPoll()
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', handleVisibilityOrFocus)
    document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
  }
})

useHead({
  title: 'Pesanan Saya & Lacak Pengiriman | Cyber Store',
})
</script>

<style scoped>
/* Page Layout */
.orders-page {
  padding-top: 1.5rem;
  padding-bottom: 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.orders-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.825rem;
  color: #64748b;
}

.breadcrumb a {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.breadcrumb a:hover {
  color: #003399;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb .current {
  color: #0f172a;
  font-weight: 700;
}

.header-content-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.88rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.btn-refresh-orders {
  font-size: 0.825rem;
  font-weight: 600;
}

/* Auth Required & Empty Box */
.auth-required-box,
.empty-orders-box {
  padding: 4rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 4px 20px rgba(0, 51, 153, 0.05);
}

.lock-icon-circle,
.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-bsi {
  color: #003399;
}

.auth-required-box h2,
.empty-orders-box h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.auth-required-box p,
.empty-orders-box p {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 480px;
  line-height: 1.5;
}

/* Filter & Search Bar */
.filter-search-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #ffffff;
  padding: 1rem;
  border-radius: var(--radius-md, 12px);
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(0, 51, 153, 0.03);
}

.status-tabs-scroll {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}

.status-tab-btn {
  padding: 0.55rem 1rem;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transition: all 0.2s ease;
}

.status-tab-btn:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #003399;
}

.status-tab-btn.active {
  background: #003399;
  border-color: #003399;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.2);
}

.tab-badge {
  font-size: 0.725rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;
}

.status-tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.orders-search-wrapper {
  position: relative;
  width: 100%;
  gap: 1.25rem;

}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.orders-search-input {
  width: 100%;
  padding: 0.65rem 2.25rem 0.65rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #0f172a;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
}

.orders-search-input:focus {
  background: #ffffff;
  border-color: #003399;
  box-shadow: 0 0 0 3px rgba(0, 51, 153, 0.1);
}

.btn-clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.85rem;
}

/* Orders List */
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}


/* Order Card */
.order-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 2px 12px rgba(0, 51, 153, 0.04);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.order-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 6px 20px rgba(0, 51, 153, 0.07);
}

/* Order Card Header */
.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.order-meta-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.order-invoice-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.invoice-label {
  font-size: 0.775rem;
  color: #64748b;
}

.order-invoice {
  font-size: 0.95rem;
  color: #003399;
}

.btn-copy-invoice {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
}

.btn-copy-invoice:hover {
  color: #003399;
  background: #eff6ff;
}

.btn-print-icon {
  background: transparent;
  border: none;
  color: #004aad;
  cursor: pointer;
  padding: 2px;
  display: inline-flex;
  align-items: center;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.btn-print-icon:hover {
  color: #002266;
  background: #eff6ff;
}

.btn-print-order {
  background: #f8fafc;
  color: #003399;
  border: 1px solid #cbd5e1;
  font-weight: 600;
}

.btn-print-order:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #002266;
}

.order-date {
  font-size: 0.775rem;
  color: #94a3b8;
}

/* Order Items */
.order-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.order-item-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.order-item-img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.order-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.order-item-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  transition: color 0.2s ease;
}

.order-item-title:hover {
  color: #003399;
}

.order-item-sub {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.variant-tag {
  font-size: 0.725rem;
  background: #f1f5f9;
  color: #475569;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.nim-tag {
  background: #eff6ff;
  color: #003399;
  font-weight: 600;
}

.item-qty-price {
  font-size: 0.775rem;
  color: #64748b;
}

.order-item-total {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.order-item-right-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.45rem;
}

.order-item-action-btns {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-xs {
  padding: 0.28rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 6px;
  line-height: 1.3;
}

.btn-item-review {
  background: #eff6ff;
  border: 1px solid #003399;
  color: #003399;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-item-review:hover {
  background: #003399;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 51, 153, 0.2);
}

.btn-item-view {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #334155;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-item-view:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-order-review-action {
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.2);
  transition: all 0.2s ease;
}

.btn-order-review-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.3);
}

.btn-view-review-action {
  background: #f8fafc;
  color: #003399;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-view-review-action:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #002266;
}

/* Shipping & Tracking Snapshot Bar */
.shipping-tracking-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  font-size: 0.825rem;
  flex-wrap: wrap;
}

.courier-badge-box {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #0f172a;
}

.courier-icon {
  font-size: 1rem;
}

.courier-svc {
  color: #64748b;
  font-size: 0.775rem;
}

.resi-snapshot {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

.resi-label {
  font-size: 0.725rem;
  color: #003399;
}

.resi-value {
  font-size: 0.8rem;
  font-weight: 800;
  color: #003399;
}

.btn-copy-resi {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #003399;
  padding: 1px;
}

.latest-tracking-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  color: #475569;
  font-size: 0.775rem;
}

.tracking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

/* Card Footer */
.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f1f5f9;
  padding-top: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.order-total-group {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.total-label {
  font-size: 0.825rem;
  color: #64748b;
}

.total-amount {
  font-size: 1.25rem;
  font-weight: 800;
  color: #003399;
}

.order-action-buttons {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.btn-sync-status {
  background: #f8fafc;
  color: #003399;
  border: 1px solid #cbd5e1;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.btn-sync-status:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #002266;
}

.btn-pay-action {
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.2);
}

.btn-pay-action:hover {
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.3);
}

.btn-emerald {
  background: #10b981;
  color: #ffffff;
  border: none;
  font-weight: 700;
}

.btn-emerald:hover {
  background: #059669;
}

.btn-outline-danger {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fca5a5;
}

.btn-outline-danger:hover {
  background: #fef2f2;
}

.cancel-action-wrap {
  display: inline-flex;
  align-items: center;
}

.cancel-timer-badge {
  font-size: 0.725rem;
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 0.35rem;
  font-family: monospace;
}

.cancel-pending-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  color: #b45309;
  font-size: 0.775rem;
  font-weight: 700;
}

.pulse-amber-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

/* Skeleton Loaders */
.skeleton-card {
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
}

.skeleton-header {
  height: 24px;
  width: 40%;
  border-radius: 6px;
}

.skeleton-item-row {
  height: 80px;
  width: 100%;
  border-radius: 8px;
}

.skeleton-footer {
  height: 36px;
  width: 100%;
  border-radius: 6px;
}

/* Responsive */
@media (max-width: 768px) {
  .orders-page {
    padding-top: 1rem;
    padding-bottom: 5rem;
    gap: 1.25rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .page-subtitle {
    font-size: 0.82rem;
  }

  .header-content-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-refresh-orders {
    width: 100%;
    justify-content: center;
  }

  .order-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .order-meta-right {
    align-self: flex-start;
  }
}

@media (max-width: 640px) {
  .order-card {
    padding: 1rem;
  }

  .latest-tracking-pill {
    margin-left: 0;
    width: 100%;
  }

  .order-card-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .order-total-group {
    justify-content: space-between;
  }

  .order-action-buttons {
    width: 100%;
    flex-wrap: wrap;
  }

  .order-action-buttons button {
    flex: 1;
    text-align: center;
    justify-content: center;
    min-width: 100px;
  }

  .shipping-tracking-bar {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .order-items-list {
    gap: 0.75rem;
  }

  .order-item-row {
    gap: 0.65rem;
  }

  .order-item-img {
    width: 50px !important;
    height: 50px !important;
    min-width: 50px !important;
  }

  .order-item-title {
    font-size: 0.825rem;
  }

  .order-item-total {
    font-size: 0.825rem;
    white-space: nowrap;
  }
}

@media (max-width: 480px) {
  .orders-page {
    gap: 1rem;
  }

  .filter-search-container {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .status-tabs-scroll {
    gap: 0.35rem;
  }

  .status-tab-btn {
    padding: 0.45rem 0.75rem;
    font-size: 0.775rem;
  }

  .order-card {
    padding: 0.85rem;
    gap: 0.85rem;
  }

  .order-invoice {
    font-size: 0.8rem;
  }

  .order-date {
    font-size: 0.75rem;
  }

  .total-amount {
    font-size: 1.1rem;
  }

  .order-action-buttons {
    gap: 0.5rem;
  }

  .order-action-buttons button {
    font-size: 0.775rem;
    padding: 0.45rem 0.65rem;
  }

  .resi-snapshot {
    flex-wrap: wrap;
    gap: 0.25rem;
  }
}

@media (max-width: 375px) {
  .page-title {
    font-size: 1.25rem;
  }

  .order-card {
    padding: 0.75rem;
  }

  .order-action-buttons {
    flex-direction: column;
  }

  .order-action-buttons button {
    width: 100%;
    flex: none;
  }

  .order-item-img {
    width: 44px !important;
    height: 44px !important;
    min-width: 44px !important;
  }

  .status-tab-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.725rem;
  }
}

/* ==========================================================================
   Orders Floating Toast Notification
   ========================================================================== */
.orders-floating-toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100001;
  max-width: 420px;
  width: calc(100% - 3rem);
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  box-shadow: 0 10px 30px -5px rgba(0, 51, 153, 0.18), 0 0 0 1px rgba(0, 51, 153, 0.08);
  padding: 0.9rem 1.15rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border-left: 4px solid #004aad;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.orders-floating-toast.toast-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.orders-floating-toast.toast-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.orders-floating-toast.toast-info {
  border-left-color: #004aad;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.toast-indicator-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: 800;
  color: #0f172a;
}

.toast-text {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.4;
  margin: 0;
  word-break: break-word;
}

.toast-close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.15s ease;
  flex-shrink: 0;
}

.toast-close-btn:hover {
  color: #0f172a;
}

/* Toast Transition Animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-slide-enter-from {
  opacity: 0;
  transform: translateY(-25px) scale(0.95);
}

.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}

@media (max-width: 640px) {
  .orders-floating-toast {
    top: 1rem;
    left: 1rem;
    right: 1rem;
    width: auto;
  }
}
</style>

<style>
/* Payment Success Modal Styles */
.checkout-success-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  z-index: 100000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.checkout-success-card {
  background: #ffffff;
  border-radius: 16px;
  max-width: 480px;
  width: 100%;
  padding: 2.25rem 2rem;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 51, 153, 0.2);
  border: 1px solid #e2e8f0;
}

.success-icon-badge {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: #ecfdf5;
  border: 3px solid #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  box-shadow: 0 0 24px rgba(16, 185, 129, 0.35);
  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.checkmark-pulse-icon {
  animation: checkPulse 1.8s ease-in-out infinite;
}

@keyframes checkPulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4));
  }
  50% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.7));
  }
}

@keyframes bounceIn {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.success-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.success-desc {
  font-size: 0.85rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.25rem;
}

.success-product-preview {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  padding: 0.85rem 1rem;
  margin-bottom: 1.25rem;
  text-align: left;
}

.preview-tag-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #15803d;
  display: block;
  margin-bottom: 0.5rem;
}

.preview-product-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.preview-product-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  flex-shrink: 0;
}

.preview-product-info {
  flex: 1;
  min-width: 0;
}

.preview-product-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-product-meta {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.25rem;
}

.meta-pill {
  font-size: 0.68rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 600;
}

.meta-qty {
  font-size: 0.72rem;
  font-weight: 700;
  color: #0f172a;
}

.preview-product-price {
  font-size: 0.82rem;
  font-weight: 800;
  color: #003399;
}

.success-order-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.85rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.success-box-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.box-label {
  color: #64748b;
}

.box-val {
  color: #0f172a;
}

.success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-success-ok {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.85rem 1.5rem;
  border-radius: 12px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
  transition: all 0.2s ease;
  width: 100%;
}

.btn-success-ok:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}

.success-secondary-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.success-secondary-row .btn {
  flex: 1;
  padding: 0.6rem 0.85rem;
  font-size: 0.8rem;
  justify-content: center;
}

@media (max-width: 480px) {
  .checkout-success-backdrop {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .checkout-success-card {
    border-radius: 16px 16px 8px 8px;
    padding: 1.75rem 1.25rem;
  }
}
</style>
