import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
  primary?: boolean
}

export interface ToastOptions {
  id?: string
  title?: string
  message: string
  type?: ToastType
  tag?: string
  footerNote?: string
  icon?: string
  duration?: number // Milliseconds (default: 4500, 0 = persistent)
  action?: ToastAction
  sound?: boolean // Play subtle synthesized chime
}

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message: string
  tag: string
  footerNote?: string
  icon?: string
  duration: number
  remaining: number
  progress: number // 0 to 100 percentage
  action?: ToastAction
  sound?: boolean
  createdAt: number
  isPaused: boolean
  _timer?: any
  _interval?: any
}

// Global reactive toasts list
const toasts = ref<ToastItem[]>([])

/**
 * Play subtle, elegant synthesized audio chime via Web Audio API.
 * Pure sine tone with soft envelope - no external sound files required.
 */
function playCyberChime(type: ToastType) {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'

    // Frequencies tailored for notification feel
    let freq1 = 587.33 // D5
    let freq2 = 880.00 // A5
    if (type === 'success') {
      freq1 = 523.25 // C5
      freq2 = 1046.50 // C6 (clean upward bell)
    } else if (type === 'error') {
      freq1 = 440.00 // A4
      freq2 = 349.23 // F4 (minor downward)
    } else if (type === 'warning') {
      freq1 = 659.25 // E5
      freq2 = 783.99 // G5
    }

    const now = ctx.currentTime
    osc.frequency.setValueAtTime(freq1, now)
    osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.1)

    // Soft gentle volume envelope
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.36)

    setTimeout(() => {
      ctx.close().catch(() => {})
    }, 400)
  } catch {
    // Audio playback error or autoplay policy - gracefully ignore
  }
}

export function useToast() {
  /**
   * Remove a specific toast by its ID
   */
  const remove = (id: string) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      const item = toasts.value[idx]
      if (item._timer) clearTimeout(item._timer)
      if (item._interval) clearInterval(item._interval)
      toasts.value.splice(idx, 1)
    }
  }

  /**
   * Clear all toasts
   */
  const clear = () => {
    toasts.value.forEach(t => {
      if (t._timer) clearTimeout(t._timer)
      if (t._interval) clearInterval(t._interval)
    })
    toasts.value = []
  }

  /**
   * Pause countdown when user hovers over a toast
   */
  const pause = (id: string) => {
    const item = toasts.value.find(t => t.id === id)
    if (!item || item.duration <= 0 || item.isPaused) return

    item.isPaused = true
    if (item._interval) {
      clearInterval(item._interval)
      item._interval = null
    }
    if (item._timer) {
      clearTimeout(item._timer)
      item._timer = null
    }
  }

  /**
   * Resume countdown when user stops hovering
   */
  const resume = (id: string) => {
    const item = toasts.value.find(t => t.id === id)
    if (!item || item.duration <= 0 || !item.isPaused) return

    item.isPaused = false
    startCountdown(item)
  }

  /**
   * Internal helper to start the progress countdown
   */
  const startCountdown = (item: ToastItem) => {
    if (item.duration <= 0) return

    const tickInterval = 50 // Update every 50ms for smooth progress bar

    item._interval = setInterval(() => {
      if (item.isPaused) return

      item.remaining = Math.max(0, item.remaining - tickInterval)
      item.progress = Math.max(0, Math.min(100, (item.remaining / item.duration) * 100))

      if (item.remaining <= 0) {
        clearInterval(item._interval)
        remove(item.id)
      }
    }, tickInterval)
  }

  /**
   * Show a toast with full options
   */
  const show = (options: ToastOptions): string => {
    const id = options.id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const type: ToastType = options.type || 'info'
    const duration = typeof options.duration === 'number' ? options.duration : 4500

    // Default badge tags based on semantic type
    let defaultTag = 'INFORMASI'
    let defaultTitle = 'Pemberitahuan'
    if (type === 'success') {
      defaultTag = 'BERHASIL'
      defaultTitle = 'Aksi Berhasil'
    } else if (type === 'error') {
      defaultTag = 'PERHATIAN'
      defaultTitle = 'Terjadi Kesalahan'
    } else if (type === 'warning') {
      defaultTag = 'PERINGATAN'
      defaultTitle = 'Peringatan Sistem'
    }

    const toastItem: ToastItem = {
      id,
      type,
      title: options.title || defaultTitle,
      message: options.message,
      tag: options.tag || defaultTag,
      footerNote: options.footerNote,
      icon: options.icon,
      duration,
      remaining: duration,
      progress: 100,
      action: options.action,
      sound: options.sound ?? true,
      createdAt: Date.now(),
      isPaused: false,
    }

    // Limit maximum concurrent visible toasts to 4 to prevent screen clutter
    if (toasts.value.length >= 4) {
      const oldest = toasts.value[0]
      if (oldest) remove(oldest.id)
    }

    toasts.value.push(toastItem)
    startCountdown(toastItem)

    // Play subtle audio if enabled
    if (toastItem.sound && import.meta.client) {
      playCyberChime(type)
    }

    return id
  }

  const success = (message: string, options: Partial<ToastOptions> = {}) => {
    return show({
      ...options,
      message,
      type: 'success',
      title: options.title || 'Aksi Berhasil',
      tag: options.tag || 'BERHASIL',
    })
  }

  const error = (message: string, options: Partial<ToastOptions> = {}) => {
    return show({
      ...options,
      message,
      type: 'error',
      title: options.title || 'Gagal Memproses',
      tag: options.tag || 'KESALAHAN',
      duration: options.duration ?? 5500, // Error toasts stay slightly longer
    })
  }

  const warning = (message: string, options: Partial<ToastOptions> = {}) => {
    return show({
      ...options,
      message,
      type: 'warning',
      title: options.title || 'Peringatan',
      tag: options.tag || 'PERINGATAN',
    })
  }

  const info = (message: string, options: Partial<ToastOptions> = {}) => {
    return show({
      ...options,
      message,
      type: 'info',
      title: options.title || 'Informasi',
      tag: options.tag || 'INFO RESMI',
    })
  }

  return {
    toasts: readonly(toasts),
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear,
    pause,
    resume,
  }
}
