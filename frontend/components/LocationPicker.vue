<template>
  <div class="location-picker-container">
    <!-- Header Controls: Current Location & Search -->
    <div class="picker-top-bar">
      <!-- Button: Gunakan Lokasi Saat Ini (GPS) -->
      <button
        type="button"
        @click="detectCurrentLocation"
        :disabled="isLocating"
        class="btn-gps"
        title="Dapatkan koordinat GPS perangkat Anda saat ini"
      >
        <span v-if="isLocating" class="btn-spinner">
          <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span>Mendeteksi Lokasi GPS...</span>
        </span>
        <span v-else class="btn-gps-inner">
          <Icon name="lucide:crosshair" class="w-4 h-4 text-emerald" />
          <strong>Gunakan Lokasi Saat Ini (GPS)</strong>
        </span>
      </button>

      <!-- Google Maps External Link -->
      <a
        v-if="currentLat && currentLng"
        :href="`https://www.google.com/maps?q=${currentLat},${currentLng}`"
        target="_blank"
        rel="noopener noreferrer"
        class="btn-gmaps-link"
        title="Buka titik koordinat di Google Maps"
      >
        <Icon name="lucide:map-pin" class="w-4 h-4 text-red" />
        <span>Lihat di Google Maps</span>
        <Icon name="lucide:external-link" class="w-3.5 h-3.5 ml-0.5" />
      </a>
    </div>

    <!-- Search Place Input with Suggestions -->
    <div ref="searchWrapperRef" class="search-location-wrapper">
      <div class="search-input-box">
        <Icon name="lucide:search" class="search-icon w-4 h-4 text-muted" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Ketik nama jalan, komplek, kelurahan, atau kota..."
          class="location-search-input"
          @keydown.enter.prevent="handleSearchPlace"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="clearSearch"
          class="clear-btn"
          aria-label="Hapus Pencarian"
        >
          <Icon name="lucide:x" class="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          @click="handleSearchPlace"
          :disabled="isSearching || !searchQuery.trim()"
          class="btn-search-go"
        >
          <span>{{ isSearching ? 'Mencari...' : 'Cari' }}</span>
        </button>
      </div>

      <!-- Suggestions Dropdown -->
      <ul v-if="suggestions.length > 0" class="suggestions-dropdown">
        <li
          v-for="(item, idx) in suggestions"
          :key="idx"
          @click="selectSuggestion(item)"
          class="suggestion-item"
        >
          <span class="suggestion-pin">
            <Icon name="lucide:map-pin" class="w-4 h-4 text-bsi" />
          </span>
          <div class="suggestion-text">
            <strong class="suggestion-title">{{ item.name || item.display_name.split(',')[0] }}</strong>
            <span class="suggestion-sub">{{ item.display_name }}</span>
          </div>
        </li>
      </ul>
    </div>

    <!-- Map Canvas Container -->
    <div class="map-viewport-wrapper">
      <div ref="mapContainerRef" class="map-canvas"></div>

      <!-- Center Crosshair Marker Overlay for Precision Pinning -->
      <div class="map-instructions-badge inline-flex items-center gap-1">
        <Icon name="lucide:info" class="w-3.5 h-3.5 text-bsi shrink-0" />
        <span>Geser peta atau klik langsung pada peta untuk memposisikan titik rumah / alamat Anda</span>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isGeocoding" class="geocoding-spinner-overlay">
        <div class="spinner-pill">
          <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-bsi" />
          <span>Mengambil nama jalan & detail wilayah...</span>
        </div>
      </div>
    </div>

    <!-- Coordinate Status Bar -->
    <div class="coordinates-status-bar">
      <div class="coord-item">
        <span class="coord-label">Latitude:</span>
        <span class="coord-val">{{ currentLat ? Number(currentLat).toFixed(6) : '-' }}</span>
      </div>
      <div class="coord-item">
        <span class="coord-label">Longitude:</span>
        <span class="coord-val">{{ currentLng ? Number(currentLng).toFixed(6) : '-' }}</span>
      </div>
      <div class="coord-badge" :class="{ 'badge-active': currentLat && currentLng }">
        <span class="dot"></span>
        <span>{{ currentLat && currentLng ? 'Titik Presisi Terkunci' : 'Belum Dititik' }}</span>
      </div>
    </div>

    <!-- Alert / Toast Notice -->
    <div v-if="statusNotice" :class="['notice-box', `notice-${noticeType}`]">
      <span>{{ statusNotice }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  initialLat?: number | string | null
  initialLng?: number | string | null
}>()

const emit = defineEmits<{
  (e: 'update:location', data: {
    latitude: number
    longitude: number
    address?: string
    city?: string
    province?: string
    postal_code?: string
    district?: string
  }): void
}>()

const mapContainerRef = ref<HTMLDivElement | null>(null)
let mapInstance: any = null
let markerInstance: any = null
let L: any = null

// Coordinates State (Default: Jakarta Pusat / UBSI)
const currentLat = ref<number>(props.initialLat ? Number(props.initialLat) : -6.2088)
const currentLng = ref<number>(props.initialLng ? Number(props.initialLng) : 106.8456)

const isLocating = ref(false)
const isSearching = ref(false)
const isGeocoding = ref(false)
const searchQuery = ref('')
const suggestions = ref<any[]>([])

const clearSearch = () => {
  searchQuery.value = ''
  suggestions.value = []
}

const statusNotice = ref('')
const noticeType = ref<'info' | 'success' | 'warning'>('info')
let noticeTimer: any = null

const showNotice = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
  statusNotice.value = msg
  noticeType.value = type
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => {
    statusNotice.value = ''
  }, 4000)
}

// Inisialisasi Peta Leaflet
const initMap = async () => {
  if (!import.meta.client || !mapContainerRef.value) return

  try {
    L = await import('leaflet')

    // Fix path default marker bawaan Leaflet yang sering 404 di Nuxt
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const initialPos = [currentLat.value, currentLng.value] as [number, number]

    mapInstance = L.map(mapContainerRef.value, {
      center: initialPos,
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    // Tile Layer: OpenStreetMap Standard yang jernih dan cepat
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors | Google Maps Pinning',
    }).addTo(mapInstance)

    // Custom Glowing HTML Pin Icon
    const customIcon = L.divIcon({
      className: 'cyber-leaflet-marker',
      html: `
        <div class="custom-marker-pin">
          <div class="pin-pulse"></div>
          <div class="pin-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#004aad" stroke="#ffffff" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
            </svg>
          </div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 38],
    })

    // Pasang Draggable Marker
    markerInstance = L.marker(initialPos, {
      draggable: true,
      icon: customIcon,
    }).addTo(mapInstance)

    // Event: Marker selesai digeser (dragend)
    markerInstance.on('dragend', async () => {
      const pos = markerInstance.getLatLng()
      currentLat.value = pos.lat
      currentLng.value = pos.lng
      await reverseGeocode(pos.lat, pos.lng)
    })

    // Event: Klik langsung pada sembarang titik di peta
    mapInstance.on('click', async (e: any) => {
      const { lat, lng } = e.latlng
      currentLat.value = lat
      currentLng.value = lng
      markerInstance.setLatLng([lat, lng])
      await reverseGeocode(lat, lng)
    })

    // Re-invalidate size setelah render agar peta tidak abu-abu
    setTimeout(() => {
      mapInstance?.invalidateSize()
    }, 250)
  } catch (err) {
    console.error('Failed to initialize Leaflet Map:', err)
  }
}

// Reverse Geocoding (Koordinat -> Alamat, Kota, Provinsi)
const reverseGeocode = async (lat: number, lng: number) => {
  isGeocoding.value = true
  try {
    let resolvedData: any = null

    // Skenario 1: Photon Reverse (CORS open & cepat)
    try {
      const pRes = await $fetch<any>(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
        timeout: 4500,
      })
      if (pRes?.features && pRes.features.length > 0) {
        const p = pRes.features[0].properties || {}
        const road = p.street || p.name || ''
        const district = p.district || ''
        const city = p.city || ''
        const province = p.state || ''
        const postalCode = p.postcode || ''
        const cleanParts = [road, district].filter(Boolean)
        const streetAddress = cleanParts.length > 0 ? cleanParts.join(', ') : (p.name || '')
        resolvedData = {
          address: streetAddress,
          city,
          province,
          postal_code: postalCode,
          district,
        }
      }
    } catch (photonErr) {
      console.warn('Photon reverse client failed, fallback to server API:', photonErr)
    }

    // Skenario 2: Server API reverse proxy
    if (!resolvedData) {
      try {
        const sRes = await $fetch<any>('/api/geocode/reverse', {
          params: { lat, lng },
          timeout: 5000,
        })
        if (sRes?.address) {
          resolvedData = sRes.address
        }
      } catch (srvErr) {
        console.warn('Server reverse proxy failed:', srvErr)
      }
    }

    if (resolvedData) {
      emit('update:location', {
        latitude: lat,
        longitude: lng,
        address: resolvedData.address || '',
        city: resolvedData.city || '',
        province: resolvedData.province || '',
        postal_code: resolvedData.postal_code || '',
        district: resolvedData.district || '',
      })

      showNotice(`Lokasi berhasil dititik: ${resolvedData.address || resolvedData.city || 'Koordinat diperbarui'}`, 'success')
    } else {
      emit('update:location', {
        latitude: lat,
        longitude: lng,
      })
    }
  } catch (err) {
    console.warn('Reverse geocode failed:', err)
    emit('update:location', {
      latitude: lat,
      longitude: lng,
    })
  } finally {
    isGeocoding.value = false
  }
}

// Fitur: Gunakan Lokasi Saat Ini (GPS HTML5 Geolocation)
const detectCurrentLocation = () => {
  if (!navigator.geolocation) {
    showNotice('Browser Anda tidak mendukung deteksi lokasi GPS.', 'warning')
    return
  }

  isLocating.value = true

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude
      const lng = position.coords.longitude

      currentLat.value = lat
      currentLng.value = lng

      if (mapInstance && markerInstance) {
        markerInstance.setLatLng([lat, lng])
        mapInstance.setView([lat, lng], 17, { animate: true })
      }

      await reverseGeocode(lat, lng)
      isLocating.value = false
      showNotice('Lokasi GPS Anda berhasil ditemukan dan dititik!', 'success')
    },
    (error) => {
      isLocating.value = false
      let errMsg = 'Gagal mendeteksi lokasi GPS.'
      if (error.code === error.PERMISSION_DENIED) {
        errMsg = 'Izin akses lokasi ditolak oleh browser. Harap aktifkan izin lokasi.'
      } else if (error.code === error.TIMEOUT) {
        errMsg = 'Waktu permintaan GPS habis. Coba klik kembali atau geser peta.'
      }
      showNotice(errMsg, 'warning')
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  )
}

// Pencarian Lokasi (Geocoding Search)
const handleSearchPlace = async () => {
  const query = searchQuery.value.trim()
  if (!query) return

  isSearching.value = true
  suggestions.value = []

  try {
    let items: any[] = []

    // Skenario 1: Direct Photon Geocoder (Komoot / OpenStreetMap)
    try {
      const pRes = await $fetch<any>(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`, {
        timeout: 4500,
      })
      if (pRes?.features && Array.isArray(pRes.features) && pRes.features.length > 0) {
        items = pRes.features.map((f: any) => {
          const p = f.properties || {}
          const coords = f.geometry?.coordinates || [0, 0]
          const title = p.name || p.street || 'Lokasi Terpilih'
          const parts = [p.street, p.district, p.city, p.state, p.postcode].filter(Boolean)
          const display = parts.length > 0 ? `${title}, ${parts.join(', ')}` : title
          return {
            lat: coords[1],
            lon: coords[0],
            name: title,
            display_name: display,
            street: p.street || p.name || '',
            city: p.city || '',
            district: p.district || '',
            province: p.state || '',
            postal_code: p.postcode || '',
          }
        })
      }
    } catch (photonErr) {
      console.warn('Photon client search failed, fallback to server API:', photonErr)
    }

    // Skenario 2: Server API proxy
    if (items.length === 0) {
      try {
        const sRes = await $fetch<any>('/api/geocode/search', {
          params: { q: query },
          timeout: 5000,
        })
        if (sRes?.results && Array.isArray(sRes.results) && sRes.results.length > 0) {
          items = sRes.results
        }
      } catch (srvErr) {
        console.warn('Server geocode search failed:', srvErr)
      }
    }

    if (items.length > 0) {
      suggestions.value = items
    } else {
      showNotice('Lokasi atau tempat tidak ditemukan. Coba gunakan kata kunci lain.', 'warning')
    }
  } catch (err) {
    console.error('Search place failed:', err)
    showNotice('Gagal melakukan pencarian lokasi.', 'warning')
  } finally {
    isSearching.value = false
  }
}

const selectSuggestion = async (item: any) => {
  const lat = parseFloat(item.lat)
  const lng = parseFloat(item.lon)

  currentLat.value = lat
  currentLng.value = lng
  suggestions.value = []
  searchQuery.value = item.name || (item.display_name ? item.display_name.split(',')[0] : '')

  if (mapInstance && markerInstance) {
    markerInstance.setLatLng([lat, lng])
    mapInstance.setView([lat, lng], 17, { animate: true })
  }

  // Auto-fill alamat lengkap dan detail wilayah
  const streetPart = item.street || item.name || ''
  const districtPart = item.district || ''
  const cleanAddr = [streetPart, districtPart].filter(Boolean).join(', ') || (item.display_name ? item.display_name.split(',').slice(0, 2).join(',') : item.name)

  emit('update:location', {
    latitude: lat,
    longitude: lng,
    address: cleanAddr,
    city: item.city || '',
    province: item.province || '',
    postal_code: item.postal_code || '',
    district: item.district || '',
  })

  showNotice(`Lokasi dipilih: ${item.name || cleanAddr}`, 'success')
}

// Live typing debounce untuk autocomplete search
let searchDebounceTimer: any = null
watch(searchQuery, (newVal) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  const q = newVal.trim()
  if (q.length < 3) {
    suggestions.value = []
    return
  }
  searchDebounceTimer = setTimeout(() => {
    handleSearchPlace()
  }, 400)
})

// Update posisi jika prop berubah
watch(
  () => [props.initialLat, props.initialLng],
  ([newLat, newLng]) => {
    if (newLat && newLng && (newLat !== currentLat.value || newLng !== currentLng.value)) {
      currentLat.value = Number(newLat)
      currentLng.value = Number(newLng)
      if (markerInstance && mapInstance) {
        markerInstance.setLatLng([currentLat.value, currentLng.value])
        mapInstance.setView([currentLat.value, currentLng.value], 16)
      }
    }
  }
)

const searchWrapperRef = ref<HTMLDivElement | null>(null)

const handleOutsideClick = (e: MouseEvent) => {
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(e.target as Node)) {
    suggestions.value = []
  }
}

onMounted(() => {
  initMap()
  if (import.meta.client) {
    window.addEventListener('click', handleOutsideClick)
  }
})

onBeforeUnmount(() => {
  if (noticeTimer) clearTimeout(noticeTimer)
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (import.meta.client) {
    window.removeEventListener('click', handleOutsideClick)
  }
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})
</script>

<style>
/* Custom Leaflet Marker Styling */
.cyber-leaflet-marker {
  background: none;
  border: none;
}

.custom-marker-pin {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-center {
  font-size: 28px;
  line-height: 1;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
  transform: translateY(-8px);
  animation: bouncePin 1.5s infinite ease-in-out;
}

.pin-pulse {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 6px;
  background: rgba(0, 74, 173, 0.6);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(0, 74, 173, 0.8);
  animation: shadowPulse 1.5s infinite ease-in-out;
}

@keyframes bouncePin {
  0%, 100% { transform: translateY(-8px); }
  50% { transform: translateY(-14px); }
}

@keyframes shadowPulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  50% { transform: translateX(-50%) scale(0.7); opacity: 0.4; }
}
</style>

<style scoped>
.location-picker-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: 1rem;
  padding: 1rem;
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
}

/* Top Bar: GPS Button & Google Maps Link */
.picker-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-gps {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  background: #ffffff;
  border: 1.5px solid #10b981;
  border-radius: 0.65rem;
  color: #065f46;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.15);
  transition: all 0.2s ease;
}

.btn-gps:hover:not(:disabled) {
  background: #ecfdf5;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}

.btn-gps-inner {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.btn-spinner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
}

.btn-gmaps-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.825rem;
  font-weight: 600;
  color: #0284c7;
  text-decoration: none;
  padding: 0.45rem 0.75rem;
  background: #ffffff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  transition: all 0.15s ease;
}

.btn-gmaps-link:hover {
  background: #f0f9ff;
  border-color: #0284c7;
  text-decoration: underline;
}

.text-red {
  color: #ea4335;
}

.text-emerald {
  color: #10b981;
}

/* Search Bar */
.search-location-wrapper {
  position: relative;
  width: 100%;
}

.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.85rem;
  pointer-events: none;
}

.location-search-input {
  width: 100%;
  padding: 0.6rem 5.5rem 0.6rem 2.5rem;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 0.65rem;
  font-size: 0.875rem;
  color: #0f172a;
  outline: none;
  transition: all 0.2s ease;
}

.location-search-input:focus {
  border-color: #004aad;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.1);
}

.clear-btn {
  position: absolute;
  right: 4.2rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  font-size: 0.85rem;
}

.btn-search-go {
  position: absolute;
  right: 4px;
  padding: 0.4rem 0.9rem;
  background: #004aad;
  border: none;
  border-radius: 0.45rem;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-search-go:hover:not(:disabled) {
  background: #003399;
}

.btn-search-go:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

/* Suggestions Dropdown */
.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 1000;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 0.65rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
  list-style: none;
  margin: 0;
  padding: 0.35rem 0;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: #eff6ff;
}

.suggestion-pin {
  font-size: 1rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.suggestion-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.suggestion-title {
  font-size: 0.85rem;
  color: #0f172a;
}

.suggestion-sub {
  font-size: 0.75rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Map Canvas Viewport */
.map-viewport-wrapper {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 0.75rem;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}

.map-canvas {
  width: 100%;
  height: 100%;
  background: #e2e8f0;
}

.map-instructions-badge {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.75rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.geocoding-spinner-overlay {
  position: absolute;
  inset: 0;
  z-index: 600;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0f172a;
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.825rem;
  font-weight: 500;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
}

/* Coordinates Status Bar */
.coordinates-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.4rem 0.25rem 0;
}

.coord-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #475569;
}

.coord-label {
  font-weight: 600;
}

.coord-val {
  font-family: monospace;
  background: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  color: #004aad;
  font-weight: 600;
}

.coord-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.coord-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #94a3b8;
}

.coord-badge.badge-active {
  color: #059669;
}

.coord-badge.badge-active .dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

/* Notice Box */
.notice-box {
  padding: 0.5rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.825rem;
  font-weight: 500;
}

.notice-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.notice-warning {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
}

.notice-info {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
}

@media (max-width: 640px) {
  .map-instructions-badge {
    display: none;
  }

  .picker-top-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-gps {
    width: 100%;
    justify-content: center;
  }

  .btn-gmaps-link {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .location-picker-card {
    padding: 0.85rem;
  }

  .picker-title {
    font-size: 0.9rem;
  }

  .address-search-input {
    font-size: 0.825rem;
    padding-left: 2.1rem;
  }

  .coord-pills-row {
    flex-direction: column;
    gap: 0.4rem;
  }

  .coord-pill {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
