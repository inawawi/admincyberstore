import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Coba inisialisasi sesi dari storage/cookie jika belum terinisialisasi
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }

  // Jika tetap belum terotentikasi, alihkan ke halaman login dengan parameter redirect yang aman
  if (!authStore.isAuthenticated) {
    const redirectPath = to.fullPath.startsWith('/') && !to.fullPath.startsWith('//') ? to.fullPath : '/'
    return navigateTo(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`)
  }
})
