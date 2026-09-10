<template>
  <div :class="['cyber-loader-container', { 'is-fullscreen': fullscreen }, `size-${size}`]">
    <div class="loader-content">
      <!-- Cyber Rings Spinner -->
      <div class="rings-wrapper">
        <div class="outer-ring"></div>
        <div class="middle-ring"></div>
        <div class="inner-core">
          <div class="core-dot"></div>
        </div>
      </div>

      <!-- Tech Status Indicator -->
      <div class="loader-info">
        <div class="tech-badge">
          <span class="status-pulse"></span>
          <span>SYSTEM PROTOCOL</span>
        </div>
        <div class="loader-title">{{ text || 'MEMUAT SISTEM...' }}</div>
        <div v-if="subtext" class="loader-subtext">{{ subtext }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    fullscreen?: boolean
    text?: string
    subtext?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    fullscreen: false,
    text: 'MEMUAT DATA...',
    subtext: 'Menghubungkan ke secure server Cyber Store...',
    size: 'md',
  }
)
</script>

<style scoped>
.cyber-loader-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  width: 100%;
}

.cyber-loader-container.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(248, 250, 252, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 0;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
}

/* Concentric Cyber Rings */
.rings-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-sm .rings-wrapper { width: 44px; height: 44px; }
.size-md .rings-wrapper { width: 68px; height: 68px; }
.size-lg .rings-wrapper { width: 92px; height: 92px; }

.outer-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2.5px dashed rgba(0, 51, 153, 0.35);
  border-top-color: #003399;
  animation: spinClockwise 3s linear infinite;
  box-shadow: 0 0 15px rgba(0, 51, 153, 0.15);
}

.middle-ring {
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  border: 2px solid transparent;
  border-left-color: #0284c7;
  border-right-color: #0284c7;
  animation: spinCounter 1.8s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
  box-shadow: 0 0 12px rgba(2, 132, 199, 0.2);
}

.inner-core {
  position: absolute;
  inset: 32%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 51, 153, 0.15) 0%, transparent 80%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.core-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #003399;
  box-shadow: 0 0 10px #003399;
  animation: pulseDot 1.4s ease-in-out infinite alternate;
}

.size-sm .core-dot { width: 5px; height: 5px; }
.size-lg .core-dot { width: 12px; height: 12px; }

/* Status Text & Typography */
.loader-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.tech-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #003399;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 8px;
  border-radius: 20px;
}

.status-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #003399;
  animation: blink 1s ease-in-out infinite;
}

.loader-title {
  font-family: var(--font-display, 'Space Grotesk', sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #0f172a;
  text-transform: uppercase;
}

.size-sm .loader-title { font-size: 0.8rem; }
.size-lg .loader-title { font-size: 1.15rem; }

.loader-subtext {
  font-size: 0.78rem;
  color: #64748b;
  max-width: 320px;
  line-height: 1.4;
}

/* Animations */
@keyframes spinClockwise {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes spinCounter {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes pulseDot {
  0% { transform: scale(0.8); opacity: 0.6; }
  100% { transform: scale(1.3); opacity: 1; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}
</style>
