import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useCustomerService } from '~/composables/useCustomerService'

export interface AppNotification {
  id: string | number
  announcement_id?: number | null
  title: string
  content: string
  type: 'announcement' | 'chat' | 'transaction' | 'info'
  action_url?: string | null
  is_read: boolean
  read_at?: string | null
  created_at?: string | null
  metadata?: Record<string, any>
}

const notifications = ref<AppNotification[]>([])
const unreadCount = ref<number>(0)
const isLoading = ref<boolean>(false)
const hasLoaded = ref<boolean>(false)
let lastAuthState: boolean | null = null
let pollTimer: any = null
const knownChatIds = new Set<string | number>()

const getStoredReadIds = (): Set<string> => {
  if (!import.meta.client) return new Set()
  try {
    const raw = localStorage.getItem('cyberstore_read_notif_ids')
    if (raw) {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) return new Set(arr.map(String))
    }
  } catch {}
  return new Set()
}

const saveStoredReadIds = (set: Set<string>) => {
  if (!import.meta.client) return
  try {
    const arr = Array.from(set).slice(-300)
    localStorage.setItem('cyberstore_read_notif_ids', JSON.stringify(arr))
  } catch {}
}

export const useNotifications = () => {
  const authStore = useAuthStore()
  const { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useApi()

  const loadNotifications = async (force = false) => {
    if (lastAuthState !== authStore.isAuthenticated) {
      force = true
      lastAuthState = authStore.isAuthenticated
    }

    if (hasLoaded.value && !force) return
    if (!hasLoaded.value) {
      isLoading.value = true
    }

    try {
      if (authStore.isAuthenticated) {
        // Ambil notifikasi resmi dari database / admin panel
        const notifRes = await fetchNotifications()
        if (!authStore.isAuthenticated) {
          notifications.value = []
          unreadCount.value = 0
          hasLoaded.value = true
          return
        }
        const rawList = (notifRes as any)?.notifications || (notifRes as any)?.data || []
        const storedReadIds = getStoredReadIds()

        const items: AppNotification[] = (Array.isArray(rawList) ? rawList : []).map((n: any) => {
          const type = normalizeType(n.type, n.title, n.content)
          let action_url = n.action_url || null
          if (type === 'transaction' && (!action_url || action_url.includes('announcement'))) {
            const invMatch = (n.title || '').match(/#?(INV-[\w-]+)/i) || (n.content || '').match(/#?(INV-[\w-]+)/i)
            const isCancel = (n.title || '').includes('Dibatalkan') || (n.content || '').includes('dibatalkan')
            if (isCancel) {
              action_url = invMatch ? `/account/orders?status=cancelled&search=${encodeURIComponent(invMatch[1])}` : '/account/orders?status=cancelled'
            } else {
              action_url = invMatch ? `/account/orders?search=${encodeURIComponent(invMatch[1])}` : '/account/orders'
            }
          }

          const isLocallyRead = storedReadIds.has(String(n.id))

          return {
            id: n.id,
            announcement_id: n.announcement_id,
            title: n.title || (type === 'chat' ? 'Pesan Baru dari Admin' : type === 'transaction' ? 'Status Transaksi' : 'Pemberitahuan'),
            content: n.content || '',
            type,
            action_url,
            is_read: isLocallyRead || !!n.read_at || !!n.is_read,
            read_at: n.read_at,
            created_at: n.created_at || new Date().toISOString(),
            metadata: n.metadata,
          }
        })

        // Urutkan notifikasi terbaru di paling atas
        items.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA
        })

        // Deteksi chat baru yang belum pernah diberitahukan
        if (import.meta.client) {
          const unreadChats = items.filter((it) => it.type === 'chat' && !it.is_read)

          if (hasLoaded.value) {
            // Bukan initial load: jika ada chat unread baru yang belum di-notif, tampilkan Floating Toast
            for (const chat of unreadChats) {
              if (!knownChatIds.has(chat.id)) {
                knownChatIds.add(chat.id)
                try {
                  const toast = useToast()
                  const { openCustomerService } = useCustomerService()
                  toast.info(chat.content, {
                    title: chat.title || '💬 Pesan Baru dari Admin',
                    tag: 'CHAT ADMIN',
                    duration: 6000,
                    action: {
                      label: 'Buka Chat',
                      onClick: () => {
                        markRead(chat.id)
                        if (chat.action_url && chat.action_url !== 'cs:chat') {
                          const router = useRouter()
                          router.push(chat.action_url)
                        } else if (chat.metadata?.product_id) {
                          const router = useRouter()
                          router.push(`/chat/${chat.metadata.product_id}`)
                        } else {
                          openCustomerService({ tab: 'chat' })
                        }
                      },
                    },
                  })
                } catch (e) {
                  console.warn('Toast trigger error:', e)
                }
              }
            }
          } else {
            // Initial load: simpan ID chat yang sudah ada agar tidak spam notifikasi awal
            for (const chat of unreadChats) {
              knownChatIds.add(chat.id)
            }
          }
        }

        notifications.value = items
        unreadCount.value = items.filter((it) => !it.is_read).length
      } else {
        // Tamu / Belum Login: Kosongkan
        notifications.value = []
        unreadCount.value = 0
        knownChatIds.clear()
      }
      hasLoaded.value = true
    } catch (err) {
      console.warn('Gagal memuat notifikasi:', err)
      notifications.value = []
      unreadCount.value = 0
    } finally {
      isLoading.value = false
    }
  }

  const markRead = async (id: string | number) => {
    const item = notifications.value.find((n) => String(n.id) === String(id))
    if (item) {
      item.is_read = true
    }
    const stored = getStoredReadIds()
    stored.add(String(id))
    saveStoredReadIds(stored)

    unreadCount.value = notifications.value.filter((it) => !it.is_read).length

    if (authStore.isAuthenticated) {
      try {
        await markNotificationAsRead(id)
      } catch {}
    }
  }

  const markAllRead = async () => {
    const stored = getStoredReadIds()
    notifications.value.forEach((item) => {
      item.is_read = true
      stored.add(String(item.id))
    })
    saveStoredReadIds(stored)
    unreadCount.value = 0

    if (authStore.isAuthenticated) {
      try {
        await markAllNotificationsAsRead()
      } catch {}
    }
  }

  const startPolling = (intervalMs = 10000) => {
    if (!import.meta.client) return
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(() => {
      if (authStore.isAuthenticated && typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        loadNotifications(true)
      }
    }, intervalMs)
  }

  const stopPolling = () => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return {
    notifications,
    unreadCount: computed(() => unreadCount.value),
    isLoading: computed(() => isLoading.value),
    loadNotifications,
    markRead,
    markAllRead,
    startPolling,
    stopPolling,
  }
}

function normalizeType(type?: string, title?: string, content?: string): 'announcement' | 'chat' | 'transaction' | 'info' {
  const t = (type || '').toLowerCase()
  const fullText = `${t} ${(title || '')} ${(content || '')}`.toLowerCase()

  // 1. Kategori Pesanan / Transaksi (Prioritas Utama jika terkait order/invoice/pembayaran)
  if (
    t === 'transaction' ||
    t === 'order' ||
    t.includes('transaksi') ||
    t.includes('payment') ||
    t.includes('bayar') ||
    fullText.includes('pesanan') ||
    fullText.includes('invoice') ||
    fullText.includes('inv-') ||
    fullText.includes('pembatalan') ||
    fullText.includes('refund') ||
    fullText.includes('dikemas') ||
    fullText.includes('dikirim') ||
    fullText.includes('resi')
  ) {
    return 'transaction'
  }

  // 2. Kategori Chat Admin / Customer Service
  if (
    t === 'chat' ||
    t.includes('chat') ||
    fullText.includes('cs:chat') ||
    fullText.includes('customer service') ||
    fullText.includes('obrolan') ||
    (t.includes('pesan') && !fullText.includes('pesanan'))
  ) {
    return 'chat'
  }

  // 3. Kategori Pengumuman / Info
  if (t.includes('announcement') || t.includes('pengumuman')) return 'announcement'
  return 'announcement'
}
