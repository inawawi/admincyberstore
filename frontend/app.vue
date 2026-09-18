<template>
  <div class="app-root">
    <NuxtLoadingIndicator color="linear-gradient(90deg, #003399, #f59e0b)" :height="3" />
    <Navbar />
    <main class="main-content">
      <NuxtPage />
    </main>
    <CartDrawer />
    <CustomerServiceModal />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

const cartStore = useCartStore()
const authStore = useAuthStore()
const { fetchStoreInfo, getImageUrl } = useApi()

const { data: storeInfo } = await useAsyncData('store-info-root', () => fetchStoreInfo(), {
  default: () => null
})

const faviconUrl = computed(() => {
  const info = storeInfo.value
  const logo = info?.store_logo || info?.logo || info?.data?.store_logo || info?.data?.logo
  if (logo) {
    return getImageUrl(logo)
  }
  return '/logo-cyberstore.ico'
})

const storeTitle = computed(() => {
  const info = storeInfo.value
  const name = info?.store_name || info?.name || info?.data?.store_name || info?.data?.name
  return name ? `${name} | Futuristic Tech & Lifestyle Gear` : 'Cyber Store | Futuristic Tech & Lifestyle Gear'
})

useHead({
  title: storeTitle,
  link: [
    { rel: 'icon', href: faviconUrl },
    { rel: 'shortcut icon', href: faviconUrl },
    { rel: 'apple-touch-icon', href: faviconUrl },
  ],
})

onMounted(() => {
  cartStore.initCart()
  authStore.initAuth()
})
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
