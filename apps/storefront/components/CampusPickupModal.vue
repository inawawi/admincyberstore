<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="campus-modal-backdrop" @click.self="emit('close')">
        <div class="campus-modal-card cyber-card" role="dialog" aria-modal="true">
          <!-- Modal Header -->
          <div class="campus-modal-header">
            <div class="header-icon-circle">
              <Icon name="lucide:map-pin" class="w-6 h-6 text-bsi" />
            </div>
            <div class="header-text-group">
              <h3 class="modal-title">Pilih Lokasi Kampus UBSI</h3>
              <p class="modal-subtitle">Titik pengambilan resmi merchandise &amp; kaos Event MABA</p>
            </div>
            <button type="button" @click="emit('close')" class="btn-close-modal" aria-label="Tutup Modal">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="campus-modal-body">
            <!-- Search & Filter Bar -->
            <div class="campus-search-wrapper">
              <div class="search-input-group">
                <Icon name="lucide:search" class="search-icon" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Cari nama kampus, kota (misal: Kramat, Salemba, Depok, Pontianak)..."
                  class="input-cyber campus-search-input"
                  autofocus
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  @click="searchQuery = ''"
                  class="btn-clear-search"
                  title="Hapus pencarian"
                >
                  <Icon name="lucide:x" class="w-4 h-4" />
                </button>
              </div>

              <!-- Region Filter Pills -->
              <div class="region-filter-pills">
                <button
                  v-for="reg in regionFilters"
                  :key="reg.key"
                  type="button"
                  :class="['region-pill', { active: selectedRegion === reg.key }]"
                  @click="selectedRegion = reg.key"
                >
                  {{ reg.label }}
                  <span class="region-count">({{ getRegionCount(reg.key) }})</span>
                </button>
              </div>
            </div>

            <!-- Campus List -->
            <div class="campus-list-container">
              <div v-if="filteredCampuses.length === 0" class="campus-empty-state">
                <Icon name="lucide:map-pin-off" class="w-10 h-10 text-slate-400 mb-2" />
                <h4>Kampus Tidak Ditemukan</h4>
                <p>Tidak ada kampus UBSI yang cocok dengan pencarian "{{ searchQuery }}".</p>
              </div>

              <div
                v-else
                v-for="campus in filteredCampuses"
                :key="campus.id"
                :class="['campus-item-card', { selected: selectedCampusName === campus.name }]"
                @click="selectCampus(campus)"
              >
                <div class="campus-radio-indicator">
                  <span class="radio-dot"></span>
                </div>
                <div class="campus-card-content">
                  <div class="campus-name-row">
                    <h4 class="campus-name">{{ campus.name }}</h4>
                    <span v-if="selectedCampusName === campus.name" class="badge-selected-pill">
                      <Icon name="lucide:check" class="w-3.5 h-3.5 mr-1" />
                      Terpilih
                    </span>
                  </div>
                  <p class="campus-address">{{ campus.address }}</p>
                  <div class="campus-meta-row">
                    <span class="meta-tag city-tag">
                      <Icon name="lucide:building-2" class="w-3 h-3 mr-1" />
                      {{ campus.city }}
                    </span>
                    <span class="meta-tag province-tag">
                      <Icon name="lucide:map" class="w-3 h-3 mr-1" />
                      {{ campus.province }}
                    </span>
                    <span v-if="campus.postal_code" class="meta-tag postal-tag">
                      Kode Pos: {{ campus.postal_code }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="campus-modal-footer">
            <div class="footer-info">
              <Icon name="lucide:info" class="w-4 h-4 text-bsi" />
              <span>Pengambilan dilakukan langsung di sekretariat kampus saat kegiatan MABA.</span>
            </div>
            <button type="button" @click="emit('close')" class="btn btn-secondary">
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UBSI_CAMPUSES, type UbsiCampus } from '~/utils/ubsi-campuses'

const props = defineProps<{
  isOpen: boolean
  selectedCampusName?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', campus: UbsiCampus): void
}>()

const searchQuery = ref('')
const selectedRegion = ref('all')

const regionFilters = [
  { key: 'all', label: 'Semua Kampus' },
  { key: 'dki', label: 'DKI Jakarta' },
  { key: 'jabar', label: 'Jawa Barat' },
  { key: 'banten', label: 'Banten' },
  { key: 'jateng_diy', label: 'Jateng & DIY' },
  { key: 'kalimantan', label: 'Kalimantan' },
]

const getRegionCount = (regionKey: string) => {
  if (regionKey === 'all') return UBSI_CAMPUSES.length
  return UBSI_CAMPUSES.filter(c => matchRegion(c, regionKey)).length
}

const matchRegion = (campus: UbsiCampus, regionKey: string) => {
  const prov = campus.province.toLowerCase()
  if (regionKey === 'dki') return prov.includes('dki') || prov.includes('jakarta')
  if (regionKey === 'jabar') return prov.includes('jawa barat')
  if (regionKey === 'banten') return prov.includes('banten')
  if (regionKey === 'jateng_diy') return prov.includes('jawa tengah') || prov.includes('yogyakarta')
  if (regionKey === 'kalimantan') return prov.includes('kalimantan')
  return true
}

const filteredCampuses = computed(() => {
  let list = UBSI_CAMPUSES
  if (selectedRegion.value !== 'all') {
    list = list.filter(c => matchRegion(c, selectedRegion.value))
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    )
  }
  return list
})

const selectCampus = (campus: UbsiCampus) => {
  emit('select', campus)
  emit('close')
}
</script>

<style scoped>
.campus-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.campus-modal-card {
  background: #ffffff;
  width: 100%;
  max-width: 650px;
  max-height: calc(100vh - 3rem);
  border-radius: 18px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleUp {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.campus-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8fafc;
}

.header-icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 51, 153, 0.08);
  border: 1px solid rgba(0, 51, 153, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-text-group {
  flex: 1;
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.modal-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0.15rem 0 0 0;
}

.btn-close-modal {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

.campus-modal-body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
}

.campus-search-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  width: 18px;
  height: 18px;
  color: #004aad;
  pointer-events: none;
}

.campus-search-input {
  width: 100%;
  padding-left: 2.75rem;
  padding-right: 2.5rem;
  height: 42px;
  border-radius: 12px;
  font-size: 0.9rem;
  border: 1.5px solid #004aad !important;
  background: #f8fafc;
}

.campus-search-input:focus {
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.15);
}

.btn-clear-search {
  position: absolute;
  right: 0.75rem;
  background: #e2e8f0;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
}

.region-filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.region-pill {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.region-pill:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.region-pill.active {
  background: #004aad;
  color: #ffffff;
  border-color: #004aad;
}

.region-count {
  font-size: 0.68rem;
  opacity: 0.85;
}

.campus-list-container {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.campus-item-card {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.18s ease;
}

.campus-item-card:hover {
  border-color: #004aad;
  background: #f0f7ff;
  transform: translateY(-1px);
}

.campus-item-card.selected {
  border-color: #004aad;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(0, 74, 173, 0.12);
}

.campus-radio-indicator {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.campus-item-card.selected .campus-radio-indicator {
  border-color: #004aad;
}

.radio-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.15s ease;
}

.campus-item-card.selected .radio-dot {
  background: #004aad;
}

.campus-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.campus-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.campus-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.badge-selected-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  background: #004aad;
  color: #ffffff;
}

.campus-address {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
  line-height: 1.35;
}

.campus-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
}

.meta-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
}

.city-tag {
  background: #e0f2fe;
  color: #0369a1;
}

.province-tag {
  background: #f1f5f9;
  color: #475569;
}

.postal-tag {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.campus-empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #64748b;
}

.campus-empty-state h4 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.campus-empty-state p {
  font-size: 0.82rem;
  margin: 0;
}

.campus-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.76rem;
  color: #64748b;
}

@media (max-width: 640px) {
  .campus-modal-header {
    padding: 1rem;
  }
  .campus-modal-body {
    padding: 1rem;
  }
  .campus-modal-footer {
    padding: 0.85rem 1rem;
    flex-direction: column;
    align-items: stretch;
  }
  .footer-info {
    justify-content: center;
  }
}
</style>
