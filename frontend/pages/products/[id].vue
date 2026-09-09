<template>
  <div class="product-detail-page container">
    <!-- Breadcrumbs -->
    <div class="breadcrumb">
      <NuxtLink to="/">Beranda</NuxtLink>
      <span>/</span>
      <NuxtLink to="/products">Katalog</NuxtLink>
      <span>/</span>
      <span v-if="product?.category">{{ product.category.name }}</span>
      <span v-if="product?.category">/</span>
      <span class="current">{{ product?.name || 'Detail Produk' }}</span>
    </div>

    <!-- Loading State with CyberLoader -->
    <div v-if="pending" class="detail-loading-box cyber-card">
      <CyberLoader text="MEMUAT DETAIL PRODUK..."
        subtext="Mengambil spesifikasi teknis, stok, dan galeri resmi dari server..." size="lg" />
    </div>

    <!-- Product Not Found -->
    <div v-else-if="!product" class="not-found-box cyber-card">
      <div class="empty-icon">
        <Icon name="lucide:package-x" class="w-12 h-12 text-slate-400" />
      </div>
      <h2>Produk Tidak Ditemukan</h2>
      <p>Produk yang Anda cari mungkin sudah tidak aktif atau tautan tidak valid.</p>
      <NuxtLink to="/products" class="btn btn-primary">Kembali ke Katalog</NuxtLink>
    </div>

    <!-- Main Detail Content -->
    <div v-else class="detail-wrapper">
      <div class="detail-main-grid">
        <!-- Left: Image Gallery -->
        <div class="gallery-col">
          <!-- Main Image Frame with Slide Controls & Zoom Button -->
          <div class="main-image-frame cyber-card" @click="openLightbox" @touchstart.passive="handleTouchStart"
            @touchend.passive="handleTouchEnd" title="Klik untuk melihat foto ukuran penuh">
            <img :src="getImageUrl(activeImage)" :alt="product.name" class="active-product-img"
              @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }" />

            <!-- Badges -->
            <!-- <div class="gallery-badges">
              <span v-if="discountPercent > 0" class="discount-badge badge badge-coral">
                Hemat {{ discountPercent }}%
              </span>
              <span v-if="product.is_recommended" class="pick-badge badge badge-cyan">
                <Icon name="lucide:zap" class="w-3.5 h-3.5 inline mr-1" />
                CYBER PICK
              </span>
            </div> -->

            <!-- Counter Pill -->
            <div v-if="allImages.length > 1" class="image-counter-pill">
              {{ activeIndex + 1 }} / {{ allImages.length }}
            </div>

            <!-- Zoom Button -->
            <!-- <div class="zoom-indicator-btn">
              <Icon name="lucide:zoom-in" class="w-4 h-4" />
              <span>Perbesar Foto</span>
            </div> -->

            <!-- Main Slide Arrows (prev/next) -->
            <button v-if="allImages.length > 1" type="button" class="main-slide-nav nav-prev" @click.stop="prevImage"
              title="Foto Sebelumnya" aria-label="Foto Sebelumnya">
              <Icon name="lucide:chevron-left" class="w-5 h-5" />
            </button>
            <button v-if="allImages.length > 1" type="button" class="main-slide-nav nav-next" @click.stop="nextImage"
              title="Foto Berikutnya" aria-label="Foto Berikutnya">
              <Icon name="lucide:chevron-right" class="w-5 h-5" />
            </button>
          </div>

          <!-- Thumbnail Slider Row below Main Image -->
          <div v-if="allImages.length > 1" class="thumbnail-slider-wrapper">
            <button type="button" class="thumb-arrow-btn thumb-arrow-prev" @click="prevImage" title="Foto Sebelumnya"
              aria-label="Foto Sebelumnya">
              <Icon name="lucide:chevron-left" class="w-4 h-4" />
            </button>

            <div ref="thumbTrack" class="thumbnails-track">
              <button v-for="(img, idx) in allImages" :key="idx" type="button" @click="selectImage(img, idx)"
                :class="['thumb-btn', { active: activeImage === img }]" :title="`Pilih Foto ${idx + 1}`">
                <img :src="getImageUrl(img)" :alt="`Thumbnail ${idx + 1}`" class="thumb-img" />
              </button>
            </div>

            <button type="button" class="thumb-arrow-btn thumb-arrow-next" @click="nextImage" title="Foto Berikutnya"
              aria-label="Foto Berikutnya">
              <Icon name="lucide:chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Right: Info & Purchase Controls -->
        <div class="info-col cyber-card">
          <!-- Category & SKU -->
          <div class="meta-badge-row">
            <span class="badge badge-cyan">{{ product.category?.name || 'Tech' }}</span>
            <span v-if="product.sku" class="sku-tag">SKU: {{ product.sku }}</span>
          </div>

          <!-- Title -->
          <h1 class="detail-title">{{ product.name }}</h1>

          <!-- Ratings & Reviews summary -->
          <div class="rating-summary-row">
            <div class="stars-box">
              <svg class="star-icon-solid" viewBox="0 0 24 24" width="16" height="16">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="#f59e0b" stroke="#d97706" stroke-width="0.5" />
              </svg>
              <span class="rating-val">{{ product.rating || '5.0' }}</span>
            </div>
            <span class="dot-separator">•</span>
            <NuxtLink :to="`/products/${product.id}/reviews`" class="review-link is-link"
              title="Buka Halaman Penilaian Produk & Ulasan Pembeli">
              <span>{{ product.reviews_count || reviews.length || 0 }} Ulasan Pelanggan</span>
              <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 inline ml-0.5 text-slate-400" />
            </NuxtLink>
            <span class="dot-separator">•</span>
            <span :class="['stock-pill', product.stock > 0 ? 'in-stock' : 'out-stock']">
              {{ product.stock > 0 ? `Stok: ${product.stock} unit` : 'Stok Habis' }}
            </span>
          </div>

          <!-- Price Row -->
          <div class="price-box">
            <div class="price-main">{{ formatRupiah(product.price) }}</div>
            <div v-if="product.original_price && product.original_price > product.price" class="price-strike">
              {{ formatRupiah(product.original_price) }}
            </div>
          </div>

          <!-- Event Maba Notice & NIM Input -->
          <div v-if="product.is_event_maba" class="maba-box">
            <div class="maba-badge-row">
              <span class="badge badge-purple"
                style="font-size: 11px; padding: 4px 10px; font-weight: 800; background: rgba(139, 92, 246, 0.25); border: 1px solid rgba(139, 92, 246, 0.5); color: #c4b5fd;">
                <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1" />
                PRODUK KHUSUS ORMIK & SEMOT 2026
              </span>
            </div>
            <h4 class="maba-title">Ketentuan Warna Berdasarkan NIM Mahasiswa</h4>
            <p class="maba-desc">
              Panitia menetapkan warna seragam wajib mengikuti digit terakhir NIM Anda:
              <br />
              • Digit Terakhir <strong>Ganjil (1, 3, 5, 7, 9)</strong>: Warna <strong>{{ product.maba_color_ganjil ||
                'Putih' }}</strong>
              <br />
              • Digit Terakhir <strong>Genap (0, 2, 4, 6, 8)</strong>: Warna <strong>{{ product.maba_color_genap ||
                'Biru' }}</strong>
            </p>

            <div class="maba-input-group">
              <label class="maba-label">Masukkan NIM Anda:</label>
              <div class="maba-input-field">
                <input v-model="nimInput" type="text" maxlength="15" placeholder="Contoh: 12240123"
                  class="input-cyber nim-field" :class="{ 'border-error': nimError }" />
                <span v-if="nimLastDigit !== null && isNimValid" class="nim-status-pill"
                  :class="isNimOdd ? 'pill-odd' : 'pill-even'">
                  Digit Terakhir: {{ nimLastDigit }} ({{ isNimOdd ? `Ganjil ➔ ${product.maba_color_ganjil || 'Putih'}` :
                    `Genap ➔ ${product.maba_color_genap || 'Biru'}` }})
                </span>
              </div>
              <span v-if="nimError" class="nim-error-msg">{{ nimError }}</span>
              <span v-else-if="cleanNimDigits.length > 0 && cleanNimDigits.length < 8" class="nim-hint-msg">
                <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 inline mr-1" />
                Masukkan minimal 8 digit angka NIM lengkap.
              </span>
            </div>
          </div>

          <!-- Options: Sizes -->
          <div v-if="product.sizes && product.sizes.length > 0" class="option-group">
            <div class="option-header-row">
              <label class="option-label">Pilih Ukuran / Varian:</label>
              <button v-if="sizeChartImage" type="button" class="size-guide-trigger-btn" @click="openSizeChartModal"
                title="Lihat Foto Panduan Ukuran">
                <Icon name="lucide:ruler" class="w-3.5 h-3.5 inline mr-1 text-cyan" />
                <span>Panduan Ukuran</span>
              </button>
            </div>
            <div class="options-pills">
              <button v-for="size in product.sizes" :key="size" @click="selectedSize = size"
                :class="['option-pill', { active: selectedSize === size }]">
                {{ size }}
              </button>
            </div>
          </div>

          <!-- Options: Colors -->
          <div v-if="product.colors && product.colors.length > 0" class="option-group">
            <div class="option-header-row">
              <label class="option-label">Pilih Warna:</label>
              <span v-if="product.is_event_maba && isNimValid" class="color-locked-hint">
                <Icon name="lucide:lock" class="w-3.5 h-3.5 inline mr-1" />
                Terkunci otomatis sesuai NIM Anda
              </span>
              <span v-else-if="product.is_event_maba && !isNimValid" class="color-locked-hint" style="color: #f59e0b;">
                <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 inline mr-1" />
                Masukkan NIM di atas untuk mengunci warna
              </span>
            </div>
            <div class="options-pills">
              <button v-for="color in product.colors" :key="getColorName(color)"
                @click="!product.is_event_maba ? selectedColor = getColorName(color) : null" :class="[
                  'option-pill',
                  { active: selectedColor === getColorName(color) },
                  { 'pill-locked': product.is_event_maba && selectedColor === getColorName(color) },
                  { 'pill-disabled': product.is_event_maba && selectedColor !== getColorName(color) }
                ]" :disabled="product.is_event_maba && selectedColor !== getColorName(color)"
                :title="product.is_event_maba && selectedColor !== getColorName(color) ? 'Warna ini tidak sesuai ketentuan digit NIM Anda' : getColorName(color)">
                {{ getColorName(color) }}
                <span v-if="product.is_event_maba && selectedColor === getColorName(color)"
                  style="font-size: 10px; margin-left: 4px;">✓ (Otomatis)</span>
                <span v-else-if="product.is_event_maba && selectedColor !== getColorName(color)"
                  style="font-size: 10px; margin-left: 4px;">
                  <Icon name="lucide:lock" class="w-2.5 h-2.5 inline" />
                </span>
              </button>
            </div>
          </div>

          <!-- Quantity & Purchase Actions -->
          <div class="purchase-box">
            <div class="qty-select-group">
              <label class="option-label">Jumlah:</label>
              <div class="qty-control">
                <button @click="decreaseQty" :disabled="quantity <= 1" class="qty-btn">-</button>
                <span class="qty-number">{{ quantity }}</span>
                <button @click="increaseQty" :disabled="quantity >= product.stock" class="qty-btn">+</button>
              </div>
            </div>

            <div class="action-buttons-group">
              <!-- Chat Penjual / Tanya Stok Button -->
              <button type="button" @click="handleChatStore" class="btn btn-chat-store"
                title="Tanya Stok ke Penjual via Live Chat" aria-label="Tanya Stok ke Penjual">
                <Icon name="lucide:message-square-text" class="w-5 h-5 text-bsi" />
                <span class="chat-btn-text">Chat Penjual</span>
              </button>

              <button @click="handleAddToCart" :disabled="product.stock <= 0 || isAdding"
                :class="['btn btn-secondary btn-cart', { 'btn-cart-success': isJustAdded }]">
                <span v-if="isAdding" class="btn-spinner"></span>
                <Icon v-else-if="isJustAdded" name="lucide:check-circle-2" class="w-5 h-5 text-emerald" />
                <Icon v-else name="lucide:shopping-bag" class="w-5 h-5" />
                <span>{{ isAdding ? 'Menambahkan...' : isJustAdded ? 'Masuk Keranjang!' : '+ Keranjang' }}</span>
              </button>

              <button @click="handleBuyNow" :disabled="product.stock <= 0 || isBuying" class="btn btn-primary btn-buy">
                <span v-if="isBuying" class="btn-spinner"></span>
                <span>{{ isBuying ? 'Memproses...' : 'Beli Langsung' }}</span>
                <Icon v-if="!isBuying" name="lucide:arrow-right" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Shipping & Warranty Perks -->
          <div class="product-perks">
            <div class="perk-item">
              <span class="perk-icon">
                <Icon name="lucide:shield-check" class="w-4 h-4 text-cyan" />
              </span>
              <span class="perk-text">100% Produk Original & Bergaransi Resmi</span>
            </div>
            <div class="perk-item">
              <span class="perk-icon">
                <Icon name="lucide:package" class="w-4 h-4 text-cyan" />
              </span>
              <span class="perk-text">Estimasi Berat: {{ product.weight || 500 }} gram</span>
            </div>
            <div class="perk-item">
              <span class="perk-icon">
                <Icon name="lucide:zap" class="w-4 h-4 text-cyan" />
              </span>
              <span class="perk-text">Packing Aman dengan Bubble Wrap & Asuransi</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Shopee/Tokopedia Style Store Profile Section -->
      <div class="store-profile-card cyber-card">
        <div class="store-profile-left">
          <!-- Store Avatar / Logo -->
          <div class="store-avatar-box">
            <img :src="storeInfo?.store_logo ? getImageUrl(storeInfo.store_logo) : '/logo-cyberstore.jpg'"
              :alt="storeInfo?.store_name || 'BSI Cyber Store'" class="store-avatar-img"
              @error="(e: any) => { if (e.target) e.target.src = '/logo-cyberstore.jpg' }" />
            <span class="store-online-badge" title="Toko Online"></span>
          </div>

          <!-- Store Info & Actions -->
          <div class="store-info-box">
            <div class="store-name-row">
              <h3 class="store-name">{{ storeInfo?.store_name || 'BSI Cyber Store Official' }}</h3>
              <span class="badge-official-store">
                <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-0.5 text-white" />
                Official Store
              </span>
            </div>
            <p class="store-status-text">
              <span class="pulse-dot-green"></span>
              <span>Aktif • Siap Melayani Pembelian</span>
            </p>

            <!-- Action Buttons -->
            <div class="store-actions-row">
              <button type="button" class="btn-store-action btn-store-chat" @click="handleChatStore"
                title="Buka Chat Penjual untuk Menanyakan Ketersediaan Stok">
                <Icon name="lucide:message-square-text" class="w-4 h-4" />
                <span>Chat Toko (Tanya Stok)</span>
              </button>

              <!-- <NuxtLink to="/products" class="btn-store-action btn-store-visit">
                <Icon name="lucide:store" class="w-4 h-4" />
                <span>Kunjungi Toko</span>
              </NuxtLink> -->
            </div>
          </div>
        </div>

        <!-- Store Metrics (Shopee/Tokopedia Style) -->
        <div class="store-metrics-grid">
          <div class="metric-item">
            <span class="metric-label">Penilaian Toko:</span>
            <span class="metric-value text-amber-500 font-bold">
              <Icon name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
              4.9 <span class="metric-sub">(100+ Ulasan)</span>
            </span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Performa Chat:</span>
            <span class="metric-value text-emerald font-bold">
              100% <span class="metric-sub">(Fast Response)</span>
            </span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Dikirim Dari:</span>
            <span class="metric-value text-slate-800 font-semibold">
              <Icon name="lucide:map-pin" class="w-3.5 h-3.5 inline text-blue-600" />
              {{ storeInfo?.store_city_name || 'Kota Jakarta Timur' }}
            </span>
          </div>

          <div class="metric-item">
            <span class="metric-label">Jaminan Mutu:</span>
            <span class="metric-value text-blue-700 font-semibold">
              <Icon name="lucide:award" class="w-3.5 h-3.5 inline text-blue-600" />
              100% Kampus Resmi BSI
            </span>
          </div>
        </div>
      </div>

      <!-- Shopee-Style Collapsible Dropdowns (Deskripsi, Spesifikasi, Penilaian) -->
      <div class="shopee-details-card cyber-card">
        <!-- Section 1: Spesifikasi Produk & Panduan Ukuran -->
        <div class="accordion-item" :class="{ 'is-open': openSections.specs }">
          <button type="button" class="accordion-header" @click="toggleSection('specs')"
            :aria-expanded="openSections.specs">
            <div class="accordion-header-left">
              <span class="accordion-icon-box">
                <Icon name="lucide:sliders-horizontal" class="w-4 h-4 text-cyan" />
              </span>
              <h3 class="accordion-title">Spesifikasi Produk</h3>
            </div>
            <div class="accordion-header-right">
              <!-- <span v-if="product.category?.name" class="accordion-meta-hint">{{ product.category.name }}</span> -->
              <Icon name="lucide:chevron-down" class="accordion-chevron w-5 h-5" />
            </div>
          </button>
          <Transition name="accordion">
            <div v-show="openSections.specs" class="accordion-body">
              <div class="specs-table-wrapper">
                <table class="specs-table">
                  <tbody>
                    <tr>
                      <td class="spec-name">Nama Produk</td>
                      <td class="spec-val">{{ product.name }}</td>
                    </tr>
                    <tr>
                      <td class="spec-name">Kategori</td>
                      <td class="spec-val">{{ product.category?.name || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="spec-name">SKU</td>
                      <td class="spec-val">{{ product.sku || '-' }}</td>
                    </tr>
                    <tr>
                      <td class="spec-name">Berat Pengiriman</td>
                      <td class="spec-val">{{ product.weight || 500 }} gram</td>
                    </tr>
                    <tr v-if="product.sizes?.length">
                      <td class="spec-name">Pilihan Ukuran</td>
                      <td class="spec-val">{{ product.sizes.join(', ') }}</td>
                    </tr>
                    <tr v-if="product.colors?.length">
                      <td class="spec-name">Pilihan Warna</td>
                      <td class="spec-val">{{ product.colors.map(getColorName).join(', ') }}</td>
                    </tr>
                  </tbody>
                </table>

                <!-- Panduan Ukuran (Size Chart) dengan Foto -->
                <div v-if="sizeChartImage || sizeGuideText" class="size-guide-box">
                  <div class="size-guide-header">
                    <div class="size-guide-header-left">
                      <span class="size-guide-badge-icon">
                        <Icon name="lucide:ruler" class="w-4 h-4 text-cyan" />
                      </span>
                      <div>
                        <h4 class="size-guide-title">Panduan Ukuran (Size Chart)</h4>
                        <p class="size-guide-subtitle">Panduan dimensi standar resmi agar produk pas &amp; nyaman</p>
                      </div>
                    </div>
                    <button v-if="sizeChartImage" type="button" class="btn-zoom-size-guide" @click="openSizeChartModal"
                      title="Perbesar Foto Panduan Ukuran">
                      <Icon name="lucide:maximize-2" class="w-3.5 h-3.5 inline mr-1" />
                      <span>Perbesar Foto</span>
                    </button>
                  </div>

                  <!-- Foto Panduan Ukuran -->
                  <div v-if="sizeChartImage" class="size-chart-frame" @click="openSizeChartModal"
                    title="Klik untuk melihat foto ukuran penuh">
                    <img :src="sizeChartImage" :alt="`Panduan Ukuran ${product.name}`" class="size-chart-img"
                      loading="lazy" />
                    <div class="size-chart-overlay">
                      <span class="zoom-pill">
                        <Icon name="lucide:zoom-in" class="w-4 h-4" />
                        <span>Klik untuk Melihat Foto Ukuran Penuh</span>
                      </span>
                    </div>
                  </div>

                  <!-- Catatan / Keterangan Ukuran tambahan jika ada teks -->
                  <div v-if="sizeGuideText" class="size-guide-notes">
                    <Icon name="lucide:info" class="w-4 h-4 text-cyan flex-shrink-0 mt-0.5" />
                    <p>{{ sizeGuideText }}</p>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Section 2: Deskripsi Produk -->
        <div class="accordion-item" :class="{ 'is-open': openSections.desc }">
          <button type="button" class="accordion-header" @click="toggleSection('desc')"
            :aria-expanded="openSections.desc">
            <div class="accordion-header-left">
              <span class="accordion-icon-box">
                <Icon name="lucide:file-text" class="w-4 h-4 text-cyan" />
              </span>
              <h3 class="accordion-title">Deskripsi Produk</h3>
            </div>
            <div class="accordion-header-right">
              <Icon name="lucide:chevron-down" class="accordion-chevron w-5 h-5" />
            </div>
          </button>
          <Transition name="accordion">
            <div v-show="openSections.desc" class="accordion-body">
              <div class="description-content">
                <p>{{ product.description || 'Tidak ada deskripsi rinci untuk produk ini.' }}</p>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Section 3: Penilaian Produk (Ulasan Pembeli) -->
        <div class="accordion-item" :class="{ 'is-open': openSections.reviews }">
          <button type="button" class="accordion-header" @click="toggleSection('reviews')"
            :aria-expanded="openSections.reviews">
            <div class="accordion-header-left">
              <span class="accordion-icon-box">
                <Icon name="lucide:star" class="w-4 h-4 text-amber-500 fill-amber-500" />
              </span>
              <h3 class="accordion-title">Penilaian Produk</h3>
              <span class="reviews-count-badge">({{ reviews.length }})</span>
            </div>
            <div class="accordion-header-right">
              <div v-if="product.rating" class="reviews-preview-rating">
                <Icon name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                <span class="score">{{ product.rating }}</span>
                <span class="max">/ 5.0</span>
              </div>
              <Icon name="lucide:chevron-down" class="accordion-chevron w-5 h-5" />
            </div>
          </button>
          <Transition name="accordion">
            <div v-show="openSections.reviews" class="accordion-body">
              <div v-if="reviews.length === 0" class="empty-reviews">
                <p>Belum ada ulasan untuk produk ini. Jadilah pembeli pertama yang memberikan review!</p>
              </div>
              <div v-else class="reviews-list">
                <div v-for="rev in reviews" :key="rev.id" class="review-card">
                  <div class="review-header">
                    <div class="reviewer-avatar">
                      {{ (rev.user?.name || 'U').charAt(0).toUpperCase() }}
                    </div>
                    <div class="reviewer-meta">
                      <span class="reviewer-name">{{ rev.user?.name || 'Customer' }}</span>
                      <div class="review-stars">
                        <span v-for="s in 5" :key="s" :class="['star', { active: s <= (rev.rating || 5) }]">
                          <Icon name="lucide:star" class="w-3.5 h-3.5 fill-current" />
                        </span>
                      </div>
                    </div>
                    <span class="review-date">{{ rev.created_at ? new Date(rev.created_at).toLocaleDateString('id-ID') :
                      'Baru saja' }}</span>
                  </div>
                  <p class="review-comment">{{ rev.comment || rev.review }}</p>

                  <!-- Admin Reply -->
                  <div v-if="rev.reply || (rev.replies && rev.replies.length)" class="admin-reply-box">
                    <div class="reply-badge">Balasan Toko CyberStore:</div>
                    <p>{{ rev.reply || rev.replies[0]?.comment }}</p>
                  </div>
                </div>

                <!-- Action Button to View All Reviews & Write Review -->
                <div class="reviews-accordion-footer">
                  <NuxtLink :to="`/products/${product.id}/reviews`" class="btn btn-secondary btn-all-reviews"
                    title="Buka Halaman Penilaian Lengkap">
                    <span>Lihat Semua Ulasan & Tulis Penilaian</span>
                    <Icon name="lucide:arrow-right" class="w-4 h-4 ml-1.5" />
                  </NuxtLink>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Shopee-Style Product Image Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isLightboxOpen" class="shopee-modal-backdrop" @click.self="closeLightbox" role="dialog"
          aria-modal="true">
          <div class="shopee-modal-card">
            <!-- Close Button (X) -->
            <button type="button" class="shopee-modal-close" @click="closeLightbox" title="Tutup (Esc)"
              aria-label="Tutup">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>

            <!-- Left: Large Image Preview with Shopee-style Chevrons -->
            <div class="shopee-modal-left" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
              <button v-if="allImages.length > 1" type="button" class="shopee-modal-nav nav-prev"
                @click.stop="prevImage" title="Foto Sebelumnya (←)" aria-label="Foto Sebelumnya">
                <Icon name="lucide:chevron-left" class="w-6 h-6" />
              </button>

              <div class="shopee-main-img-box" @click="nextImage" title="Klik foto untuk lanjut ke foto berikutnya">
                <img :src="getImageUrl(activeImage)" :alt="product?.name" class="shopee-main-img" />
              </div>

              <button v-if="allImages.length > 1" type="button" class="shopee-modal-nav nav-next"
                @click.stop="nextImage" title="Foto Berikutnya (→)" aria-label="Foto Berikutnya">
                <Icon name="lucide:chevron-right" class="w-6 h-6" />
              </button>

              <!-- Image Counter Pill in preview -->
              <div v-if="allImages.length > 1" class="shopee-modal-counter">
                {{ activeIndex + 1 }} / {{ allImages.length }}
              </div>
            </div>

            <!-- Right: Product Info & Thumbnails Grid (Shopee style) -->
            <div class="shopee-modal-right">
              <div class="shopee-modal-header">
                <span v-if="product?.category?.name" class="shopee-modal-category">
                  {{ product.category.name }}
                </span>
                <h3 class="shopee-modal-title">{{ product?.name }}</h3>
                <div class="shopee-modal-price-row">
                  <span class="shopee-modal-price">{{ formatRupiah(product?.price) }}</span>
                  <span v-if="product?.original_price && product.original_price > product.price"
                    class="shopee-modal-strike">
                    {{ formatRupiah(product.original_price) }}
                  </span>
                </div>
              </div>

              <!-- Thumbnails Grid -->
              <div class="shopee-modal-gallery">
                <div class="shopee-gallery-label">
                  <span>Pilih Foto</span>
                  <span class="shopee-gallery-count">{{ allImages.length }} Foto Tersedia</span>
                </div>
                <div class="shopee-modal-thumbs-grid">
                  <button v-for="(img, idx) in allImages" :key="idx" type="button" @click="selectImage(img, idx)"
                    :class="['shopee-thumb-btn', { active: activeImage === img }]" :title="`Pilih Foto ${idx + 1}`">
                    <img :src="getImageUrl(img)" :alt="`Foto ${idx + 1}`" class="shopee-thumb-img" />
                  </button>
                </div>
              </div>

              <!-- Perks/Footer in modal -->
              <div class="shopee-modal-footer">
                <div class="shopee-modal-perk">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-cyan" />
                  <span>Garansi Resmi & 100% Original</span>
                </div>
                <div v-if="product?.stock" class="shopee-modal-stock">
                  Stok: <strong>{{ product.stock }} unit</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Modal Lightbox Foto Panduan Ukuran -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isSizeChartModalOpen" class="size-chart-modal-backdrop" @click.self="closeSizeChartModal"
          role="dialog" aria-modal="true">
          <div class="size-chart-modal-card">
            <!-- Modal Header -->
            <div class="size-chart-modal-header">
              <div class="size-chart-modal-title-box">
                <span class="size-chart-modal-icon">
                  <Icon name="lucide:ruler" class="w-5 h-5 text-cyan" />
                </span>
                <div>
                  <h3 class="size-chart-modal-title">Panduan Ukuran Resmi (Size Chart)</h3>
                  <p class="size-chart-modal-desc">{{ product?.name }}</p>
                </div>
              </div>
              <button type="button" class="size-chart-modal-close" @click="closeSizeChartModal" title="Tutup (Esc)"
                aria-label="Tutup">
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Modal Body: High Resolution Photo Display -->
            <div class="size-chart-modal-body">
              <div class="size-chart-modal-img-wrapper">
                <img v-if="sizeChartImage" :src="sizeChartImage" :alt="`Panduan Ukuran ${product?.name}`"
                  class="size-chart-modal-img" />
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="size-chart-modal-footer">
              <div class="size-chart-modal-tips">
                <Icon name="lucide:check-circle-2" class="w-4 h-4 text-emerald flex-shrink-0" />
                <span>Tips: Toleransi jahitan konveksi ±1-2 cm. Pilihlah 1 ukuran lebih besar bila ragu untuk kenyamanan
                  gerak.</span>
              </div>
              <button type="button" class="btn btn-primary btn-close-modal" @click="closeSizeChartModal">
                Tutup Panduan Ukuran
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { useCartStore } from '~/stores/cart'

const route = useRoute()
const router = useRouter()
const { fetchProductDetail, fetchProductReviews, fetchStoreInfo, getImageUrl } = useApi()
const { formatRupiah, calculateDiscount } = useFormat()
const cartStore = useCartStore()

// Fetch Store Profile Info for the store card
const { data: storeInfoData } = await useAsyncData(
  'product-store-profile-info',
  () => fetchStoreInfo(),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)
const storeInfo = computed(() => storeInfoData.value || null)

const handleChatStore = () => {
  if (!product.value) return
  const query: Record<string, string> = {}
  if (selectedSize.value) query.size = selectedSize.value
  if (selectedColor.value) query.color = selectedColor.value

  router.push({
    path: `/products/${product.value.id}/chat`,
    query,
  })
}

const productId = computed(() => String(route.params.id))
const activeTab = ref<'desc' | 'specs' | 'reviews'>('desc')
const quantity = ref(1)

// Accordion dropdown states for Shopee-style product details
const openSections = ref({
  desc: true,
  specs: true,
  reviews: true,
})

const toggleSection = (section: 'desc' | 'specs' | 'reviews') => {
  openSections.value[section] = !openSections.value[section]
}

// Fetch product detail & reviews non-blocking with payload caching
const { data: detailData, pending } = await useAsyncData(
  `product-${productId.value}`,
  () => fetchProductDetail(productId.value),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)

const { data: reviewsData } = await useAsyncData(
  `product-reviews-${productId.value}`,
  () => fetchProductReviews(productId.value),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key],
  }
)

const product = computed(() => {
  if (!detailData.value) return null
  return detailData.value.product || detailData.value
})
const reviews = computed(() => {
  if (!reviewsData.value) return []
  if (Array.isArray(reviewsData.value)) return reviewsData.value
  return reviewsData.value.reviews || []
})

// Image gallery management
const allImages = computed(() => {
  if (!product.value) return []
  const list: string[] = []
  if (product.value.main_photo) list.push(product.value.main_photo)
  if (product.value.images && Array.isArray(product.value.images)) {
    product.value.images.forEach((img: any) => {
      const p = img.image || img.image_path || img.photo || img.path || img
      if (p && !list.includes(p)) list.push(p)
    })
  }
  return list
})

const activeImage = ref<string>('')
watchEffect(() => {
  if (allImages.value.length > 0 && !activeImage.value) {
    activeImage.value = allImages.value[0] || ''
  }
})

// Gallery Slide Navigation & Lightbox
const activeIndex = computed(() => {
  const idx = allImages.value.indexOf(activeImage.value)
  return idx >= 0 ? idx : 0
})

const thumbTrack = ref<HTMLElement | null>(null)

const scrollToThumb = (index: number) => {
  if (!thumbTrack.value) return
  const buttons = thumbTrack.value.querySelectorAll('.thumb-btn')
  const targetBtn = buttons[index] as HTMLElement | undefined
  if (targetBtn) {
    const track = thumbTrack.value
    const btnLeft = targetBtn.offsetLeft
    const btnWidth = targetBtn.offsetWidth
    const trackWidth = track.clientWidth
    const targetScroll = btnLeft - (trackWidth / 2) + (btnWidth / 2)

    track.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth',
    })
  }
}

const selectImage = (img: string, idx: number) => {
  activeImage.value = img
  scrollToThumb(idx)
}

const nextImage = () => {
  if (allImages.value.length <= 1) return
  const nextIdx = (activeIndex.value + 1) % allImages.value.length
  const nextImg = allImages.value[nextIdx]
  if (nextImg) {
    activeImage.value = nextImg
    scrollToThumb(nextIdx)
  }
}

const prevImage = () => {
  if (allImages.value.length <= 1) return
  const prevIdx = (activeIndex.value - 1 + allImages.value.length) % allImages.value.length
  const prevImg = allImages.value[prevIdx]
  if (prevImg) {
    activeImage.value = prevImg
    scrollToThumb(prevIdx)
  }
}

const slideThumbs = (direction: 'left' | 'right') => {
  if (direction === 'left') {
    prevImage()
  } else {
    nextImage()
  }
}

// Fullscreen Lightbox Modal
const isLightboxOpen = ref(false)

const openLightbox = () => {
  isLightboxOpen.value = true
  if (import.meta.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeLightbox = () => {
  isLightboxOpen.value = false
  if (import.meta.client && !isSizeChartModalOpen.value) {
    document.body.style.overflow = ''
  }
}

// Helper to check if size chart / size guide is an image path/URL
const isImageUrl = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false
  const trimmed = val.trim()
  return (
    /\.(jpeg|jpg|png|webp|svg|gif)(\?.*)?$/i.test(trimmed) ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/storage/') ||
    trimmed.startsWith('products/') ||
    trimmed.startsWith('size_charts/')
  )
}

// Computed Size Chart Photo (Foto Panduan Ukuran)
const sizeChartImage = computed(() => {
  if (!product.value) return null

  // 1. Cek jika backend mengirim file/path gambar di size_chart atau size_guide
  if (isImageUrl(product.value.size_chart)) {
    return getImageUrl(product.value.size_chart)
  }
  if (isImageUrl(product.value.size_guide)) {
    return getImageUrl(product.value.size_guide)
  }

  // 2. Jika produk memiliki sizes atau termasuk pakaian/apparel/event maba, gunakan foto panduan ukuran resmi BSI Cyber Store
  if (
    (product.value.sizes && product.value.sizes.length > 0) ||
    product.value.size_chart ||
    product.value.size_guide ||
    product.value.category?.slug === 'baju-apparel' ||
    product.value.is_event_maba
  ) {
    return '/size-chart-guide.svg'
  }

  return null
})

// Catatan teks tambahan panduan ukuran jika backend mengirim teks (bukan link foto)
const sizeGuideText = computed(() => {
  if (!product.value) return ''
  if (product.value.size_guide && !isImageUrl(product.value.size_guide)) {
    return product.value.size_guide
  }
  if (product.value.size_chart && !isImageUrl(product.value.size_chart)) {
    return product.value.size_chart
  }
  return ''
})

// Modal Lightbox khusus Foto Panduan Ukuran (Size Chart)
const isSizeChartModalOpen = ref(false)

const openSizeChartModal = () => {
  isSizeChartModalOpen.value = true
  if (import.meta.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeSizeChartModal = () => {
  isSizeChartModalOpen.value = false
  if (import.meta.client && !isLightboxOpen.value) {
    document.body.style.overflow = ''
  }
}

// Touch swipe detection for mobile & tablet gallery and lightbox
const touchStartX = ref(0)
const touchStartY = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  const touch = e.touches?.item(0)
  if (touch) {
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  const touch = e.changedTouches?.item(0)
  if (!touch) return
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  // Only trigger horizontal swipe if deltaX is dominant and exceeds 40px
  if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isSizeChartModalOpen.value) closeSizeChartModal()
    if (isLightboxOpen.value) closeLightbox()
  }
  if (isLightboxOpen.value) {
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (justAddedTimer) clearTimeout(justAddedTimer)
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})

// Helper for colors
const getColorName = (c: any): string => {
  if (!c) return ''
  if (typeof c === 'string') return c
  return c.name || ''
}

const getColorHex = (c: any): string => {
  if (!c || typeof c === 'string') return ''
  return c.hex || ''
}

// Variant selections
const selectedSize = ref<string | null>(null)
const selectedColor = ref<string | null>(null)

watchEffect(() => {
  if (product.value) {
    if (product.value.sizes?.length && !selectedSize.value) {
      selectedSize.value = product.value.sizes[0]
    }
    if (product.value.colors?.length && !selectedColor.value) {
      selectedColor.value = getColorName(product.value.colors[0])
    }
  }
})

const discountPercent = computed(() => {
  if (!product.value) return 0
  return calculateDiscount(product.value.price, product.value.original_price)
})

const increaseQty = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

const decreaseQty = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

// NIM state for Event Maba
const nimInput = ref('')
const nimError = ref('')

const cleanNimDigits = computed(() => nimInput.value.replace(/\D/g, ''))
const isNimValid = computed(() => cleanNimDigits.value.length >= 8)
const nimLastDigit = computed<number | null>(() => {
  if (!cleanNimDigits.value) return null
  return parseInt(cleanNimDigits.value.slice(-1), 10)
})
const isNimOdd = computed(() => {
  if (nimLastDigit.value === null) return false
  return nimLastDigit.value % 2 !== 0
})

// Auto-lock color when NIM is entered for event maba product
watch([isNimValid, isNimOdd, () => product.value?.is_event_maba], ([valid, odd, isEvent]) => {
  if (isEvent && valid && product.value) {
    const targetColor = odd
      ? (product.value.maba_color_ganjil || 'Putih')
      : (product.value.maba_color_genap || 'Biru')

    // Cari warna yang cocok di product.colors
    const matched = product.value.colors?.find((c: any) => {
      const name = getColorName(c)
      return name.toLowerCase().trim() === targetColor.toLowerCase().trim() ||
        name.toLowerCase().includes(targetColor.toLowerCase())
    })

    selectedColor.value = matched ? getColorName(matched) : targetColor
    nimError.value = ''
  }
})

const isAdding = ref(false)
const isBuying = ref(false)
const isJustAdded = ref(false)
let justAddedTimer: any = null

const handleAddToCart = async () => {
  if (!product.value || product.value.stock <= 0 || isAdding.value) return
  if (product.value.is_event_maba) {
    if (!cleanNimDigits.value || cleanNimDigits.value.length < 8) {
      nimError.value = 'Wajib memasukkan minimal 8 digit NIM untuk pembelian produk Ormik & Semot!'
      return
    }
  }
  isAdding.value = true
  try {
    cartStore.addToCart(
      product.value,
      quantity.value,
      selectedSize.value,
      selectedColor.value,
      product.value.is_event_maba ? cleanNimDigits.value : null,
      false
    )
    await new Promise(r => setTimeout(r, 180))
    isJustAdded.value = true
    if (justAddedTimer) clearTimeout(justAddedTimer)
    justAddedTimer = setTimeout(() => {
      isJustAdded.value = false
    }, 2200)
  } finally {
    isAdding.value = false
  }
}

const handleBuyNow = async () => {
  if (!product.value || product.value.stock <= 0 || isBuying.value) return
  if (product.value.is_event_maba) {
    if (!cleanNimDigits.value || cleanNimDigits.value.length < 8) {
      nimError.value = 'Wajib memasukkan minimal 8 digit NIM untuk pembelian produk Ormik & Semot!'
      return
    }
  }
  isBuying.value = true
  try {
    cartStore.addToCart(
      product.value,
      quantity.value,
      selectedSize.value,
      selectedColor.value,
      product.value.is_event_maba ? cleanNimDigits.value : null
    )
    await new Promise(r => setTimeout(r, 200))
    router.push('/cart')
  } finally {
    isBuying.value = false
  }
}

// Dynamic SEO tags for Product
useHead({
  title: computed(() => (product.value ? `${product.value.name} | Cyber Store` : 'Detail Produk')),
  meta: [
    {
      name: 'description',
      content: computed(() => product.value?.description || 'Beli produk teknologi terbaik dengan garansi resmi di Cyber Store.'),
    },
    {
      property: 'og:title',
      content: computed(() => (product.value ? product.value.name : 'Cyber Store Product')),
    },
    {
      property: 'og:image',
      content: computed(() => (product.value?.main_photo ? getImageUrl(product.value.main_photo) : '')),
    },
  ],
})
</script>

<style scoped>
/* Base Page Container */
.product-detail-page {
  padding-top: 2rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-loading-box,
.not-found-box {
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  gap: 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Breadcrumbs */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
  color: var(--text-muted);
  flex-wrap: wrap;
}

.breadcrumb a {
  transition: color 0.2s ease;
}

.breadcrumb a:hover {
  color: #003399;
}

.breadcrumb .current {
  color: #0f172a;
  font-weight: 700;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Detail Wrapper & Main 2-Column Grid */
.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.detail-main-grid {
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  gap: 2.5rem;
  align-items: start;
}

/* Gallery Column */
.gallery-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.main-image-frame {
  position: relative;
  width: 100%;
  padding-top: 92%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: zoom-in;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
  touch-action: pan-y;
  user-select: none;
}

.active-product-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  pointer-events: none;
}

.gallery-badges {
  position: absolute;
  top: 0.85rem;
  left: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  z-index: 2;
  pointer-events: none;
}

.discount-badge {
  font-size: 0.825rem;
  padding: 0.35rem 0.75rem;
  font-weight: 800;
}

.pick-badge {
  font-size: 0.725rem;
  padding: 0.3rem 0.65rem;
  font-weight: 800;
}

.image-counter-pill {
  position: absolute;
  top: 0.85rem;
  right: 0.85rem;
  background: rgba(0, 51, 153, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  color: #fff;
  z-index: 2;
  pointer-events: none;
}

.zoom-indicator-btn {
  position: absolute;
  bottom: 0.85rem;
  left: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #003399;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.1);
  z-index: 2;
  cursor: pointer;
}

.zoom-indicator-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Main Slide Arrows */
.main-slide-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #cbd5e1;
  color: #003399;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 3;
  opacity: 0.85;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.15);
}

.main-slide-nav svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.main-slide-nav.nav-prev {
  left: 0.75rem;
}

.main-slide-nav.nav-next {
  right: 0.75rem;
}

/* Thumbnail Slider Row */
.thumbnail-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.thumb-arrow-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #003399;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.thumb-arrow-btn svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.thumb-arrow-btn:hover {
  background: #003399;
  color: #ffffff;
  border-color: #003399;
  transform: scale(1.06);
}

.thumb-arrow-btn:active {
  transform: scale(0.94);
}

.thumbnails-track {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  padding: 4px 2px;
  flex: 1;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.thumbnails-track::-webkit-scrollbar {
  display: none;
}

.thumb-btn {
  width: 76px;
  height: 76px;
  border-radius: var(--radius-sm);
  border: 2px solid #e2e8f0;
  overflow: hidden;
  background: #f8fafc;
  opacity: 0.7;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  scroll-snap-align: start;
  padding: 0;
}

.thumb-btn.active {
  opacity: 1;
  border-color: #003399;
  box-shadow: 0 0 10px rgba(0, 51, 153, 0.3);
  transform: scale(1.04);
}

.thumb-btn:hover:not(.active) {
  opacity: 1;
  border-color: #93c5fd;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

/* Info Column */
.info-col {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.meta-badge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.sku-tag {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.detail-title {
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 800;
  line-height: 1.3;
  color: #0f172a;
  word-break: break-word;
}

.rating-summary-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 0.35rem;
  column-gap: 0.6rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.stars-box {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #fbbf24;
  font-weight: 700;
}

.star-icon {
  width: 16px;
  height: 16px;
}

.rating-val {
  color: #0f172a;
  font-weight: 700;
}

.dot-separator {
  color: var(--border-subtle);
}

.review-link {
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.review-link.is-link {
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  cursor: pointer;
}

.review-link.is-link:hover {
  color: #003399;
  text-decoration: underline;
}

.stock-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.stock-pill.in-stock {
  background: var(--accent-emerald-dim);
  color: var(--accent-emerald);
}

.stock-pill.out-stock {
  background: var(--accent-coral-dim);
  color: var(--accent-coral);
}

.price-box {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.85rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

.price-main {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4.5vw, 2.2rem);
  font-weight: 800;
  color: #003399;
}

.price-strike {
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  color: var(--text-muted);
  text-decoration: line-through;
}

/* Event Maba NIM Box Styles */
.maba-box {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: var(--radius-md);
  padding: 1.25rem;
  box-shadow: 0 4px 16px rgba(0, 51, 153, 0.08);
}

.maba-badge-row {
  margin-bottom: 0.5rem;
}

.maba-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #003399;
  margin-bottom: 0.35rem;
}

.maba-desc {
  font-size: 0.8rem;
  color: #334155;
  line-height: 1.45;
  margin-bottom: 1rem;
}

.maba-desc strong {
  color: #004aad;
  font-weight: 700;
}

.maba-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.maba-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1e293b;
}

.maba-input-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.nim-field {
  max-width: 200px;
  font-family: monospace;
  font-size: 1rem;
  letter-spacing: 0.08em;
  font-weight: 700;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #0f172a;
}

.nim-field.border-error {
  border-color: #ef4444 !important;
}

.nim-status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
}

.pill-odd {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #0f172a;
}

.pill-even {
  background: #003399;
  border: 1.5px solid #002266;
  color: #ffffff;
}

.nim-error-msg {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 600;
}

.nim-hint-msg {
  font-size: 0.75rem;
  color: #d97706;
  font-weight: 600;
}

/* Option Groups */
.option-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.option-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.2rem;
}

.option-label {
  font-size: 0.825rem;
  font-weight: 700;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.color-locked-hint {
  font-size: 0.75rem;
  font-weight: 700;
  color: #004aad;
  line-height: 1.3;
}

.options-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.option-pill {
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-sm);
  color: #334155;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.option-pill:hover {
  border-color: #004aad;
  color: #003399;
  background: #eff6ff;
}

.option-pill.active {
  background: #003399;
  color: #ffffff;
  border-color: #002266;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

.pill-locked {
  border-color: #003399 !important;
  background: #003399 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
  cursor: default;
}

.pill-disabled {
  opacity: 0.35 !important;
  cursor: not-allowed !important;
  border-style: dashed !important;
}

/* Purchase Section */
.purchase-box {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.5rem;
}

.qty-select-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.qty-control {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.qty-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #334155;
  background: #f1f5f9;
  transition: background 0.15s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #004aad;
  color: #ffffff;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-number {
  width: 48px;
  text-align: center;
  font-weight: 700;
  color: #0f172a;
}

.action-buttons-group {
  display: flex;
  gap: 0.85rem;
}

.btn-chat-store {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1.15rem;
  background: #ffffff;
  border: 1.5px solid #004aad;
  border-radius: var(--radius-sm);
  color: #004aad;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-chat-store:hover {
  background: #eff6ff;
  border-color: #003399;
  color: #003399;
  box-shadow: 0 4px 12px rgba(0, 74, 173, 0.15);
  transform: translateY(-1px);
}

.btn-cart {
  flex: 1;
  background: #eff6ff;
  color: #003399;
  border: 1.5px solid #bfdbfe;
  font-weight: 700;
}

.btn-cart:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

.btn-cart svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.btn-cart.btn-cart-success {
  background: #ecfdf5 !important;
  border-color: #10b981 !important;
  color: #065f46 !important;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25) !important;
  transform: scale(1.02);
}

.btn-cart.btn-cart-success svg {
  color: #10b981;
}

.btn-buy {
  flex: 1.3;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(0, 51, 153, 0.3);
}

.btn-buy:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
}

.btn-buy svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.btn-buy:hover svg {
  transform: translateX(3px);
}

/* Shopee/Tokopedia Style Store Profile Card */
.store-profile-card {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 2rem;
  align-items: center;
  padding: 1.5rem 2rem;
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.store-profile-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  border-right: 1px solid #f1f5f9;
  padding-right: 1.75rem;
}

.store-avatar-box {
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  padding: 2px;
  background: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.1);
}

.store-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.store-online-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.store-info-box {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}

.store-name-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.store-name {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.badge-official-store {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.02em;
}

.store-status-text {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.775rem;
  color: #64748b;
  margin: 0;
}

.pulse-dot-green {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
}

.store-actions-row {
  display: flex;
  gap: 0.65rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.btn-store-action {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.95rem;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-store-chat {
  background: #eff6ff;
  border: 1.5px solid #004aad;
  color: #003399;
}

.btn-store-chat:hover {
  background: #004aad;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 74, 173, 0.25);
}

.btn-store-visit {
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  color: #334155;
}

.btn-store-visit:hover {
  border-color: #004aad;
  color: #004aad;
  background: #f8fafc;
}

/* Store Metrics Grid */
.store-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem 1.5rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
}

.metric-value {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.metric-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: normal;
}

@media (max-width: 991px) {
  .store-profile-card {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.25rem 1.5rem;
  }

  .store-profile-left {
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
    padding-right: 0;
    padding-bottom: 1.25rem;
  }
}

@media (max-width: 640px) {
  .store-profile-left {
    flex-direction: column;
    text-align: center;
    gap: 0.85rem;
  }

  .store-name-row {
    justify-content: center;
  }

  .store-status-text {
    justify-content: center;
  }

  .store-actions-row {
    justify-content: center;
    width: 100%;
  }

  .btn-store-action {
    flex: 1;
    justify-content: center;
    padding: 0.55rem 0.75rem;
    font-size: 0.775rem;
  }

  .store-metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    text-align: left;
  }
}

.product-perks {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.perk-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Shopee-Style Collapsible Accordion Dropdowns */
.shopee-details-card {
  background: #ffffff;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.accordion-item {
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s ease;
}

.accordion-item:last-child {
  border-bottom: none;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.75rem;
  background: #ffffff;
  cursor: pointer;
  transition: background-color 0.2s ease;
  user-select: none;
  text-align: left;
  border: none;
}

.accordion-header:hover {
  background: #f8fafc;
}

.accordion-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.accordion-icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003399;
  flex-shrink: 0;
}

.accordion-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.reviews-count-badge {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
}

.accordion-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.accordion-meta-hint {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 3px 9px;
  border-radius: 6px;
}

.reviews-preview-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #d97706;
}

.reviews-preview-rating .score {
  color: #b45309;
}

.reviews-preview-rating .max {
  font-size: 0.75rem;
  color: #94a3b8;
}

.accordion-chevron {
  color: #64748b;
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.accordion-item.is-open .accordion-chevron {
  transform: rotate(180deg);
  color: #003399;
}

.accordion-item.is-open .accordion-header {
  background: #fbfdff;
}

.accordion-body {
  padding: 0 1.75rem 1.75rem 1.75rem;
  overflow: hidden;
}

/* Accordion Animation */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 1500px;
  opacity: 1;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
  padding-bottom: 0;
}

.description-content {
  font-size: 0.95rem;
  line-height: 1.8;
  color: #334155;
  white-space: pre-line;
  word-break: break-word;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
}

.specs-table tr {
  border-bottom: 1px solid #e2e8f0;
}

.specs-table td {
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
}

.spec-name {
  color: #475569;
  width: 200px;
  font-weight: 600;
}

.spec-val {
  color: #0f172a;
  font-weight: 600;
  word-break: break-word;
}

/* Size Guide Trigger Button in Options */
.size-guide-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #003399;
  font-size: 0.775rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-guide-trigger-btn:hover {
  background: #003399;
  color: #ffffff;
  border-color: #003399;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.2);
}

/* Size Guide Box in Specs */
.size-guide-box {
  background: #ffffff;
  border: 1.5px solid #bfdbfe;
  border-radius: var(--radius-md);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 16px rgba(0, 51, 153, 0.05);
}

.size-guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.85rem;
}

.size-guide-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.size-guide-badge-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003399;
  flex-shrink: 0;
}

.size-guide-title {
  font-size: 1rem;
  font-weight: 800;
  color: #003399;
  margin: 0;
}

.size-guide-subtitle {
  font-size: 0.775rem;
  color: #64748b;
  margin: 0;
}

.btn-zoom-size-guide {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: #eff6ff;
  border: 1.5px solid #004aad;
  border-radius: var(--radius-sm);
  color: #003399;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-zoom-size-guide:hover {
  background: #003399;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
}

/* Size Chart Photo Frame */
.size-chart-frame {
  position: relative;
  width: 100%;
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  cursor: zoom-in;
  transition: all 0.25s ease;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.size-chart-frame:hover {
  border-color: #003399;
  box-shadow: 0 8px 24px rgba(0, 51, 153, 0.15);
  transform: translateY(-2px);
}

.size-chart-img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.size-chart-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 51, 153, 0.15);
  backdrop-filter: blur(1.5px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.size-chart-frame:hover .size-chart-overlay {
  opacity: 1;
}

.zoom-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #003399;
  color: #ffffff;
  padding: 0.55rem 1.15rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.size-guide-notes {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-sm);
  font-size: 0.825rem;
  color: #1e293b;
  line-height: 1.5;
}

/* Modal Lightbox for Size Chart */
.size-chart-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.size-chart-modal-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 980px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.size-chart-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.size-chart-modal-title-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.size-chart-modal-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003399;
  flex-shrink: 0;
}

.size-chart-modal-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.size-chart-modal-desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.size-chart-modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.size-chart-modal-close:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: rotate(90deg);
}

.size-chart-modal-body {
  padding: 1.5rem;
  background: #f8fafc;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-chart-modal-img-wrapper {
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-chart-modal-img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: #ffffff;
}

.size-chart-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
}

.size-chart-modal-tips {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #475569;
}

.btn-close-modal {
  padding: 0.5rem 1.25rem;
  font-size: 0.85rem;
}

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.review-card {
  padding: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-sm);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reviewer-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reviewer-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reviewer-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
}

.review-stars .star {
  font-size: 0.8rem;
  color: #cbd5e1;
}

.review-stars .star.active {
  color: #fbbf24;
}

.review-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.review-comment {
  font-size: 0.875rem;
  color: #334155;
  line-height: 1.5;
  word-break: break-word;
}

.admin-reply-box {
  margin-top: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border-left: 3px solid #003399;
  border-radius: 4px;
}

.reply-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: #003399;
  margin-bottom: 2px;
}

.admin-reply-box p {
  font-size: 0.825rem;
  color: #1e293b;
  line-height: 1.5;
}

.reviews-accordion-footer {
  margin-top: 1.25rem;
  display: flex;
  justify-content: center;
}

.btn-all-reviews {
  width: 100%;
  max-width: 440px;
  min-height: 42px;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  color: #003399;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.btn-all-reviews:hover {
  background: #003399;
  color: #ffffff;
  border-color: #003399;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.2);
}

/* Shopee-Style Product Image Modal */
.shopee-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.shopee-modal-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 960px;
  max-height: 86vh;
  display: grid;
  grid-template-columns: 1.45fr 1fr;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.shopee-modal-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 30;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.shopee-modal-close:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
  transform: rotate(90deg);
}

/* Left: Big Image Stage */
.shopee-modal-left {
  position: relative;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-right: 1px solid #e2e8f0;
  min-height: 480px;
  user-select: none;
  touch-action: pan-y;
}

.shopee-main-img-box {
  width: 100%;
  height: 100%;
  max-height: calc(86vh - 3rem);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.shopee-main-img {
  max-width: 100%;
  max-height: calc(86vh - 4rem);
  object-fit: contain;
  border-radius: 6px;
  transition: transform 0.25s ease;
}

/* Shopee-style Navigation Arrows */
.shopee-modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 52px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.shopee-modal-nav:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateY(-50%) scale(1.05);
}

.shopee-modal-nav.nav-prev {
  left: 0.75rem;
}

.shopee-modal-nav.nav-next {
  right: 0.75rem;
}

.shopee-modal-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 51, 153, 0.85);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  z-index: 10;
  pointer-events: none;
}

/* Right: Product Info & Thumbnails Grid */
.shopee-modal-right {
  display: flex;
  flex-direction: column;
  padding: 1.75rem 1.5rem;
  background: #ffffff;
  overflow-y: auto;
  gap: 1.25rem;
}

.shopee-modal-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-right: 2rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1rem;
}

.shopee-modal-category {
  font-size: 0.75rem;
  font-weight: 700;
  color: #004aad;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.shopee-modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.shopee-modal-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-top: 0.25rem;
}

.shopee-modal-price {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 800;
  color: #003399;
}

.shopee-modal-strike {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

/* Thumbnails Grid */
.shopee-modal-gallery {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  flex: 1;
}

.shopee-gallery-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 700;
  color: #475569;
}

.shopee-gallery-count {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.shopee-modal-thumbs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  max-height: 280px;
  overflow-y: auto;
  padding: 2px;
}

.shopee-thumb-btn {
  aspect-ratio: 1;
  border-radius: 6px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shopee-thumb-btn.active {
  border-color: #003399;
  box-shadow: 0 0 0 1.5px #003399;
  transform: scale(1.02);
}

.shopee-thumb-btn:hover:not(.active) {
  border-color: #93c5fd;
  opacity: 0.9;
}

.shopee-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shopee-modal-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #64748b;
}

.shopee-modal-perk {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.shopee-modal-stock {
  font-size: 0.75rem;
  color: #475569;
}

.shopee-modal-stock strong {
  color: #059669;
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

/* Desktop Hover Enhancements */
@media (hover: hover) {
  .main-image-frame:hover .active-product-img {
    transform: scale(1.02);
  }

  .main-image-frame:hover .zoom-indicator-btn {
    background: #003399;
    color: #ffffff;
    border-color: #003399;
    box-shadow: 0 4px 12px rgba(0, 51, 153, 0.3);
  }

  .main-image-frame:hover .main-slide-nav {
    opacity: 1;
  }

  .main-slide-nav:hover {
    background: #003399;
    color: #ffffff;
    border-color: #003399;
    transform: translateY(-50%) scale(1.1);
  }
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */

/* 1. Laptops / Small Desktops (<= 1100px) */
@media (max-width: 1100px) {
  .detail-main-grid {
    grid-template-columns: 1fr 1.1fr;
    gap: 1.75rem;
  }

  .info-col {
    padding: 1.75rem;
  }
}

/* 2. Tablets (<= 991px) */
@media (max-width: 991px) {
  .product-detail-page {
    padding-top: 1.5rem;
    padding-bottom: 4rem;
    gap: 1.75rem;
  }

  .detail-wrapper {
    gap: 2rem;
  }

  .detail-main-grid {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }

  .main-image-frame {
    padding-top: 80%;
  }

  .info-col {
    padding: 1.5rem;
  }

  .spec-name {
    width: 160px;
  }

}

/* 3. Small Tablets & Phablets (<= 768px) */
@media (max-width: 768px) {
  .main-image-frame {
    padding-top: 88%;
  }

  .shopee-modal-card {
    grid-template-columns: 1fr;
    max-height: 90vh;
    max-width: 95vw;
    overflow-y: auto;
  }

  .shopee-modal-left {
    min-height: 280px;
    max-height: 48vh;
    padding: 1rem;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .shopee-main-img {
    max-height: 44vh;
  }

  .shopee-modal-nav {
    width: 32px;
    height: 46px;
  }

  .shopee-modal-right {
    padding: 1.25rem 1.5rem;
    gap: 1rem;
  }

  .shopee-modal-thumbs-grid {
    grid-template-columns: repeat(4, 1fr);
    max-height: 180px;
  }
}

/* 4. Mobile Phones (<= 640px) */
@media (max-width: 640px) {
  .product-detail-page {
    padding-top: 1rem;
    padding-bottom: 3.5rem;
    gap: 1.25rem;
  }

  .detail-wrapper {
    gap: 1.25rem;
  }

  .detail-main-grid {
    gap: 1.25rem;
  }

  /* Breadcrumb */
  .breadcrumb {
    font-size: 0.75rem;
    gap: 0.35rem;
    line-height: 1.4;
  }

  .breadcrumb .current {
    max-width: 180px;
  }

  /* Gallery */
  .gallery-col {
    gap: 0.65rem;
  }

  .main-image-frame {
    padding-top: 100%;
    border-radius: var(--radius-sm);
  }

  .gallery-badges {
    top: 0.6rem;
    left: 0.6rem;
    gap: 0.3rem;
  }

  .discount-badge {
    font-size: 0.725rem;
    padding: 0.25rem 0.55rem;
  }

  .pick-badge {
    font-size: 0.68rem;
    padding: 0.25rem 0.55rem;
  }

  .image-counter-pill {
    top: 0.6rem;
    right: 0.6rem;
    font-size: 0.7rem;
    padding: 2px 8px;
  }

  .zoom-indicator-btn {
    bottom: 0.6rem;
    left: 0.6rem;
    font-size: 0.7rem;
    padding: 3px 9px;
  }

  .main-slide-nav {
    width: 34px;
    height: 34px;
    opacity: 0.9;
  }

  .main-slide-nav svg {
    width: 15px;
    height: 15px;
  }

  .main-slide-nav.nav-prev {
    left: 0.4rem;
  }

  .main-slide-nav.nav-next {
    right: 0.4rem;
  }

  .thumbnail-slider-wrapper {
    gap: 0.35rem;
  }

  .thumb-arrow-btn {
    width: 28px;
    height: 28px;
  }

  .thumb-arrow-btn svg {
    width: 12px;
    height: 12px;
  }

  .thumbnails-track {
    gap: 0.4rem;
  }

  .thumb-btn {
    width: 60px;
    height: 60px;
    border-radius: 6px;
  }

  /* Info Column */
  .info-col {
    padding: 1.25rem 1rem;
    gap: 1rem;
  }

  .price-box {
    padding: 0.75rem 0;
    gap: 0.65rem;
  }

  /* Maba Box & NIM input */
  .maba-box {
    padding: 1rem 0.85rem;
    margin-bottom: 0.5rem;
  }

  .maba-title {
    font-size: 0.9rem;
  }

  .maba-desc {
    font-size: 0.775rem;
    line-height: 1.4;
    margin-bottom: 0.75rem;
  }

  .maba-input-field {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .nim-field {
    max-width: 100%;
    width: 100%;
    text-align: center;
    font-size: 0.95rem;
    padding: 0.6rem;
  }

  .nim-status-pill {
    width: 100%;
    justify-content: center;
    text-align: center;
    font-size: 0.725rem;
    padding: 0.45rem 0.65rem;
    word-break: break-word;
    border-radius: var(--radius-sm);
  }

  /* Options */
  .option-pill {
    padding: 0.45rem 0.85rem;
    font-size: 0.8rem;
    min-height: 38px;
  }

  /* Purchase Section - Stacked Buttons on Mobile for Easy Thumb Tapping */
  .qty-select-group {
    justify-content: space-between;
    width: 100%;
  }

  .action-buttons-group {
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .btn-chat-store,
  .btn-cart,
  .btn-buy {
    width: 100%;
    min-height: 48px;
    font-size: 0.95rem;
    justify-content: center;
    border-radius: var(--radius-sm);
  }

  /* Perks */
  .product-perks {
    font-size: 0.75rem;
    gap: 0.5rem;
    padding-top: 0.75rem;
  }

  /* Shopee Accordion Dropdown Mobile */
  .accordion-header {
    padding: 1rem 1.15rem;
  }

  .accordion-title {
    font-size: 0.95rem;
  }

  .accordion-body {
    padding: 0 1.15rem 1.25rem 1.15rem;
  }

  .specs-table td {
    padding: 0.55rem 0.5rem;
    font-size: 0.8rem;
  }

  .spec-name {
    width: 38%;
    min-width: 95px;
    font-size: 0.8rem;
  }

  .spec-val {
    font-size: 0.8rem;
  }

  .size-guide-box {
    padding: 1rem 0.85rem;
    gap: 0.85rem;
  }

  .size-guide-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .btn-zoom-size-guide {
    width: 100%;
    justify-content: center;
    padding: 0.55rem;
  }

  .size-chart-modal-backdrop {
    padding: 0.6rem;
  }

  .size-chart-modal-card {
    border-radius: 10px;
    max-height: 94vh;
  }

  .size-chart-modal-header {
    padding: 1rem 1.15rem;
  }

  .size-chart-modal-title {
    font-size: 0.95rem;
  }

  .size-chart-modal-body {
    padding: 0.75rem;
  }

  .size-chart-modal-footer {
    padding: 0.85rem 1rem;
    flex-direction: column;
    align-items: stretch;
  }

  .btn-close-modal {
    width: 100%;
    justify-content: center;
  }

  /* Reviews */
  .review-card {
    padding: 1rem 0.85rem;
    gap: 0.6rem;
  }

  .reviewer-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.85rem;
  }

  .reviewer-name {
    font-size: 0.85rem;
  }

  .review-date {
    font-size: 0.7rem;
  }

  .admin-reply-box {
    padding: 0.6rem 0.75rem;
    font-size: 0.8rem;
  }

  /* Shopee Modal Mobile (<= 640px) */
  .shopee-modal-backdrop {
    padding: 0.6rem;
  }

  .shopee-modal-card {
    border-radius: 10px;
    max-height: 92vh;
  }

  .shopee-modal-left {
    min-height: 240px;
    max-height: 44vh;
    padding: 0.6rem;
  }

  .shopee-main-img {
    max-height: 40vh;
  }

  .shopee-modal-right {
    padding: 0.85rem 1rem;
    gap: 0.85rem;
  }

  .shopee-modal-title {
    font-size: 0.95rem;
  }

  .shopee-modal-price {
    font-size: 1.15rem;
  }

  .shopee-modal-thumbs-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.45rem;
    max-height: 160px;
  }
}

/* 5. Extra Narrow Phones (<= 375px) */
@media (max-width: 375px) {
  .product-detail-page {
    padding-top: 0.75rem;
  }

  .info-col {
    padding: 1rem 0.75rem;
  }

  .breadcrumb .current {
    max-width: 130px;
  }

  .thumb-btn {
    width: 50px;
    height: 50px;
  }

  .qty-btn {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .qty-number {
    width: 40px;
    font-size: 0.9rem;
  }

  .option-pill {
    padding: 0.4rem 0.7rem;
    font-size: 0.775rem;
  }

  .shopee-modal-thumbs-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
