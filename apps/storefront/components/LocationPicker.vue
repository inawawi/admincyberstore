<template>
  <div class="shopee-location-picker">

    <!-- ── GPS Lokasi Saat Ini ──────────────────────────── -->
    <div class="slp-gps-section">
      <button
        type="button"
        @click="detectCurrentLocation"
        :disabled="isLocating"
        class="slp-gps-btn"
      >
        <div class="slp-gps-icon-wrap" :class="{ 'pulsing': isLocating }">
          <Icon
            :name="isLocating ? 'lucide:loader-2' : 'lucide:crosshair'"
            class="w-5 h-5"
            :class="{ 'animate-spin': isLocating }"
          />
        </div>
        <div class="slp-gps-text">
          <span class="slp-gps-label">{{ isLocating ? 'Mendeteksi lokasi GPS…' : 'Gunakan Lokasi Saat Ini' }}</span>
          <span class="slp-gps-sub">{{ isLocating ? 'Mohon tunggu sebentar' : 'Titik lokasi otomatis diisi dari GPS perangkat Anda' }}</span>
        </div>
        <Icon v-if="!isLocating" name="lucide:chevron-right" class="slp-gps-arrow w-4 h-4" />
      </button>
    </div>

    <!-- ── Peta Interaktif ──────────────────────────────── -->
    <div class="slp-map-section">
      <div class="slp-section-header">
        <div class="slp-section-icon">
          <Icon name="lucide:map-pin" class="w-4 h-4" />
        </div>
        <span class="slp-section-title">Titik Lokasi di Peta</span>
        <span class="slp-section-tag">Opsional</span>
      </div>

      <div class="slp-map-wrapper">
        <div ref="mapContainerRef" class="slp-map-canvas"></div>

        <!-- Floating instruction badge -->
        <div class="slp-map-hint">
          <Icon name="lucide:hand" class="w-3.5 h-3.5 shrink-0" />
          <span>Geser atau klik peta untuk menentukan titik tepat</span>
        </div>

        <!-- Geocoding Overlay -->
        <Transition name="fade">
          <div v-if="isGeocoding" class="slp-map-overlay">
            <div class="slp-map-spinner">
              <Icon name="lucide:loader-2" class="w-5 h-5 animate-spin" />
              <span>Mengambil detail alamat…</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Koordinat + Info Row -->
      <div class="slp-coord-row">
        <div class="slp-coord-pill">
          <span class="slp-coord-key">Lat</span>
          <span class="slp-coord-val">{{ currentLat ? Number(currentLat).toFixed(6) : '—' }}</span>
        </div>
        <div class="slp-coord-pill">
          <span class="slp-coord-key">Lng</span>
          <span class="slp-coord-val">{{ currentLng ? Number(currentLng).toFixed(6) : '—' }}</span>
        </div>
        <div class="slp-coord-status" :class="{ 'pinned': currentLat && currentLng }">
          <span class="slp-dot"></span>
          <span>{{ currentLat && currentLng ? 'Titik terkunci' : 'Belum dititik' }}</span>
        </div>
        <a
          v-if="currentLat && currentLng"
          :href="`https://www.google.com/maps?q=${currentLat},${currentLng}`"
          target="_blank"
          rel="noopener noreferrer"
          class="slp-gmaps-link"
        >
          <Icon name="lucide:external-link" class="w-3 h-3" />
          <span>Google Maps</span>
        </a>
      </div>
    </div>

    <!-- ── Notifikasi Status ─────────────────────────────── -->
    <Transition name="slide-down">
      <div v-if="statusNotice" :class="['slp-notice', `slp-notice--${noticeType}`]">
        <Icon
          :name="noticeType === 'success' ? 'lucide:check-circle' : noticeType === 'warning' ? 'lucide:alert-triangle' : 'lucide:info'"
          class="w-4 h-4 shrink-0"
        />
        <span>{{ statusNotice }}</span>
      </div>
    </Transition>

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

// Koordinat (Default: Jakarta Pusat / UBSI)
const currentLat = ref<number>(props.initialLat ? Number(props.initialLat) : -6.2088)
const currentLng = ref<number>(props.initialLng ? Number(props.initialLng) : 106.8456)

const isLocating = ref(false)
const isGeocoding = ref(false)

const statusNotice = ref('')
const noticeType = ref<'info' | 'success' | 'warning'>('info')
let noticeTimer: any = null

const showNotice = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
  statusNotice.value = msg
  noticeType.value = type
  if (noticeTimer) clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { statusNotice.value = '' }, 4000)
}

// Inisialisasi Peta Leaflet
const initMap = async () => {
  if (!import.meta.client || !mapContainerRef.value) return

  try {
    L = await import('leaflet')

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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance)

    // Custom Shopee-style drop pin
    const customIcon = L.divIcon({
      className: 'slp-leaflet-marker',
      html: `
        <div class="slp-marker-wrap">
          <div class="slp-marker-pulse"></div>
          <div class="slp-marker-pin">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#ee4d2d" stroke="#fff" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3" fill="#fff"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 42],
    })

    markerInstance = L.marker(initialPos, {
      draggable: true,
      icon: customIcon,
    }).addTo(mapInstance)

    markerInstance.on('dragend', async () => {
      const pos = markerInstance.getLatLng()
      currentLat.value = pos.lat
      currentLng.value = pos.lng
      await reverseGeocode(pos.lat, pos.lng)
    })

    mapInstance.on('click', async (e: any) => {
      const { lat, lng } = e.latlng
      currentLat.value = lat
      currentLng.value = lng
      markerInstance.setLatLng([lat, lng])
      await reverseGeocode(lat, lng)
    })

    setTimeout(() => { mapInstance?.invalidateSize() }, 250)
  } catch (err) {
    console.error('Failed to initialize Leaflet Map:', err)
  }
}

// Reverse Geocoding — koordinat → detail alamat
const reverseGeocode = async (lat: number, lng: number) => {
  isGeocoding.value = true
  try {
    let resolvedData: any = null

    // Coba Photon (cepat, CORS terbuka)
    try {
      const pRes: any = await $fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
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
        resolvedData = { address: streetAddress, city, province, postal_code: postalCode, district }
      }
    } catch (photonErr) {
      console.warn('Photon reverse client failed, fallback to server API:', photonErr)
    }

    // Fallback ke server proxy
    if (!resolvedData) {
      try {
        const sRes: any = await $fetch('/api/geocode/reverse', {
          params: { lat, lng },
          headers: { 'ngrok-skip-browser-warning': 'true' },
          timeout: 6000,
        })
        if (sRes?.address) resolvedData = sRes.address
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
      showNotice(`Titik lokasi diperbarui${resolvedData.address ? ': ' + resolvedData.address : ''}`, 'success')
    } else {
      emit('update:location', { latitude: lat, longitude: lng })
    }
  } catch (err) {
    console.warn('Reverse geocode failed:', err)
    emit('update:location', { latitude: lat, longitude: lng })
  } finally {
    isGeocoding.value = false
  }
}

// Deteksi Lokasi GPS
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
      showNotice('Lokasi GPS berhasil dideteksi! Silakan lengkapi alamat di atas.', 'success')
    },
    (error) => {
      isLocating.value = false
      let errMsg = 'Gagal mendeteksi lokasi GPS.'
      if (error.code === error.PERMISSION_DENIED)
        errMsg = 'Izin akses lokasi ditolak. Harap aktifkan izin lokasi di browser.'
      else if (error.code === error.TIMEOUT)
        errMsg = 'Waktu permintaan GPS habis. Coba klik kembali.'
      showNotice(errMsg, 'warning')
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

// Update posisi jika prop berubah dari luar
watch(
  () => [props.initialLat, props.initialLng],
  ([newLat, newLng]) => {
    if (newLat && newLng && (newLat !== currentLat.value || newLng !== currentLng.value)) {
      currentLat.value = Number(newLat)
      currentLng.value = Number(newLng)
      if (markerInstance && mapInstance) {
        markerInstance.setLatLng([currentLat.value, currentLng.value])
        if (typeof mapInstance.flyTo === 'function') {
          mapInstance.flyTo([currentLat.value, currentLng.value], 16, { duration: 0.8 })
        } else {
          mapInstance.setView([currentLat.value, currentLng.value], 16)
        }
      }
    }
  }
)

onMounted(() => { initMap() })

onBeforeUnmount(() => {
  if (noticeTimer) clearTimeout(noticeTimer)
  if (mapInstance) { mapInstance.remove(); mapInstance = null }
})
</script>

<!-- Global: Leaflet marker styling -->
<style>
.slp-leaflet-marker { background: none; border: none; }

.slp-marker-wrap {
  position: relative;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.slp-marker-pin {
  transform: translateY(-6px);
  filter: drop-shadow(0 4px 8px rgba(238, 77, 45, 0.5));
  animation: slpBounce 1.6s ease-in-out infinite;
}

.slp-marker-pulse {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 7px;
  background: rgba(238, 77, 45, 0.35);
  border-radius: 50%;
  animation: slpPulse 1.6s ease-in-out infinite;
}

@keyframes slpBounce {
  0%, 100% { transform: translateY(-6px); }
  50% { transform: translateY(-14px); }
}
@keyframes slpPulse {
  0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  50% { transform: translateX(-50%) scale(0.6); opacity: 0.3; }
}
</style>

<style scoped>
/* ── Root Container ──────────────────────────────────────── */
.shopee-location-picker {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 0.75rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* ── GPS Button ────────────────────────────────────────── */
.slp-gps-section {
  border-bottom: 1px solid #f5f5f5;
}

.slp-gps-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.125rem;
  background: #fff;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.slp-gps-btn:hover:not(:disabled) { background: #fff5f3; }
.slp-gps-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.slp-gps-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #fff0ed;
  border: 1.5px solid #ffd3c9;
  color: #ee4d2d;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.slp-gps-icon-wrap.pulsing {
  animation: gpsRing 1.2s ease-in-out infinite;
}

@keyframes gpsRing {
  0%, 100% { box-shadow: 0 0 0 0 rgba(238, 77, 45, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(238, 77, 45, 0); }
}

.slp-gps-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.slp-gps-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #ee4d2d;
}

.slp-gps-sub {
  font-size: 0.75rem;
  color: #888;
}

.slp-gps-arrow {
  color: #ccc;
  flex-shrink: 0;
}

/* ── Map Section ───────────────────────────────────────── */
.slp-map-section {
  padding: 1rem 1.125rem;
}

.slp-section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.slp-section-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #fff0ed;
  color: #ee4d2d;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.slp-section-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #222;
  flex: 1;
}

.slp-section-tag {
  font-size: 0.7rem;
  font-weight: 600;
  color: #888;
  background: #f5f5f5;
  border-radius: 20px;
  padding: 2px 9px;
}

.slp-map-wrapper {
  position: relative;
  width: 100%;
  height: 250px;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e5e5e5;
}

.slp-map-canvas {
  width: 100%;
  height: 100%;
  background: #e2e8f0;
}

.slp-map-hint {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(4px);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.3rem 0.8rem;
  border-radius: 99px;
  pointer-events: none;
  white-space: nowrap;
}

.slp-map-overlay {
  position: absolute;
  inset: 0;
  z-index: 600;
  background: rgba(255,255,255,0.65);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.slp-map-spinner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border: 1px solid #e5e5e5;
  color: #ee4d2d;
  padding: 0.5rem 1.1rem;
  border-radius: 99px;
  font-size: 0.825rem;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12);
}

/* ── Coordinate Row ────────────────────────────────────── */
.slp-coord-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.65rem;
}

.slp-coord-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #f7f7f7;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 0.25rem 0.65rem;
}

.slp-coord-key {
  font-weight: 700;
  color: #aaa;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.slp-coord-val {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #ee4d2d;
  font-size: 0.78rem;
}

.slp-coord-status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #999;
}

.slp-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.slp-coord-status.pinned { color: #27ae60; }
.slp-coord-status.pinned .slp-dot {
  background: #2ecc71;
  box-shadow: 0 0 5px #2ecc71;
}

.slp-gmaps-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0284c7;
  text-decoration: none;
  padding: 0.25rem 0.65rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  transition: all 0.15s;
  margin-left: auto;
}
.slp-gmaps-link:hover { background: #e0f2fe; text-decoration: underline; }

/* ── Notice Alert ──────────────────────────────────────── */
.slp-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.125rem;
  font-size: 0.825rem;
  font-weight: 500;
  border-top: 1px solid transparent;
}

.slp-notice--success {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}
.slp-notice--warning {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}
.slp-notice--info {
  background: #f0f9ff;
  border-color: #bae6fd;
  color: #0369a1;
}

/* ── Transitions ───────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-8px); }

/* ── Responsive ─────────────────────────────────────────── */
@media (max-width: 640px) {
  .slp-map-hint { display: none; }
  .slp-map-wrapper { height: 210px; }
  .slp-gmaps-link { margin-left: 0; }
}

@media (max-width: 480px) {
  .slp-map-section { padding: 0.85rem 0.875rem; }
}
</style>
