<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && order" class="cancel-modal-backdrop" @click.self="$emit('close')">
        <div class="cancel-modal-card" role="dialog" aria-modal="true">
          <div class="cancel-modal-header">
            <div class="warning-icon-circle">
              <Icon name="lucide:alert-triangle" class="w-6 h-6 text-amber-500" />
            </div>
            <div class="header-titles">
              <h3 class="modal-title">Batalkan Pesanan?</h3>
              <span class="modal-subtitle font-mono">{{ order.invoice_number }}</span>
            </div>
            <button class="btn-close" @click="$emit('close')" aria-label="Tutup">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleSubmitCancel" class="cancel-form">
            <div class="cancel-body">
              <p class="cancel-info-text">
                <span v-if="order.status === 'paid'">
                  Pesanan telah dibayar. Pembatalan ini diajukan ke admin sebelum toko mengemas atau memproses paket
                  Anda (berlaku maksimal 1x24 jam sejak pemesanan).
                </span>
                <span v-else>
                  Apakah Anda yakin ingin membatalkan pesanan ini? Tagihan pembayaran dan pesanan Anda akan dibatalkan
                  langsung, dan stok produk akan dikembalikan.
                </span>
              </p>

              <div class="form-group">
                <label class="form-label">Pilih Alasan Pembatalan <span class="text-danger">*</span></label>
                <div class="reason-radio-list">
                  <label v-for="r in reasonOptions" :key="r"
                    :class="['reason-radio-card', { active: selectedReason === r }]">
                    <input type="radio" name="cancel_reason" :value="r" v-model="selectedReason" class="sr-only" />
                    <span class="custom-radio-dot"></span>
                    <span class="reason-text">{{ r }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group" v-if="selectedReason === 'Alasan lainnya'">
                <label class="form-label">Keterangan Tambahan</label>
                <textarea v-model="customReason" class="input-cyber textarea-custom" rows="2"
                  placeholder="Tuliskan alasan spesifik Anda..." required></textarea>
              </div>
            </div>

            <div class="cancel-footer">
              <button type="button" class="btn btn-secondary" @click="$emit('close')">
                Jangan Batalkan
              </button>
              <button type="submit" class="btn btn-danger" :disabled="isSubmitting || !selectedReason">
                <span v-if="isSubmitting">Memproses...</span>
                <span v-else>Ya, Batalkan Pesanan</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  isOpen: boolean
  order: any
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { orderId: number | string; reason: string }): void
}>()

const isSubmitting = ref(false)
const selectedReason = ref('Ingin mengubah alamat pengiriman')
const customReason = ref('')

const reasonOptions = [
  'Ingin mengubah alamat pengiriman',
  'Ingin mengganti produk atau varian ukuran/warna',
  'Salah memasukkan ekspedisi pengiriman',
  'Menemukan opsi pembayaran lain',
  'Alasan lainnya',
]

const handleSubmitCancel = () => {
  if (!props.order?.id) return
  const finalReason = selectedReason.value === 'Alasan lainnya'
    ? customReason.value || 'Alasan lainnya'
    : selectedReason.value

  emit('confirm', {
    orderId: props.order.id,
    reason: finalReason,
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
  max-width: 480px;
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
  background: #f8fafc;
}

.warning-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.header-titles {
  flex: 1;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-subtitle {
  font-size: 0.75rem;
  color: #64748b;
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

.cancel-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cancel-info-text {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
}

.reason-radio-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.reason-radio-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  background: #ffffff;
  transition: all 0.2s ease;
}

.reason-radio-card:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.reason-radio-card.active {
  border-color: #ef4444;
  background: #fef2f2;
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
}

.reason-radio-card.active .custom-radio-dot {
  border-color: #ef4444;
}

.reason-radio-card.active .custom-radio-dot::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.reason-text {
  font-size: 0.825rem;
  font-weight: 500;
  color: #0f172a;
}

.textarea-custom {
  margin-top: 0.25rem;
  width: 100%;
}

.cancel-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-danger {
  background: #ef4444;
  color: #ffffff;
  border: none;
  font-weight: 700;
}

.btn-danger:hover {
  background: #dc2626;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .cancel-modal-backdrop {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .cancel-modal-card {
    border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) var(--radius-sm, 8px) var(--radius-sm, 8px);
    max-height: 90vh;
    overflow-y: auto;
  }

  .cancel-modal-header {
    padding: 1rem 1.15rem;
  }

  .cancel-body {
    padding: 1rem 1.15rem;
  }

  .cancel-footer {
    padding: 0.85rem 1.15rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .cancel-footer .btn {
    width: 100%;
    justify-content: center;
  }

  .reason-text {
    font-size: 0.8rem;
  }

  .cancel-info-text {
    font-size: 0.825rem;
  }
}

@media (max-width: 375px) {
  .modal-title {
    font-size: 1rem;
  }

  .reason-radio-card {
    padding: 0.55rem 0.75rem;
  }
}
</style>
