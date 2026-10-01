<template>
  <div class="product-detail-page container">
    <!-- Breadcrumbs -->
    <div class="breadcrumb">
      <NuxtLink to="/">Beranda</NuxtLink>
      <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 text-slate-400" />
      <NuxtLink to="/products">Katalog</NuxtLink>
      <template v-if="product?.category">
        <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 text-slate-400" />
        <span>{{ product.category.name }}</span>
      </template>
      <Icon name="lucide:chevron-right" class="w-3.5 h-3.5 text-slate-400" />
      <span class="current">{{
        product?.name || (isLoading ? 'Memuat Detail Produk...' : 'Detail Produk')
      }}</span>
    </div>

    <!-- Loading & Content Transitions -->
    <Transition name="detail-fade" mode="out-in">
      <!-- Loading State with CyberLoader -->
      <div v-if="isLoading" key="loading" class="detail-loading-box cyber-card">
        <CyberLoader text="MEMUAT DETAIL PRODUK..." subtext="Mengambil Data Produk..." size="lg" />
      </div>

      <!-- Product Not Found -->
      <div v-else-if="!product" key="not-found" class="not-found-box cyber-card">
        <div class="empty-icon">
          <Icon name="lucide:package-x" class="w-12 h-12 text-slate-400" />
        </div>
        <h2>Produk Tidak Ditemukan</h2>
        <p>
          Produk yang Anda cari mungkin sudah tidak aktif atau tautan tidak valid.
        </p>
        <NuxtLink to="/products" class="btn btn-blue-primary">Kembali ke Katalog</NuxtLink>
      </div>

      <!-- Main Detail Content (Shopee Structure + CyberStore Blue Brand) -->
      <div v-else key="content" class="detail-wrapper">
        <!-- Main Product Card: Left Gallery & Right Info -->
        <div class="shopee-main-card">
          <!-- Left Column: Image Gallery -->
          <div class="gallery-col">
            <!-- Main Image Frame with Out of Stock Badge -->
            <div class="main-image-frame" @click="openLightbox" @touchstart.passive="handleTouchStart"
              @touchend.passive="handleTouchEnd" title="Klik untuk melihat foto ukuran penuh">
              <img :src="getImageUrl(activeImage)" :alt="product.name" class="active-product-img"
                @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }" />

              <!-- Out of Stock (Habis) Dark Circle Overlay -->
              <div v-if="selectedColorStock <= 0" class="shopee-habis-overlay">
                <div class="shopee-habis-circle">
                  <span>Habis</span>
                </div>
              </div>

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

            <!-- Share & Favorite Row -->
            <!-- <div class="gallery-social-row">
              <div class="social-share-group">
                <span class="social-label">Bagikan:</span>
                <button type="button" class="social-icon-btn share-wa" title="Bagikan ke WhatsApp">
                  <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-500" />
                </button>
                <button type="button" class="social-icon-btn share-fb" title="Bagikan ke Facebook">
                  <Icon name="lucide:facebook" class="w-4 h-4 text-blue-600" />
                </button>
                <button type="button" class="social-icon-btn share-link" title="Salin Tautan">
                  <Icon name="lucide:link-2" class="w-4 h-4 text-slate-600" />
                </button>
              </div>
              <div class="social-divider"></div>
              <button type="button" class="favorite-action-btn" title="Sukai Produk">
                <Icon name="lucide:heart" class="w-4 h-4 text-blue-600" />
                <span>Favorit ({{ favoriteCount }})</span>
              </button>
            </div> -->
          </div>

          <!-- Right Column: Product Info & Purchase Controls -->
          <div class="info-col">
            <!-- Title -->
            <h1 class="shopee-product-title">{{ product.name }}</h1>

            <!-- Dynamic Stats Bar (Rating ★ | Penilaian | Terjual | Laporkan) -->
            <div class="shopee-stats-row">
              <div class="stat-item stat-rating">
                <span class="rating-number">{{ averageRating }}</span>
                <div class="rating-stars-group">
                  <svg v-for="s in 5" :key="s"
                    :class="['star-svg star-sm', { active: Number(averageRating) > 0 && s <= Math.round(Number(averageRating)) }]"
                    viewBox="0 0 24 24">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>

              <div class="stat-divider"></div>

              <NuxtLink :to="`/products/${product.id}/reviews`" class="stat-item stat-reviews-link"
                title="Lihat Ulasan">
                <span class="stat-number-underlined">{{ reviewsCount }}</span>
                <span class="stat-label">Penilaian</span>
              </NuxtLink>

              <div class="stat-divider"></div>

              <div class="stat-item stat-sold">
                <span class="stat-number">{{ soldCount }}</span>
                <span class="stat-label">Terjual</span>
              </div>
            </div>

            <!-- Price Banner Box -->
            <div class="shopee-price-banner">
              <div v-if="product.original_price && product.original_price > product.price" class="price-strike">
                {{ formatRupiah(product.original_price) }}
              </div>
              <div class="price-main">{{ formatRupiah(product.price) }}</div>
              <span v-if="discountPercent > 0" class="shopee-discount-badge">
                Hemat {{ discountPercent }}%
              </span>
            </div>

            <!-- Attribute Rows (Aligned 2-Column Specs & Options) -->
            <div class="shopee-attributes-block">
              <!-- Pengiriman Row -->
              <div class="attr-row">
                <div class="attr-label">Pengiriman</div>
                <div class="attr-value shipping-value-box">
                  <div class="shipping-free-row">
                    <Icon name="lucide:truck" class="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span class="free-ongkir-badge">Gratis Ongkir</span>
                    <span class="shipping-hint">Pengiriman Cepat & Terpercaya</span>
                  </div>
                  <div class="shipping-dest-row">
                    <span class="shipping-sub-label">Dikirim Dari:</span>
                    <span class="shipping-dest-text">
                      <Icon name="lucide:map-pin" class="w-3.5 h-3.5 inline text-blue-600 mr-1" />
                      {{ storeInfo?.store_city_name || 'Kota Jakarta Timur' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Jaminan CyberStore Row -->
              <div class="attr-row">
                <div class="attr-label">Jaminan</div>
                <div class="attr-value jaminan-value-box">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span class="jaminan-text">Bebas Pengembalian • 100% Produk Original & Bergaransi</span>
                </div>
              </div>

              <!-- Event Maba Notice & NIM Input (If Event Maba) -->
              <div v-if="product.is_event_maba" class="attr-row maba-attr-row">
                <div class="attr-label">Event Maba</div>
                <div class="attr-value maba-value-box">
                  <div class="maba-header-pill">
                    <Icon name="lucide:graduation-cap" class="w-3.5 h-3.5 inline mr-1 text-blue-700" />
                    <span>Produk Resmi ORMIK & SEMOT</span>
                  </div>
                  <p class="maba-rules-text">
                    Warna ditentukan oleh digit terakhir NIM Anda:
                    <br />
                    • Ganjil (1,3,5,7,9): <strong>{{ product.maba_color_ganjil || 'Putih' }}</strong>
                    &nbsp;|&nbsp;
                    • Genap (0,2,4,6,8): <strong>{{ product.maba_color_genap || 'Biru' }}</strong>
                  </p>

                  <div class="maba-nim-input-wrap">
                    <input v-model="nimInput" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8"
                      minlength="8" placeholder="Masukkan 8 Digit NIM (cth: 12240123)" class="shopee-nim-input"
                      :class="{ 'border-error': nimError }" @input="handleNimInput" />
                    <span v-if="nimLastDigit !== null && isNimValid" class="nim-status-pill"
                      :class="isNimOdd ? 'pill-odd' : 'pill-even'">
                      Digit: {{ nimLastDigit }} ({{ isNimOdd ? product.maba_color_ganjil || 'Putih' :
                        product.maba_color_genap || 'Biru' }})
                    </span>
                  </div>
                  <span v-if="nimError" class="nim-error-msg">{{ nimError }}</span>
                  <span v-else-if="cleanNimDigits.length > 0 && cleanNimDigits.length < 8" class="nim-hint-msg">
                    <Icon name="lucide:alert-triangle" class="w-3.5 h-3.5 inline mr-1" />
                    NIM harus 8 digit angka (saat ini {{ cleanNimDigits.length }}/8 digit).
                  </span>
                </div>
              </div>

              <!-- Options: Ukuran (Sizes) -->
              <div v-if="product.sizes && product.sizes.length > 0" class="attr-row">
                <div class="attr-label">Ukuran</div>
                <div class="attr-value">
                  <div class="shopee-options-grid">
                    <button v-for="size in product.sizes" :key="size" type="button" @click="selectedSize = size"
                      :class="['shopee-option-btn', { active: selectedSize === size }]">
                      {{ size }}
                      <div v-if="selectedSize === size" class="active-corner-check">
                        <Icon name="lucide:check" class="w-2.5 h-2.5 text-white" />
                      </div>
                    </button>

                    <button v-if="sizeChartImage" type="button" class="shopee-size-chart-link"
                      @click="openSizeChartModal" title="Lihat Panduan Ukuran">
                      <Icon name="lucide:ruler" class="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                      <span>Panduan Ukuran</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Options: Warna (Colors) -->
              <div v-if="product.colors && product.colors.length > 0" class="attr-row">
                <div class="attr-label">Warna</div>
                <div class="attr-value">
                  <div class="shopee-options-grid">
                    <button v-for="color in product.colors" :key="getColorName(color)" type="button"
                      @click="!product.is_event_maba && getColorStock(color) > 0 ? (selectedColor = getColorName(color)) : null"
                      :class="[
                        'shopee-option-btn',
                        { active: selectedColor === getColorName(color) },
                        { 'btn-locked': product.is_event_maba && selectedColor === getColorName(color) },
                        {
                          'btn-disabled':
                            (product.is_event_maba && selectedColor !== getColorName(color)) ||
                            getColorStock(color) <= 0
                        }
                      ]"
                      :disabled="(product.is_event_maba && selectedColor !== getColorName(color)) || getColorStock(color) <= 0"
                      :title="getColorStock(color) <= 0
                        ? `${getColorName(color)} (Stok Habis)`
                        : product.is_event_maba && selectedColor !== getColorName(color)
                          ? 'Warna ini tidak sesuai ketentuan digit NIM Anda'
                          : getColorName(color)
                        ">
                      {{ getColorName(color) }}
                      <span v-if="getColorStock(color) <= 0" class="opt-stock-empty">(Habis)</span>
                      <div v-if="selectedColor === getColorName(color)" class="active-corner-check">
                        <Icon name="lucide:check" class="w-2.5 h-2.5 text-white" />
                      </div>
                    </button>
                  </div>
                  <span v-if="product.is_event_maba && isNimValid" class="color-locked-subtext">
                    <Icon name="lucide:lock" class="w-3 h-3 inline mr-1 text-blue-700" />
                    Terkunci otomatis sesuai digit NIM Anda
                  </span>
                </div>
              </div>

              <!-- Kuantitas (Quantity) Row -->
              <div class="attr-row">
                <div class="attr-label">Kuantitas</div>
                <div class="attr-value qty-value-box">
                  <div class="shopee-qty-controller">
                    <button type="button" @click="decreaseQty" :disabled="quantity <= 1 || selectedColorStock <= 0"
                      class="qty-step-btn" aria-label="Kurangi kuantitas">
                      -
                    </button>
                    <input type="text" readonly :value="quantity" class="qty-input-num" />
                    <button type="button" @click="increaseQty"
                      :disabled="quantity >= maxAllowedQty || selectedColorStock <= 0" class="qty-step-btn"
                      :title="product.is_event_maba && quantity >= 1 ? 'Maksimal 1 unit untuk Event Maba' : undefined"
                      aria-label="Tambah kuantitas">
                      +
                    </button>
                  </div>

                  <span class="stock-status-text" :class="{ 'is-out-of-stock': selectedColorStock <= 0 }">
                    {{ selectedColorStock <= 0 ? 'STOK HABIS' : `tersisa ${selectedColorStock} buah` }} </span>

                      <span v-if="product.is_event_maba" class="maba-limit-tag">
                        (Maks. 1 unit)
                      </span>
                </div>
              </div>
            </div>

            <!-- Action Buttons Row (CyberStore Blue Brand Colors) -->
            <div class="shopee-action-buttons">
              <!-- Chat Penjual Button -->
              <button type="button" @click="handleChatStore" class="btn-shopee-chat"
                title="Tanya Stok ke Penjual via Live Chat">
                <Icon name="lucide:message-square-text" class="w-5 h-5 text-blue-700" />
                <span>Chat</span>
              </button>

              <!-- Masukkan Keranjang Button -->
              <button type="button" @click="handleAddToCart" :disabled="selectedColorStock <= 0 || isAdding"
                :class="['btn-blue-cart', { 'cart-success': isJustAdded }]">
                <span v-if="isAdding" class="btn-spinner"></span>
                <Icon v-else-if="isJustAdded" name="lucide:check-circle-2" class="w-5 h-5 text-emerald-600" />
                <Icon v-else name="lucide:shopping-bag" class="w-5 h-5" />
                <span>{{
                  selectedColorStock <= 0 ? 'Stok Habis' : isAdding ? 'Menambahkan...' : isJustAdded
                    ? 'Masuk Keranjang!' : '+ Masukkan Keranjang' }}</span>
              </button>

              <!-- Beli Sekarang Button -->
              <button type="button" @click="handleBuyNow" :disabled="selectedColorStock <= 0 || isBuying"
                class="btn-blue-buy">
                <span v-if="isBuying" class="btn-spinner"></span>
                <span>{{ selectedColorStock <= 0 ? 'Stok Habis' : isBuying ? 'Memproses...' : 'Beli Sekarang' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Store Profile Section -->
        <div class="store-profile-card cyber-card">
          <div class="store-profile-left">
            <div class="store-header-left">
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
                  <h3 class="store-name">
                    {{ storeInfo?.store_name || 'BSI Cyber Store Official' }}
                  </h3>
                  <span class="badge-official-store">
                    <Icon name="lucide:shield-check" class="w-3.5 h-3.5 inline mr-0.5 text-white" />
                    Official Store
                  </span>
                </div>
                <p class="store-status-text">
                  <span class="pulse-dot-green"></span>
                  <span>Aktif • Siap Melayani Pembelian</span>
                </p>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="store-actions-row">
              <button type="button" class="btn-store-action btn-store-chat" @click="handleChatStore"
                title="Buka Chat Penjual untuk Menanyakan Ketersediaan Stok">
                <Icon name="lucide:message-square-text" class="w-4 h-4" />
                <span>Chat Toko</span>
              </button>
            </div>
          </div>

          <!-- Store Metrics -->
          <div class="store-metrics-grid">
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
                100% Produk Original
              </span>
            </div>
          </div>
        </div>

        <!-- Collapsible Dropdowns (Deskripsi, Spesifikasi, Penilaian) -->
        <div class="shopee-details-card cyber-card">
          <!-- Section 1: Spesifikasi Produk & Panduan Ukuran -->
          <div class="accordion-item" :class="{ 'is-open': openSections.specs }">
            <button type="button" class="accordion-header" @click="toggleSection('specs')"
              :aria-expanded="openSections.specs">
              <div class="accordion-header-left">
                <span class="accordion-icon-box">
                  <Icon name="lucide:sliders-horizontal" class="w-4 h-4 text-blue-600" />
                </span>
                <h3 class="accordion-title">Spesifikasi Produk</h3>
              </div>
              <div class="accordion-header-right">
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
                        <td class="spec-val">
                          {{ product.category?.name || '-' }}
                        </td>
                      </tr>
                      <tr>
                        <td class="spec-name">Berat Pengiriman</td>
                        <td class="spec-val">{{ product.weight || 500 }} gram</td>
                      </tr>
                      <tr v-if="product.sizes?.length">
                        <td class="spec-name">Pilihan Ukuran</td>
                        <td class="spec-val">{{ product.sizes.join(', ') }}</td>
                      </tr>
                      <tr v-if="product.material">
                        <td class="spec-name">Bahan</td>
                        <td class="spec-val highlight-mat">{{ product.material }}</td>
                      </tr>
                    </tbody>
                  </table>
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
                  <Icon name="lucide:file-text" class="w-4 h-4 text-blue-600" />
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
                  <p>
                    {{ product.description || 'Tidak ada deskripsi rinci untuk produk ini.' }}
                  </p>
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
                  <svg class="star-svg star-sm active" viewBox="0 0 24 24">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <h3 class="accordion-title">Penilaian Produk</h3>
                <span class="reviews-count-badge">({{ reviewsCount }})</span>
              </div>
              <div class="accordion-header-right">
                <div v-if="reviewsCount > 0 || product.rating" class="reviews-preview-rating">
                  <svg class="star-svg star-sm active" viewBox="0 0 24 24">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span class="score">{{ averageRating }}</span>
                  <span class="max">/ 5.0</span>
                </div>
                <Icon name="lucide:chevron-down" class="accordion-chevron w-5 h-5" />
              </div>
            </button>
            <Transition name="accordion">
              <div v-show="openSections.reviews" class="accordion-body">
                <div v-if="reviews.length === 0" class="empty-reviews">
                  <p>
                    Belum ada ulasan untuk produk ini. Jadilah pembeli pertama yang memberikan review!
                  </p>
                </div>
                <div v-else class="reviews-list">
                  <div v-for="rev in reviews" :key="rev.id" class="review-card">
                    <div class="review-header">
                      <img v-if="rev.user?.photo_url || rev.user?.photo"
                        :src="getImageUrl(rev.user?.photo_url || rev.user?.photo)" :alt="rev.user?.name || 'Customer'"
                        class="reviewer-avatar-img"
                        @error="(e: any) => { if (e.target) e.target.style.display = 'none' }" />
                      <div v-else class="reviewer-avatar">
                        {{ (rev.user?.name || rev.user_name || 'U').charAt(0).toUpperCase() }}
                      </div>
                      <div class="reviewer-meta">
                        <span class="reviewer-name">{{ getMaskedName(rev.user?.name || rev.user_name) }}</span>
                        <div class="review-stars">
                          <svg v-for="s in 5" :key="s"
                            :class="['star-svg', 'star-sm', { active: s <= (rev.rating || 5) }]" viewBox="0 0 24 24">
                            <path
                              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      </div>
                      <span class="review-date">
                        {{
                          rev.created_at
                            ? new Date(rev.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                            : 'Baru saja'
                        }}
                      </span>
                    </div>

                    <!-- Comment Text -->
                    <p class="review-comment">
                      {{ rev.comment || rev.review || 'Pembeli tidak meninggalkan komentar' }}
                    </p>
                    <!-- Foto Bukti Ulasan Pembeli -->
                    <div v-if="getReviewPhotos(rev).length > 0" class="review-photos-grid">
                      <button v-for="(photo, pIdx) in getReviewPhotos(rev)" :key="pIdx" type="button"
                        class="review-photo-btn" @click="openReviewPhotoLightbox(getReviewPhotos(rev), pIdx)"
                        title="Klik untuk memperbesar foto ulasan">
                        <img :src="getImageUrl(photo)" :alt="`Foto ulasan ${pIdx + 1}`" class="review-photo-thumb"
                          loading="lazy"
                          @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }" />
                        <div class="photo-overlay-zoom">
                          <Icon name="lucide:zoom-in" class="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>
                    </div>

                    <!-- Admin Reply -->
                    <div v-if="rev.reply || (rev.replies && rev.replies.length)" class="admin-reply-box">
                      <div class="reply-badge">
                        <Icon name="lucide:store" class="w-3.5 h-3.5 inline mr-1 text-blue-700" />
                        <span>Balasan Admin:</span>
                      </div>
                      <p>
                        {{ rev.reply || rev.replies[0]?.comment || rev.replies[0]?.reply }}
                      </p>
                    </div>
                  </div>

                  <!-- Action Button to View All Reviews -->
                  <div class="reviews-accordion-footer">
                    <NuxtLink :to="`/products/${product.slug || product.encrypted_id || product.id}/reviews`"
                      class="btn btn-secondary btn-all-reviews" title="Buka Halaman Penilaian Lengkap">
                      <span>Lihat Semua Ulasan</span>
                      <Icon name="lucide:arrow-right" class="w-4 h-4 ml-1.5" />
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Lightbox Galeri Foto -->
    <ClientOnly>
      <Teleport to="body" v-if="isMounted">
        <Transition name="fade">
          <div v-if="isLightboxOpen" class="shopee-modal-backdrop" @click.self="closeLightbox" role="dialog"
            aria-modal="true">
            <div class="shopee-modal-card">
              <button type="button" class="shopee-modal-close" @click="closeLightbox" title="Tutup (Esc)"
                aria-label="Tutup">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>

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

                <div v-if="allImages.length > 1" class="shopee-modal-counter">
                  {{ activeIndex + 1 }} / {{ allImages.length }}
                </div>
              </div>

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

                <div class="shopee-modal-footer">
                  <div class="shopee-modal-perk">
                    <Icon name="lucide:shield-check" class="w-4 h-4 text-blue-600" />
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
    </ClientOnly>

    <!-- Modal Lightbox Foto Panduan Ukuran -->
    <ClientOnly>
      <Teleport to="body" v-if="isMounted">
        <Transition name="fade">
          <div v-if="isSizeChartModalOpen" class="size-chart-modal-backdrop" @click.self="closeSizeChartModal"
            role="dialog" aria-modal="true">
            <div class="size-chart-modal-card">
              <div class="size-chart-modal-header">
                <div class="size-chart-modal-title-box">
                  <span class="size-chart-modal-icon">
                    <Icon name="lucide:ruler" class="w-5 h-5 text-blue-600" />
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

              <div class="size-chart-modal-body">
                <div class="size-chart-modal-img-wrapper">
                  <img v-if="sizeChartImage" :src="sizeChartImage" :alt="`Panduan Ukuran ${product?.name}`"
                    class="size-chart-modal-img" />
                </div>
              </div>

              <div class="size-chart-modal-footer">
                <div class="size-chart-modal-tips">
                  <Icon name="lucide:check-circle-2" class="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Tips: Toleransi ukuran jahitan ±1-2 cm. Pilihlah 1 ukuran lebih besar bila ragu untuk kenyamanan
                    gerak.</span>
                </div>

              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- Modal Lightbox Foto Ulasan Pembeli -->
    <ClientOnly>
      <Teleport to="body" v-if="isMounted">
        <Transition name="fade">
          <div v-if="reviewLightbox.isOpen" class="review-lightbox-backdrop" @click.self="closeReviewPhotoLightbox"
            role="dialog" aria-modal="true">
            <div class="review-lightbox-card">
              <div class="review-lightbox-header">
                <div class="review-lightbox-title">
                  <Icon name="lucide:image" class="w-4 h-4 text-blue-600" />
                  <span>Foto Ulasan Pembeli ({{ reviewLightbox.currentIndex + 1 }}/{{ reviewLightbox.photos.length
                  }})</span>
                </div>
                <button type="button" class="review-lightbox-close" @click="closeReviewPhotoLightbox"
                  title="Tutup (Esc)" aria-label="Tutup">
                  <Icon name="lucide:x" class="w-5 h-5" />
                </button>
              </div>

              <div class="review-lightbox-body">
                <img :src="getImageUrl(reviewLightbox.photos[reviewLightbox.currentIndex])"
                  :alt="`Foto Ulasan ${reviewLightbox.currentIndex + 1}`" class="review-lightbox-img"
                  @error="(e: any) => { if (e.target) e.target.src = '/placeholder-product.svg' }" />

                <button v-if="reviewLightbox.photos.length > 1" type="button" class="lightbox-arrow-btn arrow-prev"
                  @click.stop="
                    reviewLightbox.currentIndex =
                    (reviewLightbox.currentIndex - 1 + reviewLightbox.photos.length) % reviewLightbox.photos.length
                    " aria-label="Foto Sebelumnya">
                  <Icon name="lucide:chevron-left" class="w-6 h-6" />
                </button>

                <button v-if="reviewLightbox.photos.length > 1" type="button" class="lightbox-arrow-btn arrow-next"
                  @click.stop="
                    reviewLightbox.currentIndex = (reviewLightbox.currentIndex + 1) % reviewLightbox.photos.length
                    " aria-label="Foto Selanjutnya">
                  <Icon name="lucide:chevron-right" class="w-6 h-6" />
                </button>
              </div>

              <div v-if="reviewLightbox.photos.length > 1" class="review-lightbox-thumbs">
                <button v-for="(p, pIdx) in reviewLightbox.photos" :key="pIdx" type="button"
                  class="review-lightbox-thumb-btn" :class="{ active: pIdx === reviewLightbox.currentIndex }"
                  @click="reviewLightbox.currentIndex = pIdx">
                  <img :src="getImageUrl(p)" :alt="`Thumbnail ${pIdx + 1}`" class="thumb-mini-img" />
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- Modal Konfirmasi Varian & Ukuran Sebelum Cart / Checkout -->
    <ClientOnly>
      <Teleport to="body" v-if="isMounted">
        <Transition name="fade">
          <div v-if="isConfirmModalOpen" class="confirm-modal-backdrop" @click.self="closeConfirmModal" role="dialog"
            aria-modal="true">
            <div class="confirm-modal-card">
              <div class="confirm-modal-header">
                <div class="confirm-modal-title-box">
                  <span class="confirm-modal-icon">
                    <Icon :name="confirmActionType === 'cart' ? 'lucide:shopping-bag' : 'lucide:check-circle-2'"
                      class="w-5 h-5 text-blue-600" />
                  </span>
                  <div>
                    <h3 class="confirm-modal-title">
                      {{ confirmActionType === 'cart' ? 'Konfirmasi Tambah ke Keranjang' : 'Konfirmasi Beli Langsung' }}
                    </h3>
                    <p class="confirm-modal-subtitle">
                      Periksa kembali varian ukuran dan warna Anda sebelum melanjutkan.
                    </p>
                  </div>
                </div>
                <button type="button" class="confirm-modal-close" @click="closeConfirmModal" title="Tutup (Esc)"
                  aria-label="Tutup">
                  <Icon name="lucide:x" class="w-5 h-5" />
                </button>
              </div>

              <div class="confirm-modal-body">
                <!-- Product Summary Header -->
                <div class="confirm-product-summary">
                  <div class="confirm-product-thumb">
                    <img :src="getImageUrl(activeImage || product?.main_photo)" :alt="product?.name"
                      class="confirm-thumb-img" />
                  </div>
                  <div class="confirm-product-details">
                    <span v-if="product?.category?.name" class="confirm-category-badge">
                      {{ product.category.name }}
                    </span>
                    <h4 class="confirm-product-name">{{ product?.name }}</h4>
                    <div class="confirm-price-row">
                      <span class="confirm-price">{{ formatRupiah(product?.price) }}</span>
                      <span v-if="product?.original_price && product.original_price > product.price"
                        class="confirm-original-price">
                        {{ formatRupiah(product.original_price) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Pilihan Varian: Ukuran (Size) -->
                <div class="confirm-section">
                  <div class="confirm-section-header">
                    <span class="confirm-section-label">
                      <Icon name="lucide:ruler" class="w-4 h-4 text-blue-600 inline mr-1" />
                      Pilihan Ukuran (Size):
                    </span>
                    <span v-if="selectedSize" class="confirm-selected-tag">
                      Terpilih: <strong>{{ selectedSize }}</strong>
                    </span>
                  </div>
                  <div v-if="product?.sizes && product.sizes.length > 0" class="confirm-pills-row">
                    <button v-for="size in product.sizes" :key="size" type="button" @click="selectedSize = size"
                      :class="['confirm-pill', { active: selectedSize === size }]">
                      <Icon v-if="selectedSize === size" name="lucide:check" class="w-3.5 h-3.5 inline mr-1" />
                      {{ size }}
                    </button>
                  </div>
                  <div v-else class="confirm-single-tag">
                    <Icon name="lucide:check-circle" class="w-4 h-4 text-emerald-600" />
                    <span>Ukuran Standar (All Size)</span>
                  </div>
                </div>

                <!-- Pilihan Varian: Warna (Color) -->
                <div class="confirm-section">
                  <div class="confirm-section-header">
                    <span class="confirm-section-label">
                      <Icon name="lucide:palette" class="w-4 h-4 text-blue-600 inline mr-1" />
                      Pilihan Warna:
                    </span>
                    <span v-if="selectedColor" class="confirm-selected-tag">
                      Terpilih: <strong>{{ selectedColor }}</strong>
                    </span>
                  </div>
                  <div v-if="product?.is_event_maba" class="confirm-maba-notice">
                    <div class="confirm-maba-color-badge">
                      <Icon name="lucide:lock" class="w-3.5 h-3.5 text-blue-700" />
                      <span>Warna: <strong>{{ selectedColor }}</strong> (Terkunci otomatis sesuai digit NIM: <strong>{{
                        cleanNimDigits }}</strong>)</span>
                    </div>
                  </div>
                  <div v-else-if="product?.colors && product.colors.length > 0" class="confirm-pills-row">
                    <button v-for="color in product.colors" :key="getColorName(color)" type="button"
                      @click="getColorStock(color) > 0 ? (selectedColor = getColorName(color)) : null" :class="[
                        'confirm-pill',
                        { active: selectedColor === getColorName(color) },
                        { 'pill-disabled': getColorStock(color) <= 0 }
                      ]" :disabled="getColorStock(color) <= 0">
                      <Icon v-if="selectedColor === getColorName(color)" name="lucide:check"
                        class="w-3.5 h-3.5 inline mr-1" />
                      {{ getColorName(color) }}
                      <span v-if="getColorStock(color) <= 0"
                        style="font-size: 10px; color: #ef4444; margin-left: 3px">(Habis)</span>
                    </button>
                  </div>
                  <div v-else class="confirm-single-tag">
                    <Icon name="lucide:check-circle" class="w-4 h-4 text-emerald-600" />
                    <span>Warna Standar / Sesuai Foto</span>
                  </div>
                </div>

                <!-- Jumlah (Quantity) & Subtotal -->
                <div class="confirm-section confirm-section-qty">
                  <div class="confirm-qty-block">
                    <div class="confirm-qty-label-wrap">
                      <span class="confirm-section-label">Jumlah Pembelian:</span>
                      <span v-if="product?.is_event_maba" class="maba-max-limit-badge-modal">
                        (Maks. 1 unit)
                      </span>
                    </div>
                    <div class="qty-control confirm-qty-ctrl">
                      <button type="button" @click="decreaseQty" :disabled="quantity <= 1 || selectedColorStock <= 0"
                        class="qty-btn" aria-label="Kurangi kuantitas">
                        -
                      </button>
                      <span class="qty-number">{{ quantity }}</span>
                      <button type="button" @click="increaseQty"
                        :disabled="quantity >= maxAllowedQty || selectedColorStock <= 0" class="qty-btn"
                        :title="product?.is_event_maba && quantity >= 1 ? 'Maksimal 1 unit untuk Event Maba' : undefined"
                        aria-label="Tambah kuantitas">
                        +
                      </button>
                    </div>
                  </div>
                  <div class="confirm-subtotal-block">
                    <span class="confirm-subtotal-label">Subtotal Pesanan:</span>
                    <span class="confirm-subtotal-value">{{ formatRupiah((product?.price || 0) * quantity) }}</span>
                  </div>
                </div>
              </div>

              <div class="confirm-modal-footer">
                <button type="button" class="btn btn-secondary btn-cancel-confirm" @click="closeConfirmModal">
                  Batal
                </button>
                <button v-if="confirmActionType === 'cart'" type="button"
                  class="btn btn-blue-primary btn-submit-confirm" :disabled="isAdding" @click="executeAddToCart">
                  <span v-if="isAdding" class="btn-spinner"></span>
                  <Icon v-else name="lucide:shopping-bag" class="w-4 h-4" />
                  <span>{{ isAdding ? 'Menambahkan...' : 'Masukkan Keranjang' }}</span>
                </button>
                <button v-else type="button" class="btn btn-blue-primary btn-submit-confirm btn-submit-buy"
                  :disabled="isBuying" @click="executeBuyNow">
                  <span v-if="isBuying" class="btn-spinner"></span>
                  <Icon v-else name="lucide:arrow-right" class="w-4 h-4" />
                  <span>{{ isBuying ? 'Memproses...' : 'Ya, Lanjut Checkout' }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>
    </ClientOnly>

    <!-- Mobile Fixed Floating Action Bar (< 768px) -->
    <div v-if="product && !isLoading" class="mobile-sticky-product-bar">
      <div class="sticky-bar-content">
        <!-- Chat Store Icon Button -->
        <button type="button" @click="handleChatStore" class="sticky-icon-action-btn" title="Tanya Penjual via Chat"
          aria-label="Tanya Penjual via Chat">
          <Icon name="lucide:message-square-text" class="w-5 h-5 text-blue-700" />
          <span class="sticky-action-label">Chat</span>
        </button>

        <!-- Add to Cart Button -->
        <button type="button" @click="handleAddToCart" :disabled="selectedColorStock <= 0 || isAdding"
          class="btn-sticky-action btn-sticky-cart">
          <span v-if="isAdding" class="btn-spinner"></span>
          <Icon v-else name="lucide:shopping-bag" class="w-4 h-4 mr-1 inline-block" />
          <span>{{ selectedColorStock <= 0 ? 'Habis' : '+ Keranjang' }}</span>
        </button>

        <!-- Buy Now Button -->
        <button type="button" @click="handleBuyNow" :disabled="selectedColorStock <= 0 || isBuying"
          class="btn-sticky-action btn-sticky-buy">
          <span v-if="isBuying" class="btn-spinner"></span>
          <span>{{ selectedColorStock <= 0 ? 'Habis' : 'Beli Sekarang' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHead, useSeoMeta } from '#imports'
import { ref, computed, watch, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useFormat } from '~/composables/useFormat'
import { useToast } from '~/composables/useToast'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const route = useRoute()
const router = useRouter()
const { fetchProductDetail, fetchProductReviews, fetchStoreInfo, getImageUrl } = useApi()
const { formatRupiah, calculateDiscount } = useFormat()
const cartStore = useCartStore()
const authStore = useAuthStore()
const toast = useToast()
const isMounted = ref(false)

// Fetch Store Profile Info for the store card
const { data: storeInfoData } = await useAsyncData(
  'product-store-profile-info',
  () => fetchStoreInfo(),
  {
    lazy: true,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key]
  }
)
const storeInfo = computed(() => storeInfoData.value || null)

const productId = computed(() => String(route.params.id))
const quantity = ref(1)

// Accordion dropdown states for product details
const openSections = ref({
  desc: true,
  specs: true,
  reviews: true
})

const toggleSection = (section: 'desc' | 'specs' | 'reviews') => {
  openSections.value[section] = !openSections.value[section]
}

// Fetch product detail with lazy loading
const {
  data: detailData,
  pending,
  refresh: refreshDetail
} = await useAsyncData(
  `product-${productId.value}`,
  () => fetchProductDetail(productId.value),
  {
    lazy: true,
    watch: [() => productId.value]
  }
)

const product = computed(() => {
  if (!detailData.value) return null
  return detailData.value.product || detailData.value
})

const { data: reviewsData, refresh: refreshReviews } = await useAsyncData(
  `product-reviews-${productId.value}`,
  () => fetchProductReviews(product.value?.id || productId.value),
  {
    lazy: true,
    watch: [() => productId.value, () => product.value?.id]
  }
)

const reviews = computed<any[]>(() => {
  const res = reviewsData.value
  if (!res) return []
  if (Array.isArray(res)) return res
  if (Array.isArray(res.data)) return res.data
  if (Array.isArray(res.reviews)) return res.reviews
  return []
})

// Entry loading state
const isPageLoading = ref(true)
let pageLoadingTimer: ReturnType<typeof setTimeout> | null = null

const startPageLoading = () => {
  isPageLoading.value = true
  if (pageLoadingTimer) clearTimeout(pageLoadingTimer)
  pageLoadingTimer = setTimeout(() => {
    isPageLoading.value = false
  }, 400)
}

watch(
  () => productId.value,
  () => {
    startPageLoading()
  }
)

const isLoading = computed(() => pending.value || isPageLoading.value)

// Dynamic database metrics calculations
const reviewsCount = computed(() => {
  if (reviews.value && reviews.value.length > 0) {
    return reviews.value.length
  }
  return Number(product.value?.reviews_count || 0)
})

const averageRating = computed(() => {
  if (reviews.value && reviews.value.length > 0) {
    const sum = reviews.value.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    return (sum / reviews.value.length).toFixed(1)
  }
  if (product.value?.rating !== undefined && product.value?.rating !== null && product.value?.rating !== '') {
    const r = Number(product.value.rating)
    if (r > 0) return r.toFixed(1)
  }
  return '0.0'
})

const soldCount = computed(() => {
  const count = Number(
    product.value?.sold_count ??
    product.value?.sales_count ??
    product.value?.sold ??
    0
  )
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}RB+`
  }
  return `${count}`
})

const favoriteCount = computed(() => {
  return Number(product.value?.favorites_count || 0)
})

// Dynamic SEO & Open Graph Meta Tags
useSeoMeta({
  title: () =>
    product.value?.name ? `${product.value.name} | BSI Cyber Store` : 'Detail Produk | BSI Cyber Store',
  description: () =>
    product.value?.description?.slice(0, 160) ||
    'Katalog resmi perlengkapan kuliah, gadget, dan merchandise resmi BSI Cyber Store.',
  ogTitle: () => product.value?.name || 'Detail Produk',
  ogDescription: () => product.value?.description?.slice(0, 160) || 'Katalog resmi BSI Cyber Store.',
  ogImage: () => (product.value?.main_photo ? getImageUrl(product.value.main_photo) : '/placeholder-product.svg')
})

// Rich Snippets Schema.org JSON-LD
useHead(() => ({
  script: product.value
    ? [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.value.name,
          image: product.value.main_photo ? getImageUrl(product.value.main_photo) : undefined,
          description: product.value.description || undefined,
          sku: product.value.sku || undefined,
          category: product.value.category?.name || undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'IDR',
            price: product.value.price,
            availability: product.value.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
          }
        })
      }
    ]
    : []
}))

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
  return list.slice(0, 8)
})

const activeImage = ref<string>('')
watchEffect(() => {
  if (!allImages.value.includes(activeImage.value)) {
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
    const targetScroll = btnLeft - trackWidth / 2 + btnWidth / 2

    track.scrollTo({
      left: Math.max(0, targetScroll),
      behavior: 'smooth'
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
  if (import.meta.client && !isSizeChartModalOpen.value && !isConfirmModalOpen.value) {
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

// Computed Size Chart Photo
const sizeChartImage = computed(() => {
  if (!product.value) return null
  if (product.value.size_chart && isImageUrl(product.value.size_chart)) {
    return getImageUrl(product.value.size_chart)
  }
  if (product.value.size_guide && isImageUrl(product.value.size_guide)) {
    return getImageUrl(product.value.size_guide)
  }
  return null
})

// Modal Lightbox khusus Foto Panduan Ukuran
const isSizeChartModalOpen = ref(false)

const openSizeChartModal = () => {
  isSizeChartModalOpen.value = true
  if (import.meta.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeSizeChartModal = () => {
  isSizeChartModalOpen.value = false
  if (import.meta.client && !isLightboxOpen.value && !isConfirmModalOpen.value) {
    document.body.style.overflow = ''
  }
}

// Touch swipe detection for mobile gallery
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
    if (isConfirmModalOpen.value) closeConfirmModal()
    if (isSizeChartModalOpen.value) closeSizeChartModal()
    if (isLightboxOpen.value) closeLightbox()
  }
  if (isLightboxOpen.value) {
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }
}

onMounted(() => {
  isMounted.value = true
  startPageLoading()
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('keydown', handleReviewKeydown)
    refreshReviews()
  }
})

onUnmounted(() => {
  isMounted.value = false
  if (pageLoadingTimer) clearTimeout(pageLoadingTimer)
  if (justAddedTimer) clearTimeout(justAddedTimer)
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('keydown', handleReviewKeydown)
    document.body.style.overflow = ''
  }
})

// Helper for colors
const getColorName = (c: any): string => {
  if (!c) return ''
  if (typeof c === 'string') return c
  return c.name || ''
}

const getColorStock = (c: any): number => {
  if (!c) return product.value?.stock ?? 0
  if (typeof c === 'object' && c !== null && c.stock !== undefined && c.stock !== null) {
    return Number(c.stock) || 0
  }
  const colorName = typeof c === 'string' ? c : c.name
  if (product.value?.colors && Array.isArray(product.value.colors)) {
    const found = product.value.colors.find((item: any) => {
      if (typeof item === 'object' && item !== null) {
        return (item.name || '').toLowerCase().trim() === (colorName || '').toLowerCase().trim()
      }
      return false
    })
    if (found && typeof found === 'object' && found.stock !== undefined && found.stock !== null) {
      return Number(found.stock) || 0
    }
  }
  return product.value?.stock ?? 0
}

// Variant selections
const selectedSize = ref<string | null>(null)
const selectedColor = ref<string | null>(null)

const selectedColorStock = computed(() => {
  if (!product.value) return 0
  if (!product.value.colors || !product.value.colors.length) {
    return product.value.stock ?? 0
  }
  if (!selectedColor.value) {
    return product.value.stock ?? 0
  }
  return getColorStock(selectedColor.value)
})

watchEffect(() => {
  if (product.value) {
    if (product.value.sizes?.length && !selectedSize.value) {
      selectedSize.value = product.value.sizes[0]
    }
    if (product.value.colors?.length && !selectedColor.value) {
      const inStockColor = product.value.colors.find((c: any) => getColorStock(c) > 0)
      selectedColor.value = getColorName(inStockColor || product.value.colors[0])
    }
  }
})

const maxAllowedQty = computed(() => {
  if (product.value?.is_event_maba) return 1
  return selectedColorStock.value
})

// Auto clamp quantity when selected color changes or if event maba
watch(
  [selectedColorStock, () => product.value?.is_event_maba],
  ([newStock, isEvent]) => {
    if (isEvent) {
      quantity.value = 1
    } else if (newStock <= 0) {
      quantity.value = 1
    } else if (quantity.value > newStock) {
      quantity.value = newStock
    }
  },
  { immediate: true }
)

const discountPercent = computed(() => {
  if (!product.value) return 0
  return calculateDiscount(product.value.price, product.value.original_price)
})

const increaseQty = () => {
  if (product.value && quantity.value < maxAllowedQty.value) {
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

const handleNimInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const digitsOnly = target.value.replace(/\D/g, '').slice(0, 8)
  nimInput.value = digitsOnly
  target.value = digitsOnly
  if (digitsOnly.length === 8) {
    nimError.value = ''
  }
}

watch(nimInput, (val) => {
  const digitsOnly = String(val || '').replace(/\D/g, '').slice(0, 8)
  if (val !== digitsOnly) {
    nimInput.value = digitsOnly
  }
  if (digitsOnly.length === 8) {
    nimError.value = ''
  }
})

const cleanNimDigits = computed(() => nimInput.value.replace(/\D/g, '').slice(0, 8))
const isNimValid = computed(() => cleanNimDigits.value.length === 8)
const nimLastDigit = computed<number | null>(() => {
  if (!cleanNimDigits.value || cleanNimDigits.value.length !== 8) return null
  return parseInt(cleanNimDigits.value.slice(-1), 10)
})
const isNimOdd = computed(() => {
  if (nimLastDigit.value === null) return false
  return nimLastDigit.value % 2 !== 0
})

// Auto-lock color when NIM is entered for event maba product
watch(
  [isNimValid, isNimOdd, () => product.value?.is_event_maba],
  ([valid, odd, isEvent]) => {
    if (isEvent && valid && product.value) {
      const targetColor = odd
        ? product.value.maba_color_ganjil || 'Putih'
        : product.value.maba_color_genap || 'Biru'

      const matched = product.value.colors?.find((c: any) => {
        const name = getColorName(c)
        return (
          name.toLowerCase().trim() === targetColor.toLowerCase().trim() ||
          name.toLowerCase().includes(targetColor.toLowerCase())
        )
      })

      selectedColor.value = matched ? getColorName(matched) : targetColor
      nimError.value = ''
    }
  }
)

const isAdding = ref(false)
const isBuying = ref(false)
const isJustAdded = ref(false)
let justAddedTimer: any = null

// Modal konfirmasi varian & ukuran sebelum checkout / add to cart
const isConfirmModalOpen = ref(false)
const confirmActionType = ref<'cart' | 'buy_now'>('cart')

const openConfirmModal = (action: 'cart' | 'buy_now') => {
  if (!product.value || selectedColorStock.value <= 0) return
  if (product.value.is_event_maba) {
    if (!cleanNimDigits.value || cleanNimDigits.value.length !== 8) {
      nimError.value = 'Wajib memasukkan 8 digit NIM lengkap untuk pembelian produk Ormik & Semot!'
      return
    }
  }
  confirmActionType.value = action
  isConfirmModalOpen.value = true
  if (import.meta.client) {
    document.body.style.overflow = 'hidden'
  }
}

const closeConfirmModal = () => {
  isConfirmModalOpen.value = false
  if (import.meta.client && !isLightboxOpen.value && !isSizeChartModalOpen.value) {
    document.body.style.overflow = ''
  }
}

const handleAddToCart = () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Silakan masuk ke akun Anda terlebih dahulu untuk menambahkan produk ke keranjang.', {
      title: 'Perlu Masuk Akun',
      tag: 'AUTENTIKASI',
      duration: 3500
    })
    router.push('/auth/login')
    return
  }
  openConfirmModal('cart')
}

const handleBuyNow = () => {
  if (!authStore.isAuthenticated) {
    toast.warning('Silakan masuk ke akun Anda terlebih dahulu untuk melakukan pembelian.', {
      title: 'Perlu Masuk Akun',
      tag: 'AUTENTIKASI',
      duration: 3500
    })
    router.push('/auth/login')
    return
  }
  openConfirmModal('buy_now')
}

const handleChatStore = () => {
  if (!product.value) return
  const query: Record<string, string> = {}
  if (selectedSize.value) query.size = selectedSize.value
  if (selectedColor.value) query.color = selectedColor.value

  router.push({
    path: `/products/${product.value.id}/chat`,
    query
  })
}

const executeAddToCart = async () => {
  if (!product.value || product.value.stock <= 0 || isAdding.value) return
  isAdding.value = true
  try {
    const finalQty = product.value.is_event_maba ? 1 : quantity.value
    cartStore.addToCart(
      product.value,
      finalQty,
      selectedSize.value,
      selectedColor.value,
      product.value.is_event_maba ? cleanNimDigits.value : null,
      false
    )
    await new Promise((r) => setTimeout(r, 180))
    closeConfirmModal()
    isJustAdded.value = true
    if (justAddedTimer) clearTimeout(justAddedTimer)
    justAddedTimer = setTimeout(() => {
      isJustAdded.value = false
    }, 2200)

    toast.success('Berhasil menambahkan ke keranjang')
  } finally {
    isAdding.value = false
  }
}

const executeBuyNow = async () => {
  if (!product.value || product.value.stock <= 0 || isBuying.value) return
  isBuying.value = true
  try {
    const finalQty = product.value.is_event_maba ? 1 : quantity.value
    cartStore.addToCart(
      product.value,
      finalQty,
      selectedSize.value,
      selectedColor.value,
      product.value.is_event_maba ? cleanNimDigits.value : null
    )
    await new Promise((r) => setTimeout(r, 200))
    closeConfirmModal()
    router.push('/cart')
  } finally {
    isBuying.value = false
  }
}

// Review Photos Lightbox & Helpers
const getReviewPhotos = (rev: any): string[] => {
  if (!rev) return []
  if (Array.isArray(rev.photos) && rev.photos.length > 0) {
    return rev.photos.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
  }
  if (rev.photo) {
    if (typeof rev.photo === 'string') {
      try {
        const parsed = JSON.parse(rev.photo)
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
        }
      } catch {
        // regular string
      }
      if (rev.photo.trim().length > 0) return [rev.photo]
    }
    if (Array.isArray(rev.photo)) {
      return rev.photo.filter((p: any) => typeof p === 'string' && p.trim().length > 0)
    }
  }
  return []
}

const getMaskedName = (name?: string): string => {
  if (!name || !name.trim()) return 'Pengguna CyberStore'
  const trimmed = name.trim()
  if (trimmed.length <= 2) return trimmed
  const first = trimmed.charAt(0)
  const last = trimmed.charAt(trimmed.length - 1)
  return `${first}***${last}`
}

const reviewLightbox = ref({
  isOpen: false,
  photos: [] as string[],
  currentIndex: 0
})

const openReviewPhotoLightbox = (photos: string[], index: number = 0) => {
  if (!photos || photos.length === 0) return
  reviewLightbox.value = {
    isOpen: true,
    photos,
    currentIndex: Math.max(0, Math.min(index, photos.length - 1))
  }
}

const closeReviewPhotoLightbox = () => {
  reviewLightbox.value.isOpen = false
}

const handleReviewKeydown = (e: KeyboardEvent) => {
  if (reviewLightbox.value.isOpen) {
    if (e.key === 'Escape') {
      closeReviewPhotoLightbox()
    } else if (e.key === 'ArrowLeft' && reviewLightbox.value.photos.length > 1) {
      reviewLightbox.value.currentIndex =
        (reviewLightbox.value.currentIndex - 1 + reviewLightbox.value.photos.length) % reviewLightbox.value.photos.length
    } else if (e.key === 'ArrowRight' && reviewLightbox.value.photos.length > 1) {
      reviewLightbox.value.currentIndex =
        (reviewLightbox.value.currentIndex + 1) % reviewLightbox.value.photos.length
    }
  }
}
</script>

<style scoped>
/* Page Base */
.product-detail-page {
  padding-top: 1.25rem;
  padding-bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 1200px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Breadcrumbs */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  color: #555555;
  flex-wrap: wrap;
}

.breadcrumb a {
  color: #004aad;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.breadcrumb a:hover {
  color: #003399;
  text-decoration: underline;
}

.breadcrumb .current {
  color: #1e293b;
  font-weight: 600;
  max-width: 480px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Transitions */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.detail-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.detail-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Loading & Not Found */
.detail-loading-box {
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  gap: 1.25rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 51, 153, 0.05);
}

.not-found-box {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 2rem;
  gap: 1rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.empty-icon {
  font-size: 3rem;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.35);
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

/* ==========================================================================
   MAIN CARD (LEFT GALLERY & RIGHT INFO)
   ========================================================================== */
.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
}

.shopee-main-card {
  display: grid;
  grid-template-columns: minmax(320px, 450px) 1fr;
  gap: 2rem;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
  padding: 1.75rem;
  align-items: start;
  width: 100%;
  box-sizing: border-box;
}

/* ==========================================================================
   LEFT: GALLERY COLUMN
   ========================================================================== */
.gallery-col {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  min-width: 0;
}

.main-image-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-product-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #ffffff;
  transition: transform 0.25s ease;
  pointer-events: none;
}

/* Out of Stock Overlay (Circular Dark Badge "Habis") */
.shopee-habis-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
}

.shopee-habis-circle {
  width: 105px;
  height: 105px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.shopee-habis-circle span {
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* Slide Nav Arrows */
.main-slide-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 52px;
  background: rgba(0, 51, 153, 0.35);
  backdrop-filter: blur(4px);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 6;
  border-radius: 4px;
}

.main-image-frame:hover .main-slide-nav {
  opacity: 1;
}

.main-slide-nav:hover {
  background: rgba(0, 51, 153, 0.85);
}

.main-slide-nav.nav-prev {
  left: 0;
}

.main-slide-nav.nav-next {
  right: 0;
}

/* Thumbnail Row */
.thumbnail-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
}

.thumb-arrow-btn {
  width: 30px;
  height: 58px;
  background: #f1f5f9;
  color: #003399;
  border: 1px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.thumb-arrow-btn:hover {
  background: #003399;
  color: #ffffff;
  border-color: #003399;
}

.thumbnails-track {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  flex: 1;
  scrollbar-width: none;
  padding: 2px;
}

.thumbnails-track::-webkit-scrollbar {
  display: none;
}

.thumb-btn {
  width: 68px;
  height: 68px;
  border: 2px solid #e2e8f0;
  padding: 2px;
  background: #ffffff;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s ease;
}

.thumb-btn.active {
  border-color: #003399;
  box-shadow: 0 0 10px rgba(0, 51, 153, 0.25);
}

.thumb-btn:hover:not(.active) {
  border-color: #93c5fd;
}

.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Share & Favorite Row */
.gallery-social-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 0.5rem;
  font-size: 0.8125rem;
  color: #334155;
}

.social-share-group {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.social-label {
  color: #1e293b;
  font-weight: 600;
}

.social-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease;
}

.social-icon-btn:hover {
  transform: scale(1.15);
}

.social-divider {
  width: 1px;
  height: 16px;
  background: #cbd5e1;
}

.favorite-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #004aad;
  font-size: 0.8125rem;
  font-weight: 600;
  transition: color 0.15s ease;
}

.favorite-action-btn:hover {
  color: #003399;
}

/* ==========================================================================
   RIGHT: PRODUCT INFO COLUMN (FULLY RESPONSIVE)
   ========================================================================== */
.info-col {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  width: 100%;
  min-width: 0;
}

.shopee-product-title {
  font-size: clamp(1.15rem, 2.5vw, 1.4rem);
  font-weight: 700;
  line-height: 1.35;
  color: #0f172a;
  margin: 0;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* Stats Row */
.shopee-stats-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem 0.85rem;
  font-size: 0.875rem;
  color: #64748b;
  width: 100%;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.stat-rating {
  color: #003399;
  font-weight: 700;
}

.rating-number {
  border-bottom: 1.5px solid #003399;
  line-height: 1.2;
}

.rating-stars-group {
  display: flex;
  align-items: center;
  gap: 1.5px;
}

.star-svg.star-sm {
  width: 14px;
  height: 14px;
}

.star-svg.active {
  fill: #f59e0b;
  stroke: #d97706;
  filter: drop-shadow(0 1px 2px rgba(245, 158, 11, 0.3));
}

.stat-divider {
  width: 1px;
  height: 14px;
  background: #cbd5e1;
}

.stat-reviews-link {
  color: #0f172a;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}

.stat-reviews-link:hover {
  color: #004aad;
}

.stat-number-underlined {
  color: #0f172a;
  font-weight: 600;
  border-bottom: 1.5px solid #0f172a;
  line-height: 1.2;
}

.stat-label {
  color: #64748b;
  font-size: 0.8125rem;
  margin-left: 2px;
}

.stat-sold {
  color: #0f172a;
}

.stat-number {
  font-weight: 600;
  color: #0f172a;
}

/* Price Banner Box */
.shopee-price-banner {
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 0.95rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.price-strike {
  font-size: clamp(0.85rem, 1.8vw, 0.95rem);
  color: #94a3b8;
  text-decoration: line-through;
}

.price-main {
  font-size: clamp(1.45rem, 3.5vw, 1.85rem);
  font-weight: 800;
  color: #003399;
  letter-spacing: -0.01em;
  word-break: break-word;
}

.shopee-discount-badge {
  background: #003399;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Attribute Table */
.shopee-attributes-block {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding-top: 0.25rem;
  width: 100%;
}

.attr-row {
  display: grid;
  grid-template-columns: 105px 1fr;
  align-items: flex-start;
  gap: 0.85rem;
  font-size: 0.875rem;
  width: 100%;
  min-width: 0;
}

.attr-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5;
  padding-top: 3px;
  white-space: nowrap;
}

.attr-value {
  color: #0f172a;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

/* Shipping Details */
.shipping-value-box {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  width: 100%;
}

.shipping-free-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.free-ongkir-badge {
  color: #004aad;
  font-size: 0.8125rem;
  font-weight: 700;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  padding: 2px 7px;
  border-radius: 4px;
  white-space: nowrap;
}

.shipping-hint {
  color: #64748b;
  font-size: 0.8125rem;
}

.shipping-dest-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  flex-wrap: wrap;
}

.shipping-sub-label {
  color: #64748b;
}

.shipping-dest-text {
  color: #0f172a;
  font-weight: 600;
}

/* Jaminan Box */
.jaminan-value-box {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8125rem;
  color: #0f172a;
  flex-wrap: wrap;
}

.jaminan-text {
  color: #334155;
  font-weight: 500;
}

/* Event Maba Box */
.maba-value-box {
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  border-radius: 8px;
  padding: 0.85rem;
  gap: 0.55rem;
  width: 100%;
  box-sizing: border-box;
}

.maba-header-pill {
  font-size: 0.775rem;
  font-weight: 700;
  color: #003399;
  display: flex;
  align-items: center;
}

.maba-rules-text {
  font-size: 0.78rem;
  color: #334155;
  line-height: 1.45;
  margin: 0;
  word-break: break-word;
}

.maba-rules-text strong {
  color: #004aad;
}

.maba-nim-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  width: 100%;
}

.shopee-nim-input {
  width: 100%;
  max-width: 270px;
  padding: 0.5rem 0.75rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  box-sizing: border-box;
}

.shopee-nim-input:focus {
  outline: none;
  border-color: #004aad;
}

.shopee-nim-input.border-error {
  border-color: #ef4444;
}

.nim-status-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  white-space: normal;
  line-height: 1.3;
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

/* Option Grid */
.shopee-options-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.shopee-option-btn {
  position: relative;
  min-width: 52px;
  height: 38px;
  padding: 0 0.85rem;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  user-select: none;
  max-width: 100%;
}

.shopee-option-btn:hover {
  border-color: #004aad;
  color: #003399;
  background: #eff6ff;
}

.shopee-option-btn.active {
  border-color: #003399;
  color: #003399;
  background: #eff6ff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0, 51, 153, 0.15);
}

.active-corner-check {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 14px 14px;
  border-color: transparent transparent #003399 transparent;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.active-corner-check svg {
  position: absolute;
  right: 0px;
  bottom: 0px;
}

.shopee-option-btn.btn-disabled {
  border-style: dashed;
  border-color: #cbd5e1;
  color: #94a3b8;
  background: #f8fafc;
  cursor: not-allowed;
}

.shopee-option-btn.btn-locked {
  border-color: #003399;
  color: #003399;
  background: #eff6ff;
  font-weight: 700;
}

.opt-stock-empty {
  font-size: 0.7rem;
  color: #ef4444;
  margin-left: 3px;
  font-weight: 700;
}

.color-locked-subtext {
  font-size: 0.75rem;
  color: #004aad;
  font-weight: 600;
  word-break: break-word;
}

.shopee-size-chart-link {
  display: inline-flex;
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #004aad;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.shopee-size-chart-link:hover {
  background: #dbeafe;
  border-color: #93c5fd;
  color: #003399;
}

/* Quantity Box */
.qty-value-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
}

.shopee-qty-controller {
  display: flex;
  align-items: center;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
  height: 34px;
  background: #ffffff;
  flex-shrink: 0;
}

.qty-step-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: #f8fafc;
  color: #334155;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.qty-step-btn:hover:not(:disabled) {
  background: #eff6ff;
  color: #003399;
}

.qty-step-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.qty-input-num {
  width: 48px;
  height: 34px;
  border: none;
  border-left: 1px solid #cbd5e1;
  border-right: 1px solid #cbd5e1;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 700;
  color: #0f172a;
  outline: none;
  background: #ffffff;
}

.stock-status-text {
  color: #64748b;
  font-size: 0.8125rem;
  font-weight: 500;
}

.stock-status-text.is-out-of-stock {
  color: #ef4444;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.maba-limit-tag {
  font-size: 0.75rem;
  color: #004aad;
  font-weight: 600;
}

/* Action Buttons Row */
.shopee-action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: stretch;
  margin-top: 1rem;
  width: 100%;
}

.btn-shopee-chat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 46px;
  padding: 0 1.25rem;
  background: #ffffff;
  border: 1.5px solid #004aad;
  color: #004aad;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-shopee-chat:hover {
  background: #eff6ff;
  border-color: #003399;
  color: #003399;
}

.btn-blue-cart {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0 1.25rem;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  color: #003399;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  flex: 1;
  min-width: 160px;
  white-space: nowrap;
}

.btn-blue-cart:hover:not(:disabled) {
  background: #dbeafe;
  border-color: #93c5fd;
  transform: translateY(-1px);
}

.btn-blue-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #e2e8f0;
  color: #94a3b8;
}

.btn-blue-buy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 0 1.5rem;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  border: 1.5px solid #003399;
  color: #ffffff;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  flex: 1;
  min-width: 140px;
  white-space: nowrap;
  box-shadow: 0 4px 14px rgba(0, 51, 153, 0.25);
}

.btn-blue-buy:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0, 51, 153, 0.35);
}

.btn-blue-buy:disabled {
  background: #cbd5e1;
  border-color: #cbd5e1;
  color: #ffffff;
  cursor: not-allowed;
  box-shadow: none;
}

/* Store Profile Card */
.store-profile-card {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 2rem;
  align-items: center;
  padding: 1.35rem 1.75rem;
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
}

.store-profile-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  border-right: 1px solid #f1f5f9;
  padding-right: 1.5rem;
}

.store-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.store-avatar-box {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 1.5px solid #cbd5e1;
  padding: 2px;
  flex-shrink: 0;
}

.store-avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.store-online-badge {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.store-info-box {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.store-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.store-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.badge-official-store {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}

.store-status-text {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.pulse-dot-green {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.btn-store-chat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.95rem;
  font-size: 0.8125rem;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  background: #eff6ff;
  border: 1.5px solid #004aad;
  color: #003399;
  transition: all 0.15s ease;
}

.btn-store-chat:hover {
  background: #004aad;
  color: #ffffff;
}

.store-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem 1.25rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
}

.metric-value {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Accordions */
.shopee-details-card {
  background: #ffffff;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.accordion-item {
  border-bottom: 1px solid #f1f5f9;
}

.accordion-item:last-child {
  border-bottom: none;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.5rem;
  background: #ffffff;
  cursor: pointer;
  border: none;
  text-align: left;
  transition: background-color 0.15s ease;
}

.accordion-header:hover {
  background: #f8fafc;
}

.accordion-header-left {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.accordion-icon-box {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.accordion-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.reviews-count-badge {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 600;
}

.accordion-header-right {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.reviews-preview-rating {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8125rem;
  font-weight: 700;
  color: #d97706;
}

.accordion-chevron {
  color: #64748b;
  transition: transform 0.2s ease;
}

.accordion-item.is-open .accordion-chevron {
  transform: rotate(180deg);
  color: #003399;
}

.accordion-body {
  padding: 1.25rem 1.5rem;
}

.description-content {
  font-size: 0.9rem;
  line-height: 1.75;
  color: #334155;
  white-space: pre-line;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid #f1f5f9;
}

.specs-table tr:last-child {
  border-bottom: none;
}

.specs-table td {
  padding: 0.75rem 0.5rem;
  font-size: 0.875rem;
}

.spec-name {
  color: #64748b;
  width: 25%;
  min-width: 120px;
  font-weight: 600;
}

.spec-val {
  color: #0f172a;
  font-weight: 600;
}

.highlight-mat {
  color: #003399;
}

/* Reviews List */
.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-card {
  padding: 1.1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.reviewer-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reviewer-avatar-img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #003399;
}

.reviewer-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.reviewer-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
}

.review-stars {
  display: flex;
  align-items: center;
  gap: 1px;
}

.review-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.review-comment {
  font-size: 0.85rem;
  color: #334155;
  line-height: 1.5;
  margin: 0;
}

.review-photos-grid {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.review-photo-btn {
  position: relative;
  width: 68px;
  height: 68px;
  border: 1.5px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: all 0.15s ease;
}

.review-photo-btn:hover {
  border-color: #003399;
  transform: translateY(-1px);
}

.review-photo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.admin-reply-box {
  background: #eff6ff;
  border-left: 3px solid #003399;
  padding: 0.65rem 0.85rem;
  border-radius: 4px;
}

.reply-badge {
  font-size: 0.75rem;
  font-weight: 700;
  color: #003399;
}

.admin-reply-box p {
  font-size: 0.8rem;
  color: #1e293b;
  margin: 2px 0 0 0;
}

.reviews-accordion-footer {
  display: flex;
  justify-content: center;
  margin-top: 0.75rem;
}

.btn-all-reviews {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 1.5rem;
  background: #eff6ff;
  border: 1.5px solid #bfdbfe;
  color: #003399;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.15s ease;
}

.btn-all-reviews:hover {
  background: #dbeafe;
  border-color: #93c5fd;
}

/* Modals */
.shopee-modal-backdrop,
.size-chart-modal-backdrop,
.review-lightbox-backdrop,
.confirm-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(15, 23, 42, 0.7);
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
  max-width: 920px;
  max-height: 85vh;
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  border: 1px solid #e2e8f0;
}

.shopee-modal-close,
.size-chart-modal-close,
.review-lightbox-close,
.confirm-modal-close {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
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
  transition: all 0.15s ease;
}

.shopee-modal-close:hover,
.size-chart-modal-close:hover,
.review-lightbox-close:hover,
.confirm-modal-close:hover {
  background: #ef4444;
  color: #ffffff;
  border-color: #ef4444;
}

.shopee-modal-left {
  position: relative;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border-right: 1px solid #e2e8f0;
}

.shopee-main-img-box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.shopee-main-img {
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
}

.shopee-modal-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 50px;
  background: rgba(0, 51, 153, 0.4);
  color: #ffffff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.shopee-modal-nav:hover {
  background: rgba(0, 51, 153, 0.85);
}

.shopee-modal-nav.nav-prev {
  left: 0.5rem;
}

.shopee-modal-nav.nav-next {
  right: 0.5rem;
}

.shopee-modal-counter {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  background: rgba(0, 51, 153, 0.85);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.shopee-modal-right {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.shopee-modal-category {
  font-size: 0.75rem;
  color: #004aad;
  font-weight: 700;
  text-transform: uppercase;
}

.shopee-modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0.25rem 0;
}

.shopee-modal-price {
  font-size: 1.35rem;
  font-weight: 800;
  color: #003399;
}

.shopee-modal-thumbs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  max-height: 220px;
  overflow-y: auto;
}

.shopee-thumb-btn {
  aspect-ratio: 1;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.shopee-thumb-btn.active {
  border-color: #003399;
  box-shadow: 0 0 8px rgba(0, 51, 153, 0.25);
}

.shopee-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Confirm Modal */
.confirm-modal-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 540px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.confirm-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.35rem;
  border-bottom: 1px solid #f1f5f9;
}

.confirm-modal-title-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.confirm-modal-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.confirm-modal-subtitle {
  font-size: 0.775rem;
  color: #64748b;
  margin: 0;
}

.confirm-modal-body {
  padding: 1.25rem 1.35rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confirm-product-summary {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: #f8fafc;
  padding: 0.85rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.confirm-product-thumb {
  width: 58px;
  height: 58px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  overflow: hidden;
  background: #ffffff;
}

.confirm-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.confirm-product-details {
  flex: 1;
}

.confirm-product-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.confirm-price {
  font-size: 0.95rem;
  font-weight: 800;
  color: #003399;
}

.confirm-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.confirm-section-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #334155;
}

.confirm-pills-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.confirm-pill {
  padding: 0.4rem 0.85rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  color: #334155;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-pill.active {
  border-color: #003399;
  background: #003399;
  color: #ffffff;
}

.confirm-section-qty {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  padding: 0.85rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.confirm-subtotal-value {
  font-size: 1.15rem;
  font-weight: 800;
  color: #003399;
}

.confirm-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.95rem 1.35rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.btn-cancel-confirm {
  padding: 0.55rem 1.15rem;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit-confirm {
  padding: 0.55rem 1.35rem;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  border: none;
  color: #ffffff;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

.btn-submit-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #1d4ed8 0%, #002266 100%);
}

/* Size Chart Modal */
.size-chart-modal-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 850px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
  border: 1px solid #e2e8f0;
}

.size-chart-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.35rem;
  border-bottom: 1px solid #f1f5f9;
}

.size-chart-modal-title-box {
  display: flex;
  align-items: center;
  gap: 0.65rem;
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
}

.size-chart-modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.size-chart-modal-desc {
  font-size: 0.78rem;
  color: #64748b;
  margin: 0;
}

.size-chart-modal-body {
  padding: 1.25rem;
  background: #f8fafc;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-chart-modal-img {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 6px;
}

.size-chart-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.95rem 1.35rem;
  border-top: 1px solid #f1f5f9;
}

.size-chart-modal-tips {
  font-size: 0.8rem;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.btn-blue-primary {
  padding: 0.55rem 1.25rem;
  background: linear-gradient(135deg, #004aad 0%, #003399 100%);
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

/* Review Lightbox */
.review-lightbox-card {
  position: relative;
  background: #0f172a;
  border-radius: 12px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-lightbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.95rem 1.35rem;
  border-bottom: 1px solid #1e293b;
  color: #ffffff;
}

.review-lightbox-body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: 60vh;
  padding: 1rem;
}

.review-lightbox-img {
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
}

.lightbox-arrow-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #003399;
}

.lightbox-arrow-btn.arrow-prev {
  left: 0.75rem;
}

.lightbox-arrow-btn.arrow-next {
  right: 0.75rem;
}

.review-lightbox-thumbs {
  display: flex;
  gap: 0.5rem;
  padding: 0.85rem 1.25rem;
  background: #1e293b;
  justify-content: center;
}

.review-lightbox-thumb-btn {
  width: 48px;
  height: 48px;
  border: 1.5px solid #475569;
  border-radius: 6px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}

.review-lightbox-thumb-btn.active {
  border-color: #38bdf8;
}

.thumb-mini-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Mobile Sticky Bar */
.mobile-sticky-product-bar {
  display: none;
}

/* Responsive Media Queries */
@media (max-width: 991px) {
  .shopee-main-card {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    padding: 1.25rem;
  }

  .gallery-col {
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
  }

  .store-profile-card {
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1.25rem;
  }

  .store-profile-left {
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
    padding-right: 0;
    padding-bottom: 1rem;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .product-detail-page {
    padding-top: 0.75rem;
    padding-bottom: 6rem;
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    gap: 1rem;
  }

  .breadcrumb {
    font-size: 0.75rem;
    gap: 0.3rem;
  }

  .breadcrumb .current {
    max-width: 200px;
  }

  .shopee-main-card {
    padding: 1rem;
    border-radius: 10px;
    gap: 1.25rem;
  }

  .gallery-col {
    max-width: 100%;
  }

  .main-slide-nav {
    opacity: 0.85;
    width: 32px;
    height: 44px;
  }

  .thumb-btn {
    width: 58px;
    height: 58px;
  }

  .thumb-arrow-btn {
    width: 26px;
    height: 50px;
  }

  .shopee-product-title {
    font-size: 1.2rem;
    line-height: 1.4;
  }

  .shopee-stats-row {
    font-size: 0.8125rem;
    gap: 0.65rem;
  }

  .price-main {
    font-size: 1.65rem;
  }

  .shopee-price-banner {
    padding: 0.85rem 1rem;
    gap: 0.65rem;
  }

  /* Ubah layout atribut dari 2-kolom sempit menjadi stacked vertikal agar leluasa di HP */
  .shopee-attributes-block {
    gap: 1rem;
  }

  .attr-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
  }

  .attr-label {
    font-size: 0.8125rem;
    color: #475569;
    font-weight: 700;
    padding-top: 0;
  }

  .shipping-dest-row {
    flex-wrap: wrap;
  }

  .maba-value-box {
    padding: 0.75rem;
  }

  .maba-nim-input-wrap {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }

  .shopee-nim-input {
    max-width: 100%;
    width: 100%;
    font-size: 0.95rem;
    padding: 0.55rem 0.75rem;
  }

  .nim-status-pill {
    text-align: center;
    align-self: flex-start;
  }

  .shopee-options-grid {
    gap: 0.45rem;
  }

  .shopee-option-btn {
    min-width: 52px;
    height: 38px;
    padding: 0 0.75rem;
    font-size: 0.8125rem;
  }

  .shopee-size-chart-link {
    margin-left: 0;
    margin-top: 0.25rem;
    width: 100%;
  }

  .qty-value-box {
    gap: 0.65rem;
  }

  .shopee-action-buttons {
    display: none !important;
  }

  /* Mobile Sticky Bottom Floating Action Bar */
  .mobile-sticky-product-bar {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background: #ffffff;
    border-top: 1px solid #e2e8f0;
    box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.1);
    padding: 0.5rem 0.75rem max(0.5rem, env(safe-area-inset-bottom, 0.5rem));
  }

  .sticky-bar-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .sticky-icon-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1px;
    min-width: 48px;
    height: 44px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
  }

  .sticky-icon-action-btn:active {
    background: #eff6ff;
    transform: scale(0.96);
  }

  .sticky-action-label {
    font-size: 0.65rem;
    color: #003399;
    font-weight: 700;
  }

  .btn-sticky-action {
    flex: 1;
    min-height: 44px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    transition: all 0.15s ease;
  }

  .btn-sticky-action:active {
    transform: scale(0.98);
  }

  .btn-sticky-cart {
    background: #eff6ff;
    border: 1.5px solid #bfdbfe;
    color: #003399;
  }

  .btn-sticky-buy {
    background: linear-gradient(135deg, #004aad 0%, #003399 100%);
    color: #ffffff;
    box-shadow: 0 3px 10px rgba(0, 51, 153, 0.25);
  }

  .btn-sticky-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Modals on Mobile */
  .shopee-modal-backdrop,
  .size-chart-modal-backdrop,
  .review-lightbox-backdrop,
  .confirm-modal-backdrop {
    padding: 0.5rem;
    align-items: flex-end;
  }

  .shopee-modal-card {
    grid-template-columns: 1fr;
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }

  .shopee-modal-left {
    min-height: 220px;
    padding: 1rem;
  }

  .shopee-modal-right {
    padding: 1rem;
  }

  .confirm-modal-card {
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }

  .confirm-modal-header {
    padding: 0.85rem 1rem;
  }

  .confirm-modal-body {
    padding: 1rem;
  }

  .confirm-modal-footer {
    padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
  }

  .size-chart-modal-card {
    max-height: 88vh;
    border-radius: 16px 16px 0 0;
  }

  .size-chart-modal-header {
    padding: 0.85rem 1rem;
  }

  .size-chart-modal-body {
    padding: 0.75rem;
  }

  .size-chart-modal-footer {
    padding: 0.75rem 1rem max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
  }

  .size-chart-modal-footer .btn-close-modal {
    width: 100%;
  }

  /* Accordion styles on mobile */
  .accordion-header {
    padding: 0.95rem 1rem;
  }

  .accordion-body {
    padding: 1rem;
  }

  .specs-table td {
    padding: 0.6rem 0.25rem;
    font-size: 0.8125rem;
  }

  .spec-name {
    width: 35%;
    min-width: 95px;
  }

  .store-metrics-grid {
    grid-template-columns: 1fr;
    gap: 0.65rem;
  }
}

@media (max-width: 480px) {
  .product-detail-page {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .breadcrumb .current {
    max-width: 130px;
  }

  .shopee-product-title {
    font-size: 1.125rem;
  }

  .price-main {
    font-size: 1.45rem;
  }

  .price-strike {
    font-size: 0.85rem;
  }

  .shopee-discount-badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }

  .store-header-left {
    gap: 0.75rem;
  }

  .store-avatar-box {
    width: 50px;
    height: 50px;
  }

  .store-name {
    font-size: 0.95rem;
  }

  .btn-store-chat {
    width: 100%;
    justify-content: center;
  }

  .store-actions-row {
    width: 100%;
  }

  .review-card {
    padding: 0.85rem;
  }

  .review-photo-btn {
    width: 60px;
    height: 60px;
  }

  .confirm-section-qty {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .confirm-subtotal-block {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }
}
</style>
