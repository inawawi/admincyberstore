<template>
  <div class="callback-page container">
    <div class="callback-card cyber-card">
      <!-- Loading State -->
      <div v-if="status === 'loading'" class="state-box">
        <div class="cyber-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-core">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
        </div>
        <h2 class="state-title">Memverifikasi Akun Google</h2>
        <p class="state-desc">{{ statusMessage || 'Menghubungkan ke server dan menyiapkan sesi login Anda...' }}</p>
      </div>

      <!-- Success State -->
      <div v-else-if="status === 'success'" class="state-box">
        <div class="status-badge success-badge">
          <Icon name="lucide:check" class="badge-svg w-8 h-8 text-emerald" />
        </div>
        <h2 class="state-title text-success">Login Berhasil!</h2>
        <p class="state-desc">Selamat datang kembali! Sedang mengalihkan ke halaman utama...</p>
        <div class="progress-bar-container">
          <div class="progress-bar-fill"></div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="state-box">
        <div class="status-badge error-badge">
          <Icon name="lucide:x" class="badge-svg w-8 h-8 text-coral" />
        </div>
        <h2 class="state-title text-error">Autentikasi Gagal</h2>
        <div class="error-detail-box">
          <span><Icon name="lucide:alert-triangle" class="w-4 h-4 inline mr-1 text-amber-500" /> {{ errorMessage }}</span>
        </div>
        <div class="action-buttons">
          <NuxtLink to="/auth/login" class="btn btn-primary btn-back">
            <Icon name="lucide:arrow-left" class="w-4 h-4 inline mr-1" />
            Kembali ke Halaman Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const status = ref<'loading' | 'success' | 'error'>('loading')
const statusMessage = ref('Menghubungkan ke server...')
const errorMessage = ref('')

// Guard: pastikan code hanya diproses satu kali meski komponen di-mount ulang
let isProcessing = false

onMounted(async () => {
  if (isProcessing) return
  isProcessing = true

  // 1. Tangani jika Google memberikan pesan error (contoh: user klik Cancel)
  if (route.query.error) {
    status.value = 'error'
    const errDesc = (route.query.error_description as string) || (route.query.error as string)
    errorMessage.value = errDesc === 'access_denied'
      ? 'Akses dibatalkan oleh pengguna.'
      : `Autentikasi Google ditolak: ${errDesc}`
    return
  }

  // 2. Cek token langsung dari URL (jika backend sudah menyelesaikan OAuth dan redirect ke frontend)
  const queryToken = (route.query.token as string) || (route.query.api_token as string)
  const code = route.query.code as string

  // Handle parse user profile jika ada data user yang dikirimkan via query
  let user: any = null
  if (route.query.user) {
    try {
      user = JSON.parse(decodeURIComponent(route.query.user as string))
    } catch {
      user = null
    }
  } else if (route.query.name && route.query.email) {
    user = {
      name: decodeURIComponent(route.query.name as string),
      email: decodeURIComponent(route.query.email as string),
      avatar: route.query.avatar ? decodeURIComponent(route.query.avatar as string) : null,
    }
  }

  // Periksa juga jika token dikirim via URL Hash Fragment (#token=... atau #access_token=...)
  let hashToken = ''
  if (import.meta.client && window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1))
    hashToken = params.get('token') || params.get('access_token') || ''
  }

  const finalToken = queryToken || hashToken

  // 1.5. Verifikasi parameter state CSRF jika ada
  if (import.meta.client && route.query.state) {
    const savedState = sessionStorage.getItem('google_oauth_state')
    if (savedState && route.query.state !== savedState) {
      status.value = 'error'
      errorMessage.value = 'Sesi autentikasi tidak valid (CSRF token mismatch). Silakan coba lagi.'
      sessionStorage.removeItem('google_oauth_state')
      return
    }
  }

  const getTargetRedirect = (): string => {
    let target = (route.query.redirect as string) || ''
    if (!target && import.meta.client) {
      target = sessionStorage.getItem('google_oauth_redirect') || ''
    }
    if (import.meta.client) {
      sessionStorage.removeItem('google_oauth_state')
      sessionStorage.removeItem('google_oauth_redirect')
    }
    if (target && target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
      return target
    }
    return '/'
  }

  // Skenario A: Token langsung tersedia
  if (finalToken) {
    statusMessage.value = 'Menyiapkan sesi login...'
    const result = await authStore.handleGoogleCallback({ token: finalToken, user })

    if (result.success) {
      status.value = 'success'
      setTimeout(() => {
        router.push(getTargetRedirect())
      }, 1000)
    } else {
      status.value = 'error'
      errorMessage.value = result.message || 'Gagal menyimpan sesi login dari server.'
    }
    return
  }

  // Skenario B: Google mengembalikan Authorization Code
  if (code) {
    statusMessage.value = 'Harap Tunggu...'
    const result = await authStore.handleGoogleCallback({ code })

    if (result.success) {
      status.value = 'success'
      setTimeout(() => {
        router.push(getTargetRedirect())
      }, 1000)
    } else {
      status.value = 'error'
      errorMessage.value = result.message || 'Gagal menukarkan kode otorisasi dengan backend.'
    }
    return
  }

  // Skenario C: URL callback diakses tanpa parameter token maupun code
  status.value = 'error'
  errorMessage.value = 'Parameter otorisasi (code / token) tidak ditemukan pada URL callback ini.'
})


useHead({
  title: 'Memverifikasi Google Sign-In | Cyber Store',
})
</script>

<style scoped>
.callback-page {
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.callback-card {
  width: 100%;
  max-width: 480px;
  padding: 2.5rem 2rem;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

/* Cyber Spinner */
.cyber-spinner {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent-cyan);
  border-right-color: var(--ubsi-royal);
  animation: cyberSpin 1s linear infinite;
}

.spinner-core {
  width: 46px;
  height: 46px;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.google-icon {
  width: 24px;
  height: 24px;
}

@keyframes cyberSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Status Badges */
.status-badge {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.badge-svg {
  width: 32px;
  height: 32px;
}

.success-badge {
  background: var(--accent-emerald-dim);
  color: var(--accent-emerald);
  border: 2px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
}

.error-badge {
  background: var(--accent-coral-dim);
  color: var(--accent-coral);
  border: 2px solid rgba(225, 29, 72, 0.3);
  box-shadow: 0 0 15px rgba(225, 29, 72, 0.2);
}

/* Typography */
.state-title {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.text-success {
  color: var(--accent-emerald);
}

.text-error {
  color: var(--accent-coral);
}

.state-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  max-width: 380px;
  line-height: 1.5;
  margin: 0;
}

/* Progress bar animation for redirect */
.progress-bar-container {
  width: 100%;
  max-width: 260px;
  height: 6px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--ubsi-royal), var(--accent-cyan));
  width: 0%;
  animation: fillProgress 1s ease-in-out forwards;
}

@keyframes fillProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}

/* Error Box & Actions */
.error-detail-box {
  background: var(--accent-coral-dim);
  border: 1px solid rgba(225, 29, 72, 0.3);
  color: var(--accent-coral);
  font-size: 0.85rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  max-width: 100%;
  word-break: break-word;
}

.action-buttons {
  margin-top: 0.75rem;
  width: 100%;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem 1.25rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-md);
}
</style>
