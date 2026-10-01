<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && order" class="cancel-modal-backdrop" @click.self="$emit('close')">
        <div class="cancel-modal-card" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div :class="['cancel-modal-header', isPaid ? 'header-paid' : 'header-unpaid']">
            <div :class="['modal-icon-circle', isPaid ? 'circle-amber' : 'circle-rose']">
              <Icon :name="isPaid ? 'lucide:alert-triangle' : 'lucide:x-circle'" class="w-6 h-6" />
            </div>
            <div class="header-titles">
              <h3 class="modal-title">{{ isPaid ? 'Ajukan Pembatalan' : 'Batalkan Pesanan' }}</h3>
              <div class="subtitle-row">
                <span v-if="isPaid" class="badge-status-pill badge-paid">Sudah Dibayar</span>
                <span v-else class="badge-status-pill badge-unpaid">Belum Dibayar</span>
              </div>
            </div>
            <button class="btn-close" @click="$emit('close')" aria-label="Tutup">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitCancel" class="cancel-form">
            <div class="cancel-body">
              <!-- Kasus Khusus: Event MABA Sudah Bayar -> Tidak Bisa Batal -->
              <div v-if="isPaid && isEventMaba" class="cancel-notice-box notice-maba-blocked">
                <div class="notice-icon">
                  <Icon name="lucide:shield-alert" class="w-5 h-5 text-rose-600" />
                </div>
                <div class="notice-text">
                  <strong class="notice-title text-rose-700">Tidak Dapat Dibatalkan (Event MABA)</strong>
                  <p class="notice-desc text-rose-600">
                    Pesanan ini berisi produk <strong>Event MABA (Perlengkapan Mahasiswa Baru)</strong> dan pembayaran
                    telah berhasil diverifikasi. Sesuai ketentuan admin kampus UBSI, pesanan Event MABA yang sudah lunas
                    <strong>tidak dapat dibatalkan</strong>.
                  </p>
                </div>
              </div>

              <!-- Kasus 1: BELUM DIBAYAR -> Informasi Pembatalan Langsung -->
              <div v-else-if="isUnpaid" class="cancel-notice-box notice-unpaid">
                <div class="notice-icon">
                  <Icon name="lucide:info" class="w-5 h-5 text-rose-600" />
                </div>
                <div class="notice-text">
                  <strong class="notice-title">Pembatalan Langsung</strong>
                  <p class="notice-desc">
                    Pesanan ini <strong>belum dibayar</strong>. Pembatalan akan <strong>langsung diproses
                      seketika</strong> tanpa perlu menunggu persetujuan admin.
                  </p>
                </div>
              </div>

              <!-- Kasus 2: SUDAH DIBAYAR (Reguler) -> Icon (i) Saja -->
              <div v-else class="cancel-info-toggle-wrapper">
                <button type="button" @click="showNoticeInfo = !showNoticeInfo" class="btn-info-icon-trigger"
                  :class="{ active: showNoticeInfo }"
                  title="Klik untuk melihat ketentuan & informasi pengajuan pembatalan">
                  <div class="info-circle-icon">
                    <Icon name="lucide:info" class="w-4 h-4 text-amber-600" />
                  </div>
                  <span class="info-trigger-label">
                    {{ showNoticeInfo ? 'Tutup Informasi Ketentuan' : 'Ketentuan & Info Pengajuan' }}
                  </span>
                  <div v-if="remainingTimeText" class="info-timer-mini">
                    <Icon name="lucide:timer" class="w-3 h-3 text-amber-600" />
                    <span>{{ remainingTimeText }}</span>
                  </div>
                  <Icon :name="showNoticeInfo ? 'lucide:chevron-up' : 'lucide:chevron-down'"
                    class="w-4 h-4 chevron-indicator" />
                </button>

                <!-- Teks informasi yang hanya muncul ketika tombol icon (i) di-klik -->
                <Transition name="expand-fade">
                  <div v-if="showNoticeInfo" class="cancel-notice-box notice-paid">
                    <div class="notice-icon">
                      <Icon name="lucide:clock" class="w-5 h-5 text-amber-600" />
                    </div>
                    <div class="notice-text">
                      <strong class="notice-title">Pengajuan Pembatalan (Maksimal 1 Hari Kerja)</strong>
                      <p class="notice-desc">
                        Pesanan Anda <strong>sudah dibayar</strong>. Pembatalan memerlukan <strong>peninjauan dan
                          persetujuan admin</strong> toko. Jika disetujui, dana pembayaran Anda akan diproses
                        pengembaliannya (refund) melalui transfer ke rekening bank/e-wallet Anda.
                      </p>
                      <div v-if="remainingTimeText" class="time-remaining-pill">
                        <Icon name="lucide:timer" class="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                        <span>Sisa batas pengajuan: <strong>{{ remainingTimeText }}</strong> (1 hari kerja)</span>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Pilihan Alasan Pembatalan (Hanya jika bukan paid MABA) -->
              <template v-if="!isPaid || !isEventMaba">
                <div class="form-group">
                  <label class="form-label">
                    Pilih Alasan Pembatalan <span class="text-danger">*</span>
                  </label>
                  <div class="reason-radio-list">
                    <label v-for="r in reasonOptions" :key="r"
                      :class="['reason-radio-card', { active: selectedReason === r }]">
                      <input type="radio" name="cancel_reason" :value="r" v-model="selectedReason" class="sr-only" />
                      <span class="custom-radio-dot"></span>
                      <span class="reason-text">{{ r }}</span>
                    </label>
                  </div>
                </div>

                <!-- Input Keterangan Tambahan jika memilih Alasan Lainnya -->
                <div class="form-group" v-if="selectedReason === 'Alasan lainnya'">
                  <label class="form-label">Keterangan Tambahan <span class="text-danger">*</span></label>
                  <textarea v-model="customReason" class="input-cyber textarea-custom" rows="2"
                    placeholder="Tuliskan detail alasan pembatalan Anda..." required></textarea>
                </div>

                <!-- Form Rekening Pengembalian Dana untuk Pesanan yang Sudah Dibayar -->
                <div v-if="isPaid" class="refund-account-section">
                  <div class="refund-section-header">
                    <Icon name="lucide:credit-card" class="w-4 h-4 text-bsi inline mr-1" />
                    <strong class="text-sm font-bold text-slate-800">Rekening Tujuan Pengembalian Dana</strong>
                  </div>
                  <p class="text-xs text-slate-500 mb-3">
                    Mohon masukkan data rekening bank / e-wallet Anda agar admin dapat mentransfer dana pengembalian
                    setelah pembatalan disetujui.
                  </p>

                  <div class="form-group mb-2">
                    <label class="form-label">Pilih Bank / E-Wallet <span class="text-danger">*</span></label>
                    <select v-model="selectedBank" class="input-cyber select-custom" required>
                      <option value="" disabled>-- Pilih Bank / E-Wallet --</option>
                      <option v-for="b in bankList" :key="b" :value="b">{{ b }}</option>
                    </select>
                  </div>

                  <div class="form-group mb-2" v-if="selectedBank === 'Bank Lainnya'">
                    <label class="form-label">Nama Bank Lainnya <span class="text-danger">*</span></label>
                    <input type="text" v-model="customBank" class="input-cyber input-custom"
                      placeholder="Contoh: Bank Danamon" required />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div class="form-group">
                      <label class="form-label">Nomor Rekening / No. HP <span class="text-danger">*</span></label>
                      <input type="text" v-model="accountNumber" class="input-cyber input-custom font-mono"
                        placeholder="Contoh: 1234567890" required />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Atas Nama Pemilik Rekening <span class="text-danger">*</span></label>
                      <input type="text" v-model="accountName" class="input-cyber input-custom"
                        placeholder="Nama sesuai rekening" required />
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- Footer Actions -->
            <div class="cancel-footer">
              <button type="button" class="btn btn-secondary" @click="$emit('close')">
                {{ isPaid && isEventMaba ? 'Tutup' : 'Kembali' }}
              </button>
              <button v-if="!isPaid || !isEventMaba" type="submit"
                :class="['btn', isPaid ? 'btn-amber-submit' : 'btn-danger-submit']"
                :disabled="isSubmitting || !selectedReason || (isPaid && (!selectedBank || !accountNumber || !accountName))">
                <span v-if="isSubmitting">Memproses...</span>
                <span v-else-if="isPaid">
                  <Icon name="lucide:send" class="w-4 h-4 inline mr-1" />
                  Kirim Pengajuan
                </span>
                <span v-else>
                  <Icon name="lucide:x-circle" class="w-4 h-4 inline mr-1" />
                  Ya, Batalkan Sekarang
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getBusinessTimeRemaining } from '~/utils/business-day'

const props = defineProps<{
  isOpen: boolean
  order: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: {
    orderId: number | string
    reason: string
    refund_bank_name?: string
    refund_account_number?: string
    refund_account_name?: string
  }): void
}>()

const isSubmitting = ref(false)
const showNoticeInfo = ref(false)
const selectedReason = ref('Ingin mengubah alamat pengiriman')
const customReason = ref('')

const selectedBank = ref('BCA')
const customBank = ref('')
const accountNumber = ref('')
const accountName = ref('')

const bankList = [
  'Bank Mandiri',
]

const isPaid = computed(() => props.order?.status === 'paid')
const isUnpaid = computed(() => props.order?.status === 'pending_payment')
const isEventMaba = computed(() => {
  if (!props.order) return false
  return Boolean(
    props.order.is_event_maba ||
    (props.order.items || []).some((it: any) => Boolean(it.product?.is_event_maba || it.is_event_maba)) ||
    (props.order.note && String(props.order.note).includes('Pengambilan Kampus UBSI')) ||
    (props.order.expedition?.name && String(props.order.expedition?.name).toLowerCase().includes('maba'))
  )
})

const paidTime = computed(() => {
  return props.order?.payment?.paid_at || props.order?.updated_at || props.order?.created_at
})

const remainingTimeText = computed(() => {
  if (!isPaid.value || !paidTime.value) return ''
  return getBusinessTimeRemaining(paidTime.value)
})

const reasonOptions = computed(() => {
  if (isUnpaid.value) {
    return [
      'Ingin mengubah alamat pengiriman',
      'Ingin mengganti produk atau varian ukuran/warna',
      'Tidak jadi membeli / berubah pikiran',
      'Alasan lainnya',
    ]
  }
  return [
    'Ingin mengubah alamat pengiriman',
    'Ingin mengganti produk atau varian ukuran/warna',
    'Salah memasukkan ekspedisi pengiriman',
    'Pesanan tidak kunjung dikemas toko',
    'Alasan lainnya',
  ]
})

const handleSubmitCancel = () => {
  if (!props.order?.id) return
  const finalReason = selectedReason.value === 'Alasan lainnya'
    ? customReason.value || 'Alasan lainnya'
    : selectedReason.value

  const finalBankName = selectedBank.value === 'Bank Lainnya'
    ? customBank.value || 'Bank Lainnya'
    : selectedBank.value

  emit('confirm', {
    orderId: props.order.id,
    reason: finalReason,
    ...(isPaid.value ? {
      refund_bank_name: finalBankName,
      refund_account_number: accountNumber.value,
      refund_account_name: accountName.value,
    } : {}),
  })
}
</script>

<style scoped>
.cancel-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cancel-modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 2.5rem);
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cancel-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-shrink: 0;
}

.header-unpaid {
  background: linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%);
  border-bottom-color: #fecdd3;
}

.header-paid {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-bottom-color: #fde68a;
}

.modal-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.circle-rose {
  background: #ffe4e6;
  border: 1.5px solid #fda4af;
  color: #e11d48;
}

.circle-amber {
  background: #fef3c7;
  border: 1.5px solid #fcd34d;
  color: #d97706;
}

.header-titles {
  flex: 1;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.subtitle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.modal-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.badge-status-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 4px;
}

.badge-unpaid {
  background: #fee2e2;
  color: #b91c1c;
}

.badge-paid {
  background: #dcfce7;
  color: #15803d;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
}

.btn-close:hover {
  color: #0f172a;
}

.cancel-form {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.cancel-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
}

.cancel-body::-webkit-scrollbar {
  width: 6px;
}

.cancel-body::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.cancel-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 9999px;
}

/* Compact Info Toggle Trigger */
.cancel-info-toggle-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-info-icon-trigger {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 10px;
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
}

.btn-info-icon-trigger:hover {
  background: #fef3c7;
  border-color: #fcd34d;
}

.btn-info-icon-trigger.active {
  background: #fef3c7;
  border-color: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.15);
}

.info-circle-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-trigger-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #92400e;
  flex: 1;
}

.info-timer-mini {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #ffffff;
  border: 1px solid #fcd34d;
  padding: 2px 7px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #b45309;
}

.chevron-indicator {
  color: #b45309;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

/* Notice Box */
.cancel-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 10px;
  font-size: 0.825rem;
  line-height: 1.45;
}

.notice-unpaid {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
}

.notice-paid {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.notice-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 800;
}

.notice-desc {
  margin: 0;
}

.time-remaining-pill {
  margin-top: 0.35rem;
  display: inline-flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #fcd34d;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #b45309;
  align-self: flex-start;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: #334155;
}

.text-danger {
  color: #ef4444;
}

.reason-radio-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.reason-radio-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.15s ease;
}

.reason-radio-card:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.reason-radio-card.active {
  border-color: #003399;
  background: #eff6ff;
}

.custom-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.reason-radio-card.active .custom-radio-dot {
  border-color: #003399;
  background: #003399;
  box-shadow: inset 0 0 0 3px #ffffff;
}

.reason-text {
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
}

.reason-radio-card.active .reason-text {
  color: #003399;
  font-weight: 700;
}

.textarea-custom {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.825rem;
  resize: vertical;
}

.textarea-custom:focus {
  border-color: #004aad;
  outline: none;
}

.refund-account-section {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem 1.15rem;
  margin-top: 0.25rem;
}

.refund-section-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.35rem;
}

.select-custom,
.input-custom {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.825rem;
  background-color: #ffffff;
  transition: border-color 0.15s ease;
}

.select-custom:focus,
.input-custom:focus {
  border-color: #004aad;
  outline: none;
}

.cancel-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-danger-submit {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
}

.btn-amber-submit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 0.65rem 1.25rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-amber-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
}

.btn-danger-submit:disabled,
.btn-amber-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
