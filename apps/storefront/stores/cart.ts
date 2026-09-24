import { defineStore } from 'pinia'

export interface CartItem {
  id: string // unique cart item id (e.g. productId_size_color)
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
  }
  selectedSize?: string | null
  selectedColor?: string | null
  nim?: string | null
  quantity: number
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isCartDrawerOpen: false,
    cartBounce: false,
  }),

  getters: {
    totalItems: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: (state) => state.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    totalWeight: (state) => state.items.reduce((sum, item) => sum + ((item.product.weight || 500) * item.quantity), 0),
  },

  actions: {
    initCart() {
      if (import.meta.client) {
        const saved = localStorage.getItem('cyber_store_cart')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            // Validasi data keranjang: buang item yang tidak memiliki id valid atau rusak
            if (Array.isArray(parsed)) {
              this.items = parsed.filter(item => 
                item &&
                item.productId &&
                typeof item.quantity === 'number' &&
                item.quantity > 0 &&
                item.product &&
                typeof item.product.price === 'number'
              ).map(item => {
                if (item.product?.is_event_maba && item.quantity > 1) {
                  return { ...item, quantity: 1 }
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
      openDrawer: boolean = false
    ) {
      if (!product || !product.id) return

      const isEventMaba = Boolean(product.is_event_maba)
      const maxAllowed = isEventMaba ? 1 : (product.stock || 999)
      const safeQuantity = isEventMaba ? 1 : Math.max(1, Math.min(Math.floor(Number(quantity) || 1), maxAllowed))
      const cartItemId = `${product.id}_${size || 'none'}_${color || 'none'}_${nim || 'none'}`
      const existing = this.items.find(item => item.id === cartItemId)

      if (existing) {
        if (isEventMaba) {
          existing.quantity = 1
        } else {
          existing.quantity = Math.min(existing.quantity + safeQuantity, product.stock || 999)
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
          },
          selectedSize: size ? String(size).slice(0, 50) : null,
          selectedColor: color ? String(color).slice(0, 50) : null,
          nim: nim ? String(nim).replace(/[^a-zA-Z0-9]/g, '').slice(0, 30) : null,
          quantity: safeQuantity,
        })
      }

      this.saveCart()
      if (openDrawer) {
        this.isCartDrawerOpen = true
      }
      this.triggerCartBounce()
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
        const numQty = Math.floor(Number(quantity)) || 0
        if (numQty <= 0) {
          this.removeFromCart(itemId)
        } else {
          const maxAllowed = item.product.is_event_maba ? 1 : (item.product.stock || 999)
          item.quantity = Math.min(numQty, maxAllowed)
          this.saveCart()
        }
      }
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
