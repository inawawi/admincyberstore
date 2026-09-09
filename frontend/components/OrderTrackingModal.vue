<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && order" class="tracking-modal-backdrop" @click.self="$emit('close')">
        <div class="tracking-modal-container" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div class="tracking-modal-header">
            <div class="modal-title-group">
              <div class="modal-badge-row">
                <span class="tracking-badge">Lacak Pengiriman</span>
                <span :class="['badge', getStatusBadgeClass(order.status)]">
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>
              <div class="modal-inv-row">
                <h2 class="modal-invoice font-mono">{{ order.invoice_number || `ORD-#${order.id}` }}</h2>
                <button v-if="isPaid(order.status)" type="button" class="btn-header-print"
                  @click="$emit('print-invoice', order)" title="Cetak Bukti Pembayaran / Invoice">
                  <Icon name="lucide:printer" class="w-3.5 h-3.5" />
                  <span>Cetak Invoice</span>
                </button>
              </div>
              <span class="modal-timestamp">Dibuat pada {{ formatDateTime(order.created_at) }}</span>
            </div>
            <button class="modal-close-btn" @click="$emit('close')" aria-label="Tutup Modal">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Modal Scrollable Body -->
          <div class="tracking-modal-body">
            <!-- 1. Visual Progress Stepper -->
            <div class="stepper-card">
              <div class="stepper-wrapper">
                <div v-for="(step, index) in steps" :key="step.key" :class="['stepper-item', {
                  completed: isStepCompleted(step.key),
                  active: isStepActive(step.key),
                  cancelled: order.status === 'cancelled'
                }]">
                  <div class="stepper-line" v-if="index > 0"></div>
                  <div class="stepper-circle">
                    <Icon v-if="isStepCompleted(step.key) && order.status !== 'cancelled'" name="lucide:check"
                      class="w-3.5 h-3.5" />
                    <Icon v-else-if="order.status === 'cancelled' && step.key === 'cancelled'" name="lucide:x"
                      class="w-3.5 h-3.5" />
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div class="stepper-label-box">
                    <span class="stepper-title">{{ step.label }}</span>
                    <span class="stepper-desc">{{ step.desc }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Courier & Resi Card -->
            <div class="tracking-info-grid">
              <!-- Courier & Waybill Box -->
              <div class="courier-card">
                <div class="courier-card-header">
                  <div class="courier-icon-box">
                    <Icon name="lucide:truck" class="w-6 h-6 text-bsi" />
                  </div>
                  <div class="courier-info">
                    <h3 class="courier-name">{{ order.expedition?.name || 'Kurir Ekspedisi' }}</h3>
                    <span class="courier-service badge badge-cyan">Layanan {{ order.expedition?.service || 'REG'
                    }}</span>
                  </div>
                </div>

                <div class="resi-section" v-if="order.resi_number">
                  <span class="resi-label">Nomor Resi / Waybill:</span>
                  <div class="resi-copy-box">
                    <span class="resi-code font-mono">{{ order.resi_number }}</span>
                    <button type="button" class="btn-copy-resi" @click="copyResi(order.resi_number)"
                      :title="copied ? 'Tersalin!' : 'Salin Nomor Resi'">
                      <Icon v-if="!copied" name="lucide:copy" class="w-3.5 h-3.5" />
                      <span v-else class="text-emerald text-xs font-bold inline-flex items-center gap-1">
                        <Icon name="lucide:check" class="w-3 h-3" /> Tersalin
                      </span>
                    </button>
                  </div>
                </div>
                <div v-else class="resi-section empty-resi">
                  <span class="text-muted text-sm">Nomor resi akan muncul setelah paket diserahkan ke kurir.</span>
                </div>

                <!-- Sync & Test Courier Actions -->
                <div class="courier-action-btns">
                  <button v-if="order.resi_number" type="button" class="btn btn-secondary btn-sm" :disabled="isSyncing"
                    @click="handleSyncTracking">
                    <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isSyncing }" />
                    <span v-if="isSyncing">Memperbarui...</span>
                    <span v-else>Perbarui dari Ekspedisi</span>
                  </button>

                  <!-- Simulation button for demonstration & review -->
                  <button v-if="order.status === 'shipped' || order.status === 'packed'" type="button"
                    class="btn btn-emerald btn-sm" :disabled="isSimulating" @click="handleSimulatePod"
                    title="Simulasi kurir mengantar paket sampai ke alamat tujuan">
                    <Icon name="lucide:zap" class="w-3.5 h-3.5 mr-1" />
                    <span v-if="isSimulating">Memproses...</span>
                    <span v-else>Simulasi Paket Tiba (Auto-POD)</span>
                  </button>
                </div>
              </div>

              <!-- Shipping Address Box -->
              <div class="destination-card">
                <div class="destination-header">
                  <span class="dest-icon">
                    <Icon name="lucide:map-pin" class="w-4 h-4 text-bsi" />
                  </span>
                  <h4 class="dest-title">Alamat Tujuan Pengiriman</h4>
                </div>
                <div class="dest-content" v-if="order.address">
                  <div class="dest-receiver">
                    <strong>{{ order.address.receiver_name || order.address.recipient_name }}</strong>
                    <span class="dest-phone">({{ order.address.phone }})</span>
                  </div>
                  <p class="dest-text">{{ order.address.address }}</p>
                  <p class="dest-city">
                    {{ order.address.city }}, {{ order.address.province }} {{ order.address.postal_code }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 3. Real-time Tracking Timeline History -->
            <div class="timeline-section">
              <h3 class="timeline-title">Riwayat Perjalanan Paket</h3>

              <div v-if="trackingList.length === 0" class="empty-timeline">
                <p>Belum ada rekaman riwayat pelacakan untuk pesanan ini.</p>
              </div>

              <div v-else class="tracking-timeline">
                <div v-for="(track, idx) in trackingList" :key="track.id || idx"
                  :class="['timeline-item', { 'latest-item': idx === 0 }]">
                  <div class="timeline-dot-col">
                    <div class="timeline-dot">
                      <span v-if="idx === 0" class="pulse-ring"></span>
                    </div>
                    <div class="timeline-trail" v-if="idx < trackingList.length - 1"></div>
                  </div>

                  <div class="timeline-content-card">
                    <div class="timeline-top-row">
                      <span class="timeline-status-badge badge badge-sm" :class="getStatusBadgeClass(track.status)">
                        {{ getStatusLabel(track.status) }}
                      </span>
                      <span class="timeline-date">{{ formatDateTime(track.created_at) }}</span>
                    </div>

                    <p class="timeline-desc">{{ track.description }}</p>

                    <div class="timeline-meta-row" v-if="track.location">
                      <span class="timeline-location">
                        <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-muted mr-1 inline" />
                        <span>{{ track.location }}</span>
                      </span>
                    </div>

                    <!-- Proof of Delivery Photo if exists -->
                    <div class="proof-photo-wrapper" v-if="track.proof_photo">
                      <span class="proof-label">Bukti Pengiriman (POD):</span>
                      <img :src="getImageUrl(track.proof_photo)" alt="Bukti Pengiriman" class="proof-img"
                        @click="openLightbox(getImageUrl(track.proof_photo))" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. Ordered Items Summary -->
            <div class="items-summary-section">
              <h3 class="section-heading">Produk yang Dipesan ({{ (order.items || []).length }} Item)</h3>
              <div class="items-compact-list">
                <div v-for="item in (order.items || [])" :key="item.id" class="item-compact-row">
                  <img :src="getImageUrl(item.product?.main_photo)" :alt="item.product_name || item.product?.name"
                    class="item-thumb" />
                  <div class="item-info">
                    <h4 class="item-name">{{ item.product_name || item.product?.name }}</h4>
                    <div class="item-badges">
                      <span v-if="item.size" class="variant-tag">Ukuran: {{ item.size }}</span>
                      <span v-if="item.color" class="variant-tag">Warna: {{ item.color }}</span>
                      <span class="qty-tag">{{ item.quantity }} x {{ formatRupiah(item.price) }}</span>
                    </div>
                  </div>
                  <div class="item-subtotal-col">
                    <div class="item-subtotal font-mono">
                      {{ formatRupiah(item.total || (item.price * item.quantity)) }}
                    </div>
                    <!-- Action Buttons: Tulis Penilaian & Lihat Produk (jika status arrived / completed) -->
                    <div v-if="order.status === 'arrived' || order.status === 'completed'" class="modal-item-actions">
                      <NuxtLink :to="`/products/${item.product_id}/reviews?order_id=${order.id}&openModal=true`"
                        class="btn-modal-review" title="Tulis penilaian dan unggah foto bukti" @click="$emit('close')">
                        <Icon name="lucide:message-square-plus" class="w-3 h-3 mr-1 inline" />
                        <span>Nilai</span>
                      </NuxtLink>
                      <NuxtLink :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.product_id}`"
                        class="btn-modal-view" title="Lihat halaman produk" @click="$emit('close')">
                        <Icon name="lucide:external-link" class="w-3 h-3 mr-1 inline" />
                        <span>Lihat</span>
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Payment Details Card -->
            <div class="payment-summary-card">
              <div class="calc-row">
                <span>Subtotal Produk</span>
                <span class="font-mono">{{ formatRupiah(order.subtotal) }}</span>
              </div>
              <div class="calc-row">
                <span>Ongkos Kirim ({{ order.expedition?.name || 'Kurir' }})</span>
                <span class="font-mono">{{ formatRupiah(order.shipping_cost) }}</span>
              </div>
              <div class="calc-row"
                v-if="Number(order.grand_total) - Number(order.subtotal) - Number(order.shipping_cost) > 0">
                <span>Biaya Layanan</span>
                <span class="font-mono">
                  {{ formatRupiah(Number(order.grand_total) - Number(order.subtotal) - Number(order.shipping_cost)) }}
                </span>
              </div>
              <div class="calc-divider"></div>
              <div class="calc-row total-row">
                <span>Total Pembayaran</span>
                <strong class="grand-total-text font-display">{{ formatRupiah(order.grand_total) }}</strong>
              </div>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="tracking-modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">
              Tutup
            </button>

            <!-- Print Invoice button if paid -->
            <button v-if="isPaid(order.status)" type="button" class="btn btn-secondary btn-print-tracking-modal"
              @click="$emit('print-invoice', order)" title="Cetak Bukti Pembayaran / Invoice">
              <Icon name="lucide:printer" class="w-3.5 h-3.5 mr-1 text-bsi inline" />
              <span>Cetak Invoice</span>
            </button>

            <!-- Check Payment Status button if waiting payment -->
            <button v-if="order.status === 'pending_payment'" type="button"
              class="btn btn-secondary btn-check-status-modal" :disabled="isCheckingPayment"
              @click="handleCheckPaymentStatus" title="Cek langsung status pembayaran dari Midtrans">
              <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 mr-1 inline"
                :class="{ 'animate-spin': isCheckingPayment }" />
              <span>{{ isCheckingPayment ? 'Mengecek...' : 'Cek Status Bayar' }}</span>
            </button>

            <!-- Pay Now with Midtrans button if waiting payment -->
            <button v-if="order.status === 'pending_payment'" type="button" class="btn btn-primary btn-pay-now"
              @click="$emit('pay', order)">
              <Icon name="lucide:credit-card" class="w-3.5 h-3.5 mr-1 inline" />
              <span>Bayar Sekarang (Midtrans)</span>
            </button>

            <!-- Confirm Order Arrival button if arrived -->
            <button v-if="order.status === 'arrived'" type="button"
              class="btn btn-emerald inline-flex items-center gap-1" @click="$emit('complete', order)">
              <Icon name="lucide:check-circle" class="w-4 h-4" />
              <span>Konfirmasi Pesanan Diterima</span>
            </button>

            <!-- Review button in tracking modal footer if arrived or completed -->
            <!-- <NuxtLink
              v-if="(order.status === 'arrived' || order.status === 'completed') && (order.items || []).length > 0"
              :to="`/products/${order.items[0].product_id}/reviews?order_id=${order.id}&openModal=true`"
              class="btn btn-primary inline-flex items-center gap-1.5"
              @click="$emit('close')"
            >
              <Icon name="lucide:message-square-plus" class="w-4 h-4" />
              <span>Tulis Penilaian & Bukti Foto</span>
            </NuxtLink> -->

            <!-- Status Pengajuan Pembatalan (Jika sedang diproses Admin) -->
            <div v-if="order.cancel_request_status === 'pending'" class="cancel-pending-pill">
              <span class="pulse-amber-dot"></span>
              <span>Pengajuan Pembatalan Sedang Diproses</span>
            </div>

            <!-- Cancel order button (Berlaku hanya 1 hari & sebelum toko memperbarui status menjadi diproses) -->
            <button v-else-if="isOrderCancellable(order)" type="button" class="btn btn-danger-outline"
              @click="$emit('cancel', order)"
              :title="`Dapat dibatalkan dalam 1 hari sejak pemesanan (Sisa waktu: ${getCancelTimeRemaining(order.created_at)})`">
              <Icon name="lucide:x-circle" class="w-3.5 h-3.5 mr-1 inline" />
              <span>Batalkan Pesanan</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'

const props = defineProps<{
  isOpen: boolean
  order: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
  (e: 'pay', order: any): void
  (e: 'cancel', order: any): void
  (e: 'complete', order: any): void
  (e: 'print-invoice', order: any): void
}>()

const isPaid = (status?: string) => {
  if (!status) return false
  return ['paid', 'packed', 'shipped', 'arrived', 'completed'].includes(status)
}

const { trackOrderWaybill, simulateCourierPod, checkPaymentStatus, fetchOrderDetail, getImageUrl } = useApi()
const { formatRupiah } = useFormat()

const copied = ref(false)
const isSyncing = ref(false)
const isSimulating = ref(false)
const isCheckingPayment = ref(false)

const handleCheckPaymentStatus = async () => {
  if (!props.order) return
  isCheckingPayment.value = true
  try {
    let res: any = null
    if (props.order.payment?.id) {
      res = await checkPaymentStatus(props.order.payment.id)
    } else {
      res = await fetchOrderDetail(props.order.id)
    }
    emit('refresh')
    if (res?.order) {
      Object.assign(props.order, res.order)
    }
    const currentStatus = res?.order?.status || res?.payment?.status
    if (currentStatus === 'paid') {
      props.order.status = 'paid'
      alert('Pembayaran berhasil diverifikasi! Pesanan Anda telah lunas.')
    } else if (currentStatus === 'cancelled') {
      props.order.status = 'cancelled'
      alert('Pesanan dibatalkan (Waktu pembayaran habis atau transaksi dibatalkan).')
    } else {
      alert(res?.message || 'Status pembayaran berhasil dicek. Masih menunggu pembayaran.')
    }
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal mengecek status pembayaran ke Midtrans.')
  } finally {
    isCheckingPayment.value = false
  }
}

// Validasi apakah pesanan dapat dibatalkan:
// 1. Toko BELUM memperbarui status menjadi diproses (packed, shipped, arrived, completed, cancelled)
// 2. Berlaku hanya 1 hari (24 jam) sejak pesanan dibuat
const isOrderCancellable = (order: any): boolean => {
  if (!order) return false

  const nonCancellableStatuses = ['packed', 'shipped', 'arrived', 'completed', 'cancelled']
  if (nonCancellableStatuses.includes(order.status)) {
    return false
  }

  if (order.cancel_request_status === 'pending' || order.cancel_request_status === 'approved') {
    return false
  }

  if (!order.created_at) return false
  const orderTime = new Date(order.created_at).getTime()
  if (isNaN(orderTime)) return false

  const oneDayInMs = 24 * 60 * 60 * 1000
  const elapsed = Date.now() - orderTime

  if (elapsed > oneDayInMs || elapsed < 0) {
    return false
  }

  return true
}

const getCancelTimeRemaining = (createdAt: string): string => {
  if (!createdAt) return ''
  const orderTime = new Date(createdAt).getTime()
  if (isNaN(orderTime)) return ''

  const oneDayInMs = 24 * 60 * 60 * 1000
  const remaining = (orderTime + oneDayInMs) - Date.now()

  if (remaining <= 0) return ''

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}j ${minutes}m`
  }
  return `${minutes}m`
}

const steps = [
  { key: 'pending_payment', label: 'Menunggu Bayar', desc: 'Transaksi dibuat' },
  { key: 'paid', label: 'Dibayar', desc: 'Dana diverifikasi' },
  { key: 'packed', label: 'Dikemas', desc: 'Disiapkan toko' },
  { key: 'shipped', label: 'Dikirim', desc: 'Dalam kurir' },
  { key: 'completed', label: 'Selesai', desc: 'Paket diterima' },
]

const statusOrder = ['pending_payment', 'paid', 'packed', 'shipped', 'arrived', 'completed']

const isStepCompleted = (stepKey: string) => {
  if (!props.order) return false
  if (props.order.status === 'cancelled') return false
  const currentIdx = statusOrder.indexOf(props.order.status)
  const stepIdx = statusOrder.indexOf(stepKey)
  return currentIdx > stepIdx
}

const isStepActive = (stepKey: string) => {
  if (!props.order) return false
  if (stepKey === 'completed' && props.order.status === 'arrived') return true
  return props.order.status === stepKey
}

const trackingList = computed(() => {
  if (!props.order?.trackings) return []
  // Sort descending by created_at or id
  return [...props.order.trackings].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

const copyResi = (code: string) => {
  if (!code) return
  navigator.clipboard.writeText(code)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
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

const handleSyncTracking = async () => {
  if (!props.order?.id) return
  isSyncing.value = true
  try {
    const res = await trackOrderWaybill(props.order.id)
    if (res.order) {
      Object.assign(props.order, res.order)
    }
    emit('refresh')
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal memperbarui pelacakan resi.')
  } finally {
    isSyncing.value = false
  }
}

const handleSimulatePod = async () => {
  if (!props.order?.id) return
  isSimulating.value = true
  try {
    const res = await simulateCourierPod(props.order.id)
    if (res.order) {
      Object.assign(props.order, res.order)
    }
    emit('refresh')
    alert('Simulasi kurir berhasil! Status pesanan kini telah berubah menjadi Pesanan Tiba.')
  } catch (err: any) {
    alert(err.data?.message || err.message || 'Gagal melakukan simulasi kurir.')
  } finally {
    isSimulating.value = false
  }
}

const openLightbox = (url: string) => {
  window.open(url, '_blank')
}
</script>

<style scoped>
/* Modal Backdrop & Transition */
.tracking-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.tracking-modal-container {
  background: #ffffff;
  width: 100%;
  max-width: 760px;
  max-height: 90vh;
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 25px 50px -12px rgba(0, 51, 153, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

/* Header */
.tracking-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background: #f8fafc;
}

.modal-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.modal-badge-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tracking-badge {
  font-size: 0.725rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #003399;
  background: #eff6ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.modal-invoice {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-inv-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-header-print {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  background: #f0f7ff;
  border: 1px solid #bae6fd;
  color: #004aad;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-header-print:hover {
  background: #e0f2fe;
  color: #003399;
}

.btn-print-tracking-modal {
  background: #f8fafc;
  color: #003399;
  border: 1px solid #cbd5e1;
  font-weight: 600;
}

.btn-print-tracking-modal:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #002266;
}

.modal-timestamp {
  font-size: 0.775rem;
  color: #64748b;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.modal-close-btn svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

/* Scrollable Body */
.tracking-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Stepper Progress Bar */
.stepper-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md, 12px);
  padding: 1.25rem 1rem;
}

.stepper-wrapper {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.stepper-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  text-align: center;
}

.stepper-line {
  position: absolute;
  top: 16px;
  right: 50%;
  left: -50%;
  height: 3px;
  background: #e2e8f0;
  z-index: 1;
  transition: background 0.3s ease;
}

.stepper-item.completed .stepper-line,
.stepper-item.active .stepper-line {
  background: #003399;
}

.stepper-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid #cbd5e1;
  color: #64748b;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.stepper-item.completed .stepper-circle {
  background: #003399;
  border-color: #003399;
  color: #ffffff;
}

.stepper-item.active .stepper-circle {
  background: #eff6ff;
  border-color: #003399;
  color: #003399;
  box-shadow: 0 0 0 4px rgba(0, 51, 153, 0.15);
}

.stepper-item.cancelled .stepper-circle {
  background: #fef2f2;
  border-color: #ef4444;
  color: #ef4444;
}

.stepper-label-box {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
}

.stepper-title {
  font-size: 0.775rem;
  font-weight: 700;
  color: #0f172a;
}

.stepper-desc {
  font-size: 0.7rem;
  color: #64748b;
}

/* Tracking Info Grid */
.tracking-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.courier-card,
.destination-card {
  padding: 1.25rem;
  border-radius: var(--radius-md, 12px);
  border: 1px solid #e2e8f0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.courier-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.courier-icon-box {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm, 8px);
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
}

.courier-name {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.resi-section {
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
}

.resi-label {
  font-size: 0.75rem;
  color: #64748b;
  display: block;
  margin-bottom: 0.25rem;
}

.resi-copy-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.resi-code {
  font-size: 0.95rem;
  font-weight: 800;
  color: #003399;
}

.btn-copy-resi {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
}

.btn-copy-resi:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.btn-copy-resi svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.courier-action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.destination-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dest-icon {
  font-size: 1.05rem;
  line-height: 1;
  flex-shrink: 0;
}

.dest-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.dest-content {
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
}

.dest-receiver {
  margin-bottom: 0.35rem;
}

/* Timeline */
.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.timeline-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
}

.tracking-timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 1.25rem;
  position: relative;
}

.timeline-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #cbd5e1;
  position: relative;
  margin-top: 4px;
  transition: all 0.2s ease;
}

.timeline-item.latest-item .timeline-dot {
  background: #003399;
  box-shadow: 0 0 0 3px rgba(0, 51, 153, 0.25);
}

.pulse-ring {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid #003399;
  animation: pulse 2s infinite ease-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }

  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.timeline-trail {
  flex: 1;
  width: 2px;
  background: #e2e8f0;
  margin: 4px 0;
  min-height: 48px;
}

.timeline-content-card {
  flex: 1;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  padding: 0.85rem 1rem;
  border-radius: 8px;
  margin-bottom: 0.85rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.timeline-item.latest-item .timeline-content-card {
  border-color: #bfdbfe;
  background: #f8fafc;
}

.timeline-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.timeline-date {
  font-size: 0.75rem;
  color: #64748b;
}

.timeline-desc {
  font-size: 0.85rem;
  font-weight: 500;
  color: #0f172a;
  line-height: 1.45;
}

.timeline-meta-row {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
}

.timeline-location {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.timeline-location svg {
  width: 13px !important;
  height: 13px !important;
  max-width: 13px !important;
  max-height: 13px !important;
  color: #94a3b8;
  flex-shrink: 0;
}

.proof-photo-wrapper {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.proof-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #003399;
}

.proof-img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.proof-img:hover {
  transform: scale(1.05);
}

/* Ordered Items Compact */
.items-summary-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-heading {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
}

.items-compact-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-compact-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}

.item-thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  object-fit: cover;
  background: #e2e8f0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.item-name {
  font-size: 0.825rem;
  font-weight: 700;
  color: #0f172a;
}

.item-badges {
  display: flex;
  gap: 0.4rem;
  font-size: 0.725rem;
}

.variant-tag {
  background: #e2e8f0;
  color: #475569;
  padding: 1px 6px;
  border-radius: 4px;
}

.qty-tag {
  color: #64748b;
}

.item-subtotal {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.item-subtotal-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.modal-item-actions {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-modal-review {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 3px 8px;
  background: #eff6ff;
  border: 1px solid #003399;
  color: #003399;
  border-radius: 4px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-modal-review:hover {
  background: #003399;
  color: #ffffff;
}

.btn-modal-view {
  font-size: 0.725rem;
  font-weight: 600;
  padding: 3px 8px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  border-radius: 4px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-modal-view:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

/* Payment Summary */
.payment-summary-card {
  padding: 1rem 1.25rem;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.825rem;
  color: #475569;
}

.calc-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0.35rem 0;
}

.total-row {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.grand-total-text {
  font-size: 1.2rem;
  color: #003399;
}

/* Footer Actions */
.tracking-modal-footer {
  padding: 0.85rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
}

.tracking-modal-footer .btn {
  padding: 0.55rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.modal-action-icon,
.tracking-modal-footer .btn svg {
  width: 14px !important;
  height: 14px !important;
  max-width: 14px !important;
  max-height: 14px !important;
  flex-shrink: 0;
  display: inline-block;
}

.btn-check-status-modal {
  background: #f8fafc;
  color: #003399;
  border: 1px solid #cbd5e1;
  font-weight: 600;
}

.btn-check-status-modal:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #002266;
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

.btn-danger-outline {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fca5a5;
  font-weight: 700;
}

.btn-danger-outline:hover {
  background: #fef2f2;
}

.cancel-timer-badge-modal {
  font-size: 0.725rem;
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: 0.35rem;
  font-family: monospace;
}

.cancel-pending-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #b45309;
  font-size: 0.825rem;
  font-weight: 700;
}

.pulse-amber-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}

/* Modal Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tracking-modal-container {
    max-width: 100%;
    border-radius: var(--radius-lg, 20px) var(--radius-lg, 20px) 0 0;
    max-height: 92vh;
  }

  .tracking-modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .modal-inv-row {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .stepper-wrapper {
    gap: 0;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .stepper-title {
    font-size: 0.7rem;
  }
}

@media (max-width: 640px) {
  .tracking-info-grid {
    grid-template-columns: 1fr;
  }

  .stepper-desc {
    display: none;
  }

  .tracking-modal-header {
    padding: 1rem;
  }

  .tracking-modal-body {
    padding: 1rem;
  }

  .tracking-modal-footer {
    flex-direction: column-reverse;
    width: 100%;
  }

  .tracking-modal-footer button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .tracking-modal-header {
    padding: 0.85rem 0.9rem;
  }

  .tracking-modal-body {
    padding: 0.85rem 0.9rem;
    gap: 0.85rem;
  }

  .tracking-modal-footer {
    padding: 0.85rem 0.9rem;
  }

  .modal-invoice {
    font-size: 0.875rem;
  }

  .modal-timestamp {
    font-size: 0.725rem;
  }

  .stepper-card {
    padding: 0.85rem;
  }

  .courier-card,
  .destination-card {
    padding: 0.85rem;
  }

  .tracking-event-card {
    padding: 0.85rem;
  }

  .tracking-modal-footer button {
    font-size: 0.825rem;
    padding: 0.55rem 0.85rem;
  }

  .order-items-section {
    padding: 0.85rem;
  }
}

@media (max-width: 375px) {
  .tracking-modal-header {
    padding: 0.75rem;
  }

  .tracking-modal-body {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .modal-badge-row {
    gap: 0.4rem;
  }

  .tracking-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
  }

  .courier-action-btns button {
    font-size: 0.75rem;
    padding: 0.4rem 0.65rem;
  }
}
</style>
