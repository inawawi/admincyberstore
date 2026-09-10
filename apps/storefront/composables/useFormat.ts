export const useFormat = () => {
  const formatRupiah = (amount: number | string | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return 'Rp 0'
    }
    const num = typeof amount === 'string' ? parseInt(amount, 10) : amount
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num)
  }

  const calculateDiscount = (price: number, originalPrice?: number | null): number => {
    if (!originalPrice || originalPrice <= price) return 0
    return Math.round(((originalPrice - price) / originalPrice) * 100)
  }

  return {
    formatRupiah,
    calculateDiscount,
  }
}
