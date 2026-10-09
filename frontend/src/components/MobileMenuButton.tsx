// MobileMenuButton (Task 11.2) — tombol pembuka Sidebar untuk viewport sempit.
//
// Perilaku responsif (R2.1, R2.2, R2.6):
// - R2.1: pada Breakpoint_Desktop (>= 1024px) Sidebar selalu terlihat tanpa
//   interaksi, sehingga tombol pembuka TIDAK diperlukan → disembunyikan via
//   `lg:hidden` (Tailwind v4, lg = 1024px).
// - R2.2 & R2.6: di bawah 1024px Sidebar disembunyikan secara default dan
//   aplikasi menyediakan tombol pembuka yang terlihat pada viewport → tombol
//   ini tampil pada semua lebar < lg.
//
// Komponen bersifat presentational: seluruh perilaku berasal dari props.
// Membuka drawer adalah tanggung jawab pemanggil melalui `onClick`.

export interface MobileMenuButtonProps {
  /** Membuka drawer Sidebar. */
  onClick: () => void;
  /** Mencerminkan apakah Sidebar/drawer sedang terbuka (untuk aria-expanded). */
  expanded?: boolean;
}

function MobileMenuButton({ onClick, expanded }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buka menu"
      aria-expanded={!!expanded}
      className={[
        'lg:hidden fixed top-4 left-4 z-30',
        'inline-flex items-center justify-center w-10 h-10',
        'rounded-md border border-[var(--border)] bg-[var(--bg)]',
        'text-[var(--text-h)] shadow-[var(--shadow)]',
        'transition-colors hover:bg-[var(--accent-bg)]',
      ].join(' ')}
    >
      <span className="sr-only">Buka menu</span>
      <span aria-hidden="true" className="text-xl leading-none">
        ☰
      </span>
    </button>
  );
}

export default MobileMenuButton;
