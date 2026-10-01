<template>
  <header class="navbar-wrapper">
    <div v-if="announcement.is_active" class="top-announcement" role="region" aria-label="Pengumuman Toko"
      :style="announcementStyle">
      <div class="announcement-marquee-wrapper" title="Arahkan kursor atau tahan untuk jeda">
        <div class="announcement-marquee-track">
          <!-- Marquee Item 1 -->
          <div class="announcement-item">
            <div class="announcement-badge">
              <span class="pulse-dot"></span>
              <span>{{
                announcement.badge || 'BSI Cyber Store Official'
              }}</span>
            </div>
            <component :is="announcement.link ? 'NuxtLink' : 'span'" :to="announcement.link || undefined"
              class="announcement-text" v-html="safeAnnouncementText"></component>
            <div v-if="announcement.info" class="announcement-info">
              <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-1 text-cyan" />
              <span>{{ announcement.info }}</span>
            </div>
            <span class="announcement-separator">✦</span>
          </div>

          <!-- Marquee Item 2 -->
          <div class="announcement-item">
            <div class="announcement-badge">
              <span class="pulse-dot"></span>
              <span>{{
                announcement.badge || 'BSI Cyber Store Official'
              }}</span>
            </div>
            <component :is="announcement.link ? 'NuxtLink' : 'span'" :to="announcement.link || undefined"
              class="announcement-text" v-html="safeAnnouncementText"></component>
            <div v-if="announcement.info" class="announcement-info">
              <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-1 text-cyan" />
              <span>{{ announcement.info }}</span>
            </div>
            <span class="announcement-separator">✦</span>
          </div>

          <!-- Marquee Item 3 (Duplicate for Seamless Loop) -->
          <div class="announcement-item" aria-hidden="true">
            <div class="announcement-badge">
              <span class="pulse-dot"></span>
              <span>{{
                announcement.badge || 'BSI Cyber Store Official'
              }}</span>
            </div>
            <component :is="announcement.link ? 'NuxtLink' : 'span'" :to="announcement.link || undefined"
              class="announcement-text" v-html="safeAnnouncementText"></component>
            <div v-if="announcement.info" class="announcement-info">
              <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-1 text-cyan" />
              <span>{{ announcement.info }}</span>
            </div>
            <span class="announcement-separator">✦</span>
          </div>

          <!-- Marquee Item 4 (Duplicate for Seamless Loop) -->
          <div class="announcement-item" aria-hidden="true">
            <div class="announcement-badge">
              <span class="pulse-dot"></span>
              <span>{{
                announcement.badge || 'BSI Cyber Store Official'
              }}</span>
            </div>
            <component :is="announcement.link ? 'NuxtLink' : 'span'" :to="announcement.link || undefined"
              class="announcement-text" v-html="safeAnnouncementText"></component>
            <div v-if="announcement.info" class="announcement-info">
              <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-1 text-cyan" />
              <span>{{ announcement.info }}</span>
            </div>
            <span class="announcement-separator">✦</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <nav class="main-nav">
      <div class="container nav-container">
        <!-- Left Area: Hamburger (Mobile/Tablet) + Logo -->
        <div class="nav-left">
          <!-- Mobile Hamburger Toggle Button -->
          <button @click="toggleMobileMenu" class="hamburger-btn" :class="{ 'is-active': isMobileMenuOpen }"
            aria-label="Buka Menu Navigasi" :aria-expanded="isMobileMenuOpen">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>

          <!-- Brand Logo -->
          <NuxtLink to="/" class="brand-logo" @click="closeAllMenus">
            <div class="logo-icon-box">
              <img v-if="storeLogo" :src="storeLogo" :alt="storeName || 'BSI Cyber Store'" class="logo-img"
                @error="handleLogoError" />
              <Icon v-else name="lucide:zap" class="logo-svg" />
            </div>
            <div class="logo-text-group">
              <span class="logo-main">{{ storeName }}</span>
              <span class="logo-sub">UNIVERSITAS BINA SARANA INFORMATIKA</span>
            </div>
          </NuxtLink>
        </div>

        <!-- Center Area: Desktop Search Bar -->
        <div ref="searchWrapperRef" class="nav-search-wrapper">
          <form @submit.prevent="handleSearch" class="search-form">
            <input v-model="searchQuery" type="text" placeholder="Cari kaos maba, jaket, tumbler..."
              class="nav-search-input" autocomplete="off" @focus="isSearchDropdownOpen = true"
              @keydown.esc="isSearchDropdownOpen = false" />
            <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="desktop-clear-search-btn"
              title="Hapus teks" aria-label="Hapus teks">
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
            </button>
            <button type="submit" class="search-btn" aria-label="Cari Produk">
              <Icon name="lucide:search" class="w-4 h-4" />
            </button>
          </form>

          <!-- Shopee-Style Search History & Autocomplete Dropdown -->
          <Transition name="search-dropdown-pop">
            <div v-if="isSearchDropdownOpen" class="search-history-dropdown"
              :class="{ 'is-autocomplete-mode': searchQuery.trim().length > 0 }" @mousedown.prevent>
              <!-- TAMPILAN A: User Sedang Mengetik (Shopee Autocomplete Sesuai Gambar) -->
              <template v-if="searchQuery.trim().length > 0">
                <!-- 1. Baris Cari Toko dengan Icon Toko Merah/Oranye Sesuai Gambar -->
                <div class="search-suggest-store-row" @click="handleSearch">
                  <div class="store-icon-wrap">
                    <Icon name="lucide:store" class="w-4 h-4 text-orange-500" />
                  </div>
                  <span class="suggest-store-text">
                    Cari Toko "<strong>{{ searchQuery.trim() }}</strong>"
                  </span>
                </div>

                <!-- 2. Daftar Rekomendasi Kata Kunci (Shopee Style dengan bold prefix) -->
                <div class="search-suggest-list">
                  <div v-for="(suggestion, sIdx) in matchedSuggestions" :key="sIdx" class="search-suggest-item"
                    @click="executeKeywordSearch(suggestion)">
                    <span class="suggest-item-text" v-html="highlightMatch(suggestion, searchQuery.trim())"></span>
                  </div>
                </div>
              </template>

              <!-- TAMPILAN B: Input Masih Kosong (Riwayat & Pencarian Populer) -->
              <template v-else>
                <!-- 1. Riwayat Pencarian (Shopee Style) -->
                <div v-if="filteredHistory.length > 0" class="history-section">
                  <div class="history-section-header">
                    <span class="history-title">
                      <Icon name="lucide:history" class="w-3.5 h-3.5 text-slate-400 inline mr-1" />
                      Riwayat Pencarian
                    </span>
                    <button type="button" class="btn-clear-history" @click="clearAllHistory"
                      title="Hapus semua riwayat">
                      <Icon name="lucide:trash-2" class="w-3 h-3 inline mr-0.5" />
                      Hapus Semua
                    </button>
                  </div>
                  <div class="history-chips-wrap">
                    <div v-for="(item, idx) in filteredHistory" :key="idx" class="history-chip"
                      @click="executeKeywordSearch(item)">
                      <span class="chip-text">{{ item }}</span>
                      <button type="button" class="chip-remove-btn" @click.stop="removeHistoryItem(item)"
                        title="Hapus item ini" aria-label="Hapus">
                        <Icon name="lucide:x" class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- 2. Pencarian Populer dari Kategori Database (Shopee Style) -->
                <div v-if="popularCategories.length > 0" class="popular-section"
                  :class="{ 'has-border-top': filteredHistory.length > 0 }">
                  <div class="popular-section-header">
                    <span class="popular-title">
                      <Icon name="lucide:flame" class="w-3.5 h-3.5 text-rose-500 inline mr-1" />
                      Kategori Populer
                    </span>
                  </div>
                  <div class="popular-chips-wrap">
                    <button v-for="cat in popularCategories" :key="cat.id" type="button" class="popular-chip"
                      @click="executeCategorySearch(cat)">
                      <Icon name="lucide:sparkles" class="w-3 h-3 text-amber-500 mr-1 inline" />
                      <span>{{ cat.name }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </Transition>
        </div>

        <!-- Right Area: Navigation Links & Actions -->
        <div class="nav-actions">
          <!-- Desktop Nav Links -->
          <div class="desktop-nav-links">
            <NuxtLink to="/" class="nav-link" active-class="active">
              Beranda
            </NuxtLink>
            <NuxtLink to="/products" class="nav-link" active-class="active">
              Katalog
            </NuxtLink>
            <NuxtLink to="/products?is_event_maba=1" class="nav-link nav-link-maba">
              <span class="maba-indicator">
                <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1 text-gold" />
                Maba
              </span>
            </NuxtLink>
          </div>

          <!-- Notification Center Dropdown -->
          <NotificationDropdown />

          <!-- Mobile Search Trigger Button -->
          <button @click="toggleMobileSearch" class="action-icon-btn mobile-search-btn"
            :class="{ 'is-active': isMobileSearchOpen }" aria-label="Cari Produk">
            <Icon v-if="!isMobileSearchOpen" name="lucide:search" class="w-5 h-5" />
            <Icon v-else name="lucide:x" class="w-5 h-5" />
          </button>

          <!-- Cart Button with Counter -->
          <button @click="handleCartClick" class="cart-trigger-btn" :class="{ 'has-items': cartStore.totalItems > 0 }"
            aria-label="Buka Keranjang">
            <div class="cart-icon-wrapper" :class="{ 'cart-bounce-anim': cartStore.cartBounce }">
              <Icon name="lucide:shopping-cart" class="w-5 h-5" />
              <Transition name="badge-pop">
                <span v-if="cartStore.totalItems > 0" class="cart-counter-badge" :key="cartStore.totalItems">
                  {{ cartStore.totalItems > 99 ? '99+' : cartStore.totalItems }}
                </span>
              </Transition>
            </div>
            <span class="cart-btn-label">Keranjang</span>
          </button>

          <!-- User Auth Profile Dropdown / Login Button (Desktop & Tablet) -->
          <div v-if="authStore.isAuthenticated" ref="userMenuRef" class="user-menu-wrapper">
            <button @click="toggleUserMenu" class="user-avatar-btn" :class="{ 'is-active': isUserMenuOpen }"
              aria-label="Menu Pengguna" :aria-expanded="isUserMenuOpen">
              <img v-if="authStore.user?.photo" :src="getImageUrl(authStore.user.photo)"
                :alt="authStore.user?.name || 'Foto Profil'" class="user-avatar-nav-img" />
              <div v-else class="user-avatar-initial">
                {{ (authStore.user?.name || 'U').charAt(0).toUpperCase() }}
              </div>
              <span class="user-name-label">{{
                authStore.user?.name?.split(' ')[0] || 'Akun'
              }}</span>
              <Icon name="lucide:chevron-down" class="w-3.5 h-3.5 text-muted user-chevron"
                :class="{ 'rotate-180': isUserMenuOpen }" />
            </button>

            <!-- Dropdown Menu -->
            <transition name="dropdown-fade">
              <div v-if="isUserMenuOpen" class="user-dropdown-menu cyber-card">
                <div class="user-dropdown-header">
                  <span class="user-full-name">{{ authStore.user?.name }}</span>
                  <span class="user-email">{{ authStore.user?.email }}</span>
                  <div class="user-member-badge">
                    <span class="member-pulse-dot"></span>
                    <span>Member Resmi</span>
                  </div>
                </div>
                <div class="user-dropdown-links">
                  <NuxtLink to="/account/profile" @click="isUserMenuOpen = false" class="dropdown-link">
                    <Icon name="lucide:user" class="w-4 h-4 text-bsi" />
                    <span>Profil Saya</span>
                  </NuxtLink>
                  <NuxtLink to="/account/orders" @click="isUserMenuOpen = false" class="dropdown-link">
                    <Icon name="lucide:package" class="w-4 h-4 text-bsi" />
                    <span>Pesanan Saya</span>
                  </NuxtLink>
                  <button @click="handleLogout" class="dropdown-link text-coral">
                    <Icon name="lucide:log-out" class="w-4 h-4" />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <NuxtLink v-else to="/auth/login" class="btn btn-secondary btn-login">
            <Icon name="lucide:log-in" class="w-4 h-4 text-bsi-blue" />
            <span class="login-btn-label">Masuk</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Mobile Expandable Search Bar (Slide Down) -->
      <transition name="slide-search">
        <div v-if="isMobileSearchOpen" ref="mobileSearchWrapperRef" class="mobile-search-bar">
          <div class="container">
            <form @submit.prevent="handleMobileSearch" class="mobile-search-form">
              <Icon name="lucide:search" class="w-5 h-5 mobile-search-icon" />
              <input ref="mobileSearchInput" v-model="searchQuery" type="text"
                placeholder="Cari kaos maba, jaket, tumbler..." class="mobile-search-input" autocomplete="off" />
              <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="clear-search-btn"
                aria-label="Hapus Pencarian">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
              <button type="submit" class="btn-search-go">Cari</button>
            </form>

            <!-- Mobile Shopee-Style Search History & Popular Searches -->
            <div class="mobile-search-dropdown-content"
              :class="{ 'is-autocomplete-mode': searchQuery.trim().length > 0 }">
              <!-- TAMPILAN A: User Sedang Mengetik (Shopee Autocomplete Sesuai Gambar) -->
              <template v-if="searchQuery.trim().length > 0">
                <!-- 1. Baris Cari Toko dengan Icon Toko Merah/Oranye Sesuai Gambar -->
                <div class="search-suggest-store-row" @click="handleMobileSearch">
                  <div class="store-icon-wrap">
                    <Icon name="lucide:store" class="w-4 h-4 text-orange-500" />
                  </div>
                  <span class="suggest-store-text">
                    Cari Toko "<strong>{{ searchQuery.trim() }}</strong>"
                  </span>
                </div>

                <!-- 2. Daftar Autocomplete dengan Highlight Tebal (Bold Prefix) -->
                <div class="search-suggest-list">
                  <div v-for="(suggestion, sIdx) in matchedSuggestions" :key="sIdx" class="search-suggest-item"
                    @click="executeKeywordSearch(suggestion)">
                    <span class="suggest-item-text" v-html="highlightMatch(suggestion, searchQuery.trim())"></span>
                  </div>
                </div>
              </template>

              <!-- TAMPILAN B: Input Masih Kosong (Riwayat & Pencarian Populer) -->
              <template v-else>
                <!-- Riwayat Pencarian Mobile -->
                <div v-if="filteredHistory.length > 0" class="history-section">
                  <div class="history-section-header">
                    <span class="history-title">
                      <Icon name="lucide:history" class="w-3.5 h-3.5 text-slate-400 inline mr-1" />
                      Riwayat Pencarian
                    </span>
                    <button type="button" class="btn-clear-history" @click="clearAllHistory">
                      <Icon name="lucide:trash-2" class="w-3 h-3 inline mr-0.5" />
                      Hapus Semua
                    </button>
                  </div>
                  <div class="history-chips-wrap">
                    <div v-for="(item, idx) in filteredHistory" :key="idx" class="history-chip"
                      @click="executeKeywordSearch(item)">
                      <span class="chip-text">{{ item }}</span>
                      <button type="button" class="chip-remove-btn" @click.stop="removeHistoryItem(item)"
                        aria-label="Hapus">
                        <Icon name="lucide:x" class="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Pencarian Populer Mobile dari Kategori Database -->
                <div v-if="popularCategories.length > 0" class="popular-section"
                  :class="{ 'has-border-top': filteredHistory.length > 0 }">
                  <div class="popular-section-header">
                    <span class="popular-title">
                      <Icon name="lucide:flame" class="w-3.5 h-3.5 text-rose-500 inline mr-1" />
                      Kategori Populer
                    </span>
                  </div>
                  <div class="popular-chips-wrap">
                    <button v-for="cat in popularCategories" :key="cat.id" type="button" class="popular-chip"
                      @click="executeCategorySearch(cat)">
                      <Icon name="lucide:sparkles" class="w-3 h-3 text-amber-500 mr-1 inline" />
                      <span>{{ cat.name }}</span>
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </transition>
    </nav>

    <!-- Mobile Off-Canvas Drawer (Teleported to body to escape sticky header stacking context) -->
    <ClientOnly>
      <Teleport to="body">
        <transition name="fade">
          <div v-if="isMobileMenuOpen" class="mobile-drawer-backdrop" @click="closeMobileMenu"></div>
        </transition>

        <transition name="slide-drawer">
          <aside v-if="isMobileMenuOpen" class="mobile-drawer">
            <!-- Drawer Header -->
            <div class="drawer-header">
              <div class="drawer-logo">
                <div class="logo-icon-box">
                  <img v-if="storeLogo" :src="storeLogo" :alt="storeName || 'BSI Cyber Store'" class="logo-img"
                    @error="handleLogoError" />
                  <Icon v-else name="lucide:zap" class="logo-svg" />
                </div>
                <div class="logo-text-group">
                  <span class="logo-main">{{ storeName }}</span>
                  <span class="logo-sub">UNIVERSITAS BINA SARANA INFORMATIKA</span>
                </div>
              </div>
              <button @click="closeMobileMenu" class="drawer-close-btn" aria-label="Tutup Menu">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Drawer User Card (If Authenticated) -->
            <!-- <div v-if="authStore.isAuthenticated" class="drawer-user-card">
              <div class="drawer-avatar">
                <img v-if="authStore.user?.photo" :src="getImageUrl(authStore.user.photo)"
                  :alt="authStore.user?.name || 'User'" class="drawer-avatar-img" />
                <span v-else>{{ (authStore.user?.name || 'U').charAt(0).toUpperCase() }}</span>
              </div>
              <div class="drawer-user-info">
                <span class="drawer-user-name">{{ authStore.user?.name }}</span>
                <span class="drawer-user-email">{{ authStore.user?.email }}</span>
              </div>
            </div> -->

            <!-- Drawer Navigation Links -->
            <div class="drawer-content">
              <div class="drawer-section-title">NAVIGASI UTAMA</div>
              <nav class="drawer-links">
                <NuxtLink to="/" class="drawer-nav-item" active-class="is-active" @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:home" class="w-4 h-4" />
                  </span>
                  <span>Beranda</span>
                </NuxtLink>
                <NuxtLink to="/products" class="drawer-nav-item" active-class="is-active" @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:shopping-bag" class="w-4 h-4" />
                  </span>
                  <span>Katalog Lengkap</span>
                </NuxtLink>
                <NuxtLink to="/products?is_event_maba=1" class="drawer-nav-item drawer-maba-item"
                  @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:graduation-cap" class="w-4 h-4 text-gold" />
                  </span>
                  <div class="drawer-maba-text">
                    <span>Perlengkapan Maba 2026</span>
                    <span class="drawer-badge-gold">Ormik & Semot</span>
                  </div>
                </NuxtLink>
                <NuxtLink to="/products?is_recommended=1" class="drawer-nav-item" @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:flame" class="w-4 h-4 text-coral" />
                  </span>
                  <span>Cyber Picks Rekomendasi</span>
                </NuxtLink>
                <NuxtLink to="/announcements" class="drawer-nav-item" active-class="is-active" @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:megaphone" class="w-4 h-4" />
                  </span>
                  <span>Pengumuman & Info</span>
                </NuxtLink>
                <button @click="openCartFromDrawer" class="drawer-nav-item drawer-cart-item">
                  <span class="drawer-icon">
                    <Icon name="lucide:shopping-cart" class="w-4 h-4" />
                  </span>
                  <span>Keranjang Belanja</span>
                  <span v-if="cartStore.totalItems > 0" class="drawer-count-badge">
                    {{ cartStore.totalItems }}
                  </span>
                </button>
              </nav>

              <!-- Member Area Links -->
              <div class="drawer-section-title">AKUN SAYA</div>
              <div v-if="authStore.isAuthenticated" class="drawer-links">
                <NuxtLink to="/account/profile" class="drawer-nav-item" @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:user" class="w-4 h-4" />
                  </span>
                  <span>Profil Saya</span>
                </NuxtLink>
                <NuxtLink to="/account/orders" class="drawer-nav-item" @click="closeMobileMenu">
                  <span class="drawer-icon">
                    <Icon name="lucide:package" class="w-4 h-4" />
                  </span>
                  <span>Pesanan Saya</span>
                </NuxtLink>
                <button @click="handleLogoutFromDrawer" class="drawer-nav-item text-coral">
                  <span class="drawer-icon">
                    <Icon name="lucide:log-out" class="w-4 h-4" />
                  </span>
                  <span>Keluar / Logout</span>
                </button>
              </div>
              <div v-else class="drawer-guest-box">
                <p class="drawer-guest-desc">
                  Masuk untuk melihat riwayat pesanan dan kemudahan checkout.
                </p>
                <NuxtLink to="/auth/login" class="btn btn-primary btn-drawer-login" @click="closeMobileMenu">
                  <Icon name="lucide:log-in" class="w-4 h-4" />
                  <span>Masuk ke Akun</span>
                </NuxtLink>
              </div>
            </div>

            <!-- Drawer Footer -->
            <div class="drawer-footer">
              <span class="drawer-footer-sub">© Powered by BTI-BSI 2026.</span>
            </div>
          </aside>
        </transition>

        <!-- Logout Confirmation Modal (Teleported to body) -->
        <transition name="modal-fade">
          <div v-if="isLogoutModalOpen" class="logout-modal-backdrop" role="dialog" aria-modal="true"
            aria-labelledby="logout-modal-title" @click.self="closeLogoutModal">
            <div class="logout-modal-card simple-confirm-modal">
              <button type="button" class="simple-modal-close" aria-label="Tutup Dialog" :disabled="isLoggingOut"
                @click="closeLogoutModal">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>

              <div class="simple-modal-icon-circle">
                <Icon name="lucide:log-out" class="w-6 h-6 text-coral" />
              </div>

              <div class="simple-modal-content">
                <h3 id="logout-modal-title" class="simple-modal-title">
                  Konfirmasi Keluar
                </h3>
                <p class="simple-modal-desc">
                  Apakah Anda yakin ingin keluar dari akun Anda?
                </p>
              </div>

              <div class="simple-modal-actions">
                <button type="button" class="btn-simple-cancel" :disabled="isLoggingOut" @click="closeLogoutModal">
                  Batal
                </button>
                <button type="button" class="btn-simple-logout" :disabled="isLoggingOut" @click="confirmLogout">
                  <Icon v-if="isLoggingOut" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                  <Icon v-else name="lucide:log-out" class="w-4 h-4" />
                  <span>{{ isLoggingOut ? 'Mengeluarkan...' : 'Ya, Keluar' }}</span>
                </button>
              </div>
            </div>
          </div>
        </transition>
      </Teleport>
    </ClientOnly>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'
import { useTheme } from '~/composables/useTheme'
import { useToast } from '~/composables/useToast'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()
const { fetchStoreInfo, fetchCategories, getImageUrl } = useApi()
const { initTheme } = useTheme()

// Fetch Categories from Database for Popular Searches
const { data: categoriesData } = await useAsyncData('navbar_categories', () => fetchCategories(), {
  getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
})

const popularCategories = computed(() => {
  const list = categoriesData.value?.categories || []
  return list.filter((c: any) => Boolean(c.is_active))
})

// Dynamic Store Info (Top Announcement Bar)
const defaultAnnouncement =
  'PROMO SPESIAL MAHASISWA BARU 2026! Dapatkan Diskon Hingga 50% Menggunakan Kode: <strong>MABA2026</strong>'

// Await store info on SSR so SSR HTML and hydration match perfectly
const { data: storeInfoData } = await useAsyncData('navbar_store_info', () => fetchStoreInfo())

const announcement = useState('navbar_announcement', () => {
  const data = storeInfoData.value
  return {
    is_active: data?.announcement?.is_active ?? true,
    badge: data?.announcement?.badge || 'BSI Cyber Store Official',
    text: data?.announcement?.text || defaultAnnouncement,
    info: data?.announcement?.info || 'Garansi Resmi 100%',
    link: data?.announcement?.link || '',
    bg_color: data?.announcement?.bg_color || '',
    text_color: data?.announcement?.text_color || '',
  }
})

const announcementStyle = computed(() => {
  const styles: Record<string, string> = {}
  if (announcement.value.bg_color) {
    styles.background = announcement.value.bg_color
  }
  if (announcement.value.text_color) {
    styles.color = announcement.value.text_color
  }
  return Object.keys(styles).length > 0 ? styles : undefined
})

// Sanitasi XSS untuk konten HTML yang berasal dari server/database
const sanitizeHtml = (html: string): string => {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/javascript:[^"']*/gi, '')
}

const safeAnnouncementText = computed(() => {
  return sanitizeHtml(announcement.value.text || defaultAnnouncement)
})

// Dynamic Store Logo & Name from Admin Settings
const cachedStoreInfo = useState<any>('cached_store_info', () => null)
const storeLogo = useState<string>('navbar_store_logo', () => {
  const data = storeInfoData.value || cachedStoreInfo.value
  const logo = data?.store_logo || data?.logo
  return logo ? getImageUrl(logo) : '/logo-cyberstore.jpg'
})
const storeName = useState<string>('navbar_store_name', () => {
  const data = storeInfoData.value || cachedStoreInfo.value
  return data?.store_name || data?.name || 'BSI Cyber Store'
})

const handleLogoError = () => {
  if (storeLogo.value !== '/logo-cyberstore.jpg') {
    storeLogo.value = '/logo-cyberstore.jpg'
  }
}

const applyStoreInfo = (data: any) => {
  if (!data) return
  const logoUrl = data.store_logo || data.logo
  if (logoUrl) {
    storeLogo.value = getImageUrl(logoUrl)
  }
  const name = data.store_name || data.name
  if (name) {
    storeName.value = name
  }
  if (data.announcement) {
    announcement.value = {
      is_active: data.announcement.is_active ?? true,
      badge: data.announcement.badge || 'BSI Cyber Store Official',
      text: data.announcement.text || defaultAnnouncement,
      info: data.announcement.info || '',
      link: data.announcement.link || '',
      bg_color: data.announcement.bg_color || '',
      text_color: data.announcement.text_color || '',
    }
  }
}

// Immediate synchronization if storeInfoData resolves
if (storeInfoData.value) {
  applyStoreInfo(storeInfoData.value)
}

// Reactive listener if cachedStoreInfo updates elsewhere
watch(
  cachedStoreInfo,
  (val) => {
    if (val) applyStoreInfo(val)
  },
  { deep: true }
)

watch(
  storeInfoData,
  (newData) => {
    if (newData) applyStoreInfo(newData)
  },
  { deep: true }
)

// Ref for click outside detection
const userMenuRef = ref<HTMLElement | null>(null)
const searchWrapperRef = ref<HTMLElement | null>(null)
const mobileSearchWrapperRef = ref<HTMLElement | null>(null)

const handleDocumentClick = (event: MouseEvent) => {
  if (
    isUserMenuOpen.value &&
    userMenuRef.value &&
    !userMenuRef.value.contains(event.target as Node)
  ) {
    isUserMenuOpen.value = false
  }

  if (
    isSearchDropdownOpen.value &&
    searchWrapperRef.value &&
    !searchWrapperRef.value.contains(event.target as Node) &&
    (!mobileSearchWrapperRef.value || !mobileSearchWrapperRef.value.contains(event.target as Node))
  ) {
    isSearchDropdownOpen.value = false
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isSearchDropdownOpen.value) {
      isSearchDropdownOpen.value = false
    }
    if (isLogoutModalOpen.value && !isLoggingOut.value) {
      closeLogoutModal()
    }
  }
}

onMounted(async () => {
  initTheme()
  loadSearchHistory()
  if (typeof document !== 'undefined') {
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleKeydown)
  }

  try {
    const data = await fetchStoreInfo()
    if (data) {
      applyStoreInfo(data)
    }
  } catch (err) {
    console.error('Failed to load store info:', err)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleKeydown)
  }
})

const searchQuery = ref('')
const isUserMenuOpen = ref(false)
const isMobileMenuOpen = ref(false)
const isMobileSearchOpen = ref(false)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

// Shopee-Style Search History States & Methods
const isSearchDropdownOpen = ref(false)
const searchHistory = ref<string[]>([])
const SEARCH_HISTORY_KEY = 'cyberstore_search_history'

// Trending & Popular UBSI Merchandise Searches
const popularSearches = [
  'Kaos Ormik & Semot',
  'Jaket UBSI',
  'Tumbler BSI',
  'Badge UBSI',
  'Gelas Mug BSI',
  'Bantal Kampus',
]

// Database Rekomendasi Kata Kunci (Shopee Autocomplete Style)
const defaultSuggestionsDatabase = [
  // Tumbler items
  'tumbler',
  'tumbler ubsi premium',
  'tumbler stainless custom',
  'tumbler semot hitam',
  'tumbler ormik 500ml',
  'tumbler official cyberstore',
  // Baju items (sesuai contoh di gambar Shopee)
  'baju atasan wanita terbaru',
  'baju kaos pria',
  'baju anak perempuan',
  'baju wanita kekinian',
  'baju anak laki laki',
  'baju couple pasangan',
  'baju kaos wanita',
  'baju wanita korean style',
  'baju crop top wanita',
  'baju kaos semot maba',
  'baju kemeja ormik',
  'baju polo ubsi hitam',
  'baju almamater ubsi',
  // Jaket items
  'jaket almamater ubsi',
  'jaket varsity ubsi',
  'jaket bomber semot',
  'jaket hoodie ubsi official',
  // Gelas & Mug
  'gelas mug ubsi',
  'mug keramik custom',
  'mug souvenir semot',
  // Badge & Aksesoris
  'badge ubsi bordir',
  'badge logo ubsi ormik',
  'tote bag ubsi kanvas',
  'lanyard id card ubsi',
  'topi ubsi hitam',
  'pin ubsi logam',
  // Bantal
  'bantal leher ubsi',
  'bantal kampus ubsi',
]

const matchedSuggestions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []

  const dbCategoryNames = popularCategories.value.map((c: any) => String(c.name))
  const allSources = [...dbCategoryNames, ...defaultSuggestionsDatabase]

  const matched = allSources.filter(item => item.toLowerCase().includes(q))
  const results: string[] = []

  // Sertakan kata kunci input pengguna di paling atas jika belum ada persis
  if (!matched.some(m => m.toLowerCase() === q)) {
    results.push(searchQuery.value.trim())
  }
  results.push(...matched)

  return Array.from(new Set(results)).slice(0, 9)
})

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const highlightMatch = (text: string, query: string): string => {
  if (!query) return text
  const escaped = escapeRegex(query)
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<strong>$1</strong>')
}

const loadSearchHistory = () => {
  if (import.meta.client) {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          searchHistory.value = parsed.slice(0, 10)
        }
      }
    } catch (e) {
      console.error('Error loading search history:', e)
    }
  }
}

const saveToSearchHistory = (query: string) => {
  const trimmed = query.trim()
  if (!trimmed) return

  const filtered = searchHistory.value.filter(
    item => item.toLowerCase() !== trimmed.toLowerCase()
  )
  filtered.unshift(trimmed)
  searchHistory.value = filtered.slice(0, 10)

  if (import.meta.client) {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
    } catch (e) {
      console.error('Error saving search history:', e)
    }
  }
}

const removeHistoryItem = (itemToRemove: string) => {
  searchHistory.value = searchHistory.value.filter(item => item !== itemToRemove)
  if (import.meta.client) {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
    } catch (e) {
      console.error('Error updating search history:', e)
    }
  }
}

const clearAllHistory = () => {
  searchHistory.value = []
  if (import.meta.client) {
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY)
    } catch (e) {
      console.error('Error clearing search history:', e)
    }
  }
  toast.info('Riwayat pencarian telah dibersihkan.', {
    title: 'Riwayat Dihapus',
    tag: 'PENCARIAN',
    duration: 3000,
  })
}

const filteredHistory = computed(() => {
  if (!searchQuery.value.trim()) {
    return searchHistory.value
  }
  const q = searchQuery.value.toLowerCase().trim()
  return searchHistory.value.filter(item => item.toLowerCase().includes(q))
})

const executeKeywordSearch = (keyword: string) => {
  // Menampilkan log saat tumbler / keyword diklik (sesuai permintaan user)
  console.log('log tumbler:', keyword)
  console.log('[Search Log] Keyword diklik:', keyword)

  searchQuery.value = keyword
  isSearchDropdownOpen.value = false
  saveToSearchHistory(keyword)
  closeAllMenus()
  router.push({
    path: '/products',
    query: { search: keyword }
  })
}

const executeCategorySearch = (cat: { id: number | string; name: string }) => {
  console.log('log category:', cat.name)
  console.log('log tumbler:', cat.name)
  console.log('[Search Log] Kategori diklik:', cat)

  searchQuery.value = cat.name
  isSearchDropdownOpen.value = false
  saveToSearchHistory(cat.name)
  closeAllMenus()
  router.push({
    path: '/products',
    query: { category_id: String(cat.id) }
  })
}

// Logout Confirmation Modal States
const isLogoutModalOpen = ref(false)
const isLoggingOut = ref(false)

// Auto-close menus on page change
watch(
  () => router.currentRoute.value.fullPath,
  () => {
    closeAllMenus()
  }
)

// Prevent body scroll when mobile drawer or logout modal is open
watch([isMobileMenuOpen, isLogoutModalOpen], ([isDrawerOpen, isModalOpen]) => {
  if (typeof document !== 'undefined') {
    if (isDrawerOpen || isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
})

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
  isMobileSearchOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  isUserMenuOpen.value = false
  isMobileSearchOpen.value = false
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

const toggleMobileSearch = async () => {
  isMobileSearchOpen.value = !isMobileSearchOpen.value
  isUserMenuOpen.value = false
  isMobileMenuOpen.value = false
  if (isMobileSearchOpen.value) {
    await nextTick()
    mobileSearchInput.value?.focus()
  }
}

const closeAllMenus = () => {
  isUserMenuOpen.value = false
  isMobileMenuOpen.value = false
  isMobileSearchOpen.value = false
  isSearchDropdownOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
}

const handleSearch = () => {
  const query = searchQuery.value.trim()
  console.log('log tumbler:', query)
  console.log('[Search Log] Pencarian dieksekusi:', query)
  isSearchDropdownOpen.value = false
  closeAllMenus()

  if (query) {
    saveToSearchHistory(query)
    router.push({
      path: '/products',
      query: { search: query }
    })
  } else {
    router.push('/products')
  }
}

const handleMobileSearch = () => {
  const query = searchQuery.value.trim()
  console.log('log tumbler:', query)
  console.log('[Search Log] Mobile search dieksekusi:', query)
  isMobileSearchOpen.value = false
  isSearchDropdownOpen.value = false
  closeAllMenus()

  if (query) {
    saveToSearchHistory(query)
    router.push({
      path: '/products',
      query: { search: query }
    })
  } else {
    router.push('/products')
  }
}

const handleCartClick = () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Silakan masuk ke akun Anda terlebih dahulu untuk melihat keranjang belanja.', {
      title: 'Perlu Masuk Akun',
      tag: 'AUTENTIKASI',
      duration: 3500,
    })
    router.push('/auth/login')
    return
  }
  cartStore.toggleCart()
}

const openCartFromDrawer = () => {
  closeMobileMenu()
  if (!authStore.isAuthenticated) {
    toast.warning('Silakan masuk ke akun Anda terlebih dahulu untuk melihat keranjang belanja.', {
      title: 'Perlu Masuk Akun',
      tag: 'AUTENTIKASI',
      duration: 3500,
    })
    router.push('/auth/login')
    return
  }
  cartStore.toggleCart()
}

const handleLogout = () => {
  closeAllMenus()
  isLogoutModalOpen.value = true
}

const handleLogoutFromDrawer = () => {
  closeAllMenus()
  isLogoutModalOpen.value = true
}

const closeLogoutModal = () => {
  if (isLoggingOut.value) return
  isLogoutModalOpen.value = false
}

const confirmLogout = async () => {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  const userName = authStore.user?.name
    ? authStore.user.name.split(' ')[0]
    : 'Sobat BSI'

  try {
    await authStore.logout()
    isLogoutModalOpen.value = false

    // Tampilkan Toast Validasi Berhasil Logout via Global Ultra-Premium Toast
    toast.success(`Sampai jumpa kembali, ${userName}.`, {
      title: 'Logout Berhasil',
      duration: 4500,
    })

    // Redirect otomatis ke halaman login setelah logout
    await router.push('/auth/login')
  } catch (error) {
    console.error('Logout error:', error)
    isLogoutModalOpen.value = false
    toast.success('Anda telah berhasil keluar dari sesi akun.', {
      title: 'Logout Berhasil',
      tag: 'SESI DIAMANKAN',
      footerNote: 'Sesi belanja Anda telah diamankan',
      duration: 4500,
    })
    await router.push('/auth/login')
  } finally {
    isLoggingOut.value = false
  }
}
</script>

<style scoped>
.navbar-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  box-shadow: 0 2px 14px rgba(0, 51, 153, 0.06);
  width: 100%;
  max-width: 100vw;
  /* overflow visible to allow absolute dropdown menus to extend outside */
  overflow: visible;
}

/* Announcement Bar (Running Marquee) */
.top-announcement {
  background: linear-gradient(90deg, #002266 0%, #003399 50%, #004aad 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.35rem 0;
  font-size: 0.78rem;
  color: #ffffff;
  overflow: hidden;
  position: relative;
  width: 100%;
  max-width: 100%;
}

.announcement-marquee-wrapper {
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  display: flex;
  align-items: center;
  cursor: pointer;
  mask-image: linear-gradient(to right,
      transparent,
      black 28px,
      black calc(100% - 28px),
      transparent);
  -webkit-mask-image: linear-gradient(to right,
      transparent,
      black 28px,
      black calc(100% - 28px),
      transparent);
}

.announcement-marquee-track {
  display: flex;
  align-items: center;
  width: max-content;
  animation: announcement-marquee-scroll 32s linear infinite;
  will-change: transform;
}

.announcement-marquee-wrapper:hover .announcement-marquee-track,
.announcement-marquee-wrapper:active .announcement-marquee-track {
  animation-play-state: paused;
}

@keyframes announcement-marquee-scroll {
  0% {
    transform: translate3d(0, 0, 0);
  }

  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

.announcement-item {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  white-space: nowrap;
  padding: 0 1.25rem;
  flex-shrink: 0;
}

.announcement-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  background: rgba(245, 158, 11, 0.22);
  border: 1px solid #fbbf24;
  color: #fef08a;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #fbbf24;
  border-radius: 50%;
  box-shadow: 0 0 8px #fbbf24;
  animation: pulse-glow 1.5s infinite;
}

@keyframes pulse-glow {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.4;
    transform: scale(1.3);
  }
}

.announcement-text {
  font-weight: 500;
  font-size: 0.78rem;
  color: inherit;
  white-space: nowrap;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.announcement-text :deep(strong) {
  color: inherit;
  font-weight: 800;
}

.announcement-info {
  font-weight: 600;
  color: inherit;
  opacity: 0.85;
  font-size: 0.75rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.announcement-separator {
  color: #f59e0b;
  font-size: 0.75rem;
  margin-left: 0.5rem;
  opacity: 0.8;
}

/* Main Nav Layout */
.main-nav {
  position: relative;
  padding: 0.75rem 0;
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

/* Hamburger Button */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 38px;
  height: 38px;
  padding: 8px;
  border-radius: var(--radius-sm);
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #003399;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.hamburger-btn:hover {
  background: #eff6ff;
  border-color: #004aad;
}

.hamburger-line {
  display: block;
  width: 100%;
  height: 2px;
  background: #003399;
  border-radius: 2px;
  transition: all 0.25s ease;
}

.hamburger-btn.is-active .hamburger-line:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-btn.is-active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-btn.is-active .hamburger-line:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Brand Logo */
.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  min-width: 0;
  flex-shrink: 1;
}

.logo-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.1);
  flex-shrink: 0;
  overflow: hidden;
  padding: 2px;
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 7px;
}

.logo-svg {
  width: 20px;
  height: 20px;
  stroke: #f59e0b;
  fill: rgba(245, 158, 11, 0.25);
}

.logo-text-group {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.logo-main {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: -0.01em;
  color: #0f172a;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-bsi {
  color: #003399;
  font-weight: 900;
}

.text-store {
  color: #004aad;
}

.logo-sub {
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  color: #64748b;
  font-weight: 700;
  white-space: nowrap;
}

/* Desktop Search Bar */
.nav-search-wrapper {
  flex: 1;
  max-width: 420px;
  min-width: 180px;
}

.search-form {
  position: relative;
  width: 100%;
}

.nav-search-input {
  width: 100%;
  padding: 0.6rem 2.6rem 0.6rem 1.1rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-full);
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.25s ease;
}

.nav-search-input:focus {
  border-color: #004aad;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.15);
  background: #ffffff;
}

.nav-search-input::placeholder {
  color: #94a3b8;
}

.search-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #004aad;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-btn:hover {
  background: #003399;
  transform: translateY(-50%) scale(1.05);
}

.desktop-clear-search-btn {
  position: absolute;
  right: 38px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #cbd5e1;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
  padding: 0;
  transition: all 0.15s ease;
}

.desktop-clear-search-btn:hover {
  background: #94a3b8;
  color: #ffffff;
}

/* ========================================================
   Shopee-Style Search History & Autocomplete Dropdown
   ======================================================== */
.search-history-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(0, 0, 0, 0.04);
  z-index: 1000;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.search-history-dropdown.is-autocomplete-mode {
  padding: 0.35rem 0;
  gap: 0;
  max-height: 420px;
  overflow-y: auto;
}

/* 1. Baris Cari Toko (Shopee Style) */
.search-suggest-store-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
  border-bottom: 1px solid #f1f5f9;
}

.search-suggest-store-row:hover {
  background: #fff7ed;
}

.store-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #ffedd5;
  flex-shrink: 0;
}

.suggest-store-text {
  font-size: 0.875rem;
  color: #1e293b;
}

.suggest-store-text strong {
  color: #ea580c;
  font-weight: 700;
}

/* 2. Daftar Autocomplete Items (Shopee Style dengan bold prefix) */
.search-suggest-list {
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0;
}

.search-suggest-item {
  display: flex;
  align-items: center;
  padding: 0.65rem 1rem;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  user-select: none;
}

.search-suggest-item:hover {
  background: #f8fafc;
}

.suggest-item-text {
  font-size: 0.875rem;
  color: #334155;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggest-item-text strong {
  font-weight: 700;
  color: #0f172a;
}

/* Dark Mode Autocomplete Styles */
html.dark .search-history-dropdown {
  background: #1e293b;
  border-color: #334155;
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.5);
}

html.dark .search-suggest-store-row {
  border-bottom-color: #334155;
}

html.dark .search-suggest-store-row:hover {
  background: #334155;
}

html.dark .suggest-store-text {
  color: #f1f5f9;
}

html.dark .suggest-store-text strong {
  color: #fb923c;
}

html.dark .search-suggest-item:hover {
  background: #334155;
}

html.dark .suggest-item-text {
  color: #cbd5e1;
}

html.dark .suggest-item-text strong {
  color: #ffffff;
}

.search-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.search-action-row:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.search-action-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
  color: #1e3a8a;
}

.search-action-text strong {
  color: #003399;
}

/* History Section */
.history-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-section-header,
.popular-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-title,
.popular-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
}

.btn-clear-history {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-clear-history:hover {
  color: #ef4444;
  background: #fee2e2;
}

.history-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.history-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  color: #334155;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

.history-chip:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #003399;
  transform: translateY(-1px);
}

.chip-text {
  max-width: 220px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-remove-btn {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #cbd5e1;
  border: none;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.chip-remove-btn:hover {
  background: #ef4444;
  color: #ffffff;
  transform: scale(1.15);
}

/* Popular Searches Section */
.popular-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.popular-section.has-border-top {
  border-top: 1px dashed #e2e8f0;
  padding-top: 0.65rem;
}

.popular-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.popular-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  color: #1e293b;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.popular-chip:hover {
  background: #003399;
  border-color: #002266;
  color: #ffffff;
  box-shadow: 0 3px 8px rgba(0, 51, 153, 0.25);
  transform: translateY(-1px);
}

.popular-chip:hover svg {
  color: #fde047 !important;
}

/* Transitions */
.search-dropdown-pop-enter-active,
.search-dropdown-pop-leave-active {
  transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-dropdown-pop-enter-from,
.search-dropdown-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

/* Mobile Search Dropdown Container */
.mobile-search-dropdown-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.85rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

/* Nav Actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.desktop-nav-links {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover,
.nav-link.active {
  color: #003399;
  background: #eff6ff;
}

.nav-link-maba {
  color: #b45309;
}

.maba-indicator {
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  color: #b45309;
}

/* Action Icon Buttons */
.action-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  color: #003399;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.action-icon-btn:hover,
.action-icon-btn.is-active {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
}

.mobile-search-btn {
  display: none;
}

/* Customer Service Nav Button */
.cs-nav-trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.85rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-full);
  color: #1e293b;
  font-weight: 700;
  font-size: 0.825rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.cs-nav-trigger-btn:hover {
  background: #eff6ff;
  border-color: #004aad;
  color: #003399;
  box-shadow: 0 2px 10px rgba(0, 74, 173, 0.12);
}

.cs-btn-label {
  display: inline;
}

@media (max-width: 1024px) {
  .cs-nav-trigger-btn .cs-btn-label {
    display: none;
  }

  .cs-nav-trigger-btn {
    padding: 0.45rem;
    width: 38px;
    height: 38px;
    justify-content: center;
  }
}

/* Cart Button */
.cart-trigger-btn {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  border: 1px solid #002266;
  border-radius: var(--radius-full);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.25);
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.cart-trigger-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
  box-shadow: 0 6px 18px rgba(0, 51, 153, 0.35);
  transform: translateY(-1px);
}

.cart-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.cart-bounce-anim {
  animation: cartWiggle 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes cartWiggle {
  15% {
    transform: scale(1.25) rotate(-12deg);
  }

  30% {
    transform: scale(1.25) rotate(12deg);
  }

  45% {
    transform: scale(1.15) rotate(-6deg);
  }

  60% {
    transform: scale(1.1) rotate(4deg);
  }

  75% {
    transform: scale(1.05) rotate(-2deg);
  }

  100% {
    transform: scale(1) rotate(0);
  }
}

.cart-counter-badge {
  position: absolute;
  top: -9px;
  right: -11px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 900;
  padding: 1.5px 6px;
  border-radius: var(--radius-full);
  min-width: 19px;
  height: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 1.5px solid #ffffff;
  pointer-events: none;
}

/* Badge Pop Spring Animation */
.badge-pop-enter-active {
  animation: badgePopAnim 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.badge-pop-leave-active {
  animation: badgePopAnim 0.2s cubic-bezier(0.4, 0, 1, 1) reverse;
}

@keyframes badgePopAnim {
  0% {
    transform: scale(0);
    opacity: 0;
  }

  50% {
    transform: scale(1.4);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* User Menu Dropdown */
.user-menu-wrapper {
  position: relative;
}

.user-avatar-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.75rem;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: var(--radius-full);
  color: #003399;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-avatar-btn:hover {
  border-color: #003399;
  background: #dbeafe;
}

.user-avatar-initial {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar-nav-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid #bfdbfe;
}

.drawer-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-name-label {
  font-size: 0.85rem;
  font-weight: 700;
}

.user-chevron {
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}

.user-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 225px;
  padding: 0.65rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  z-index: 150;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16),
    0 4px 12px rgba(0, 51, 153, 0.08);
}

.user-dropdown-header {
  display: flex;
  flex-direction: column;
  padding: 0.4rem 0.5rem 0.6rem;
  border-bottom: 1px solid #f1f5f9;
  gap: 0.35rem;
}

.user-full-name {
  font-weight: 700;
  font-size: 0.88rem;
  color: #0f172a;
}

.user-email {
  font-size: 0.72rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-member-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #003399;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  width: fit-content;
  margin-top: 2px;
}

.member-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.user-dropdown-links {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.dropdown-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.dropdown-link svg {
  width: 14px;
  height: 14px;
  min-width: 14px;
  flex-shrink: 0;
}

.dropdown-link:hover {
  background: #eff6ff;
  color: #003399;
}

.text-coral {
  color: #e11d48 !important;
}

.text-bsi-blue {
  color: #003399;
}

.btn-login {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.95rem;
  font-size: 0.85rem;
  font-weight: 700;
  border-radius: var(--radius-full);
}

.btn-login svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Mobile Expandable Search Bar */
.mobile-search-bar {
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.65rem 0;
  box-shadow: 0 4px 15px rgba(0, 51, 153, 0.08);
}

.mobile-search-form {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
  pointer-events: none;
}

.mobile-search-input {
  flex: 1;
  padding: 0.65rem 2.2rem 0.65rem 2.4rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-full);
  color: #0f172a;
  font-size: 0.875rem;
  font-weight: 500;
}

.mobile-search-input:focus {
  background: #ffffff;
  border-color: #004aad;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 74, 173, 0.15);
}

.clear-search-btn {
  position: absolute;
  right: 70px;
  color: #94a3b8;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  color: #0f172a;
}

.btn-search-go {
  padding: 0.6rem 1.1rem;
  background: #003399;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.btn-search-go:hover {
  background: #004aad;
}

/* Mobile Off-Canvas Drawer (Teleported) */
.mobile-drawer-backdrop {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 9998;
}

.mobile-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 320px;
  max-width: 85vw;
  height: 100vh;
  height: 100dvh;
  background: #ffffff;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: 10px 0 40px rgba(0, 51, 153, 0.25);
  overflow-y: auto;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid #f1f5f9;
  background: #f8fafc;
}

.drawer-logo {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.drawer-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drawer-close-btn:hover {
  background: #fee2e2;
  color: #ef4444;
  border-color: #fca5a5;
}

.drawer-user-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f7ff 100%);
  border-bottom: 1px solid #bfdbfe;
}

.drawer-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #003399 0%, #004aad 100%);
  color: #ffffff;
  font-weight: 800;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 51, 153, 0.25);
  flex-shrink: 0;
}

.drawer-user-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-user-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.drawer-user-email {
  font-size: 0.75rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-content {
  flex: 1;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.drawer-section-title {
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #94a3b8;
  margin-top: 0.5rem;
  margin-bottom: 0.35rem;
}

.drawer-links {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: var(--radius-sm);
  color: #1e293b;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
}

.drawer-nav-item:hover,
.drawer-nav-item.is-active {
  background: #eff6ff;
  color: #003399;
}

.drawer-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.drawer-maba-item {
  background: #fffbeb;
  border: 1px solid #fef3c7;
}

.drawer-maba-item:hover {
  background: #fef3c7;
}

.drawer-maba-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.drawer-badge-gold {
  font-size: 0.68rem;
  font-weight: 800;
  color: #b45309;
}

.drawer-cart-item {
  justify-content: flex-start;
}

.drawer-count-badge {
  margin-left: auto;
  background: #003399;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.drawer-guest-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.25rem;
}

.drawer-guest-desc {
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.45;
}

.btn-drawer-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.65rem 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
}

.drawer-footer {
  padding: 1.1rem 1.25rem;
  border-top: 1px solid #f1f5f9;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.drawer-footer-brand {
  font-size: 0.8rem;
  color: #0f172a;
}

.drawer-footer-sub {
  font-size: 0.65rem;
  color: #64748b;
  font-weight: 600;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-drawer-enter-active,
.slide-drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-drawer-enter-from,
.slide-drawer-leave-to {
  transform: translateX(-100%);
}

.slide-search-enter-active,
.slide-search-leave-active {
  transition: all 0.25s ease;
}

.slide-search-enter-from,
.slide-search-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */

/* 1. Large Screen / Desktop (min-width: 1025px) */
@media (min-width: 1025px) {
  .hamburger-btn {
    display: none;
  }

  .mobile-search-btn {
    display: none;
  }
}

/* 2. Tablets & Small Laptops (769px to 1024px) */
@media (max-width: 1024px) {
  .nav-search-wrapper {
    max-width: 280px;
  }

  .desktop-nav-links {
    display: none;
  }

  .hamburger-btn {
    display: flex;
  }

  .logo-sub {
    display: none;
  }
}

/* 3. Mobile Landscape & Tablets Portrait (max-width: 768px) */
@media (max-width: 768px) {
  .top-announcement {
    padding: 0.3rem 0;
    line-height: 1.35;
  }

  .announcement-item {
    gap: 0.65rem;
    padding: 0 1rem;
  }

  .announcement-badge {
    font-size: 0.68rem;
    padding: 1px 7px;
  }

  .announcement-text {
    font-size: 0.73rem;
  }

  .announcement-info {
    font-size: 0.7rem;
  }

  .nav-container {
    padding: 0 12px;
    gap: 0.5rem;
  }

  .nav-left {
    flex: 1;
    min-width: 0;
    gap: 0.45rem;
  }

  .brand-logo {
    gap: 0.45rem;
    min-width: 0;
    flex-shrink: 1;
  }

  .logo-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 9px;
  }

  .logo-text-group {
    min-width: 0;
    overflow: hidden;
  }

  .logo-main {
    font-size: clamp(0.85rem, 3.8vw, 1.15rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.15;
  }

  .logo-sub {
    display: none;
  }

  .nav-search-wrapper {
    display: none;
  }

  .nav-actions {
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .mobile-search-btn {
    display: flex;
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .hamburger-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    padding: 7px;
  }

  /* Jadikan Cart Button circular icon rapi agar tidak terpotong di tepi layar HP */
  .cart-trigger-btn {
    width: 36px;
    height: 36px;
    min-width: 36px;
    padding: 0;
    border-radius: 50%;
    justify-content: center;
  }

  .cart-btn-label {
    display: none;
  }

  .cart-counter-badge {
    top: -5px;
    right: -6px;
    min-width: 17px;
    height: 17px;
    font-size: 0.62rem;
    padding: 1px 4px;
  }

  /* Notifikasi trigger button di mobile dibuat compact serasi */
  :deep(.notif-trigger-btn) {
    width: 36px;
    height: 36px;
    min-width: 36px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
    background: #f8fafc;
    border: 1.5px solid #cbd5e1;
  }

  :deep(.notif-trigger-btn:hover),
  :deep(.notif-trigger-btn.is-active) {
    background: #eff6ff;
    border-color: #004aad;
  }

  .user-name-label,
  .user-chevron {
    display: none;
  }

  .user-avatar-btn {
    padding: 0;
    width: 36px;
    height: 36px;
    min-width: 36px;
    justify-content: center;
    border-radius: 50%;
  }

  .login-btn-label {
    display: none;
  }

  .btn-login {
    display: none;
  }
}

/* 4. Small Mobile Phones (max-width: 480px) */
@media (max-width: 480px) {
  .nav-container {
    padding: 0 10px;
    gap: 0.35rem;
  }

  .nav-left {
    gap: 0.35rem;
  }

  .brand-logo {
    gap: 0.35rem;
  }

  .logo-icon-box {
    width: 32px;
    height: 32px;
    border-radius: 7px;
  }

  .logo-svg {
    width: 17px;
    height: 17px;
  }

  .logo-main {
    font-size: clamp(0.78rem, 3.5vw, 0.95rem);
  }

  .announcement-item {
    gap: 0.5rem;
    padding: 0 0.65rem;
  }

  .announcement-badge {
    font-size: 0.62rem;
    padding: 1px 5px;
  }

  .announcement-text {
    font-size: 0.68rem;
  }

  .announcement-info {
    font-size: 0.65rem;
  }

  .hamburger-btn,
  .action-icon-btn,
  .cart-trigger-btn,
  :deep(.notif-trigger-btn),
  .user-avatar-btn {
    width: 34px;
    height: 34px;
    min-width: 34px;
  }

  .nav-actions {
    gap: 0.25rem;
  }
}

/* 5. Extra Small Devices (max-width: 360px) */
@media (max-width: 360px) {
  .nav-container {
    padding: 0 6px;
    gap: 0.25rem;
  }

  .logo-icon-box {
    width: 30px;
    height: 30px;
    border-radius: 6px;
  }

  .logo-main {
    font-size: 0.74rem;
  }

  .hamburger-btn,
  .action-icon-btn,
  .cart-trigger-btn,
  :deep(.notif-trigger-btn),
  .user-avatar-btn {
    width: 31px;
    height: 31px;
    min-width: 31px;
  }

  .nav-actions {
    gap: 0.2rem;
  }
}

/* ==========================================================================
   ULTRA-PREMIUM LOGOUT CONFIRMATION MODAL & VALIDATION TOAST NOTIFICATION
   ========================================================================== */

/* 1. Modal Backdrop with Glassmorphism & Cyber Depth */
.logout-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: radial-gradient(circle at 50% 30%,
      rgba(0, 51, 153, 0.28) 0%,
      rgba(15, 23, 42, 0.82) 100%);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  perspective: 1200px;
}

/* 2. Simple Confirmation Modal */
.simple-confirm-modal {
  max-width: 400px;
  padding: 1.75rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(226, 232, 240, 0.95);
  position: relative;
}

.simple-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.simple-modal-close:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.simple-modal-icon-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #fff1f2;
  border: 1px solid #ffe4e6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e11d48;
}

.simple-modal-content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.simple-modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.simple-modal-desc {
  font-size: 0.925rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.simple-modal-actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  margin-top: 0.35rem;
}

.btn-simple-cancel,
.btn-simple-logout {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  font-size: 0.925rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-simple-cancel {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-simple-cancel:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-simple-logout {
  background: #e11d48;
  color: #ffffff;
  border: 1px solid #be123c;
}

.btn-simple-logout:hover:not(:disabled) {
  background: #be123c;
}

.btn-simple-cancel:disabled,
.btn-simple-logout:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.logout-modal-card {
  width: 100%;
  max-width: 470px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%);
  border-radius: 26px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 30px 80px -15px rgba(15, 23, 42, 0.4),
    0 10px 30px -5px rgba(225, 29, 72, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.9) inset;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Ambient Laser Glow Accent Line at top */
.logout-modal-lightbar {
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg,
      #e11d48 0%,
      #f43f5e 35%,
      #f59e0b 70%,
      #004aad 100%);
  box-shadow: 0 0 14px rgba(225, 29, 72, 0.6);
}

.modal-ambient-glow {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle,
      rgba(225, 29, 72, 0.08) 0%,
      transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* 3. Modal Header */
.logout-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.75rem 1.75rem 0.5rem 1.75rem;
  position: relative;
  z-index: 1;
}

/* Hero Hologram / Glowing Emblem */
.logout-hero-emblem {
  position: relative;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emblem-halo-pulse {
  position: absolute;
  inset: -6px;
  border-radius: 22px;
  background: radial-gradient(circle,
      rgba(225, 29, 72, 0.22) 0%,
      rgba(225, 29, 72, 0.04) 70%,
      transparent 100%);
  animation: emblemHaloPulse 3s ease-in-out infinite alternate;
}

@keyframes emblemHaloPulse {
  0% {
    transform: scale(0.92);
    opacity: 0.6;
  }

  100% {
    transform: scale(1.08);
    opacity: 1;
  }
}

.emblem-inner-shield {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%);
  border: 1.5px solid #fecdd3;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 18px rgba(225, 29, 72, 0.16);
}

.emblem-micro-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #fecdd3;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

/* Close Button */
.logout-modal-close-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.logout-modal-close-btn:hover:not(:disabled) {
  color: #0f172a;
  background: #ffffff;
  border-color: #cbd5e1;
  transform: rotate(90deg) scale(1.05);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.logout-modal-close-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 4. Modal Body */
.logout-modal-body {
  padding: 0.75rem 1.75rem 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.logout-modal-title-group {
  margin-bottom: 1.15rem;
}

.logout-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.7rem;
  font-weight: 800;
  color: #e11d48;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.65rem;
  box-shadow: 0 2px 8px rgba(225, 29, 72, 0.08);
}

.logout-badge-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e11d48;
  box-shadow: 0 0 6px #e11d48;
  animation: pulseDot 1.8s infinite;
}

@keyframes pulseDot {
  0% {
    transform: scale(0.9);
    opacity: 1;
  }

  50% {
    transform: scale(1.3);
    opacity: 0.4;
  }

  100% {
    transform: scale(0.9);
    opacity: 1;
  }
}

.logout-modal-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.45rem;
  letter-spacing: -0.02em;
}

.logout-modal-desc {
  font-size: 0.885rem;
  color: #64748b;
  line-height: 1.58;
}

/* 5. User Profile Glass Card */
.logout-user-card {
  display: flex;
  align-items: center;
  gap: 0.95rem;
  padding: 0.85rem 1rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  margin-bottom: 1rem;
  transition: all 0.25s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
}

.logout-user-card:hover {
  border-color: #cbd5e1;
  background: #ffffff;
  box-shadow: 0 6px 20px rgba(0, 51, 153, 0.06);
}

.user-card-avatar-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-card-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffffff;
  box-shadow: 0 3px 10px rgba(0, 51, 153, 0.15);
}

.user-card-avatar-initial {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #003399 0%, #004aad 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  border: 2px solid #ffffff;
  box-shadow: 0 3px 10px rgba(0, 51, 153, 0.15);
}

.user-card-status-dot {
  position: absolute;
  bottom: 0px;
  right: 0px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.user-card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.user-card-name-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.user-card-name {
  font-size: 0.925rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-card-verified-badge {
  display: inline-flex;
  align-items: center;
  color: #004aad;
  flex-shrink: 0;
}

.user-card-email {
  font-size: 0.775rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.user-card-tags {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.user-tag-role {
  font-size: 0.675rem;
  font-weight: 700;
  color: #004aad;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 0.1rem 0.5rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.user-tag-session {
  font-size: 0.675rem;
  font-weight: 700;
  color: #059669;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  padding: 0.1rem 0.5rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

/* 6. Security & Data Retention Perks Grid */
.logout-perks-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.logout-perk-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
}

.perk-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.perk-icon-cart {
  background: #eff6ff;
  border: 1px solid #dbeafe;
}

.perk-icon-shield {
  background: #ecfdf5;
  border: 1px solid #d1fae5;
}

.perk-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.perk-title {
  font-size: 0.775rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.perk-desc {
  font-size: 0.685rem;
  color: #64748b;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 7. Modal Actions */
.logout-modal-actions {
  display: flex;
  gap: 0.85rem;
  padding: 1.25rem 1.75rem 1.75rem 1.75rem;
  background: #fbfcfe;
  border-top: 1px solid #f1f5f9;
}

.btn-cancel-logout {
  flex: 1;
  padding: 0.85rem 1rem;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 14px;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #334155;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-cancel-logout:hover:not(:disabled) {
  background: #f8fafc;
  color: #0f172a;
  border-color: #94a3b8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.btn-cancel-logout:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-logout-confirm {
  flex: 1.35;
  padding: 0.85rem 1.15rem;
  font-size: 0.9rem;
  font-weight: 800;
  border-radius: 14px;
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%);
  color: #ffffff;
  border: none;
  box-shadow: 0 8px 24px -4px rgba(225, 29, 72, 0.42),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-logout-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #fb7185 0%, #e11d48 50%, #9f1239 100%);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -4px rgba(225, 29, 72, 0.52),
    0 0 0 1px rgba(255, 255, 255, 0.3) inset;
}

.btn-logout-confirm:active:not(:disabled) {
  transform: translateY(0);
}

.btn-logout-confirm:disabled {
  opacity: 0.75;
  cursor: not-allowed;
  transform: none;
}

.btn-shimmer-effect {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.25),
      transparent);
  transform: skewX(-20deg);
  animation: btnShimmer 3.5s infinite;
}

@keyframes btnShimmer {
  0% {
    left: -100%;
  }

  35% {
    left: 160%;
  }

  100% {
    left: 160%;
  }
}

/* 8. Modal Enter & Leave Animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .logout-modal-card {
  animation: modalPopIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.modal-fade-leave-active .logout-modal-card {
  animation: modalPopOut 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes modalPopIn {
  0% {
    opacity: 0;
    transform: scale(0.92) translateY(18px) rotateX(4deg);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0) rotateX(0deg);
  }
}

@keyframes modalPopOut {
  0% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  100% {
    opacity: 0;
    transform: scale(0.94) translateY(12px);
  }
}



/* 10. Responsive Adjustments */
@media (max-width: 640px) {
  .logout-modal-backdrop {
    padding: 1rem;
    align-items: flex-end;
  }

  .logout-modal-card {
    border-radius: 22px 22px 16px 16px;
    max-width: 100%;
  }

  .logout-modal-header {
    padding: 1.35rem 1.25rem 0.5rem 1.25rem;
  }

  .logout-modal-body {
    padding: 0.5rem 1.25rem 1.25rem 1.25rem;
  }

  .logout-modal-actions {
    padding: 1rem 1.25rem 1.5rem 1.25rem;
    flex-direction: column-reverse;
    gap: 0.65rem;
  }

  .btn-cancel-logout,
  .btn-logout-confirm {
    width: 100%;
    padding: 0.85rem 1rem;
  }

  .logout-perks-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}
</style>
