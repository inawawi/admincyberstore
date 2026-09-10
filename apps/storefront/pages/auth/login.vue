<template>
  <div class="auth-page">
    <!-- Ambient Glowing Orbs Background -->
    <div class="ambient-orb orb-1" aria-hidden="true"></div>
    <div class="ambient-orb orb-2" aria-hidden="true"></div>

    <div class="auth-container">
      <div class="auth-split-card cyber-card">
        <!-- LEFT PANEL: Brand Showcase & Value Proposition (Desktop & Tablet) -->
        <div class="auth-showcase">
          <div class="showcase-glow" aria-hidden="true"></div>
          <div class="showcase-grid-mesh" aria-hidden="true"></div>

          <div class="showcase-content">
            <!-- Brand Badge -->
            <div class="showcase-brand">
              <div class="showcase-logo-box">
                <img
                  v-if="storeLogo"
                  :src="storeLogo"
                  :alt="storeName || 'BSI Cyber Store'"
                  class="showcase-logo-img"
                  @error="handleLogoError"
                />
              </div>
              <div class="showcase-brand-text">
                <span class="brand-title">
                  <span class="text-gold">BSI</span> CYBER<span class="text-white">STORE</span>
                </span>
                <span class="brand-tag">Official Tech Gear & Merchandise</span>
              </div>
            </div>

            <!-- Headline Section -->
            <div class="showcase-hero">
              <div class="security-pill">
                <span class="pulse-dot"></span>
                <span class="pill-text">Sistem Autentikasi Kampus Terenkripsi</span>
              </div>
              <h2 class="showcase-heading">
                Akses Resmi Ekosistem <br />
                <span class="gradient-text">Teknologi & Lifestyle</span>
              </h2>
              <p class="showcase-desc">
                Masuk untuk mengakses merchandise original, perlengkapan kuliah IT, diskon mahasiswa baru, dan tracking pesanan kilat di Official Store UBSI.
              </p>
            </div>

            <!-- Value Props Badges -->
            <div class="showcase-features">
              <div class="feature-item">
                <div class="feature-icon">
                  <Icon name="lucide:shield-check" class="w-5 h-5 text-cyan" />
                </div>
                <div class="feature-text">
                  <strong>100% Produk Original Kampus</strong>
                  <span>Kualitas terjamin dengan standar resmi UBSI</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <Icon name="lucide:zap" class="w-5 h-5 text-cyan" />
                </div>
                <div class="feature-text">
                  <strong>Single Sign-On & Akses Kilat</strong>
                  <span>Masuk aman sekali klik menggunakan akun Google</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <Icon name="lucide:clock" class="w-5 h-5 text-cyan" />
                </div>
                <div class="feature-text">
                  <strong>Tracking Realtime Terintegrasi</strong>
                  <span>Pantau resi kurir Mandiri, JNE, SiCepat, & TIKI</span>
                </div>
              </div>
            </div>

            <!-- Showcase Footer Note -->
            <div class="showcase-footer">
              <div class="rating-stars">
                <span v-for="s in 5" :key="s">
                  <Icon name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                </span>
              </div>
              <span class="trust-note">Platform E-Commerce Terpercaya Civitas UBSI</span>
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Login / OTP Form -->
        <div class="auth-form-pane">
          <div class="form-pane-inner">
            <!-- Mobile Brand Logo (Visible on mobile only) -->
            <div class="mobile-brand-header">
              <div class="mobile-logo-box">
                <img
                  v-if="storeLogo"
                  :src="storeLogo"
                  :alt="storeName || 'BSI Cyber Store'"
                  class="logo-img"
                  @error="handleLogoError"
                />
              </div>
              <span class="mobile-brand-name">
                <span class="text-gold">BSI</span> CYBER<span class="text-ubsi">STORE</span>
              </span>
            </div>

            <div class="auth-header">
              <div class="badge-row">
                <span class="pane-badge">
                  <span class="badge-dot"></span>
                  Gerbang Autentikasi
                </span>
              </div>
              <h1 class="auth-title">Masuk ke Akun</h1>
              <p class="auth-desc">Silakan masukkan kredensial akun Anda untuk melanjutkan belanja.</p>
            </div>

            <!-- Error Alert -->
            <div v-if="errorMessage" class="error-box" role="alert">
              <Icon name="lucide:alert-circle" class="alert-icon w-5 h-5 text-coral" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Success Alert -->
            <div v-if="successMessage" class="success-box" role="status">
              <Icon name="lucide:check-circle" class="alert-icon w-5 h-5 text-emerald" />
              <span>{{ successMessage }}</span>
            </div>

            <!-- OTP Step -->
            <form v-if="step === 'otp'" @submit.prevent="handleVerifyOtp" class="auth-form">
              <div class="otp-notice-box">
                <div class="otp-icon-wrap"><Icon name="lucide:mail" class="w-6 h-6 text-bsi" /></div>
                <div class="otp-notice-content">
                  <h4>Verifikasi Keamanan Akun</h4>
                  <p>Kode OTP 6-digit telah dikirimkan ke email <strong>{{ email }}</strong></p>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Kode Verifikasi OTP</label>
                <div class="otp-input-wrapper">
                  <input
                    v-model="otpCode"
                    type="text"
                    maxlength="6"
                    placeholder="• • • • • •"
                    required
                    class="input-cyber input-otp font-mono tracking-widest text-center"
                    autofocus
                  />
                </div>
                <span class="helper-text">Periksa kotak masuk atau folder spam email Anda.</span>
              </div>

              <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary btn-submit">
                <span v-if="authStore.isLoading" class="btn-spinner-wrap">
                  <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </span>
                <span v-else class="btn-content-wrap">
                  <span>Verifikasi & Masuk</span>
                  <Icon name="lucide:arrow-right" class="w-4 h-4" />
                </span>
              </button>

              <!-- Kirim Ulang OTP Section -->
              <div class="otp-actions-wrapper">
                <p class="resend-desc">
                  Belum menerima kode OTP?
                  <button
                    type="button"
                    :disabled="isResendingOtp || resendCooldown > 0"
                    @click="handleResendOtp"
                    class="btn-resend-link"
                  >
                    <span v-if="isResendingOtp">Mengirim ulang...</span>
                    <span v-else-if="resendCooldown > 0">Kirim ulang ({{ resendCooldown }}s)</span>
                    <span v-else>Kirim Ulang Kode</span>
                  </button>
                </p>

                <button type="button" @click="handleBackToLogin" class="btn-back-link">
                  ← Kembali ke Form Login
                </button>
              </div>
            </form>

            <!-- Standard Login Step -->
            <div v-else class="auth-body">
              <!-- Google Login Button -->
              <button
                type="button"
                @click="handleGoogleLogin"
                :disabled="authStore.isLoading || isGoogleLoading"
                class="btn-google"
              >
                <svg class="google-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span v-if="isGoogleLoading" class="btn-spinner-wrap">
                  <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
                  <span>Mengarahkan ke Google...</span>
                </span>
                <span v-else>Masuk dengan Akun Google</span>
              </button>

              <!-- Divider -->
              <div class="auth-divider">
                <span>atau lanjutkan dengan email</span>
              </div>

              <form @submit.prevent="handleLogin" class="auth-form">
                <!-- Email Field with Icon Prefix -->
                <div class="form-group">
                  <label class="form-label">Alamat Email</label>
                  <div class="input-icon-wrapper">
                    <span class="input-left-icon">
                      <Icon name="lucide:mail" class="w-4 h-4 text-bsi" />
                    </span>
                    <input
                      v-model="email"
                      type="email"
                      placeholder="nama@email.com"
                      required
                      class="input-cyber input-has-icon"
                    />
                  </div>
                </div>

                <!-- Password Field with Icon Prefix & Eye Toggle -->
                <div class="form-group">
                  <div class="label-row">
                    <label class="form-label">Password</label>
                    <NuxtLink to="/auth/forgot-password" class="forgot-password-link">
                      Lupa Password?
                    </NuxtLink>
                  </div>
                  <div class="input-icon-wrapper">
                    <span class="input-left-icon">
                      <Icon name="lucide:lock" class="w-4 h-4 text-bsi" />
                    </span>
                    <input
                      ref="passwordInputRef"
                      v-model="password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="Masukkan kata sandi akun"
                      required
                      class="input-cyber input-has-icon input-password"
                    />
                    <button
                      type="button"
                      class="password-toggle-btn"
                      @click="showPassword = !showPassword"
                      :title="showPassword ? 'Sembunyikan password' : 'Lihat password'"
                      tabindex="-1"
                    >
                      <Icon v-if="showPassword" name="lucide:eye" class="eye-icon w-4 h-4" />
                      <Icon v-else name="lucide:eye-off" class="eye-icon w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Submit Button with Gradient & Hover Lift -->
                <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary btn-submit">
                  <span v-if="authStore.isLoading" class="btn-spinner-wrap">
                    <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
                    <span>Memproses Masuk...</span>
                  </span>
                  <span v-else class="btn-content-wrap">
                    <span>Masuk Sekarang</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 arrow-hover" />
                  </span>
                </button>
              </form>
            </div>

            <!-- Footer: Register Link -->
            <div class="auth-footer">
              <p>
                Belum memiliki akun?
                <NuxtLink to="/auth/register" class="link-register">
                  <span>Daftar Akun Baru</span>
                  <Icon name="lucide:arrow-right" class="w-4 h-4" />
                </NuxtLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const storeLogo = ref('/logo-cyberstore.jpg')
const storeName = ref('BSI Cyber Store')
const passwordInputRef = ref<HTMLInputElement | null>(null)

const handleLogoError = () => {
  storeLogo.value = '/logo-cyberstore.jpg'
}

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const otpCode = ref('')
const step = ref<'login' | 'otp'>('login')
const errorMessage = ref('')
const successMessage = ref('')
const isGoogleLoading = ref(false)

const isResendingOtp = ref(false)
const resendCooldown = ref(0)
let cooldownTimer: any = null

const startCooldownTimer = (seconds = 60) => {
  resendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    } else {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownTimer) clearInterval(cooldownTimer)
})

const getSafeRedirect = (target?: string | null): string => {
  if (!target || typeof target !== 'string') return '/'
  const trimmed = target.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
    return trimmed
  }
  return '/'
}

const handleLogin = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  const result = await authStore.login(email.value, password.value)

  if (result.success) {
    router.push(getSafeRedirect(route.query.redirect as string))
  } else if (result.requireOtp) {
    step.value = 'otp'
    successMessage.value = 'Kode OTP verifikasi telah dikirimkan ke email Anda.'
    startCooldownTimer(60)
  } else {
    errorMessage.value = result.message || 'Email atau password salah.'
  }
}

const handleVerifyOtp = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const cleanOtp = String(otpCode.value || '').trim()
  if (!cleanOtp) {
    errorMessage.value = 'Silakan masukkan 6 digit kode OTP yang dikirimkan ke email Anda.'
    return
  }

  const result = await authStore.verifyOtp(email.value.trim(), cleanOtp)

  if (result.success) {
    router.push(getSafeRedirect(route.query.redirect as string))
  } else {
    errorMessage.value = result.message || 'Kode OTP tidak valid atau telah kedaluwarsa.'
  }
}

const handleResendOtp = async () => {
  if (isResendingOtp.value || resendCooldown.value > 0) return

  errorMessage.value = ''
  successMessage.value = ''
  isResendingOtp.value = true

  const result = await authStore.resendOtp(email.value)

  isResendingOtp.value = false

  if (result.success) {
    successMessage.value = result.message || 'Kode OTP baru telah dikirimkan ke email Anda. Silakan periksa inbox atau spam.'
    startCooldownTimer(60)
  } else {
    errorMessage.value = result.message || 'Gagal mengirim ulang kode OTP.'
    const match = result.message?.match(/(\d+(\.\d+)?)\s*detik/i)
    if (match && match[1]) {
      startCooldownTimer(Math.ceil(parseFloat(match[1])))
    }
  }
}

const handleBackToLogin = () => {
  step.value = 'login'
  otpCode.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

const handleGoogleLogin = () => {
  errorMessage.value = ''

  const clientId = config.public.googleClientId
  const redirectUri = config.public.googleRedirectUri || (typeof window !== 'undefined' ? `${window.location.origin}/auth/google/callback` : '')

  if (!clientId) {
    errorMessage.value = 'Google Client ID belum dikonfigurasi di file .env.'
    return
  }

  isGoogleLoading.value = true

  // Buat random state token untuk memproteksi serangan OAuth Login CSRF
  const stateToken = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const safeRedirect = getSafeRedirect(route.query.redirect as string)
  if (import.meta.client) {
    sessionStorage.setItem('google_oauth_state', stateToken)
    sessionStorage.setItem('google_oauth_redirect', safeRedirect)
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
    state: stateToken,
  })

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

onMounted(async () => {
  // Tangkap query email dan status registrasi setelah verifikasi OTP berhasil
  if (route.query.email && typeof route.query.email === 'string') {
    email.value = route.query.email.trim()
  }
  if (route.query.registered === '1' || route.query.registered === 'true') {
    successMessage.value = 'Verifikasi kode berhasil! Akun Anda telah aktif. Silakan masukkan kata sandi Anda untuk masuk.'
    nextTick(() => {
      passwordInputRef.value?.focus()
    })
  }

  try {
    const { fetchStoreInfo, getImageUrl } = useApi()
    const data = await fetchStoreInfo()
    if (data) {
      if (data.store_logo) {
        storeLogo.value = getImageUrl(data.store_logo)
      }
      if (data.store_name) {
        storeName.value = data.store_name
      }
    }
  } catch (err) {
    console.error('Failed to load store info:', err)
  }
})

useHead({
  title: 'Masuk Akun | Cyber Store',
})
</script>

<style scoped>
/* Page Layout with Ambient Orbs */
.auth-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.25rem;
  position: relative;
  overflow: hidden;
}

.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
  opacity: 0.55;
  z-index: 0;
}

.orb-1 {
  width: 460px;
  height: 460px;
  background: radial-gradient(circle, rgba(0, 74, 173, 0.35) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 80%);
  top: -60px;
  left: -80px;
}

.orb-2 {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(0, 51, 153, 0.12) 50%, transparent 80%);
  bottom: -80px;
  right: -80px;
}

.auth-container {
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Split Card Wrapper */
.auth-split-card {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid rgba(0, 74, 173, 0.16);
  box-shadow: 0 20px 50px -12px rgba(0, 34, 102, 0.16), 0 0 1px 1px rgba(0, 74, 173, 0.08);
  overflow: hidden;
  min-height: 620px;
}

/* LEFT SHOWCASE PANEL */
.auth-showcase {
  background: linear-gradient(150deg, #001845 0%, #002266 40%, #003399 85%, #004aad 100%);
  color: #ffffff;
  padding: 3.25rem 3rem;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.showcase-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.28) 0%, transparent 70%);
  pointer-events: none;
}

.showcase-grid-mesh {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 32px 32px;
  pointer-events: none;
}

.showcase-content {
  position: relative;
  z-index: 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.25rem;
}

/* Showcase Brand Header */
.showcase-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.showcase-logo-box {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.showcase-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showcase-brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: #ffffff;
}

.brand-tag {
  font-size: 0.72rem;
  color: rgba(224, 242, 254, 0.8);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.text-gold {
  color: #fbbf24;
}

.text-white {
  color: #ffffff;
}

.text-ubsi {
  color: #003399;
}

/* Showcase Hero Text */
.showcase-hero {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.security-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: rgba(0, 212, 255, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 9999px;
  width: fit-content;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #00d4ff;
  box-shadow: 0 0 10px #00d4ff;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.pill-text {
  font-size: 0.72rem;
  font-weight: 700;
  color: #e0f2fe;
  letter-spacing: 0.03em;
}

.showcase-heading {
  font-family: var(--font-display);
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1.25;
  color: #ffffff;
}

.gradient-text {
  background: linear-gradient(135deg, #38bdf8 0%, #fbbf24 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.showcase-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: rgba(241, 245, 249, 0.82);
}

/* Feature List */
.showcase-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.85rem 1rem;
  border-radius: 12px;
  backdrop-filter: blur(8px);
  transition: transform 0.2s ease, background 0.2s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.feature-icon {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(0, 212, 255, 0.16);
  border: 1px solid rgba(0, 212, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #38bdf8;
  flex-shrink: 0;
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.feature-text strong {
  font-size: 0.825rem;
  color: #ffffff;
  font-weight: 700;
}

.feature-text span {
  font-size: 0.74rem;
  color: rgba(224, 242, 254, 0.75);
}

/* Showcase Footer */
.showcase-footer {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.rating-stars {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.trust-note {
  font-size: 0.74rem;
  color: rgba(224, 242, 254, 0.7);
  font-weight: 500;
}

/* RIGHT FORM PANEL */
.auth-form-pane {
  padding: 3rem 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.form-pane-inner {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
}

.mobile-brand-header {
  display: none;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.5rem;
}

.mobile-logo-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.mobile-brand-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 800;
}

.badge-row {
  margin-bottom: 0.35rem;
}

.pane-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.65rem;
  background: var(--ubsi-cyan-light, #e0f2fe);
  color: var(--ubsi-blue, #003399);
  border-radius: 6px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ubsi-blue, #003399);
}

.auth-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.auth-title {
  font-family: var(--font-display);
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text-white, #0f172a);
  letter-spacing: -0.01em;
}

.auth-desc {
  font-size: 0.85rem;
  color: var(--text-secondary, #475569);
  line-height: 1.45;
}

/* Alerts */
.error-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.825rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  line-height: 1.4;
}

.success-box {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #047857;
  font-size: 0.825rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  line-height: 1.4;
}

.alert-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Google OAuth Button */
.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  color: var(--text-primary, #1e293b);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-google:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
  color: var(--ubsi-blue, #003399);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.09);
}

.btn-google:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.google-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Divider */
.auth-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 0.1rem 0;
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e2e8f0;
}

.auth-divider span {
  padding: 0 0.85rem;
  font-size: 0.73rem;
  color: var(--text-muted, #94a3b8);
  font-weight: 500;
  background: #ffffff;
}

/* Form Groups & Inputs */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.forgot-password-link {
  font-size: 0.76rem;
  color: var(--ubsi-royal, #004aad);
  font-weight: 600;
  text-decoration: none;
  transition: color 0.2s ease;
}

.forgot-password-link:hover {
  color: var(--ubsi-blue-dark, #002266);
  text-decoration: underline;
}

.helper-text {
  font-size: 0.74rem;
  color: var(--text-muted, #94a3b8);
}

/* Input with prefix icon */
.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-left-icon {
  position: absolute;
  left: 0.95rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transition: color 0.2s ease;
}

.input-has-icon {
  padding-left: 2.6rem !important;
}

.input-cyber {
  width: 100%;
  height: 46px;
  border-radius: 11px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: var(--text-primary, #1e293b);
  font-size: 0.875rem;
  padding: 0 0.95rem;
  transition: all 0.2s ease;
  outline: none;
}

.input-cyber:focus {
  border-color: var(--ubsi-royal, #004aad);
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.12);
}

.input-icon-wrapper:focus-within .input-left-icon {
  color: var(--ubsi-royal, #004aad);
}

.input-password {
  padding-right: 2.85rem !important;
}

.password-toggle-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: color 0.2s ease;
}

.password-toggle-btn:hover {
  color: var(--ubsi-blue, #003399);
}

.eye-icon {
  width: 18px;
  height: 18px;
}

/* Submit Button */
.btn-submit {
  width: 100%;
  height: 48px;
  border-radius: 11px;
  background: linear-gradient(135deg, #003399 0%, #004aad 100%);
  border: none;
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.22);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.35rem;
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #002b80 0%, #003e94 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 51, 153, 0.3);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.arrow-hover {
  transition: transform 0.2s ease;
}

.btn-submit:hover .arrow-hover {
  transform: translateX(3px);
}

.btn-spinner-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner-icon {
  width: 18px;
  height: 18px;
}

/* OTP Specific Styles */
.otp-notice-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #f0f7ff;
  border: 1px solid #bae6fd;
  padding: 0.85rem 1rem;
  border-radius: 12px;
}

.otp-icon-wrap {
  font-size: 1.5rem;
}

.otp-notice-content h4 {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--ubsi-blue, #003399);
}

.otp-notice-content p {
  font-size: 0.74rem;
  color: var(--text-secondary, #475569);
  line-height: 1.4;
}

.input-otp {
  font-size: 1.4rem;
  letter-spacing: 0.3em;
  font-weight: 700;
  height: 52px;
}

.otp-actions-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.resend-desc {
  font-size: 0.825rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-resend-link {
  background: transparent;
  border: none;
  color: var(--ubsi-royal, #004aad);
  font-weight: 700;
  font-size: 0.825rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
  text-decoration: underline;
}

.btn-resend-link:hover:not(:disabled) {
  color: var(--ubsi-blue-dark, #002266);
}

.btn-resend-link:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
  text-decoration: none;
}

.btn-back-link {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s ease;
}

.btn-back-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

/* Footer Register Link */
.auth-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  border-top: 1px solid #f1f5f9;
  padding-top: 1.25rem;
}

.auth-footer p {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.link-register {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--ubsi-royal, #004aad);
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}

.link-register:hover {
  color: var(--ubsi-blue-dark, #002266);
  transform: translateX(2px);
}

/* RESPONSIVE DESIGN */
@media (max-width: 960px) {
  .auth-split-card {
    grid-template-columns: 1fr;
    max-width: 480px;
    margin: 0 auto;
  }

  .auth-showcase {
    display: none;
  }

  .mobile-brand-header {
    display: flex;
  }

  .auth-form-pane {
    padding: 2.5rem 2rem;
  }
}

@media (max-width: 480px) {
  .auth-page {
    padding: 1.5rem 0.85rem;
  }

  .auth-form-pane {
    padding: 2rem 1.25rem;
  }

  .auth-title {
    font-size: 1.45rem;
  }
}
</style>
