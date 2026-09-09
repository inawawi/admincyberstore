<template>
  <div class="auth-page container">
    <div class="auth-card cyber-card">
      <div class="auth-header">
        <div class="auth-logo-box">
          <img
            v-if="storeLogo"
            :src="storeLogo"
            :alt="storeName || 'BSI Cyber Store'"
            class="logo-img"
            @error="handleLogoError"
          />
        </div>
        <h1 class="auth-title">Lupa Password</h1>
        <p class="auth-desc">
          Masukkan alamat email akun Anda. Kami akan mengirimkan instruksi untuk mengatur ulang password.
        </p>
      </div>

      <!-- Error Alert -->
      <div v-if="errorMessage" class="error-box">
        <span><Icon name="lucide:alert-triangle" class="w-4 h-4 inline mr-1 text-coral" /> {{ errorMessage }}</span>
      </div>

      <!-- Success Alert -->
      <div v-if="successMessage" class="success-box">
        <span><Icon name="lucide:check-circle" class="w-4 h-4 inline mr-1 text-emerald" /> {{ successMessage }}</span>
      </div>

      <!-- Forgot Password Form -->
      <form v-if="!isSubmitted" @submit.prevent="handleForgotPassword" class="auth-form">
        <div class="form-group">
          <label class="form-label">Alamat Email Terdaftar</label>
          <input
            v-model="email"
            type="email"
            placeholder="nama@email.com"
            required
            class="input-cyber"
          />
          <span class="helper-text">Pastikan email aktif dan sesuai dengan yang terdaftar di sistem.</span>
        </div>

        <button type="submit" :disabled="authStore.isLoading" class="btn btn-primary btn-submit">
          <span v-if="authStore.isLoading">Memproses...</span>
          <span v-else>Kirim Instruksi Reset</span>
        </button>
      </form>

      <!-- Sent Confirmation State -->
      <div v-else class="sent-state-box">
        <div class="sent-icon"><Icon name="lucide:mail-check" class="w-10 h-10 text-bsi" /></div>
        <h3 class="sent-title">Email Telah Dikirim</h3>
        <p class="sent-desc">
          Instruksi pemulihan kata sandi telah dikirim ke <strong>{{ email }}</strong>. Silakan periksa kotak masuk atau folder spam Anda.
        </p>

        <div class="resend-wrapper">
          <button
            type="button"
            :disabled="authStore.isLoading || resendCooldown > 0"
            @click="handleForgotPassword"
            class="btn-resend-link"
          >
            <span v-if="authStore.isLoading">Mengirim ulang...</span>
            <span v-else-if="resendCooldown > 0">Kirim ulang dalam {{ resendCooldown }}s</span>
            <span v-else>Kirim Ulang Email</span>
          </button>
        </div>
      </div>

      <div class="auth-footer">
        <p>
          Ingat password Anda?
          <NuxtLink to="/auth/login" class="link-cyan">Kembali ke Masuk</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

const authStore = useAuthStore()

const email = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitted = ref(false)
const storeLogo = ref('/logo-cyberstore.jpg')
const storeName = ref('BSI Cyber Store')

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

const handleLogoError = () => {
  storeLogo.value = '/logo-cyberstore.jpg'
}

const handleForgotPassword = async () => {
  if (!email.value.trim()) return

  errorMessage.value = ''
  successMessage.value = ''

  const result = await authStore.forgotPassword(email.value.trim())

  if (result.success) {
    isSubmitted.value = true
    successMessage.value = result.message || 'Instruksi reset password telah dikirim ke email Anda.'
    startCooldownTimer(60)
  } else {
    errorMessage.value = result.message || 'Gagal memproses permintaan reset password. Periksa kembali email Anda.'
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
  title: 'Lupa Password | Cyber Store',
})
</script>

<style scoped>
.auth-page {
  min-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.auth-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.auth-logo-box {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: var(--accent-cyan-dim);
  border: 1px solid var(--border-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
}

.auth-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.error-box {
  background: var(--accent-coral-dim);
  border: 1px solid rgba(255, 51, 102, 0.3);
  color: var(--accent-coral);
  font-size: 0.85rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
}

.success-box {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #059669;
  font-size: 0.85rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

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
  color: var(--text-primary);
}

.helper-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.input-cyber {
  color: var(--text-primary);
  background-color: #ffffff;
}

.input-cyber::placeholder {
  color: var(--text-muted);
}

.btn-submit {
  width: 100%;
  padding: 0.85rem;
  margin-top: 0.35rem;
  font-size: 0.875rem;
  color: #ffffff;
}

.sent-state-box {
  text-align: center;
  padding: 1.5rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.sent-icon {
  font-size: 3rem;
  margin-bottom: 0.25rem;
}

.sent-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
}

.sent-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.resend-wrapper {
  margin-top: 0.5rem;
}

.btn-resend-link {
  background: transparent;
  border: none;
  color: var(--accent-cyan);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
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

.auth-footer {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  border-top: 1px solid var(--border-subtle);
  padding-top: 1.25rem;
}

.link-cyan {
  color: var(--accent-cyan);
  font-weight: 700;
}

.link-cyan:hover {
  color: var(--ubsi-blue-dark, #002266);
  text-decoration: underline;
}
</style>
