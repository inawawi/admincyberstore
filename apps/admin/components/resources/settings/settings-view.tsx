"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ResourceMeta } from "@/types";
import { Icon } from "@/components/icon";
import { SweetAlert } from "@/components/sweet-alert";

export interface SettingsViewProps {
  meta: ResourceMeta;
  result: { data: Array<Record<string, unknown>> };
}

export function SettingsView({
  meta,
  result,
}: SettingsViewProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Parse result.data array into dictionary map
  const initialMap: Record<string, string> = {};
  if (Array.isArray(result.data)) {
    result.data.forEach((item) => {
      if (item.key) {
        initialMap[String(item.key)] = String(item.value ?? "");
      }
    });
  }

  // Section 1: Identitas & Profil Toko
  const [storeName, setStoreName] = useState(initialMap.store_name || "UBSI Cyber Store");
  const [storeLogoUrl, setStoreLogoUrl] = useState<string>(() => {
    const raw = initialMap.store_logo || "";
    if (!raw) return "";
    if (raw.startsWith("http") || raw.startsWith("/")) return raw;
    return `/storage/${raw.replace(/^\/?storage\/?/, "")}`;
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [storeDesc, setStoreDesc] = useState(
    initialMap.store_description ||
    "Toko Resmi Merchandise & Perlengkapan Kuliah Kampus UBSI (Universitas Bina Sarana Informatika)"
  );
  const [storeAddress, setStoreAddress] = useState(
    initialMap.store_address ||
    "Jl. Kramat Raya No.98, RT.3/RW.9, Kwitang, Senen, Jakarta Pusat, DKI Jakarta 10450"
  );
  const [storePhone, setStorePhone] = useState(initialMap.store_phone || "08123456789");
  const [storeEmail, setStoreEmail] = useState(initialMap.store_email || "cs@ubsicyberstore.ac.id");
  const [storeHours, setStoreHours] = useState(initialMap.store_hours || "Senin - Jumat (08:00 - 17:00 WIB)");

  // Section 2: Banner Pengumuman Atas (Marquee)
  const [topBannerActive, setTopBannerActive] = useState<boolean>(
    initialMap.top_announcement_active === "1" ||
    initialMap.top_announcement_active === "true" ||
    initialMap.top_announcement_active === undefined
  );
  const [topBannerText, setTopBannerText] = useState(
    initialMap.top_announcement_text ||
    "📢 Selamat Datang di UBSI Cyber Store! Dapatkan Diskon Khusus Mahasiswa Baru untuk Pembelian Paket Ormik & Semot."
  );
  const [topBannerBg, setTopBannerBg] = useState(initialMap.top_announcement_bg || "#1e293b");
  const [topBannerColor, setTopBannerColor] = useState(initialMap.top_announcement_color || "#f8fafc");

  // Section 3: Pengaturan Event Mahasiswa Baru (Ormik & Semot)
  const [eventMabaTitle, setEventMabaTitle] = useState(
    initialMap.event_maba_title || "RESMI KEGIATAN MAHASISWA BARU 2026"
  );
  const [eventMabaDesc, setEventMabaDesc] = useState(
    initialMap.event_maba_description || ""
  );

  // Section 4: Halaman Kebijakan & Dynamic FAQs
  const [termsConditions, setTermsConditions] = useState(
    initialMap.terms_conditions ||
    "1. Pembelian produk merchandise UBSI Cyber Store terbuka untuk mahasiswa, alumni, dan masyarakat umum.\n2. Pembayaran menggunakan Midtrans Snap Gateway yang terverifikasi otomatis.\n3. Harap pastikan alamat pengiriman sudah benar sebelum menyelesaikan pesanan."
  );
  const [returnPolicy, setReturnPolicy] = useState(
    initialMap.return_policy ||
    "1. Penukaran produk hanya berlaku untuk kesalahan ukuran (size) atau cacat produksi pabrik.\n2. Pengajuan klaim retur maksimal 3x24 jam setelah status pesanan dinyatakan Tiba.\n3. Wajib menyertakan video unboxing utuh tanpa terpotong."
  );
  const [privacyPolicy, setPrivacyPolicy] = useState(
    initialMap.privacy_policy ||
    "Kami menjaga kerahasiaan data pribadi pengguna (nama, email, nomor HP, dan alamat). Data Anda hanya digunakan untuk kepentingan pengiriman dan layanan transaksi UBSI Cyber Store."
  );

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(() => {
    const raw = initialMap.faqs_json || "";
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { }
    }
    return [
      {
        question: "Bagaimana cara menentukan ukuran jaket almamater MABA?",
        answer: "Ukuran otomatis terpilih berdasarkan digit terakhir NIM Anda saat checkout produk Event MABA, atau Anda dapat merujuk pada tabel Size Chart.",
      },
      {
        question: "Berapa lama estimasi pengiriman pesanan?",
        answer: "Pengiriman Jabodetabek membutuhkan waktu 1-2 hari kerja. Untuk luar Jabodetabek berkisar 2-4 hari kerja tergantung kurir yang dipilih.",
      },
      {
        question: "Apakah bisa melakukan pembatalan pesanan yang sudah dibayar?",
        answer: "Pengajuan pembatalan dapat dilakukan melalui aplikasi sebelum pesanan diproses/dikirim oleh admin.",
      },
    ];
  });

  // Sync states whenever result.data updates (e.g. after save & router.refresh())
  useEffect(() => {
    const map: Record<string, string> = {};
    if (Array.isArray(result.data)) {
      result.data.forEach((item) => {
        if (item.key) {
          map[String(item.key)] = String(item.value ?? "");
        }
      });
    }

    if (map.store_name !== undefined) setStoreName(map.store_name);
    if (map.store_logo !== undefined) {
      const raw = map.store_logo || "";
      const logoUrl = !raw ? "" : (raw.startsWith("http") || raw.startsWith("/") ? raw : `/storage/${raw.replace(/^\/?storage\/?/, "")}`);
      setStoreLogoUrl(logoUrl);
    }
    if (map.store_description !== undefined) setStoreDesc(map.store_description);
    if (map.store_address !== undefined) setStoreAddress(map.store_address);
    if (map.store_phone !== undefined) setStorePhone(map.store_phone);
    if (map.store_email !== undefined) setStoreEmail(map.store_email);
    if (map.store_hours !== undefined) setStoreHours(map.store_hours);

    if (map.top_announcement_active !== undefined) {
      setTopBannerActive(map.top_announcement_active === "1" || map.top_announcement_active === "true");
    }
    if (map.top_announcement_text !== undefined) setTopBannerText(map.top_announcement_text);
    if (map.top_announcement_bg !== undefined) setTopBannerBg(map.top_announcement_bg);
    if (map.top_announcement_color !== undefined) setTopBannerColor(map.top_announcement_color);

    if (map.event_maba_title !== undefined) setEventMabaTitle(map.event_maba_title);
    if (map.event_maba_description !== undefined) setEventMabaDesc(map.event_maba_description);

    if (map.terms_conditions !== undefined) setTermsConditions(map.terms_conditions);
    if (map.return_policy !== undefined) setReturnPolicy(map.return_policy);
    if (map.privacy_policy !== undefined) setPrivacyPolicy(map.privacy_policy);

    if (map.faqs_json !== undefined) {
      try {
        const parsed = JSON.parse(map.faqs_json);
        if (Array.isArray(parsed)) setFaqs(parsed);
      } catch { }
    }
  }, [result.data]);

  const handleAddFaq = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  };

  const handleUpdateFaq = (index: number, key: "question" | "answer", val: string) => {
    setFaqs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleClearCache() {
    setClearingCache(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/cache/clear", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Gagal membersihkan cache.");
      setMessage({ text: data.message || "Cache sistem berhasil dibersihkan.", type: "success" });
      router.refresh();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Gagal membersihkan cache.", type: "error" });
    } finally {
      setClearingCache(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const settingsObj: Record<string, string> = {
      store_name: storeName,
      store_description: storeDesc,
      store_address: storeAddress,
      store_phone: storePhone,
      store_email: storeEmail,
      store_hours: storeHours,
      top_announcement_active: topBannerActive ? "1" : "0",
      top_announcement_text: topBannerText,
      top_announcement_bg: topBannerBg,
      top_announcement_color: topBannerColor,
      event_maba_title: eventMabaTitle,
      event_maba_description: eventMabaDesc,
      terms_conditions: termsConditions,
      return_policy: returnPolicy,
      privacy_policy: privacyPolicy,
      faqs_json: JSON.stringify(faqs.filter((f) => f.question.trim())),
    };

    const formData = new FormData();
    formData.append("settings", JSON.stringify(settingsObj));
    if (logoFile) {
      formData.append("store_logo_file", logoFile);
    }

    try {
      const res = await fetch("/api/admin/resources/settings", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan pengaturan.");
      setMessage({ text: "✓ Pengaturan aplikasi & identitas toko berhasil diperbarui!", type: "success" });
      router.refresh();
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Gagal menyimpan pengaturan.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack settings-page-wrapper">
      <section className="page-heading resource-heading">
        <div>
          <span className="eyebrow">MANAJEMEN</span>
          <h1>Pengaturan Aplikasi &amp; Identitas Toko</h1>
          <p>Kelola identitas toko, banner pengumuman, dan kebijakan informasi halaman.</p>
        </div>
        <div className="header-action-group">
          <button
            type="button"
            className="warning-button clear-cache-btn"
            onClick={handleClearCache}
            disabled={clearingCache}
            title="Bersihkan Cache Sistem"
          >
            <Icon name="RefreshCw" className={clearingCache ? "spin" : ""} size={16} />
            <span>Bersihkan Cache</span>
          </button>
        </div>
      </section>

      {/* Floating SweetAlert Toast */}
      <SweetAlert
        isOpen={!!message}
        isToast={true}
        type={message?.type || "info"}
        message={message?.text || ""}
        onClose={() => setMessage(null)}
      />

      <form onSubmit={handleSubmit} className="settings-form-stack" suppressHydrationWarning>
        {/* SECTION 1: IDENTITAS & PROFIL TOKO */}
        <div className="form-section-card">
          <div className="section-title">
            <span className="section-icon-emoji">🏪</span>
            <div>
              <h3>IDENTITAS &amp; PROFIL TOKO</h3>
              <p className="section-desc">Informasi dasar toko yang tampil di aplikasi Android, struk, dan nota pembelian.</p>
            </div>
          </div>

          <div className="section-grid">
            <label className="field-label span-two">
              <span>Nama Toko <strong className="required-star">*</strong></span>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: UBSI Cyber Store"
              />
            </label>

            {/* Logo Upload Box */}
            <div className="field-label span-two logo-upload-card">
              <span>Logo Toko</span>
              <div className="logo-upload-box">
                <div className="logo-preview-wrapper">
                  {storeLogoUrl ? (
                    <Image unoptimized src={storeLogoUrl} alt="Logo Toko" width={64} height={64} className="logo-img-thumb" />
                  ) : (
                    <div className="logo-placeholder"><Icon name="Store" size={28} /></div>
                  )}
                </div>
                <div className="logo-upload-info">
                  <strong>Logo Toko Saat Ini</strong>
                  <p>Rekomendasi rasio 1:1 berbentuk persegi (PNG, JPG, atau WEBP, maks 2MB).</p>
                  <label className="secondary-button subtle-button logo-file-btn">
                    📷 Ganti Logo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoFile(file);
                          setStoreLogoUrl(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <label className="field-label span-two">
              <span>Deskripsi Singkat Toko</span>
              <textarea
                rows={3}
                value={storeDesc}
                onChange={(e) => setStoreDesc(e.target.value)}
                placeholder="Tuliskan deskripsi singkat mengenai toko..."
              />
            </label>

            <label className="field-label span-two">
              <span>Alamat Lengkap Toko / Gudang</span>
              <textarea
                rows={3}
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Alamat lengkap toko fisik atau lokasi gudang pengiriman..."
              />
            </label>

            <div className="three-col-row span-two">
              <label className="field-label">
                <span>Nomor WhatsApp CS / Admin</span>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                />
              </label>

              <label className="field-label">
                <span>Email Layanan Pelanggan</span>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="cs@ubsicyberstore.ac.id"
                />
              </label>

              <label className="field-label">
                <span>Jam Operasional Toko</span>
                <input
                  type="text"
                  value={storeHours}
                  onChange={(e) => setStoreHours(e.target.value)}
                  placeholder="Senin - Jumat (08:00 - 17:00 WIB)"
                />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 2: BANNER PENGUMUMAN ATAS (TOP BAR / MARQUEE) */}
        <div className="form-section-card">
          <div className="section-title">
            <span className="section-icon-emoji">📢</span>
            <div>
              <h3>BANNER PENGUMUMAN ATAS (TOP BAR / MARQUEE)</h3>
              <p className="section-desc">Tampilkan pesan running text / marquee pengumuman di bagian paling atas aplikasi toko.</p>
            </div>
          </div>

          <div className="section-grid">
            <div className="span-two">
              <label className="checkbox-item-label">
                <input
                  type="checkbox"
                  checked={topBannerActive}
                  onChange={(e) => setTopBannerActive(e.target.checked)}
                />
                <span>Aktifkan Running Text Pengumuman Atas</span>
              </label>
            </div>

            {topBannerActive && (
              <>
                <label className="field-label span-two">
                  <span>Teks Pengumuman Running Text</span>
                  <textarea
                    rows={2}
                    value={topBannerText}
                    onChange={(e) => setTopBannerText(e.target.value)}
                    placeholder="📢 Selamat Datang di UBSI Cyber Store! Dapatkan Diskon Khusus..."
                  />
                </label>

                <div className="two-col-row span-two">
                  <label className="field-label">
                    <span>Warna Latar Banner (Background)</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        className="color-hex-picker"
                        value={topBannerBg}
                        onChange={(e) => setTopBannerBg(e.target.value)}
                      />
                      <input
                        type="text"
                        value={topBannerBg}
                        onChange={(e) => setTopBannerBg(e.target.value)}
                        placeholder="#1e293b"
                      />
                    </div>
                  </label>

                  <label className="field-label">
                    <span>Warna Teks Banner</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        className="color-hex-picker"
                        value={topBannerColor}
                        onChange={(e) => setTopBannerColor(e.target.value)}
                      />
                      <input
                        type="text"
                        value={topBannerColor}
                        onChange={(e) => setTopBannerColor(e.target.value)}
                        placeholder="#f8fafc"
                      />
                    </div>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* SECTION 3: PENGATURAN EVENT MAHASISWA BARU (ORMIK & SEMOT) */}
        <div className="form-section-card">
          <div className="section-title">
            <span className="section-icon-emoji">🎓</span>
            <div>
              <h3>PENGATURAN EVENT MAHASISWA BARU (ORMIK &amp; SEMOT)</h3>
              <p className="section-desc">Kustomisasi judul, heading, dan deskripsi bagian promosi perlengkapan Mahasiswa Baru di halaman utama storefront.</p>
            </div>
          </div>

          <div className="section-grid">
            <label className="field-label span-two">
              <span>Judul Badge / Tagline Event</span>
              <input
                type="text"
                value={eventMabaTitle}
                onChange={(e) => setEventMabaTitle(e.target.value)}
                placeholder="Contoh: RESMI KEGIATAN MAHASISWA BARU 2026"
              />
            </label>

            <label className="field-label span-two">
              <span>Deskripsi / Catatan Tambahan (Opsional)</span>
              <textarea
                rows={3}
                value={eventMabaDesc}
                onChange={(e) => setEventMabaDesc(e.target.value)}
                placeholder="Contoh: Seragam resmi dan atribut wajib kegiatan Orientasi Akademik..."
              />
            </label>
          </div>
        </div>

        {/* SECTION 4: HALAMAN KEBIJAKAN & FAQ */}
        <div className="form-section-card">
          <div className="section-title">
            <span className="section-icon-emoji">📄</span>
            <div>
              <h3>HALAMAN KEBIJAKAN &amp; FAQ (FREQUENTLY ASKED QUESTIONS)</h3>
              <p className="section-desc">Kelola isi halaman informasi Syarat &amp; Ketentuan, Kebijakan Retur, Kebijakan Privasi, serta Daftar Pertanyaan Umum (FAQ).</p>
            </div>
          </div>

          <div className="policy-cards-stack">
            {/* Card 1: Syarat & Ketentuan */}
            <div className="policy-subcard">
              <h4>📋 Syarat &amp; Ketentuan (Terms &amp; Conditions)</h4>
              <label className="field-label">
                <textarea
                  rows={4}
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Tuliskan poin-poin Syarat &amp; Ketentuan di sini..."
                />
              </label>
            </div>

            {/* Card 2: Kebijakan Retur */}
            <div className="policy-subcard">
              <h4>🔄 Kebijakan Pengembalian &amp; Retur (Return Policy)</h4>
              <label className="field-label">
                <textarea
                  rows={4}
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  placeholder="Tuliskan syarat dan tata cara pengajuan retur barang..."
                />
              </label>
            </div>

            {/* Card 3: Kebijakan Privasi */}
            <div className="policy-subcard">
              <h4>🔒 Kebijakan Privasi (Privacy Policy)</h4>
              <label className="field-label">
                <textarea
                  rows={4}
                  value={privacyPolicy}
                  onChange={(e) => setPrivacyPolicy(e.target.value)}
                  placeholder="Tuliskan kebijakan perlindungan data pribadi pelanggan..."
                />
              </label>
            </div>

            {/* Card 4: Dynamic FAQs Editor */}
            <div className="policy-subcard faqs-editor-subcard">
              <div className="faq-subcard-header">
                <div>
                  <h4>❓ Daftar Pertanyaan Umum (FAQ Dinamis)</h4>
                  <p className="inner-card-sub">Daftar Q&amp;A interaktif yang tampil di aplikasi Android untuk menjawab pertanyaan pelanggan.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button subtle-button add-faq-btn"
                  onClick={handleAddFaq}
                >
                  <Icon name="Plus" size={15} />
                  <span>+ Tambah Pertanyaan FAQ</span>
                </button>
              </div>

              <div className="faqs-list-container">
                {faqs.map((faq, index) => (
                  <div className="faq-item-card" key={index}>
                    <div className="faq-item-header">
                      <span className="faq-item-badge">Pertanyaan #{index + 1}</span>
                      <button
                        type="button"
                        className="danger-button subtle-button remove-faq-btn"
                        onClick={() => handleRemoveFaq(index)}
                      >
                        <Icon name="Trash2" size={14} />
                        <span>Hapus</span>
                      </button>
                    </div>

                    <div className="faq-item-fields">
                      <label className="field-label">
                        <span>Pertanyaan</span>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => handleUpdateFaq(index, "question", e.target.value)}
                          placeholder="Contoh: Berapa lama estimasi pengiriman paket?"
                        />
                      </label>

                      <label className="field-label">
                        <span>Jawaban</span>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => handleUpdateFaq(index, "answer", e.target.value)}
                          placeholder="Tuliskan jawaban lengkap untuk pertanyaan di atas..."
                        />
                      </label>
                    </div>
                  </div>
                ))}

                {faqs.length === 0 && (
                  <div className="empty-faq-box">
                    <p>Belum ada daftar FAQ. Klik tombol di atas untuk menambah pertanyaan baru.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Save Action Bar */}
        <div className="product-edit-footer-bar settings-footer-bar">
          <div className="footer-stat-info">
            💡 Perubahan pengaturan akan langsung berdampak pada aplikasi dan API toko.
          </div>

          <div className="footer-action-btns">
            <button
              className="primary-button red-submit-btn"
              disabled={saving}
              type="submit"
            >
              {saving ? (
                <>
                  <span className="spinner" /> Menyimpan Pengaturan…
                </>
              ) : (
                <>💾 Simpan Seluruh Pengaturan</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
