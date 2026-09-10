import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

export interface AppNotification {
  id: string | number
  announcement_id?: number | null
  title: string
  content: string
  type: 'announcement' | 'chat' | 'transaction' | 'info' | 'promo'
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

export const useNotifications = () => {
  const authStore = useAuthStore()
  const { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, fetchStoreInfo, fetchOrders, fetchChats } = useApi()

  const loadNotifications = async (force = false) => {
    if (hasLoaded.value && !force) return
    isLoading.value = true

    try {
      if (authStore.isAuthenticated) {
        // 1. Ambil notifikasi dari endpoint utama /api/v1/notifications
        const notifRes = await fetchNotifications()
        let items: AppNotification[] = (notifRes?.notifications || []).map((n: any) => ({
          id: n.id,
          announcement_id: n.announcement_id,
          title: n.title || 'Pemberitahuan',
          content: n.content || '',
          type: normalizeType(n.type),
          action_url: n.action_url || null,
          is_read: !!n.is_read,
          read_at: n.read_at,
          created_at: n.created_at || new Date().toISOString(),
        }))

        // 2. Sinkronkan dengan update riwayat transaksi pembayaran terbaru
        try {
          const ordersRes = await fetchOrders({ page: 1 })
          const orders = ordersRes?.data || []
          orders.slice(0, 5).forEach((order: any) => {
            const orderNotifId = `order-${order.id}-${order.status}`
            // Jika belum ada notifikasi untuk status order ini di list
            if (!items.some((it) => it.id === orderNotifId)) {
              items.push({
                id: orderNotifId,
                title: getOrderNotifTitle(order.status),
                content: `Pesanan #${order.order_number || order.id} (${order.status_label || order.status}) senilai Rp ${Number(order.total_amount || 0).toLocaleString('id-ID')}`,
                type: 'transaction',
                action_url: `/account/orders?id=${order.id}`,
                is_read: order.status === 'completed' || order.status === 'cancelled',
                created_at: order.updated_at || order.created_at,
                metadata: { orderId: order.id, status: order.status },
              })
            }
          })
        } catch (e) {
          // Ignore order sync error
        }

        // 3. Sinkronkan dengan chat admin jika ada pesan belum terbaca
        try {
          const chatsRes = await fetchChats()
          const chats = chatsRes?.chats || []
          chats.forEach((chat: any) => {
            if (chat.unread_count > 0) {
              const chatNotifId = `chat-${chat.id}-${chat.last_message_at}`
              if (!items.some((it) => it.id === chatNotifId)) {
                items.unshift({
                  id: chatNotifId,
                  title: 'Pesan Baru dari Admin CS',
                  content: chat.last_message || `Admin membalas percakapan "${chat.subject}"`,
                  type: 'chat',
                  action_url: 'cs:chat',
                  is_read: false,
                  created_at: chat.last_message_at || chat.created_at,
                  metadata: { chatId: chat.id },
                })
              }
            }
          })
        } catch (e) {
          // Ignore chat sync error
        }

        // Urutkan notifikasi terbaru di paling atas
        items.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateB - dateA
        })

        notifications.value = items
        unreadCount.value = items.filter((it) => !it.is_read).length
      } else {
        // Tamu / Belum Login: Tampilkan pengumuman toko publik
        const storeInfo = await fetchStoreInfo()
        if (storeInfo?.announcement?.text) {
          notifications.value = [
            {
              id: 'public-announcement',
              title: storeInfo.announcement.badge || 'Pengumuman Resmi BSI Cyber Store',
              content: storeInfo.announcement.text.replace(/<[^>]*>?/gm, ''),
              type: 'announcement',
              action_url: storeInfo.announcement.link || '/products',
              is_read: false,
              created_at: new Date().toISOString(),
            },
          ]
          unreadCount.value = 1
        } else {
          notifications.value = []
          unreadCount.value = 0
        }
      }
      hasLoaded.value = true
    } catch (err) {
      console.warn('Gagal memuat notifikasi:', err)
    } finally {
      isLoading.value = false
    }
  }

  const markRead = async (id: string | number) => {
    const item = notifications.value.find((n) => n.id === id)
    if (item && !item.is_read) {
      item.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)

      // Jika ID angka (dari database UserNotification), panggil endpoint backend
      if (typeof id === 'number' || (!String(id).includes('order-') && !String(id).includes('chat-') && !String(id).includes('public-'))) {
        await markNotificationAsRead(id)
      }
    }
  }

  const markAllRead = async () => {
    notifications.value.forEach((item) => {
      item.is_read = true
    })
    unreadCount.value = 0

    if (authStore.isAuthenticated) {
      await markAllNotificationsAsRead()
    }
  }

  return {
    notifications,
    unreadCount: computed(() => unreadCount.value),
    isLoading: computed(() => isLoading.value),
    loadNotifications,
    markRead,
    markAllRead,
  }
}

function normalizeType(type?: string): 'announcement' | 'chat' | 'transaction' | 'info' | 'promo' {
  if (!type) return 'announcement'
  const t = type.toLowerCase()
  if (t.includes('chat') || t.includes('pesan')) return 'chat'
  if (t.includes('order') || t.includes('transaksi') || t.includes('payment') || t.includes('bayar')) return 'transaction'
  if (t.includes('promo') || t.includes('diskon')) return 'promo'
  if (t.includes('announcement') || t.includes('pengumuman')) return 'announcement'
  return 'info'
}

function getOrderNotifTitle(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'Menunggu Pembayaran'
    case 'paid':
      return 'Pembayaran Berhasil Diverifikasi'
    case 'processing':
      return 'Pesanan Sedang Dikemas'
    case 'shipped':
      return 'Pesanan Sedang Dalam Pengiriman'
    case 'delivered':
      return 'Paket Telah Tiba di Alamat Tujuan'
    case 'completed':
      return 'Transaksi Pembayaran Selesai'
    case 'cancelled':
      return 'Pesanan Telah Dibatalkan'
    default:
      return 'Pembaruan Status Transaksi'
  }
}
