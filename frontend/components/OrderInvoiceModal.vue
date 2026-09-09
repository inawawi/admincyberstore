<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen && order" class="invoice-modal-backdrop" @click.self="$emit('close')">
        <div class="invoice-modal-container" role="dialog" aria-modal="true">
          <!-- Screen Toolbar (Hidden on Print) -->
          <div class="invoice-toolbar no-print">
            <div class="toolbar-info">
              <div class="toolbar-icon">
                <Icon name="lucide:file-text" class="w-6 h-6 text-bsi" />
              </div>
              <div>
                <h3 class="toolbar-title">Invoice Pembayaran Resmi</h3>
                <span class="toolbar-sub font-mono">{{ order.invoice_number || `ORD-#${order.id}` }}</span>
              </div>
            </div>

            <div class="toolbar-actions">
              <button type="button" class="btn btn-print-action" @click="handlePrint">
                <Icon name="lucide:printer" class="w-4 h-4" />
                <span class="btn-text-full">Cetak / Simpan PDF</span>
                <span class="btn-text-short">Cetak</span>
              </button>
              <button type="button" class="btn-close-modal" @click="$emit('close')" aria-label="Tutup">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Printable Invoice Sheet (A4 Proportion) -->
          <div class="printable-invoice-sheet" id="invoice-printable-area">
            <!-- 1. Invoice Header -->
            <div class="inv-header">
              <div class="inv-brand-col">
                <div class="inv-logo-row">
                  <img :src="storeLogoUrl" alt="Cyber Store Logo" class="inv-logo-img" @error="onLogoError" />
                  <div>
                    <h1 class="inv-store-name">{{ storeInfo?.store_name || 'CYBER STORE UBSI' }}</h1>
                    <p class="inv-store-tagline">Official Merchandise & Apparel Universitas BSI</p>
                  </div>
                </div>
                <div class="inv-store-meta">
                  <!-- <p class="store-official-badge">Toko Resmi Merchandise & Aksesoris Kampus UBSI</p> -->
                  <span>{{ storeInfo?.store_address || 'Jl. RS Fatmawati Raya No. 24, Pondok Labu, Jakarta Selatan'
                  }}</span>
                </div>
              </div>

              <div class="inv-title-col">
                <div class="inv-doc-label">INVOICE PEMBAYARAN</div>
                <div class="inv-number-code font-mono">{{ order.invoice_number || `ORD-#${order.id}` }}</div>

                <!-- Official Paid Stamp Badge -->
                <div class="inv-paid-stamp">
                  <div class="stamp-border">
                    <Icon name="lucide:star" class="w-3.5 h-3.5 stamp-star text-emerald" />
                    <span class="stamp-text">LUNAS / PAID</span>
                    <Icon name="lucide:star" class="w-3.5 h-3.5 stamp-star text-emerald" />
                  </div>
                  <span class="stamp-date">{{ formatSimpleDate(order.payment?.settlement_time || order.updated_at ||
                    order.created_at) }}</span>
                </div>
              </div>
            </div>

            <div class="inv-divider"></div>

            <!-- 2. Meta Info Grid (Dates, Payment, Order Status) -->
            <div class="inv-meta-grid">
              <div class="inv-meta-item">
                <span class="meta-label">Tanggal Pemesanan</span>
                <span class="meta-val font-semibold">{{ formatDateTime(order.created_at) }}</span>
              </div>
              <div class="inv-meta-item">
                <span class="meta-label">Waktu Pembayaran</span>
                <span class="meta-val font-semibold text-emerald">
                  {{ formatDateTime(order.payment?.settlement_time || order.payment?.updated_at || order.updated_at ||
                    order.created_at) }}
                </span>
              </div>
              <div class="inv-meta-item">
                <span class="meta-label">Metode Pembayaran</span>
                <span class="meta-val font-semibold font-mono uppercase">
                  ({{ formatPaymentType(order.payment?.payment_type) }})
                </span>
              </div>
              <div class="inv-meta-item">
                <span class="meta-label">Status Pesanan</span>
                <span class="meta-val font-semibold status-pill">{{ getStatusLabel(order.status) }}</span>
              </div>
            </div>

            <!-- 3. Store Info & Shipping 2-Column Section -->
            <div class="inv-parties-grid">
              <!-- Store Info / Penjual (Sebelah Kiri) -->
              <div class="inv-party-card">
                <div class="party-card-title">PENGIRIM</div>
                <div class="party-name">{{ storeInfo?.store_name || 'CYBER STORE UBSI' }}</div>
                <div class="party-line">
                  <Icon name="lucide:phone" class="party-icon text-bsi" />
                  <span><strong>No. HP / Telp:</strong> {{ storeInfo?.store_phone || '+62 812-3456-7890' }}</span>
                </div>
                <div class="party-line">
                  <Icon name="lucide:mail" class="party-icon text-bsi" />
                  <span><strong>Email:</strong> {{ storeInfo?.store_email || 'support@cyberstore.id' }}</span>
                </div>

              </div>

              <!-- Shipping Destination & Courier (Sebelah Kanan) -->
              <div class="inv-party-card">
                <div class="party-card-title">PENERIMA & EKSPEDISI</div>
                <div class="party-name">{{ recipientName }}</div>
                <div class="party-line" v-if="customerPhone">
                  <Icon name="lucide:phone" class="party-icon text-bsi" />
                  <span><strong>No. HP:</strong> {{ customerPhone }}</span>
                </div>
                <div class="party-line" v-if="customerEmail">
                  <Icon name="lucide:mail" class="party-icon text-bsi" />
                  <span><strong>Email:</strong> {{ customerEmail }}</span>
                </div>
                <div class="party-line">
                  <Icon name="lucide:map-pin" class="party-icon text-bsi" />
                  <span><strong>Alamat:</strong> {{ order.address?.address || '-' }}</span>
                </div>
                <div class="party-line party-city" v-if="order.address?.city">
                  {{ order.address?.city }}, {{ order.address?.province || '' }} {{ order.address?.postal_code || '' }}
                </div>
                <div class="party-expedition-badge">
                  <Icon name="lucide:truck" class="w-4 h-4 text-emerald" />
                  <strong>{{ order.expedition?.name || 'Kurir Ekspedisi' }}</strong>
                  <span class="exp-service">({{ order.expedition?.service || 'REG' }})</span>
                  <span v-if="order.resi_number" class="exp-resi font-mono">No. Resi: {{ order.resi_number }}</span>
                </div>
              </div>
            </div>

            <!-- 4. Items Table -->
            <div class="table-scroll-hint no-print">
              <Icon name="lucide:chevrons-left-right" class="w-3.5 h-3.5" />
              <span>Geser tabel untuk melihat rincian harga & total</span>
            </div>
            <div class="inv-table-wrapper">
              <table class="inv-table">
                <thead>
                  <tr>
                    <th class="th-no text-center">NO</th>
                    <th class="th-item">RINCIAN PRODUK & VARIAN</th>
                    <th class="th-price text-right">HARGA SATUAN</th>
                    <th class="th-qty text-center">QTY</th>
                    <th class="th-total text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in (order.items || [])" :key="item.id || idx">
                    <td class="text-center font-mono">{{ Number(idx) + 1 }}</td>
                    <td>
                      <div class="item-title">{{ item.product_name || item.product?.name || 'Produk' }}</div>
                      <div class="item-variants">
                        <span v-if="item.size" class="inv-variant-tag">Ukuran: {{ item.size }}</span>
                        <span v-if="item.color" class="inv-variant-tag">Warna: {{ item.color }}</span>
                        <span v-if="item.nim" class="inv-variant-tag nim-tag">
                          <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1 text-sky-600" />
                          NIM: {{ item.nim }}
                        </span>
                      </div>
                    </td>
                    <td class="text-right font-mono">{{ formatRupiah(item.price) }}</td>
                    <td class="text-center font-mono font-semibold">{{ item.quantity }}</td>
                    <td class="text-right font-mono font-bold">{{ formatRupiah(item.total || (item.price *
                      item.quantity)) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 5. Payment Details & Totals Summary -->
            <div class="inv-summary-row">
              <div class="inv-notes-col">
                <div class="inv-note-box">
                  <div class="note-heading">Catatan Pembeli:</div>
                  <p class="note-content">{{ order.note || 'Tidak ada catatan khusus.' }}</p>
                </div>
                <div class="inv-payment-meta">

                  <div class="meta-row">
                    <span class="meta-sub">Status Settlement:</span>
                    <span class="meta-ans text-emerald font-semibold inline-flex items-center gap-2">
                      <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5 text-emerald" />
                      Terverifikasi Lunas
                    </span>
                  </div>
                </div>
              </div>

              <div class="inv-totals-col">
                <div class="total-line">
                  <span class="total-label">Subtotal Produk</span>
                  <span class="total-val font-mono">{{ formatRupiah(order.subtotal) }}</span>
                </div>
                <div class="total-line">
                  <span class="total-label">Biaya Pengiriman ({{ order.expedition?.name || 'Kurir' }})</span>
                  <span class="total-val font-mono">{{ formatRupiah(order.shipping_cost) }}</span>
                </div>
                <div class="total-line" v-if="serviceFee > 0">
                  <span class="total-label">Biaya Layanan</span>
                  <span class="total-val font-mono">{{ formatRupiah(serviceFee) }}</span>
                </div>
                <div class="total-grand-divider"></div>
                <div class="total-line grand-total-line">
                  <span class="grand-label">TOTAL DIBAYAR</span>
                  <span class="grand-amount font-mono">{{ formatRupiah(order.grand_total || order.subtotal) }}</span>
                </div>
                <!-- <div class="grand-status-text text-emerald inline-flex items-center gap-1 justify-end">
                  <Icon name="lucide:check-circle" class="w-3.5 h-3.5 text-emerald" />
                  <span>Lunas dibayarkan via ({{ formatPaymentType(order.payment?.payment_type) }})</span>
                </div> -->
              </div>
            </div>

            <!-- 6. Official Footer & Legal Authenticity -->
            <div class="inv-footer">
              <div class="footer-legal">
                <p class="legal-title">Syarat & Ketentuan Bukti Pembayaran:</p>
                <ul class="legal-list">
                  <li>Invoice ini merupakan bukti transaksi yang sah dan diterbitkan secara elektronik oleh sistem Cyber
                    Store.</li>
                  <li>Simpan dokumen ini untuk keperluan klaim garansi, pengembalian (retur), atau pelacakan barang.
                  </li>
                  <li>Jika membutuhkan bantuan atau pertanyaan seputar pesanan Anda, hubungi layanan pelanggan kami.
                  </li>
                </ul>
              </div>

              <div class="footer-verification">
                <div class="qr-mock-box">
                  <div class="qr-code-pattern">
                    <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="QR Code Verifikasi" class="qr-img" />
                    <div v-else class="qr-loading"></div>
                  </div>
                  <span class="qr-caption font-mono">SCAN VERIFIKASI</span>
                </div>
                <div class="verified-seal">
                  <Icon name="lucide:shield-check" class="w-5 h-5 text-emerald seal-check-icon" />
                  <span class="seal-title">DOKUMEN SAH KOMPUTERISASI</span>
                  <span class="seal-sub">Tidak memerlukan tanda tangan basah</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import QRCode from 'qrcode'
import { useFormat } from '~/composables/useFormat'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  isOpen: boolean
  order: any
}>()

defineEmits<{
  (e: 'close'): void
}>()

const { formatRupiah } = useFormat()
const { fetchStoreInfo, getImageUrl } = useApi()

const storeInfo = ref<any>(null)
const storeLogoUrl = ref('/logo-cyberstore.png')
const qrCodeDataUrl = ref('')

const generateQrCode = async () => {
  if (!props.order) return
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const invNumber = props.order.invoice_number || `ORD-#${props.order.id}`
    const verifyUrl = `${origin}/account/orders?invoice=${encodeURIComponent(invNumber)}`

    qrCodeDataUrl.value = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#002266',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
  } catch (err) {
    console.warn('QR Code generation failed, using fallback:', err)
    const invNumber = props.order?.invoice_number || 'INVOICE'
    qrCodeDataUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invNumber)}`
  }
}

watch(() => props.order, () => {
  generateQrCode()
}, { immediate: true })

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    generateQrCode()
    if (typeof document !== 'undefined') {
      document.body.classList.add('invoice-modal-open')
    }
  } else {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('invoice-modal-open')
    }
  }
}, { immediate: true })

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('invoice-modal-open')
    document.body.classList.remove('printing-invoice')
  }
})

onMounted(async () => {
  generateQrCode()
  try {
    const data = await fetchStoreInfo()
    if (data) {
      storeInfo.value = data
      if (data.store_logo) {
        storeLogoUrl.value = getImageUrl(data.store_logo)
      }
    }
  } catch {
    // Fallback logo already set
  }
})

const onLogoError = () => {
  storeLogoUrl.value = '/logo-ubsi.png'
}

// Service fee calculation
const serviceFee = computed(() => {
  if (!props.order) return 0
  const grand = Number(props.order.grand_total || 0)
  const sub = Number(props.order.subtotal || 0)
  const ship = Number(props.order.shipping_cost || 0)
  const diff = grand - sub - ship
  return diff > 0 ? diff : 0
})

// Customer naming helpers
const customerName = computed(() => {
  if (!props.order) return 'Pelanggan'
  return props.order.user?.name || props.order.customer?.name || props.order.address?.receiver_name || 'Pelanggan'
})

const customerEmail = computed(() => {
  if (!props.order) return ''
  return props.order.user?.email || props.order.customer?.email || ''
})

const customerPhone = computed(() => {
  if (!props.order) return ''
  return props.order.address?.phone || props.order.user?.phone || props.order.customer?.phone || ''
})

const recipientName = computed(() => {
  if (!props.order) return 'Penerima'
  return props.order.address?.receiver_name || props.order.address?.recipient_name || customerName.value
})

const formatPaymentType = (type?: string) => {
  if (!type) return 'Transfer Bank / VA'
  const mapping: Record<string, string> = {
    bank_transfer: 'Bank Transfer (VA)',
    echannel: 'Mandiri Bill Payment',
    bca_va: 'BCA Virtual Account',
    bni_va: 'BNI Virtual Account',
    bri_va: 'BRI Virtual Account',
    permata_va: 'Permata Virtual Account',
    cimb_va: 'CIMB Virtual Account',
    gopay: 'GoPay / QRIS',
    qris: 'QRIS Interactive',
    shopeepay: 'ShopeePay',
    credit_card: 'Kartu Kredit / Debit',
  }
  return mapping[type.toLowerCase()] || type.toUpperCase()
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending_payment': return 'Menunggu Pembayaran'
    case 'paid': return 'Dibayar (Menunggu Toko)'
    case 'packed': return 'Sedang Dikemas'
    case 'shipped': return 'Sedang Dikirim'
    case 'arrived': return 'Telah Tiba di Tujuan'
    case 'completed': return 'Pesanan Selesai'
    case 'cancelled': return 'Dibatalkan'
    default: return status || '-'
  }
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const formatSimpleDate = (iso?: string) => {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

const handlePrint = () => {
  if (typeof window !== 'undefined') {
    document.body.classList.add('printing-invoice')
    window.print()
    setTimeout(() => {
      document.body.classList.remove('printing-invoice')
    }, 1500)
  }
}
</script>

<style scoped>
/* ─── Modal Backdrop & Container (Screen Only) ────────────────────────────────── */
.invoice-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(6px);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  box-sizing: border-box;
}

.invoice-modal-container {
  background: transparent;
  width: 100%;
  max-width: 860px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ─── Top Toolbar (Hidden on Print) ───────────────────────────────────────────── */
.invoice-toolbar {
  background: #ffffff;
  border-radius: 12px;
  padding: 0.85rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.toolbar-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-icon {
  font-size: 1.5rem;
}

.toolbar-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
}

.toolbar-sub {
  font-size: 0.8rem;
  color: #004aad;
  font-weight: 600;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-print-action {
  background: #004aad;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 74, 173, 0.25);
}

.btn-print-action:hover {
  background: #003399;
  transform: translateY(-1px);
}

.btn-close-modal {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* ─── Printable Invoice Sheet ─────────────────────────────────────────────────── */
.printable-invoice-sheet {
  background: #ffffff;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  color: #0f172a;
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  border: 1px solid #e2e8f0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

/* 1. Header */
.inv-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  min-width: 0;
}

.inv-brand-col {
  min-width: 0;
  flex: 1;
}

.inv-logo-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.inv-logo-img {
  height: 52px;
  width: auto;
  object-fit: contain;
}

.inv-store-name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #003399;
  letter-spacing: -0.02em;
  line-height: 1.2;
  word-break: break-word;
}

.inv-store-tagline {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.inv-store-meta {
  font-size: 0.8rem;
  color: #475569;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
}

.inv-title-col {
  min-width: 0;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.inv-doc-label {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: 0.05em;
  word-break: break-word;
}

.inv-number-code {
  font-size: 0.95rem;
  font-weight: 700;
  color: #004aad;
  margin-top: 0.25rem;
  word-break: break-all;
}

/* Paid Stamp */
.inv-paid-stamp {
  margin-top: 0.75rem;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  border: 2px dashed #059669;
  border-radius: 8px;
  padding: 0.35rem 0.85rem;
  background: rgba(5, 150, 105, 0.04);
  transform: rotate(-3deg);
}

.stamp-border {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #059669;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 0.08em;
}

.stamp-star {
  font-size: 0.8rem;
}

.stamp-date {
  font-size: 0.68rem;
  color: #059669;
  font-weight: 600;
  margin-top: -2px;
}

.inv-divider {
  height: 2px;
  background: linear-gradient(to right, #003399, #0284c7, #e2e8f0);
  margin: 1.5rem 0;
  border-radius: 2px;
}

/* 2. Meta Grid */
.inv-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem 1.25rem;
  margin-bottom: 1.5rem;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.inv-meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: break-word;
}

.meta-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.meta-val {
  font-size: 0.85rem;
  color: #0f172a;
}

.status-pill {
  display: inline-block;
  color: #004aad;
}

/* 3. Parties Grid */
.inv-parties-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.inv-party-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  background: #ffffff;
  min-width: 0;
  box-sizing: border-box;
}

.party-card-title {
  font-size: 0.72rem;
  font-weight: 800;
  color: #64748b;
  letter-spacing: 0.06em;
  margin-bottom: 0.5rem;
}

.party-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.35rem;
  word-break: break-word;
  overflow-wrap: break-word;
}

.party-line {
  font-size: 0.82rem;
  color: #475569;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  margin-bottom: 0.25rem;
  word-break: break-word;
  overflow-wrap: break-word;
}

.party-city {
  font-weight: 600;
  color: #334155;
  margin-left: 1.4rem;
}

.party-expedition-badge {
  margin-top: 0.6rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 0.35rem 0.65rem;
  font-size: 0.78rem;
  color: #166534;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  max-width: 100%;
  box-sizing: border-box;
}

.exp-resi {
  color: #004aad;
  font-weight: 700;
  background: #e0f2fe;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  word-break: break-all;
}

/* 4. Table */
.inv-table-wrapper {
  margin-bottom: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow-x: auto;
  max-width: 100%;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.inv-table-wrapper::-webkit-scrollbar {
  height: 5px;
}

.inv-table-wrapper::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.inv-table {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.inv-table thead th {
  background: #f1f5f9;
  color: #334155;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #cbd5e1;
}

.inv-table tbody td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.inv-table tbody tr:last-child td {
  border-bottom: none;
}

.inv-table tbody tr:nth-child(even) {
  background: #fafafa;
}

.th-no {
  width: 50px;
}

.th-qty {
  width: 70px;
}

.th-price {
  width: 140px;
}

.th-total {
  width: 150px;
}

.item-title {
  font-weight: 600;
  color: #0f172a;
}

.item-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.inv-variant-tag {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  font-size: 0.72rem;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  color: #475569;
}

.nim-tag {
  background: #e0f2fe;
  border-color: #bae6fd;
  color: #0369a1;
  font-weight: 600;
}

/* 5. Summary & Totals */
.inv-summary-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.inv-note-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.85rem 1rem;
  margin-bottom: 0.85rem;
  min-width: 0;
  box-sizing: border-box;
}

.note-heading {
  font-size: 0.72rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.note-content {
  font-size: 0.82rem;
  color: #334155;
  font-style: italic;
  word-break: break-word;
  overflow-wrap: break-word;
}

.inv-payment-meta .meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  padding: 0.25rem 0;
  border-bottom: 1px dashed #e2e8f0;
}

.meta-sub {
  color: #64748b;
}

.meta-ans {
  font-weight: 600;
}

.inv-totals-col {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
  box-sizing: border-box;
}

.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #475569;
}

.total-label {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.total-val {
  flex-shrink: 0;
  white-space: nowrap;
}

.total-grand-divider {
  height: 1px;
  background: #cbd5e1;
  margin: 0.35rem 0;
}

.grand-total-line {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #003399;
}

.grand-label {
  flex: 1;
  min-width: 0;
}

.grand-amount {
  font-size: 1.2rem;
  flex-shrink: 0;
  white-space: nowrap;
}

.grand-status-text {
  font-size: 0.72rem;
  font-weight: 700;
  text-align: right;
  margin-top: 0.1rem;
}

/* 6. Footer & Verification */
.inv-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 2rem;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.footer-legal {
  max-width: 60%;
  min-width: 0;
}

.legal-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.25rem;
}

.legal-list {
  font-size: 0.7rem;
  color: #64748b;
  padding-left: 1rem;
  line-height: 1.4;
}

.footer-verification {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.qr-mock-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.qr-code-pattern {
  width: 66px;
  height: 66px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 3px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.qr-loading {
  width: 22px;
  height: 22px;
  border: 2px solid #e2e8f0;
  border-top-color: #004aad;
  border-radius: 50%;
  animation: qrSpin 0.8s linear infinite;
}

@keyframes qrSpin {
  to {
    transform: rotate(360deg);
  }
}

.qr-caption {
  font-size: 0.62rem;
  color: #003399;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.verified-seal {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.seal-check {
  font-size: 1.1rem;
}

.seal-title {
  font-size: 0.68rem;
  font-weight: 800;
  color: #059669;
  letter-spacing: 0.04em;
}

.seal-sub {
  font-size: 0.62rem;
  color: #64748b;
}

/* Utilities */
.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-emerald {
  color: #059669;
}

.font-semibold {
  font-weight: 600;
}

.font-bold {
  font-weight: 700;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.btn-text-short {
  display: none;
}

.table-scroll-hint {
  display: none;
}

/* ─── Responsive Queries for All Screen Sizes ─────────────────────────────────── */
@media screen and (max-width: 1024px) {
  .invoice-modal-container {
    max-width: 100%;
  }
}

@media screen and (max-width: 768px) {
  .invoice-modal-backdrop {
    padding: 1rem 0.75rem;
    align-items: flex-start;
    -webkit-overflow-scrolling: touch;
  }

  .invoice-modal-container {
    gap: 0.75rem;
    padding-bottom: 2rem;
  }

  /* Toolbar */
  .invoice-toolbar {
    padding: 0.75rem 1rem;
    border-radius: 10px;
  }

  .toolbar-info {
    min-width: 0;
    flex: 1;
  }

  .toolbar-title {
    font-size: 0.92rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .toolbar-sub {
    font-size: 0.75rem;
  }

  .btn-print-action {
    padding: 0.5rem 0.85rem;
    font-size: 0.8rem;
    gap: 0.35rem;
  }

  .btn-close-modal {
    width: 32px;
    height: 32px;
  }

  /* Sheet */
  .printable-invoice-sheet {
    padding: 1.5rem 1.25rem;
    border-radius: 10px;
  }

  /* 1. Header: Stack brand & invoice title */
  .inv-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
  }

  .inv-title-col {
    align-items: flex-start;
    text-align: left;
  }

  .inv-doc-label {
    font-size: 1.25rem;
  }

  .inv-paid-stamp {
    align-self: flex-start;
    margin-top: 0.5rem;
    transform: rotate(-2deg);
  }

  /* 2. Meta Grid: 2 columns */
  .inv-meta-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.85rem;
    padding: 0.85rem 1rem;
    margin-bottom: 1.25rem;
  }

  .inv-meta-item {
    min-width: 0;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* 3. Parties Grid: 1 column */
  .inv-parties-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .inv-party-card {
    padding: 0.85rem 1rem;
    min-width: 0;
  }

  .party-line {
    word-break: break-word;
    overflow-wrap: break-word;
  }

  /* 4. Table */
  .table-scroll-hint {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.73rem;
    color: #0284c7;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 0.35rem 0.65rem;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }

  .inv-table-wrapper {
    margin-bottom: 1.25rem;
  }

  .inv-table th,
  .inv-table td {
    padding: 0.65rem 0.75rem;
    font-size: 0.8rem;
  }

  /* 5. Summary & Totals: 1 column */
  .inv-summary-row {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 1.25rem;
  }

  .inv-totals-col {
    padding: 0.85rem 1rem;
  }

  .total-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .total-label {
    flex: 1;
    min-width: 0;
  }

  .total-val {
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* 6. Footer: Stack legal & verification */
  .inv-footer {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 1.25rem;
    padding-top: 1rem;
  }

  .footer-legal {
    max-width: 100%;
  }

  .footer-verification {
    width: 100%;
    justify-content: flex-start;
    gap: 1.25rem;
  }
}

@media screen and (max-width: 480px) {
  .invoice-modal-backdrop {
    padding: 0.5rem 0.35rem;
  }

  .invoice-modal-container {
    padding-bottom: 1.5rem;
  }

  .invoice-toolbar {
    padding: 0.6rem 0.75rem;
    gap: 0.5rem;
  }

  .toolbar-icon {
    display: none;
  }

  .toolbar-title {
    font-size: 0.85rem;
  }

  .toolbar-sub {
    font-size: 0.7rem;
  }

  .btn-print-action {
    padding: 0.45rem 0.65rem;
    font-size: 0.75rem;
  }

  .btn-text-full {
    display: none;
  }

  .btn-text-short {
    display: inline;
  }

  /* Sheet */
  .printable-invoice-sheet {
    padding: 1rem 0.75rem;
    border-radius: 8px;
  }

  .inv-logo-row {
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .inv-logo-img {
    height: 40px;
  }

  .inv-store-name {
    font-size: 1.12rem;
  }

  .inv-store-tagline {
    font-size: 0.72rem;
  }

  .inv-store-meta {
    font-size: 0.75rem;
  }

  .inv-doc-label {
    font-size: 1.1rem;
  }

  .inv-number-code {
    font-size: 0.85rem;
  }

  .stamp-border {
    font-size: 0.8rem;
  }

  .inv-divider {
    margin: 1rem 0;
  }

  /* Meta Grid: 2 compact columns */
  .inv-meta-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem 0.5rem;
    padding: 0.75rem 0.65rem;
  }

  .party-name {
    font-size: 0.92rem;
  }

  .party-line {
    font-size: 0.78rem;
  }

  .party-city {
    margin-left: 0;
    margin-top: 0.15rem;
  }

  /* Table on mobile: compact horizontal touch scroll */
  .inv-table {
    min-width: 440px;
    font-size: 0.78rem;
  }

  .inv-table th,
  .inv-table td {
    padding: 0.55rem 0.6rem;
  }

  .th-no {
    width: 32px;
  }

  .th-qty {
    width: 45px;
  }

  .th-price {
    width: 95px;
  }

  .th-total {
    width: 100px;
  }

  .total-line {
    font-size: 0.8rem;
  }

  .grand-total-line {
    font-size: 0.95rem;
  }

  .grand-amount {
    font-size: 1.05rem;
  }

  .footer-verification {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .qr-code-pattern {
    width: 58px;
    height: 58px;
  }

  .verified-seal {
    min-width: 0;
    flex: 1;
  }

  .legal-title {
    font-size: 0.72rem;
  }

  .legal-list {
    font-size: 0.68rem;
    padding-left: 0.85rem;
  }
}

@media screen and (max-width: 360px) {
  .printable-invoice-sheet {
    padding: 0.85rem 0.5rem;
  }

  .inv-meta-grid {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .footer-verification {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<!-- ─── GLOBAL PRINT STYLES FOR INVOICE (UNSCOPED SO IT AFFECTS APP & NAVBAR) ─── -->
<style>
@media print {

  /* 1. Hide the entire website app, Navbar, Announcement, Footer, and screen-only elements */
  body.invoice-modal-open #__nuxt,
  body.printing-invoice #__nuxt,
  body:has(.invoice-modal-backdrop) #__nuxt,
  header.navbar-wrapper,
  .navbar-wrapper,
  .top-announcement,
  footer.footer-wrapper,
  .footer-wrapper,
  .cart-drawer,
  .cart-drawer-overlay,
  .no-print,
  .table-scroll-hint {
    display: none !important;
    visibility: hidden !important;
  }

  /* 2. Pristine white paper background without browser margins interference */
  html,
  body {
    background: #ffffff !important;
    background-color: #ffffff !important;
    color: #0f172a !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* 3. Modal Backdrop becomes a clean normal flow wrapper */
  .invoice-modal-backdrop {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
  }

  /* 4. Invoice container */
  .invoice-modal-container {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    overflow: visible !important;
    max-height: none !important;
  }

  /* 5. Clean A4 Invoice Sheet */
  .printable-invoice-sheet {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    padding: 8mm 12mm !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 6px !important;
    box-shadow: none !important;
    color: #0f172a !important;
    background: #ffffff !important;
    font-size: 9.5pt !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-after: avoid;
    overflow: visible !important;
  }

  /* Ensure pristine 2-column format on paper even if printed from mobile device */
  .inv-header {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 2rem !important;
  }

  .inv-title-col {
    text-align: right !important;
    align-items: flex-end !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .inv-meta-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 0.75rem !important;
    padding: 0.75rem 1rem !important;
  }

  .inv-parties-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 1.25rem !important;
  }

  .inv-table-wrapper {
    overflow: visible !important;
    page-break-inside: auto;
    border: 1px solid #cbd5e1 !important;
  }

  .inv-table {
    min-width: 100% !important;
    width: 100% !important;
  }

  .inv-table tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }

  .inv-summary-row {
    display: grid !important;
    grid-template-columns: 1.2fr 1fr !important;
    gap: 1.25rem !important;
  }

  .inv-footer {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: flex-end !important;
    gap: 2rem !important;
  }

  .footer-legal {
    max-width: 60% !important;
  }

  @page {
    size: A4 portrait;
    margin: 8mm 10mm;
  }
}
</style>
