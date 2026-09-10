<template>
  <div class="product-chat-page container">
    <!-- Breadcrumbs -->
    <div class="breadcrumb">
      <NuxtLink to="/">Beranda</NuxtLink>
      <span>/</span>
      <NuxtLink to="/products">Katalog</NuxtLink>
      <span>/</span>
      <NuxtLink v-if="product" :to="`/products/${productId}`">{{ product.name }}</NuxtLink>
      <span v-if="product">/</span>
      <span class="current">Chat Toko & Tanya Stok</span>
    </div>

    <!-- Loading State -->
    <div v-if="pending && !product" class="chat-loading-box cyber-card">
      <CyberLoader text="MEMUAT RUANG CHAT TOKO..." subtext="Menghubungkan ke server penjual BSI Cyber Store..." size="lg" />
    </div>

    <!-- Product Not Found State -->
    <div v-else-if="!product" class="not-found-box cyber-card">
      <div class="empty-icon">
        <Icon name="lucide:package-x" class="w-12 h-12 text-slate-400" />
      </div>
      <h2>Produk Tidak Ditemukan</h2>
      <p>Produk yang ingin Anda tanyakan tidak ditemukan atau tautan sudah kedaluwarsa.</p>
      <NuxtLink to="/products" class="btn btn-primary">Kembali ke Katalog</NuxtLink>
    </div>

    <!-- Main Chat Workspace -->
    <div v-else class="chat-workspace">
      <!-- Top Store Info Banner (Shopee / Tokopedia Style) -->
      <div class="store-chat-header cyber-card">
        <div class="store-header-left">
          <div class="store-avatar-box">
            <img
              :src="storeInfo?.store_logo ? getImageUrl(storeInfo.store_logo) : '/logo-cyberstore.jpg'"
              :alt="storeInfo?.store_name || 'BSI Cyber Store Official'"
              class="store-avatar-img"
              @error="(e: any) => { if (e.target) e.target.src = '/logo-cyberstore.jpg' }"
            />
            <span class="store-online-dot" title="Toko Online"></span>
          </div>

          <div class="store-meta-box">
            <div class="store-title-row">
              <h2 class="store-name">{{ storeInfo?.store_name || 'BSI Cyber Store Official' }}</h2>
              <span class="badge-official">
                <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-1 text-white" />
                Official Store
              </span>
            </div>
            <div class="store-stats-row">
              <span class="store-stat-pill text-emerald">
                <span class="dot-pulse"></span>
                Online • Fast Response
              </span>
              <span class="stat-dot">•</span>
              <span class="store-stat-pill">
                <Icon name="lucide:star" class="w-3 h-3 text-amber-500 fill-amber-500 inline mr-0.5" />
                4.9 (100+ Ulasan)
              </span>
              <span class="stat-dot">•</span>
              <span class="store-stat-pill">
                <Icon name="lucide:map-pin" class="w-3 h-3 text-blue-600 inline mr-0.5" />
                {{ storeInfo?.store_city_name || 'Kota Jakarta Timur' }}
              </span>
            </div>
          </div>
        </div>

        <div class="store-header-right">
          <NuxtLink :to="`/products/${productId}`" class="btn btn-secondary btn-back-product" title="Kembali ke Halaman Detail Produk">
            <Icon name="lucide:arrow-left" class="w-4 h-4 mr-1.5" />
            <span>Kembali ke Produk</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Pinned Product Information Bar -->
      <div class="pinned-product-bar cyber-card">
        <div class="pinned-product-img-box">
          <img
            :src="getImageUrl(product.main_photo)"
            :alt="product.name"
            class="pinned-product-img"
            @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }"
          />
        </div>

        <div class="pinned-product-info">
          <div class="pinned-title-row">
            <span class="badge badge-cyan">{{ product.category?.name || 'Tech & Apparel' }}</span>
            <span :class="['stock-pill', product.stock > 0 ? 'in-stock' : 'out-stock']">
              {{ product.stock > 0 ? `Stok: ${product.stock} unit` : 'Stok Habis' }}
            </span>
            <span v-if="selectedVariantLabel" class="variant-pill">
              <Icon name="lucide:sliders-horizontal" class="w-3 h-3 inline mr-1 text-bsi" />
              {{ selectedVariantLabel }}
            </span>
          </div>

          <h3 class="pinned-product-name">{{ product.name }}</h3>

          <div class="pinned-price-row">
            <span class="pinned-price-main">{{ formatRupiah(product.price) }}</span>
            <span v-if="product.original_price && product.original_price > product.price" class="pinned-price-strike">
              {{ formatRupiah(product.original_price) }}
            </span>
          </div>
        </div>

        <div class="pinned-product-actions">
          <NuxtLink :to="`/products/${productId}`" class="btn btn-outline-product" title="Lihat Spesifikasi & Foto">
            <Icon name="lucide:external-link" class="w-4 h-4" />
            <span class="action-btn-text">Detail Produk</span>
          </NuxtLink>
          <button
            type="button"
            @click="handleQuickBuy"
            :disabled="product.stock <= 0"
            class="btn btn-primary btn-quick-buy"
            title="Langsung Beli Produk Ini"
          >
            <Icon name="lucide:shopping-bag" class="w-4 h-4" />
            <span class="action-btn-text">Beli Sekarang</span>
          </button>
        </div>
      </div>

      <!-- Chat Thread Card -->
      <div class="chat-thread-card cyber-card">
        <!-- Chat Header Strip -->
        <div class="chat-thread-header">
          <div class="thread-header-title">
            <Icon name="lucide:message-square" class="w-4 h-4 text-bsi" />
            <h4>Ruang Chat Toko Resmi (Khusus Produk Ini)</h4>
          </div>
          <span class="thread-header-badge">Terpisah dari Pusat Bantuan</span>
        </div>

        <!-- Unauthenticated Guest State -->
        <div v-if="!authStore.isAuthenticated" class="chat-unauth-box">
          <div class="unauth-icon-circle">
            <Icon name="lucide:lock" class="w-8 h-8 text-bsi" />
          </div>
          <h3>Masuk Akun untuk Chat dengan Toko</h3>
          <p>Silakan masuk ke akun Anda agar pertanyaan stok dan riwayat obrolan dengan penjual tersimpan aman.</p>

          <div class="unauth-actions-group">
            <NuxtLink :to="`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`" class="btn btn-primary btn-login-chat">
              <Icon name="lucide:log-in" class="w-4 h-4 mr-1.5" />
              <span>Masuk ke Akun</span>
            </NuxtLink>

            <a :href="whatsappUrl" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp-product">
              <Icon name="lucide:message-circle" class="w-4 h-4 mr-1.5" />
              <span>Tanya via WhatsApp Resmi (Tanpa Login)</span>
            </a>
          </div>
        </div>

        <!-- Authenticated Active Chat Container -->
        <div v-else class="chat-conversation-container">
          <!-- Messages Scroll View -->
          <div ref="messagesScrollBox" class="chat-messages-scroll-area">
            <!-- Welcome Bot Greeting for this product -->
            <div class="chat-bubble store-bubble welcome-bubble">
              <div class="bubble-sender-row">
                <span class="sender-badge-store">
                  <Icon name="lucide:bot" class="w-3.5 h-3.5 inline mr-1 text-bsi" />
                  Bot Toko & Admin Cyber Store
                </span>
                <span class="bubble-time-text">Sistem Otomatis</span>
              </div>
              <div class="bubble-body-content">
                Halo <strong>{{ authStore.user?.name || 'Kak' }}</strong>! Ada yang bisa kami bantu seputar stok produk <strong>"{{ product.name }}"</strong>?
                <br />
                <span class="sub-text">
                  Kirim pertanyaan Anda di bawah ini, bot kami akan mengecek ketersediaan stok fisik di gudang secara langsung.
                </span>
              </div>
            </div>

            <!-- List of Chat Messages in this Product Thread -->
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="chat-bubble"
              :class="msg.sender_type === 'customer' ? 'user-bubble' : 'store-bubble'"
            >
              <div v-if="msg.sender_type !== 'customer'" class="bubble-sender-row">
                <span class="sender-badge-store">
                  <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-1 text-bsi" />
                  Admin BSI Cyber Store
                </span>
                <span class="bubble-time-text">{{ formatMsgTime(msg.created_at) }}</span>
              </div>

              <div class="bubble-body-content" style="white-space: pre-line;">
                {{ msg.message }}
              </div>

              <div v-if="msg.sender_type === 'customer'" class="bubble-meta-customer">
                <span class="bubble-time-text">{{ formatMsgTime(msg.created_at) }}</span>
                <Icon name="lucide:check-check" class="w-3.5 h-3.5 text-blue-300 inline ml-1" />
              </div>
            </div>

            <!-- Bot / Toko Typing Indicator -->
            <div v-if="isSending" class="chat-bubble store-bubble typing-bubble">
              <div class="typing-indicator-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="typing-label">Toko sedang mengecek stok & membalas...</span>
            </div>
          </div>

          <!-- Quick Action Prompts (Tanya Cepat) -->
          <div class="chat-quick-prompts-bar">
            <span class="quick-prompt-label">Tanya Cepat:</span>
            <div class="quick-prompts-track">
              <button
                v-for="(prompt, idx) in quickPrompts"
                :key="idx"
                type="button"
                class="quick-chip-btn"
                @click="handleSendQuickPrompt(prompt)"
                :disabled="isSending"
              >
                {{ prompt }}
              </button>
            </div>
          </div>

          <!-- Message Input Box -->
          <form @submit.prevent="handleSendMessage" class="chat-input-form-bar">
            <input
              v-model="inputMessage"
              type="text"
              placeholder="Tulis pertanyaan seputar stok, ukuran, atau pengiriman ke penjual..."
              class="chat-input-field"
              :disabled="isSending"
            />
            <button
              type="submit"
              class="btn-send-message"
              :disabled="!inputMessage.trim() || isSending"
              title="Kirim Pesan ke Penjual"
              aria-label="Kirim Pesan"
            >
              <Icon v-if="!isSending" name="lucide:send" class="w-5 h-5" />
              <span v-else class="btn-spinner"></span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'

definePageMeta({
  path: '/products/:id/chat',
  alias: ['/chat/:id', '/chat/product/:id'],
})

const route = useRoute()
const router = useRouter()
const { fetchProductDetail, fetchStoreInfo, fetchChats, createChat, fetchChatMessages, sendChatMessage, getImageUrl } = useApi()
const { formatRupiah } = useFormat()
const authStore = useAuthStore()
const cartStore = useCartStore()

const productId = computed(() => String(route.params.id))
const selectedSize = computed(() => (route.query.size ? String(route.query.size) : null))
const selectedColor = computed(() => (route.query.color ? String(route.query.color) : null))

// Selected variant text pill
const selectedVariantLabel = computed(() => {
  const parts: string[] = []
  if (selectedSize.value) parts.push(`Ukuran: ${selectedSize.value}`)
  if (selectedColor.value) parts.push(`Warna: ${selectedColor.value}`)
  return parts.length > 0 ? parts.join(' • ') : null
})

// 1. Fetch Product Detail
const { data: detailData, pending } = await useAsyncData(
  `chat-product-${productId.value}`,
  () => fetchProductDetail(productId.value),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)

const product = computed(() => {
  if (!detailData.value) return null
  return detailData.value.product || detailData.value
})

// 2. Fetch Store Info
const { data: storeInfoData } = await useAsyncData(
  'chat-store-info',
  () => fetchStoreInfo(),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)
const storeInfo = computed(() => storeInfoData.value || null)

// Chat State
const activeChatId = ref<number | null>(null)
const messages = ref<any[]>([])
const inputMessage = ref('')
const isSending = ref(false)
const messagesScrollBox = ref<HTMLElement | null>(null)
let pollTimer: any = null

// Quick prompt suggestions
const quickPrompts = computed(() => {
  const list = [
    'Apakah produk ini masih ready stok?',
    'Bisa dikirim hari ini?',
    'Apakah produk ini original & bergaransi?',
  ]
  if (selectedSize.value) {
    list.unshift(`Apakah ukuran ${selectedSize.value} masih tersedia?`)
  }
  return list
})

// WhatsApp fallback URL for guests or direct contact
const whatsappUrl = computed(() => {
  const baseWa = storeInfo.value?.store_phone
    ? `https://wa.me/${storeInfo.value.store_phone.replace(/[^0-9]/g, '')}`
    : 'https://wa.me/628123456789'
  const productName = product.value?.name || 'Produk'
  const variantHint = selectedVariantLabel.value ? ` (${selectedVariantLabel.value})` : ''
  const text = encodeURIComponent(
    `Halo BSI Cyber Store, saya ingin menanyakan ketersediaan stok untuk produk "${productName}"${variantHint}. Apakah masih ready?`
  )
  return `${baseWa}?text=${text}`
})

// Set initial prefilled message
const setupDefaultMessage = () => {
  if (product.value && !inputMessage.value) {
    const variantHint = selectedVariantLabel.value ? ` (${selectedVariantLabel.value})` : ''
    inputMessage.value = `Halo Admin Toko, saya ingin menanyakan ketersediaan stok untuk produk "${product.value.name}"${variantHint}. Apakah stoknya masih tersedia?`
  }
}

// Load or create chat thread specifically for this product
const loadProductChat = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const res = await fetchChats()
    const chats = res?.chats || []
    // Cari percakapan aktif yang terikat dengan product_id ini
    const existing = chats.find((c: any) => String(c.product_id) === String(productId.value) && c.status === 'open')
    if (existing) {
      activeChatId.value = existing.id
      await loadMessages(existing.id)
    }
  } catch (e) {
    console.warn('Gagal memuat riwayat chat produk:', e)
  }
}

const loadMessages = async (chatId: number) => {
  try {
    const res = await fetchChatMessages(chatId)
    if (res?.messages) {
      messages.value = res.messages
      scrollToBottom()
    }
  } catch (e) {
    console.warn('Gagal memuat pesan:', e)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesScrollBox.value) {
      messagesScrollBox.value.scrollTop = messagesScrollBox.value.scrollHeight
    }
  })
}

const formatMsgTime = (dt?: string) => {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const handleSendQuickPrompt = (prompt: string) => {
  inputMessage.value = prompt
  handleSendMessage()
}

const handleSendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text || isSending.value || !product.value) return

  isSending.value = true
  inputMessage.value = ''

  // Optimistic UI append
  messages.value.push({
    id: Date.now(),
    sender_type: 'customer',
    message: text,
    created_at: new Date().toISOString(),
  })
  scrollToBottom()

  try {
    if (!activeChatId.value) {
      // Buat thread chat baru khusus untuk produk ini
      const res = await createChat({
        product_id: product.value.id,
        subject: `Tanya stok: ${product.value.name}`,
        message: text,
      })
      if (res?.chat?.id) {
        activeChatId.value = res.chat.id
      }
    } else {
      // Kirim pesan lanjutan pada thread produk yang sedang aktif
      await sendChatMessage(activeChatId.value, text, product.value.id)
    }

    // Tunggu respon bot otomatis dari server (1.2 detik)
    setTimeout(async () => {
      if (activeChatId.value) {
        await loadMessages(activeChatId.value)
      }
      isSending.value = false
    }, 1200)
  } catch (e) {
    console.warn('Gagal mengirim pesan chat:', e)
    isSending.value = false
  }
}

// Quick Buy Action
const handleQuickBuy = () => {
  if (!product.value || product.value.stock <= 0) return
  cartStore.addToCart(
    product.value,
    1,
    selectedSize.value,
    selectedColor.value
  )
  router.push('/cart')
}

// Lifecycle Hooks & Polling
onMounted(async () => {
  setupDefaultMessage()
  if (authStore.isAuthenticated) {
    await loadProductChat()

    // Polling setiap 5 detik untuk menerima balasan admin/bot
    pollTimer = setInterval(async () => {
      if (activeChatId.value && !isSending.value) {
        await loadMessages(activeChatId.value)
      }
    }, 5000)
  }
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// Dynamic SEO
useHead({
  title: computed(() => (product.value ? `Chat Toko: ${product.value.name} | Cyber Store` : 'Chat Toko | Cyber Store')),
  meta: [
    {
      name: 'description',
      content: computed(() => (product.value ? `Hubungi penjual dan tanyakan ketersediaan stok ${product.value.name} di BSI Cyber Store.` : 'Chat dengan toko resmi Cyber Store.')),
    },
  ],
})
</script>

<style scoped>
/* Base Container */
.product-chat-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1080px;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.breadcrumb a {
  transition: color 0.2s ease;
}

.breadcrumb a:hover {
  color: #003399;
}

.breadcrumb .current {
  color: #0f172a;
  font-weight: 700;
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Loading & Not Found */
.chat-loading-box,
.not-found-box {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  gap: 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

/* Workspace */
.chat-workspace {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 1. Store Header Bar */
.store-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  flex-wrap: wrap;
  gap: 1rem;
}

.store-header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.store-avatar-box {
  position: relative;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  padding: 2px;
  background: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 51, 153, 0.1);
}

.store-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.store-online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.store-meta-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.store-title-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.store-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.badge-official {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
}

.store-stats-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.775rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.dot-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  display: inline-block;
  margin-right: 3px;
}

.stat-dot {
  color: #cbd5e1;
}

.btn-back-product {
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  color: #334155;
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-back-product:hover {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
}

/* 2. Pinned Product Bar */
.pinned-product-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.15rem 1.5rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
}

.pinned-product-img-box {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-sm);
  background: #ffffff;
  border: 1px solid #cbd5e1;
  overflow: hidden;
  flex-shrink: 0;
}

.pinned-product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pinned-product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.pinned-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.stock-pill {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.stock-pill.in-stock {
  background: var(--accent-emerald-dim);
  color: var(--accent-emerald);
}

.stock-pill.out-stock {
  background: var(--accent-coral-dim);
  color: var(--accent-coral);
}

.variant-pill {
  font-size: 0.725rem;
  font-weight: 700;
  background: #eff6ff;
  color: #003399;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 4px;
}

.pinned-product-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pinned-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.pinned-price-main {
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 800;
  color: #003399;
}

.pinned-price-strike {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.pinned-product-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.btn-outline-product {
  padding: 0.5rem 0.85rem;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-sm);
  color: #334155;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s ease;
}

.btn-outline-product:hover {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
}

.btn-quick-buy {
  padding: 0.5rem 1.15rem;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
}

.btn-quick-buy:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
}

/* 3. Chat Thread Card */
.chat-thread-card {
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 520px;
}

.chat-thread-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1.5rem;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.thread-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.thread-header-title h4 {
  font-size: 0.875rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.thread-header-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #004aad;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 7px;
  border-radius: 4px;
}

/* Unauth Box */
.chat-unauth-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  gap: 1rem;
}

.unauth-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-unauth-box h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.chat-unauth-box p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 440px;
  line-height: 1.5;
  margin: 0;
}

.unauth-actions-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 360px;
  margin-top: 0.5rem;
}

.btn-login-chat {
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-weight: 700;
  justify-content: center;
  border-radius: var(--radius-sm);
}

.btn-whatsapp-product {
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: #ecfdf5;
  border: 1.5px solid #10b981;
  color: #065f46;
  font-weight: 700;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.825rem;
}

.btn-whatsapp-product:hover {
  background: #10b981;
  color: #ffffff;
}

/* Conversation Container */
.chat-conversation-container {
  display: flex;
  flex-direction: column;
  height: 520px;
}

.chat-messages-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fbfdff;
}

/* Chat Bubbles */
.chat-bubble {
  max-width: 82%;
  padding: 0.85rem 1.15rem;
  border-radius: 12px;
  font-size: 0.875rem;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.store-bubble {
  align-self: flex-start;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  color: #1e293b;
  border-bottom-left-radius: 2px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.welcome-bubble {
  border-left: 4px solid #004aad;
  background: #f8fafc;
}

.user-bubble {
  align-self: flex-end;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  border-bottom-right-radius: 2px;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
}

.bubble-sender-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 2px;
}

.sender-badge-store {
  font-size: 0.725rem;
  font-weight: 800;
  color: #003399;
}

.bubble-time-text {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.user-bubble .bubble-time-text {
  color: rgba(255, 255, 255, 0.75);
}

.bubble-body-content {
  word-break: break-word;
}

.bubble-body-content strong {
  font-weight: 700;
}

.bubble-body-content .sub-text {
  display: block;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.bubble-meta-customer {
  align-self: flex-end;
  display: flex;
  align-items: center;
}

/* Typing Indicator */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1rem;
}

.typing-indicator-dots {
  display: flex;
  gap: 4px;
}

.typing-indicator-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #004aad;
  animation: typingBounce 1.2s infinite ease-in-out;
}

.typing-indicator-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.typing-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

/* Quick Prompts Bar */
.chat-quick-prompts-bar {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  overflow-x: auto;
  scrollbar-width: none;
}

.chat-quick-prompts-bar::-webkit-scrollbar {
  display: none;
}

.quick-prompt-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #475569;
  white-space: nowrap;
}

.quick-prompts-track {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.quick-chip-btn {
  white-space: nowrap;
  font-size: 0.75rem;
  font-weight: 600;
  color: #003399;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-chip-btn:hover:not(:disabled) {
  background: #eff6ff;
  border-color: #004aad;
  transform: translateY(-1px);
}

.quick-chip-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Message Input Form Bar */
.chat-input-form-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.chat-input-field {
  flex: 1;
  height: 44px;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 22px;
  padding: 0 1.25rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.chat-input-field:focus {
  background: #ffffff;
  border-color: #004aad;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.12);
}

.btn-send-message {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 51, 153, 0.25);
}

.btn-send-message:hover:not(:disabled) {
  transform: scale(1.06);
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
}

.btn-send-message:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */
@media (max-width: 768px) {
  .product-chat-page {
    padding-top: 1rem;
    padding-bottom: 3.5rem;
    gap: 1rem;
  }

  .store-chat-header {
    padding: 1rem 1.25rem;
    flex-direction: column;
    align-items: stretch;
  }

  .store-header-right {
    display: flex;
  }

  .btn-back-product {
    width: 100%;
    justify-content: center;
  }

  .pinned-product-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    gap: 0.85rem;
  }

  .pinned-product-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1.2fr;
  }

  .btn-outline-product,
  .btn-quick-buy {
    justify-content: center;
  }

  .action-btn-text {
    font-size: 0.775rem;
  }

  .chat-thread-card {
    min-height: 480px;
  }

  .chat-conversation-container {
    height: 480px;
  }

  .chat-messages-scroll-area {
    padding: 1rem;
  }

  .chat-bubble {
    max-width: 90%;
    font-size: 0.825rem;
  }
}

@media (max-width: 480px) {
  .store-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .pinned-product-actions {
    grid-template-columns: 1fr;
  }
}
</style>
