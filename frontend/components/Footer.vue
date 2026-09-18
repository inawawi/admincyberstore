<template>
  <footer class="footer-wrapper">
    <div class="container footer-container">
      <div class="footer-grid">
        <!-- Col 1: Brand & Kontak Resmi Kampus -->
        <div class="footer-col brand-col">
          <div class="footer-logo">
            <div class="logo-icon-box">
              <img :src="storeLogo || '/logo-cyberstore.jpg'" :alt="storeName || 'BSI Cyber Store'" class="logo-img" />
            </div>
            <span class="logo-main"><span class="text-gold">BSI</span> CYBER<span class="text-white">STORE</span></span>
          </div>
          <p class="brand-desc">
            Platform e-commerce resmi civitas akademika Universitas Bina Sarana Informatika untuk perlengkapan kuliah,
            gadget
            teknologi terstandar, dan merchandise kampus original bergaransi resmi.
          </p>

          <!-- Store Contact Info from API -->
          <div class="footer-contact-info">
            <div v-if="storeAddress" class="contact-item">
              <Icon name="lucide:map-pin" class="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <span>{{ storeAddress }}</span>
            </div>
            <div class="contact-row">
              <div v-if="storePhone" class="contact-item">
                <Icon name="lucide:phone" class="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span>{{ storePhone }}</span>
              </div>
              <div v-if="storeEmail" class="contact-item">
                <Icon name="lucide:mail" class="w-3.5 h-3.5 text-gold flex-shrink-0" />
                <span>{{ storeEmail }}</span>
              </div>
            </div>
          </div>

          <div class="security-badges">
            <div class="badge badge-gold inline-flex items-center gap-1">
              <Icon name="lucide:lock" class="w-3.5 h-3.5" />
              <span>SSL 256-Bit Terenkripsi</span>
            </div>
            <div class="badge badge-cyan inline-flex items-center gap-1">
              <Icon name="lucide:shield-check" class="w-3.5 h-3.5" />
              <span>100% Produk Resmi</span>
            </div>
          </div>
        </div>

        <!-- Col 2: Navigasi Menu Aktif Sesuai Database -->
        <div class="footer-col">
          <h4 class="footer-title">Navigasi Toko</h4>
          <ul class="footer-links">
            <li>
              <NuxtLink to="/">Beranda Utama</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/products">Katalog Lengkap</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/products?is_event_maba=1" class="link-maba">
                <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1 text-gold" />
                <span>Event Maba (Ormik & Semot)</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/products?is_recommended=1">
                <Icon name="lucide:zap" class="w-3.5 h-3.5 inline mr-1 text-cyan" />
                <span>Cyber Picks Rekomendasi</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart">Keranjang Belanja</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/account/orders">Pesanan Saya</NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Col 3: Pusat Bantuan & CS (Langsung Terhubung ke CustomerServiceModal) -->
        <div class="footer-col">
          <h4 class="footer-title">Pusat Bantuan</h4>
          <ul class="footer-links">
            <li>
              <button type="button" class="footer-btn-link" @click="openCustomerService({ tab: 'chat' })">
                <Icon name="lucide:message-square-text" class="w-3.5 h-3.5 text-cyan" />
                <span>Live Chat Admin CS</span>
              </button>
            </li>
            <li>
              <button type="button" class="footer-btn-link" @click="openCustomerService({ tab: 'contact' })">
                <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-emerald" />
                <span>Kontak WhatsApp Resmi</span>
              </button>
            </li>
            <li>
              <button type="button" class="footer-btn-link" @click="openCustomerService({ tab: 'faq' })">
                <Icon name="lucide:help-circle" class="w-3.5 h-3.5 text-gold" />
                <span>Tanya Jawab (FAQ)</span>
              </button>
            </li>
            <li>
              <NuxtLink to="/account/orders">
                <Icon name="lucide:truck" class="w-3.5 h-3.5 inline mr-1" />
                <span>Cek Status & Lacak Resi</span>
              </NuxtLink>
            </li>
            <li>
              <button type="button" class="footer-btn-link" @click="openCustomerService({ tab: 'contact' })">
                <Icon name="lucide:phone-call" class="w-3.5 h-3.5" />
                <span>Call Center Kampus</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Col 4: Metode Pembayaran & Kurir Ekspedisi Resmi -->
        <div class="footer-col">
          <h4 class="footer-title">Pembayaran & Ekspedisi</h4>
          <p class="text-sub">
            Pembayaran otomatis terverifikasi via Midtrans Gateway dan didukung oleh ekspedisi kurir terpercaya.
          </p>

          <div class="partner-group">
            <span class="partner-subtitle">METODE PEMBAYARAN</span>
            <div class="partner-chips">
              <span class="partner-chip chip-pay">QRIS (Gopay/Dana/OVO)</span>
              <span class="partner-chip chip-pay">Mandiri VA</span>
              <span class="partner-chip chip-pay">BCA VA</span>
              <span class="partner-chip chip-pay">BRI VA</span>
              <span class="partner-chip chip-pay">BNI VA</span>
            </div>
          </div>

          <div class="partner-group" style="margin-top: 0.85rem;">
            <span class="partner-subtitle">JASA EKSPEDISI RESMI</span>
            <div class="partner-chips">
              <span class="partner-chip">JNE Express</span>
              <span class="partner-chip">SiCepat</span>
              <span class="partner-chip">TIKI</span>
              <span class="partner-chip">J&T Express</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <p>© Powered by BTI-BSI 2026.</p>
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span>Sistem E-Commerce Terhubung (Online)</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCustomerService } from '~/composables/useCustomerService'
import { useApi } from '~/composables/useApi'

const { openCustomerService } = useCustomerService()
const { fetchStoreInfo, getImageUrl } = useApi()

const storeLogo = ref('/logo-cyberstore.jpg')
const storeName = ref('BSI Cyber Store')
const storeAddress = ref('Jl. Dewi Sartika No.77, Cawang, Jakarta Timur')
const storePhone = ref('(021) 7867868')
const storeEmail = ref('support@bsi.ac.id')

onMounted(async () => {
  try {
    const info = await fetchStoreInfo()
    if (info) {
      if (info.store_logo || info.logo) storeLogo.value = getImageUrl(info.store_logo || info.logo)
      if (info.store_name || info.name) storeName.value = info.store_name || info.name
      if (info.store_address) storeAddress.value = info.store_address
      if (info.store_phone) storePhone.value = info.store_phone
      if (info.store_email) storeEmail.value = info.store_email
    }
  } catch (e) {
    // Ignore error
  }
})
</script>

<style scoped>
.footer-wrapper {
  background: linear-gradient(180deg, #001f5c 0%, #001133 100%);
  border-top: 4px solid #003399;
  padding: 4rem 0 2rem;
  margin-top: 5rem;
  color: #ffffff;
}

.footer-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1.1fr 1.2fr 1.7fr;
  gap: 2.5rem;
}

.brand-col {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  padding: 2px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 7px;
}

.logo-main {
  font-family: var(--font-display, inherit);
  font-weight: 800;
  font-size: 1.3rem;
  letter-spacing: 0.05em;
  color: #ffffff;
}

.text-gold {
  color: #f59e0b;
}

.text-cyan {
  color: #00d2ff;
}

.text-white {
  color: #ffffff;
}

.brand-desc {
  font-size: 0.85rem;
  color: #bfdbfe;
  line-height: 1.6;
  max-width: 360px;
  margin: 0;
}

.footer-contact-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.75rem 0.85rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 0.45rem;
  line-height: 1.4;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.security-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
}

.badge-gold {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid #f59e0b;
  color: #fbbf24;
}

.badge-cyan {
  background: rgba(0, 210, 255, 0.15);
  border: 1px solid #00d2ff;
  color: #38bdf8;
}

.footer-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 1.25rem;
  letter-spacing: 0.03em;
  border-bottom: 2px solid #004aad;
  padding-bottom: 0.4rem;
  display: inline-block;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.footer-links a,
.footer-btn-link {
  font-size: 0.85rem;
  color: #cbd5e1;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: inherit;
  transition: all 0.2s ease;
  text-align: left;
}

.footer-links a:hover,
.footer-btn-link:hover {
  color: #f59e0b;
  padding-left: 4px;
}

.link-maba {
  color: #fde68a !important;
}

.partner-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.partner-subtitle {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.text-sub {
  font-size: 0.825rem;
  color: #bfdbfe;
  margin-bottom: 0.85rem;
  line-height: 1.5;
}

.partner-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.partner-chip {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  color: #e2e8f0;
}

.chip-pay {
  background: rgba(0, 74, 173, 0.35);
  border-color: rgba(0, 74, 173, 0.6);
  color: #93c5fd;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #94a3b8;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #34d399;
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #34d399;
  border-radius: 50%;
  box-shadow: 0 0 8px #34d399;
}

@media (max-width: 1024px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
