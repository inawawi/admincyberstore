<template>
  <section v-if="products && products.length > 0" class="section-container">
    <div class="container">
      <div class="event-maba-wrapper">
        <div class="section-header">
          <div class="section-title-group">
            <span class="section-subtitle text-gold inline-flex items-center gap-1">
              <Icon name="lucide:graduation-cap" class="w-4 h-4 text-gold" />
              <span>RESMI KEGIATAN MAHASISWA BARU 2026</span>
            </span>
            <h2 class="section-title">Perlengkapan Ormik & Semot UBSI</h2>
            <p class="event-subtitle-desc">
              Seragam resmi dan atribut wajib kegiatan Orientasi Akademik & Seminar Motivasi. Warna kaos otomatis disesuaikan dengan digit terakhir NIM Anda (Ganjil: Kaos Putih, Genap: Kaos Biru).
            </p>
          </div>
          <NuxtLink to="/products?is_event_maba=1" class="view-all-link event-link">
            Semua Perlengkapan Maba
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <div class="grid-products">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Props {
  products: any[]
}

defineProps<Props>()
</script>

<style scoped>
.section-container {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.75rem;
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.section-subtitle {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.text-gold {
  color: #b45309 !important;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: #003399;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #004aad;
  transition: all 0.2s ease;
}

.view-all-link:hover {
  color: #003399;
  transform: translateX(3px);
}

.event-maba-wrapper {
  background: linear-gradient(135deg, #eff6ff 0%, #f0f7ff 50%, #e0f2fe 100%);
  border: 1.5px solid #bfdbfe;
  border-radius: var(--radius-lg);
  padding: 2.25rem 2rem;
  box-shadow: 0 8px 30px rgba(0, 51, 153, 0.08);
  position: relative;
  overflow: hidden;
}

.event-subtitle-desc {
  font-size: 0.875rem;
  color: #334155;
  max-width: 620px;
  line-height: 1.55;
  margin-top: 0.35rem;
}

.event-link {
  color: #003399;
}

.event-link:hover {
  color: #004aad;
}

@media (max-width: 640px) {
  .section-title {
    font-size: 1.35rem;
  }
  .event-maba-wrapper {
    padding: 1.5rem 1rem;
  }
}
</style>
