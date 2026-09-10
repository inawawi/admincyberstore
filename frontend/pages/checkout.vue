<template>
  <div class="checkout-page container">
    <!-- Header with Breadcrumb -->
    <div class="checkout-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Beranda</NuxtLink>
        <span class="breadcrumb-separator">/</span>
        <NuxtLink to="/cart">Keranjang</NuxtLink>
        <span class="breadcrumb-separator">/</span>
        <span class="current">Checkout Pembayaran</span>
      </nav>
      <h1 class="page-title">Checkout Pengiriman & Pembayaran</h1>
      <p class="page-subtitle">Lengkapi alamat pengiriman dan pilih kurir untuk menyelesaikan pesanan kamu.</p>
    </div>

    <!-- If not authenticated, prompt to login -->
    <div v-if="!authStore.isAuthenticated" class="auth-required-box cyber-card">
      <div class="lock-icon-circle">
        <Icon name="lucide:lock" class="w-8 h-8 text-bsi" />
      </div>
      <h2>Silakan Masuk Terlebih Dahulu</h2>
      <p>Untuk melanjutkan proses checkout dan menyimpan riwayat transaksi Anda, silakan masuk atau daftar akun.</p>
      <NuxtLink to="/auth/login?redirect=/checkout" class="btn btn-primary btn-auth-login">
        <span>Masuk Akun untuk Checkout</span>
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- If cart empty -->
    <div v-else-if="cartStore.items.length === 0" class="empty-cart-box cyber-card">
      <div class="empty-icon-circle">
        <Icon name="lucide:shopping-cart" class="w-10 h-10 text-muted" />
      </div>
      <h2>Tidak Ada Produk yang Di-checkout</h2>
      <p>Keranjang belanja kamu masih kosong. Pilih perlengkapan atau gear kuliah terlebih dahulu.</p>
      <NuxtLink to="/products" class="btn btn-primary">
        <span>Lihat Katalog Produk</span>
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- Main Checkout Form Layout -->
    <div v-else class="checkout-grid">
      <!-- Left Column: Shipping & Delivery Settings -->
      <div class="checkout-steps-col">
        <!-- Step 1: Alamat Pengiriman -->
        <section class="step-card cyber-card">
          <div class="step-card-header">
            <span class="step-badge">1</span>
            <div class="step-title-group">
              <h2 class="step-title">Alamat Pengiriman</h2>
              <span class="step-desc">Tujuan pengiriman pesanan kamu</span>
            </div>
          </div>

          <!-- Existing Address Selector -->
          <div v-if="addresses.length > 0 && !showNewAddressForm" class="address-selector-list">
            <label v-for="addr in addresses" :key="addr.id"
              :class="['address-card', { active: selectedAddressId === addr.id }]">
              <div class="radio-indicator">
                <span class="radio-dot"></span>
              </div>
              <input type="radio" name="address" :value="addr.id" v-model="selectedAddressId" class="sr-only" />
              <div class="address-content">
                <div class="address-top">
                  <span class="addr-label badge badge-cyan">{{ addr.label || 'Alamat' }}</span>
                  <span v-if="addr.is_default" class="badge badge-emerald">Utama</span>
                  <span v-if="selectedAddressId === addr.id" class="badge badge-active-select">
                    <Icon name="lucide:check" class="w-3 h-3 inline mr-0.5" />
                    Terpilih
                  </span>
                </div>
                <div class="receiver-info-row">
                  <strong class="receiver-name">{{ addr.receiver_name || addr.recipient_name }}</strong>
                  <span class="receiver-phone">({{ addr.phone }})</span>
                </div>
                <p class="address-text">{{ addr.address }}, {{ addr.city }}, {{ addr.province }} {{ addr.postal_code }}
                </p>
                <div v-if="addr.latitude && addr.longitude" class="address-geo-badge">
                  <span class="geo-dot"></span>
                  <span>Titik Presisi GPS</span>
                  <a :href="`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`" target="_blank"
                    rel="noopener noreferrer" class="link-maps-inline" @click.stop>
                    Google Maps ↗
                  </a>
                </div>
              </div>
            </label>

            <button type="button" @click="showNewAddressForm = true" class="btn btn-secondary btn-sm add-address-btn">
              <Icon name="lucide:plus" class="w-4 h-4" />
              <span>Tambah Alamat Baru</span>
            </button>
          </div>

          <!-- New Address Form -->
          <form v-else @submit.prevent="handleSaveNewAddress" class="new-address-form">
            <div class="form-grid form-grid-2">
              <div class="form-group">
                <label class="form-label">Nama Penerima <span class="text-danger">*</span></label>
                <input v-model="newAddr.receiver_name" type="text" required placeholder="Nama Lengkap Penerima"
                  class="input-cyber" />
              </div>
              <div class="form-group">
                <label class="form-label">Nomor Telepon / WhatsApp <span class="text-danger">*</span></label>
                <input v-model="newAddr.phone" type="tel" required placeholder="Contoh: 081234567890"
                  class="input-cyber" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Label Alamat (Opsional)</label>
              <input v-model="newAddr.label" type="text" placeholder="Misal: Rumah, Kosan Kampus, Kantor"
                class="input-cyber" />
            </div>

            <!-- Titik Presisi Google Maps & GPS -->
            <div class="form-group">
              <label class="form-label label-with-hint">
                <span>Titik Presisi Alamat (Google Maps & GPS)</span>
                <span class="text-hint">Memudahkan kurir ekspedisi mengantar paket dengan akurat</span>
              </label>
              <ClientOnly>
                <LocationPicker :initial-lat="newAddr.latitude" :initial-lng="newAddr.longitude"
                  @update:location="handleCheckoutLocationPicked" />
              </ClientOnly>
            </div>

            <div class="form-group">
              <label class="form-label">Alamat Lengkap <span class="text-danger">*</span></label>
              <textarea v-model="newAddr.address" required rows="3"
                placeholder="Nama jalan, nomor rumah/kos, RT/RW, kelurahan, patokan lokasi"
                class="input-cyber textarea-address"></textarea>
            </div>

            <div class="form-grid form-grid-3">
              <div class="form-group">
                <label class="form-label">Provinsi <span class="text-danger">*</span></label>
                <input v-model="newAddr.province" type="text" required placeholder="DKI Jakarta" class="input-cyber" />
              </div>
              <div class="form-group">
                <label class="form-label">Kota / Kabupaten <span class="text-danger">*</span></label>
                <input v-model="newAddr.city" type="text" required placeholder="Jakarta Selatan" class="input-cyber" />
              </div>
              <div class="form-group">
                <label class="form-label">Kode Pos <span class="text-danger">*</span></label>
                <input v-model="newAddr.postal_code" type="text" required placeholder="12345" class="input-cyber" />
              </div>
            </div>

            <div class="form-actions">
              <button v-if="addresses.length > 0" type="button" @click="showNewAddressForm = false"
                :disabled="isSavingAddress" class="btn btn-secondary btn-cancel-address">
                Batal
              </button>
              <button type="submit" :disabled="isSavingAddress" class="btn btn-primary btn-save-address">
                <span v-if="isSavingAddress" class="btn-spinner-content">
                  <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                  <span>Menyimpan Alamat...</span>
                </span>
                <span v-else class="btn-save-content">
                  <Icon name="lucide:check" class="w-4 h-4" />
                  <span>Simpan</span>
                </span>
              </button>
            </div>
          </form>
        </section>

        <!-- Step 2: Pilih Kurir & Ekspedisi -->
        <section class="step-card cyber-card">
          <div class="step-card-header">
            <span class="step-badge">2</span>
            <div class="step-title-group">
              <h2 class="step-title">Pilihan Kurir & Ekspedisi</h2>
              <span class="step-desc">Pilih kurir pengiriman terpercaya</span>
            </div>
          </div>

          <!-- Loading state for expeditions -->
          <div v-if="isLoadingExpeditions" class="expeditions-skeleton-list">
            <div v-for="i in 3" :key="i" class="expedition-card-skeleton skeleton"></div>
          </div>

          <!-- Expeditions list -->
          <div v-else-if="expeditions.length > 0" class="expeditions-list">
            <label v-for="exp in expeditions" :key="exp.id"
              :class="['expedition-card', { active: selectedExpeditionId === exp.id }]">
              <div class="radio-indicator">
                <span class="radio-dot"></span>
              </div>
              <input type="radio" name="expedition" :value="exp.id" v-model="selectedExpeditionId" class="sr-only" />
              <div class="exp-info">
                <div class="exp-name-row">
                  <span class="exp-name">{{ exp.name }}</span>
                  <span class="badge badge-purple">{{ exp.service || 'REG' }}</span>
                </div>
                <span class="exp-estimate">Estimasi tiba: {{ exp.estimated_days || '2-3' }} hari kerja</span>
              </div>
              <div class="exp-cost-group">
                <span class="exp-cost">{{ formatRupiah(exp.base_cost || 14000) }}</span>
              </div>
            </label>
          </div>

          <div v-else class="expeditions-empty">
            <p>Jasa ekspedisi default: <strong>JNE Regular (Rp 14.000)</strong></p>
          </div>
        </section>

        <!-- Step 3: Catatan Pembeli -->
        <section class="step-card cyber-card">
          <div class="step-card-header">
            <span class="step-badge">3</span>
            <div class="step-title-group">
              <h2 class="step-title">Catatan untuk Penjual (Opsional)</h2>
              <span class="step-desc">Instruksi khusus atau catatan pengiriman</span>
            </div>
          </div>
          <input v-model="orderNote" type="text"
            placeholder="Misal: Tolong bubble wrap tebal, kirim sebelum jam 3 sore."
            class="input-cyber order-note-input" />
        </section>
      </div>

      <!-- Right Column: Order Summary & Pay -->
      <aside class="checkout-summary-col">
        <div class="summary-card cyber-card">
          <div class="summary-header">
            <h3 class="summary-title">Ringkasan Pesanan</h3>
            <span class="summary-badge">{{ cartStore.totalItems }} Item</span>
          </div>

          <!-- Items list -->
          <div class="checkout-items-list">
            <div v-for="item in cartStore.items" :key="item.id" class="checkout-item">
              <img :src="getImageUrl(item.product?.main_photo)" :alt="item.product?.name || 'Produk'"
                class="checkout-item-img" />
              <div class="checkout-item-info">
                <span class="item-title">{{ item.product?.name }}</span>
                <div class="item-meta-tags">
                  <span class="item-qty-tag">{{ item.quantity }}x {{ formatRupiah(item.product?.price || 0) }}</span>
                  <span v-if="item.selectedSize" class="item-variant-tag">Ukuran: {{ item.selectedSize }}</span>
                  <span v-if="item.selectedColor" class="item-variant-tag">Warna: {{ item.selectedColor }}</span>
                  <span v-if="item.nim" class="item-variant-tag nim-tag">
                    <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1" />
                    NIM: {{ item.nim }}
                  </span>
                </div>
              </div>
              <span class="checkout-item-total">
                {{ formatRupiah((item.product?.price || 0) * item.quantity) }}
              </span>
            </div>
          </div>

          <!-- Calculation details -->
          <div class="checkout-calc-list">
            <div class="calc-row">
              <span class="calc-label">Subtotal Produk</span>
              <span class="calc-value font-mono">{{ formatRupiah(cartStore.subtotal) }}</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Ongkos Kirim ({{ selectedExpedition?.name || 'Ekspedisi' }})</span>
              <span class="calc-value font-mono">{{ formatRupiah(shippingCost) }}</span>
            </div>
            <div class="calc-row grand-total-row">
              <div class="grand-total-info">
                <strong class="grand-total-label">Total Tagihan</strong>
                <span class="grand-total-sub">Sudah termasuk PPN</span>
              </div>
              <strong class="grand-total-val font-display">{{ formatRupiah(grandTotal) }}</strong>
            </div>
          </div>

          <!-- Pay Button (Desktop & Tablet) -->
          <button id="btn-pay-now" @click="handlePayWithMidtrans"
            :disabled="isProcessing || !selectedAddressId || !selectedExpeditionId" class="btn btn-primary btn-pay-now">
            <span v-if="isProcessing" class="btn-processing-spinner">
              <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin" />
              <span>Menyiapkan Pembayaran...</span>
            </span>
            <span v-else class="btn-pay-content">
              <Icon name="lucide:lock" class="w-5 h-5" />
              <span>Bayar Sekarang</span>
            </span>
          </button>

          <!-- Safe Payment Note -->
          <div class="payment-note-box">
            <div class="note-icon">
              <Icon name="lucide:shield-check" class="w-5 h-5 text-emerald" />
            </div>
            <p class="payment-note">
              Pembayaran aman terenkripsi via <strong>(Virtual Account)</strong>.
            </p>
          </div>
        </div>
      </aside>
    </div>

    <!-- Mobile Fixed Floating Checkout Bar (< 768px) -->
    <div v-if="cartStore.items.length > 0 && authStore.isAuthenticated" class="mobile-sticky-checkout-bar">
      <div class="mobile-bar-container">
        <div class="mobile-bar-total">
          <span class="mobile-bar-label">Total Tagihan</span>
          <span class="mobile-bar-amount font-display">{{ formatRupiah(grandTotal) }}</span>
        </div>
        <button id="btn-pay-mobile" @click="handlePayWithMidtrans"
          :disabled="isProcessing || !selectedAddressId || !selectedExpeditionId"
          class="btn btn-primary mobile-btn-pay">
          <span v-if="isProcessing">Memproses...</span>
          <span v-else>
            <Icon name="lucide:lock" class="w-4 h-4 inline-block mr-1" />
            Bayar Sekarang
          </span>
        </button>
      </div>
    </div>

    <!-- Payment Success Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="isSuccessModalOpen && paidSuccessOrder" class="checkout-success-backdrop" @click.self="goToOrders">
          <div class="checkout-success-card" role="dialog" aria-modal="true">
            <div class="success-icon-badge">
              <Icon name="lucide:party-popper" class="w-10 h-10 text-amber-500" />
            </div>
            <h2 class="success-title">Pembayaran Berhasil Diterima!</h2>
            <p class="success-desc">
              Terima kasih! Pembayaran Anda telah terverifikasi secara resmi. Toko akan segera mengemas dan mengirimkan
              pesanan Anda.
            </p>

            <div class="success-order-box">
              <div class="success-box-row">
                <span class="box-label">Nomor Invoice:</span>
                <strong class="box-val font-mono text-bsi">{{ paidSuccessOrder.invoice_number || `ORD-#${paidSuccessOrder.id}` }}</strong>
              </div>
              <div class="success-box-row">
                <span class="box-label">Total Pembayaran:</span>
                <strong class="box-val font-mono">{{ formatRupiah(paidSuccessOrder.grand_total || grandTotal) }}</strong>
              </div>
              <div class="success-box-row">
                <span class="box-label">Status:</span>
                <span class="badge badge-emerald inline-flex items-center gap-1">
                  <Icon name="lucide:check" class="w-3.5 h-3.5" />
                  LUNAS (PAID)
                </span>
              </div>
            </div>

            <div class="success-actions">
              <button type="button" class="btn btn-primary btn-print-success" @click="openSuccessInvoice">
                <Icon name="lucide:printer" class="w-4 h-4" />
                <span>Cetak Invoice Sekarang</span>
              </button>

              <button type="button" class="btn btn-secondary btn-orders-success" @click="goToOrders">
                <span>Lihat Pesanan Saya</span>
                <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Official Order Invoice Printable Modal -->
    <OrderInvoiceModal :is-open="isInvoiceModalOpen" :order="paidSuccessOrder" @close="handleCloseInvoiceModal" />

    <!-- Address & Action Floating Toast Notification -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="addressToast.show" :class="['checkout-floating-toast', `toast-${addressToast.type}`]">
          <div class="toast-indicator-icon">
            <Icon v-if="addressToast.type === 'success'" name="lucide:check-circle-2" class="w-5 h-5 text-emerald" />
            <Icon v-else-if="addressToast.type === 'info'" name="lucide:map-pin" class="w-5 h-5 text-bsi" />
            <Icon v-else name="lucide:alert-circle" class="w-5 h-5 text-rose" />
          </div>
          <div class="toast-body">
            <span class="toast-title">{{ toastTitle }}</span>
            <p class="toast-text">{{ addressToast.message }}</p>
          </div>
          <button type="button" class="toast-close-btn" @click="addressToast.show = false"
            aria-label="Tutup notifikasi">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
definePageMeta({
  middleware: 'auth',
})

import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { useMidtrans } from '~/composables/useMidtrans'
import OrderInvoiceModal from '~/components/OrderInvoiceModal.vue'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const { fetchExpeditions, fetchAddresses, createAddress, checkoutOrder, checkPaymentStatus, getImageUrl } = useApi()
const { formatRupiah } = useFormat()
const { pay: payWithMidtrans, loadSnap: loadMidtransScript } = useMidtrans()

// Payment Success & Invoice Modal State
const isSuccessModalOpen = ref(false)
const isInvoiceModalOpen = ref(false)
const paidSuccessOrder = ref<any>(null)

const openSuccessInvoice = () => {
  isInvoiceModalOpen.value = true
}

const handleCloseInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

const goToOrders = () => {
  isSuccessModalOpen.value = false
  router.push('/account/orders')
}

const addresses = ref<any[]>([])
const expeditions = ref<any[]>([])
const selectedAddressId = ref<number | string | null>(null)
const selectedExpeditionId = ref<number | string | null>(null)
const orderNote = ref('')
const isProcessing = ref(false)
const showNewAddressForm = ref(false)
const isLoadingExpeditions = ref(false)

const newAddr = ref({
  label: 'Rumah',
  receiver_name: '',
  phone: '',
  address: '',
  province: '',
  city: '',
  postal_code: '',
  latitude: null as number | null,
  longitude: null as number | null,
})

// Toast State for Address & Actions
const addressToast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info',
})
let addressToastTimer: any = null

const showAddressToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
  addressToast.value = {
    show: true,
    message: msg,
    type,
  }
  if (addressToastTimer) clearTimeout(addressToastTimer)
  addressToastTimer = setTimeout(() => {
    addressToast.value.show = false
  }, 4500)
}

const toastTitle = computed(() => {
  if (addressToast.value.type === 'success') return 'Alamat Berhasil Disimpan!'
  if (addressToast.value.type === 'info') return 'Info Lokasi'
  return 'Perhatian'
})

const isSavingAddress = ref(false)

const handleCheckoutLocationPicked = (loc: {
  latitude: number
  longitude: number
  address?: string
  city?: string
  province?: string
  postal_code?: string
  district?: string
}) => {
  newAddr.value.latitude = loc.latitude
  newAddr.value.longitude = loc.longitude

  if (loc.address) newAddr.value.address = loc.address
  if (loc.city) newAddr.value.city = loc.city
  if (loc.province) newAddr.value.province = loc.province
  if (loc.postal_code) newAddr.value.postal_code = loc.postal_code

  showAddressToast('Titik peta & detail alamat berhasil diterapkan ke formulir!', 'info')
}

const loadCheckoutData = async () => {
  isLoadingExpeditions.value = true
  try {
    const expRes = await fetchExpeditions()
    expeditions.value = expRes?.expeditions || (Array.isArray(expRes) ? expRes : [])
    if (expeditions.value.length > 0 && !selectedExpeditionId.value) {
      selectedExpeditionId.value = expeditions.value[0].id
    }
  } catch (err) {
    console.error('Failed to load expeditions:', err)
  } finally {
    isLoadingExpeditions.value = false
  }

  if (authStore.isAuthenticated) {
    if (!newAddr.value.receiver_name && authStore.user?.name) {
      newAddr.value.receiver_name = authStore.user.name
    }
    if (!newAddr.value.phone && authStore.user?.phone) {
      newAddr.value.phone = authStore.user.phone
    }

    try {
      const addrRes = await fetchAddresses()
      addresses.value = addrRes?.addresses || (Array.isArray(addrRes) ? addrRes : [])

      if (addresses.value.length > 0) {
        const def = addresses.value.find((a: any) => a.is_default) || addresses.value[0]
        selectedAddressId.value = def.id
        showNewAddressForm.value = false
      } else {
        showNewAddressForm.value = true
      }
    } catch (err) {
      console.error('Failed to load addresses:', err)
      showNewAddressForm.value = true
    }
  }
}

onMounted(() => {
  loadMidtransScript()
  loadCheckoutData()
})

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      loadCheckoutData()
    }
  }
)

const selectedExpedition = computed(() => {
  return expeditions.value.find((e: any) => e.id === selectedExpeditionId.value)
})

const shippingCost = computed(() => {
  return selectedExpedition.value?.base_cost || 14000
})

const grandTotal = computed(() => {
  return cartStore.subtotal + shippingCost.value
})

const handleSaveNewAddress = async () => {
  // Client-side Validasi
  const receiverName = newAddr.value.receiver_name?.trim()
  const phone = newAddr.value.phone?.trim()
  const address = newAddr.value.address?.trim()
  const city = newAddr.value.city?.trim()
  const province = newAddr.value.province?.trim()
  const postalCode = newAddr.value.postal_code?.trim()

  if (!receiverName) {
    showAddressToast('Nama penerima paket wajib diisi.', 'error')
    return
  }
  if (!phone || phone.length < 8) {
    showAddressToast('Nomor telepon / WhatsApp tidak valid (minimal 8-15 digit).', 'error')
    return
  }
  if (!address || address.length < 5) {
    showAddressToast('Alamat lengkap pengiriman wajib diisi dengan jelas.', 'error')
    return
  }
  if (!city) {
    showAddressToast('Kota / Kabupaten tujuan pengiriman wajib diisi.', 'error')
    return
  }
  if (!province) {
    showAddressToast('Provinsi tujuan pengiriman wajib diisi.', 'error')
    return
  }
  if (!postalCode) {
    showAddressToast('Kode pos tujuan pengiriman wajib diisi.', 'error')
    return
  }

  isSavingAddress.value = true

  try {
    const payload = {
      label: newAddr.value.label?.trim() || 'Rumah',
      receiver_name: receiverName,
      phone,
      address,
      province,
      city,
      postal_code: postalCode,
      latitude: newAddr.value.latitude || null,
      longitude: newAddr.value.longitude || null,
    }

    const res = await createAddress(payload)
    const savedAddress = res?.address || res?.data || res

    if (savedAddress && savedAddress.id) {
      addresses.value.push(savedAddress)
      selectedAddressId.value = savedAddress.id
      showNewAddressForm.value = false

      // Reset form ke data default user
      newAddr.value = {
        label: 'Rumah',
        receiver_name: authStore.user?.name || '',
        phone: authStore.user?.phone || '',
        address: '',
        province: '',
        city: '',
        postal_code: '',
        latitude: null,
        longitude: null,
      }

      showAddressToast('Alamat baru berhasil disimpan dan dipilih untuk checkout!', 'success')
    } else {
      // Fallback reload list alamat
      const addrRes = await fetchAddresses()
      addresses.value = addrRes?.addresses || (Array.isArray(addrRes) ? addrRes : [])
      if (addresses.value.length > 0) {
        selectedAddressId.value = addresses.value[addresses.value.length - 1].id
      }
      showNewAddressForm.value = false
      showAddressToast('Alamat baru berhasil disimpan!', 'success')
    }
  } catch (err: any) {
    console.error('Failed to save new address:', err)
    const errorMsg = err.data?.message || err.message || 'Gagal menyimpan alamat baru. Silakan periksa kembali data Anda.'
    showAddressToast(errorMsg, 'error')
  } finally {
    isSavingAddress.value = false
  }
}

const handlePayWithMidtrans = async () => {
  if (!selectedAddressId.value) {
    alert('Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.')
    return
  }
  if (!selectedExpeditionId.value) {
    alert('Silakan pilih kurir pengiriman terlebih dahulu.')
    return
  }

  isProcessing.value = true

  try {
    const itemsPayload = cartStore.items.map(item => ({
      product_id: item.productId,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
      nim: item.nim,
    }))

    const res = await checkoutOrder({
      customer_address_id: selectedAddressId.value,
      expedition_id: selectedExpeditionId.value,
      note: orderNote.value,
      items: itemsPayload,
    })

    const snapToken = res.snap_token || res.order?.payment?.snap_token || res.payment?.snap_token || res.token
    const snapUrl = res.snap_url || res.order?.payment?.snap_url || res.payment?.snap_url
    const paymentId = res.order?.payment?.id || res.payment?.id

    if (snapToken) {
      await payWithMidtrans(snapToken, {
        onSuccess: async (result: any) => {
          console.log('Pembayaran Berhasil:', result)
          let finalOrder = res.order || null
          if (paymentId) {
            try {
              const syncRes = await checkPaymentStatus(paymentId)
              if (syncRes?.order) {
                finalOrder = syncRes.order
              }
            } catch (e) {
              console.warn('Sync payment status error:', e)
            }
          }
          cartStore.clearCart()
          paidSuccessOrder.value = finalOrder || res.order || {
            id: res.order_id || paymentId,
            invoice_number: res.invoice_number,
            grand_total: grandTotal.value,
            status: 'paid',
            created_at: new Date().toISOString(),
          }
          isSuccessModalOpen.value = true
        },
        onPending: async (result: any) => {
          console.log('Pembayaran Pending:', result)
          if (paymentId) {
            try {
              await checkPaymentStatus(paymentId)
            } catch (e) {
              console.warn('Sync payment status error:', e)
            }
          }
          cartStore.clearCart()
          router.push('/account/orders')
        },
        onError: (result: any) => {
          console.error('Pembayaran Error:', result)
          alert('Pembayaran gagal atau dibatalkan.')
        },
        onClose: async () => {
          if (paymentId) {
            try {
              await checkPaymentStatus(paymentId)
            } catch (e) {
              // Ignore
            }
          }
          cartStore.clearCart()
          router.push('/account/orders')
        },
      })
    } else if (snapUrl) {
      cartStore.clearCart()
      window.location.href = snapUrl
    } else {
      cartStore.clearCart()
      router.push('/account/orders')
    }
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal memproses pesanan checkout.')
  } finally {
    isProcessing.value = false
  }
}

useHead({
  title: 'Checkout Pembayaran | Cyber Store',
})
</script>

<style scoped>
/* ==========================================================================
   Checkout Page Main Container
   ========================================================================== */
.checkout-page {
  padding-top: 1.5rem;
  padding-bottom: 6rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header & Breadcrumbs */
.checkout-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.825rem;
  color: #64748b;
  flex-wrap: wrap;
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
}

/* Auth & Empty State Boxes */
.auth-required-box,
.empty-cart-box {
  padding: 4rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
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
.empty-cart-box h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.auth-required-box p,
.empty-cart-box p {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 480px;
  line-height: 1.5;
}

.btn-auth-login {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  font-weight: 700;
  border-radius: var(--radius-full);
}

/* ==========================================================================
   Checkout 2-Column Grid
   ========================================================================== */
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 1.75rem;
  align-items: start;
}

.checkout-steps-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Step Card */
.step-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 12px rgba(0, 51, 153, 0.04);
}

.step-card-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.85rem;
}

.step-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 51, 153, 0.2);
}

.step-title-group {
  display: flex;
  flex-direction: column;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.step-desc {
  font-size: 0.78rem;
  color: #64748b;
}

/* ==========================================================================
   Step 1: Address List & Form
   ========================================================================== */
.address-selector-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.address-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 1rem;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.address-card:hover {
  border-color: #93c5fd;
  background: #f8fafc;
}

.address-card.active {
  border-color: #003399;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #003399, 0 4px 14px rgba(0, 51, 153, 0.08);
}

/* Radio Indicator */
.radio-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s ease;
  background: #ffffff;
}

.address-card.active .radio-indicator,
.expedition-card.active .radio-indicator {
  border-color: #003399;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #003399;
  opacity: 0;
  transform: scale(0.4);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.address-card input[type="radio"],
.expedition-card input[type="radio"],
.sr-only {
  position: absolute !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  pointer-events: none !important;
  margin: 0 !important;
}

.address-card.active .radio-dot,
.expedition-card.active .radio-dot {
  opacity: 1;
  transform: scale(1);
}

.address-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.address-top {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.addr-label {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.receiver-info-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.receiver-name {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 700;
}

.receiver-phone {
  color: #64748b;
  font-size: 0.825rem;
  font-weight: 500;
}

.address-text {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.45;
  word-break: break-word;
}

.add-address-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  align-self: flex-start;
  margin-top: 0.5rem;
  font-weight: 700;
  padding: 0.5rem 0.9rem;
}

/* Address Form */
.new-address-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.form-grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.form-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: #334155;
}

.text-danger {
  color: #ef4444;
}

.input-cyber {
  width: 100%;
  padding: 0.65rem 0.9rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-sm);
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.input-cyber:focus {
  background: #ffffff;
  border-color: #004aad;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.15);
}

.textarea-address {
  resize: vertical;
  min-height: 70px;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
}

.btn-save-address {
  font-weight: 700;
  padding: 0.65rem 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-spinner-content,
.btn-save-content {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-cancel-address {
  font-weight: 600;
}

.badge-active-select {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
  background: #eff6ff;
  color: #003399;
  border: 1px solid #bfdbfe;
  display: inline-flex;
  align-items: center;
}

/* ==========================================================================
   Step 2: Expeditions
   ========================================================================== */
.expeditions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.expedition-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.expedition-card:hover {
  border-color: #93c5fd;
  background: #f8fafc;
}

.expedition-card.active {
  border-color: #003399;
  background: #eff6ff;
  box-shadow: 0 0 0 1px #003399, 0 4px 14px rgba(0, 51, 153, 0.08);
}

.exp-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.exp-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.exp-name {
  font-weight: 700;
  color: #0f172a;
  font-size: 0.95rem;
}

.badge-purple {
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  color: #6d28d9;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
}

.exp-estimate {
  font-size: 0.75rem;
  color: #64748b;
}

.exp-cost-group {
  flex-shrink: 0;
}

.exp-cost {
  font-weight: 800;
  color: #003399;
  font-size: 0.95rem;
}

.expeditions-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.expedition-card-skeleton {
  height: 64px;
  border-radius: var(--radius-sm);
}

.expeditions-empty {
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: #475569;
}

/* ==========================================================================
   Step 3: Notes
   ========================================================================== */
.order-note-input {
  padding: 0.75rem 1rem;
}

/* ==========================================================================
   Right Column: Order Summary
   ========================================================================== */
.checkout-summary-col {
  position: sticky;
  top: 90px;
  z-index: 10;
}

.summary-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px rgba(0, 51, 153, 0.06);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.75rem;
}

.summary-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.summary-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #003399;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

/* Items list */
.checkout-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
}

.checkout-items-list::-webkit-scrollbar {
  width: 4px;
}

.checkout-items-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.checkout-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.checkout-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.checkout-item-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.checkout-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta-tags {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.item-qty-tag {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.item-variant-tag {
  font-size: 0.7rem;
  color: #003399;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
}

.nim-tag {
  color: #6d28d9;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.checkout-item-total {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  flex-shrink: 0;
}

/* Calculation */
.checkout-calc-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  padding: 0.9rem 0;
  font-size: 0.875rem;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #475569;
}

.calc-label {
  font-weight: 500;
}

.calc-value {
  font-weight: 600;
  color: #0f172a;
}

.grand-total-row {
  margin-top: 0.35rem;
  padding-top: 0.75rem;
  border-top: 1.5px dashed #cbd5e1;
  align-items: flex-end;
}

.grand-total-info {
  display: flex;
  flex-direction: column;
}

.grand-total-label {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.grand-total-sub {
  font-size: 0.7rem;
  color: #94a3b8;
}

.grand-total-val {
  font-size: 1.35rem;
  font-weight: 900;
  color: #003399;
}

/* Pay Button */
.btn-pay-now {
  width: 100%;
  padding: 0.85rem 1.25rem;
  font-size: 0.95rem;
  font-weight: 800;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 51, 153, 0.28);
  transition: all 0.25s ease;
}

.btn-pay-now:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 51, 153, 0.36);
}

.btn-pay-now:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.btn-pay-content,
.btn-processing-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Payment note */
.payment-note-box {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 0.9rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: var(--radius-sm);
}

.note-icon {
  font-size: 1rem;
  line-height: 1.3;
}

.payment-note {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.45;
  margin: 0;
}

/* ==========================================================================
   Mobile Floating Checkout Bar (< 768px)
   ========================================================================== */
.mobile-sticky-checkout-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-top: 1px solid #e2e8f0;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -6px 20px rgba(15, 23, 42, 0.08);
  z-index: 95;
}

.mobile-bar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
}

.mobile-bar-total {
  display: flex;
  flex-direction: column;
}

.mobile-bar-label {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 600;
}

.mobile-bar-amount {
  font-size: 1.15rem;
  font-weight: 900;
  color: #003399;
}

.mobile-btn-pay {
  padding: 0.65rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 800;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

/* ==========================================================================
   Responsive Media Queries
   ========================================================================== */

/* 1. Large Screen / Desktop (min-width: 1025px) */
@media (min-width: 1025px) {
  .checkout-grid {
    grid-template-columns: 1fr 420px;
    gap: 2rem;
  }
}

/* 2. Tablets & Small Laptops (769px to 1024px) */
@media (max-width: 1024px) {
  .checkout-grid {
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
  }

  .summary-card {
    padding: 1.25rem;
  }

  .step-card {
    padding: 1.25rem;
  }

  .form-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 3. Mobile Landscape & Tablets Portrait (max-width: 768px) */
@media (max-width: 768px) {
  .checkout-page {
    padding-top: 1rem;
    padding-bottom: 7rem;
    /* Extra padding so content isn't covered by mobile floating bar */
    gap: 1.25rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .checkout-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .checkout-summary-col {
    position: static;
  }

  .step-card {
    padding: 1.15rem;
    gap: 1rem;
  }

  .form-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .mobile-sticky-checkout-bar {
    display: block;
  }
}

/* 3b. Mobile Portrait Phones (max-width: 640px) */
@media (max-width: 640px) {

  .form-grid-2,
  .form-grid-3 {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-save-address,
  .btn-cancel-address {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}

/* 4. Small Mobile Phones (max-width: 480px) */
@media (max-width: 480px) {
  .checkout-page {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .page-title {
    font-size: 1.35rem;
  }

  .step-card {
    padding: 1rem;
    border-radius: var(--radius-sm);
  }

  .step-title {
    font-size: 1rem;
  }

  .step-badge {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .address-card,
  .expedition-card {
    padding: 0.8rem 0.85rem;
  }

  .receiver-name {
    font-size: 0.9rem;
  }

  .address-text {
    font-size: 0.8rem;
  }

  .summary-card {
    padding: 1.1rem;
  }

  .item-title {
    font-size: 0.82rem;
  }

  .checkout-item-total {
    font-size: 0.82rem;
  }

  .mobile-bar-amount {
    font-size: 1.05rem;
  }

  .mobile-btn-pay {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}

/* 5. Extra Small Phones (max-width: 360px) */
@media (max-width: 360px) {
  .page-title {
    font-size: 1.25rem;
  }

  .mobile-bar-container {
    gap: 0.5rem;
  }

  .mobile-bar-amount {
    font-size: 0.95rem;
  }

  .mobile-btn-pay {
    padding: 0.55rem 0.85rem;
    font-size: 0.8rem;
  }
}

/* GPS Badge & Map Elements */
.address-geo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.6rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 0.45rem;
  font-size: 0.75rem;
  color: #065f46;
  font-weight: 600;
  margin-top: 0.5rem;
}

.geo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.link-maps-inline {
  color: #0284c7;
  text-decoration: underline;
  margin-left: 0.25rem;
  font-weight: 700;
}

.link-maps-inline:hover {
  color: #003399;
}

.label-with-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.text-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
}

/* Checkout Payment Success Modal */
.checkout-success-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  z-index: 9999;
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #ecfdf5;
  border: 2px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.25rem;
  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes bounceIn {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.success-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.success-desc {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.success-order-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
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

.btn-print-success {
  background: #004aad;
  color: #ffffff;
  font-weight: 700;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 74, 173, 0.25);
  transition: all 0.2s ease;
}

.btn-print-success:hover {
  background: #003399;
  transform: translateY(-1px);
}

.btn-orders-success {
  background: #f1f5f9;
  color: #334155;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-orders-success:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Checkout Success Modal Responsive */
@media (max-width: 480px) {
  .checkout-success-backdrop {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .checkout-success-card {
    border-radius: 16px 16px 8px 8px;
    padding: 1.75rem 1.25rem;
  }

  .success-title {
    font-size: 1.15rem;
  }

  .success-desc {
    font-size: 0.825rem;
  }

  .btn-print-success,
  .btn-orders-success {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}

/* ==========================================================================
   Checkout Floating Toast Notification
   ========================================================================== */
.checkout-floating-toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 99999;
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

.checkout-floating-toast.toast-success {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.checkout-floating-toast.toast-error {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.checkout-floating-toast.toast-info {
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
  .checkout-floating-toast {
    top: 1rem;
    left: 1rem;
    right: 1rem;
    width: auto;
    max-width: none;
  }
}
</style>
