<template>
  <div class="app-root">
    <NuxtLoadingIndicator color="linear-gradient(90deg, #003399, #f59e0b)" :height="3" />
    <Navbar />
    <main class="main-content">
      <NuxtPage />
    </main>
    <CartDrawer />
    <CustomerServiceModal />
    <ToastContainer />
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()

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
  overflow-x: hidden;
  max-width: 100%;
}

.main-content {
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow-x: hidden;
}
</style>
