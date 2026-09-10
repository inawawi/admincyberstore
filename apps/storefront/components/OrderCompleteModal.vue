<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && order" class="complete-modal-backdrop" @click.self="$emit('close')">
        <div class="complete-modal-card" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div class="complete-modal-header">
            <div class="success-icon-circle">
              <Icon name="lucide:package-check" class="w-6 h-6 text-emerald-600" />
            </div>
            <div class="header-titles">
              <h3 class="modal-title">Selesaikan Pesanan?</h3>
              <span class="modal-subtitle font-mono">{{ order.invoice_number || `ORD-#${order.id}` }}</span>
            </div>
            <button class="btn-close" @click="$emit('close')" aria-label="Tutup Modal" :disabled="isSubmitting">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- Modal Body Content -->
          <div class="complete-body">
            <!-- Notice / Guidance Box -->
            <div class="complete-notice-box">
              <div class="notice-icon-wrap">
                <Icon name="lucide:shield-check" class="w-5 h-5 text-emerald-600" />
              </div>
              <div class="notice-content">
                <h4 class="notice-title">Pastikan Paket Sudah Diterima Lengkap</h4>
                <p class="notice-desc">
                  Konfirmasi hanya jika Anda telah menerima semua barang pesanan dalam kondisi baik, lengkap, dan tidak ada kerusakan.
                </p>
              </div>
            </div>

            <!-- Order Product Items Preview -->
            <div class="complete-order-preview" v-if="order.items && order.items.length > 0">
              <span class="preview-heading">Produk yang Diterima:</span>
              <div class="preview-items-list">
                <div v-for="item in order.items" :key="item.id" class="preview-item-row">
                  <img :src="getImageUrl(item.product?.main_photo)" :alt="item.product_name || item.product?.name"
                    class="preview-item-img" />
                  <div class="preview-item-info">
                    <span class="preview-item-name">{{ item.product_name || item.product?.name }}</span>
                    <div class="preview-item-meta">
                      <span v-if="item.size" class="meta-tag">Ukuran: {{ item.size }}</span>
                      <span v-if="item.color" class="meta-tag">Warna: {{ item.color }}</span>
                      <span class="meta-qty">{{ item.quantity }}x {{ formatRupiah(item.price) }}</span>
                    </div>
                  </div>
                  <div class="preview-item-subtotal font-mono">
                    {{ formatRupiah(item.total || (item.price * item.quantity)) }}
                  </div>
                </div>
              </div>

              <div class="preview-total-row">
                <span class="preview-total-label">Total Belanja:</span>
                <strong class="preview-total-amount font-display">
                  {{ formatRupiah(order.grand_total || order.subtotal) }}
                </strong>
              </div>
            </div>

            <!-- Consequence Info / Next Step -->
            <div class="consequence-pill">
              <Icon name="lucide:info" class="w-4 h-4 text-bsi flex-shrink-0" />
              <span>
                Setelah pesanan diselesaikan, dana akan langsung diteruskan ke toko dan Anda dapat segera menuliskan ulasan serta memberikan penilaian produk.
              </span>
            </div>
          </div>

          <!-- Modal Footer Actions -->
          <div class="complete-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="isSubmitting">
              Periksa Kembali
            </button>
            <button type="button" class="btn btn-emerald" :disabled="isSubmitting" @click="handleConfirm">
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 mr-1.5 animate-spin inline" />
              <Icon v-else name="lucide:check-circle-2" class="w-4 h-4 mr-1.5 inline" />
              <span>{{ isSubmitting ? 'Memproses...' : 'Ya, Pesanan Selesai' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  isOpen: boolean
  order: any
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', order: any): void
}>()

const { formatRupiah } = useFormat()
const { getImageUrl } = useApi()

const handleConfirm = () => {
  if (!props.order || props.isSubmitting) return
  emit('confirm', props.order)
}
</script>

<style scoped>
.complete-modal-backdrop {
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

.complete-modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 520px;
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.complete-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #f8fafc;
}

.success-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 0.25rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.complete-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 70vh;
  overflow-y: auto;
}

.complete-notice-box {
  display: flex;
  gap: 0.85rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  align-items: flex-start;
}

.notice-icon-wrap {
  flex-shrink: 0;
  margin-top: 2px;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #166534;
  margin-bottom: 0.2rem;
}

.notice-desc {
  font-size: 0.8rem;
  color: #15803d;
  line-height: 1.45;
  margin: 0;
}

.complete-order-preview {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.85rem 1rem;
}

.preview-heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  display: block;
  margin-bottom: 0.65rem;
}

.preview-items-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.preview-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px dashed #e2e8f0;
}

.preview-item-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.preview-item-img {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  flex-shrink: 0;
}

.preview-item-info {
  flex: 1;
  min-width: 0;
}

.preview-item-name {
  font-size: 0.825rem;
  font-weight: 600;
  color: #1e293b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-item-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}

.meta-tag {
  font-size: 0.7rem;
  background: #e2e8f0;
  color: #475569;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.meta-qty {
  font-size: 0.725rem;
  color: #64748b;
}

.preview-item-subtotal {
  font-size: 0.825rem;
  font-weight: 700;
  color: #0f172a;
  flex-shrink: 0;
}

.preview-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px solid #e2e8f0;
}

.preview-total-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.preview-total-amount {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.consequence-pill {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.775rem;
  line-height: 1.45;
  color: #475569;
  background: #f1f5f9;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.complete-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.6rem 1.15rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  background: #ffffff;
  color: #475569;
  border: 1px solid #cbd5e1;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-emerald {
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  background: #10b981;
  color: #ffffff;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.btn-emerald:hover:not(:disabled) {
  background: #059669;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .complete-modal-backdrop {
    padding: 0.75rem;
    align-items: flex-end;
  }

  .complete-modal-card {
    border-radius: 16px 16px 8px 8px;
    max-height: 90vh;
  }

  .complete-modal-header {
    padding: 1rem 1.15rem;
  }

  .complete-body {
    padding: 1rem 1.15rem;
  }

  .complete-footer {
    padding: 0.85rem 1.15rem;
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .complete-footer .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
