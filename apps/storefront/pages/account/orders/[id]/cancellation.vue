<template>
  <div class="orders-page container">
    <!-- Header with Breadcrumbs -->
    <div class="orders-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Beranda</NuxtLink>
        <span class="breadcrumb-separator">/</span>
        <NuxtLink to="/account/orders">Pesanan Saya</NuxtLink>
        <span class="breadcrumb-separator">/</span>
        <span class="current">Rincian Pembatalan</span>
      </nav>
      <div class="header-content-row">
        <div>
          <h1 class="page-title">Rincian Pembatalan Pesanan</h1>
          <p class="page-subtitle">Pantau status verifikasi pembatalan, pelacakan proses, dan rincian pengembalian dana
            Anda.</p>
        </div>
        <button type="button" @click="goBack" class="btn btn-secondary btn-back-orders">
          <Icon name="lucide:arrow-left" class="w-4 h-4 mr-1.5 inline-block" />
          <span>Kembali ke Pesanan</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="empty-orders-box cyber-card">
      <div class="loading-spinner mb-4"></div>
      <p class="text-slate-600 font-semibold">Memuat rincian pembatalan...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="!order" class="empty-orders-box cyber-card">
      <div class="empty-icon-circle">
        <Icon name="lucide:alert-circle" class="w-10 h-10 text-rose-500" />
      </div>
      <h2>Rincian Pembatalan Tidak Ditemukan</h2>
      <p>Pesanan tidak ditemukan atau Anda tidak memiliki akses ke pesanan ini.</p>
      <NuxtLink to="/account/orders" class="btn btn-primary">
        <Icon name="lucide:arrow-left" class="w-4 h-4 mr-1.5 inline" />
        <span>Kembali ke Riwayat Pesanan</span>
      </NuxtLink>
    </div>

    <!-- Main Cancellation Details Content (Card structure matching orders.vue) -->
    <div v-else class="cancellation-main-wrapper">
      <div class="order-card cyber-card cancellation-card">
        <!-- 1. Card Header Meta -->
        <div class="order-card-header cancellation-meta-header">
          <div class="order-meta-left">
            <div class="order-invoice-row">
              <span class="invoice-label">No. Pengajuan:</span>
              <strong class="order-invoice font-mono">{{ cancellationNumber }}</strong>
            </div>
            <span class="meta-dot">•</span>
            <span class="order-date-text">Diajukan: <strong>{{ requestedDateFormatted }}</strong></span>
            <span class="meta-dot">•</span>
            <span class="order-invoice-link-wrap">
              No. Pesanan:
              <NuxtLink :to="`/account/orders`" class="order-invoice-sublink font-mono">
                {{ order.invoice_number || `ORD-#${order.id}` }}
              </NuxtLink>
            </span>
          </div>
          <div class="order-meta-right">
            <span :class="['status-badge', badgeStatusClass]">
              {{ bannerTitle }}
            </span>
          </div>
        </div>

        <!-- 2. Step Progress Tracker (Stepper) -->
        <div class="cancellation-stepper-section">
          <div class="stepper-track">
            <!-- Step 1: Pembatalan Diajukan -->
            <div class="step-node completed">
              <div class="step-dot">
                <Icon name="lucide:check" class="w-3.5 h-3.5 text-white" />
              </div>
              <div class="step-label">Pembatalan Diajukan</div>
              <div class="step-time">{{ step1Time }}</div>
            </div>

            <!-- Connecting Line 1-2 -->
            <div :class="['step-connector', { active: isStep2Active || isStep3Active, rejected: isRejected }]"></div>

            <!-- Step 2: Pembatalan Disetujui / Ditolak -->
            <div
              :class="['step-node', isRejected ? 'rejected' : (isStep2Active || isStep3Active ? 'completed' : 'pending')]">
              <div class="step-dot">
                <Icon v-if="isRejected" name="lucide:x" class="w-3.5 h-3.5 text-white" />
                <Icon v-else-if="isStep2Active || isStep3Active" name="lucide:check" class="w-3.5 h-3.5 text-white" />
                <span v-else class="dot-inner"></span>
              </div>
              <div class="step-label">
                {{ isRejected ? 'Pembatalan Ditolak' : 'Pembatalan Disetujui' }}
              </div>
              <div class="step-time">{{ step2Time }}</div>
            </div>

            <!-- Connecting Line 2-3 -->
            <div :class="['step-connector', { active: isStep3Active, rejected: isRejected }]"></div>

            <!-- Step 3: Dana Dikembalikan -->
            <div :class="['step-node', isRejected ? 'disabled' : (isStep3Active ? 'completed' : 'pending')]">
              <div class="step-dot">
                <Icon v-if="isStep3Active" name="lucide:check" class="w-3.5 h-3.5 text-white" />
                <span v-else class="dot-inner"></span>
              </div>
              <div class="step-label">Dana Dikembalikan</div>
              <div class="step-time">{{ step3Time }}</div>
            </div>
          </div>
        </div>

        <!-- 3. Status Banner Alert Card -->
        <div :class="['cancellation-banner-card', bannerThemeClass]">
          <div class="banner-title-row">
            <Icon :name="bannerIcon" class="w-5 h-5 banner-main-icon" />
            <h2 class="banner-headline">{{ bannerTitle }}</h2>
          </div>
          <p class="banner-subtext">{{ bannerDescription }}</p>
          <div v-if="order.refund_notes" class="banner-admin-notes">
            <Icon name="lucide:message-square" class="w-4 h-4 inline mr-1 text-slate-500" />
            <span>Catatan Admin: <em>"{{ order.refund_notes }}"</em></span>
          </div>
        </div>

        <!-- 4. Toko & Produk yang Dibatalkan Box -->
        <div class="cancellation-products-section">
          <div class="store-header-row">
            <div class="store-title-wrap">
              <Icon name="lucide:store" class="w-4 h-4 text-bsi inline mr-1.5" />
              <strong class="store-name">BSI CYBER STORE</strong>
            </div>
            <NuxtLink to="/" class="btn-store-visit">
              <Icon name="lucide:shopping-bag" class="w-3.5 h-3.5 mr-1 inline" />
              Kunjungi Toko
            </NuxtLink>
          </div>

          <div class="products-list-wrap">
            <div v-for="item in (order.items || [])" :key="item.id" class="cancellation-product-item">
              <img :src="getImageUrl(item.product?.main_photo || item.product_photo || item.photo)"
                :alt="item.product_name || item.product?.name" class="product-thumb-img"
                @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }" />
              <div class="product-info-wrap">
                <NuxtLink :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.product_id}`"
                  class="product-title-link">
                  {{ item.product_name || item.product?.name || 'Produk' }}
                </NuxtLink>
                <div class="product-variant-chips">
                  <span v-if="item.size" class="variant-pill">Ukuran: {{ item.size }}</span>
                  <span v-if="item.color" class="variant-pill">Warna: {{ item.color }}</span>
                  <span v-if="item.nim" class="variant-pill">NIM: {{ item.nim }}</span>
                </div>
                <div class="product-qty-tag">x{{ item.quantity }}</div>
              </div>
              <div class="product-price-column font-mono">
                <span class="product-price-val">{{ formatRupiah(item.price) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 5. Rincian Pengembalian Dana Summary Card -->
        <div class="cancellation-summary-card">
          <div class="summary-table-row primary-refund-row">
            <span class="table-label">Jumlah Pengembalian Dana</span>
            <strong class="table-val-highlight font-mono">{{ formatRupiah(totalRefundAmount) }}</strong>
          </div>

          <div class="summary-table-row">
            <span class="table-label">Pengembalian Dana ke</span>
            <div class="table-val-account">
              <div class="account-bank-badge">
                <Icon name="lucide:credit-card" class="w-4 h-4 text-emerald-600 inline mr-1" />
                <strong>{{ order.refund_bank_name || 'Rekening Customer' }}</strong>
              </div>
              <div v-if="order.refund_account_number" class="account-number-text font-mono">
                {{ order.refund_account_number }}
                <span v-if="order.refund_account_name" class="account-holder-name">
                  (a/n {{ order.refund_account_name }})
                </span>
              </div>
              <div v-else class="text-xs text-amber-600 italic">
                (Belum mengisi rekening - silakan lengkapi di bawah)
              </div>
            </div>
          </div>

          <div class="summary-table-row">
            <span class="table-label">Diminta oleh</span>
            <span class="table-val text-slate-700 font-semibold">Pembeli</span>
          </div>

          <div class="summary-table-row">
            <span class="table-label">No. Pesanan Asli</span>
            <NuxtLink :to="`/account/orders`" class="table-val-link font-mono">
              {{ order.invoice_number || `ORD-#${order.id}` }}
              <Icon name="lucide:external-link" class="w-3.5 h-3.5 inline ml-1" />
            </NuxtLink>
          </div>

          <!-- Accordion Toggle "Lihat Selengkapnya" -->
          <div class="accordion-toggle-wrap">
            <button type="button" @click="isExpanded = !isExpanded" class="btn-accordion-toggle">
              <span>{{ isExpanded ? 'Tutup Rincian' : 'Lihat Selengkapnya' }}</span>
              <Icon :name="isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-4 h-4 ml-1" />
            </button>
          </div>

          <!-- Expanded Breakdown & Tracking Timeline -->
          <Transition name="expand-fade">
            <div v-if="isExpanded" class="expanded-breakdown-box">
              <div class="breakdown-inner">
                <h4 class="breakdown-title">Rincian Perhitungan Dana</h4>
                <div class="breakdown-row">
                  <span>Subtotal Produk</span>
                  <span class="font-mono">{{ formatRupiah(order.subtotal) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Ongkos Kirim ({{ order.expedition?.name || 'Kurir' }})</span>
                  <span class="font-mono">{{ formatRupiah(order.shipping_cost) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Biaya Layanan Aplikasi</span>
                  <span class="text-emerald-600 font-semibold">GRATIS</span>
                </div>
                <div class="breakdown-divider"></div>
                <div class="breakdown-row breakdown-total">
                  <strong>Total Pembayaran Semula</strong>
                  <strong class="font-mono text-bsi">{{ formatRupiah(order.grand_total) }}</strong>
                </div>

                <!-- Tracking History Timeline -->
                <div v-if="order.trackings?.length" class="mt-5 pt-4 border-t border-slate-200">
                  <h4 class="breakdown-title mb-3">Riwayat Proses Pengajuan</h4>
                  <div class="tracking-history-timeline">
                    <div v-for="(tr, idx) in order.trackings" :key="tr.id || idx" class="history-timeline-item">
                      <div class="timeline-dot"></div>
                      <div class="timeline-body">
                        <div class="timeline-desc">{{ tr.description }}</div>
                        <div class="timeline-date font-mono">{{ formatTrackingTime(tr.created_at) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 6. Alasan Pembatalan Box -->
        <div class="cancellation-reason-card">
          <div class="reason-header">
            <Icon name="lucide:help-circle" class="w-4 h-4 text-slate-500 inline mr-1.5" />
            <strong class="text-sm font-bold text-slate-800">Alasan Pembatalan:</strong>
          </div>
          <div class="reason-content-box">
            {{ order.cancel_request_reason || 'Ingin mengubah rincian & membuat pesanan baru' }}
          </div>
        </div>

        <!-- 7. Form Perbarui / Lengkapi Rekening Bank (Jika Belum Selesai Refund) -->
        <div v-if="canEditBank" class="cancellation-edit-bank-card">
          <div class="card-header-flex">
            <div>
              <h3 class="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Icon name="lucide:wallet" class="w-5 h-5 text-bsi" />
                {{ order.refund_account_number ? 'Perbarui Rekening Pengembalian Dana' : 'Lengkapi Rekening Pengembalian Dana' }}
              </h3>
              <p class="text-xs text-slate-500 mt-1">
                Pastikan nomor rekening aktif dan sesuai atas nama Anda agar proses transfer refund oleh admin berjalan
                lancar.
              </p>
            </div>
            <button type="button" @click="isEditingBank = !isEditingBank" class="btn btn-outline-bsi btn-xs">
              {{ isEditingBank ? 'Batal' : (order.refund_account_number ? 'Ubah Rekening' : 'Isi Rekening') }}
            </button>
          </div>

          <form v-if="isEditingBank" @submit.prevent="handleSaveBank" class="edit-bank-form mt-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="form-group">
                <label class="form-label text-xs">Pilih Bank / E-Wallet</label>
                <select v-model="editBankName" class="input-cyber select-sm" required>
                  <option v-for="b in bankList" :key="b" :value="b">{{ b }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label text-xs">Nomor Rekening / No. HP</label>
                <input type="text" v-model="editAccountNumber" class="input-cyber input-sm font-mono"
                  placeholder="Contoh: 1234567890" required />
              </div>
              <div class="form-group">
                <label class="form-label text-xs">Atas Nama Pemilik</label>
                <input type="text" v-model="editAccountName" class="input-cyber input-sm"
                  placeholder="Nama sesuai buku tabungan" required />
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-3">
              <button type="button" @click="isEditingBank = false" class="btn btn-secondary btn-sm"
                :disabled="savingBank">
                Batal
              </button>
              <button type="submit" class="btn btn-primary btn-sm"
                :disabled="savingBank || !editBankName || !editAccountNumber || !editAccountName">
                <Icon name="lucide:save" class="w-3.5 h-3.5 mr-1 inline" />
                {{ savingBank ? 'Menyimpan...' : 'Simpan Rekening' }}
              </button>
            </div>
          </form>
        </div>


      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const router = useRouter()
const { fetchOrderDetail, updateRefundBank, getImageUrl } = useApi()

const orderId = computed(() => route.params.id as string)
const order = ref<any>(null)
const pending = ref(true)
const isExpanded = ref(false)

// Bank Editing State
const isEditingBank = ref(false)
const savingBank = ref(false)
const editBankName = ref('BCA')
const editAccountNumber = ref('')
const editAccountName = ref('')

const bankList = [
  'BCA',
  'BRI',
  'BNI',
  'Bank Mandiri',
  'BSI (Bank Syariah Indonesia)',
  'CIMB Niaga',
  'Bank Permata',
  'SeaBank',
  'Bank Jago',
  'DANA',
  'GoPay',
  'OVO',
  'ShopeePay',
  'Bank Lainnya',
]

const loadOrder = async () => {
  pending.value = true
  try {
    const res: any = await fetchOrderDetail(orderId.value)
    order.value = res?.order || res?.data || res || null
    if (order.value) {
      if (!order.value.cancel_request_status) {
        router.replace('/account/orders')
        return
      }
      editBankName.value = order.value.refund_bank_name || 'BCA'
      editAccountNumber.value = order.value.refund_account_number || ''
      editAccountName.value = order.value.refund_account_name || order.value.address?.receiver_name || ''
    }
  } catch (err) {
    console.error('Failed to load cancellation order:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadOrder()
})

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/account/orders')
  }
}

const cancellationNumber = computed(() => {
  if (!order.value) return ''
  const invoice = String(order.value.invoice_number || order.value.id || '')
  return invoice.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() || `CNCL-${order.value.id}`
})

const requestedDateFormatted = computed(() => {
  if (!order.value) return '-'
  const dateStr = order.value.updated_at || order.value.created_at
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`
})

const isRejected = computed(() => order.value?.cancel_request_status === 'rejected')
const isStep2Active = computed(() => ['approved', 'refund_processing'].includes(order.value?.cancel_request_status) || order.value?.status === 'cancelled')
const isStep3Active = computed(() => order.value?.status === 'cancelled' && order.value?.cancel_request_status === 'approved')

const step1Time = computed(() => {
  if (!order.value) return ''
  return formatTrackingDateShort(order.value.created_at || order.value.updated_at)
})

const step2Time = computed(() => {
  if (!order.value || (!isStep2Active.value && !isRejected.value)) return ''
  return formatTrackingDateShort(order.value.updated_at)
})

const step3Time = computed(() => {
  if (!order.value || !isStep3Active.value) return ''
  return formatTrackingDateShort(order.value.refund_at || order.value.updated_at)
})

const totalRefundAmount = computed(() => {
  if (!order.value) return 0
  return Number(order.value.refund_amount || order.value.grand_total || order.value.subtotal || 0)
})

// Banner Title & Descriptions
const bannerThemeClass = computed(() => {
  if (isRejected.value) return 'banner-rejected'
  if (isStep3Active.value) return 'banner-success'
  if (isStep2Active.value) return 'banner-processing'
  return 'banner-pending'
})

const bannerIcon = computed(() => {
  if (isRejected.value) return 'lucide:x-circle'
  if (isStep3Active.value) return 'lucide:check-circle-2'
  if (isStep2Active.value) return 'lucide:clock'
  return 'lucide:alert-circle'
})

const bannerTitle = computed(() => {
  if (isRejected.value) return 'Pengajuan Pembatalan Ditolak'
  if (isStep3Active.value) return 'Pengembalian Dana Selesai'
  if (isStep2Active.value) return 'Pembatalan Disetujui - Proses Refund'
  return 'Pengajuan Pembatalan Menunggu Konfirmasi'
})

const badgeStatusClass = computed(() => {
  if (isRejected.value) return 'status-badge-cancelled'
  if (isStep3Active.value) return 'status-badge-completed'
  if (isStep2Active.value) return 'status-badge-processing'
  return 'status-badge-pending'
})

const bannerDescription = computed(() => {
  if (isRejected.value) {
    return 'Pengajuan pembatalan Anda telah ditolak oleh admin toko. Pesanan akan tetap diproses dan dikirimkan.'
  }
  if (isStep3Active.value) {
    const bank = order.value?.refund_bank_name || 'Rekening Bank'
    return `Dana sebesar ${formatRupiah(totalRefundAmount.value)} telah dikembalikan ke ${bank}.`
  }
  if (isStep2Active.value) {
    return `Pembatalan disetujui. Admin sedang memverifikasi rekening ${order.value?.refund_bank_name || 'Bank'} Anda untuk pengembalian dana sebesar ${formatRupiah(totalRefundAmount.value)}.`
  }
  return 'Pengajuan pembatalan telah dikirim. Admin toko akan meninjau dan mengonfirmasi rekening pengembalian dana Anda.'
})

const canEditBank = computed(() => {
  if (!order.value) return false
  return ['pending', 'refund_processing'].includes(order.value.cancel_request_status)
})

const handleSaveBank = async () => {
  if (!order.value?.id) return
  savingBank.value = true
  try {
    await updateRefundBank(order.value.id, {
      refund_bank_name: editBankName.value,
      refund_account_number: editAccountNumber.value,
      refund_account_name: editAccountName.value,
    })
    isEditingBank.value = false
    await loadOrder()
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Gagal memperbarui rekening.')
  } finally {
    savingBank.value = false
  }
}

const formatRupiah = (val: number | string) => {
  const n = Number(val) || 0
  return `Rp ${n.toLocaleString('id-ID')}`
}

const formatTrackingDateShort = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}

const formatTrackingTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

useHead({
  title: 'Rincian Pembatalan Pesanan | Cyber Store',
})
</script>

<style scoped>
/* Page Layout matching orders.vue */
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

.btn-back-orders {
  font-size: 0.825rem;
  font-weight: 600;
}

/* Empty & Loading Box */
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

/* Main Cancellation Card Wrapper */
.cancellation-main-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cancellation-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 2px 12px rgba(0, 51, 153, 0.04);
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 1. Header Meta Bar */
.cancellation-meta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.order-meta-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  font-size: 0.85rem;
}

.order-invoice-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.invoice-label {
  color: #64748b;
  font-weight: 500;
}

.order-invoice {
  color: #003399;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.meta-dot {
  color: #cbd5e1;
}

.order-date-text {
  color: #64748b;
}

.order-invoice-link-wrap {
  color: #64748b;
}

.order-invoice-sublink {
  color: #003399;
  font-weight: 700;
  text-decoration: none;
}

.order-invoice-sublink:hover {
  text-decoration: underline;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status-badge-pending {
  background: #fef3c7;
  color: #b45309;
}

.status-badge-processing {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge-completed {
  background: #dcfce7;
  color: #15803d;
}

.status-badge-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

/* 2. Step Progress Stepper */
.cancellation-stepper-section {
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 1.5rem 2rem;
}

.stepper-track {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 2;
  min-width: 120px;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
}

.step-node.completed .step-dot {
  background: #10b981;
  border-color: #059669;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.step-node.rejected .step-dot {
  background: #ef4444;
  border-color: #dc2626;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

.dot-inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.step-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.step-node.completed .step-label {
  color: #0f172a;
}

.step-node.rejected .step-label {
  color: #b91c1c;
}

.step-time {
  font-size: 0.72rem;
  color: #94a3b8;
}

.step-connector {
  flex: 1;
  height: 3px;
  background: #e2e8f0;
  margin: -1.5rem 0.5rem 0;
  position: relative;
  z-index: 1;
  transition: background 0.3s ease;
}

.step-connector.active {
  background: #10b981;
}

.step-connector.rejected {
  background: #ef4444;
}

/* 3. Status Banner Alert Card */
.cancellation-banner-card {
  border-radius: 10px;
  padding: 1.15rem 1.35rem;
  border: 1px solid transparent;
}

.banner-success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.banner-processing {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.banner-pending {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.banner-rejected {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #991b1b;
}

.banner-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.banner-main-icon {
  flex-shrink: 0;
}

.banner-headline {
  font-size: 1.05rem;
  font-weight: 800;
  margin: 0;
}

.banner-subtext {
  font-size: 0.85rem;
  line-height: 1.5;
  margin: 0;
}

.banner-admin-notes {
  margin-top: 0.6rem;
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.75);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  display: inline-block;
}

/* 4. Products Section */
.cancellation-products-section {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 1.15rem 1.35rem;
}

.store-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1rem;
}

.store-name {
  font-size: 0.9rem;
  color: #0f172a;
  letter-spacing: 0.02em;
}

.btn-store-visit {
  font-size: 0.78rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #334155;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.15s ease;
}

.btn-store-visit:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.products-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.cancellation-product-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-thumb-img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
  background: #ffffff;
}

.product-info-wrap {
  flex: 1;
  min-width: 0;
}

.product-title-link {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  margin-bottom: 0.25rem;
}

.product-title-link:hover {
  color: #003399;
}

.product-variant-chips {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-bottom: 0.2rem;
}

.variant-pill {
  font-size: 0.68rem;
  background: #f1f5f9;
  color: #475569;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.product-qty-tag {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.product-price-column {
  text-align: right;
  flex-shrink: 0;
}

.product-price-val {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

/* 5. Summary Card (Shopee Style Table) */
.cancellation-summary-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.summary-table-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.35rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.85rem;
}

.primary-refund-row {
  background: #fafafa;
}

.table-label {
  color: #64748b;
  font-weight: 500;
}

.table-val-highlight {
  font-size: 1.35rem;
  font-weight: 900;
  color: #ea580c;
}

.table-val-account {
  text-align: right;
}

.account-bank-badge {
  color: #0f172a;
  font-size: 0.88rem;
}

.account-number-text {
  font-size: 0.78rem;
  color: #64748b;
  margin-top: 0.15rem;
}

.account-holder-name {
  color: #475569;
  font-weight: 600;
}

.table-val-link {
  color: #ea580c;
  font-weight: 700;
  text-decoration: none;
}

.table-val-link:hover {
  text-decoration: underline;
}

.accordion-toggle-wrap {
  padding: 0.65rem 1.35rem;
  text-align: center;
  background: #f8fafc;
}

.btn-accordion-toggle {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: color 0.15s ease;
}

.btn-accordion-toggle:hover {
  color: #003399;
}

.expanded-breakdown-box {
  padding: 1rem 1.35rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.breakdown-title {
  font-size: 0.825rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.6rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.825rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.breakdown-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.5rem 0;
}

.breakdown-total {
  color: #0f172a;
  font-size: 0.875rem;
}

/* Tracking History */
.tracking-history-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  padding-left: 1.25rem;
}

.history-timeline-item {
  position: relative;
}

.timeline-dot {
  position: absolute;
  left: -1.25rem;
  top: 4px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #10b981;
}

.timeline-desc {
  font-size: 0.8rem;
  color: #334155;
  line-height: 1.4;
}

.timeline-date {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

/* 6. Reason Card */
.cancellation-reason-card {
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 1.15rem 1.35rem;
}

.reason-header {
  margin-bottom: 0.4rem;
}

.reason-content-box {
  font-size: 0.88rem;
  color: #1e293b;
  font-weight: 500;
}

/* 7. Edit Bank Card */
.cancellation-edit-bank-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1.5px dashed #cbd5e1;
  padding: 1.25rem 1.35rem;
}

.card-header-flex {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.edit-bank-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.select-sm,
.input-sm {
  font-size: 0.8rem;
  padding: 0.45rem 0.75rem;
  border-radius: 6px;
}

/* 8. Bottom Actions Footer */
.cancellation-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid #f1f5f9;
  padding-top: 1.15rem;
}

/* Responsive */
@media (max-width: 640px) {
  .cancellation-card {
    padding: 1rem;
  }

  .cancellation-stepper-section {
    padding: 1rem;
  }

  .step-node {
    min-width: 80px;
  }

  .step-label {
    font-size: 0.75rem;
  }

  .step-time {
    font-size: 0.65rem;
  }

  .summary-table-row {
    padding: 0.75rem 1rem;
  }

  .table-val-highlight {
    font-size: 1.15rem;
  }
}
</style>
