<template>
  <ClientOnly>
    <Teleport to="body">
      <aside
        class="toast-viewport"
        aria-label="Pemberitahuan Sistem"
        role="region"
      >
        <TransitionGroup name="toast-cyber" tag="div" class="toast-stack">
          <div
            v-for="item in toasts"
            :key="item.id"
            class="toast-card"
            :class="[`toast-${item.type}`, { 'is-paused': item.isPaused }]"
            role="status"
            aria-live="polite"
            @mouseenter="pause(item.id)"
            @mouseleave="resume(item.id)"
            @touchstart="handleTouchStart($event, item.id)"
            @touchmove="handleTouchMove($event, item.id)"
            @touchend="handleTouchEnd(item.id)"
            :style="getCardStyle(item.id)"
          >
            <!-- Ambient Glowing Accent Line on Top -->
            <div class="toast-lightbar"></div>

            <!-- Soft Background Radial Glow -->
            <div class="toast-ambient-glow"></div>

            <div class="toast-content-wrapper">
              <!-- Animated Glowing Icon Box -->
              <div class="toast-icon-box">
                <div class="toast-icon-pulse"></div>
                <Icon
                  :name="getToastIcon(item)"
                  class="w-5 h-5 toast-main-icon"
                />
              </div>

              <!-- Main Text Details -->
              <div class="toast-text-group">
                <div class="toast-header-row">
                  <div class="toast-badge-pill">
                    <span class="toast-pulse-dot"></span>
                    <span class="toast-tag">{{ item.tag }}</span>
                  </div>
                  <span class="toast-time">Baru saja</span>
                </div>

                <h4 v-if="item.title" class="toast-title">
                  {{ item.title }}
                </h4>

                <p class="toast-msg">
                  {{ item.message }}
                </p>

                <!-- Optional Footer Note -->
                <div v-if="item.footerNote" class="toast-footer-note">
                  <Icon
                    name="lucide:shield-check"
                    class="w-3.5 h-3.5 toast-footer-icon"
                  />
                  <span>{{ item.footerNote }}</span>
                </div>

                <!-- Optional Action Button -->
                <div v-if="item.action" class="toast-action-row">
                  <button
                    type="button"
                    class="toast-action-btn"
                    :class="{ 'action-primary': item.action.primary !== false }"
                    @click="handleActionClick(item)"
                  >
                    <span>{{ item.action.label }}</span>
                    <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 ml-1 inline" />
                  </button>
                </div>
              </div>

              <!-- Dismiss Button -->
              <button
                type="button"
                class="toast-dismiss-btn"
                aria-label="Tutup Pemberitahuan"
                title="Tutup (Esc)"
                @click="remove(item.id)"
              >
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>

            <!-- Countdown Progress Bar Track -->
            <div v-if="item.duration > 0" class="toast-progress-track">
              <div
                class="toast-progress-bar"
                :style="{ width: `${item.progress}%` }"
              ></div>
            </div>
          </div>
        </TransitionGroup>
      </aside>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast, type ToastItem } from '~/composables/useToast'

const { toasts, remove, pause, resume } = useToast()

// Touch swipe-to-dismiss states
const touchStartX = ref<number | null>(null)
const touchCurrentX = ref<number | null>(null)
const swipingToastId = ref<string | null>(null)

const getToastIcon = (item: ToastItem): string => {
  if (item.icon) return item.icon
  switch (item.type) {
    case 'success':
      return 'lucide:check-circle-2'
    case 'error':
      return 'lucide:alert-circle'
    case 'warning':
      return 'lucide:alert-triangle'
    case 'info':
    default:
      return 'lucide:sparkles'
  }
}

const handleActionClick = (item: ToastItem) => {
  if (item.action && typeof item.action.onClick === 'function') {
    item.action.onClick()
  }
  remove(item.id)
}

const handleTouchStart = (e: TouchEvent, id: string) => {
  if (e.touches && e.touches[0]) {
    touchStartX.value = e.touches[0].clientX
    touchCurrentX.value = e.touches[0].clientX
    swipingToastId.value = id
    pause(id)
  }
}

const handleTouchMove = (e: TouchEvent, id: string) => {
  if (swipingToastId.value === id && e.touches && e.touches[0]) {
    touchCurrentX.value = e.touches[0].clientX
  }
}

const handleTouchEnd = (id: string) => {
  if (
    swipingToastId.value === id &&
    touchStartX.value !== null &&
    touchCurrentX.value !== null
  ) {
    const deltaX = touchCurrentX.value - touchStartX.value
    // If swiped more than 75px to the right, dismiss
    if (deltaX > 75) {
      remove(id)
    } else {
      resume(id)
    }
  } else {
    resume(id)
  }
  touchStartX.value = null
  touchCurrentX.value = null
  swipingToastId.value = null
}

const getCardStyle = (id: string) => {
  if (
    swipingToastId.value === id &&
    touchStartX.value !== null &&
    touchCurrentX.value !== null
  ) {
    const deltaX = Math.max(0, touchCurrentX.value - touchStartX.value)
    const opacity = Math.max(0.2, 1 - deltaX / 200)
    return {
      transform: `translateX(${deltaX}px)`,
      opacity: `${opacity}`,
      transition: 'none',
    }
  }
  return undefined
}
</script>

<style scoped>
/* ==========================================================================
   ULTRA-PREMIUM TOAST NOTIFICATION CONTAINER & VIEWPORT
   ========================================================================== */
.toast-viewport {
  position: fixed;
  top: 24px;
  right: 28px;
  z-index: 1000000;
  max-width: 440px;
  width: calc(100vw - 36px);
  pointer-events: none;
  display: flex;
  flex-direction: column;
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

/* ==========================================================================
   TOAST CARD CORE GLASSMORPHISM & DEPTH
   ========================================================================== */
.toast-card {
  pointer-events: auto;
  position: relative;
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.16),
              0 6px 18px -4px rgba(15, 23, 42, 0.06),
              0 0 0 1px rgba(255, 255, 255, 0.95) inset;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.25s ease,
              border-color 0.25s ease;
  will-change: transform, opacity;
}

.toast-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 26px 56px -10px rgba(15, 23, 42, 0.22),
              0 8px 24px -4px rgba(15, 23, 42, 0.08);
}

.toast-card.is-paused .toast-progress-bar {
  opacity: 0.85;
}

/* Lightbar Glowing Accent Header */
.toast-lightbar {
  width: 100%;
  height: 3.5px;
  background: linear-gradient(90deg, #004aad 0%, #0284c7 100%);
  box-shadow: 0 0 10px rgba(0, 74, 173, 0.45);
}

/* Ambient Radial Glow inside Card */
.toast-ambient-glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.08;
  z-index: 0;
}

.toast-content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 0.95rem;
  padding: 1.05rem 1.25rem 0.95rem 1.15rem;
}

/* ==========================================================================
   SEMANTIC THEME VARIANTS: Success, Error, Warning, Info
   ========================================================================== */

/* 1. SUCCESS (Emerald Green & Tech Cyan) */
.toast-success {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 0 20px 48px -10px rgba(16, 185, 129, 0.22),
              0 6px 18px -4px rgba(15, 23, 42, 0.06);
}
.toast-success .toast-lightbar {
  background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #004aad 100%);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
}
.toast-success .toast-ambient-glow {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.5) 0%, transparent 70%);
}
.toast-success .toast-icon-box {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #a7f3d0;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
}
.toast-success .toast-icon-pulse {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%);
}
.toast-success .toast-main-icon {
  color: #10b981;
}
.toast-success .toast-pulse-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}
.toast-success .toast-tag {
  color: #059669;
}
.toast-success .toast-badge-pill {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
}
.toast-success .toast-footer-note {
  color: #059669;
}
.toast-success .toast-progress-track {
  background: #f0fdf4;
}
.toast-success .toast-progress-bar {
  background: linear-gradient(90deg, #10b981, #06b6d4, #004aad);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.55);
}

/* 2. ERROR (Crimson Rose & Coral) */
.toast-error {
  border-color: rgba(225, 29, 72, 0.35);
  box-shadow: 0 20px 48px -10px rgba(225, 29, 72, 0.22),
              0 6px 18px -4px rgba(15, 23, 42, 0.06);
}
.toast-error .toast-lightbar {
  background: linear-gradient(90deg, #f43f5e 0%, #e11d48 50%, #fb7185 100%);
  box-shadow: 0 0 12px rgba(225, 29, 72, 0.6);
}
.toast-error .toast-ambient-glow {
  background: radial-gradient(circle, rgba(225, 29, 72, 0.5) 0%, transparent 70%);
}
.toast-error .toast-icon-box {
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  border: 1px solid #fecdd3;
  box-shadow: 0 4px 14px rgba(225, 29, 72, 0.2);
}
.toast-error .toast-icon-pulse {
  background: radial-gradient(circle, rgba(225, 29, 72, 0.3) 0%, transparent 70%);
}
.toast-error .toast-main-icon {
  color: #e11d48;
}
.toast-error .toast-pulse-dot {
  background: #e11d48;
  box-shadow: 0 0 6px #e11d48;
}
.toast-error .toast-tag {
  color: #be123c;
}
.toast-error .toast-badge-pill {
  background: #fff1f2;
  border: 1px solid #fecdd3;
}
.toast-error .toast-footer-note {
  color: #e11d48;
}
.toast-error .toast-progress-track {
  background: #fff1f2;
}
.toast-error .toast-progress-bar {
  background: linear-gradient(90deg, #f43f5e, #e11d48, #be123c);
  box-shadow: 0 0 8px rgba(225, 29, 72, 0.55);
}

/* 3. WARNING (Amber Glow & Cyber Gold) */
.toast-warning {
  border-color: rgba(245, 158, 11, 0.4);
  box-shadow: 0 20px 48px -10px rgba(245, 158, 11, 0.22),
              0 6px 18px -4px rgba(15, 23, 42, 0.06);
}
.toast-warning .toast-lightbar {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #fbbf24 100%);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.6);
}
.toast-warning .toast-ambient-glow {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, transparent 70%);
}
.toast-warning .toast-icon-box {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border: 1px solid #fde68a;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.2);
}
.toast-warning .toast-icon-pulse {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
}
.toast-warning .toast-main-icon {
  color: #d97706;
}
.toast-warning .toast-pulse-dot {
  background: #f59e0b;
  box-shadow: 0 0 6px #f59e0b;
}
.toast-warning .toast-tag {
  color: #b45309;
}
.toast-warning .toast-badge-pill {
  background: #fffbeb;
  border: 1px solid #fde68a;
}
.toast-warning .toast-footer-note {
  color: #b45309;
}
.toast-warning .toast-progress-track {
  background: #fffbeb;
}
.toast-warning .toast-progress-bar {
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.55);
}

/* 4. INFO (UBSI Deep Navy & Tech Royal Cyan) */
.toast-info {
  border-color: rgba(0, 74, 173, 0.35);
  box-shadow: 0 20px 48px -10px rgba(0, 74, 173, 0.22),
              0 6px 18px -4px rgba(15, 23, 42, 0.06);
}
.toast-info .toast-lightbar {
  background: linear-gradient(90deg, #004aad 0%, #0284c7 50%, #003399 100%);
  box-shadow: 0 0 12px rgba(0, 74, 173, 0.6);
}
.toast-info .toast-ambient-glow {
  background: radial-gradient(circle, rgba(0, 74, 173, 0.5) 0%, transparent 70%);
}
.toast-info .toast-icon-box {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border: 1px solid #bfdbfe;
  box-shadow: 0 4px 14px rgba(0, 74, 173, 0.2);
}
.toast-info .toast-icon-pulse {
  background: radial-gradient(circle, rgba(0, 74, 173, 0.3) 0%, transparent 70%);
}
.toast-info .toast-main-icon {
  color: #004aad;
}
.toast-info .toast-pulse-dot {
  background: #004aad;
  box-shadow: 0 0 6px #004aad;
}
.toast-info .toast-tag {
  color: #003399;
}
.toast-info .toast-badge-pill {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}
.toast-info .toast-footer-note {
  color: #004aad;
}
.toast-info .toast-progress-track {
  background: #eff6ff;
}
.toast-info .toast-progress-bar {
  background: linear-gradient(90deg, #0284c7, #004aad, #003399);
  box-shadow: 0 0 8px rgba(0, 74, 173, 0.55);
}

/* ==========================================================================
   ICON BOX & PULSE
   ========================================================================== */
.toast-icon-box {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-icon-pulse {
  position: absolute;
  inset: -5px;
  border-radius: 18px;
  animation: toastPulseAnim 2.6s ease-in-out infinite alternate;
}

@keyframes toastPulseAnim {
  0% {
    transform: scale(0.92);
    opacity: 0.45;
  }
  100% {
    transform: scale(1.15);
    opacity: 0.95;
  }
}

.toast-main-icon {
  position: relative;
  z-index: 2;
}

/* ==========================================================================
   TEXT CONTENT & HEADINGS
   ========================================================================== */
.toast-text-group {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.toast-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.toast-badge-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
}

.toast-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: pulseDotAnim 1.6s infinite ease-in-out;
}

@keyframes pulseDotAnim {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.35);
  }
}

.toast-tag {
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.toast-time {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  white-space: nowrap;
}

.toast-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
  line-height: 1.35;
  margin-bottom: 0.2rem;
}

.toast-msg {
  font-size: 0.865rem;
  color: #334155;
  line-height: 1.48;
  font-weight: 500;
  word-break: break-word;
}

.toast-footer-note {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.725rem;
  font-weight: 600;
  margin-top: 0.45rem;
}

.toast-footer-icon {
  flex-shrink: 0;
}

/* Optional Action Button */
.toast-action-row {
  margin-top: 0.6rem;
}

.toast-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid transparent;
}

.action-primary {
  background: #003399;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.25);
}

.action-primary:hover {
  background: #004aad;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.35);
}

/* ==========================================================================
   DISMISS (X) BUTTON
   ========================================================================== */
.toast-dismiss-btn {
  color: #94a3b8;
  padding: 0.35rem;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
  flex-shrink: 0;
  margin-left: -0.25rem;
  margin-top: -0.2rem;
}

.toast-dismiss-btn:hover {
  color: #0f172a;
  background: #f1f5f9;
  transform: rotate(90deg) scale(1.08);
}

/* ==========================================================================
   PROGRESS BAR TRACK & INDICATOR
   ========================================================================== */
.toast-progress-track {
  width: 100%;
  height: 3.5px;
  overflow: hidden;
  position: relative;
}

.toast-progress-bar {
  height: 100%;
  width: 100%;
  transition: width 0.05s linear;
}

/* ==========================================================================
   VUE TRANSITION GROUP: Springy Cyber Pop & Collapse
   ========================================================================== */
.toast-cyber-enter-active {
  transition: all 0.38s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-cyber-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 1, 1);
  position: absolute;
  width: 100%;
}

.toast-cyber-move {
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-cyber-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.92);
}

.toast-cyber-leave-to {
  opacity: 0;
  transform: translateX(45px) scale(0.94);
}

/* ==========================================================================
   DARK MODE COMPATIBILITY
   ========================================================================== */
html.dark .toast-card {
  background: rgba(15, 23, 42, 0.94);
  border-color: rgba(51, 65, 85, 0.7);
  box-shadow: 0 24px 60px -10px rgba(0, 0, 0, 0.65),
              0 0 0 1px rgba(255, 255, 255, 0.08) inset;
}

html.dark .toast-card:hover {
  box-shadow: 0 28px 70px -10px rgba(0, 0, 0, 0.75),
              0 0 0 1px rgba(255, 255, 255, 0.12) inset;
}

html.dark .toast-title {
  color: #f8fafc;
}

html.dark .toast-msg {
  color: #cbd5e1;
}

html.dark .toast-dismiss-btn:hover {
  background: #1e293b;
  color: #f8fafc;
}

html.dark .toast-success {
  border-color: rgba(16, 185, 129, 0.45);
}
html.dark .toast-success .toast-icon-box {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
}
html.dark .toast-success .toast-badge-pill {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.35);
}
html.dark .toast-success .toast-tag,
html.dark .toast-success .toast-footer-note {
  color: #34d399;
}
html.dark .toast-success .toast-progress-track {
  background: rgba(16, 185, 129, 0.12);
}

html.dark .toast-error {
  border-color: rgba(225, 29, 72, 0.45);
}
html.dark .toast-error .toast-icon-box {
  background: rgba(225, 29, 72, 0.15);
  border-color: rgba(225, 29, 72, 0.4);
}
html.dark .toast-error .toast-badge-pill {
  background: rgba(225, 29, 72, 0.15);
  border-color: rgba(225, 29, 72, 0.35);
}
html.dark .toast-error .toast-tag,
html.dark .toast-error .toast-footer-note {
  color: #fb7185;
}
html.dark .toast-error .toast-progress-track {
  background: rgba(225, 29, 72, 0.12);
}

html.dark .toast-warning {
  border-color: rgba(245, 158, 11, 0.45);
}
html.dark .toast-warning .toast-icon-box {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}
html.dark .toast-warning .toast-badge-pill {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
}
html.dark .toast-warning .toast-tag,
html.dark .toast-warning .toast-footer-note {
  color: #fcd34d;
}
html.dark .toast-warning .toast-progress-track {
  background: rgba(245, 158, 11, 0.12);
}

html.dark .toast-info {
  border-color: rgba(2, 132, 199, 0.45);
}
html.dark .toast-info .toast-icon-box {
  background: rgba(2, 132, 199, 0.15);
  border-color: rgba(2, 132, 199, 0.4);
}
html.dark .toast-info .toast-badge-pill {
  background: rgba(2, 132, 199, 0.15);
  border-color: rgba(2, 132, 199, 0.35);
}
html.dark .toast-info .toast-tag,
html.dark .toast-info .toast-footer-note {
  color: #38bdf8;
}
html.dark .toast-info .toast-progress-track {
  background: rgba(2, 132, 199, 0.12);
}

/* ==========================================================================
   RESPONSIVE DESIGN (MOBILE & SMALL TABLETS)
   ========================================================================== */
@media (max-width: 640px) {
  .toast-viewport {
    top: 14px;
    right: 12px;
    left: 12px;
    width: auto;
    max-width: none;
  }

  .toast-card {
    border-radius: 16px;
  }

  .toast-content-wrapper {
    padding: 0.9rem 1rem 0.85rem 1rem;
    gap: 0.75rem;
  }

  .toast-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 11px;
  }

  .toast-title {
    font-size: 0.9rem;
  }

  .toast-msg {
    font-size: 0.825rem;
  }

  .toast-cyber-enter-from {
    opacity: 0;
    transform: translateY(-24px) scale(0.95);
  }

  .toast-cyber-leave-to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
}
</style>
