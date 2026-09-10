<template>
  <div class="profile-page container">
    <!-- Breadcrumb Navigation -->
    <nav class="breadcrumb-nav" aria-label="Breadcrumb">
      <NuxtLink to="/" class="breadcrumb-link">Beranda</NuxtLink>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-item">Akun</span>
      <span class="breadcrumb-separator">/</span>
      <span class="breadcrumb-current">Profil Saya</span>
    </nav>

    <!-- If Not Authenticated -->
    <div v-if="!authStore.isAuthenticated" class="auth-required-card cyber-card">
      <div class="lock-icon-circle">
        <Icon name="lucide:lock" class="w-8 h-8 text-bsi" />
      </div>
      <h2>Akses Profil Terbatas</h2>
      <p>Silakan masuk ke akun Anda terlebih dahulu untuk melihat dan mengelola profil Anda.</p>
      <NuxtLink to="/auth/login?redirect=/account/profile" class="btn btn-primary btn-auth-login">
        <span>Masuk Sekarang</span>
        <Icon name="lucide:arrow-right" class="w-4 h-4" />
      </NuxtLink>
    </div>

    <!-- Authenticated Profile Content -->
    <div v-else class="profile-main-layout">
      <!-- Global Toast Alert -->
      <transition name="toast-fade">
        <div v-if="toastMessage" :class="['profile-toast', `toast-${toastType}`]">
          <div class="toast-icon-wrap">
            <Icon v-if="toastType === 'success'" name="lucide:check-circle" class="w-5 h-5 text-emerald" />
            <Icon v-else name="lucide:alert-triangle" class="w-5 h-5 text-coral" />
          </div>
          <div class="toast-content">
            <p class="toast-text">{{ toastMessage }}</p>
          </div>
          <button type="button" @click="toastMessage = ''" class="toast-close-btn" aria-label="Tutup Notifikasi">
            <Icon name="lucide:x" class="w-3.5 h-3.5" />
          </button>
        </div>
      </transition>

      <!-- Profile Hero Card -->
      <section class="profile-hero-card cyber-card">
        <div class="hero-backdrop-glow"></div>
        <div class="hero-inner-row">
          <!-- Avatar Showcase with Upload Trigger -->
          <div class="avatar-column">
            <div class="avatar-wrapper" @click="triggerFileInput">
              <img
                v-if="avatarPreviewUrl || authStore.user?.photo"
                :src="avatarPreviewUrl || getImageUrl(authStore.user?.photo)"
                :alt="authStore.user?.name || 'Foto Profil'"
                class="user-avatar-img"
                @error="handleAvatarError"
              />
              <div v-else class="user-avatar-initials">
                {{ userInitials }}
              </div>

              <!-- Hover Overlay with Camera Icon -->
              <div class="avatar-hover-overlay" title="Klik untuk mengganti foto profil">
                <Icon name="lucide:camera" class="w-6 h-6 text-white" />
                <span class="overlay-text">Ganti Foto</span>
              </div>

              <!-- Upload Badge Icon (Mobile Visible) -->
              <button
                type="button"
                class="avatar-camera-badge"
                aria-label="Unggah foto profil baru"
                @click.stop="triggerFileInput"
              >
                <Icon name="lucide:camera" class="w-4 h-4 text-white" />
              </button>

              <!-- Hidden File Input -->
              <input
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                class="sr-only"
                @change="handleFileSelected"
              />
            </div>

            <!-- Temporary Preview Banner -->
            <div v-if="selectedFile" class="avatar-preview-badge">
              <span class="preview-dot"></span>
              <span>Foto baru terpilih</span>
              <button type="button" @click="cancelSelectedFile" class="btn-cancel-avatar" title="Batalkan foto">✕</button>
            </div>
          </div>

          <!-- User Details & Badges -->
          <div class="user-meta-column">
            <div class="meta-header-row">
              <h1 class="user-name-title">{{ authStore.user?.name }}</h1>
              <div class="badges-row">
                <span class="badge badge-cyan">
                  <span class="pulse-dot"></span>
                  <span>Member Resmi</span>
                </span>
                <span v-if="authStore.user?.email_verified_at" class="badge badge-emerald">
                  <Icon name="lucide:check" class="w-3.5 h-3.5" />
                  <span>Terverifikasi</span>
                </span>
              </div>
            </div>

            <p class="user-email-text">
              <Icon name="lucide:mail" class="w-4 h-4 text-muted" />
              <span>{{ authStore.user?.email }}</span>
            </p>

            <div class="user-stats-strip">
              <div class="stat-pill">
                <span class="stat-label">Nomor Kontak</span>
                <span class="stat-val">{{ authStore.user?.phone || 'Belum diatur' }}</span>
              </div>
              <div class="stat-pill">
                <span class="stat-label">Alamat Tersimpan</span>
                <span class="stat-val">{{ addresses.length }} Alamat</span>
              </div>
              <NuxtLink to="/account/orders" class="stat-pill stat-link">
                <span class="stat-label">Pesanan Anda</span>
                <span class="stat-val text-bsi">Lihat Riwayat →</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Navigation Tabs -->
      <div class="profile-tabs-wrapper">
        <button
          type="button"
          :class="['profile-tab-btn', { active: activeTab === 'biodata' }]"
          @click="activeTab = 'biodata'"
        >
          <Icon name="lucide:user" class="w-4 h-4" />
          <span>Biodata Diri & Foto</span>
        </button>

        <button
          type="button"
          :class="['profile-tab-btn', { active: activeTab === 'address' }]"
          @click="activeTab = 'address'"
        >
          <Icon name="lucide:map-pin" class="w-4 h-4" />
          <span>Buku Alamat Pengiriman</span>
          <span v-if="addresses.length > 0" class="tab-counter">{{ addresses.length }}</span>
        </button>

        <button
          type="button"
          :class="['profile-tab-btn', { active: activeTab === 'security' }]"
          @click="activeTab = 'security'"
        >
          <Icon name="lucide:lock" class="w-4 h-4" />
          <span>Keamanan & Sandi</span>
        </button>
      </div>

      <!-- TAB 1: BIODATA & FOTO PROFIL -->
      <section v-if="activeTab === 'biodata'" class="tab-pane-card cyber-card">
        <div class="pane-header">
          <div>
            <h2 class="pane-title">Informasi Pribadi & Kontak</h2>
            <p class="pane-desc">Perbarui foto profil, nomor handphone, serta alamat domisili utama Anda.</p>
          </div>
        </div>

        <form @submit.prevent="handleSaveProfile" class="profile-form">
          <!-- Profile Photo Selector Card -->
          <div class="photo-uploader-box">
            <div class="uploader-avatar-col">
              <img
                v-if="avatarPreviewUrl || authStore.user?.photo"
                :src="avatarPreviewUrl || getImageUrl(authStore.user?.photo)"
                :alt="form.name"
                class="uploader-avatar-img"
                @error="handleAvatarError"
              />
              <div v-else class="uploader-avatar-initials">
                {{ userInitials }}
              </div>
            </div>
            <div class="uploader-info-col">
              <h3 class="uploader-title">Foto Profil Akun</h3>
              <p class="uploader-desc">Format yang didukung: JPG, JPEG, PNG, atau WEBP. Ukuran maksimal 2 MB.</p>
              <div class="uploader-actions">
                <button
                  type="button"
                  @click="triggerFileInput"
                  class="btn btn-secondary btn-sm"
                >
                  <Icon name="lucide:upload" class="w-4 h-4" />
                  <span>{{ selectedFile ? 'Ganti Pilihan Foto' : 'Pilih Foto Baru' }}</span>
                </button>
                <button
                  v-if="selectedFile"
                  type="button"
                  @click="cancelSelectedFile"
                  class="btn-cancel-text"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>

          <!-- Form Fields Grid -->
          <div class="form-grid form-grid-2">
            <!-- Nama Lengkap -->
            <div class="form-group">
              <label class="form-label">Nama Lengkap <span class="text-danger">*</span></label>
              <div class="input-icon-wrapper">
                <span class="input-left-icon">
                  <Icon name="lucide:user" class="w-4 h-4 text-bsi" />
                </span>
                <input
                  v-model="form.name"
                  type="text"
                  required
                  placeholder="Nama Lengkap Anda"
                  class="input-cyber input-has-icon"
                />
              </div>
            </div>

            <!-- Email Address (Read-Only Info) -->
            <div class="form-group">
              <label class="form-label">Alamat Email <span class="text-danger">*</span></label>
              <div class="input-icon-wrapper">
                <span class="input-left-icon">
                  <Icon name="lucide:mail" class="w-4 h-4 text-bsi" />
                </span>
                <input
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  class="input-cyber input-has-icon"
                />
              </div>
              <span class="form-hint">Email digunakan untuk verifikasi login dan notifikasi pesanan.</span>
            </div>
          </div>

          <div class="form-grid form-grid-2">
            <!-- Nomor Handphone / WhatsApp -->
            <div class="form-group">
              <label class="form-label">Nomor WhatsApp / HP Aktif</label>
              <div class="input-icon-wrapper">
                <span class="input-left-icon">
                  <Icon name="lucide:phone" class="w-4 h-4 text-bsi" />
                </span>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  class="input-cyber input-has-icon"
                  @input="handlePhoneInput"
                />
              </div>
              <span class="form-hint">Gunakan format Indonesia (08xx atau 628xx), 10 - 15 digit.</span>
            </div>

            <!-- Role / Tipe Akun -->
            <div class="form-group">
              <label class="form-label">Tipe Akun</label>
              <input
                type="text"
                :value="authStore.user?.role === 'superadmin' ? 'Super Administrator' : authStore.user?.role === 'admin' ? 'Administrator Toko' : 'Member Mahasiswa / Pelanggan'"
                disabled
                class="input-cyber input-disabled"
              />
            </div>
          </div>

          <!-- Alamat Utama / Domisili -->
          <div class="form-group">
            <label class="form-label">Alamat Utama / Domisili</label>
            <textarea
              v-model="form.address"
              rows="3"
              placeholder="Masukkan alamat rumah atau tempat tinggal domisili Anda..."
              class="input-cyber textarea-cyber"
            ></textarea>
            <span class="form-hint">Alamat ini menjadi referensi tempat tinggal utama profil Anda.</span>
          </div>

          <!-- Submit Button -->
          <div class="form-actions-row">
            <button
              type="submit"
              :disabled="isSubmittingProfile"
              class="btn btn-primary btn-save"
            >
              <span v-if="isSubmittingProfile" class="btn-spinner-wrap">
                <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </span>
              <span v-else class="btn-content-wrap">
                <Icon name="lucide:check" class="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </span>
            </button>
          </div>
        </form>
      </section>

      <!-- TAB 2: BUKU ALAMAT PENGIRIMAN -->
      <section v-if="activeTab === 'address'" class="tab-pane-card cyber-card">
        <div class="pane-header flex-between">
          <div>
            <h2 class="pane-title">Buku Alamat Pengiriman</h2>
            <p class="pane-desc">Kelola alamat tujuan untuk mempermudah saat proses checkout barang pesanan Anda.</p>
          </div>
          <button
            type="button"
            @click="openAddAddressModal"
            class="btn btn-primary btn-sm"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            <span>Tambah Alamat Baru</span>
          </button>
        </div>

        <!-- Address List Loading -->
        <div v-if="isLoadingAddresses" class="address-loading-grid">
          <div v-for="i in 2" :key="i" class="address-card skeleton-card">
            <div class="skeleton-line skeleton" style="width: 40%"></div>
            <div class="skeleton-line skeleton" style="width: 70%"></div>
            <div class="skeleton-line skeleton" style="width: 90%"></div>
          </div>
        </div>

        <!-- Address List Empty State -->
        <div v-else-if="addresses.length === 0" class="empty-address-box">
          <div class="empty-icon-ring">
            <Icon name="lucide:map-pin" class="w-8 h-8 text-muted" />
          </div>
          <h3>Belum Ada Alamat Pengiriman</h3>
          <p>Tambahkan alamat pengiriman utama Anda untuk mempermudah proses pemesanan produk di Cyber Store.</p>
          <button type="button" @click="openAddAddressModal" class="btn btn-secondary btn-sm">
            <span>+ Tambah Alamat Sekarang</span>
          </button>
        </div>

        <!-- Address Cards Grid -->
        <div v-else class="address-grid">
          <div
            v-for="addr in addresses"
            :key="addr.id"
            :class="['saved-address-card', { 'is-default': addr.is_default }]"
          >
            <!-- Card Header -->
            <div class="card-top-row">
              <div class="labels-wrap">
                <span class="badge badge-cyan">{{ addr.label || 'Alamat' }}</span>
                <span v-if="addr.is_default" class="badge badge-emerald">
                  <Icon name="lucide:star" class="w-3 h-3 inline mr-1 fill-emerald-600 text-emerald-600" />
                  Alamat Utama
                </span>
              </div>
              <div class="card-quick-actions">
                <button
                  type="button"
                  @click="openEditAddressModal(addr)"
                  class="btn-icon-action"
                  title="Edit Alamat"
                >
                  <Icon name="lucide:edit" class="w-4 h-4 text-bsi" />
                </button>
                <button
                  type="button"
                  @click="confirmDeleteAddress(addr)"
                  class="btn-icon-action text-danger"
                  title="Hapus Alamat"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Receiver info -->
            <div class="receiver-meta">
              <strong class="receiver-name">{{ addr.receiver_name }}</strong>
              <span class="receiver-phone">{{ addr.phone }}</span>
            </div>

            <!-- Address Text -->
            <p class="address-full-text">{{ addr.address }}</p>
            <p class="address-geo-text">
              {{ addr.city }}, {{ addr.province }} <span v-if="addr.postal_code">({{ addr.postal_code }})</span>
            </p>

            <div v-if="addr.notes" class="address-notes-box">
              <span class="notes-icon">📌</span>
              <span class="notes-text">{{ addr.notes }}</span>
            </div>

            <!-- Titik Presisi GPS Badge -->
            <div v-if="addr.latitude && addr.longitude" class="address-geo-badge">
              <span class="geo-dot"></span>
              <span>Titik Presisi GPS Terpasang</span>
              <a
                :href="`https://www.google.com/maps?q=${addr.latitude},${addr.longitude}`"
                target="_blank"
                rel="noopener noreferrer"
                class="link-maps-inline"
                @click.stop
              >
                Google Maps ↗
              </a>
            </div>

            <!-- Bottom Button -->
            <div class="card-bottom-actions">
              <button
                v-if="!addr.is_default"
                type="button"
                @click="handleSetDefaultAddress(addr)"
                class="btn-set-default"
              >
                Jadikan Alamat Utama
              </button>
              <span v-else class="text-default-info">
                ✓ Digunakan sebagai alamat utama checkout
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: KEAMANAN & SANDI -->
      <section v-if="activeTab === 'security'" class="tab-pane-card cyber-card">
        <div class="pane-header">
          <div>
            <h2 class="pane-title">Perbarui Kata Sandi Akun</h2>
            <p class="pane-desc">Pastikan akun Anda tetap aman dengan menggunakan kombinasi kata sandi yang kuat.</p>
          </div>
        </div>

        <form @submit.prevent="handleSavePassword" class="password-form">
          <div class="form-group max-w-md">
            <label class="form-label">Kata Sandi Saat Ini <span class="text-danger">*</span></label>
            <div class="input-icon-wrapper">
              <span class="input-left-icon">
                <Icon name="lucide:lock" class="w-4 h-4 text-bsi" />
              </span>
              <input
                v-model="passwordForm.current_password"
                :type="showOldPassword ? 'text' : 'password'"
                required
                placeholder="Masukkan kata sandi saat ini"
                class="input-cyber input-has-icon input-password"
              />
              <button
                type="button"
                class="password-toggle-btn"
                @click="showOldPassword = !showOldPassword"
                tabindex="-1"
              >
                <Icon v-if="showOldPassword" name="lucide:eye" class="eye-icon w-4 h-4" />
                <Icon v-else name="lucide:eye-off" class="eye-icon w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="form-grid form-grid-2 max-w-2xl">
            <!-- Password Baru -->
            <div class="form-group">
              <label class="form-label">Kata Sandi Baru <span class="text-danger">*</span></label>
              <div class="input-icon-wrapper">
                <span class="input-left-icon">
                  <Icon name="lucide:lock" class="w-4 h-4 text-bsi" />
                </span>
                <input
                  v-model="passwordForm.password"
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  placeholder="Minimal 8 karakter"
                  class="input-cyber input-has-icon input-password"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  @click="showNewPassword = !showNewPassword"
                  tabindex="-1"
                >
                  <Icon v-if="showNewPassword" name="lucide:eye" class="eye-icon w-4 h-4" />
                  <Icon v-else name="lucide:eye-off" class="eye-icon w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Konfirmasi Password Baru -->
            <div class="form-group">
              <label class="form-label">Ulangi Kata Sandi Baru <span class="text-danger">*</span></label>
              <div class="input-icon-wrapper">
                <span class="input-left-icon">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-bsi" />
                </span>
                <input
                  v-model="passwordForm.password_confirmation"
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  placeholder="Ulangi kata sandi baru"
                  class="input-cyber input-has-icon input-password"
                />
              </div>
            </div>
          </div>

          <div class="form-actions-row">
            <button
              type="submit"
              :disabled="isSubmittingPassword"
              class="btn btn-primary btn-save"
            >
              <span v-if="isSubmittingPassword" class="btn-spinner-wrap">
                <Icon name="lucide:loader-2" class="spinner-icon w-4 h-4 animate-spin" />
                <span>Mengubah Kata Sandi...</span>
              </span>
              <span v-else class="btn-content-wrap">
                <span>Perbarui Kata Sandi</span>
              </span>
            </button>
          </div>
        </form>
      </section>
    </div>

    <!-- MODAL TAMBAH / EDIT ALAMAT -->
    <transition name="modal-fade">
      <div v-if="showAddressModal" class="modal-backdrop" @click.self="closeAddressModal">
        <div class="modal-dialog cyber-card">
          <div class="modal-header">
            <h3 class="modal-title">{{ editingAddressId ? 'Edit Alamat Pengiriman' : 'Tambah Alamat Baru' }}</h3>
            <button type="button" @click="closeAddressModal" class="modal-close-btn" aria-label="Tutup">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleSaveAddressModal" class="modal-form">
            <div class="form-grid form-grid-2">
              <div class="form-group">
                <label class="form-label">Label Alamat <span class="text-danger">*</span></label>
                <input
                  v-model="addressModalForm.label"
                  type="text"
                  required
                  placeholder="Misal: Rumah, Kos Kampus, Kantor"
                  class="input-cyber"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Nama Penerima <span class="text-danger">*</span></label>
                <input
                  v-model="addressModalForm.receiver_name"
                  type="text"
                  required
                  placeholder="Nama Lengkap Penerima"
                  class="input-cyber"
                />
              </div>
            </div>

            <div class="form-grid form-grid-2">
              <div class="form-group">
                <label class="form-label">Nomor Handphone / WA <span class="text-danger">*</span></label>
                <input
                  v-model="addressModalForm.phone"
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  class="input-cyber"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Provinsi <span class="text-danger">*</span></label>
                <input
                  v-model="addressModalForm.province"
                  type="text"
                  required
                  placeholder="Contoh: DKI Jakarta, Jawa Barat"
                  class="input-cyber"
                />
              </div>
            </div>

            <div class="form-grid form-grid-2">
              <div class="form-group">
                <label class="form-label">Kota / Kabupaten <span class="text-danger">*</span></label>
                <input
                  v-model="addressModalForm.city"
                  type="text"
                  required
                  placeholder="Contoh: Jakarta Timur, Bogor"
                  class="input-cyber"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Kode Pos (Opsional)</label>
                <input
                  v-model="addressModalForm.postal_code"
                  type="text"
                  placeholder="Contoh: 13210"
                  class="input-cyber"
                />
              </div>
            </div>

            <!-- Titik Presisi Google Maps & GPS -->
            <div class="form-group">
              <label class="form-label label-with-hint">
                <span>Titik Presisi Alamat (Google Maps & GPS)</span>
                <span class="text-hint">Memudahkan kurir ekspedisi mengantar paket dengan akurat</span>
              </label>
              <ClientOnly>
                <LocationPicker
                  :key="editingAddressId ? `edit-${editingAddressId}` : 'new-address'"
                  :initial-lat="addressModalForm.latitude"
                  :initial-lng="addressModalForm.longitude"
                  @update:location="handleLocationPicked"
                />
              </ClientOnly>
            </div>

            <div class="form-group">
              <label class="form-label">Alamat Lengkap <span class="text-danger">*</span></label>
              <textarea
                v-model="addressModalForm.address"
                rows="3"
                required
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi..."
                class="input-cyber textarea-cyber"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Catatan Pengiriman (Opsional)</label>
              <input
                v-model="addressModalForm.notes"
                type="text"
                placeholder="Misal: Titipkan di satpam, pagar warna hitam"
                class="input-cyber"
              />
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input
                  v-model="addressModalForm.is_default"
                  type="checkbox"
                  class="checkbox-cyber"
                />
                <span>Jadikan sebagai alamat utama pengiriman</span>
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" @click="closeAddressModal" class="btn btn-secondary">
                Batal
              </button>
              <button type="submit" :disabled="isSavingAddress" class="btn btn-primary">
                <span>{{ isSavingAddress ? 'Menyimpan...' : 'Simpan Alamat' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useApi } from '~/composables/useApi'

const authStore = useAuthStore()
const { getImageUrl, fetchAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } = useApi()

useHead({
  title: 'Profil Saya | BSI Cyber Store',
})

const activeTab = ref<'biodata' | 'address' | 'security'>('biodata')

// Toast Notifications
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
let toastTimer: any = null

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = ''
  }, 4500)
}

// User Initials
const userInitials = computed(() => {
  const name = authStore.user?.name || 'U'
  return name.charAt(0).toUpperCase()
})

// Avatar File Upload State
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const avatarPreviewUrl = ref<string>('')

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // Validasi Ukuran (Max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    showToast('Ukuran foto terlalu besar. Maksimal ukuran foto adalah 2 MB.', 'error')
    target.value = ''
    return
  }

  // Validasi format
  if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
    showToast('Format foto tidak didukung. Harap gunakan format JPG, PNG, atau WEBP.', 'error')
    target.value = ''
    return
  }

  selectedFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
  showToast('Foto baru berhasil dipilih. Klik "Simpan Perubahan Profil" untuk menerapkan.', 'success')
}

const cancelSelectedFile = () => {
  selectedFile.value = null
  avatarPreviewUrl.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleAvatarError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.style.display = 'none'
}

// TAB 1: Biodata Form
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
})
const isSubmittingProfile = ref(false)

const initFormData = () => {
  if (authStore.user) {
    form.value.name = authStore.user.name || ''
    form.value.email = authStore.user.email || ''
    form.value.phone = authStore.user.phone || ''
    form.value.address = authStore.user.address || ''
  }
}

const handlePhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const digits = target.value.replace(/\D/g, '')
  form.value.phone = digits.slice(0, 15)
}

const handleSaveProfile = async () => {
  isSubmittingProfile.value = true
  toastMessage.value = ''

  try {
    const formData = new FormData()
    formData.append('name', form.value.name.trim())
    formData.append('email', form.value.email.trim())
    if (form.value.phone) {
      formData.append('phone', form.value.phone.trim())
    }
    if (form.value.address) {
      formData.append('address', form.value.address.trim())
    }
    if (selectedFile.value) {
      formData.append('photo', selectedFile.value)
    }

    const result = await authStore.updateProfile(formData)

    if (result.success) {
      showToast(result.message || 'Profil dan foto berhasil diperbarui!', 'success')
      // Reset temporary selected file
      selectedFile.value = null
      avatarPreviewUrl.value = ''
      if (fileInputRef.value) fileInputRef.value.value = ''
      initFormData()
    } else {
      showToast(result.message || 'Gagal menyimpan perubahan profil.', 'error')
    }
  } catch (err: any) {
    showToast(err.message || 'Terjadi kesalahan sistem.', 'error')
  } finally {
    isSubmittingProfile.value = false
  }
}

// TAB 2: Address Book
const addresses = ref<any[]>([])
const isLoadingAddresses = ref(false)
const showAddressModal = ref(false)
const editingAddressId = ref<number | string | null>(null)
const isSavingAddress = ref(false)

const addressModalForm = ref({
  label: 'Rumah',
  receiver_name: '',
  phone: '',
  province: '',
  city: '',
  postal_code: '',
  address: '',
  notes: '',
  latitude: null as number | null,
  longitude: null as number | null,
  is_default: false,
})

const handleLocationPicked = (loc: {
  latitude: number
  longitude: number
  address?: string
  city?: string
  province?: string
  postal_code?: string
  district?: string
}) => {
  addressModalForm.value.latitude = loc.latitude
  addressModalForm.value.longitude = loc.longitude

  if (loc.address) {
    addressModalForm.value.address = loc.address
  }
  if (loc.city) {
    addressModalForm.value.city = loc.city
  }
  if (loc.province) {
    addressModalForm.value.province = loc.province
  }
  if (loc.postal_code) {
    addressModalForm.value.postal_code = loc.postal_code
  }
}

const loadAddresses = async () => {
  if (!authStore.isAuthenticated) return
  isLoadingAddresses.value = true
  try {
    const res = await fetchAddresses()
    addresses.value = res?.addresses || (Array.isArray(res) ? res : [])
  } catch (err) {
    console.error('Failed to fetch addresses:', err)
  } finally {
    isLoadingAddresses.value = false
  }
}

const openAddAddressModal = () => {
  editingAddressId.value = null
  addressModalForm.value = {
    label: 'Rumah',
    receiver_name: authStore.user?.name || '',
    phone: authStore.user?.phone || '',
    province: '',
    city: '',
    postal_code: '',
    address: '',
    notes: '',
    latitude: null,
    longitude: null,
    is_default: addresses.value.length === 0,
  }
  showAddressModal.value = true
}

const openEditAddressModal = (addr: any) => {
  editingAddressId.value = addr.id
  addressModalForm.value = {
    label: addr.label || 'Rumah',
    receiver_name: addr.receiver_name || '',
    phone: addr.phone || '',
    province: addr.province || '',
    city: addr.city || '',
    postal_code: addr.postal_code || '',
    address: addr.address || '',
    notes: addr.notes || '',
    latitude: addr.latitude ? Number(addr.latitude) : null,
    longitude: addr.longitude ? Number(addr.longitude) : null,
    is_default: !!addr.is_default,
  }
  showAddressModal.value = true
}

const closeAddressModal = () => {
  showAddressModal.value = false
  editingAddressId.value = null
}

const handleSaveAddressModal = async () => {
  isSavingAddress.value = true
  try {
    if (editingAddressId.value) {
      await updateAddress(editingAddressId.value, addressModalForm.value)
      showToast('Alamat berhasil diperbarui.', 'success')
    } else {
      await createAddress(addressModalForm.value)
      showToast('Alamat baru berhasil ditambahkan.', 'success')
    }
    closeAddressModal()
    await loadAddresses()
  } catch (err: any) {
    showToast(err.message || 'Gagal menyimpan alamat.', 'error')
  } finally {
    isSavingAddress.value = false
  }
}

const handleSetDefaultAddress = async (addr: any) => {
  try {
    await setDefaultAddress(addr.id, addr)
    showToast(`Alamat "${addr.label}" dijadikan alamat utama.`, 'success')
    await loadAddresses()
  } catch (err: any) {
    showToast(err.message || 'Gagal mengubah alamat utama.', 'error')
  }
}

const confirmDeleteAddress = async (addr: any) => {
  if (!confirm(`Hapus alamat "${addr.label}" (${addr.receiver_name})?`)) return

  try {
    await deleteAddress(addr.id)
    showToast('Alamat berhasil dihapus.', 'success')
    await loadAddresses()
  } catch (err: any) {
    showToast(err.message || 'Gagal menghapus alamat.', 'error')
  }
}

// TAB 3: Password Security Form
const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})
const showOldPassword = ref(false)
const showNewPassword = ref(false)
const isSubmittingPassword = ref(false)

const handleSavePassword = async () => {
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    showToast('Konfirmasi kata sandi baru tidak cocok.', 'error')
    return
  }

  isSubmittingPassword.value = true
  try {
    const formData = new FormData()
    formData.append('name', authStore.user?.name || '')
    formData.append('email', authStore.user?.email || '')
    formData.append('current_password', passwordForm.value.current_password)
    formData.append('password', passwordForm.value.password)
    formData.append('password_confirmation', passwordForm.value.password_confirmation)

    const result = await authStore.updateProfile(formData)

    if (result.success) {
      showToast('Kata sandi berhasil diperbarui!', 'success')
      passwordForm.value = {
        current_password: '',
        password: '',
        password_confirmation: '',
      }
    } else {
      showToast(result.message || 'Gagal mengubah kata sandi.', 'error')
    }
  } catch (err: any) {
    showToast(err.message || 'Terjadi kesalahan sistem.', 'error')
  } finally {
    isSubmittingPassword.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }
  if (authStore.isAuthenticated) {
    initFormData()
    loadAddresses()
  }
})
</script>

<style scoped>
.profile-page {
  padding-top: 2rem;
  padding-bottom: 4rem;
  max-width: 1040px;
}

/* Breadcrumbs */
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.breadcrumb-link {
  color: var(--ubsi-royal);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.breadcrumb-link:hover {
  color: var(--ubsi-blue-dark);
  text-decoration: underline;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

.breadcrumb-item {
  color: var(--text-secondary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 600;
}

/* Global Toast */
.profile-toast {
  position: sticky;
  top: 1.5rem;
  z-index: 100;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

.toast-success {
  background: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}

.toast-error {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #991b1b;
}

.toast-icon-wrap {
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
}

.toast-text {
  font-size: 0.925rem;
  font-weight: 500;
}

.toast-close-btn {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.toast-close-btn:hover {
  opacity: 1;
}

/* Unauthenticated State */
.auth-required-card {
  text-align: center;
  padding: 4rem 2rem;
  background: #ffffff;
  border-radius: 1.5rem;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-card);
}

.lock-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--ubsi-cyan-light);
  color: var(--ubsi-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.btn-auth-login {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding: 0.75rem 1.75rem;
}

/* Profile Hero Card */
.profile-hero-card {
  position: relative;
  background: linear-gradient(135deg, #0b1e3d 0%, #003399 50%, #002266 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 1.5rem;
  padding: 2.25rem 2rem;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 15px 35px -10px rgba(0, 51, 153, 0.45);
}

.hero-backdrop-glow {
  position: absolute;
  top: -30%;
  right: -10%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(2, 132, 199, 0.35) 0%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.hero-inner-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  position: relative;
  z-index: 1;
}

/* Avatar Column */
.avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.avatar-wrapper {
  position: relative;
  width: 104px;
  height: 104px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  background: #1e293b;
}

.avatar-wrapper:hover {
  transform: scale(1.04);
  box-shadow: 0 10px 28px rgba(2, 132, 199, 0.5);
}

.user-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.user-avatar-initials {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0284c7 0%, #004aad 100%);
  color: #ffffff;
  font-size: 2.5rem;
  font-weight: 800;
  font-family: var(--font-display);
}

.avatar-hover-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 34, 102, 0.75);
  backdrop-filter: blur(3px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.avatar-wrapper:hover .avatar-hover-overlay {
  opacity: 1;
}

.overlay-text {
  font-size: 0.675rem;
  color: #ffffff;
  font-weight: 600;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.avatar-camera-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f59e0b;
  border: 2px solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease;
}

.avatar-camera-badge:hover {
  transform: scale(1.1);
}

.avatar-preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.5);
  border-radius: 9999px;
  font-size: 0.725rem;
  color: #fef08a;
  margin-top: 0.65rem;
}

.preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}

.btn-cancel-avatar {
  background: none;
  border: none;
  color: #ffffff;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0 0.2rem;
  line-height: 1;
}

/* User Meta Column */
.user-meta-column {
  flex: 1;
  color: #ffffff;
}

.meta-header-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-bottom: 0.35rem;
}

.user-name-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.02em;
}

.badges-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-cyan {
  background: rgba(2, 132, 199, 0.25);
  color: #7dd3fc;
  border: 1px solid rgba(2, 132, 199, 0.4);
}

.badge-emerald {
  background: rgba(16, 185, 129, 0.25);
  color: #86efac;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

.user-email-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #cbd5e1;
  margin-bottom: 1.25rem;
}

.user-stats-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-pill {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-val {
  font-size: 0.875rem;
  font-weight: 700;
  color: #ffffff;
}

.stat-link {
  text-decoration: none;
  background: rgba(255, 255, 255, 0.15);
  transition: all 0.2s ease;
}

.stat-link:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* Tabs Navigation */
.profile-tabs-wrapper {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.profile-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  font-size: 0.925rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.profile-tab-btn:hover {
  border-color: var(--ubsi-cyan);
  color: var(--ubsi-blue);
  background: #f8fafc;
}

.profile-tab-btn.active {
  background: var(--ubsi-blue);
  color: #ffffff;
  border-color: var(--ubsi-blue);
  box-shadow: 0 4px 12px rgba(0, 51, 153, 0.25);
}

.tab-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f1f5f9;
  color: var(--ubsi-blue);
  font-size: 0.75rem;
  font-weight: 700;
}

.profile-tab-btn.active .tab-counter {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* Tab Pane Card */
.tab-pane-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 1.5rem;
  padding: 2.25rem 2rem;
  box-shadow: var(--shadow-card);
}

.pane-header {
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}

.pane-header.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.pane-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.pane-desc {
  font-size: 0.925rem;
  color: var(--text-muted);
}

/* Photo Uploader Box */
.photo-uploader-box {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.uploader-avatar-col {
  flex-shrink: 0;
}

.uploader-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.uploader-avatar-initials {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ubsi-royal);
  color: #ffffff;
  font-size: 2rem;
  font-weight: 700;
}

.uploader-info-col {
  flex: 1;
}

.uploader-title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.uploader-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.uploader-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-cancel-text {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
}

.btn-cancel-text:hover {
  text-decoration: underline;
}

/* Forms */
.form-grid {
  display: grid;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-grid-2 {
  grid-template-columns: 1fr 1fr;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.5rem;
}

.text-danger {
  color: #ef4444;
}

.form-hint {
  display: block;
  font-size: 0.775rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

.input-cyber {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 1.5px solid #cbd5e1;
  border-radius: 0.75rem;
  color: #0f172a;
  font-size: 0.925rem;
  font-family: inherit;
  transition: all 0.2s ease;
}

.input-cyber:focus {
  outline: none;
  border-color: var(--ubsi-blue);
  box-shadow: 0 0 0 4px rgba(0, 51, 153, 0.1);
}

.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-left-icon {
  position: absolute;
  left: 1rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  pointer-events: none;
}

.input-has-icon {
  padding-left: 2.75rem;
}

.input-password {
  padding-right: 2.75rem;
}

.password-toggle-btn {
  position: absolute;
  right: 0.85rem;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.25rem;
}

.password-toggle-btn:hover {
  color: #0f172a;
}

.input-disabled {
  background: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.textarea-cyber {
  resize: vertical;
  min-height: 80px;
}

.form-actions-row {
  margin-top: 1.75rem;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  padding: 0.85rem 2rem;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.max-w-md {
  max-width: 28rem;
}

.max-w-2xl {
  max-width: 42rem;
}

/* Address Grid */
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.saved-address-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.saved-address-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 8px 20px -6px rgba(0, 51, 153, 0.12);
}

.saved-address-card.is-default {
  border-color: #0284c7;
  background: #f0f9ff;
}

.card-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.labels-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.card-quick-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f1f5f9;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-icon-action:hover {
  background: #e2e8f0;
  transform: scale(1.05);
}

.receiver-meta {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.receiver-name {
  font-size: 1rem;
  color: #0f172a;
}

.receiver-phone {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.address-full-text {
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.45;
  margin-bottom: 0.25rem;
}

.address-geo-text {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem;
}

.address-notes-box {
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  padding: 0.4rem 0.65rem;
  font-size: 0.8rem;
  color: #b45309;
  margin-bottom: 1rem;
}

.card-bottom-actions {
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.btn-set-default {
  background: none;
  border: none;
  color: var(--ubsi-royal);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease;
}

.btn-set-default:hover {
  color: var(--ubsi-blue-dark);
  text-decoration: underline;
}

.text-default-info {
  font-size: 0.825rem;
  color: #0284c7;
  font-weight: 600;
}

/* Empty Address Box */
.empty-address-box {
  text-align: center;
  padding: 3.5rem 1.5rem;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 1.25rem;
}

.empty-icon-ring {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.empty-address-box h3 {
  font-size: 1.15rem;
  margin-bottom: 0.35rem;
}

.empty-address-box p {
  font-size: 0.9rem;
  color: var(--text-muted);
  max-width: 440px;
  margin: 0 auto 1.25rem;
}

/* Address Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-dialog {
  background: #ffffff;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-close-btn:hover {
  color: #0f172a;
}

.modal-form {
  padding: 1.5rem 2rem;
}

.checkbox-group {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
}

.checkbox-cyber {
  width: 18px;
  height: 18px;
  accent-color: var(--ubsi-blue);
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

/* Spinner Icon */
.spinner-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Skeletons */
.skeleton-card {
  padding: 1.5rem;
  border-radius: 1rem;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-line {
  height: 14px;
  border-radius: 6px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Transitions */
.toast-fade-enter-active,
.toast-fade-leave-active,
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to,
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Responsive */
@media (max-width: 768px) {
  .hero-inner-row {
    flex-direction: column;
    text-align: center;
    gap: 1.25rem;
  }

  .meta-header-row {
    justify-content: center;
  }

  .user-email-text {
    justify-content: center;
  }

  .user-stats-strip {
    justify-content: center;
  }

  .photo-uploader-box {
    flex-direction: column;
    text-align: center;
  }

  .uploader-actions {
    justify-content: center;
  }

  .form-grid-2 {
    grid-template-columns: 1fr;
  }

  .form-actions-row {
    justify-content: stretch;
  }

  .btn-save {
    width: 100%;
    justify-content: center;
  }

  .tab-pane-card {
    padding: 1.5rem 1.25rem;
  }

  .profile-hero-card {
    padding: 1.75rem 1.25rem;
  }

  .profile-tabs-wrapper {
    overflow-x: auto;
    padding-bottom: 0.25rem;
    gap: 0.5rem;
  }

  .profile-tab-btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .address-cards-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 480px) {
  .profile-page {
    padding-top: 0.75rem;
    padding-bottom: 4rem;
    gap: 1rem;
  }

  .profile-hero-card {
    padding: 1.25rem 1rem;
  }

  .user-name-title {
    font-size: 1.35rem;
  }

  .user-stats-strip {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .stat-pill {
    width: 100%;
    justify-content: space-between;
  }

  .tab-pane-card {
    padding: 1.15rem 0.9rem;
  }

  .profile-tabs-wrapper {
    padding: 0 0 0.25rem;
  }

  .profile-tab-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .pane-title {
    font-size: 1.1rem;
  }

  .modal-header {
    padding: 1.15rem 1.25rem;
  }

  .modal-form {
    padding: 1.15rem 1.25rem;
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }

  .modal-footer .btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 375px) {
  .profile-hero-card {
    padding: 1rem 0.85rem;
  }

  .user-name-title {
    font-size: 1.15rem;
  }

  .tab-pane-card {
    padding: 1rem 0.75rem;
  }

  .profile-tab-btn {
    padding: 0.45rem 0.6rem;
    font-size: 0.75rem;
    gap: 0.35rem;
  }

  .profile-tab-btn svg {
    width: 0.875rem;
    height: 0.875rem;
  }

  .btn-save,
  .btn-add-address {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
}

/* GPS Badge & Map Elements */
.address-geo-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 0.5rem;
  font-size: 0.775rem;
  color: #065f46;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.geo-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.link-maps-inline {
  color: #0284c7;
  text-decoration: underline;
  margin-left: 0.35rem;
  font-weight: 700;
}

.link-maps-inline:hover {
  color: #003399;
}

.label-with-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.text-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
}
</style>
