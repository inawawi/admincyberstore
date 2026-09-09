<template>
  <div ref="dropdownRef" class="notification-wrapper">
    <!-- Bell Trigger Button -->
    <button type="button" class="notif-trigger-btn" :class="{ 'is-active': isOpen, 'has-unread': unreadCount > 0 }"
      @click="toggleDropdown" aria-label="Pemberitahuan & Notifikasi" :aria-expanded="isOpen">
      <div class="notif-icon-box">
        <Icon name="lucide:bell" class="w-5 h-5 notif-bell-icon" />
        <!-- Unread Badge Indicator -->
        <span v-if="unreadCount > 0" class="notif-unread-badge">
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </div>
      <span class="notif-btn-label">Notifikasi</span>
    </button>

    <!-- Unified Dropdown Panel (Desktop & Mobile) -->
    <Transition name="notif-slide">
      <div v-if="isOpen" class="notif-panel cyber-card" role="dialog"
        aria-modal="true" aria-label="Daftar Notifikasi">
        <!-- Panel Header -->
        <div class="notif-header">
          <div class="notif-title-row">
            <div class="notif-heading-group">
              <Icon name="lucide:bell-ring" class="w-5 h-5 text-bsi" />
              <h3 class="notif-title">Notifikasi</h3>
              <span v-if="unreadCount > 0" class="notif-count-pill">
                {{ unreadCount }} baru
              </span>
            </div>

            <div class="notif-header-actions">
              <button v-if="unreadCount > 0" type="button" class="btn-mark-all-read" @click="handleMarkAllRead"
                title="Tandai semua sudah dibaca">
                <Icon name="lucide:check-check" class="w-4 h-4" />
                <span>Baca Semua</span>
              </button>
              <button type="button" class="btn-close-notif" @click="closeDropdown" aria-label="Tutup Notifikasi">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Category Filter Bar (Pills) -->
          <div class="notif-tabs-bar">
            <button v-for="tab in filterTabs" :key="tab.id" type="button" class="notif-tab-btn"
              :class="{ 'is-active': activeFilter === tab.id }" @click="activeFilter = tab.id">
              <Icon :name="tab.icon" class="w-3.5 h-3.5" />
              <span>{{ tab.label }}</span>
              <span v-if="getTabCount(tab.id) > 0" class="tab-counter-badge">
                {{ getTabCount(tab.id) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Panel Body -->
        <div class="notif-body">
          <div v-if="isLoading" class="notif-loading-state">
            <div class="spinner-cyber"></div>
            <p>Memuat notifikasi...</p>
          </div>
          <div v-else-if="filteredNotifications.length === 0" class="notif-empty-state">
            <div class="empty-icon-circle">
              <Icon name="lucide:bell-off" class="w-8 h-8 text-muted" />
            </div>
            <h4>Belum Ada Notifikasi</h4>
            <p>{{ getEmptyStateMessage() }}</p>
          </div>
          <div v-else class="notif-list">
            <div v-for="item in filteredNotifications" :key="item.id" class="notif-item"
              :class="{ 'is-unread': !item.is_read }" @click="handleItemClick(item)">
              <div class="notif-item-icon-box" :class="`icon-${item.type}`">
                <Icon :name="getTypeIcon(item.type)" class="w-4 h-4" />
              </div>
              <div class="notif-item-content">
                <div class="notif-item-header">
                  <span class="notif-item-badge" :class="`badge-${item.type}`">{{ getTypeLabel(item.type) }}</span>
                  <span class="notif-item-time">{{ formatTimestamp(item.created_at) }}</span>
                </div>
                <h5 class="notif-item-title">{{ item.title }}</h5>
                <p class="notif-item-text">{{ item.content }}</p>
                <div v-if="item.action_url" class="notif-item-action-hint">
                  <span>{{ getActionLabel(item) }}</span>
                  <Icon name="lucide:chevron-right" class="w-3 h-3" />
                </div>
              </div>
              <div v-if="!item.is_read" class="notif-unread-dot" title="Belum dibaca"></div>
            </div>
          </div>
        </div>

        <!-- Panel Footer -->
        <div class="notif-footer">
          <div v-if="!authStore.isAuthenticated" class="notif-guest-prompt">
            <Icon name="lucide:info" class="w-4 h-4 text-bsi" />
            <span>Masuk untuk melihat riwayat pembayaran & pesan admin</span>
            <NuxtLink to="/auth/login" class="btn-guest-login" @click="closeDropdown">Masuk</NuxtLink>
          </div>
          <div v-else class="notif-auth-footer">
            <NuxtLink to="/account/orders" class="footer-link-action" @click="closeDropdown">
              <Icon name="lucide:receipt" class="w-3.5 h-3.5" />
              <span>Semua Riwayat Transaksi</span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useNotifications, type AppNotification } from '~/composables/useNotifications'
import { useCustomerService } from '~/composables/useCustomerService'

const router = useRouter()
const authStore = useAuthStore()
const { notifications, unreadCount, isLoading, loadNotifications, markRead, markAllRead } = useNotifications()
const { openCustomerService } = useCustomerService()

const isOpen = ref(false)
const activeFilter = ref<'all' | 'transaction' | 'chat' | 'announcement'>('all')
const dropdownRef = ref<HTMLElement | null>(null)
const isMobile = ref(false)

const filterTabs = [
  { id: 'all' as const, label: 'Semua', icon: 'lucide:layers' },
  { id: 'transaction' as const, label: 'Transaksi', icon: 'lucide:receipt' },
  { id: 'chat' as const, label: 'Chat Admin', icon: 'lucide:message-square' },
  { id: 'announcement' as const, label: 'Pengumuman', icon: 'lucide:megaphone' },
]

const checkMobile = () => {
  if (import.meta.client) {
    isMobile.value = window.innerWidth <= 768
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)
  // Muat notifikasi saat komponen pertama kali dimuat
  loadNotifications()
})

onUnmounted(() => {
  if (import.meta.client) {
    window.removeEventListener('resize', checkMobile)
    document.removeEventListener('click', handleClickOutside)
    document.body.style.overflow = ''
  }
})

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadNotifications(true)
  }
}

const closeDropdown = () => {
  isOpen.value = false
}

const filteredNotifications = computed(() => {
  if (activeFilter.value === 'all') {
    return notifications.value
  }
  return notifications.value.filter((n) => {
    if (activeFilter.value === 'transaction') return n.type === 'transaction'
    if (activeFilter.value === 'chat') return n.type === 'chat'
    if (activeFilter.value === 'announcement') return n.type === 'announcement' || n.type === 'promo' || n.type === 'info'
    return true
  })
})

const getTabCount = (tabId: string): number => {
  if (tabId === 'all') return unreadCount.value
  return notifications.value.filter((n) => {
    if (n.is_read) return false
    if (tabId === 'transaction') return n.type === 'transaction'
    if (tabId === 'chat') return n.type === 'chat'
    if (tabId === 'announcement') return n.type === 'announcement' || n.type === 'promo' || n.type === 'info'
    return false
  }).length
}

const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'transaction':
      return 'lucide:credit-card'
    case 'chat':
      return 'lucide:message-circle'
    case 'promo':
      return 'lucide:tag'
    case 'announcement':
    default:
      return 'lucide:megaphone'
  }
}

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'transaction':
      return 'Transaksi'
    case 'chat':
      return 'Chat Admin'
    case 'promo':
      return 'Promo'
    case 'announcement':
    default:
      return 'Pengumuman'
  }
}

const getActionLabel = (item: AppNotification): string => {
  if (item.type === 'transaction') return 'Lihat Detail Pesanan'
  if (item.type === 'chat') return 'Buka Obrolan Chat'
  return 'Buka Pengumuman'
}

const getEmptyStateMessage = (): string => {
  if (activeFilter.value === 'transaction') return 'Belum ada riwayat transaksi atau status pembayaran terbaru.'
  if (activeFilter.value === 'chat') return 'Belum ada pesan baru dari Customer Service atau Admin.'
  if (activeFilter.value === 'announcement') return 'Tidak ada pengumuman promo atau informasi kampus saat ini.'
  return 'Semua pemberitahuan dan informasi penting akan muncul di sini.'
}

const formatTimestamp = (dateStr?: string | null): string => {
  if (!dateStr) return 'Baru saja'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Baru saja'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  })
}

const handleMarkAllRead = async () => {
  await markAllRead()
}

const handleItemClick = async (item: AppNotification) => {
  await markRead(item.id)

  if (item.action_url) {
    closeDropdown()
    if (item.action_url === 'cs:chat' || item.type === 'chat') {
      openCustomerService({ tab: 'chat' })
    } else {
      router.push(item.action_url)
    }
  }
}

const openCSChat = () => {
  closeDropdown()
  openCustomerService({ tab: 'chat' })
}
</script>

<style scoped>
.notification-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Bell Trigger Button (Matches Navbar Action Items) */
.notif-trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: 1.5px solid transparent;
  padding: 0.45rem 0.65rem;
  border-radius: var(--radius-full, 9999px);
  color: var(--text-primary, #0f172a);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  user-select: none;
}

.notif-trigger-btn:hover {
  background: rgba(0, 74, 173, 0.08);
  color: #003399;
  border-color: rgba(0, 74, 173, 0.2);
}

.notif-trigger-btn.is-active {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
  box-shadow: 0 0 12px rgba(0, 74, 173, 0.15);
}

.notif-icon-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notif-bell-icon {
  transition: transform 0.25s ease;
}

.notif-trigger-btn:hover .notif-bell-icon {
  transform: rotate(15deg);
}

.notif-btn-label {
  display: none;
}

@media (min-width: 1200px) {
  .notif-btn-label {
    display: inline;
  }
}

/* Badge Counter with Pulse effect */
.notif-unread-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: #e11d48;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  border-radius: var(--radius-full, 9999px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(225, 29, 72, 0.4);
  animation: badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes badgePop {
  0% {
    transform: scale(0);
  }

  80% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

/* ═══════════════════════════════════════
   PANEL — Light Theme (matches site navbar)
═══════════════════════════════════════ */
.notif-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 400px;
  max-width: 92vw;
  background: #ffffff;
  border: 1px solid rgba(0, 74, 173, 0.15);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(15, 23, 42, 0.12),
    0 2px 8px rgba(0, 74, 173, 0.08),
    0 0 0 1px rgba(0, 74, 173, 0.04);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
}

/* ═══════════════════════════════════════
   HEADER
═══════════════════════════════════════ */
.notif-header {
  padding: 1rem 1.15rem 0.8rem;
  border-bottom: 1px solid rgba(0, 74, 173, 0.1);
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notif-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.notif-heading-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.notif-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.notif-count-pill {
  background: #eff6ff;
  border: 1px solid rgba(0, 74, 173, 0.2);
  color: #004aad;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
}

.notif-header-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-mark-all-read {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #eff6ff;
  border: 1px solid rgba(0, 74, 173, 0.2);
  color: #004aad;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0.28rem 0.6rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-mark-all-read:hover {
  background: #dbeafe;
  color: #003399;
  border-color: rgba(0, 51, 153, 0.3);
}

.btn-close-notif {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-close-notif:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* ═══════════════════════════════════════
   FILTER TABS BAR
═══════════════════════════════════════ */
.notif-tabs-bar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.notif-tabs-bar::-webkit-scrollbar { display: none; }

.notif-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.7rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-family: inherit;
}

.notif-tab-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.notif-tab-btn.is-active {
  background: #003399;
  color: #ffffff;
  border-color: #002266;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.25);
}

.tab-counter-badge {
  background: #e11d48;
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  padding: 0 0.35rem;
  border-radius: 999px;
  line-height: 1.35;
}

.notif-tab-btn.is-active .tab-counter-badge {
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
}

/* ═══════════════════════════════════════
   PANEL BODY
═══════════════════════════════════════ */
.notif-body {
  max-height: 380px;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 74, 173, 0.2) transparent;
}

.notif-body::-webkit-scrollbar { width: 4px; }
.notif-body::-webkit-scrollbar-track { background: transparent; }
.notif-body::-webkit-scrollbar-thumb {
  background: rgba(0, 74, 173, 0.2);
  border-radius: 2px;
}

.notif-loading-state,
.notif-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem;
  text-align: center;
  gap: 0.7rem;
}

.empty-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f0f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed rgba(0, 74, 173, 0.25);
}

.notif-empty-state h4 {
  font-size: 0.95rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.notif-empty-state p {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
  max-width: 260px;
  line-height: 1.5;
}

/* ═══════════════════════════════════════
   NOTIFICATION ITEMS
═══════════════════════════════════════ */
.notif-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.7rem 0.8rem;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  overflow: hidden;
}

.notif-item:hover {
  background: #f8fafc;
  border-color: rgba(0, 74, 173, 0.15);
  transform: translateX(2px);
}

.notif-item.is-unread {
  background: #f0f7ff;
  border-color: rgba(0, 74, 173, 0.18);
}

.notif-item.is-unread:hover {
  background: #e6f0fa;
  border-color: rgba(0, 51, 153, 0.25);
}

.notif-item.is-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 18%;
  bottom: 18%;
  width: 3px;
  background: linear-gradient(180deg, #004aad, #2563eb);
  border-radius: 0 2px 2px 0;
}

/* Type Icon */
.notif-item-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.icon-transaction {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid rgba(5, 150, 105, 0.2);
}

.icon-chat {
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid rgba(124, 58, 237, 0.2);
}

.icon-promo {
  background: #fff1f2;
  color: #e11d48;
  border: 1px solid rgba(225, 29, 72, 0.2);
}

.icon-announcement,
.icon-info {
  background: #eff6ff;
  color: #004aad;
  border: 1px solid rgba(0, 74, 173, 0.2);
}

/* Item Content */
.notif-item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.notif-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.notif-item-badge {
  font-size: 0.62rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.badge-transaction { background: #d1fae5; color: #065f46; }
.badge-chat { background: #ede9fe; color: #5b21b6; }
.badge-promo { background: #ffe4e6; color: #9f1239; }
.badge-announcement, .badge-info { background: #dbeafe; color: #1e40af; }

.notif-item-time {
  font-size: 0.68rem;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

.notif-item-title {
  font-size: 0.83rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.35;
}

.notif-item.is-unread .notif-item-title {
  color: #003399;
  font-weight: 800;
}

.notif-item-text {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notif-item.is-unread .notif-item-text {
  color: #475569;
}

.notif-item-action-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: #004aad;
  margin-top: 0.1rem;
  transition: color 0.2s;
}

.notif-item:hover .notif-item-action-hint {
  color: #003399;
}

/* Unread Dot */
.notif-unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #004aad;
  box-shadow: 0 0 6px rgba(0, 74, 173, 0.5);
  flex-shrink: 0;
  margin-top: 8px;
  animation: dotPulse 2.2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 4px rgba(0, 74, 173, 0.6); }
  50% { box-shadow: 0 0 10px rgba(0, 74, 173, 0.9), 0 0 18px rgba(0, 74, 173, 0.3); }
}

/* ═══════════════════════════════════════
   PANEL FOOTER
═══════════════════════════════════════ */
.notif-footer {
  padding: 0.7rem 1.1rem;
  border-top: 1px solid rgba(0, 74, 173, 0.1);
  background: #f8fafc;
}

.notif-guest-prompt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.73rem;
  color: #475569;
}

.btn-guest-login {
  padding: 0.28rem 0.7rem;
  background: #004aad;
  color: #fff;
  border-radius: 7px;
  font-weight: 700;
  font-size: 0.72rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-guest-login:hover {
  background: #003399;
  transform: translateY(-1px);
}

.notif-auth-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.footer-link-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.73rem;
  font-weight: 700;
  color: #004aad;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.22rem 0.5rem;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.footer-link-action:hover {
  background: #eff6ff;
  color: #003399;
}

/* Dropdown slide-down transition */
.notif-slide-enter-active,
.notif-slide-leave-active {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.notif-slide-enter-from,
.notif-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

/* Mobile — panel mengikuti lebar layar, dipusatkan secara horizontal */
@media (max-width: 768px) {
  /* Buat wrapper jadi referensi posisi yang lebih lebar */
  .notification-wrapper {
    position: static;
  }

  .notif-panel {
    /* Posisi fixed-like tapi tanpa fixed (hindari stacking context navbar) */
    position: absolute;
    top: calc(100% + 8px);
    /* Geser panel ke kiri agar muncul di tengah layar */
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100vw - 24px);
    max-width: 400px;
    /* Pastikan tidak overflow kiri */
    margin-left: 0;
  }

  .notif-body {
    max-height: 50vh;
  }
}
</style>
