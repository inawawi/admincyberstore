import { useAuthStore } from '~/stores/auth'

export const useApi = () => {
  const config = useRuntimeConfig()

  // ─── Base URLs ─────────────────────────────────────────────────────────────
  // Prioritas: .env (NUXT_PUBLIC_API_BASE / NUXT_PUBLIC_STORAGE_BASE)
  // Fallback dev lokal: http://localhost:3000
  let rawApiBase = String(config.public.apiBase || 'http://localhost:3000/api/v1').trim()
  let rawStorageBase = String(config.public.storageBase || 'http://localhost:3000/storage').trim()

  // Pastikan protokol ada (tambahkan https jika tidak ada http/https)
  if (!rawApiBase.startsWith('http://') && !rawApiBase.startsWith('https://')) {
    rawApiBase = `https://${rawApiBase}`
  }
  if (!rawStorageBase.startsWith('http://') && !rawStorageBase.startsWith('https://')) {
    rawStorageBase = `https://${rawStorageBase}`
  }

  // Hapus double slashes pada path (pertahankan http:// dan https://) dan trailing slash
  rawApiBase = rawApiBase.replace(/([^:])\/\/+/g, '$1/').replace(/\/+$/, '')
  rawStorageBase = rawStorageBase.replace(/([^:])\/\/+/g, '$1/').replace(/\/+$/, '')

  // Pastikan apiBase selalu berakhiran /api/v1
  if (!rawApiBase.endsWith('/api/v1')) {
    rawApiBase = `${rawApiBase.replace(/\/api(\/v1)?$/, '')}/api/v1`
  }

  // Pastikan storageBase selalu berakhiran /storage
  if (!rawStorageBase.endsWith('/storage')) {
    rawStorageBase = `${rawStorageBase.replace(/\/api(\/v1)?$/, '')}/storage`
  }

  const apiBase = rawApiBase
  const storageBase = rawStorageBase

  const getHeaders = () => {
    const authStore = useAuthStore()
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    if (apiBase.includes('ngrok')) {
      headers['ngrok-skip-browser-warning'] = 'true'
    }
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }
    return headers
  }

  const getImageUrl = (path?: string | null): string => {
    if (!path || typeof path !== 'string' || !path.trim()) {
      return '/placeholder-product.svg'
    }

    // Normalisasi backslash Windows jika ada
    const normalized = path.replace(/\\/g, '/').trim()

    let result = ''
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      if (normalized.includes('/storage/')) {
        const sub = normalized.substring(normalized.indexOf('/storage/') + 9)
        result = `${storageBase}/${encodeURI(sub)}`
      } else if (normalized.includes('/assets/')) {
        const sub = normalized.substring(normalized.indexOf('/assets/'))
        const backendUrl = apiBase.replace(/\/api\/v1\/?$/, '')
        result = `${backendUrl}${encodeURI(sub)}`
      } else {
        result = normalized
      }
    } else {
      const cleanPath = normalized.startsWith('/') ? normalized.slice(1) : normalized

      if (cleanPath.startsWith('assets/') || cleanPath.startsWith('img/')) {
        const backendUrl = apiBase.replace(/\/api\/v1\/?$/, '')
        result = `${backendUrl}/${encodeURI(cleanPath)}`
      } else {
        result = `${storageBase}/${encodeURI(cleanPath)}`
      }
    }

    if (result && result.includes('ngrok-free') && !result.includes('ngrok-skip-browser-warning')) {
      result += result.includes('?') ? '&ngrok-skip-browser-warning=true' : '?ngrok-skip-browser-warning=true'
    }

    return result
  }

  // Fetch product list with filters
  const fetchProducts = async (params: {
    page?: number
    per_page?: number
    category_id?: number | string
    search?: string
    is_recommended?: boolean | number
    is_event_maba?: boolean | number
  } = {}) => {
    return await $fetch<any>(`${apiBase}/products`, {
      params,
      headers: getHeaders(),
    }).catch((err) => {
      console.error('Failed to fetch products:', err)
      return { data: [], total: 0, current_page: 1, last_page: 1 }
    })
  }

  // Fetch single product detail dengan sanitasi ketat anti-injeksi
  const fetchProductDetail = async (id: number | string) => {
    if (!id) return null
    const rawId = String(id).trim()

    // Tolak karakter berbahaya (kutip, titik dua, semikolon, spasi, kurung, tag script, dsb)
    if (/[^a-zA-Z0-9\-_=.]/.test(rawId)) {
      console.warn(`[Security Alert] Request produk dengan karakter ilegal diblokir: "${rawId}"`)
      return null
    }

    const cleanId = encodeURIComponent(rawId)
    return await $fetch<{ product: any }>(`${apiBase}/products/${cleanId}`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error(`Failed to fetch product ${cleanId}:`, err)
      return null
    })
  }

  // Fetch active categories
  const fetchCategories = async () => {
    return await $fetch<{ categories: any[] }>(`${apiBase}/categories`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error('Failed to fetch categories:', err)
      return { categories: [] }
    })
  }

  // Fetch promo banners
  const fetchBanners = async () => {
    return await $fetch<{ banners: any[] }>(`${apiBase}/banners`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error('Failed to fetch banners:', err)
      return { banners: [] }
    })
  }

  // Fetch product reviews dengan sanitasi ketat
  const fetchProductReviews = async (productId: number | string) => {
    if (!productId) return { reviews: [] }
    const rawId = String(productId).trim()

    if (/[^a-zA-Z0-9\-_=.]/.test(rawId)) {
      return { reviews: [] }
    }

    const cleanId = encodeURIComponent(rawId)
    return await $fetch<{ reviews: any[] }>(`${apiBase}/products/${cleanId}/reviews`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error(`Failed to fetch reviews for product ${cleanId}:`, err)
      return { reviews: [] }
    })
  }

  // Submit Product Review (Supports multipart/form-data for image uploads)
  const submitProductReview = async (productId: number | string, formData: FormData) => {
    const rawId = String(productId).trim()
    const cleanId = encodeURIComponent(rawId)
    const headers = getHeaders()

    return await $fetch<any>(`${apiBase}/products/${cleanId}/reviews`, {
      method: 'POST',
      body: formData,
      headers,
    })
  }

  // Check review eligibility (if user bought product and package arrived/completed)
  const checkReviewEligibility = async (productId: number | string) => {
    const rawId = String(productId).trim()
    const cleanId = encodeURIComponent(rawId)
    const headers = getHeaders()

    try {
      return await $fetch<any>(`${apiBase}/products/${cleanId}/review-eligibility`, {
        headers,
      })
    } catch (err: any) {
      console.error(`Failed to check review eligibility for product ${cleanId}:`, err)
      return {
        can_review: false,
        has_purchased: false,
        reason: 'error',
        message: err?.data?.message || 'Gagal memverifikasi status pembelian.',
      }
    }
  }

  // Fetch Expeditions
  const fetchExpeditions = async () => {
    return await $fetch<{ expeditions: any[] }>(`${apiBase}/expeditions`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error('Failed to fetch expeditions:', err)
      return { expeditions: [] }
    })
  }

  // Fetch Customer Addresses
  const fetchAddresses = async () => {
    return await $fetch<{ addresses: any[] }>(`${apiBase}/addresses`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error('Failed to fetch addresses:', err)
      return { addresses: [] }
    })
  }

  // Create Customer Address
  const createAddress = async (payload: any) => {
    return await $fetch<{ address: any; message: string; data?: any }>(`${apiBase}/addresses`, {
      method: 'POST',
      body: payload,
      headers: getHeaders(),
    })
  }

  // Update Customer Address
  const updateAddress = async (id: number | string, payload: any) => {
    return await $fetch<{ address: any; message: string }>(`${apiBase}/addresses/${id}`, {
      method: 'PUT',
      body: payload,
      headers: getHeaders(),
    })
  }

  // Delete Customer Address
  const deleteAddress = async (id: number | string) => {
    return await $fetch<{ message: string }>(`${apiBase}/addresses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
  }

  // Set Address as Default
  const setDefaultAddress = async (id: number | string, addressData: any) => {
    return await $fetch<{ address: any; message: string }>(`${apiBase}/addresses/${id}`, {
      method: 'PUT',
      body: {
        ...addressData,
        is_default: true,
      },
      headers: getHeaders(),
    })
  }

  // Checkout API (Creates order & gets Midtrans Snap Token)
  const checkoutOrder = async (payload: {
    customer_address_id: number | string
    expedition_id: number | string
    note?: string
    items?: Array<{
      product_id: number | string
      quantity: number
      size?: string | null
      color?: string | null
    }>
  }) => {
    return await $fetch<any>(`${apiBase}/checkout`, {
      method: 'POST',
      body: payload,
      headers: getHeaders(),
    })
  }

  // Fetch Orders
  const fetchOrders = async (params?: { status?: string; search?: string; page?: number }) => {
    return await $fetch<any>(`${apiBase}/orders`, {
      headers: getHeaders(),
      params,
    }).catch((err) => {
      console.error('Failed to fetch orders:', err)
      return { data: [], total: 0 }
    })
  }

  // Fetch Order Detail
  const fetchOrderDetail = async (orderId: number | string) => {
    return await $fetch<any>(`${apiBase}/orders/${orderId}`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.error(`Failed to fetch order ${orderId}:`, err)
      return null
    })
  }

  // Track Waybill from Courier API
  const trackOrderWaybill = async (orderId: number | string) => {
    return await $fetch<any>(`${apiBase}/orders/${orderId}/track`, {
      method: 'POST',
      headers: getHeaders(),
    })
  }

  // Complete Order (Customer confirms arrival)
  const completeOrder = async (orderId: number | string) => {
    return await $fetch<any>(`${apiBase}/orders/${orderId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
    })
  }

  // Cancel Order
  const cancelOrder = async (orderId: number | string, reason?: string) => {
    return await $fetch<any>(`${apiBase}/orders/${orderId}/cancel`, {
      method: 'POST',
      body: { reason: reason || 'Dibatalkan oleh pembeli' },
      headers: getHeaders(),
    })
  }

  // Simulate Courier POD (Proof of Delivery simulation for testing & demonstration)
  const simulateCourierPod = async (orderId: number | string) => {
    return await $fetch<any>(`${apiBase}/orders/${orderId}/simulate-courier-pod`, {
      method: 'POST',
      headers: getHeaders(),
    })
  }

  // Check and sync payment status with Midtrans
  const checkPaymentStatus = async (paymentId: number | string) => {
    return await $fetch<any>(`${apiBase}/payments/${paymentId}/check-status`, {
      method: 'POST',
      headers: getHeaders(),
    })
  }

  // Fetch store configuration info (with in-memory cache to prevent socket exhaustion)
  const fetchStoreInfo = async () => {
    const cached = useState<any>('cached_store_info', () => null)
    if (cached.value) {
      return cached.value
    }
    try {
      const res = await $fetch<any>(`${apiBase}/store-info`, {
        headers: getHeaders(),
      })
      if (!res) return null
      // admincyberstore returns `name`/`logo`; storefront components use
      // `store_name`/`store_logo`. Keep both response formats compatible.
      const info = {
        ...res,
        store_name: res.store_name ?? res.name,
        store_logo: res.store_logo ?? res.logo,
      }
      cached.value = info
      return info
    } catch (err) {
      console.error('Failed to fetch store info:', err)
      return null
    }
  }

  // Fetch help info (FAQ, CS contacts, panduan)
  const fetchHelp = async () => {
    const cached = useState<any>('cached_help_info', () => null)
    if (cached.value) {
      return cached.value
    }
    try {
      const res = await $fetch<any>(`${apiBase}/help`, {
        headers: getHeaders(),
      })
      if (res) {
        cached.value = res
      }
      return res
    } catch (err) {
      console.warn('Failed to fetch help info:', err)
      return null
    }
  }

  // Fetch user notifications (Announcements, Chat, and Transactions)
  const fetchNotifications = async () => {
    return await $fetch<{ unread_count: number; notifications: any[] }>(`${apiBase}/notifications`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.warn('Failed to fetch notifications:', err)
      return { unread_count: 0, notifications: [] }
    })
  }

  // Mark single notification as read
  const markNotificationAsRead = async (id: number | string) => {
    return await $fetch<any>(`${apiBase}/notifications/${id}/read`, {
      method: 'POST',
      headers: getHeaders(),
    }).catch((err) => {
      console.warn(`Failed to mark notification ${id} as read:`, err)
      return null
    })
  }

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    return await $fetch<any>(`${apiBase}/notifications/read-all`, {
      method: 'POST',
      headers: getHeaders(),
    }).catch((err) => {
      console.warn('Failed to mark all notifications as read:', err)
      return null
    })
  }

  // Fetch user chats (with Admin CS)
  const fetchChats = async () => {
    return await $fetch<{ chats: any[] }>(`${apiBase}/chats`, {
      headers: getHeaders(),
    }).catch((err) => {
      console.warn('Failed to fetch chats:', err)
      return { chats: [] }
    })
  }

  // Create new chat with admin/CS
  const createChat = async (payload: { subject?: string; message: string; product_id?: number | string }) => {
    return await $fetch<any>(`${apiBase}/chats`, {
      method: 'POST',
      body: payload,
      headers: getHeaders(),
    })
  }

  // Fetch messages in a chat
  const fetchChatMessages = async (chatId: number | string, afterId?: number) => {
    const params: Record<string, any> = {}
    if (afterId) params.after_id = afterId
    return await $fetch<{ chat_id: number; status: string; messages: any[] }>(`${apiBase}/chats/${chatId}/messages`, {
      headers: getHeaders(),
      params,
    }).catch((err) => {
      console.warn(`Failed to fetch messages for chat ${chatId}:`, err)
      return { chat_id: Number(chatId), status: 'closed', messages: [] }
    })
  }

  // Send message to CS in a chat
  const sendChatMessage = async (chatId: number | string, message: string, productId?: number | string) => {
    return await $fetch<any>(`${apiBase}/chats/${chatId}/messages`, {
      method: 'POST',
      body: { message, ...(productId ? { product_id: productId } : {}) },
      headers: getHeaders(),
    })
  }

  return {
    apiBase,
    storageBase,
    getImageUrl,
    fetchProducts,
    fetchProductDetail,
    fetchCategories,
    fetchBanners,
    fetchProductReviews,
    submitProductReview,
    checkReviewEligibility,
    fetchExpeditions,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    checkoutOrder,
    fetchOrders,
    fetchOrderDetail,
    checkPaymentStatus,
    trackOrderWaybill,
    completeOrder,
    cancelOrder,
    simulateCourierPod,
    fetchStoreInfo,
    fetchHelp,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    fetchChats,
    createChat,
    fetchChatMessages,
    sendChatMessage,
  }
}
