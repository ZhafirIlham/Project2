// Daftar menu Sidebar dengan urutan tetap sesuai R1.1:
// Dashboard, Chatbot Assistant, Laporan Progress, Jadwal, Pengingat.
import type { MenuItem } from '../types';

export const menus: readonly MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'chatbot', label: 'Chatbot Assistant' },
  { key: 'laporan-progress', label: 'Laporan Progress' },
  { key: 'jadwal', label: 'Jadwal' },
  { key: 'pengingat', label: 'Pengingat' },
];
