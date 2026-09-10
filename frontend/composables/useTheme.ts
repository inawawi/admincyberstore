import { ref, computed } from 'vue'

const currentTheme = ref<'light' | 'dark'>('light')
const isInitialized = ref(false)

export function useTheme() {
  const initTheme = () => {
    if (typeof window === 'undefined' || isInitialized.value) return
    isInitialized.value = true

    const saved = localStorage.getItem('cybershop_theme') as 'light' | 'dark' | null
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved)
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setTheme(prefersDark ? 'dark' : 'light')
    }
  }

  const setTheme = (mode: 'light' | 'dark') => {
    currentTheme.value = mode
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode)
      document.body.setAttribute('data-theme', mode)
      if (mode === 'dark') {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark')
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cybershop_theme', mode)
    }
  }

  const toggleTheme = () => {
    const next = currentTheme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return {
    theme: currentTheme,
    isDark: computed(() => currentTheme.value === 'dark'),
    toggleTheme,
    setTheme,
    initTheme,
  }
}
