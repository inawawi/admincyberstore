<template>
  <div class="announcements-page">
    <!-- Hero Banner -->
    <section class="announcements-hero">
      <div class="container hero-container">
        <div class="hero-badge">
          <Icon name="lucide:megaphone" class="w-4 h-4" />
          <span>Pusat Informasi Resmi BSI Cyber Store</span>
        </div>
        <h1 class="hero-title">Pengumuman & Informasi</h1>
        <p class="hero-subtitle">
          Dapatkan pembaruan terkini seputar perlengkapan Ormik & Semot PMB, panduan mahasiswa baru, dan informasi penting resmi kampus.
        </p>

        <!-- Search Bar -->
        <div class="hero-search-box">
          <Icon name="lucide:search" class="search-icon w-5 h-5" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari pengumuman, ormik, semot, panduan kampus..."
            class="hero-search-input"
            @input="handleSearchInput"
          />
          <button v-if="searchQuery" type="button" class="search-clear-btn" @click="clearSearch" aria-label="Hapus pencarian">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- Main Content Area -->
    <main class="container announcements-main">
      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="filter-pills">
          <button
            v-for="tab in categoryTabs"
            :key="tab.id"
            type="button"
            class="filter-pill-btn"
            :class="{ 'is-active': activeType === tab.id }"
            @click="selectCategory(tab.id)"
          >
            <Icon :name="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
            <span v-if="getCategoryCount(tab.id) > 0" class="pill-count">
              {{ getCategoryCount(tab.id) }}
            </span>
          </button>
        </div>

        <div class="announcement-total-info">
          <span>Menampilkan <strong>{{ filteredAnnouncements.length }}</strong> pengumuman</span>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner-cyber"></div>
        <p>Memuat daftar pengumuman...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredAnnouncements.length === 0" class="empty-state cyber-card">
        <div class="empty-icon-circle">
          <Icon name="lucide:file-question" class="w-10 h-10 text-muted" />
        </div>
        <h3>Tidak Ada Pengumuman</h3>
        <p v-if="searchQuery">
          Tidak ditemukan pengumuman yang sesuai dengan kata kunci "<strong>{{ searchQuery }}</strong>".
        </p>
        <p v-else>
          Belum ada pengumuman baru untuk kategori ini saat ini.
        </p>
        <button v-if="searchQuery || activeType !== 'all'" type="button" class="btn-reset-filter" @click="resetFilters">
          <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
          <span>Tampilkan Semua Pengumuman</span>
        </button>
      </div>

      <!-- Announcement Cards Grid -->
      <div v-else class="announcement-grid">
        <article
          v-for="item in filteredAnnouncements"
          :key="item.id"
          class="announcement-card cyber-card"
          :class="{ 'is-highlighted': selectedAnnouncement?.id === item.id }"
          @click="openDetailModal(item)"
        >
          <div class="card-header">
            <div class="card-icon-box" :class="`icon-${getTypeKey(item)}`">
              <Icon :name="getTypeIcon(item)" class="w-5 h-5" />
            </div>
            <div class="card-meta">
              <span class="card-badge" :class="`badge-${getTypeKey(item)}`">
                {{ getTypeLabel(item) }}
              </span>
              <span class="card-date" :title="formatFullDate(item.created_at)">
                <Icon name="lucide:clock" class="w-3.5 h-3.5 inline-block mr-1 opacity-70" />
                {{ formatRelativeTime(item.created_at) }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <h2 class="card-title">{{ item.title }}</h2>
            <p class="card-excerpt">{{ getExcerpt(item.content) }}</p>
          </div>

          <div class="card-footer">
            <button type="button" class="btn-read-more" @click.stop="openDetailModal(item)">
              <span>Baca Selengkapnya</span>
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </button>
            <a
              v-if="item.action_url"
              :href="item.action_url"
              class="btn-card-action"
              target="_blank"
              rel="noopener noreferrer"
              @click.stop
            >
              <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
              <span>Buka Tautan</span>
            </a>
          </div>
        </article>
      </div>
    </main>

    <!-- Detail Announcement Modal -->
    <Teleport to="body">
      <Transition name="fade-modal">
        <div v-if="isModalOpen && selectedAnnouncement" class="modal-backdrop" @click="closeDetailModal">
          <div class="modal-dialog cyber-card" @click.stop role="dialog" aria-modal="true">
            <div class="modal-header">
              <div class="modal-header-badge-row">
                <span class="card-badge" :class="`badge-${getTypeKey(selectedAnnouncement)}`">
                  {{ getTypeLabel(selectedAnnouncement) }}
                </span>
                <span class="modal-date">
                  <Icon name="lucide:calendar" class="w-4 h-4 inline-block mr-1 text-bsi" />
                  {{ formatFullDate(selectedAnnouncement.created_at) }}
                </span>
              </div>
              <button type="button" class="modal-close-btn" @click="closeDetailModal" aria-label="Tutup Pengumuman">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <div class="modal-body">
              <h2 class="modal-title">{{ selectedAnnouncement.title }}</h2>
              <div class="modal-divider"></div>
              <div class="modal-content-text" v-html="formatContentHtml(selectedAnnouncement.content)"></div>
            </div>

            <div class="modal-footer">
              <div class="modal-footer-left">
                <button type="button" class="btn-copy-link" @click="copyAnnouncementLink(selectedAnnouncement)">
                  <Icon :name="isCopied ? 'lucide:check' : 'lucide:share-2'" class="w-4 h-4" />
                  <span>{{ isCopied ? 'Tautan Disalin!' : 'Bagikan Info' }}</span>
                </button>
              </div>

              <div class="modal-footer-right">
                <a
                  v-if="selectedAnnouncement.action_url"
                  :href="selectedAnnouncement.action_url"
                  class="btn-primary-action"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="lucide:external-link" class="w-4 h-4" />
                  <span>Kunjungi Halaman</span>
                </a>
                <button type="button" class="btn-close-dialog" @click="closeDetailModal">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

useHead({
  title: 'Pengumuman & Informasi Resmi - UBSI Cyber Store',
  meta: [
    {
      name: 'description',
      content: 'Pusat informasi resmi pengumuman kampus UBSI, perlengkapan Ormik & Semot PMB, panduan mahasiswa baru, dan promo toko merchandise resmi.',
    },
  ],
})

interface AnnouncementItem {
  id: number | string
  title: string
  content: string
  type: string
  action_url?: string | null
  created_at: string
  updated_at?: string
}

const route = useRoute()
const router = useRouter()
const { fetchAnnouncements } = useApi()
const toast = useToast()

const announcements = ref<AnnouncementItem[]>([])
const isLoading = ref<boolean>(true)
const searchQuery = ref<string>('')
const activeType = ref<string>('all')
const selectedAnnouncement = ref<AnnouncementItem | null>(null)
const isModalOpen = ref<boolean>(false)
const isCopied = ref<boolean>(false)

const categoryTabs = [
  { id: 'all', label: 'Semua Pengumuman', icon: 'lucide:layers' },
  { id: 'ormik', label: 'Ormik & Semot Maba', icon: 'lucide:graduation-cap' },
  { id: 'academic', label: 'Akademik & Kampus', icon: 'lucide:book-open' },
  { id: 'info', label: 'Informasi Umum', icon: 'lucide:info' },
]

const loadAnnouncementsData = async () => {
  isLoading.value = true
  try {
    const res: any = await fetchAnnouncements({ per_page: 50 })
    const list = res?.announcements || res?.data || []
    announcements.value = Array.isArray(list) ? list : []
    
    // Cek jika ada query param ?id=... untuk langsung membuka modal
    checkUrlParamForModal()
  } catch (err) {
    console.error('Gagal mengambil data pengumuman:', err)
  } finally {
    isLoading.value = false
  }
}

const checkUrlParamForModal = () => {
  const targetId = route.query.id
  if (targetId && announcements.value.length > 0) {
    const found = announcements.value.find((a) => String(a.id) === String(targetId))
    if (found) {
      openDetailModal(found, false)
    }
  }
}

watch(
  () => route.query.id,
  (newId) => {
    if (newId && announcements.value.length > 0) {
      const found = announcements.value.find((a) => String(a.id) === String(newId))
      if (found) {
        openDetailModal(found, false)
      }
    } else if (!newId) {
      isModalOpen.value = false
    }
  }
)

onMounted(() => {
  loadAnnouncementsData()
})

const handleSearchInput = () => {
  // Handled reactively through computed
}

const clearSearch = () => {
  searchQuery.value = ''
}

const selectCategory = (typeId: string) => {
  activeType.value = typeId
}

const resetFilters = () => {
  searchQuery.value = ''
  activeType.value = 'all'
}

const getTypeKey = (item: AnnouncementItem): string => {
  const text = `${item.type || ''} ${item.title || ''} ${item.content || ''}`.toLowerCase()
  if (text.includes('ormik') || text.includes('semot') || text.includes('maba') || text.includes('mahasiswa baru')) return 'ormik'
  if (text.includes('akademik') || text.includes('kuliah') || text.includes('jadwal') || text.includes('kampus')) return 'academic'
  if (text.includes('penting') || text.includes('peringatan') || text.includes('perhatian')) return 'important'
  return 'info'
}

const getTypeLabel = (item: AnnouncementItem): string => {
  const key = getTypeKey(item)
  switch (key) {
    case 'ormik':
      return 'Ormik & Semot Maba'
    case 'academic':
      return 'Akademik & Kampus'
    case 'important':
      return 'Penting'
    case 'info':
    default:
      return 'Pengumuman Resmi'
  }
}

const getTypeIcon = (item: AnnouncementItem): string => {
  const key = getTypeKey(item)
  switch (key) {
    case 'ormik':
      return 'lucide:graduation-cap'
    case 'academic':
      return 'lucide:book-open'
    case 'important':
      return 'lucide:alert-circle'
    case 'info':
    default:
      return 'lucide:megaphone'
  }
}

const filteredAnnouncements = computed(() => {
  return announcements.value.filter((item) => {
    // Category filter
    if (activeType.value !== 'all') {
      const key = getTypeKey(item)
      if (activeType.value === 'ormik' && key !== 'ormik') return false
      if (activeType.value === 'academic' && key !== 'academic') return false
      if (activeType.value === 'info' && key !== 'info' && key !== 'important') return false
    }

    // Search query filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const titleMatch = (item.title || '').toLowerCase().includes(q)
      const contentMatch = (item.content || '').toLowerCase().includes(q)
      if (!titleMatch && !contentMatch) return false
    }

    return true
  })
})

const getCategoryCount = (typeId: string): number => {
  if (typeId === 'all') return announcements.value.length
  return announcements.value.filter((item) => {
    const key = getTypeKey(item)
    if (typeId === 'ormik') return key === 'ormik'
    if (typeId === 'academic') return key === 'academic'
    if (typeId === 'info') return key === 'info' || key === 'important'
    return false
  }).length
}

const getExcerpt = (text?: string): string => {
  if (!text) return ''
  const clean = text.replace(/<[^>]+>/g, '').trim()
  if (clean.length <= 150) return clean
  return `${clean.substring(0, 150)}...`
}

const formatContentHtml = (text?: string): string => {
  if (!text) return ''
  // Convert newlines to paragraphs/breaks if plain text
  if (!text.includes('<p>') && !text.includes('<div>')) {
    return text
      .split('\n\n')
      .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')
  }
  return text
}

const formatRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return 'Baru saja'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Baru saja'

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`
  if (diffHours < 24) return `${diffHours} jam lalu`
  if (diffDays === 1) return 'Kemarin'
  if (diffDays < 7) return `${diffDays} hari lalu`

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatFullDate = (dateStr?: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB'
}

const openDetailModal = (item: AnnouncementItem, updateUrl = true) => {
  selectedAnnouncement.value = item
  isModalOpen.value = true
  if (updateUrl) {
    router.replace({ query: { ...route.query, id: String(item.id) } })
  }
}

const closeDetailModal = () => {
  isModalOpen.value = false
  const newQuery = { ...route.query }
  delete newQuery.id
  router.replace({ query: newQuery })
}

const copyAnnouncementLink = async (item: AnnouncementItem) => {
  if (import.meta.client) {
    const url = `${window.location.origin}/announcements?id=${item.id}`
    try {
      await navigator.clipboard.writeText(url)
      isCopied.value = true
      toast.success('Tautan pengumuman berhasil disalin ke clipboard!', {
        title: 'Tautan Disalin',
        duration: 3000,
      })
      setTimeout(() => {
        isCopied.value = false
      }, 3000)
    } catch {
      toast.info(`Tautan: ${url}`)
    }
  }
}
</script>

<style scoped>
/* ══════════════════════════════════════════════
   HERO BANNER
══════════════════════════════════════════════ */
.announcements-page {
  min-height: 80vh;
  background: #f8fafc;
  padding-bottom: 4rem;
}

.announcements-hero {
  background: linear-gradient(135deg, #001f54 0%, #003399 50%, #004aad 100%);
  color: #ffffff;
  padding: 3.5rem 1.5rem 4rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 51, 153, 0.15);
}

.announcements-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -20%;
  width: 140%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 60%);
  pointer-events: none;
}

.hero-container {
  max-width: 860px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 0.35rem 1rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #e0f2fe;
  margin-bottom: 1.2rem;
  letter-spacing: 0.02em;
}

.hero-title {
  font-size: 2.3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.8rem;
  color: #ffffff;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: #cbd5e1;
  max-width: 680px;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.hero-search-box {
  width: 100%;
  max-width: 600px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1.2rem;
  color: #64748b;
  pointer-events: none;
}

.hero-search-input {
  width: 100%;
  padding: 0.95rem 3rem 0.95rem 3.2rem;
  border-radius: 999px;
  border: 2px solid transparent;
  background: #ffffff;
  color: #0f172a;
  font-size: 0.92rem;
  font-family: inherit;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  transition: all 0.2s ease;
}

.hero-search-input:focus {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 8px 28px rgba(56, 189, 248, 0.3);
}

.search-clear-btn {
  position: absolute;
  right: 1.2rem;
  background: #e2e8f0;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.search-clear-btn:hover {
  background: #cbd5e1;
  color: #0f172a;
}

/* ══════════════════════════════════════════════
   MAIN CONTENT & FILTERS
══════════════════════════════════════════════ */
.announcements-main {
  max-width: 1120px;
  margin: -1.8rem auto 0;
  padding: 0 1.2rem;
  position: relative;
  z-index: 3;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.3rem 0;
  scrollbar-width: none;
}

.filter-pills::-webkit-scrollbar { display: none; }

.filter-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  font-family: inherit;
}

.filter-pill-btn:hover {
  border-color: #cbd5e1;
  color: #0f172a;
  background: #f8fafc;
}

.filter-pill-btn.is-active {
  background: #003399;
  color: #ffffff;
  border-color: #002266;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

.pill-count {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
}

.filter-pill-btn.is-active .pill-count {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.announcement-total-info {
  font-size: 0.85rem;
  color: #64748b;
}

/* ══════════════════════════════════════════════
   ANNOUNCEMENT GRID & CARDS
══════════════════════════════════════════════ */
.announcement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 1.5rem;
}

.announcement-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.announcement-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0, 74, 173, 0.3);
  box-shadow: 0 12px 28px rgba(0, 74, 173, 0.1);
}

.announcement-card.is-highlighted {
  border-color: #004aad;
  box-shadow: 0 0 0 2px #004aad, 0 12px 28px rgba(0, 74, 173, 0.15);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  margin-bottom: 1.1rem;
}

.card-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-ormik {
  background: #fdf4ff;
  color: #c026d3;
  border: 1px solid rgba(192, 38, 211, 0.2);
}

.icon-academic {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid rgba(22, 163, 74, 0.2);
}

.icon-important {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid rgba(217, 119, 6, 0.2);
}

.icon-info {
  background: #eff6ff;
  color: #004aad;
  border: 1px solid rgba(0, 74, 173, 0.2);
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-badge {
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  display: inline-block;
  align-self: flex-start;
}

.badge-ormik { background: #fae8ff; color: #86198f; }
.badge-academic { background: #dcfce7; color: #15803d; }
.badge-important { background: #fef3c7; color: #92400e; }
.badge-info { background: #dbeafe; color: #1e40af; }

.card-date {
  font-size: 0.72rem;
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.card-body {
  flex: 1;
  margin-bottom: 1.3rem;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.4;
  margin-bottom: 0.6rem;
  transition: color 0.2s;
}

.announcement-card:hover .card-title {
  color: #003399;
}

.card-excerpt {
  font-size: 0.83rem;
  color: #64748b;
  line-height: 1.6;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.btn-read-more {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: none;
  border: none;
  font-size: 0.82rem;
  font-weight: 700;
  color: #004aad;
  cursor: pointer;
  padding: 0;
  transition: gap 0.2s ease, color 0.2s ease;
  font-family: inherit;
}

.btn-read-more:hover {
  color: #002266;
  gap: 0.6rem;
}

.btn-card-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #475569;
  background: #f1f5f9;
  padding: 0.3rem 0.65rem;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-card-action:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* ══════════════════════════════════════════════
   LOADING & EMPTY STATES
══════════════════════════════════════════════ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
  color: #64748b;
  font-size: 0.9rem;
}

.spinner-cyber {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 74, 173, 0.15);
  border-top-color: #004aad;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 3.5rem 1.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.empty-icon-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f0f7ff;
  border: 2px dashed rgba(0, 74, 173, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.empty-state h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.empty-state p {
  font-size: 0.86rem;
  color: #64748b;
  max-width: 420px;
  line-height: 1.6;
  margin: 0;
}

.btn-reset-filter {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #eff6ff;
  border: 1px solid rgba(0, 74, 173, 0.2);
  color: #004aad;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-reset-filter:hover {
  background: #dbeafe;
  color: #003399;
}

/* ══════════════════════════════════════════════
   MODAL READER
══════════════════════════════════════════════ */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-dialog {
  background: #ffffff;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 74, 173, 0.15);
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: #f8fafc;
}

.modal-header-badge-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.modal-date {
  font-size: 0.78rem;
  color: #64748b;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.modal-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.35;
  margin-bottom: 1rem;
}

.modal-divider {
  height: 1px;
  background: #e2e8f0;
  margin-bottom: 1.2rem;
}

.modal-content-text {
  font-size: 0.92rem;
  color: #334155;
  line-height: 1.7;
}

.modal-content-text :deep(p) {
  margin-bottom: 1rem;
}

.modal-content-text :deep(ul),
.modal-content-text :deep(ol) {
  padding-left: 1.4rem;
  margin-bottom: 1rem;
}

.modal-content-text :deep(li) {
  margin-bottom: 0.4rem;
}

.modal-content-text :deep(a) {
  color: #004aad;
  text-decoration: underline;
  font-weight: 600;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-copy-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-copy-link:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #94a3b8;
}

.modal-footer-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-primary-action {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #003399;
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s;
}

.btn-primary-action:hover {
  background: #002266;
}

.btn-close-dialog {
  background: #e2e8f0;
  border: none;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.5rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-family: inherit;
}

.btn-close-dialog:hover {
  background: #cbd5e1;
  color: #0f172a;
}

/* Modal Transition */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.2s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .hero-title {
    font-size: 1.8rem;
  }
  .announcements-hero {
    padding: 2.5rem 1rem 3.5rem;
  }
  .announcements-main {
    margin-top: -1.5rem;
    padding: 0 0.8rem;
  }
  .announcement-grid {
    grid-template-columns: 1fr;
  }
  .modal-dialog {
    max-height: 90vh;
  }
  .modal-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .modal-footer-left,
  .modal-footer-right {
    width: 100%;
    justify-content: stretch;
  }
  .modal-footer-right button,
  .modal-footer-right a,
  .btn-copy-link {
    flex: 1;
    justify-content: center;
    text-align: center;
  }
}
</style>
