import { ref } from 'vue'

export interface CustomerServiceOptions {
  tab?: 'chat' | 'contact' | 'faq'
  productId?: number | string | null
  productName?: string | null
  initialMessage?: string | null
}

const isCustomerServiceOpen = ref(false)
const activeTab = ref<'chat' | 'contact' | 'faq'>('chat')
const selectedProduct = ref<{ id: number | string; name: string } | null>(null)
const prefilledMessage = ref<string>('')

export const useCustomerService = () => {
  const openCustomerService = (options?: CustomerServiceOptions) => {
    if (options?.tab) {
      activeTab.value = options.tab
    } else {
      activeTab.value = 'chat'
    }

    if (options?.productId && options?.productName) {
      selectedProduct.value = {
        id: options.productId,
        name: options.productName,
      }
    } else {
      selectedProduct.value = null
    }

    if (options?.initialMessage) {
      prefilledMessage.value = options.initialMessage
    } else {
      prefilledMessage.value = ''
    }

    isCustomerServiceOpen.value = true
  }

  const closeCustomerService = () => {
    isCustomerServiceOpen.value = false
  }

  const switchTab = (tab: 'chat' | 'contact' | 'faq') => {
    activeTab.value = tab
  }

  return {
    isCustomerServiceOpen,
    activeTab,
    selectedProduct,
    prefilledMessage,
    openCustomerService,
    closeCustomerService,
    switchTab,
  }
}
