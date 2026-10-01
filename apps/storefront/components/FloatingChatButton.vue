<template>
  <div
    class="floating-chat-container"
    :class="{
      'is-active': isMenuOpen,
      'is-checkout': isCheckoutPage,
      'has-sticky-bar': hasStickyBottomBar
    }"
  >
    <!-- Quick Action Popover Menu -->
    <Transition name="fab-menu">
      <div v-if="isMenuOpen" class="fab-menu-popover cyber-card" ref="menuRef">
        <div class="fab-menu-header">
          <div class="header-avatar-box">
            <div class="avatar-ring">
              <Icon name="lucide:headset" class="w-5 h-5 text-white" />
            </div>
            <span class="online-indicator"></span>
          </div>
          <div class="header-text-group">
            <h4 class="menu-title">BSI Care & CS Online</h4>
            <p class="menu-subtitle">Siap membantu konsultasi & kendala Anda</p>
          </div>
          <button type="button" class="btn-close-popover" @click="isMenuOpen = false" aria-label="Tutup Menu">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <div class="fab-menu-body">
          <!-- Option 1: Live Chat CS -->
          <button type="button" class="fab-menu-item item-chat" @click="handleOpenCS('chat')">
            <div class="item-icon-box bg-blue">
              <Icon name="lucide:message-square-text" class="w-4 h-4 text-blue-600" />
            </div>
            <div class="item-info">
              <span class="item-title">Live Chat CS & Bantuan</span>
              <span class="item-desc">Respon cepat dari customer support kami</span>
            </div>
            <Icon name="lucide:chevron-right" class="w-4 h-4 item-arrow" />
          </button>

          <!-- Option 2: WhatsApp Chat -->
          <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="fab-menu-item item-wa" @click="isMenuOpen = false">
            <div class="item-icon-box bg-emerald">
              <Icon name="lucide:phone-call" class="w-4 h-4 text-emerald-600" />
            </div>
            <div class="item-info">
              <span class="item-title">WhatsApp Resmi</span>
              <span class="item-desc">Hubungi via admin WhatsApp 08.00 - 21.00</span>
            </div>
            <Icon name="lucide:external-link" class="w-3.5 h-3.5 item-arrow" />
          </a>

          <!-- Option 3: FAQ & Solusi Cepat -->
          <button type="button" class="fab-menu-item item-faq" @click="handleOpenCS('faq')">
            <div class="item-icon-box bg-amber">
              <Icon name="lucide:help-circle" class="w-4 h-4 text-amber-600" />
            </div>
            <div class="item-info">
              <span class="item-title">Tanya Jawab (FAQ)</span>
              <span class="item-desc">Jawaban seputar pembayaran & pesanan</span>
            </div>
            <Icon name="lucide:chevron-right" class="w-4 h-4 item-arrow" />
          </button>
        </div>

        <div class="fab-menu-footer">
          <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-blue-600 inline mr-1" />
          <span>Layanan Resmi {{ storeName }}</span>
        </div>
      </div>
    </Transition>

    <!-- Welcome Tooltip Bubble (Auto-shows initially or on hover) -->
    <Transition name="fade-bubble">
      <div v-if="showGreeting && !isMenuOpen" class="fab-greeting-bubble" @click="toggleMenu">
        <div class="bubble-content">
          <div class="bubble-tag">
            <span class="pulse-dot"></span>
            <span>CS Online</span>
          </div>
          <p class="bubble-text">Butuh bantuan konsultasi atau komplain?</p>
        </div>
        <button type="button" class="btn-dismiss-bubble" @click.stop="dismissGreeting" aria-label="Tutup Pesan">
          <Icon name="lucide:x" class="w-3 h-3" />
        </button>
      </div>
    </Transition>

    <!-- Main Floating Action Button (FAB) -->
    <button
      type="button"
      class="fab-trigger-btn"
      :class="{ 'is-open': isMenuOpen }"
      @click="toggleMenu"
      aria-label="Pusat Bantuan & Live Chat CS"
      :title="isMenuOpen ? 'Tutup Pilihan Chat' : 'Buka Layanan Chat & Bantuan'"
    >
      <div class="fab-icon-wrapper">
        <Transition name="fab-icon-swap" mode="out-in">
          <Icon v-if="isMenuOpen" name="lucide:x" class="w-6 h-6 fab-icon" />
          <Icon v-else name="lucide:message-circle" class="w-6 h-6 fab-icon" />
        </Transition>
      </div>
      
      <!-- Online Pulse Badge -->
      <span class="fab-online-badge" title="Customer Service Aktif">
        <span class="pulse-ring"></span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCustomerService } from '~/composables/useCustomerService'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const { openCustomerService } = useCustomerService()
const { fetchStoreInfo } = useApi()

// Cek apakah halaman checkout untuk menghindari tumpang tindih dengan floating bar
const isCheckoutPage = computed(() => {
  return route?.path?.startsWith('/checkout') || false
})

// Cek apakah halaman detail produk yang memiliki sticky bottom bar
const hasStickyBottomBar = computed(() => {
  return route?.path?.startsWith('/products/') || false
})

// Dynamic Store Info with SSR support
const { data: storeInfoData } = await useAsyncData('fab_store_info', () => fetchStoreInfo())

const storeName = ref('BSI Cyber Store')
const storePhone = ref('(021) 7867868')

const applyStoreInfo = (info: any) => {
  if (!info) return
  const name = info.store_name || info.name
  if (name) storeName.value = name
  if (info.store_phone) storePhone.value = info.store_phone
}

if (storeInfoData.value) {
  applyStoreInfo(storeInfoData.value)
}

watch(
  storeInfoData,
  (newData) => {
    if (newData) applyStoreInfo(newData)
  },
  { deep: true }
)

const isMenuOpen = ref(false)
const showGreeting = ref(false)
const menuRef = ref<HTMLElement | null>(null)

// WhatsApp resmi URL dinamis
const whatsappUrl = computed(() => {
  const phone = storePhone.value?.replace(/\D/g, '') || '6281234567890'
  const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone
  const msg = encodeURIComponent(`Halo Admin ${storeName.value}, saya ingin konsultasi atau ada pertanyaan.`)
  return `https://wa.me/${cleanPhone}?text=${msg}`
})

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  if (isMenuOpen.value) {
    showGreeting.value = false
  }
}

const handleOpenCS = (tab: 'chat' | 'contact' | 'faq' = 'chat') => {
  isMenuOpen.value = false
  showGreeting.value = false
  openCustomerService({ tab })
}

const dismissGreeting = () => {
  showGreeting.value = false
  if (import.meta.client) {
    sessionStorage.setItem('cs_greeting_dismissed', 'true')
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (isMenuOpen.value && menuRef.value && !menuRef.value.contains(e.target as Node)) {
    const target = e.target as HTMLElement
    if (!target.closest('.fab-trigger-btn')) {
      isMenuOpen.value = false
    }
  }
}

onMounted(() => {
  if (import.meta.client) {
    document.addEventListener('click', handleClickOutside)
    
    // Tampilkan bubble sapaan setelah 2 detik jika belum pernah di-dismiss
    const dismissed = sessionStorage.getItem('cs_greeting_dismissed')
    if (!dismissed) {
      setTimeout(() => {
        showGreeting.value = true
      }, 2000)
    }
  }
})

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside)
  }
})
</script>

<style scoped>
.floating-chat-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 990;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  font-family: inherit;
}

.floating-chat-container * {
  pointer-events: auto;
}

/* ═══════════════════════════════════════
   MAIN FAB BUTTON
═══════════════════════════════════════ */
.fab-trigger-btn {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #002b66 100%);
  border: 2px solid rgba(255, 255, 255, 0.4);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 8px 24px rgba(0, 74, 173, 0.4),
    0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  outline: none;
}

.fab-trigger-btn:hover {
  transform: scale(1.08) translateY(-2px);
  background: linear-gradient(135deg, #0056cc 0%, #003380 100%);
  box-shadow:
    0 12px 28px rgba(0, 74, 173, 0.5),
    0 4px 10px rgba(0, 0, 0, 0.2);
}

.fab-trigger-btn:active {
  transform: scale(0.95);
}

.fab-trigger-btn.is-open {
  background: #1e293b;
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.4);
}

.fab-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-icon {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

/* Online status indicator dot */
.fab-online-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
}

.pulse-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.5);
  animation: pulseAnimation 2s infinite ease-out;
}

@keyframes pulseAnimation {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
}

/* ═══════════════════════════════════════
   GREETING TOOLTIP BUBBLE
═══════════════════════════════════════ */
.fab-greeting-bubble {
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid rgba(0, 74, 173, 0.15);
  border-radius: 14px;
  padding: 0.65rem 0.85rem;
  box-shadow:
    0 10px 25px -5px rgba(15, 23, 42, 0.15),
    0 4px 10px -2px rgba(0, 74, 173, 0.1);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  max-width: 260px;
  animation: floatBounce 4s ease-in-out infinite;
}

@keyframes floatBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.bubble-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.bubble-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #059669;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 4px #10b981;
}

.bubble-text {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.35;
}

.btn-dismiss-bubble {
  background: #f1f5f9;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-dismiss-bubble:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* ═══════════════════════════════════════
   FAB MENU POPOVER
═══════════════════════════════════════ */
.fab-menu-popover {
  position: absolute;
  bottom: calc(100% + 12px);
  right: 0;
  width: 320px;
  max-width: 90vw;
  background: #ffffff;
  border: 1px solid rgba(0, 74, 173, 0.15);
  border-radius: 18px;
  box-shadow:
    0 20px 40px -10px rgba(15, 23, 42, 0.2),
    0 8px 16px -4px rgba(0, 74, 173, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fab-menu-header {
  padding: 1rem 1.15rem;
  background: linear-gradient(135deg, #004aad 0%, #002b66 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
}

.header-avatar-box {
  position: relative;
}

.avatar-ring {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #002b66;
}

.header-text-group {
  flex: 1;
}

.menu-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #ffffff;
}

.menu-subtitle {
  margin: 0;
  font-size: 0.72rem;
  color: #dbeafe;
  line-height: 1.3;
}

.btn-close-popover {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-close-popover:hover {
  background: rgba(255, 255, 255, 0.25);
}

.fab-menu-body {
  padding: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: #ffffff;
}

.fab-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  background: #ffffff;
  color: #0f172a;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  text-align: left;
}

.fab-menu-item:hover {
  background: #f8fafc;
  border-color: rgba(0, 74, 173, 0.2);
  transform: translateX(3px);
}

.item-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-blue { background: #eff6ff; }
.bg-emerald { background: #ecfdf5; }
.bg-amber { background: #fffbeb; }

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.item-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
}

.item-desc {
  font-size: 0.7rem;
  color: #64748b;
  line-height: 1.3;
}

.item-arrow {
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.fab-menu-item:hover .item-arrow {
  transform: translateX(2px);
  color: #004aad;
}

.fab-menu-footer {
  padding: 0.6rem 1rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  font-size: 0.68rem;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* ═══════════════════════════════════════
   TRANSITIONS
═══════════════════════════════════════ */
.fab-menu-enter-active,
.fab-menu-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.fab-menu-enter-from,
.fab-menu-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

.fade-bubble-enter-active,
.fade-bubble-leave-active {
  transition: all 0.3s ease;
}

.fade-bubble-enter-from,
.fade-bubble-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.fab-icon-swap-enter-active,
.fab-icon-swap-leave-active {
  transition: all 0.15s ease;
}

.fab-icon-swap-enter-from,
.fab-icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.6) rotate(90deg);
}

/* ═══════════════════════════════════════
   RESPONSIVE ADJUSTMENTS (Mobile)
═══════════════════════════════════════ */
@media (max-width: 768px) {
  .floating-chat-container {
    bottom: 20px;
    right: 16px;
  }

  /* Sembunyikan FAB pada halaman checkout mobile agar tidak menutupi tombol 'Bayar Sekarang' */
  .floating-chat-container.is-checkout {
    display: none !important;
  }

  /* Angkat FAB pada halaman detail produk agar berada di atas sticky product bar */
  .floating-chat-container.has-sticky-bar {
    bottom: calc(75px + env(safe-area-inset-bottom, 0px));
  }

  .fab-trigger-btn {
    width: 50px;
    height: 50px;
  }

  .fab-menu-popover {
    width: 290px;
    right: 0;
  }

  .fab-greeting-bubble {
    max-width: 230px;
  }
}
</style>
