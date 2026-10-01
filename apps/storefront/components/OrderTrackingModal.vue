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

            <!-- 2. Courier / Method & Destination Cards -->
            <div class="tracking-info-grid">
              <!-- Courier & Waybill Box -->
              <div class="courier-card">
                <!-- Mode Event MABA: Pengambilan Mandiri di Kampus UBSI -->
                <template v-if="isMabaOrder">
                  <div class="courier-card-header">
                    <div class="courier-icon-box" style="background: rgba(0, 74, 173, 0.08); color: #004aad;">
                      <Icon name="lucide:graduation-cap" class="w-6 h-6 text-bsi" />
                    </div>
                    <div class="courier-info">
                      <h3 class="courier-name">Pengambilan di Kampus UBSI</h3>
                      <span class="courier-service badge badge-blue">Event MABA • Bebas Ongkir</span>
                    </div>
                  </div>

                  <div class="resi-section" v-if="order.resi_number">
                    <span class="resi-label">Kode Pengambilan / Referensi:</span>
                    <div class="resi-copy-box">
                      <span class="resi-code font-mono">{{ order.resi_number }}</span>
                      <button type="button" class="btn-copy-resi" @click="copyResi(order.resi_number)"
                        :title="copied ? 'Tersalin!' : 'Salin Kode'">
                        <Icon v-if="!copied" name="lucide:copy" class="w-3.5 h-3.5" />
                        <span v-else class="text-emerald text-xs font-bold inline-flex items-center gap-1">
                          <Icon name="lucide:check" class="w-3 h-3" /> Tersalin
                        </span>
                      </button>
                    </div>
                  </div>
                  <div v-else class="resi-section empty-resi">
                    <span class="text-muted text-sm">Tunjukkan bukti invoice atau nomor pesanan ini kepada admin kampus saat
                      pengambilan di kampus.</span>
                  </div>
                </template>

                <!-- Mode Reguler: Kurir Ekspedisi -->
                <template v-else>
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
                    <button v-if="order.resi_number" type="button" class="btn btn-secondary btn-sm"
                      :disabled="isSyncing" @click="handleSyncTracking">
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
                </template>
              </div>

              <!-- Destination Card -->
              <div class="destination-card">
                <!-- Mode Event MABA: Lokasi Kampus Pengambilan UBSI -->
                <template v-if="isMabaOrder && mabaCampusInfo">
                  <div class="destination-header">
                    <span class="dest-icon" style="background: rgba(0, 74, 173, 0.1); color: #004aad;">
                      <Icon name="lucide:map-pin" class="w-4 h-4 text-bsi" />
                    </span>
                    <h4 class="dest-title">Lokasi Kampus Pengambilan</h4>
                  </div>
                  <div class="dest-content">
                    <div class="dest-receiver">
                      <strong>{{ mabaCampusInfo.receiver_name }}</strong>
                      <span class="dest-phone">({{ mabaCampusInfo.phone }})</span>
                    </div>
                    <div v-if="mabaCampusInfo.nim" style="margin-top: 0.25rem; margin-bottom: 0.35rem;">
                      <span class="badge badge-sm badge-blue" style="font-weight: 700;">NIM: {{ mabaCampusInfo.nim
                        }}</span>
                    </div>
                    <p class="dest-text" style="font-weight: 700; color: #004aad; margin-top: 0.25rem;">{{
                      mabaCampusInfo.name }}</p>
                    <p class="dest-text">{{ mabaCampusInfo.address }}</p>
                    <p class="dest-city">
                      {{ mabaCampusInfo.city }}, {{ mabaCampusInfo.province }} {{ mabaCampusInfo.postal_code }}
                    </p>
                  </div>
                </template>

                <!-- Mode Reguler: Alamat Tujuan Pengiriman -->
                <template v-else>
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
                </template>
              </div>
            </div>

            <!-- 3. Real-time Tracking Timeline History -->
            <div class="timeline-section">
              <h3 class="timeline-title">{{ timelineTitle }}</h3>

              <div v-if="trackingList.length === 0" class="empty-timeline">
                <p v-if="isMabaOrder">Belum ada pembaruan status logistik dari admin kampus UBSI.</p>
                <p v-else>Belum ada rekaman riwayat pelacakan untuk pesanan ini.</p>
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
                      <NuxtLink v-if="!item.is_reviewed"
                        :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.product_id}/reviews?order_id=${order.id}&openModal=true`"
                        class="btn-modal-review" title="Tulis penilaian dan unggah foto bukti" @click="$emit('close')">
                        <Icon name="lucide:star" class="w-3 h-3 mr-1 inline text-amber-500" />
                        <span>Nilai</span>
                      </NuxtLink>
                      <NuxtLink v-else
                        :to="`/products/${item.product?.slug || item.product?.encrypted_id || item.product_id}/reviews?order_id=${order.id}`"
                        class="btn-modal-review btn-modal-reviewed" title="Lihat ulasan dan penilaian produk"
                        @click="$emit('close')">
                        <Icon name="lucide:check-circle-2" class="w-3 h-3 mr-1 inline text-emerald-500" />
                        <span>Lihat Penilaian</span>
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
                <span v-if="isMabaOrder">Pengiriman Kampus UBSI</span>
                <span v-else>Ongkos Kirim ({{ order.expedition?.name || 'Kurir' }})</span>
                <span v-if="isMabaOrder" class="text-emerald font-semibold">GRATIS (Ditanggung Kampus)</span>
                <span v-else class="font-mono">{{ formatRupiah(order.shipping_cost) }}</span>
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
            <!-- <button v-if="isPaid(order.status)" type="button" class="btn btn-secondary btn-print-tracking-modal"
              @click="$emit('print-invoice', order)" title="Cetak Bukti Pembayaran / Invoice">
              <Icon name="lucide:printer" class="w-3.5 h-3.5 mr-1 text-bsi inline" />
              <span>Cetak Invoice</span>
            </button> -->

            <!-- Check Payment Status button if waiting payment -->
            <button v-if="order.status === 'pending_payment'" type="button"
              class="btn btn-secondary btn-check-status-modal" :disabled="isCheckingPayment"
              @click="handleCheckPaymentStatus()" title="Cek langsung status pembayaran">
              <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5 mr-1 inline"
                :class="{ 'animate-spin': isCheckingPayment }" />
              <span>{{ isCheckingPayment ? 'Mengecek...' : 'Cek Status Bayar' }}</span>
            </button>

            <!-- Pay Now button if waiting payment -->
            <button v-if="order.status === 'pending_payment'" type="button" class="btn btn-primary btn-pay-now"
              @click="$emit('pay', order)">
              <Icon name="lucide:credit-card" class="w-3.5 h-3.5 mr-1 inline" />
              <span>Bayar Sekarang</span>
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
            <p v-if="order.cancel_request_status === 'refund_processing'" role="status">Pembatalan sedang dikonfirmasi.
              Pengembalian dana mengikuti proses penyedia pembayaran.</p>
            <p v-if="order.cancel_request_status === 'approved'" role="status">Pembatalan disetujui. Lihat riwayat
              pesanan untuk
              proses pengembalian dana ke metode pembayaran asal.</p>
            <p v-if="order.cancel_request_status === 'rejected'" role="status">Pengajuan pembatalan ditolak admin.
              Pesanan
              dilanjutkan.</p>
            <div v-if="order.cancel_request_status === 'pending'" class="cancel-pending-pill">
              <span class="pulse-amber-dot"></span>
              <span>Pengajuan Pembatalan Sedang Diproses</span>
            </div>

            <!-- Cancel order button (Belum Bayar: Langsung Batalkan | Sudah Bayar: Ajukan Pembatalan max 1 hari kerja) -->
            <template v-if="isOrderCancellable(order)">
              <!-- Belum Bayar -> Langsung Batalkan Seketika -->
              <button v-if="order.status === 'pending_payment'" type="button" class="btn btn-danger-outline"
                @click="$emit('cancel', order)" title="Batalkan pesanan ini langsung seketika (belum dibayar)">
                <Icon name="lucide:x-circle" class="w-3.5 h-3.5 mr-1 inline" />
                <span>Batalkan Pesanan</span>
              </button>

              <!-- Sudah Bayar -> Ajukan Pembatalan (Batas 1 Hari Kerja) -->
              <button v-if="order.status === 'paid' && !isMabaOrder" type="button" class="btn btn-amber-outline"
                @click="$emit('cancel', order)"
                :title="`Ajukan pembatalan pesanan (Batas 1 hari kerja${getCancelTimeRemaining(order) ? ', sisa waktu: ' + getCancelTimeRemaining(order) : ''})`">
                <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 mr-1 inline" />
                <span>Ajukan Pembatalan</span>
                <span v-if="getCancelTimeRemaining(order)" class="cancel-badge-remaining">
                  {{ getCancelTimeRemaining(order) }}
                </span>
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { isWithinBusinessDay, getBusinessTimeRemaining } from '~/utils/business-day'
import { UBSI_CAMPUSES } from '~/utils/ubsi-campuses'

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

const { trackOrderWaybill, simulateCourierPod, checkPaymentStatus, fetchOrderDetail, getImageUrl, fetchStoreInfo } = useApi()
const { formatRupiah } = useFormat()

const storeInfo = ref<any>(null)
const loadStoreData = async () => {
  try {
    const data = await fetchStoreInfo()
    if (data) {
      storeInfo.value = data
    }
  } catch {
    // fallback
  }
}

const storeName = computed(() => {
  return storeInfo.value?.store_name || storeInfo.value?.name || 'BSI Cyber Store'
})

const copied = ref(false)
const isSyncing = ref(false)
const isSimulating = ref(false)
const isCheckingPayment = ref(false)

const handleCheckPaymentStatus = async (silent: boolean | unknown = false) => {
  if (!props.order) return
  const isSilent = silent === true
  if (!isSilent) isCheckingPayment.value = true
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
      if (!isSilent) {
        alert('Pembayaran berhasil diverifikasi! Pesanan Anda telah lunas.')
      }
    } else if (currentStatus === 'cancelled') {
      props.order.status = 'cancelled'
      if (!isSilent) {
        alert('Pesanan dibatalkan (Waktu pembayaran habis atau transaksi dibatalkan).')
      }
    } else if (!isSilent) {
      alert(res?.message || 'Status pembayaran berhasil dicek. Masih menunggu pembayaran.')
    }
  } catch (err: any) {
    if (!isSilent) {
      alert(err.data?.message || err.message || 'Gagal mengecek status pembayaran.')
    }
  } finally {
    if (!isSilent) isCheckingPayment.value = false
  }
}

// Auto polling while tracking modal is open so admin status updates & resi appear automatically
let autoSyncTimer: any = null

const pollOrderDetail = async () => {
  if (!props.isOpen || !props.order?.id) return
  try {
    // If pending payment, also check payment status silently
    if (props.order.status === 'pending_payment') {
      await handleCheckPaymentStatus(true)
    }

    const res = await fetchOrderDetail(props.order.id)
    if (res?.order) {
      const fresh = res.order
      const hasChanged =
        fresh.status !== props.order.status ||
        fresh.resi_number !== props.order.resi_number ||
        fresh.cancel_request_status !== props.order.cancel_request_status ||
        (fresh.trackings?.length || 0) !== (props.order.trackings?.length || 0)

      if (hasChanged) {
        Object.assign(props.order, fresh)
        emit('refresh')
      }
    }
  } catch (err) {
    // Silent fail in polling
  }
}

const startAutoSync = () => {
  stopAutoSync()
  autoSyncTimer = setInterval(pollOrderDetail, 4000)
}

const stopAutoSync = () => {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer)
    autoSyncTimer = null
  }
}

watch(
  () => [props.isOpen, props.order?.id],
  ([isOpen, orderId]) => {
    if (isOpen && orderId) {
      loadStoreData()
      pollOrderDetail()
      startAutoSync()
    } else {
      stopAutoSync()
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  stopAutoSync()
})

// Validasi apakah pesanan dapat dibatalkan:
// 1. KASUS BELUM BAYAR (pending_payment): Langsung batalkan seketika tanpa perlu pengajuan admin
// 2. KASUS SUDAH BAYAR (paid): Pengajuan pembatalan dengan batas maksimal 1 hari kerja (24 jam kerja)
const isOrderCancellable = (order: any): boolean => {
  if (!order) return false

  const nonCancellableStatuses = ['packed', 'shipped', 'arrived', 'completed', 'cancelled']
  if (nonCancellableStatuses.includes(order.status)) {
    return false
  }

  if (['pending', 'approved', 'refund_processing'].includes(order.cancel_request_status)) {
    return false
  }

  // KASUS 1: BELUM MEMBAYAR (pending_payment)
  // Langsung dapat dibatalkan kapan saja sebelum kedaluwarsa
  if (order.status === 'pending_payment') {
    return true
  }

  // KASUS 2: SUDAH MEMBAYAR (paid)
  // Aturan Khusus Event MABA: Tidak bisa dibatalkan jika mahasiswa sudah berhasil membayar
  if (order.status === 'paid') {
    if (isMabaOrder.value) {
      return false
    }
    const paidAt = order.payment?.paid_at || order.updated_at || order.created_at
    return isWithinBusinessDay(paidAt)
  }

  return false
}

// Menghitung sisa batas waktu pengajuan pembatalan (1 hari kerja untuk pesanan yang sudah dibayar)
const getCancelTimeRemaining = (order: any): string => {
  if (!order || order.status !== 'paid') return ''
  const paidAt = order.payment?.paid_at || order.updated_at || order.created_at
  return getBusinessTimeRemaining(paidAt)
}

const isMabaOrder = computed(() => {
  if (!props.order) return false
  return Boolean(
    props.order.is_event_maba ||
    props.order.campus_location ||
    (props.order.items || []).some((item: any) =>
      Boolean(
        item.is_event_maba ||
        item.product?.is_event_maba ||
        item.nim ||
        item.campus_location ||
        (item.product_name && /ormik|semot|maba/i.test(item.product_name)) ||
        (item.product?.name && /ormik|semot|maba/i.test(item.product.name))
      )
    ) ||
    (props.order.note && /pengambilan kampus ubsi|event maba|ormik|semot/i.test(String(props.order.note))) ||
    (props.order.expedition?.name && /maba|kampus/i.test(String(props.order.expedition.name))) ||
    (props.order.trackings && props.order.trackings.some((t: any) => /event maba|admin kampus|panitia|kampus ubsi/i.test(String(t.description || ''))))
  )
})

const timelineTitle = computed(() => {
  return isMabaOrder.value ? 'Status & Riwayat Distribusi Kampus' : 'Riwayat Perjalanan Paket'
})

const mabaCampusInfo = computed(() => {
  if (!props.order) return null

  // 1. Cari dari campus_location langsung di item atau order
  const explicitCampusName =
    props.order.campus_location ||
    (props.order.items || []).find((i: any) => i.campus_location)?.campus_location

  // 2. Cari dari note string: [Pengambilan Kampus UBSI: <nama_kampus>]
  const noteMatch = props.order.note?.match(/\[Pengambilan Kampus UBSI:\s*([^\]]+)\]/i)?.[1]?.trim()

  const targetCampusName = explicitCampusName || noteMatch || props.order.address?.city || ''

  // 3. Cocokkan dengan database UBSI_CAMPUSES
  const matched = UBSI_CAMPUSES.find(c =>
    targetCampusName && (
      c.name.toLowerCase().includes(targetCampusName.toLowerCase()) ||
      targetCampusName.toLowerCase().includes(c.name.toLowerCase()) ||
      c.city.toLowerCase().includes(targetCampusName.toLowerCase())
    )
  )

  const defaultCampus = UBSI_CAMPUSES[0] || {
    name: 'UBSI Kampus Kramat 98 (Pusat)',
    address: 'Jl. Kramat Raya No. 98, Senen',
    city: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postal_code: '10420',
  }
  const resolved = matched || defaultCampus

  // Ambil NIM jika ada di item
  const nim = (props.order.items || []).find((i: any) => i.nim)?.nim || null

  return {
    name: matched?.name || targetCampusName || defaultCampus.name,
    address: resolved.address,
    city: resolved.city,
    province: resolved.province,
    postal_code: resolved.postal_code || '10420',
    receiver_name: props.order.address?.receiver_name || props.order.address?.recipient_name || props.order.user?.name || 'Mahasiswa Baru UBSI',
    phone: props.order.address?.phone || props.order.user?.phone || '-',
    nim,
  }
})

const regularSteps = [
  { key: 'pending_payment', label: 'Menunggu Bayar', desc: 'Transaksi dibuat' },
  { key: 'paid', label: 'Dibayar', desc: 'Dana diverifikasi' },
  { key: 'packed', label: 'Dikemas', desc: 'Disiapkan toko' },
  { key: 'shipped', label: 'Dikirim', desc: 'Dalam kurir' },
  { key: 'completed', label: 'Selesai', desc: 'Paket diterima' },
]

const mabaSteps = [
  { key: 'pending_payment', label: 'Menunggu Bayar', desc: 'Tagihan dibuat' },
  { key: 'paid', label: 'Sudah Bayar', desc: 'Pesanan dibuat' },
  { key: 'packed', label: 'Pesanan disiapkan', desc: 'Pengemasan atribut' },
  { key: 'shipped', label: 'Distribusi Kampus', desc: 'Menuju kampus tujuan' },
  { key: 'completed', label: 'Siap Diambil / Selesai', desc: 'Titik temu kampus' },
]

const steps = computed(() => {
  return isMabaOrder.value ? mabaSteps : regularSteps
})

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
  if (Array.isArray(props.order?.trackings) && props.order.trackings.length > 0) {
    return [...props.order.trackings].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }

  // Fallback riwayat pelacakan dinamis jika database belum memiliki baris order_trackings kustom
  if (!props.order) return []

  const createdTime = props.order.created_at || new Date().toISOString()
  const updatedTime = props.order.updated_at || createdTime
  const items: any[] = []

  if (props.order.status === 'completed') {
    items.push({
      status: 'completed',
      description: isMabaOrder.value
        ? 'Perlengkapan Event MABA telah resmi diserahkan dan diterima oleh Mahasiswa Baru.'
        : 'Pesanan telah selesai dan diterima (POD).',
      location: isMabaOrder.value ? (mabaCampusInfo.value?.name || 'Kampus UBSI') : (props.order.address?.city || 'Tujuan'),
      created_at: updatedTime,
    })
  }
  if (['shipped', 'arrived', 'completed'].includes(props.order.status)) {
    items.push({
      status: 'shipped',
      description: isMabaOrder.value
        ? `Perlengkapan Event MABA dalam proses distribusi menuju ${mabaCampusInfo.value?.name || 'Kampus UBSI tujuan'}.${props.order.resi_number ? ` (Ref: ${props.order.resi_number})` : ''}`
        : `Pesanan sedang dalam proses pengiriman via ${props.order.expedition?.name || 'kurir'}.`,
      location: isMabaOrder.value ? 'Distribusi Logistik Kampus' : 'Transit Hub',
      created_at: updatedTime,
    })
  }
  if (['packed', 'shipped', 'arrived', 'completed'].includes(props.order.status)) {
    items.push({
      status: 'packed',
      description: isMabaOrder.value
        ? 'Perlengkapan Event MABA sedang disiapkan dan dikemas.'
        : 'Pesanan sedang diproses dan dikemas.',
      location: isMabaOrder.value ? storeName.value : `Gudang ${storeName.value}`,
      created_at: updatedTime,
    })
  }
  if (['paid', 'packed', 'shipped', 'arrived', 'completed'].includes(props.order.status)) {
    items.push({
      status: 'paid',
      description: 'Pembayaran berhasil diverifikasi secara resmi oleh sistem.',
      location: 'Sistem',
      created_at: props.order.payment?.paid_at || createdTime,
    })
  }
  items.push({
    status: 'pending_payment',
    description: isMabaOrder.value
      ? 'Pesanan atribut Event MABA dibuat dan menunggu pembayaran.'
      : 'Pesanan dibuat dan menunggu pembayaran.',
    location: 'Sistem',
    created_at: createdTime,
  })

  return items
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

.btn-modal-reviewed {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #475569;
}

.btn-modal-reviewed:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #003399;
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

.btn-amber-outline {
  background: transparent;
  color: #b45309;
  border: 1px solid #fcd34d;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
}

.btn-amber-outline:hover {
  background: #fffbeb;
  border-color: #f59e0b;
  color: #92400e;
}

.cancel-badge-remaining {
  font-size: 0.7rem;
  background: #fef3c7;
  color: #92400e;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 0.35rem;
  font-weight: 800;
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

.maba-paid-lock-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #004aad;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 74, 173, 0.06);
}
</style>
