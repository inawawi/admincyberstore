declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: any) => void
          onPending?: (result: any) => void
          onError?: (result: any) => void
          onClose?: () => void
        }
      ) => void
    }
  }
}

export interface MidtransCallbacks {
  onSuccess?: (result: any) => void
  onPending?: (result: any) => void
  onError?: (result: any) => void
  onClose?: () => void
}

export const useMidtrans = () => {
  const config = useRuntimeConfig()
  const snapUrl = (config.public.midtransSnapUrl as string) || 'https://app.sandbox.midtrans.com/snap/snap.js'
  const clientKey = (config.public.midtransClientKey as string) || 'Mid-client-twV4rNnPglIA4-2a'

  const loadSnap = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!import.meta.client) {
        return resolve()
      }

      if (window.snap) {
        return resolve()
      }

      const existingScript = document.getElementById('midtrans-snap-script') as HTMLScriptElement | null
      if (existingScript) {
        if (window.snap) return resolve()
        existingScript.addEventListener('load', () => resolve())
        existingScript.addEventListener('error', (e) => reject(e))
        return
      }

      const script = document.createElement('script')
      script.id = 'midtrans-snap-script'
      script.src = snapUrl
      script.setAttribute('data-client-key', clientKey)
      script.async = true
      script.onload = () => resolve()
      script.onerror = (err) => reject(new Error(`Gagal memuat Midtrans Snap script: ${err}`))
      document.head.appendChild(script)
    })
  }

  const pay = async (snapToken: string, callbacks: MidtransCallbacks = {}) => {
    if (!import.meta.client) return
    await loadSnap()

    if (window.snap) {
      window.snap.pay(snapToken, callbacks)
    } else {
      console.error('Midtrans Snap tidak tersedia pada window.')
      alert('Sistem pembayaran Midtrans gagal diinisialisasi. Silakan refresh halaman.')
    }
  }

  return {
    loadSnap,
    pay,
    snapUrl,
    clientKey,
  }
}
