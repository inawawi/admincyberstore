<template>
  <div class="reviews-preview-page container">
    <!-- Breadcrumb & Back Navigation -->
    <div class="review-nav-bar">
      <NuxtLink :to="`/products/${productId}`" class="back-link">
        <Icon name="lucide:arrow-left" class="w-4 h-4 mr-1.5" />
        <span>Kembali ke Detail Produk</span>
      </NuxtLink>
      <div class="breadcrumb">
        <NuxtLink to="/">Beranda</NuxtLink>
        <span>/</span>
        <NuxtLink to="/products">Katalog</NuxtLink>
        <span>/</span>
        <NuxtLink :to="`/products/${productId}`">{{ product?.name || 'Produk' }}</NuxtLink>
        <span>/</span>
        <span class="current">Penilaian Pembeli</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="loading-box cyber-card">
      <CyberLoader text="MEMUAT PENILAIAN PRODUK..." subtext="Mengambil ulasan dan bukti foto pembeli dari server..." size="md" />
    </div>

    <!-- Product Not Found -->
    <div v-else-if="!product" class="not-found-box cyber-card">
      <Icon name="lucide:package-x" class="w-12 h-12 text-slate-400" />
      <h2>Produk Tidak Ditemukan</h2>
      <NuxtLink to="/products" class="btn btn-primary">Kembali ke Katalog</NuxtLink>
    </div>

    <!-- Main Content -->
    <div v-else class="reviews-main-layout">
      <!-- Top: Compact Product Summary Card -->
      <div class="product-summary-card cyber-card">
        <div class="summary-left">
          <img
            :src="getImageUrl(product.main_photo)"
            :alt="product.name"
            class="summary-thumb"
            @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }"
          />
          <div class="summary-info">
            <span v-if="product.category" class="summary-category">{{ product.category.name }}</span>
            <h1 class="summary-title">{{ product.name }}</h1>
            <div class="summary-price-row">
              <span class="summary-price">{{ formatRupiah(product.price) }}</span>
              <span v-if="product.original_price && product.original_price > product.price" class="summary-strike">
                {{ formatRupiah(product.original_price) }}
              </span>
            </div>
          </div>
        </div>

        <div class="summary-actions">
          <!-- Button Tulis Penilaian & Bukti Foto: Hanya muncul jika user eligible (sudah beli & produk tiba) -->
          <button
            v-if="eligibility?.can_review"
            type="button"
            class="btn btn-primary btn-write-review animate-pulse-subtle"
            @click="openReviewModal"
            title="Kirim ulasan dan foto bukti produk sampai tujuan"
          >
            <Icon name="lucide:message-square-plus" class="w-4 h-4 mr-1.5" />
            <span>Tulis Penilaian & Bukti Foto</span>
          </button>

          <!-- Jika Belum Login -->
          <NuxtLink
            v-else-if="!authStore.isAuthenticated"
            :to="`/auth/login?redirect=/products/${productId}/reviews`"
            class="btn btn-outline-primary btn-login-to-review"
            title="Masuk ke akun untuk memberikan penilaian"
          >
            <Icon name="lucide:log-in" class="w-4 h-4 mr-1.5" />
            <span>Masuk untuk Menilai</span>
          </NuxtLink>

          <!-- Jika Sudah Menilai -->
          <div v-else-if="eligibility?.reason === 'already_reviewed'" class="already-reviewed-badge">
            <Icon name="lucide:check-circle-2" class="w-4 h-4 text-emerald-500 mr-1.5 inline" />
            <span>Ulasan Anda Terkirim</span>
          </div>

          <!-- Jika Pesanan Sedang Dikirim / Belum Tiba -->
          <div v-else-if="eligibility?.reason === 'not_arrived'" class="transit-status-box">
            <span class="transit-text">
              <Icon name="lucide:truck" class="w-4 h-4 text-blue-500 mr-1.5 inline" />
              Paket sedang dikirim
            </span>
            <NuxtLink to="/account/orders" class="btn btn-secondary btn-sm ml-2">
              <span>Lacak Pesanan</span>
            </NuxtLink>
          </div>

          <!-- Jika Belum Membeli Produk -->
          <div v-else-if="eligibility?.reason === 'not_purchased'" class="verified-buyer-pill" title="Hanya pembeli yang telah membeli produk ini yang dapat memberikan penilaian">
            <Icon name="lucide:shield-check" class="w-4 h-4 text-slate-400 mr-1.5 inline" />
            <span>Khusus Pembeli Terverifikasi</span>
          </div>

          <!-- Tombol Lihat Produk: Selalu Muncul -->
          <NuxtLink :to="`/products/${productId}`" class="btn btn-secondary btn-detail-link">
            <span>Lihat Produk</span>
            <Icon name="lucide:external-link" class="w-4 h-4 ml-1" />
          </NuxtLink>
        </div>
      </div>

      <!-- Middle: Shopee-Style Rating Banner & Filter Chips -->
      <div class="shopee-rating-card cyber-card">
        <div class="rating-overview-col">
          <div class="score-large-wrap">
            <span class="score-number">{{ averageRating.toFixed(1) }}</span>
            <span class="score-max">dari 5</span>
          </div>
          <div class="stars-large">
            <svg
              v-for="s in 5"
              :key="s"
              :class="['star-svg', 'star-large', { active: s <= Math.round(averageRating) }]"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <span class="total-reviews-label">{{ allReviews.length }} Penilaian Pembeli</span>
        </div>

        <!-- Filter Chips (Shopee Style) -->
        <div class="filter-chips-col">
          <div class="filter-chips-track">
            <button
              type="button"
              :class="['filter-chip', { active: activeFilter === 'all' }]"
              @click="activeFilter = 'all'"
            >
              Semua ({{ allReviews.length }})
            </button>

            <button
              type="button"
              :class="['filter-chip', { active: activeFilter === 'with_photo' }]"
              @click="activeFilter = 'with_photo'"
            >
              <Icon name="lucide:camera" class="w-3.5 h-3.5 inline mr-1" />
              Dengan Foto ({{ countWithPhotos }})
            </button>

            <button
              v-for="star in [5, 4, 3, 2, 1]"
              :key="star"
              type="button"
              :class="['filter-chip', { active: activeFilter === String(star) }]"
              @click="activeFilter = String(star)"
            >
              {{ star }} Bintang ({{ countByStar(star) }})
            </button>

            <button
              type="button"
              :class="['filter-chip', { active: activeFilter === 'with_reply' }]"
              @click="activeFilter = 'with_reply'"
            >
              Dengan Balasan Toko ({{ countWithReply }})
            </button>
          </div>
        </div>
      </div>

      <!-- Bottom: Reviews List -->
      <div class="reviews-list-section">
        <!-- Empty State -->
        <div v-if="filteredReviews.length === 0" class="empty-reviews-box cyber-card">
          <Icon name="lucide:message-square-off" class="w-12 h-12 text-slate-300 mb-2" />
          <h3>Belum Ada Penilaian untuk Filter Ini</h3>
          <p v-if="activeFilter !== 'all'">Coba pilih filter lain atau lihat semua penilaian.</p>
          <p v-else>Jadilah pembeli pertama yang memberikan ulasan produk ini!</p>
          <button
            v-if="activeFilter !== 'all'"
            type="button"
            class="btn btn-secondary mt-2"
            @click="activeFilter = 'all'"
          >
            Reset Filter
          </button>
        </div>

        <!-- Review Cards -->
        <div v-else class="review-cards-list">
          <div v-for="rev in filteredReviews" :key="rev.id" class="review-item cyber-card">
            <!-- Header: Avatar, Name, Rating -->
            <div class="rev-item-header">
              <div class="reviewer-avatar">
                {{ getAvatarInitial(rev.user?.name) }}
              </div>
              <div class="rev-user-meta">
                <span class="reviewer-name">{{ getMaskedName(rev.user?.name) }}</span>
                <div class="rev-stars">
                  <svg
                    v-for="s in 5"
                    :key="s"
                    :class="['star-svg', 'star-sm', { active: s <= (rev.rating || 5) }]"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <span class="rev-date">
                  {{ rev.created_at ? new Date(rev.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Baru saja' }}
                </span>
              </div>
            </div>

            <!-- Comment Content -->
            <div class="rev-comment-text">
              {{ rev.comment || rev.review || 'Pembeli tidak meninggalkan komentar tertulis.' }}
            </div>

            <!-- Photo Proof (Bukti Produk Sudah Sampai) -->
            <div v-if="getReviewPhotos(rev).length > 0" class="rev-photos-container">
              <div class="rev-photos-label">
                <Icon name="lucide:check-circle" class="w-3.5 h-3.5 text-emerald-500 inline mr-1" />
                <span>Foto Bukti Produk Diterima:</span>
              </div>
              <div class="rev-photos-grid">
                <button
                  v-for="(photo, pIdx) in getReviewPhotos(rev)"
                  :key="pIdx"
                  type="button"
                  class="rev-photo-thumb-btn"
                  @click="openProofLightbox(getReviewPhotos(rev), pIdx)"
                  title="Klik untuk memperbesar foto bukti penerimaan"
                >
                  <img
                    :src="getImageUrl(photo)"
                    :alt="`Bukti Produk ${pIdx + 1}`"
                    class="rev-photo-img"
                    @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }"
                  />
                  <div class="photo-zoom-overlay">
                    <Icon name="lucide:zoom-in" class="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Store Admin Reply -->
            <div v-if="rev.reply || (rev.replies && rev.replies.length)" class="rev-admin-reply">
              <div class="reply-badge">
                <Icon name="lucide:store" class="w-3.5 h-3.5 inline mr-1 text-bsi-blue" />
                <span>Balasan dari Penjual:</span>
              </div>
              <p class="reply-text">{{ rev.reply || rev.replies[0]?.comment }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form: Tulis Penilaian & Unggah Bukti Foto Sampai -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isReviewModalOpen" class="review-modal-backdrop" @click.self="closeReviewModal">
          <div class="review-modal-card">
            <!-- Modal Header -->
            <div class="review-modal-header">
              <div class="modal-header-title">
                <Icon name="lucide:star" class="w-5 h-5 text-amber-500 fill-amber-500 mr-2" />
                <h3>Beri Penilaian & Unggah Bukti</h3>
              </div>
              <button type="button" class="modal-close-btn" @click="closeReviewModal" aria-label="Tutup Modal">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body Form -->
            <form @submit.prevent="handleSubmitReview" class="review-modal-body" novalidate>
              <!-- Product Mini Info -->
              <div class="modal-product-badge">
                <img :src="getImageUrl(product?.main_photo)" :alt="product?.name" class="modal-product-thumb" />
                <div class="modal-product-text">
                  <span class="modal-product-name">{{ product?.name }}</span>
                  <span class="modal-product-price">{{ formatRupiah(product?.price) }}</span>
                </div>
              </div>

              <!-- Rating Stars Picker -->
              <div class="form-group">
                <label class="form-label">Kualitas Produk / Kepuasan Anda:</label>
                <div class="interactive-star-picker">
                  <button
                    v-for="star in 5"
                    :key="star"
                    type="button"
                    class="star-picker-btn"
                    :class="{ active: star <= (hoverRating || formRating) }"
                    @click="formRating = star"
                    @mouseenter="hoverRating = star"
                    @mouseleave="hoverRating = 0"
                    :title="getStarText(star)"
                  >
                    <svg class="star-svg star-picker" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </button>
                  <span class="star-rating-hint">{{ getStarText(hoverRating || formRating) }}</span>
                </div>
              </div>

              <!-- Review Comment Input -->
              <div class="form-group">
                <label class="form-label">Ulasan Anda:</label>
                <textarea
                  v-model="formComment"
                  rows="4"
                  maxlength="500"
                  class="input-cyber form-textarea"
                  placeholder="Ceritakan pengalaman Anda: kondisi produk saat tiba, kualitas bahan, kecepatan pengiriman, dan pelayanan..."
                ></textarea>
                <div class="textarea-counter">{{ formComment.length }} / 500 karakter</div>
              </div>

              <!-- Photo Proof Upload Section -->
              <div class="form-group">
                <div class="upload-label-row">
                  <label class="form-label">Bukti Foto Produk Sudah Sampai:</label>
                  <span class="upload-limit-tag">Maks. 5 Foto</span>
                </div>
                <p class="upload-helper">
                  Tambahkan foto fisik produk yang telah sampai di tangan Anda (unboxing, paket, atau detail barang).
                </p>

                <!-- Upload Drag/Drop Box -->
                <div class="upload-dropzone" @click="triggerFileInput">
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    multiple
                    class="hidden-file-input"
                    @change="handleFileChange"
                  />
                  <div class="dropzone-content">
                    <div class="dropzone-icon">
                      <Icon name="lucide:image-plus" class="w-6 h-6 text-bsi-blue" />
                    </div>
                    <span class="dropzone-text">Pilih Foto atau Tarik ke Sini</span>
                    <span class="dropzone-sub">JPG, PNG, atau WebP (Maks. 2MB per foto)</span>
                  </div>
                </div>

                <!-- Preview List of Uploaded Photos -->
                <div v-if="selectedPhotos.length > 0" class="preview-photos-grid">
                  <div v-for="(item, idx) in selectedPhotos" :key="idx" class="preview-photo-box">
                    <img :src="item.previewUrl" :alt="`Pratinjau ${idx + 1}`" class="preview-photo-img" />
                    <button
                      type="button"
                      class="remove-photo-btn"
                      @click="removePhoto(idx)"
                      title="Hapus foto ini"
                    >
                      <Icon name="lucide:x" class="w-3.5 h-3.5 text-white" />
                    </button>
                    <span class="photo-size-badge">{{ formatFileSize(item.file.size) }}</span>
                  </div>
                </div>

                <div v-if="uploadError" class="upload-error-msg">
                  <Icon name="lucide:alert-circle" class="w-4 h-4 inline mr-1" />
                  <span>{{ uploadError }}</span>
                </div>
              </div>

              <!-- Inline Validation & Submission Error Alert -->
              <div v-if="validationError || submitError" class="submit-error-box animate-shake">
                <Icon name="lucide:alert-triangle" class="w-4 h-4 inline mr-1 text-rose-500" />
                <span>{{ validationError || submitError }}</span>
              </div>

              <!-- Modal Footer Actions -->
              <div class="modal-footer-actions">
                <button type="button" class="btn btn-secondary" @click="closeReviewModal" :disabled="isSubmitting">
                  Batal
                </button>
                <button type="submit" class="btn btn-primary btn-submit-review" :disabled="isSubmitting">
                  <span v-if="isSubmitting" class="btn-spinner mr-1.5"></span>
                  <Icon v-else name="lucide:send" class="w-4 h-4 mr-1.5" />
                  <span>{{ isSubmitting ? 'Mengirim Penilaian...' : 'Kirim Penilaian' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Floating Validation Toast Notification (Sukses / Gagal) -->
    <Teleport to="body">
      <Transition name="toast-pop">
        <div
          v-if="reviewToast.show"
          class="review-toast-notification"
          :class="`toast-${reviewToast.type}`"
          role="status"
          aria-live="polite"
        >
          <div class="toast-glow-accent"></div>
          <div class="toast-content-wrapper">
            <div class="toast-icon-box">
              <Icon v-if="reviewToast.type === 'success'" name="lucide:check-circle-2" class="w-5 h-5 text-emerald relative z-1" />
              <Icon v-else name="lucide:alert-circle" class="w-5 h-5 text-rose-500 relative z-1" />
            </div>
            <div class="toast-text-group">
              <div class="toast-header-row">
                <span class="toast-tag">{{ reviewToast.title }}</span>
                <span class="toast-time">Baru saja</span>
              </div>
              <p class="toast-msg">{{ reviewToast.message }}</p>
            </div>
            <button type="button" class="toast-dismiss-btn" aria-label="Tutup" @click="reviewToast.show = false">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Lightbox Modal for Photo Proofs -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isProofLightboxOpen" class="proof-lightbox-backdrop" @click.self="closeProofLightbox">
          <div class="proof-lightbox-content">
            <button type="button" class="proof-lightbox-close" @click="closeProofLightbox" title="Tutup">
              <Icon name="lucide:x" class="w-5 h-5 text-white" />
            </button>
            <div class="proof-lightbox-image-wrap">
              <img
                :src="getImageUrl(activeProofPhotos[activeProofIndex])"
                alt="Foto Bukti Produk"
                class="proof-lightbox-img"
              />
            </div>
            <div v-if="activeProofPhotos.length > 1" class="proof-lightbox-nav">
              <button type="button" class="proof-nav-btn prev" @click="prevProofPhoto">
                <Icon name="lucide:chevron-left" class="w-6 h-6 text-white" />
              </button>
              <span class="proof-counter-pill">
                {{ activeProofIndex + 1 }} / {{ activeProofPhotos.length }}
              </span>
              <button type="button" class="proof-nav-btn next" @click="nextProofPhoto">
                <Icon name="lucide:chevron-right" class="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  path: '/products/:id/reviews',
  alias: ['/reviews/:id'],
})

const route = useRoute()
const router = useRouter()
const { fetchProductDetail, fetchProductReviews, submitProductReview, checkReviewEligibility, getImageUrl } = useApi()
const { formatRupiah } = useFormat()
const authStore = useAuthStore()

const productId = computed(() => String(route.params.id))

// Review Eligibility (Whether user has bought product and order has arrived/completed)
const eligibility = ref<{
  can_review?: boolean
  has_purchased?: boolean
  order_id?: number | string
  order_status?: string
  has_reviewed?: boolean
  reason?: string
  message?: string
} | null>(null)
const isLoadingEligibility = ref(false)

const loadEligibility = async () => {
  if (!authStore.isAuthenticated || !productId.value) {
    eligibility.value = null
    return
  }
  isLoadingEligibility.value = true
  try {
    const res = await checkReviewEligibility(productId.value)
    if (res) {
      eligibility.value = res
    }
  } catch (err) {
    console.error('Failed to load review eligibility:', err)
  } finally {
    isLoadingEligibility.value = false
  }
}

// Fetch product detail
const { data: detailData, pending: pendingDetail } = await useAsyncData(
  `product-review-detail-${productId.value}`,
  () => fetchProductDetail(productId.value)
)

// Fetch product reviews
const { data: reviewsData, pending: pendingReviews, refresh: refreshReviews } = await useAsyncData(
  `product-reviews-page-${productId.value}`,
  () => fetchProductReviews(productId.value)
)

const pending = computed(() => pendingDetail.value || pendingReviews.value)

const product = computed(() => {
  if (!detailData.value) return null
  return detailData.value.product || detailData.value
})

const allReviews = computed<any[]>(() => {
  if (!reviewsData.value) return []
  if (Array.isArray(reviewsData.value)) return reviewsData.value
  return reviewsData.value.reviews || []
})

// Dynamic calculation of average rating
const averageRating = computed(() => {
  if (allReviews.value.length === 0) {
    return product.value?.rating ? Number(product.value.rating) : 5.0
  }
  const sum = allReviews.value.reduce((acc, r) => acc + (Number(r.rating) || 5), 0)
  return sum / allReviews.value.length
})

// Extract photos from review item (photo or photos array)
const getReviewPhotos = (rev: any): string[] => {
  if (!rev) return []
  if (Array.isArray(rev.photos) && rev.photos.length > 0) {
    return rev.photos
  }
  if (rev.photo) {
    if (typeof rev.photo === 'string') {
      try {
        const parsed = JSON.parse(rev.photo)
        if (Array.isArray(parsed)) return parsed
      } catch {
        // regular string path
      }
      return [rev.photo]
    }
    if (Array.isArray(rev.photo)) return rev.photo
  }
  return []
}

// Counts for filter chips
const countWithPhotos = computed(() => {
  return allReviews.value.filter(r => getReviewPhotos(r).length > 0).length
})

const countWithReply = computed(() => {
  return allReviews.value.filter(r => Boolean(r.reply || (r.replies && r.replies.length))).length
})

const countByStar = (star: number) => {
  return allReviews.value.filter(r => Math.round(Number(r.rating) || 5) === star).length
}

// Filtering
const activeFilter = ref<'all' | 'with_photo' | 'with_reply' | '5' | '4' | '3' | '2' | '1'>('all')

const filteredReviews = computed(() => {
  if (activeFilter.value === 'all') return allReviews.value
  if (activeFilter.value === 'with_photo') {
    return allReviews.value.filter(r => getReviewPhotos(r).length > 0)
  }
  if (activeFilter.value === 'with_reply') {
    return allReviews.value.filter(r => Boolean(r.reply || (r.replies && r.replies.length)))
  }
  const targetStar = parseInt(activeFilter.value, 10)
  return allReviews.value.filter(r => Math.round(Number(r.rating) || 5) === targetStar)
})

// Shopee-style anonymized customer name
const getMaskedName = (name?: string): string => {
  if (!name) return 'Pengguna CyberStore'
  const trimmed = name.trim()
  if (trimmed.length <= 2) return trimmed
  const first = trimmed.charAt(0)
  const last = trimmed.charAt(trimmed.length - 1)
  return `${first}***${last}`
}

const getAvatarInitial = (name?: string): string => {
  if (!name) return 'U'
  return name.trim().charAt(0).toUpperCase()
}

// Interactive Review Form State
const isReviewModalOpen = ref(false)
const formRating = ref(5)
const hoverRating = ref(0)
const formComment = ref('')
const selectedPhotos = ref<Array<{ file: File; previewUrl: string }>>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadError = ref('')
const submitError = ref('')
const isSubmitting = ref(false)

// Validation Error and Toast State
const validationError = ref('')
const reviewToast = ref<{ show: boolean; type: 'success' | 'error'; title: string; message: string }>({
  show: false,
  type: 'success',
  title: '',
  message: '',
})
let toastTimer: any = null

const showToast = (type: 'success' | 'error', title: string, message: string) => {
  if (toastTimer) clearTimeout(toastTimer)
  reviewToast.value = {
    show: true,
    type,
    title,
    message,
  }
  toastTimer = setTimeout(() => {
    reviewToast.value.show = false
  }, 4500)
}

const getStarText = (star: number): string => {
  switch (star) {
    case 5: return 'Sangat Puas! (5/5)'
    case 4: return 'Puas (4/5)'
    case 3: return 'Cukup (3/5)'
    case 2: return 'Kurang Puas (2/5)'
    case 1: return 'Sangat Kecewa (1/5)'
    default: return 'Pilih Bintang'
  }
}

const openReviewModal = () => {
  if (!authStore.isAuthenticated) {
    // Redirect to login with return path
    router.push({
      path: '/auth/login',
      query: { redirect: `/products/${productId.value}/reviews` }
    })
    return
  }
  formRating.value = 5
  formComment.value = ''
  selectedPhotos.value = []
  uploadError.value = ''
  submitError.value = ''
  isReviewModalOpen.value = true
}

const closeReviewModal = () => {
  if (isSubmitting.value) return
  // Clean up object URLs
  selectedPhotos.value.forEach(item => URL.revokeObjectURL(item.previewUrl))
  selectedPhotos.value = []
  isReviewModalOpen.value = false
}

const triggerFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleFileChange = (e: Event) => {
  uploadError.value = ''
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const files = Array.from(target.files)
  const maxAllowed = 5 - selectedPhotos.value.length

  if (files.length > maxAllowed) {
    uploadError.value = `Anda hanya dapat menambahkan maksimal 5 foto bukti (tersisa slot ${maxAllowed}).`
  }

  const validFiles = files.slice(0, maxAllowed)

  for (const file of validFiles) {
    if (file.size > 2 * 1024 * 1024) {
      uploadError.value = `Ukuran file "${file.name}" melebihi batas 2MB.`
      continue
    }
    const previewUrl = URL.createObjectURL(file)
    selectedPhotos.value.push({ file, previewUrl })
  }

  // Reset input so same file can be re-selected if needed
  target.value = ''
}

const removePhoto = (index: number) => {
  const item = selectedPhotos.value[index]
  if (item) {
    URL.revokeObjectURL(item.previewUrl)
  }
  selectedPhotos.value.splice(index, 1)
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const handleSubmitReview = async () => {
  submitError.value = ''
  validationError.value = ''

  // Form Validations (Inline Feedback, NO Nested Modal)
  if (formRating.value === 0) {
    validationError.value = 'Silakan pilih bintang rating (1 sampai 5 bintang) terlebih dahulu.'
    return
  }

  const commentText = formComment.value.trim()
  if (!commentText) {
    validationError.value = 'Silakan tuliskan ulasan mengenai produk ini.'
    return
  }

  if (commentText.length < 5) {
    validationError.value = 'Ulasan terlalu singkat, tuliskan minimal 5 karakter.'
    return
  }

  isSubmitting.value = true
  try {
    const formData = new FormData()
    formData.append('rating', String(formRating.value))
    formData.append('comment', commentText)

    // Append photos
    if (selectedPhotos.value.length === 1) {
      formData.append('photo', selectedPhotos.value[0].file)
    } else if (selectedPhotos.value.length > 1) {
      selectedPhotos.value.forEach((item) => {
        formData.append('photos[]', item.file)
      })
    }

    // Include order_id if available from query or eligibility
    const targetOrderId = route.query.order_id || eligibility.value?.order_id
    if (targetOrderId) {
      formData.append('order_id', String(targetOrderId))
    }

    await submitProductReview(productId.value, formData)

    // 1. Langsung tutup modal review (tanpa modal di dalam modal)
    closeReviewModal()

    // 2. Segarkan data ulasan & eligibility
    await refreshReviews()
    await loadEligibility()

    // 3. Tampilkan toast validasi berhasil
    showToast(
      'success',
      'PENILAIAN BERHASIL',
      'Terima kasih! Ulasan dan bukti foto Anda telah berhasil dikirim dan dipublikasikan.'
    )

    // 4. Langsung mengarah ke halaman review (scroll mulus ke daftar ulasan)
    if (import.meta.client) {
      setTimeout(() => {
        const listEl = document.querySelector('.reviews-list-section')
        if (listEl) {
          listEl.scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    }
  } catch (err: any) {
    console.error('Failed to submit review:', err)
    submitError.value = err?.data?.message || 'Gagal mengirim penilaian. Pastikan pesanan Anda telah selesai dan coba lagi.'
    showToast(
      'error',
      'GAGAL MENGIRIM',
      submitError.value
    )
  } finally {
    isSubmitting.value = false
  }
}

// Lightbox for proof photos
const isProofLightboxOpen = ref(false)
const activeProofPhotos = ref<string[]>([])
const activeProofIndex = ref(0)

const openProofLightbox = (photos: string[], index: number) => {
  activeProofPhotos.value = photos
  activeProofIndex.value = index
  isProofLightboxOpen.value = true
}

const closeProofLightbox = () => {
  isProofLightboxOpen.value = false
}

const nextProofPhoto = () => {
  if (activeProofPhotos.value.length <= 1) return
  activeProofIndex.value = (activeProofIndex.value + 1) % activeProofPhotos.value.length
}

const prevProofPhoto = () => {
  if (activeProofPhotos.value.length <= 1) return
  activeProofIndex.value = (activeProofIndex.value - 1 + activeProofPhotos.value.length) % activeProofPhotos.value.length
}

const handleKeydown = (e: KeyboardEvent) => {
  if (isProofLightboxOpen.value) {
    if (e.key === 'Escape') closeProofLightbox()
    if (e.key === 'ArrowRight') nextProofPhoto()
    if (e.key === 'ArrowLeft') prevProofPhoto()
  }
  if (isReviewModalOpen.value && e.key === 'Escape') {
    closeReviewModal()
  }
}

onMounted(async () => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
    await loadEligibility()

    // Auto-open modal if user clicked 'Tulis Penilaian' with ?openModal=true
    if (route.query.openModal === 'true') {
      openReviewModal()
    }
  }
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

// Dynamic SEO tags for reviews page
useHead({
  title: computed(() => (product.value ? `Penilaian & Ulasan: ${product.value.name} | Cyber Store` : 'Penilaian Produk')),
})
</script>

<style scoped>
/* Page Layout */
.reviews-preview-page {
  padding-top: 1.5rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.review-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
}

.back-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #003399;
  transition: all 0.2s ease;
}

.back-link:hover {
  color: #004aad;
  transform: translateX(-2px);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.breadcrumb a:hover {
  color: #003399;
}

.breadcrumb .current {
  color: #0f172a;
  font-weight: 700;
}

/* Loading & Not Found */
.loading-box,
.not-found-box {
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 1.5rem;
  gap: 1rem;
}

/* Reviews Main Layout */
.reviews-main-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Product Summary Card */
.product-summary-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
  background: #ffffff;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 280px;
}

.summary-thumb {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-category {
  font-size: 0.75rem;
  font-weight: 700;
  color: #004aad;
  text-transform: uppercase;
}

.summary-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
}

.summary-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
}

.summary-price {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 800;
  color: #003399;
}

.summary-strike {
  font-size: 0.825rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-write-review {
  padding: 0.65rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.25);
}

.btn-detail-link {
  padding: 0.65rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1.5px solid #cbd5e1;
  color: #334155;
  border-radius: 8px;
  background: #ffffff;
}

.btn-login-to-review {
  padding: 0.65rem 1.15rem;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1.5px solid #003399;
  color: #003399;
  background: #ffffff;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
}

.btn-login-to-review:hover {
  background: #eff6ff;
}

.already-reviewed-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1rem;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 700;
  color: #166534;
}

.transit-status-box {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #1e40af;
}

.verified-buyer-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 0.95rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

/* Shopee Rating Card */
.shopee-rating-card {
  padding: 1.75rem;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 2rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
}

.rating-overview-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-right: 1.5rem;
  border-right: 1px solid #f1f5f9;
}

.score-large-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
}

.score-number {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  color: #003399;
  line-height: 1;
}

.score-max {
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 700;
}

/* Star Icons (Shopee Solid Amber Style) */
.star-svg {
  fill: #e2e8f0;
  stroke: #cbd5e1;
  stroke-width: 0.5px;
  stroke-linejoin: round;
  transition: all 0.15s ease;
  display: inline-block;
  vertical-align: middle;
}

.star-svg.star-large {
  width: 22px;
  height: 22px;
}

.star-svg.star-sm {
  width: 14px;
  height: 14px;
}

.star-svg.star-picker {
  width: 32px;
  height: 32px;
}

.star-svg.active,
.star-picker-btn.active .star-svg {
  fill: #f59e0b !important;
  stroke: #d97706 !important;
  filter: drop-shadow(0 1px 3px rgba(245, 158, 11, 0.35));
}

.stars-large {
  display: flex;
  gap: 0.25rem;
  margin: 0.5rem 0 0.4rem;
}

.total-reviews-label {
  font-size: 0.825rem;
  color: var(--text-muted);
  font-weight: 600;
}

/* Filter Chips (Shopee Style) */
.filter-chips-col {
  display: flex;
  align-items: center;
}

.filter-chips-track {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.filter-chip {
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.825rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.filter-chip:hover {
  border-color: #003399;
  color: #003399;
  background: #eff6ff;
}

.filter-chip.active {
  border-color: #003399;
  background: #003399;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.25);
}

/* Reviews List Section */
.reviews-list-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-reviews-box {
  padding: 3rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.empty-reviews-box h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
}

.empty-reviews-box p {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.review-cards-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  padding: 1.5rem;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rev-item-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.reviewer-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.18);
}

.rev-user-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.reviewer-name {
  font-size: 0.925rem;
  font-weight: 700;
  color: #0f172a;
}

.rev-stars {
  display: flex;
  gap: 0.15rem;
  color: #cbd5e1;
}

.rev-stars .star.active {
  color: #fbbf24;
}

.rev-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.rev-comment-text {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #334155;
  white-space: pre-line;
  word-break: break-word;
}

/* Review Photo Proofs */
.rev-photos-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.25rem;
}

.rev-photos-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #059669;
  display: flex;
  align-items: center;
}

.rev-photos-grid {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.rev-photo-thumb-btn {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #cbd5e1;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.rev-photo-thumb-btn:hover {
  border-color: #003399;
  transform: scale(1.04);
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
}

.rev-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-zoom-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 51, 153, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.rev-photo-thumb-btn:hover .photo-zoom-overlay {
  opacity: 1;
}

/* Admin Reply */
.rev-admin-reply {
  padding: 0.85rem 1.15rem;
  background: #eff6ff;
  border-left: 3.5px solid #003399;
  border-radius: 4px;
  margin-top: 0.25rem;
}

.reply-badge {
  font-size: 0.775rem;
  font-weight: 800;
  color: #003399;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
}

.reply-text {
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.5;
}

/* Review Modal Form */
.review-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}

.review-modal-card {
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.review-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header-title {
  display: flex;
  align-items: center;
}

.modal-header-title h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #ef4444;
  color: #ffffff;
  transform: rotate(90deg);
}

.review-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.modal-product-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.modal-product-thumb {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}

.modal-product-text {
  display: flex;
  flex-direction: column;
}

.modal-product-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.3;
}

.modal-product-price {
  font-size: 0.8rem;
  font-weight: 800;
  color: #003399;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: #334155;
}

/* Star Picker */
.interactive-star-picker {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.star-picker-btn {
  padding: 4px;
  cursor: pointer;
  transition: transform 0.15s ease;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-picker-btn:hover {
  transform: scale(1.2);
}

.star-picker-btn :deep(svg) {
  width: 30px;
  height: 30px;
  fill: #f1f5f9;
  stroke: #cbd5e1;
  color: #cbd5e1;
  transition: all 0.15s ease;
}

.star-picker-btn.active :deep(svg) {
  fill: #f59e0b !important;
  stroke: #f59e0b !important;
  color: #f59e0b !important;
  filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.4));
}

.star-rating-hint {
  margin-left: 0.5rem;
  font-size: 0.825rem;
  font-weight: 700;
  color: #004aad;
}

.form-textarea {
  width: 100%;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  padding: 0.75rem;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  background: #ffffff;
  color: #0f172a;
}

.form-textarea:focus {
  border-color: #003399;
  box-shadow: 0 0 0 3px rgba(0, 51, 153, 0.12);
}

.textarea-counter {
  text-align: right;
  font-size: 0.725rem;
  color: var(--text-muted);
}

/* Upload Dropzone */
.upload-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-limit-tag {
  font-size: 0.725rem;
  color: var(--text-muted);
  font-weight: 600;
}

.upload-helper {
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
  margin-bottom: 0.35rem;
}

.upload-dropzone {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 1.25rem 1rem;
  background: #f8fafc;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s ease;
}

.upload-dropzone:hover {
  border-color: #003399;
  background: #eff6ff;
}

.hidden-file-input {
  display: none;
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

.dropzone-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.08);
}

.dropzone-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #003399;
}

.dropzone-sub {
  font-size: 0.725rem;
  color: var(--text-muted);
}

.preview-photos-grid {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.preview-photo-box {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  border: 1.5px solid #cbd5e1;
}

.preview-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.remove-photo-btn:hover {
  background: #ef4444;
  transform: scale(1.15);
}

.photo-size-badge {
  position: absolute;
  bottom: 2px;
  left: 2px;
  right: 2px;
  font-size: 9px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  text-align: center;
  border-radius: 3px;
  padding: 1px 0;
}

.upload-error-msg {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.35rem;
}

.submit-error-box {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #b91c1c;
}

.modal-footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.btn-submit-review {
  padding: 0.6rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 700;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
}

/* --------------------------------------------------------------------------
   FLOATING VALIDATION TOAST NOTIFICATION & INLINE ERROR SHAKE
   -------------------------------------------------------------------------- */
.animate-shake {
  animation: shake 0.35s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.review-toast-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100000;
  min-width: 320px;
  max-width: 440px;
  background: #ffffff;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.16);
  overflow: hidden;
}

.review-toast-notification.toast-success {
  border-color: #10b981;
}

.review-toast-notification.toast-error {
  border-color: #ef4444;
}

.toast-glow-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5px;
}

.toast-success .toast-glow-accent {
  background: linear-gradient(90deg, #10b981, #059669);
}

.toast-error .toast-glow-accent {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.toast-content-wrapper {
  padding: 1rem 1.15rem;
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  position: relative;
}

.toast-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-success .toast-icon-box {
  background: #ecfdf5;
}

.toast-error .toast-icon-box {
  background: #fef2f2;
}

.toast-text-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.toast-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.toast-tag {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.toast-success .toast-tag {
  color: #059669;
}

.toast-error .toast-tag {
  color: #dc2626;
}

.toast-time {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.toast-msg {
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.45;
  margin: 0;
}

.toast-dismiss-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}

.toast-dismiss-btn:hover {
  color: #0f172a;
}

/* Toast Transition */
.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-pop-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.toast-pop-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

/* Proof Lightbox */
.proof-lightbox-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100000;
  background: rgba(4, 7, 15, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.proof-lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.proof-lightbox-close {
  position: absolute;
  top: -2.5rem;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.proof-lightbox-close:hover {
  background: #ef4444;
}

.proof-lightbox-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 80vh;
}

.proof-lightbox-img {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
}

.proof-lightbox-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.proof-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.proof-nav-btn:hover {
  background: var(--ubsi-blue);
}

.proof-counter-pill {
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  padding: 3px 12px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 12px;
}

/* Responsive */
@media (max-width: 991px) {
  .shopee-rating-card {
    grid-template-columns: 200px 1fr;
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .shopee-rating-card {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .rating-overview-col {
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1.25rem;
  }

  .summary-actions {
    width: 100%;
  }

  .btn-write-review,
  .btn-detail-link {
    flex: 1;
    text-align: center;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .reviews-preview-page {
    padding-top: 1rem;
    padding-bottom: 4rem;
    gap: 1rem;
  }

  .product-summary-card {
    padding: 1rem;
  }

  .summary-thumb {
    width: 60px;
    height: 60px;
  }

  .summary-title {
    font-size: 1rem;
  }

  .summary-price {
    font-size: 1.05rem;
  }

  .shopee-rating-card {
    padding: 1.25rem 1rem;
  }

  .score-number {
    font-size: 2.5rem;
  }

  .filter-chips-track {
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
    padding-bottom: 4px;
  }

  .filter-chips-track::-webkit-scrollbar {
    display: none;
  }

  .filter-chip {
    flex-shrink: 0;
    font-size: 0.775rem;
    padding: 0.4rem 0.8rem;
  }

  .review-item {
    padding: 1.15rem 1rem;
  }

  .review-modal-card {
    max-height: 94vh;
  }

  .review-modal-body {
    padding: 1rem;
  }
}
</style>
