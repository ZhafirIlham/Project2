// Komponen SampleBadge presentational untuk Student Learning Assistant (Task 13.1).
//
// Penanda visual kecil (pill/badge) bertuliskan "Data Contoh" untuk menandai
// bahwa konten pada sebuah halaman masih merupakan data contoh dari memori
// Frontend dan belum terhubung ke data persisten.
//
// Perilaku terkait requirement:
// - R6.5: menampilkan penanda visual bertuliskan status "data contoh" pada
//   halaman Laporan Progress, Jadwal, dan Pengingat.

export interface SampleBadgeProps {
  className?: string;
}

function SampleBadge({ className }: SampleBadgeProps) {
  return (
    <span
      title="Konten tahap awal, belum terhubung ke data persisten."
      className={[
        'inline-flex items-center rounded-full border border-[var(--accent-border)]',
        'bg-[var(--accent-bg)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    >
      Data Contoh
    </span>
  );
}

export default SampleBadge;
