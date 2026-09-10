<template>
  <div class="error-page-container">
    <!-- Cyber Geometric Background Accents -->
    <div class="bg-mesh" aria-hidden="true"></div>
    <div class="glow-orb orb-1" aria-hidden="true"></div>
    <div class="glow-orb orb-2" aria-hidden="true"></div>

    <div class="error-card cyber-card">
      <!-- Error Code Display -->
      <div class="status-badge-row">
        <span class="cyber-badge">
          <span class="pulse-dot"></span>
          <span>HTTP STATUS: {{ statusCode }}</span>
        </span>
      </div>

      <div class="error-code-glow">
        <h1 class="error-code-number">{{ statusCode }}</h1>
        <div class="error-code-shadow" aria-hidden="true">{{ statusCode }}</div>
      </div>

      <!-- Icon & Headline -->
      <div class="error-content">
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-description">{{ errorDescription }}</p>
      </div>

      <!-- Technical detail box (if available) -->
      <div v-if="error?.message && error.message !== errorTitle" class="error-debug-box">
        <span class="debug-label">Detail Teknis:</span>
        <code class="debug-message">{{ error.message }}</code>
      </div>

      <!-- Action Buttons -->
      <div class="error-actions">
        <NuxtLink to="/" class="btn btn-secondary btn-action">
          <Icon name="lucide:home" class="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </NuxtLink>
        <NuxtLink to="/products" class="btn btn-secondary btn-action">
          <Icon name="lucide:layout-grid" class="w-4 h-4" />
          <span>Jelajahi Katalog</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  error: {
    type: Object,
    default: () => ({}),
  },
})

const statusCode = computed(() => {
  return Number(props.error?.statusCode || props.error?.status || 404)
})

const errorTitle = computed(() => {
  if (statusCode.value === 404) {
    return 'Halaman Tidak Ditemukan'
  }
  if (statusCode.value === 403) {
    return 'Akses Ditolak'
  }
  if (statusCode.value >= 500) {
    return 'Terjadi Kesalahan Server'
  }
  return 'Sistem Menemui Kendala'
})

const errorDescription = computed(() => {
  if (statusCode.value === 404) {
    return 'Tautan yang Anda tuju mungkin sudah kedaluwarsa, dipindahkan, atau produk sudah tidak aktif.'
  }
  if (statusCode.value === 403) {
    return 'Anda tidak memiliki hak akses yang cukup untuk membuka halaman yang diminta.'
  }
  if (statusCode.value >= 500) {
    return 'Server kami sedang dalam pemeliharaan atau mengalami gangguan sementara. Silakan coba sesaat lagi.'
  }
  return 'Halaman tidak dapat ditampilkan dengan baik. Silakan kembali ke beranda atau hubungi admin toko.'
})

const handleClearError = () => {
  clearError({ redirect: '/' })
}

useHead({
  title: computed(() => `${statusCode.value} - ${errorTitle.value} | Cyber Store`),
})
</script>

<style scoped>
.error-page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: var(--bg-darker, #f8fafc);
  position: relative;
  overflow: hidden;
  font-family: var(--font-main, sans-serif);
}

.bg-mesh {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.5;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  opacity: 0.35;
}

.orb-1 {
  width: 320px;
  height: 320px;
  background: var(--ubsi-royal, #004aad);
  top: 10%;
  left: 15%;
}

.orb-2 {
  width: 380px;
  height: 380px;
  background: var(--ubsi-gold, #f59e0b);
  bottom: 10%;
  right: 15%;
}

.error-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 520px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-subtle, #e2e8f0);
  border-radius: var(--radius-lg, 20px);
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: var(--shadow-card, 0 10px 30px rgba(0, 0, 0, 0.08));
}

.status-badge-row {
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.cyber-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.85rem;
  background: var(--ubsi-cyan-light, #e0f2fe);
  color: var(--ubsi-royal, #004aad);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 9999px;
  border: 1px solid rgba(0, 74, 173, 0.2);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  background: var(--ubsi-gold, #f59e0b);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--ubsi-gold, #f59e0b);
}

.error-code-glow {
  position: relative;
  margin: 0.5rem 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-code-number {
  font-size: clamp(5rem, 15vw, 7.5rem);
  font-weight: 900;
  font-family: var(--font-display, monospace);
  line-height: 1;
  background: linear-gradient(135deg, var(--ubsi-blue, #003399) 0%, var(--ubsi-royal, #004aad) 50%, var(--ubsi-gold, #f59e0b) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: -0.04em;
}

.error-code-shadow {
  position: absolute;
  font-size: clamp(5rem, 15vw, 7.5rem);
  font-weight: 900;
  font-family: var(--font-display, monospace);
  line-height: 1;
  color: rgba(0, 51, 153, 0.06);
  z-index: -1;
  transform: translateY(6px);
}

.error-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary, #1e293b);
  margin-bottom: 0.5rem;
}

.error-description {
  color: var(--text-secondary, #64748b);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.75rem;
}

.error-debug-box {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  text-align: left;
  font-size: 0.8rem;
}

.debug-label {
  display: block;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.25rem;
}

.debug-message {
  color: #ef4444;
  word-break: break-all;
  font-family: monospace;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

@media (max-width: 480px) {
  .error-card {
    padding: 2.25rem 1.25rem;
  }

  .error-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-action {
    width: 100%;
    justify-content: center;
  }
}
</style>
