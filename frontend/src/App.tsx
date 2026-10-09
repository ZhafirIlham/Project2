// Shell aplikasi Student Learning Assistant (Task 11).
//
// Menetapkan "kontrak state" yang dikonsumsi komponen layout nyata Task 11:
// Sidebar, MobileMenuButton, dan MainContent — kini sudah di-wire langsung di
// sini menggantikan placeholder inline sebelumnya.
//
// State & perilaku:
// - activeMenu: MenuKey (awal 'dashboard', R1.2)
// - sidebarOpen: boolean (drawer mobile)
// - selectMenu(k): idempoten (R1.5) — memilih menu yang sama tidak memicu
//   perubahan state (tanpa re-render/reload); pemilihan menu juga menutup
//   drawer (perilaku mobile; tidak berbahaya di desktop).

import { useCallback, useState } from 'react';
import type { MenuKey } from './types';
import Sidebar from './components/Sidebar';
import MobileMenuButton from './components/MobileMenuButton';
import MainContent from './components/MainContent';

function App() {
  // R1.2: Dashboard sebagai view default saat aplikasi dimuat.
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // R1.5: idempoten — jika menu yang dipilih sama dengan yang aktif, jangan
  // panggil setState sama sekali (tidak ada perubahan state / re-render).
  const selectMenu = useCallback((k: MenuKey) => {
    setActiveMenu((current) => (current === k ? current : k));
    // Memilih menu menutup drawer (perilaku mobile; harmless di desktop).
    setSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">
      <MobileMenuButton onClick={openSidebar} expanded={sidebarOpen} />
      <Sidebar activeMenu={activeMenu} open={sidebarOpen} onSelect={selectMenu} onClose={closeSidebar} />
      <MainContent activeMenu={activeMenu} onNavigate={selectMenu} />
    </div>
  );
}

export default App;
