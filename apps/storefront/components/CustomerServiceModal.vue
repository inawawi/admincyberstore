<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition name="cs-modal-fade">
        <div
          v-if="isCustomerServiceOpen"
          class="cs-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cs-modal-title"
          @click.self="closeCustomerService"
        >
          <div class="cs-modal-card cyber-card">
            <!-- Ambient Top Accent Line -->
            <div class="cs-modal-lightbar"></div>

            <!-- Modal Header -->
            <div class="cs-modal-header">
              <div class="cs-header-left">
                <div class="cs-header-icon">
                  <Icon name="lucide:headphones" class="w-5 h-5 text-bsi" />
                </div>
                <div>
                  <h3 id="cs-modal-title" class="cs-title">Pusat Bantuan & CS</h3>
                  <div class="cs-status-indicator">
                    <span class="cs-pulse-dot"></span>
                    <span class="cs-status-text">Customer Service Online (08.00 - 21.00 WIB)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="cs-close-btn"
                @click="closeCustomerService"
                aria-label="Tutup Bantuan"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Tab Navigation Bar -->
            <div class="cs-tabs-nav">
              <button
                type="button"
                class="cs-tab-item"
                :class="{ 'is-active': activeTab === 'chat' }"
                @click="switchTab('chat')"
              >
                <Icon name="lucide:message-square-text" class="w-4 h-4" />
                <span>Live Chat CS</span>
              </button>

              <button
                type="button"
                class="cs-tab-item"
                :class="{ 'is-active': activeTab === 'contact' }"
                @click="switchTab('contact')"
              >
                <Icon name="lucide:phone-call" class="w-4 h-4" />
                <span>Kontak Resmi</span>
              </button>

              <button
                type="button"
                class="cs-tab-item"
                :class="{ 'is-active': activeTab === 'faq' }"
                @click="switchTab('faq')"
              >
                <Icon name="lucide:help-circle" class="w-4 h-4" />
                <span>Tanya Jawab (FAQ)</span>
              </button>
            </div>

            <!-- Tab 1: Live Chat CS -->
            <div v-if="activeTab === 'chat'" class="cs-tab-panel cs-chat-panel">
              <!-- If User NOT Authenticated -->
              <div v-if="!authStore.isAuthenticated" class="cs-unauth-box">
                <div class="cs-unauth-icon">
                  <Icon name="lucide:lock" class="w-10 h-10 text-bsi" />
                </div>
                <h4>Masuk untuk Memulai Live Chat</h4>
                <p>Login akun Anda agar percakapan dan keluhan transaksi tersimpan rapi dalam sistem kami.</p>
                
                <div class="cs-unauth-actions">
                  <NuxtLink to="/auth/login" class="btn btn-primary" @click="closeCustomerService">
                    <Icon name="lucide:log-in" class="w-4 h-4" />
                    <span>Masuk ke Akun</span>
                  </NuxtLink>

                  <a
                    :href="whatsappUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-whatsapp-alt"
                  >
                    <Icon name="lucide:message-circle" class="w-4 h-4" />
                    <span>Chat WhatsApp (Tanpa Login)</span>
                  </a>
                </div>
              </div>

              <!-- If User Authenticated: Active Live Chat Interface -->
              <div v-else class="cs-chat-interface">
                <!-- Selected Product Attachment Notice (If triggered from product detail) -->
                <div v-if="selectedProduct" class="cs-attached-product-bar">
                  <Icon name="lucide:tag" class="w-4 h-4 text-bsi" />
                  <span class="attached-text">Tanya produk: <strong>{{ selectedProduct.name }}</strong></span>
                  <button type="button" @click="selectedProduct = null" class="btn-detach">
                    <Icon name="lucide:x" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Chat Messages Scroll Area -->
                <div ref="chatScrollRef" class="cs-messages-area">
                  <!-- Welcome greeting bubble from CS system -->
                  <div class="chat-bubble cs-bubble">
                    <div class="bubble-sender">
                      <Icon name="lucide:bot" class="w-3.5 h-3.5" />
                      <span>CS Bot & Admin BSI Cyber Store</span>
                    </div>
                    <div class="bubble-body">
                      Halo <strong>{{ authStore.user?.name || 'Sobat Cyber' }}</strong>! Ada yang bisa kami bantu seputar produk gear teknologi, event MABA, pesanan, atau konfirmasi pembayaran Anda?
                    </div>
                    <span class="bubble-time">Hari ini</span>
                  </div>

                  <!-- Messages List -->
                  <div
                    v-for="msg in messages"
                    :key="msg.id"
                    class="chat-bubble"
                    :class="msg.sender_type === 'customer' ? 'user-bubble' : 'cs-bubble'"
                  >
                    <div v-if="msg.sender_type !== 'customer'" class="bubble-sender">
                      <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-bsi" />
                      <span>Admin Customer Service</span>
                    </div>
                    <div class="bubble-body" style="white-space: pre-line;">
                      {{ msg.message }}
                    </div>
                    <span class="bubble-time">{{ formatMsgTime(msg.created_at) }}</span>
                  </div>

                  <!-- Bot Typing Indicator -->
                  <div v-if="isSending" class="chat-bubble cs-bubble cs-typing-bubble">
                    <div class="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>

                <!-- Quick Prompts Chips -->
                <div class="cs-quick-prompts">
                  <button
                    v-for="prompt in quickPrompts"
                    :key="prompt"
                    type="button"
                    class="quick-prompt-btn"
                    @click="sendQuickPrompt(prompt)"
                  >
                    {{ prompt }}
                  </button>
                </div>

                <!-- Message Input Footer -->
                <form @submit.prevent="handleSendMessage" class="cs-chat-input-bar">
                  <input
                    v-model="inputMessage"
                    type="text"
                    placeholder="Tulis pesan pertanyaan ke Admin CS..."
                    class="cs-chat-input"
                    :disabled="isSending"
                  />
                  <button
                    type="submit"
                    class="cs-btn-send"
                    :disabled="!inputMessage.trim() || isSending"
                    aria-label="Kirim Pesan"
                  >
                    <Icon name="lucide:send" class="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>

            <!-- Tab 2: Kontak Resmi -->
            <div v-if="activeTab === 'contact'" class="cs-tab-panel cs-contact-panel">
              <div class="contact-cards-grid">
                <!-- WhatsApp Official Card -->
                <div class="contact-card card-whatsapp">
                  <div class="contact-card-icon bg-emerald">
                    <Icon name="lucide:message-circle" class="w-6 h-6 text-emerald" />
                  </div>
                  <div class="contact-card-content">
                    <h4>WhatsApp Customer Service</h4>
                    <p>Respon instan melalui WhatsApp resmi BSI Cyber Store untuk konsultasi belanja, stok, dan komplain.</p>
                    <a
                      :href="whatsappUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-whatsapp"
                    >
                      <Icon name="lucide:send" class="w-4 h-4" />
                      <span>Chat WhatsApp Sekarang</span>
                    </a>
                  </div>
                </div>

                <!-- Email Official Card -->
                <div class="contact-card card-email">
                  <div class="contact-card-icon bg-blue">
                    <Icon name="lucide:mail" class="w-6 h-6 text-bsi" />
                  </div>
                  <div class="contact-card-content">
                    <h4>Email Layanan & Kerjasama</h4>
                    <p>Kirim pertanyaan formal, bukti pembayaran bermasalah, atau penawaran ke email resmi kami.</p>
                    <a :href="`mailto:${helpData?.contacts?.email?.value || 'cs@cyberstore.id'}`" class="contact-link">
                      <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
                      <span>{{ helpData?.contacts?.email?.value || 'cs@cyberstore.id' }}</span>
                    </a>
                  </div>
                </div>

                <!-- Call Center Card -->
                <div class="contact-card card-phone">
                  <div class="contact-card-icon bg-indigo">
                    <Icon name="lucide:phone" class="w-6 h-6 text-indigo" />
                  </div>
                  <div class="contact-card-content">
                    <h4>Call Center Kampus</h4>
                    <p>Hubungi saluran telepon bantuan pada hari dan jam kerja operasional kampus.</p>
                    <a :href="`tel:${helpData?.contacts?.telephone?.value || '0217867868'}`" class="contact-link">
                      <Icon name="lucide:phone-call" class="w-3.5 h-3.5" />
                      <span>{{ helpData?.contacts?.telephone?.value || '(021) 7867868' }}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab 3: FAQ & Tanya Jawab -->
            <div v-if="activeTab === 'faq'" class="cs-tab-panel cs-faq-panel">
              <!-- Search FAQ -->
              <div class="faq-search-box">
                <Icon name="lucide:search" class="w-4 h-4 text-muted" />
                <input
                  v-model="faqSearchQuery"
                  type="text"
                  placeholder="Cari pertanyaan seputar pembayaran, pengiriman, maba..."
                  class="faq-search-input"
                />
              </div>

              <!-- FAQ Accordion List -->
              <div class="faq-accordion-list">
                <div
                  v-for="(faq, idx) in filteredFaqs"
                  :key="idx"
                  class="faq-accordion-item"
                  :class="{ 'is-open': openFaqIndex === idx }"
                >
                  <button
                    type="button"
                    class="faq-question-btn"
                    @click="toggleFaq(idx)"
                  >
                    <span class="faq-q-text">{{ faq.question }}</span>
                    <Icon
                      name="lucide:chevron-down"
                      class="w-4 h-4 faq-chevron"
                      :class="{ 'rotate-180': openFaqIndex === idx }"
                    />
                  </button>

                  <div v-if="openFaqIndex === idx" class="faq-answer-box">
                    <p>{{ faq.answer }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useCustomerService } from '~/composables/useCustomerService'

const authStore = useAuthStore()
const { fetchHelp, fetchChats, createChat, fetchChatMessages, sendChatMessage } = useApi()
const {
  isCustomerServiceOpen,
  activeTab,
  selectedProduct,
  prefilledMessage,
  closeCustomerService,
  switchTab,
} = useCustomerService()

const helpData = ref<any>(null)
const activeChatId = ref<number | null>(null)
const messages = ref<any[]>([])
const inputMessage = ref('')
const isSending = ref(false)
const chatScrollRef = ref<HTMLElement | null>(null)
const openFaqIndex = ref<number | null>(0)
const faqSearchQuery = ref('')

const quickPrompts = [
  'Apakah stok produk ready?',
  'Bagaimana cara konfirmasi pembayaran?',
  'Kapan pesanan saya dikirim?',
  'Apakah ada garansi resmi?',
]

// Fetch Help & FAQ data
onMounted(async () => {
  try {
    const res = await fetchHelp()
    if (res) {
      helpData.value = res
    }
  } catch (e) {
    // Ignore error
  }
})

// Watch when modal opens or prefilled message changes
watch(isCustomerServiceOpen, async (isOpen) => {
  if (isOpen) {
    if (prefilledMessage.value) {
      inputMessage.value = prefilledMessage.value
    }
    if (authStore.isAuthenticated && activeTab.value === 'chat') {
      await loadOrCreateChat()
    }
  }
})

watch(prefilledMessage, (val) => {
  if (val) {
    inputMessage.value = val
  }
})

const whatsappUrl = computed(() => {
  const baseWa = helpData.value?.contacts?.whatsapp?.value || 'https://wa.me/628123456789'
  const defaultText = 'Halo Customer Service BSI Cyber Store, saya butuh bantuan seputar produk dan transaksi.'
  const text = encodeURIComponent(prefilledMessage.value || defaultText)
  return baseWa.includes('?') ? `${baseWa}&text=${text}` : `${baseWa}?text=${text}`
})

const filteredFaqs = computed(() => {
  const faqs = helpData.value?.faqs || [
    {
      question: 'Bagaimana cara konfirmasi pembayaran pesanan?',
      answer: 'Pembayaran melalui Midtrans (Virtual Account, QRIS, GoPay, ShopeePay) terkonfirmasi secara otomatis dalam waktu 1-3 menit setelah pembayaran Anda berhasil.',
    },
    {
      question: 'Berapa lama estimasi pengiriman barang?',
      answer: 'Pengiriman reguler berkisar antara 1-3 hari kerja untuk wilayah Jabodetabek, dan 2-5 hari kerja untuk luar pulau Jawa sesuai ekspedisi pilihan Anda.',
    },
    {
      question: 'Apakah produk di BSI Cyber Store bergaransi resmi?',
      answer: 'Semua produk teknologi, hardware, dan apparel yang dijual di BSI Cyber Store adalah 100% original dan memiliki garansi resmi.',
    },
  ]

  if (!faqSearchQuery.value.trim()) return faqs
  const q = faqSearchQuery.value.toLowerCase()
  return faqs.filter(
    (f: any) =>
      f.question?.toLowerCase().includes(q) || f.answer?.toLowerCase().includes(q)
  )
})

const toggleFaq = (idx: number) => {
  openFaqIndex.value = openFaqIndex.value === idx ? null : idx
}

// Load or create chat session
const loadOrCreateChat = async () => {
  if (!authStore.isAuthenticated) return
  try {
    const res = await fetchChats()
    const chats = res?.chats || []

    if (chats.length > 0) {
      activeChatId.value = chats[0].id
      await loadMessages(chats[0].id)
    }
  } catch (e) {
    console.warn('Gagal memuat sesi chat:', e)
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
    if (chatScrollRef.value) {
      chatScrollRef.value.scrollTop = chatScrollRef.value.scrollHeight
    }
  })
}

const formatMsgTime = (dt?: string) => {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const sendQuickPrompt = (prompt: string) => {
  inputMessage.value = prompt
  handleSendMessage()
}

const handleSendMessage = async () => {
  const text = inputMessage.value.trim()
  if (!text || isSending.value) return

  isSending.value = true
  inputMessage.value = ''

  // Optimistic UI update
  messages.value.push({
    id: Date.now(),
    sender_type: 'customer',
    message: text,
    created_at: new Date().toISOString(),
  })
  scrollToBottom()

  try {
    if (!activeChatId.value) {
      // Create new chat
      const res = await createChat({
        subject: selectedProduct.value ? `Tanya: ${selectedProduct.value.name}` : 'Bantuan Customer Service',
        message: text,
        product_id: selectedProduct.value?.id,
      })
      if (res?.chat?.id) {
        activeChatId.value = res.chat.id
      }
    } else {
      await sendChatMessage(activeChatId.value, text, selectedProduct.value?.id)
    }

    // Refresh pesan setelah bot merespon
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
</script>

<style scoped>
/* Backdrop */
.cs-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

/* Modal Card */
.cs-modal-card {
  width: 580px;
  max-width: 95vw;
  height: 650px;
  max-height: 90vh;
  background: #ffffff;
  border-radius: var(--radius-xl, 20px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.cs-modal-lightbar {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, #004aad 0%, #00d2ff 50%, #7c3aed 100%);
}

/* Header */
.cs-modal-header {
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}

.cs-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cs-header-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid rgba(0, 74, 173, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cs-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.cs-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 2px;
}

.cs-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.cs-status-text {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 600;
}

.cs-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #f1f5f9;
  border: none;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Tabs Nav */
.cs-tabs-nav {
  display: flex;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
  background: #f8fafc;
  padding: 0 1rem;
}

.cs-tab-item {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748b;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-tab-item:hover {
  color: #003399;
}

.cs-tab-item.is-active {
  color: #004aad;
  border-bottom-color: #004aad;
  background: #ffffff;
}

/* Tab Panel */
.cs-tab-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Unauthenticated State */
.cs-unauth-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  text-align: center;
  gap: 1rem;
}

.cs-unauth-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cs-unauth-box h4 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.cs-unauth-box p {
  color: #64748b;
  font-size: 0.9rem;
  max-width: 360px;
  line-height: 1.5;
  margin: 0;
}

.cs-unauth-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 280px;
}

.btn-whatsapp-alt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm, 8px);
  background: #25d366;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.875rem;
  text-decoration: none;
}

/* Live Chat Interface */
.cs-chat-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cs-attached-product-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  border-bottom: 1px solid rgba(0, 74, 173, 0.15);
  padding: 0.45rem 1rem;
  font-size: 0.775rem;
  color: #003399;
}

.attached-text {
  flex: 1;
}

.btn-detach {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
}

.cs-messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f8fafc;
}

/* Bubbles */
.chat-bubble {
  max-width: 82%;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  font-size: 0.85rem;
  line-height: 1.45;
}

.cs-bubble {
  align-self: flex-start;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #0f172a;
  border-bottom-left-radius: 2px;
}

.user-bubble {
  align-self: flex-end;
  background: #003399;
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.bubble-sender {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #004aad;
  margin-bottom: 2px;
}

.bubble-time {
  font-size: 0.65rem;
  color: #94a3b8;
  align-self: flex-end;
}

.user-bubble .bubble-time {
  color: rgba(255, 255, 255, 0.7);
}

/* Typing indicator */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #004aad;
  animation: typing 1s infinite alternate;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  from { opacity: 0.3; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1.2); }
}

/* Quick Prompts Chips */
.cs-quick-prompts {
  display: flex;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  overflow-x: auto;
  scrollbar-width: none;
  background: #ffffff;
  border-top: 1px solid var(--border-subtle, #e2e8f0);
}

.cs-quick-prompts::-webkit-scrollbar { display: none; }

.quick-prompt-btn {
  white-space: nowrap;
  padding: 0.35rem 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.quick-prompt-btn:hover {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
}

/* Chat Input Bar */
.cs-chat-input-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border-top: 1px solid var(--border-subtle, #e2e8f0);
}

.cs-chat-input {
  flex: 1;
  padding: 0.65rem 1rem;
  border-radius: var(--radius-full, 9999px);
  border: 1.5px solid #cbd5e1;
  font-size: 0.85rem;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}

.cs-chat-input:focus {
  border-color: #004aad;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.15);
}

.cs-btn-send {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #003399;
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cs-btn-send:hover:not(:disabled) {
  background: #004aad;
  transform: scale(1.05);
}

.cs-btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tab 2: Contacts */
.cs-contact-panel {
  padding: 1.5rem;
  overflow-y: auto;
}

.contact-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.contact-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 14px;
  background: #ffffff;
  border: 1.5px solid var(--border-subtle, #e2e8f0);
  transition: all 0.2s ease;
}

.contact-card:hover {
  border-color: #004aad;
  box-shadow: 0 4px 15px rgba(0, 74, 173, 0.08);
}

.contact-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-emerald { background: #ecfdf5; }
.text-emerald { color: #10b981; }
.bg-blue { background: #eff6ff; }
.bg-indigo { background: #eef2ff; }
.text-indigo { color: #6366f1; }

.contact-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.contact-card-content h4 {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.contact-card-content p {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
}

.btn-whatsapp {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  background: #25d366;
  color: #ffffff;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 700;
  text-decoration: none;
  width: fit-content;
  transition: all 0.2s ease;
}

.btn-whatsapp:hover {
  background: #20ba59;
  box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
}

.contact-link {
  margin-top: 0.35rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #003399;
  text-decoration: none;
}

.contact-link:hover {
  text-decoration: underline;
  color: #004aad;
}

/* Tab 3: FAQ */
.cs-faq-panel {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.faq-search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 10px;
}

.faq-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.85rem;
  font-family: inherit;
}

.faq-accordion-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.faq-accordion-item {
  border: 1.5px solid var(--border-subtle, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.2s ease;
}

.faq-accordion-item.is-open {
  border-color: #004aad;
  box-shadow: 0 2px 10px rgba(0, 74, 173, 0.08);
}

.faq-question-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  background: #ffffff;
  border: none;
  cursor: pointer;
  text-align: left;
}

.faq-q-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
}

.faq-chevron {
  color: #64748b;
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.faq-answer-box {
  padding: 0 1rem 0.85rem;
  font-size: 0.825rem;
  color: #475569;
  line-height: 1.55;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  padding-top: 0.75rem;
}

.faq-answer-box p {
  margin: 0;
}

/* Modal Transition */
.cs-modal-fade-enter-active,
.cs-modal-fade-leave-active {
  transition: all 0.25s ease;
}

.cs-modal-fade-enter-from,
.cs-modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}

@media (max-width: 640px) {
  .cs-modal-card {
    height: 94vh;
    max-height: 94vh;
    border-radius: 16px;
  }

  .cs-header-left {
    gap: 0.5rem;
  }

  .cs-title {
    font-size: 1rem;
  }

  .cs-tab-item {
    padding: 0.75rem 0.25rem;
    font-size: 0.775rem;
  }
}
</style>
