// Komponen Sidebar presentational untuk Student Learning Assistant (Task 11.1).
//
// Dikendalikan sepenuhnya oleh props agar App.tsx tetap memiliki state
// (activeMenu, open). Sidebar hanya merender menu & memanggil callback.
//
// Perilaku terkait requirement:
// - R1.1: merender 5 menu berurutan dari data/menus.ts.
// - R1.4: tepat satu item ditandai aktif (bergaya aksen) — diturunkan dari
//   activeMenu sehingga secara inheren hanya satu yang aktif.
// - R2.3: < lg tampil sebagai overlay/drawer fixed dengan transisi <= 300ms;
//   lg ke atas menjadi kolom kiri statis yang selalu terlihat.
// - R2.4: backdrop & tombol tutup memanggil onClose; memilih menu memanggil
//   onSelect (handler App yang menutup drawer di mobile).

import type { MenuKey, MenuItem } from '../types';
import { menus } from '../data/menus';

export interface SidebarProps {
  activeMenu: MenuKey;
  open: boolean; // status drawer terbuka (mobile)
  onSelect: (key: MenuKey) => void; // dipanggil saat menu dipilih; App menutup drawer
  onClose: () => void; // menutup drawer (klik backdrop / tombol tutup)
}

function Sidebar({ activeMenu, open, onSelect, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop drawer mobile — hanya tampil saat terbuka & di bawah lg.
          Klik menutup drawer (R2.4). */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar/drawer.
          - < lg: fixed overlay yang slide via transform (transition <= 300ms).
          - lg+: kolom kiri statis selalu terlihat (R2.3). */}
      <aside
        className={[
          'z-40 w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg)] p-4',
          'fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0 lg:transition-none',
        ].join(' ')}
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--text-h)]">
            Student Learning Assistant
          </h1>
          {/* Tombol tutup drawer — hanya relevan di bawah lg (R2.4). */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-h)] transition-colors hover:bg-[var(--accent-bg)] lg:hidden"
          >
            <span aria-hidden="true" className="text-lg leading-none">
              ✕
            </span>
            <span className="sr-only">Tutup menu</span>
          </button>
        </div>

        {/* Daftar menu — 5 item berurutan (R1.1). */}
        <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
          {menus.map((m: MenuItem) => {
            const isActive = m.key === activeMenu;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onSelect(m.key)}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--accent)] font-medium text-white'
                    : 'text-[var(--text)] hover:bg-[var(--accent-bg)] hover:text-[var(--text-h)]',
                ].join(' ')}
              >
                {m.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
