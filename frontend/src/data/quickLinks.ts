// Data tautan akses cepat (Quick Links) untuk Dashboard.
// Antara 3..6 tautan; setiap `target` menunjuk MenuKey valid selain 'dashboard' (R6.1).

import type { QuickLink } from '../types';

/** Tautan akses cepat yang ditampilkan pada Dashboard. */
export const quickLinks: QuickLink[] = [
  { label: 'Tanya Asisten AI', target: 'chatbot' },
  { label: 'Lihat Laporan Progress', target: 'laporan-progress' },
  { label: 'Cek Jadwal Belajar', target: 'jadwal' },
  { label: 'Pengingat Tugas', target: 'pengingat' },
];
