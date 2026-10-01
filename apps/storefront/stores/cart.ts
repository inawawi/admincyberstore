import { defineStore } from 'pinia'
import { useAuthStore } from '~/stores/auth'
import { useToast } from '~/composables/useToast'
import { navigateTo } from '#imports'

export interface CartItem {
  id: string // unique cart item id (e.g. productId_size_color_nim)
  productId: number | string
  product: {
    id: number | string
    encrypted_id?: string | null
    name: string
    price: number
    original_price?: number | null
    main_photo?: string | null
    slug?: string
    stock: number
    weight?: number
    is_event_maba?: boolean
    sizes?: string[]
    colors?: any[]
  }
  selectedSize?: string | null
  selectedColor?: string | null
  nim?: string | null
  campus_location?: string | null
  quantity: number
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isCartDrawerOpen: false,
    cartBounce: false,
    defaultMabaCampus: 'UBSI Kampus Kramat 98 (Pusat / Rektorat)',
  }),

  getters: {
    totalItems: (state) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return 0
      return state.items.reduce((total, item) => total + item.quantity, 0)
    },
    subtotal: (state) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return 0
      return state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
    },
    totalWeight: (state) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return 0
      return state.items.reduce((sum, item) => sum + ((item.product.weight || 500) * item.quantity), 0)
    },
    hasEventMaba: (state) => {
      return state.items.some(item => item.product?.is_event_maba)
    },
    eventMabaItems: (state) => {
      return state.items.filter(item => item.product?.is_event_maba)
    },
    mabaCampusLocation: (state) => {
      const mabaItem = state.items.find(item => item.product?.is_event_maba && item.campus_location)
      return mabaItem?.campus_location || state.defaultMabaCampus
    },
  },

  actions: {
    initCart() {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        this.items = []
        return
      }

      if (import.meta.client) {
        const saved = localStorage.getItem('cyber_store_cart')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            // Validasi data keranjang: buang item yang tidak memiliki id valid atau rusak
            if (Array.isArray(parsed)) {
              this.items = parsed
                .filter(item =>
                  item &&
                  item.productId &&
                  typeof item.quantity === 'number' &&
                  item.quantity > 0 &&
                  item.product &&
                  typeof item.product.price === 'number'
                )
                .map(item => {
                  if (item.product?.is_event_maba) {
                    if (item.quantity > 1) {
                      item.quantity = 1
                    }
                    if (!item.campus_location) {
                      item.campus_location = this.defaultMabaCampus
                    }
                  }
                  return item
                })
            }
          } catch (e) {
            console.error('Failed to parse saved cart:', e)
            this.items = []
          }
        }
      }
    },

    saveCart() {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        this.items = []
        if (import.meta.client) {
          localStorage.removeItem('cyber_store_cart')
        }
        return
      }

      if (import.meta.client) {
        localStorage.setItem('cyber_store_cart', JSON.stringify(this.items))
      }
    },

    addToCart(
      product: any,
      quantity: number = 1,
      size?: string | null,
      color?: string | null,
      nim?: string | null,
      openDrawer: boolean = false,
      campusLocation?: string | null
    ): boolean {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) {
        if (import.meta.client) {
          try {
            const toast = useToast()
            toast.warning('Silakan masuk ke akun Anda terlebih dahulu untuk menambahkan produk ke keranjang.', {
              title: 'Perlu Masuk Akun',
              tag: 'AUTENTIKASI',
              duration: 4000,
            })
          } catch (e) {
            // ignore
          }
          navigateTo('/auth/login')
        }
        return false
      }

      if (!product || !product.id) return false

      const isEventMaba = Boolean(product.is_event_maba)
      const maxAllowed = isEventMaba ? 1 : (product.stock || 999)
      const safeQuantity = isEventMaba ? 1 : Math.max(1, Math.min(Math.floor(Number(quantity) || 1), maxAllowed))
      const cleanNim = nim ? String(nim).replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) : null
      const selectedCampus = isEventMaba ? (campusLocation || this.defaultMabaCampus) : null
      const cartItemId = `${product.id}_${size || 'none'}_${color || 'none'}_${cleanNim || 'none'}`
      const existing = this.items.find(item => item.id === cartItemId)

      // Normalize available sizes
      let availableSizes: string[] = []
      if (Array.isArray(product.sizes)) {
        availableSizes = product.sizes.map(String)
      } else if (typeof product.sizes === 'string') {
        try {
          const parsed = JSON.parse(product.sizes)
          if (Array.isArray(parsed)) availableSizes = parsed.map(String)
        } catch {
          availableSizes = product.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        }
      }

      if (isEventMaba && availableSizes.length === 0) {
        availableSizes = ['S', 'M', 'L', 'XL', 'XXL', '3XL']
      }

      if (existing) {
        if (isEventMaba) {
          existing.quantity = 1
          if (selectedCampus) {
            existing.campus_location = selectedCampus
          }
        } else {
          existing.quantity = Math.min(existing.quantity + safeQuantity, product.stock || 999)
        }
        if (availableSizes.length > 0 && (!existing.product.sizes || existing.product.sizes.length === 0)) {
          existing.product.sizes = availableSizes
        }
      } else {
        this.items.push({
          id: cartItemId,
          productId: product.id,
          product: {
            id: product.id,
            encrypted_id: product.encrypted_id || null,
            name: String(product.name || 'Produk'),
            price: Number(product.price) || 0,
            original_price: product.original_price ? Number(product.original_price) : null,
            main_photo: product.main_photo || null,
            slug: product.slug || '',
            stock: Number(product.stock) || 0,
            weight: Number(product.weight) || 500,
            is_event_maba: isEventMaba,
            sizes: availableSizes,
            colors: Array.isArray(product.colors) ? product.colors : [],
          },
          selectedSize: size ? String(size).slice(0, 50) : null,
          selectedColor: color ? String(color).slice(0, 50) : null,
          nim: cleanNim,
          campus_location: selectedCampus,
          quantity: safeQuantity,
        })
      }

      this.saveCart()
      if (openDrawer) {
        this.isCartDrawerOpen = true
      }
      this.triggerCartBounce()
      return true
    },

    triggerCartBounce() {
      this.cartBounce = true
      setTimeout(() => {
        this.cartBounce = false
      }, 750)
    },

    updateQuantity(itemId: string, quantity: number) {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        if (item.product?.is_event_maba) {
          item.quantity = 1
          this.saveCart()
          return
        }
        const numQty = Math.floor(Number(quantity)) || 1
        const maxAllowed = item.product.stock || 999
        item.quantity = Math.max(1, Math.min(numQty, maxAllowed))
        this.saveCart()
      }
    },

    changeItemSize(itemId: string, newSize: string): boolean {
      if (!newSize) return false
      const targetIndex = this.items.findIndex(i => i.id === itemId)
      if (targetIndex === -1) return false

      const item = this.items[targetIndex]
      if (!item || !item.product) return false
      if (item.selectedSize === newSize) return true

      // Validasi stok produk jika stock habis
      if (typeof item.product.stock === 'number' && item.product.stock <= 0) {
        try {
          const toast = useToast()
          toast.warning('Stok produk untuk varian ini sedang tidak tersedia.', {
            title: 'Stok Tidak Cukup',
            duration: 3500,
          })
        } catch {
          // ignore
        }
        return false
      }

      const newCartItemId = `${item.productId}_${newSize}_${item.selectedColor || 'none'}_${item.nim || 'none'}`
      const duplicateIndex = this.items.findIndex((i, idx) => idx !== targetIndex && i.id === newCartItemId)

      if (duplicateIndex !== -1) {
        // Jika varian ukuran baru sudah ada di keranjang, merge ke item tersebut
        const duplicateItem = this.items[duplicateIndex]
        if (duplicateItem) {
          if (item.product.is_event_maba) {
            duplicateItem.quantity = 1
          } else {
            const maxAllowed = item.product.stock || 999
            duplicateItem.quantity = Math.min(duplicateItem.quantity + item.quantity, maxAllowed)
          }
        }
        this.items.splice(targetIndex, 1)
      } else {
        item.selectedSize = newSize
        item.id = newCartItemId
      }

      this.saveCart()
      return true
    },

    changeItemCampus(itemId: string, campusName: string) {
      if (!campusName) return
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.campus_location = campusName
        this.saveCart()
      }
    },

    setAllMabaCampus(campusName: string) {
      if (!campusName) return
      this.defaultMabaCampus = campusName
      this.items.forEach(item => {
        if (item.product?.is_event_maba) {
          item.campus_location = campusName
        }
      })
      this.saveCart()
    },

    removeFromCart(itemId: string) {
      this.items = this.items.filter(item => item.id !== itemId)
      this.saveCart()
    },

    clearCart() {
      this.items = []
      this.saveCart()
    },

    openCart() {
      this.isCartDrawerOpen = true
    },

    closeCart() {
      this.isCartDrawerOpen = false
    },

    toggleCart() {
      this.isCartDrawerOpen = !this.isCartDrawerOpen
    },
  },
})
