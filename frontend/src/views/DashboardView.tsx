// DashboardView — halaman Dashboard aplikasi (Task 13.2).
//
// Tanggung jawab (R6.1):
// - Menampilkan satu teks sambutan + intro singkat berbahasa Indonesia yang
//   menjelaskan aplikasi sebagai asisten belajar berbasis AI.
// - Merender 3..6 kartu akses cepat dari `data/quickLinks.ts`. Setiap kartu
//   adalah tombol nyata yang, saat ditekan, berpindah ke menu tujuan melalui
//   callback `onNavigate` (di-wire oleh App ke `selectMenu`).
//
// Catatan: jumlah kartu TIDAK di-hardcode — komponen hanya memetakan
// `quickLinks` (yang sudah dijamin berisi 3..6 tautan ke menu selain
// 'dashboard').

import type { MenuKey } from '../types';
import { quickLinks } from '../data/quickLinks';

export interface DashboardViewProps {
  /** Pindah ke menu tujuan. Di-wire oleh App ke `selectMenu`. */
  onNavigate: (key: MenuKey) => void;
}

function DashboardView({ onNavigate }: DashboardViewProps) {
  return (
    <section aria-labelledby="dashboard-heading">
      {/* Teks sambutan + intro singkat (R6.1). */}
      <h2
        id="dashboard-heading"
        className="text-2xl font-semibold text-[var(--text-h)]"
      >
        Selamat datang di Student Learning Assistant
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--text)]">
        Asisten belajar berbasis AI yang membantu Anda belajar lebih terarah.
        Gunakan menu Chatbot untuk bertanya ke asisten AI, pantau capaian lewat
        Laporan Progress, atur rencana belajar di Jadwal, dan jaga tenggat tugas
        melalui Pengingat.
      </p>

      {/* Kartu akses cepat (3..6) — map langsung dari data, tanpa hardcode. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <button
            key={link.target}
            type="button"
            aria-label={'Buka ' + link.label}
            onClick={() => onNavigate(link.target)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-left shadow-[var(--shadow)] transition-colors hover:border-[var(--accent-border)] hover:bg-[var(--accent-bg)]"
          >
            <span className="block font-medium text-[var(--text-h)]">
              {link.label}
            </span>
            <span className="mt-1 block text-xs text-[var(--text)]">
              Buka menu {link.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default DashboardView;
