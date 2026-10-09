// Operasi murni (pure, immutable, deterministik) untuk model `ChatSession`.
//
// Modul ini berisi SELURUH logika inti chat yang dapat diuji tanpa React dan
// tanpa efek samping. Semua fungsi mengembalikan objek `ChatSession` BARU dan
// tidak pernah memutasi argumen masukan maupun array `messages`.
//
// Pemetaan ke desain (Correctness Properties) & requirements:
//   - validateClientMessage  -> Property 1  / R3.6 (validasi batas pesan Frontend)
//   - appendUserMessage       -> Property 8  / R4.5, R5.1 (urutan & lastUserMessage)
//   - appendAssistantMessage  -> Property 7  / R3.4 (tepat satu jawaban asisten di akhir)
//   - setError                -> Property 10 / R4.4 (riwayat lestari saat kesalahan)
//   - incrementRetry/canRetry -> Property 11 / R4.5 (batas percobaan ulang maks. 3)
//
// Catatan kemurnian: id dan createdAt diterima sebagai parameter (BUKAN
// memanggil crypto.randomUUID()/Date.now() di dalam) agar fungsi deterministik
// dan mudah diuji. Lapisan view (Task 14.5) yang menyuntikkan nilai nyata.

import type { ChatMessage, ChatRole, ChatSession } from '../types';

// ---------------------------------------------------------------------------
// Konstanta batas percobaan ulang (R4.5 / Property 11)
// ---------------------------------------------------------------------------

/** Batas maksimal percobaan ulang; `retryCount` tidak pernah melebihi nilai ini. */
export const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Factory sesi & pesan
// ---------------------------------------------------------------------------

/**
 * Mengembalikan sesi chat kosong yang baru (R5.3 — sesi kosong baru saat halaman
 * dimuat, tanpa penyimpanan persisten).
 */
export function createEmptySession(): ChatSession {
  return {
    messages: [],
    status: 'idle',
    errorMessage: null,
    lastUserMessage: null,
    retryCount: 0,
  };
}

/**
 * Membangun satu `ChatMessage` secara murni. `id` dan `createdAt` disediakan
 * oleh pemanggil agar deterministik (lihat catatan kemurnian di atas).
 */
export function makeMessage(
  role: ChatRole,
  content: string,
  id: string,
  createdAt: number,
): ChatMessage {
  return { id, role, content, createdAt };
}

// ---------------------------------------------------------------------------
// Operasi penambahan pesan (immutable)
// ---------------------------------------------------------------------------

/**
 * Menambahkan pesan user di AKHIR daftar `messages` (role `'user'`).
 *
 * Mengembalikan sesi baru dengan:
 *   - array `messages` disalin (tidak dimutasi), pesan baru menjadi elemen terakhir
 *     dan pesan sebelumnya tidak berubah (Property 8 — invarian urutan);
 *   - `status: 'sending'` (pengiriman sedang berjalan);
 *   - `errorMessage: null` (error lama dibersihkan);
 *   - `lastUserMessage: content` agar fitur coba-ulang dapat mengirim ulang
 *     (R4.5 / R7.7).
 *
 * `retryCount` TIDAK diubah di sini — kenaikan retry ditangani `incrementRetry`.
 */
export function appendUserMessage(
  session: ChatSession,
  content: string,
  id: string,
  createdAt: number,
): ChatSession {
  const message = makeMessage('user', content, id, createdAt);
  return {
    ...session,
    messages: [...session.messages, message],
    status: 'sending',
    errorMessage: null,
    lastUserMessage: content,
  };
}

/**
 * Menambahkan TEPAT SATU pesan asisten di akhir daftar `messages`
 * (role `'assistant'`, `content === content`), tanpa mengubah pesan sebelumnya
 * (Property 7 / R3.4).
 *
 * Mengembalikan sesi baru dengan:
 *   - array `messages` disalin (tidak dimutasi);
 *   - `status: 'idle'` dan `errorMessage: null` (pengiriman sukses);
 *   - `retryCount: 0` — direset pada balasan sukses sehingga kegagalan
 *     berikutnya memulai anggaran percobaan ulang yang segar (R4.5).
 */
export function appendAssistantMessage(
  session: ChatSession,
  content: string,
  id: string,
  createdAt: number,
): ChatSession {
  const message = makeMessage('assistant', content, id, createdAt);
  return {
    ...session,
    messages: [...session.messages, message],
    status: 'idle',
    errorMessage: null,
    retryCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Transisi state error (riwayat lestari)
// ---------------------------------------------------------------------------

/**
 * Transisi ke state kesalahan. Riwayat `messages` IDENTIK dengan sebelumnya —
 * isi dan urutan tidak berubah, tidak ada pesan ditambah/dihapus/diurut ulang
 * (Property 10 / R4.4). Array disalin agar imutabilitas jelas; `lastUserMessage`
 * dan `retryCount` dibiarkan apa adanya (agar coba-ulang masih punya payload).
 */
export function setError(session: ChatSession, errorMessage: string): ChatSession {
  return {
    ...session,
    messages: [...session.messages],
    status: 'error',
    errorMessage,
  };
}

// ---------------------------------------------------------------------------
// Percobaan ulang (R4.5 / Property 11)
// ---------------------------------------------------------------------------

/**
 * Menaikkan `retryCount` sebesar 1 tetapi DIBATASI pada `MAX_RETRIES` sehingga
 * tidak pernah melebihinya (Property 11 / R4.5). Menandai pengiriman ulang
 * sedang berjalan: `status: 'sending'` dan `errorMessage: null`.
 */
export function incrementRetry(session: ChatSession): ChatSession {
  return {
    ...session,
    retryCount: Math.min(session.retryCount + 1, MAX_RETRIES),
    status: 'sending',
    errorMessage: null,
  };
}

/**
 * Helper murni: `true` jika dan hanya jika masih ada sisa anggaran percobaan
 * ulang (`retryCount < MAX_RETRIES`). Dipakai view/ErrorBanner untuk
 * menonaktifkan kontrol setelah 3 percobaan.
 */
export function canRetry(session: ChatSession): boolean {
  return session.retryCount < MAX_RETRIES;
}

// ---------------------------------------------------------------------------
// Validasi klien (Property 1 / R3.6)
// ---------------------------------------------------------------------------

/** Hasil validasi pesan klien; `value` berisi payload terpangkas saat `ok`. */
export interface MessageValidation {
  ok: boolean;
  value?: string;
}

/**
 * Validasi pesan di sisi klien (Property 1 / R3.6).
 *
 * Hitung `trimmed = s.trim()`. Mengembalikan `{ ok: true, value: trimmed }`
 * jika dan hanya jika `trimmed.length` berada pada rentang 1..2000; selain itu
 * `{ ok: false }` (kosong/whitespace-only atau > 2000 → tidak valid). Saat
 * `ok`, payload yang dikirim adalah string terpangkas `trimmed`.
 */
export function validateClientMessage(s: string): MessageValidation {
  const trimmed = s.trim();
  if (trimmed.length >= 1 && trimmed.length <= 2000) {
    return { ok: true, value: trimmed };
  }
  return { ok: false };
}
