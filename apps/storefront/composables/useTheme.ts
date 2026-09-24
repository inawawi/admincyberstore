import { ref, computed } from 'vue'

const currentTheme = ref<'light'>('light')
const isInitialized = ref(false)

export function useTheme() {
  const initTheme = () => {
    if (typeof window === 'undefined' || isInitialized.value) return
    isInitialized.value = true

    // Enforce light mode and cleanup any residual dark theme
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme')
      document.body.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cybershop_theme')
    }
  }

  const setTheme = (_mode?: string) => {
    currentTheme.value = 'light'
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme')
      document.body.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('cybershop_theme')
    }
  }

  const toggleTheme = () => {
    setTheme('light')
  }

  return {
    theme: currentTheme,
    isDark: computed(() => false),
    toggleTheme,
    setTheme,
    initTheme,
  }
}
