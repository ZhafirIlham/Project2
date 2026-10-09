// Logika navigasi murni untuk Student Learning Assistant.
//
// Modul ini berisi fungsi-fungsi MURNI (pure functions): tanpa efek samping,
// tanpa impor React, dan tanpa dependensi eksternal. Tujuannya agar logika
// resolusi view & mode responsif mudah diuji secara terisolasi (unit test &
// property test — lihat design: Property 3 dan Property 6) begitu test runner
// disetujui nanti.
//
// Catatan desain/urutan tugas: komponen view konkret (DashboardView,
// ChatbotAssistantView, dll.) belum dibuat (menyusul pada Task 13 & 14).
// Karena itu `resolveView` sengaja mengembalikan sebuah `MenuKey` kanonik,
// BUKAN komponen React. Pemetaan dari `MenuKey` ke komponen view konkret akan
// dilakukan pada lapisan render oleh MainContent (Task 11.3). Dengan begitu
// logika di sini tetap murni dan dapat diuji tanpa bergantung pada komponen.

import type { MenuKey } from './types';

/**
 * Lima kunci menu yang valid (urutan tetap sesuai R1.1).
 * Dideklarasikan mandiri (self-contained) agar logika murni ini terisolasi
 * dan tidak berkopling dengan data/menus.ts.
 */
export const VALID_MENU_KEYS = [
  'dashboard',
  'chatbot',
  'laporan-progress',
  'jadwal',
  'pengingat',
] as const satisfies readonly MenuKey[];

/**
 * Resolusi view yang TOTAL dengan default Dashboard (R1.3 & R6.6, Property 3).
 *
 * Jika `menuKey` adalah salah satu dari lima `MenuKey` valid, kembalikan apa
 * adanya (R1.3: menu valid teresolusi ke view-nya). Untuk nilai lain apa pun
 * (tidak dikenal/tidak valid/undefined), kembalikan `'dashboard'` sebagai
 * fallback (R6.6: input tidak valid jatuh ke Dashboard).
 *
 * Mengembalikan `MenuKey` kanonik; MainContent (Task 11.3) yang memetakan hasil
 * ini ke komponen view konkret pada lapisan render.
 */
export function resolveView(menuKey: unknown): MenuKey {
  return (VALID_MENU_KEYS as readonly string[]).includes(menuKey as string)
    ? (menuKey as MenuKey)
    : 'dashboard';
}

/** Mode tampilan responsif. */
export type ResponsiveMode = 'desktop' | 'mobile';

/**
 * Pemetaan lebar viewport ke mode responsif (R2.1/R2.2/R2.6, Property 6).
 *
 * `desktop` jika dan hanya jika `width >= 1024`; selain itu `mobile`
 * (sehingga rentang 768..<1024 dan <768 keduanya bernilai `mobile`).
 */
export function resolveMode(width: number): ResponsiveMode {
  return width >= 1024 ? 'desktop' : 'mobile';
}
