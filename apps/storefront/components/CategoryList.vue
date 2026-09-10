<template>
  <div class="category-list-wrapper">
    <div class="category-scroll-container">
      <!-- All Categories Pill -->
      <NuxtLink
        to="/products"
        :class="['category-pill', { active: !activeCategoryId }]"
      >
        <span class="cat-icon"><Icon name="lucide:sparkles" class="w-4 h-4 text-bsi" /></span>
        <span class="cat-name">Semua Kategori</span>
      </NuxtLink>

      <!-- Category Pills -->
      <NuxtLink
        v-for="cat in categories"
        :key="cat.id"
        :to="`/products?category_id=${cat.id}`"
        :class="['category-pill', { active: activeCategoryId == cat.id }]"
      >
        <span class="cat-icon">
          <Icon name="lucide:layout-grid" class="w-4 h-4" />
        </span>
        <span class="cat-name">{{ cat.name }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  categories: any[]
  activeCategoryId?: string | number | null
}>()
</script>

<style scoped>
.category-list-wrapper {
  width: 100%;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.category-scroll-container {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  white-space: nowrap;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
}

.category-pill:hover {
  border-color: #004aad;
  color: #003399;
  background: #eff6ff;
  transform: translateY(-2px);
}

.category-pill.active {
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  border-color: #002266;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.25);
}

.cat-icon {
  display: flex;
  align-items: center;
  color: #004aad;
}

.category-pill.active .cat-icon {
  color: #fbbf24;
}

.cat-name {
  font-weight: 600;
}
</style>
