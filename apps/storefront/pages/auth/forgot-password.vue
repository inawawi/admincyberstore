<template>
  <div class="auth-page container">
    <div class="auth-card cyber-card">
      <div class="auth-header">
        <div class="auth-logo-box">
          <img v-if="storeLogo" :src="storeLogo" :alt="storeName || 'BSI Cyber Store'" class="logo-img"
            @error="handleLogoError" />
        </div>
        <h1 class="auth-title">{{ pageTitle }}</h1>
        <p class="auth-desc">{{ pageDescription }}</p>
      </div>

      <!-- Step Indicator Dots -->
      <div v-if="step !== 'success'" class="step-indicator">
        <div class="step-dot" :class="{ active: step === 'email', completed: step === 'otp' || step === 'new_password' }">
          <span>1</span>
        </div>
        <div class="step-line" :class="{ active: step === 'otp' || step === 'new_password' }"></div>
        <div class="step-dot" :class="{ active: step === 'otp', completed: step === 'new_password' }">
          <span>2</span>
        </div>
        <div class="step-line" :class="{ active: step === 'new_password' }"></div>
        <div class="step-dot" :class="{ active: step === 'new_password' }">
          <span>3</span>
        </div>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-box" role="alert">
        <Icon name="lucide:alert-circle" class="alert-icon w-4 h-4 text-coral" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage && step !== 'success'" class="success-box" role="status">
        <Icon name="lucide:check-circle" class="alert-icon w-4 h-4 text-emerald" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- STEP 1: Input Email Form -->
      <form v-if="step === 'email'" @submit.prevent="handleSendOtp" class="auth-form">
        <div class="form-group">
          <label class="form-label">Alamat Email Terdaftar</label>
          <div class="input-icon-wrapper">
            <span class="input-left-icon">
              <Icon name="lucide:mail" class="w-4 h-4 text-bsi" />
            </span>
            <input v-model="email" type="email" placeholder="nama@email.com" required :disabled="authStore.isLoading"
              class="input-cyber input-has-icon" autofocus />
          </div>
          <span class="helper-text">Kami akan mengirimkan 6 digit kode verifikasi OTP ke email ini.</span>
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary btn-submit">
          <span v-if="authStore.isLoading" class="btn-spinner-wrap">
            <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
            <span>Mengirim Kode OTP...</span>
          </span>
          <span v-else class="btn-content-wrap">
            <span>Kirim Kode Verifikasi</span>
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </span>
        </button>
      </form>

      <!-- STEP 2: Input OTP Code -->
      <form v-else-if="step === 'otp'" @submit.prevent="handleVerifyOtp" class="auth-form">
        <div class="otp-notice-box">
          <div class="otp-icon-wrap">
            <Icon name="lucide:mail" class="w-6 h-6 text-bsi" />
          </div>
          <div class="otp-notice-content">
            <h4>Kode Verifikasi Terkirim</h4>
            <p>
              Masukkan 6 digit kode OTP yang telah dikirimkan ke <strong>{{ email }}</strong>
            </p>
          </div>
        </div>

        <div class="form-group">
          <div class="otp-header-row">
            <label class="form-label">Kode Verifikasi OTP</label>
            <span class="otp-length-badge">{{ otpDigits.filter(Boolean).length }}/6 Digit</span>
          </div>
          
          <!-- Premium 6-Box Segmented Pin Input -->
          <div class="premium-otp-container" @paste="handleOtpPaste">
            <input
              v-for="(_, index) in 6"
              :key="index"
              :ref="el => setOtpInputRef(el, index)"
              v-model="otpDigits[index]"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              :disabled="authStore.isLoading"
              class="otp-digit-box"
              :class="{ 'is-filled': otpDigits[index] !== '' }"
              @input="onOtpInput(index, $event)"
              @keydown="onOtpKeyDown(index, $event)"
              @focus="onOtpFocus(index)"
            />
          </div>
          <span class="helper-text">Periksa folder Inbox atau Spam email Anda. Kode berlaku 10 menit.</span>
        </div>

        <button type="submit" :disabled="authStore.isLoading || otpCode.length < 6" class="btn btn-primary btn-submit">
          <span v-if="authStore.isLoading" class="btn-spinner-wrap">
            <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
            <span>Memverifikasi Kode...</span>
          </span>
          <span v-else class="btn-content-wrap">
            <span>Verifikasi Kode OTP</span>
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </span>
        </button>

        <div class="otp-actions-wrapper">
          <p class="resend-desc">
            Belum menerima kode?
            <button type="button" :disabled="authStore.isLoading || resendCooldown > 0" @click="handleResendOtp"
              class="btn-resend-link">
              <span v-if="authStore.isLoading">Mengirim ulang...</span>
              <span v-else-if="resendCooldown > 0">Kirim ulang ({{ resendCooldown }}s)</span>
              <span v-else>Kirim Ulang Kode</span>
            </button>
          </p>

          <button type="button" @click="handleBackToEmail" class="btn-back-link">
            ← Ganti Alamat Email
          </button>
        </div>
      </form>

      <!-- STEP 3: Input New Password -->
      <form v-else-if="step === 'new_password'" @submit.prevent="handleResetPassword" class="auth-form">
        <div class="form-group">
          <label class="form-label">Kata Sandi Baru</label>
          <div class="input-icon-wrapper">
            <span class="input-left-icon">
              <Icon name="lucide:lock" class="w-4 h-4 text-bsi" />
            </span>
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Minimal 8 karakter"
              required minlength="8" :disabled="authStore.isLoading" class="input-cyber input-has-icon input-password"
              autofocus />
            <button type="button" class="password-toggle-btn" @click="showPassword = !showPassword" tabindex="-1">
              <Icon v-if="showPassword" name="lucide:eye" class="eye-icon w-4 h-4" />
              <Icon v-else name="lucide:eye-off" class="eye-icon w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Konfirmasi Kata Sandi Baru</label>
          <div class="input-icon-wrapper">
            <span class="input-left-icon">
              <Icon name="lucide:lock-check" class="w-4 h-4 text-bsi" />
            </span>
            <input v-model="passwordConfirmation" :type="showPasswordConfirm ? 'text' : 'password'"
              placeholder="Ulangi kata sandi baru" required minlength="8" :disabled="authStore.isLoading"
              class="input-cyber input-has-icon input-password" />
            <button type="button" class="password-toggle-btn" @click="showPasswordConfirm = !showPasswordConfirm"
              tabindex="-1">
              <Icon v-if="showPasswordConfirm" name="lucide:eye" class="eye-icon w-4 h-4" />
              <Icon v-else name="lucide:eye-off" class="eye-icon w-4 h-4" />
            </button>
          </div>
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary btn-submit">
          <span v-if="authStore.isLoading" class="btn-spinner-wrap">
            <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
            <span>Menyimpan Kata Sandi...</span>
          </span>
          <span v-else class="btn-content-wrap">
            <span>Simpan Kata Sandi Baru</span>
            <Icon name="lucide:check" class="w-4 h-4" />
          </span>
        </button>
      </form>

      <!-- STEP 4: Success State -->
      <div v-else-if="step === 'success'" class="sent-state-box">
        <div class="sent-icon">
          <Icon name="lucide:check-circle-2" class="w-16 h-16 text-emerald-500" />
        </div>
        <h3 class="sent-title">Kata Sandi Berhasil Diperbarui!</h3>
        <p class="sent-desc">
          Akun Anda telah diamankan dengan kata sandi baru. Silakan login kembali untuk melanjutkan aktivitas belanja Anda.
        </p>

        <NuxtLink to="/auth/login" class="btn btn-primary btn-submit mt-2">
          <span>Masuk ke Akun Sekarang</span>
          <Icon name="lucide:arrow-right" class="w-4 h-4" />
        </NuxtLink>
      </div>

      <div v-if="step !== 'success'" class="auth-footer">
        <p>
          Ingat kata sandi Anda?
          <NuxtLink to="/auth/login" class="link-cyan">Kembali ke Masuk</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#imports'
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

const authStore = useAuthStore()

type Step = 'email' | 'otp' | 'new_password' | 'success'
const step = ref<Step>('email')

const email = ref('')
const otpDigits = ref<string[]>(['', '', '', '', '', ''])
const otpInputRefs = ref<(HTMLInputElement | null)[]>([])
const otpCode = computed(() => otpDigits.value.join(''))

const setOtpInputRef = (el: any, index: number) => {
  if (el) {
    otpInputRefs.value[index] = el as HTMLInputElement
  }
}

const onOtpInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const rawVal = input.value.replace(/\D/g, '')

  if (rawVal.length > 1) {
    const chars = rawVal.slice(0, 6).split('')
    chars.forEach((char, i) => {
      if (index + i < 6) {
        otpDigits.value[index + i] = char
      }
    })
    const nextIdx = Math.min(index + chars.length, 5)
    otpInputRefs.value[nextIdx]?.focus()
  } else {
    otpDigits.value[index] = rawVal
    if (rawVal && index < 5) {
      otpInputRefs.value[index + 1]?.focus()
    }
  }
}

const onOtpKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace') {
    if (!otpDigits.value[index] && index > 0) {
      otpDigits.value[index - 1] = ''
      otpInputRefs.value[index - 1]?.focus()
    } else {
      otpDigits.value[index] = ''
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    otpInputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < 5) {
    otpInputRefs.value[index + 1]?.focus()
  }
}

const onOtpFocus = (index: number) => {
  otpInputRefs.value[index]?.select()
}

const handleOtpPaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') || ''
  const digits = text.replace(/\D/g, '').slice(0, 6).split('')
  if (!digits.length) return

  digits.forEach((digit, i) => {
    if (i < 6) {
      otpDigits.value[i] = digit
    }
  })

  const nextFocusIndex = Math.min(digits.length, 5)
  otpInputRefs.value[nextFocusIndex]?.focus()
}

const resetToken = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const storeLogo = ref('/logo-cyberstore.jpg')
const storeName = ref('BSI Cyber Store')

const resendCooldown = ref(0)
let cooldownTimer: any = null

const pageTitle = computed(() => {
  switch (step.value) {
    case 'otp':
      return 'Verifikasi Kode OTP'
    case 'new_password':
      return 'Buat Kata Sandi Baru'
    case 'success':
      return 'Pemulihan Berhasil'
    default:
      return 'Lupa Kata Sandi'
  }
})

const pageDescription = computed(() => {
  switch (step.value) {
    case 'otp':
      return 'Masukkan 6 digit kode verifikasi yang telah kami kirimkan ke email Anda.'
    case 'new_password':
      return 'Silakan masukkan kata sandi baru yang kuat untuk akun Anda.'
    case 'success':
      return 'Kata sandi akun Anda telah berhasil diubah.'
    default:
      return 'Masukkan alamat email akun Anda. Kami akan mengirimkan kode verifikasi OTP untuk mengatur ulang kata sandi.'
  }
})

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

const handleLogoError = () => {
  storeLogo.value = '/logo-cyberstore.jpg'
}

// Step 1: Send OTP to Email
const handleSendOtp = async () => {
  const cleanEmail = email.value.trim()
  if (!cleanEmail) return

  errorMessage.value = ''
  successMessage.value = ''

  const result = await authStore.forgotPassword(cleanEmail)

  if (result.success) {
    step.value = 'otp'
    otpDigits.value = ['', '', '', '', '', '']
    successMessage.value = result.message || 'Kode OTP verifikasi telah dikirimkan ke email Anda.'
    startCooldownTimer(60)
    nextTick(() => {
      otpInputRefs.value[0]?.focus()
    })
  } else {
    errorMessage.value = result.message || 'Gagal mengirim kode OTP. Periksa kembali email Anda.'
  }
}

// Step 2: Verify OTP
const handleVerifyOtp = async () => {
  const cleanOtp = String(otpCode.value || '').trim()
  if (!cleanOtp || cleanOtp.length < 6) {
    errorMessage.value = 'Silakan masukkan 6 digit kode OTP yang valid.'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  const result = await authStore.verifyResetOtp(email.value.trim(), cleanOtp)

  if (result.success && result.reset_token) {
    resetToken.value = result.reset_token
    step.value = 'new_password'
    successMessage.value = 'Kode OTP terverifikasi! Silakan buat kata sandi baru Anda.'
  } else {
    errorMessage.value = result.message || 'Kode OTP tidak valid atau telah kedaluwarsa.'
  }
}

// Resend OTP
const handleResendOtp = async () => {
  if (resendCooldown.value > 0) return
  await handleSendOtp()
}

// Back to Email Step
const handleBackToEmail = () => {
  step.value = 'email'
  otpDigits.value = ['', '', '', '', '', '']
  errorMessage.value = ''
  successMessage.value = ''
}

// Step 3: Reset Password
const handleResetPassword = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = 'Kata sandi minimal harus 8 karakter.'
    return
  }

  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak sesuai.'
    return
  }

  if (!resetToken.value) {
    errorMessage.value = 'Token reset kata sandi tidak valid. Silakan ulangi proses dari awal.'
    step.value = 'email'
    return
  }

  const result = await authStore.resetPassword(resetToken.value, password.value, passwordConfirmation.value)

  if (result.success) {
    step.value = 'success'
    successMessage.value = result.message || 'Kata sandi berhasil diperbarui.'
  } else {
    errorMessage.value = result.message || 'Gagal mengatur ulang kata sandi. Silakan coba lagi.'
  }
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
  title: 'Lupa Kata Sandi | Cyber Store',
})
</script>

<style scoped>
.auth-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 460px;
  padding: 2.5rem 2.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid rgba(0, 74, 173, 0.16);
  box-shadow: 0 15px 35px -10px rgba(0, 34, 102, 0.12);
}

.auth-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.auth-logo-box {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(0, 74, 173, 0.08);
  border: 1px solid rgba(0, 74, 173, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.35rem;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-title {
  font-family: var(--font-display);
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.auth-desc {
  font-size: 0.84rem;
  color: var(--text-secondary, #475569);
  line-height: 1.45;
}

/* Step Indicator */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 0.25rem 0 0.5rem;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  transition: all 0.3s ease;
}

.step-dot.active {
  background: var(--ubsi-blue, #003399);
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 51, 153, 0.15);
}

.step-dot.completed {
  background: #10b981;
  color: #ffffff;
}

.step-line {
  flex: 1;
  max-width: 48px;
  height: 2px;
  background: #e2e8f0;
  transition: all 0.3s ease;
}

.step-line.active {
  background: var(--ubsi-blue, #003399);
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
  flex-shrink: 0;
}

/* Forms */
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

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: var(--text-primary, #1e293b);
}

.helper-text {
  font-size: 0.74rem;
  color: var(--text-secondary, #64748b);
  line-height: 1.35;
}

/* Inputs */
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

/* OTP Specific */
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
  color: #003399;
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

.otp-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.otp-length-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ubsi-blue, #003399);
  background: rgba(0, 74, 173, 0.08);
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-family: var(--font-mono, monospace);
  border: 1px solid rgba(0, 74, 173, 0.15);
}

.premium-otp-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.6rem;
  margin: 0.4rem 0;
}

.otp-digit-box {
  width: 100%;
  height: 54px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 800;
  font-family: var(--font-display, inherit);
  border-radius: 12px;
  border: 1.5px solid #cbd5e1;
  background-color: #ffffff;
  color: #003399;
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  outline: none;
}

.otp-digit-box:hover:not(:disabled) {
  border-color: #94a3b8;
  background-color: #f8fafc;
}

.otp-digit-box:focus {
  border-color: #004aad;
  background-color: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 74, 173, 0.16), 0 4px 12px rgba(0, 74, 173, 0.1);
  transform: translateY(-2px);
}

.otp-digit-box.is-filled {
  border-color: #003399;
  background: linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%);
  color: #002266;
  font-weight: 800;
}

.otp-digit-box:disabled {
  background-color: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 480px) {
  .premium-otp-container {
    gap: 0.35rem;
  }
  .otp-digit-box {
    height: 48px;
    font-size: 1.25rem;
    border-radius: 9px;
  }
}

.otp-actions-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  margin-top: 0.25rem;
}

.resend-desc {
  font-size: 0.825rem;
  color: var(--text-secondary, #475569);
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
  color: var(--text-muted, #94a3b8);
  cursor: not-allowed;
  text-decoration: none;
}

.btn-back-link {
  background: transparent;
  border: none;
  color: var(--text-secondary, #64748b);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  transition: color 0.2s ease;
}

.btn-back-link:hover {
  color: var(--text-primary, #1e293b);
  text-decoration: underline;
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
  text-decoration: none;
  margin-top: 0.35rem;
}

.btn-submit:hover:not(:disabled) {
  background: linear-gradient(135deg, #002b80 0%, #003e94 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 51, 153, 0.3);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-content-wrap,
.btn-spinner-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Success State */
.sent-state-box {
  text-align: center;
  padding: 1.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
}

.sent-icon {
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sent-title {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-primary, #0f172a);
}

.sent-desc {
  font-size: 0.85rem;
  color: var(--text-secondary, #475569);
  line-height: 1.5;
}

/* Footer */
.auth-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary, #475569);
  border-top: 1px solid #f1f5f9;
  padding-top: 1.25rem;
}

.link-cyan {
  color: var(--ubsi-royal, #004aad);
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link-cyan:hover {
  color: var(--ubsi-blue-dark, #002266);
  text-decoration: underline;
}
</style>

