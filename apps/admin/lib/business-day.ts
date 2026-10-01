/**
 * Utility untuk menghitung batas waktu 1 hari kerja (24 jam kerja).
 * Menghitung hari kerja Senin s.d. Jumat (mengabaikan akhir pekan Sabtu dan Minggu).
 */

export function getBusinessDeadline(startDate: Date): Date {
  const d = new Date(startDate.getTime());
  const day = d.getDay(); // 0 = Minggu, 1 = Senin, ..., 5 = Jumat, 6 = Sabtu

  if (day === 5) {
    // Jumat -> deadline berakhir di hari Senin pada jam yang sama (+3 hari kalender)
    d.setDate(d.getDate() + 3);
  } else if (day === 6) {
    // Sabtu -> terhitung mulai Senin, deadline berakhir Selasa jam yang sama (+3 hari kalender)
    d.setDate(d.getDate() + 3);
  } else if (day === 0) {
    // Minggu -> terhitung mulai Senin, deadline berakhir Selasa jam yang sama (+2 hari kalender)
    d.setDate(d.getDate() + 2);
  } else {
    // Senin s.d. Kamis -> deadline berakhir esok hari pada jam yang sama (+1 hari = 24 jam)
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export function isWithinBusinessDay(startDate: Date | string | null | undefined): boolean {
  if (!startDate) return false;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return false;
  return Date.now() <= getBusinessDeadline(d).getTime();
}

export function getBusinessTimeRemaining(startDate: Date | string | null | undefined): string {
  if (!startDate) return "";
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return "";
  const deadline = getBusinessDeadline(d);
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return "";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}j ${minutes}m`;
  }
  return `${minutes}m`;
}
