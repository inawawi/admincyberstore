<template>
  <div class="auth-page">
    <!-- Ambient Glowing Orbs Background -->
    <div class="ambient-orb orb-1" aria-hidden="true"></div>
    <div class="ambient-orb orb-2" aria-hidden="true"></div>

    <div class="auth-container">
      <div class="auth-split-card cyber-card">
        <!-- LEFT PANEL: Brand Showcase & Registration Benefits (Desktop & Tablet) -->
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
                <span class="pill-text">Pendaftaran Resmi Civitas UBSI</span>
              </div>
              <h2 class="showcase-heading">
                Gabung Ekosistem Resmi <br />
                <span class="gradient-text">BSI Cyber Store</span>
              </h2>
              <p class="showcase-desc">
                Daftarkan akun Anda untuk kemudahan membeli merchandise resmi kampus, kaos edisi khusus, apparel kuliah, dan gear teknologi dengan garansi terpercaya.
              </p>
            </div>

            <!-- Value Props Badges -->
            <div class="showcase-features">
              <div class="feature-item">
                <div class="feature-icon">
                  <Icon name="lucide:gift" class="w-5 h-5 text-cyan" />
                </div>
                <div class="feature-text">
                  <strong>Akses Promo & Edisi Mahasiswa</strong>
                  <span>Potongan harga khusus civitas akademika & maba</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <Icon name="lucide:shield-check" class="w-5 h-5 text-cyan" />
                </div>
                <div class="feature-text">
                  <strong>Verifikasi OTP Cepat & Aman</strong>
                  <span>Autentikasi terenkripsi melalui email kampus</span>
                </div>
              </div>

              <div class="feature-item">
                <div class="feature-icon">
                  <Icon name="lucide:shopping-bag" class="w-5 h-5 text-cyan" />
                </div>
                <div class="feature-text">
                  <strong>Riwayat Pesanan & Resi Otomatis</strong>
                  <span>Simpan multi-alamat dan pantau pengiriman kilat</span>
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

        <!-- RIGHT PANEL: Register / OTP Form -->
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
                  Pendaftaran Baru
                </span>
              </div>
              <h1 class="auth-title">Daftar Akun Baru</h1>
              <p class="auth-desc">Lengkapi formulir di bawah untuk bergabung dengan BSI Cyber Store.</p>
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
                  <h4>Verifikasi Email Anda</h4>
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
                  <span>Verifikasi & Selesai</span>
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

                <button type="button" @click="handleBackToRegister" class="btn-back-link">
                  <Icon name="lucide:arrow-left" class="w-4 h-4 inline mr-1" />
                  Ubah Data / Email
                </button>
              </div>
            </form>

            <!-- Standard Register Step -->
            <form v-else @submit.prevent="handleRegister" class="auth-form">
              <!-- Nama Lengkap with Icon -->
              <div class="form-group">
                <label class="form-label">Nama Lengkap</label>
                <div class="input-icon-wrapper">
                  <span class="input-left-icon">
                    <Icon name="lucide:user" class="w-4 h-4 text-bsi" />
                  </span>
                  <input
                    v-model="name"
                    type="text"
                    placeholder="Contoh: Alex Pratama"
                    required
                    class="input-cyber input-has-icon"
                  />
                </div>
              </div>

              <!-- Email with Icon -->
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

              <!-- Nomor HP with Icon -->
              <div class="form-group">
                <label class="form-label">Nomor WhatsApp / HP Aktif</label>
                <div class="input-icon-wrapper">
                  <span class="input-left-icon">
                    <Icon name="lucide:phone" class="w-4 h-4 text-bsi" />
                  </span>
                  <input
                    v-model="phone"
                    type="tel"
                    inputmode="numeric"
                    placeholder="Contoh: 081234567890"
                    required
                    class="input-cyber input-has-icon"
                    @input="handlePhoneInput"
                  />
                </div>
                <span class="helper-text">Digunakan untuk konfirmasi pesanan dan update kurir pengiriman.</span>
              </div>

              <!-- Password with Eye Toggle -->
              <div class="form-group">
                <label class="form-label">Password</label>
                <div class="input-icon-wrapper">
                  <span class="input-left-icon">
                    <Icon name="lucide:lock" class="w-4 h-4 text-bsi" />
                  </span>
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="Minimal 8 karakter"
                    required
                    minlength="8"
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

              <!-- Konfirmasi Password with Eye Toggle -->
              <div class="form-group">
                <label class="form-label">Konfirmasi Password</label>
                <div class="input-icon-wrapper">
                  <span class="input-left-icon">
                    <Icon name="lucide:shield-check" class="w-4 h-4 text-bsi" />
                  </span>
                  <input
                    v-model="passwordConfirmation"
                    :type="showPasswordConfirm ? 'text' : 'password'"
                    placeholder="Ulangi kata sandi di atas"
                    required
                    class="input-cyber input-has-icon input-password"
                  />
                  <button
                    type="button"
                    class="password-toggle-btn"
                    @click="showPasswordConfirm = !showPasswordConfirm"
                    :title="showPasswordConfirm ? 'Sembunyikan password' : 'Lihat password'"
                    tabindex="-1"
                  >
                    <Icon v-if="showPasswordConfirm" name="lucide:eye" class="eye-icon w-4 h-4" />
                    <Icon v-else name="lucide:eye-off" class="eye-icon w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Submit Button with Gradient & Hover Animation -->
              <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary btn-submit">
                <span v-if="authStore.isLoading" class="btn-spinner-wrap">
                  <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </span>
                <span v-else class="btn-content-wrap">
                  <span>Daftar Sekarang</span>
                  <Icon name="lucide:arrow-right" class="w-4 h-4 arrow-hover" />
                </span>
              </button>
            </form>

            <!-- Footer: Login Link -->
            <div class="auth-footer">
              <p>
                Sudah memiliki akun?
                <NuxtLink to="/auth/login" class="link-register">
                  <span>Masuk di Sini</span>
                  <Icon name="lucide:arrow-right" class="w-4 h-4" />
                </NuxtLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Pop-up Verifikasi Berhasil -->
    <Transition name="modal-fade">
      <div v-if="showSuccessModal" class="success-modal-backdrop" @click.self="goToLogin">
        <div class="success-modal-card">
          <!-- Ambient Glow Accent -->
          <div class="modal-glow"></div>

          <!-- Animated Checkmark Icon Ring -->
          <div class="modal-icon-wrap">
            <div class="modal-icon-ring">
              <Icon name="lucide:check" class="w-10 h-10 check-icon text-emerald" />
            </div>
          </div>

          <!-- Modal Details -->
          <div class="modal-content-wrap">
            <h3 class="modal-title">Verifikasi Berhasil!</h3>
            <p class="modal-subtitle">
              Kode OTP valid. Email <strong class="text-highlight">{{ email }}</strong> berhasil diverifikasi dan akun Anda telah aktif.
            </p>
            <div class="modal-info-box">
              <Icon name="lucide:info" class="w-4 h-4 info-icon text-bsi" />
              <span>Mengalihkan ke halaman login dalam <strong>{{ redirectCountdown }} detik</strong></span>
            </div>
          </div>

          <!-- Modal Action Button -->
          <div class="modal-action-wrap">
            <button type="button" @click="goToLogin" class="btn btn-primary btn-modal-login">
              <span>Lanjut ke Halaman Login</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const otpCode = ref('')
const step = ref<'register' | 'otp'>('register')
const errorMessage = ref('')
const successMessage = ref('')
const storeLogo = ref('/logo-cyberstore.jpg')
const storeName = ref('BSI Cyber Store')

const isResendingOtp = ref(false)
const resendCooldown = ref(0)
let cooldownTimer: any = null

const showSuccessModal = ref(false)
const redirectCountdown = ref(3)
let modalRedirectTimer: any = null

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
  if (modalRedirectTimer) clearInterval(modalRedirectTimer)
})

const handleLogoError = () => {
  storeLogo.value = '/logo-cyberstore.jpg'
}

const handlePhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  // Hanya simpan angka
  const digitsOnly = target.value.replace(/\D/g, '')
  // Batasi panjang maksimal 15 digit (standar E.164)
  phone.value = digitsOnly.slice(0, 15)
}

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  // 1. Validasi Password Confirmation
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Konfirmasi password tidak cocok.'
    return
  }

  // 2. Validasi Nomor HP
  const cleanPhone = phone.value.replace(/\D/g, '')
  if (!cleanPhone) {
    errorMessage.value = 'Nomor HP wajib diisi.'
    return
  }
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    errorMessage.value = 'Nomor HP harus terdiri dari 10 hingga 15 digit angka.'
    return
  }
  if (!/^(08|628|8)/.test(cleanPhone)) {
    errorMessage.value = 'Format nomor HP tidak valid. Gunakan nomor HP aktif (contoh: 081234567890).'
    return
  }

  // Normalisasi jika diawali '8' (contoh: 8123... -> 08123...)
  const normalizedPhone = cleanPhone.startsWith('8') ? `0${cleanPhone}` : cleanPhone

  const result = await authStore.register(
    name.value,
    email.value,
    password.value,
    passwordConfirmation.value,
    normalizedPhone
  )

  if (result.success) {
    if (result.requireOtp) {
      step.value = 'otp'
      successMessage.value = 'Registrasi berhasil! Kode OTP verifikasi telah dikirim ke email Anda.'
      startCooldownTimer(60)
    } else {
      router.push('/')
    }
  } else {
    errorMessage.value = result.message || 'Pendaftaran gagal.'
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
    // Bersihkan sesi aktif agar user dapat melakukan login secara mandiri
    authStore.clearSession()

    // Buka pop-up modal verifikasi berhasil
    showSuccessModal.value = true
    redirectCountdown.value = 3

    // Mulai hitung mundur 3 detik sebelum otomatis diarahkan ke halaman login
    if (modalRedirectTimer) clearInterval(modalRedirectTimer)
    modalRedirectTimer = setInterval(() => {
      if (redirectCountdown.value > 1) {
        redirectCountdown.value--
      } else {
        clearInterval(modalRedirectTimer)
        modalRedirectTimer = null
        goToLogin()
      }
    }, 1000)
  } else {
    errorMessage.value = result.message || 'Kode OTP tidak valid atau telah kedaluwarsa.'
  }
}

const goToLogin = () => {
  if (modalRedirectTimer) {
    clearInterval(modalRedirectTimer)
    modalRedirectTimer = null
  }
  router.push({
    path: '/auth/login',
    query: {
      email: email.value.trim(),
      registered: '1',
    },
  })
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

const handleBackToRegister = () => {
  if (modalRedirectTimer) {
    clearInterval(modalRedirectTimer)
    modalRedirectTimer = null
  }
  showSuccessModal.value = false
  step.value = 'register'
  otpCode.value = ''
  errorMessage.value = ''
  successMessage.value = ''
}

onMounted(async () => {
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
  title: 'Daftar Akun Baru | Cyber Store',
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
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(0, 74, 173, 0.35) 0%, rgba(2, 132, 199, 0.15) 50%, transparent 80%);
  top: -60px;
  left: -80px;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(0, 51, 153, 0.12) 50%, transparent 80%);
  bottom: -80px;
  right: -80px;
}

.auth-container {
  width: 100%;
  max-width: 1060px;
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
  min-height: 680px;
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
  padding: 2.75rem 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.form-pane-inner {
  width: 100%;
  max-width: 390px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.mobile-brand-header {
  display: none;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 0.35rem;
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
  margin-bottom: 0.25rem;
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

/* Form Groups & Inputs */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.05rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.helper-text {
  font-size: 0.72rem;
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
  height: 45px;
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

/* Footer Login Link */
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

/* SUCCESS MODAL STYLES */
.success-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(3, 7, 18, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.success-modal-card {
  position: relative;
  width: 100%;
  max-width: 440px;
  background: linear-gradient(145deg, #0d1a30 0%, #081020 100%);
  border: 1px solid rgba(16, 185, 129, 0.4);
  border-radius: 1.5rem;
  padding: 2.5rem 2rem;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.25);
  overflow: hidden;
  animation: modalPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.modal-glow {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 140px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%);
  filter: blur(35px);
  pointer-events: none;
}

.modal-icon-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
  position: relative;
  z-index: 1;
}

.modal-icon-ring {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.1) 100%);
  border: 2px solid rgba(16, 185, 129, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.4);
}

.check-icon {
  color: #34d399;
  animation: checkmarkBounce 0.5s ease-out;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.modal-subtitle {
  font-size: 0.925rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 1.25rem;
}

.text-highlight {
  color: #38bdf8;
  font-weight: 600;
}

.modal-info-box {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 9999px;
  font-size: 0.825rem;
  color: #93c5fd;
  margin-bottom: 1.5rem;
}

.info-icon {
  color: #38bdf8;
  flex-shrink: 0;
}

.modal-action-wrap {
  display: flex;
  flex-direction: column;
}

.btn-modal-login {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #0284c7 0%, #004aad 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
  border-radius: 0.75rem;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-modal-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(2, 132, 199, 0.55);
  filter: brightness(1.1);
}

@keyframes modalPop {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes checkmarkBounce {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
