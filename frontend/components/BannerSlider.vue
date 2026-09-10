<template>
  <div
    class="banner-slider-wrapper"
    @mouseenter="pauseAutoSlide"
    @mouseleave="startAutoSlide"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <div v-if="slides.length > 0" class="slider-container">
      <!-- Active Slide -->
      <transition name="fade-slide" mode="out-in">
        <div
          v-if="currentSlideData"
          :key="currentSlide"
          class="slide-item"
          :style="{
            backgroundImage: `url(${currentSlideData.image_url})`
          }"
        >
          <!-- Gradient Overlay for Contrast -->
          <div class="slide-overlay"></div>

          <!-- Slide Content -->
          <div class="slide-content">
            <div class="slide-badge">
              <span><Icon name="lucide:zap" class="w-3.5 h-3.5 inline mr-1" />{{ currentSlideData.badge || 'PROMO RESMI UBSI 2026' }}</span>
            </div>
            <h2 class="slide-title">
              {{ currentSlideData.title }}
            </h2>
            <p class="slide-desc">
              {{ currentSlideData.description }}
            </p>
            <div class="slide-actions">
              <NuxtLink :to="currentSlideData.link || '/products'" class="btn btn-primary btn-slider">
                <span>Jelajahi Sekarang</span>
                <Icon name="lucide:arrow-right" class="w-4 h-4" />
              </NuxtLink>
              <NuxtLink to="/products?is_recommended=1" class="btn btn-secondary btn-slider">
                <span>Produk Unggulan</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </transition>

      <!-- Slider Controls -->
      <div v-if="slides.length > 1" class="slider-controls">
        <div class="slider-dots">
          <button
            v-for="(_, index) in slides"
            :key="index"
            @click="setSlide(index)"
            :class="['slider-dot', { active: currentSlide === index }]"
            :aria-label="`Slide ${index + 1}`"
          ></button>
        </div>

        <div class="slider-arrows">
          <button @click="prevSlide" class="arrow-btn" aria-label="Slide Sebelumnya">
            <Icon name="lucide:chevron-left" class="w-5 h-5" />
          </button>
          <button @click="nextSlide" class="arrow-btn" aria-label="Slide Selanjutnya">
            <Icon name="lucide:chevron-right" class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useApi } from '~/composables/useApi'

export interface BannerItem {
  title: string
  description: string
  badge: string
  image_url: string
  link: string
}

const props = defineProps<{
  banners?: any[]
}>()

const { getImageUrl } = useApi()
const currentSlide = ref(0)
let timer: any = null

const touchStartX = ref(0)
const touchEndX = ref(0)

const defaultBanners: BannerItem[] = [
  {
    title: 'GENERASI BARU CYBER GEAR & HARDWARE',
    description: 'Tingkatkan performa gaming dan produktivitasmu dengan setup futuristik bertenaga AI dan komponen resmi bergaransi.',
    badge: 'EXCLUSIVE EDITION',
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    link: '/products',
  },
  {
    title: 'MECHANICAL KEYBOARDS & RGB PERIPHERALS',
    description: 'Switch kustom, ultra-low latency, dan desain ergonomis cybernetic untuk pengalaman gaming tanpa kompromi.',
    badge: 'FLASH SALE 40%',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=1600&q=80',
    link: '/products',
  },
]

const slides = computed<BannerItem[]>(() => {
  if (props.banners && props.banners.length > 0) {
    return props.banners.map((b) => ({
      title: b.title || 'CYBER TECH SPECIAL DEAL',
      description: b.description || 'Dapatkan potongan harga spesial dan cashback untuk transaksi minggu ini.',
      badge: b.badge || 'PROMO TERBATAS',
      image_url: getImageUrl(b.image || b.photo || b.image_url),
      link: b.link || '/products',
    }))
  }
  return defaultBanners
})

const currentSlideData = computed<BannerItem>(() => {
  return slides.value[currentSlide.value] || defaultBanners[0]!
})

const nextSlide = () => {
  if (slides.value.length === 0) return
  currentSlide.value = (currentSlide.value + 1) % slides.value.length
}

const prevSlide = () => {
  if (slides.value.length === 0) return
  currentSlide.value = (currentSlide.value - 1 + slides.value.length) % slides.value.length
}

const setSlide = (idx: number) => {
  currentSlide.value = idx
}

const startAutoSlide = () => {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    nextSlide()
  }, 6000)
}

const pauseAutoSlide = () => {
  if (timer) clearInterval(timer)
}

const onTouchStart = (e: TouchEvent) => {
  const touch = e.touches[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  pauseAutoSlide()
}

const onTouchEnd = (e: TouchEvent) => {
  const touch = e.changedTouches[0]
  if (!touch) return
  touchEndX.value = touch.clientX
  handleSwipe()
  startAutoSlide()
}

const handleSwipe = () => {
  const swipeDistance = touchEndX.value - touchStartX.value
  const minSwipeDistance = 45
  if (swipeDistance > minSwipeDistance) {
    prevSlide()
  } else if (swipeDistance < -minSwipeDistance) {
    nextSlide()
  }
}

onMounted(() => {
  startAutoSlide()
})

onUnmounted(() => {
  pauseAutoSlide()
})
</script>

<style scoped>
.banner-slider-wrapper {
  position: relative;
  width: 100%;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid #cbd5e1;
  box-shadow: 0 10px 30px rgba(0, 51, 153, 0.08);
  user-select: none;
}

.slider-container {
  position: relative;
  min-height: 440px;
  height: 460px;
  background: #002266;
  overflow: hidden;
}

.slide-item {
  position: relative;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  padding: 2.5rem 4rem 4.5rem 4rem;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(0, 34, 102, 0.95) 0%, rgba(0, 51, 153, 0.78) 52%, rgba(0, 51, 153, 0.2) 100%);
  z-index: 1;
  pointer-events: none;
}

.slide-content {
  position: relative;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  z-index: 2;
}

.slide-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #b45309;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
}

.slide-title {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}

.slide-desc {
  font-size: 1rem;
  color: #e0f2fe;
  line-height: 1.6;
}

.slide-actions {
  display: flex;
  gap: 0.85rem;
  align-items: center;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.btn-slider {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  font-size: 0.88rem;
  font-weight: 700;
  border-radius: var(--radius-full);
  transition: all 0.25s ease;
  white-space: nowrap;
}

/* Slider Controls */
.slider-controls {
  position: absolute;
  bottom: 2rem;
  left: 4rem;
  right: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 3;
}

.slider-dots {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.slider-dot {
  width: 12px;
  height: 4px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.slider-dot.active {
  width: 32px;
  background: #f59e0b;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.6);
}

.slider-arrows {
  display: flex;
  gap: 0.5rem;
}

.arrow-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.95);
  border: 1.5px solid #bfdbfe;
  color: #003399;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.15);
  transition: all 0.2s ease;
  cursor: pointer;
}

.arrow-btn:hover {
  background: #003399;
  color: #ffffff;
  border-color: #003399;
  transform: scale(1.08);
}

/* Fade Slide Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(25px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-25px);
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */

/* 1. Medium Laptops & Tablets Landscape (max-width: 1024px) */
@media (max-width: 1024px) {
  .slider-container {
    height: 400px;
    min-height: 380px;
  }
  .slide-item {
    padding: 2rem 2.5rem 3.5rem 2.5rem;
  }
  .slide-overlay {
    background: linear-gradient(90deg, rgba(0, 34, 102, 0.96) 0%, rgba(0, 51, 153, 0.85) 60%, rgba(0, 51, 153, 0.35) 100%);
  }
  .slide-title {
    font-size: 1.85rem;
  }
  .slide-desc {
    font-size: 0.92rem;
  }
  .slider-controls {
    left: 2.5rem;
    right: 2.5rem;
    bottom: 1.5rem;
  }
}

/* 2. Tablets Portrait & Mobile Landscape (max-width: 768px) */
@media (max-width: 768px) {
  .slider-container {
    height: auto;
    min-height: 320px;
  }
  .slide-item {
    background-size: cover;
    background-position: center center !important;
    background-repeat: no-repeat;
    padding: 2.25rem 1.5rem 3.75rem 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  .slide-overlay {
    background: linear-gradient(180deg, rgba(0, 26, 77, 0.72) 0%, rgba(0, 34, 102, 0.5) 45%, rgba(0, 34, 102, 0.85) 100%);
  }
  .slide-content {
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.85rem;
    margin: 0 auto;
  }
  .slide-badge {
    align-self: center;
    font-size: 0.72rem;
    padding: 3px 10px;
  }
  .slide-title {
    font-size: 1.5rem;
    line-height: 1.25;
    text-align: center;
  }
  .slide-desc {
    font-size: 0.88rem;
    line-height: 1.5;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .slide-actions {
    justify-content: center;
    gap: 0.6rem;
  }
  .btn-slider {
    padding: 0.55rem 1rem;
    font-size: 0.82rem;
  }
  .slider-controls {
    left: 1.5rem;
    right: 1.5rem;
    bottom: 1rem;
  }
  .arrow-btn {
    width: 36px;
    height: 36px;
  }
}

/* 3. Mobile Phones (max-width: 480px) */
@media (max-width: 480px) {
  .slider-container {
    min-height: 290px;
  }
  .slide-item {
    background-size: cover;
    background-position: center center !important;
    background-repeat: no-repeat;
    padding: 1.75rem 1.15rem 3.5rem 1.15rem;
  }
  .slide-overlay {
    background: linear-gradient(180deg, rgba(0, 26, 77, 0.75) 0%, rgba(0, 34, 102, 0.52) 45%, rgba(0, 34, 102, 0.85) 100%);
  }
  .slide-title {
    font-size: 1.25rem;
    line-height: 1.25;
  }
  .slide-desc {
    font-size: 0.82rem;
    line-height: 1.45;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .slide-actions {
    gap: 0.5rem;
  }
  .btn-slider {
    padding: 0.48rem 0.85rem;
    font-size: 0.78rem;
  }
  .slider-controls {
    left: 1.15rem;
    right: 1.15rem;
    bottom: 0.85rem;
  }
  .arrow-btn {
    width: 32px;
    height: 32px;
  }
  .arrow-btn svg {
    width: 16px;
    height: 16px;
  }
  .slider-dot {
    width: 10px;
    height: 3px;
  }
  .slider-dot.active {
    width: 22px;
  }
}

/* 4. Extra Small Phones (max-width: 360px) */
@media (max-width: 360px) {
  .slide-title {
    font-size: 1.15rem;
  }
  .slide-desc {
    font-size: 0.78rem;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
  .btn-slider {
    padding: 0.45rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>
