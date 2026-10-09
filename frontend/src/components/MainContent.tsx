// MainContent — area konten utama aplikasi (Task 11.3).
//
// Tanggung jawab:
// - Meresolusi view yang akan ditampilkan dari `activeMenu` melalui
//   `resolveView` (fungsi murni & TOTAL: input tidak valid → 'dashboard',
//   R1.3 & R6.6).
// - Membungkus area render konten dengan ERROR BOUNDARY React (R1.6) sehingga
//   kegagalan render pada salah satu view TIDAK membuat seluruh aplikasi crash.
//   Boundary hanya menangkap error render pada area konten dan menampilkan
//   indikasi kegagalan; ia TIDAK mengubah `activeMenu` (App yang memiliki state
//   itu), sehingga menu/sidebar yang aktif tetap dipertahankan.
// - Layout fleksibel tanpa scroll horizontal (R2.5): memakai `min-w-0` dan
//   `overflow-x-hidden` agar konten tidak melebar/terpotong di mobile maupun
//   desktop.
//
// Catatan urutan tugas: view konkret untuk kelima menu sudah dibuat dan di-wire
// di `renderView`, termasuk 'chatbot' → <ChatbotAssistantView /> (Task 14.5).

import { Component, type ReactNode } from 'react';
import type { MenuKey } from '../types';
import { resolveView } from '../navigation';
import DashboardView from '../views/DashboardView';
import ChatbotAssistantView from '../views/ChatbotAssistantView';
import LaporanProgressView from '../views/LaporanProgressView';
import JadwalView from '../views/JadwalView';
import PengingatView from '../views/PengingatView';

export interface MainContentProps {
  activeMenu: MenuKey;
  onNavigate: (key: MenuKey) => void;
}

// ---------------------------------------------------------------------------
// Error Boundary (R1.6)
// ---------------------------------------------------------------------------
//
// React 19, tanpa dependensi tambahan: error boundary WAJIB berupa class
// component dengan `static getDerivedStateFromError` dan/atau
// `componentDidCatch`. Boundary ini hanya menampilkan fallback UI ketika sebuah
// child view melempar error saat render; ia TIDAK menyentuh `activeMenu`
// (dimiliki App), jadi pemilihan menu/sidebar tetap utuh dan "view sebelumnya"
// dalam arti state navigasi dipertahankan.

interface ViewErrorBoundaryProps {
  children: ReactNode;
}

interface ViewErrorBoundaryState {
  hasError: boolean;
}

class ViewErrorBoundary extends Component<
  ViewErrorBoundaryProps,
  ViewErrorBoundaryState
> {
  state: ViewErrorBoundaryState = { hasError: false };

  // Dipanggil saat child melempar error pada fase render → alihkan ke fallback.
  static getDerivedStateFromError(): ViewErrorBoundaryState {
    return { hasError: true };
  }

  // Hook untuk efek samping (mis. logging). Sengaja minimal; tidak mengubah
  // state navigasi apa pun.
  componentDidCatch(error: unknown): void {
    // Logging ringan untuk membantu debugging tanpa membuat app crash.
    console.error('MainContent: gagal merender view konten.', error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Indikasi kegagalan (bukan crash). Pesan bahasa Indonesia (R1.6).
      return (
        <div
          role="alert"
          className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--text)]"
        >
          <p className="font-medium text-[var(--text-h)]">
            Terjadi kesalahan saat memuat konten menu ini.
          </p>
          <p className="mt-1">
            Silakan pilih menu lain pada sidebar untuk melanjutkan.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Pemetaan MenuKey → view (lapisan render)
// ---------------------------------------------------------------------------
//
// Satu titik pemetaan tunggal berbasis `switch` yang di-keyed oleh `MenuKey`.
// Pemetaan MenuKey → komponen view konkret:
//   - 'dashboard'        → <DashboardView onNavigate={...} /> (Task 13)
//   - 'laporan-progress' → <LaporanProgressView />            (Task 13)
//   - 'jadwal'           → <JadwalView />                     (Task 13)
//   - 'pengingat'        → <PengingatView />                  (Task 13)
//   - 'chatbot'          → <ChatbotAssistantView />           (Task 14.5)
//
// Catatan: `key` sudah dinormalisasi oleh `resolveView` sebelum sampai ke sini,
// jadi `switch` selalu menerima salah satu dari lima MenuKey valid. `onNavigate`
// diteruskan ke DashboardView agar quick link di Dashboard dapat berpindah menu.
function renderView(key: MenuKey, onNavigate: (key: MenuKey) => void): ReactNode {
  switch (key) {
    case 'dashboard':
      return <DashboardView onNavigate={onNavigate} />;
    case 'laporan-progress':
      return <LaporanProgressView />;
    case 'jadwal':
      return <JadwalView />;
    case 'pengingat':
      return <PengingatView />;
    case 'chatbot':
      return <ChatbotAssistantView />;
    default:
      // Pengaman ekshaustif: `resolveView` menjamin salah satu dari lima kunci
      // di atas, jadi cabang ini tidak akan tercapai pada kondisi normal.
      return <DashboardView onNavigate={onNavigate} />;
  }
}

// ---------------------------------------------------------------------------
// MainContent
// ---------------------------------------------------------------------------

function MainContent({ activeMenu, onNavigate }: MainContentProps) {
  // R1.3 & R6.6: resolusi TOTAL — menu valid dipertahankan, selain itu
  // jatuh ke 'dashboard'.
  const activeView = resolveView(activeMenu);

  return (
    // R2.5: layout fleksibel; `min-w-0` mencegah flex item melebihi lebar
    // kontainer, `overflow-x-hidden` menjamin tidak ada scroll horizontal.
    <main className="flex-1 min-w-0 overflow-x-hidden p-6 pt-16 lg:pt-6">
      {/*
        `key` di-ikat ke `activeView` agar perpindahan menu me-REMOUNT boundary
        dan mereset state error-nya. Dengan begitu, view yang sempat error tidak
        terus menampilkan fallback setelah pengguna berpindah ke menu lain.
      */}
      <ViewErrorBoundary key={activeView}>
        {renderView(activeView, onNavigate)}
      </ViewErrorBoundary>
    </main>
  );
}

export default MainContent;
