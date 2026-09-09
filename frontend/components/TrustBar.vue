<template>
  <section class="trust-bar-section">
    <div class="container">
      <div class="trust-grid">
        <div class="trust-card">
          <div class="trust-icon-box">
            <Icon name="lucide:shield-check" class="w-6 h-6 text-cyan" />
          </div>
          <div class="trust-info">
            <h4>100% Produk Original</h4>
            <p>Jaminan barang asli dengan garansi resmi distributor.</p>
          </div>
        </div>

        <div class="trust-card">
          <div class="trust-icon-box">
            <Icon name="lucide:zap" class="w-6 h-6 text-cyan" />
          </div>
          <div class="trust-info">
            <h4>Pengiriman Kilat</h4>
            <p>Dukungan kurir ekspedisi tercepat dengan pelacakan real-time.</p>
          </div>
        </div>

        <div class="trust-card">
          <div class="trust-icon-box">
            <Icon name="lucide:credit-card" class="w-6 h-6 text-cyan" />
          </div>
          <div class="trust-info">
            <h4>Pembayaran Aman</h4>
            <p>Untuk Saat ini pembayaran hanya melalu Via Virtual accounts Bank MANDIRI.</p>
          </div>
        </div>

        <div class="trust-card">
          <div class="trust-icon-box">
            <Icon name="lucide:headphones" class="w-6 h-6 text-cyan" />
          </div>
          <div class="trust-info">
            <h4>Admin Fast Respon</h4>
            <p>Admin fast Respon dan siap membantu.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.trust-bar-section {
  width: 100%;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

.trust-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.05);
  transition: all 0.25s ease;
}

.trust-card:hover {
  border-color: rgba(0, 74, 173, 0.35);
  box-shadow: 0 8px 24px rgba(0, 51, 153, 0.1);
  transform: translateY(-2px);
}

.trust-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.text-cyan {
  color: #004aad;
}

.trust-info h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 2px;
}

.trust-info p {
  font-size: 0.78rem;
  color: #475569;
  line-height: 1.35;
}

@media (max-width: 992px) {
  .trust-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .trust-grid {
    grid-template-columns: 1fr;
  }
}
</style>
