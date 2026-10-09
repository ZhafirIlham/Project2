// Client API Frontend untuk Student Learning Assistant.
// Menyediakan satu fungsi `sendChatMessage` yang memanggil endpoint Backend
// `POST /api/chat` memakai `fetch`, lalu memetakan hasil/kesalahan menjadi
// bentuk `ChatApiResult` dengan pesan error siap tampil dalam bahasa Indonesia
// (R7.6, R7.7, R4.2, R4.3). Fungsi ini tidak pernah melempar; selalu resolve
// ke sebuah `ChatApiResult`.

import type {
  ChatRequestBody,
  ChatSuccessResponse,
  ChatErrorResponse,
} from './types';

/** Hasil pemanggilan `sendChatMessage` (lihat design: "Frontend — Modul api.ts"). */
export interface ChatApiResult {
  ok: boolean;
  reply?: string;
  errorCode?: string;
  errorMessage?: string;
}

// Base URL Backend. Bisa dioverride lewat Vite env var `VITE_API_BASE_URL`
// (mis. untuk deployment), dengan fallback ke dev lokal.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const CHAT_URL = `${API_BASE}/api/chat`;

/** Type guard: apakah objek sesuai bentuk `ChatErrorResponse` dari Backend. */
function isChatErrorResponse(value: unknown): value is ChatErrorResponse {
  if (typeof value !== 'object' || value === null) return false;
  const error = (value as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return false;
  const { code, message } = error as { code?: unknown; message?: unknown };
  return typeof code === 'string' && typeof message === 'string';
}

/**
 * Kirim pesan Siswa ke Backend dan kembalikan hasil terstruktur.
 *
 * Catatan tentang timeout 30 detik (R4.3/R7.7): fungsi ini memakai
 * `AbortSignal` yang disediakan pemanggil, bukan membuat `AbortController`
 * internal. Lapisan view (`ChatbotAssistantView`, task 14.5) memiliki
 * `AbortController` + `setTimeout(30000)` dan meneruskan `signal` ke sini.
 * Dengan begitu hanya ada satu sumber kebenaran untuk pembatalan — menghindari
 * dua controller yang saling bersaing. Saat abort terjadi (timeout atau
 * pembatalan pengguna), `fetch` melempar `AbortError` yang dipetakan ke
 * `errorCode = 'TIMEOUT'` di bawah.
 *
 * @param message Teks pesan yang akan dikirim (validasi panjang dilakukan pemanggil).
 * @param signal  AbortSignal milik pemanggil yang mengkodekan timeout 30 detik.
 */
export async function sendChatMessage(
  message: string,
  signal: AbortSignal,
): Promise<ChatApiResult> {
  let response: Response;

  try {
    response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message } satisfies ChatRequestBody),
      signal,
    });
  } catch (err) {
    // Abort (timeout 30s milik pemanggil atau pembatalan) → TIMEOUT.
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        ok: false,
        errorCode: 'TIMEOUT',
        errorMessage:
          'Koneksi ke layanan gagal atau terlalu lama. Silakan coba lagi.',
      };
    }
    // Kegagalan jaringan lain (DNS, offline, CORS, dll.) → NETWORK.
    return {
      ok: false,
      errorCode: 'NETWORK',
      errorMessage:
        'Gagal menghubungi layanan. Periksa koneksi Anda lalu coba lagi.',
    };
  }

  // Respons sukses: parse JSON dan validasi field `reply`.
  if (response.ok) {
    try {
      const data = (await response.json()) as ChatSuccessResponse;
      if (typeof data?.reply === 'string') {
        return { ok: true, reply: data.reply };
      }
    } catch {
      // jatuh ke penanganan respons tidak valid di bawah
    }
    return {
      ok: false,
      errorCode: 'INVALID_RESPONSE',
      errorMessage: 'Respons dari layanan tidak valid. Silakan coba lagi.',
    };
  }

  // Respons non-ok: coba parse error terstruktur dari Backend
  // (pesan Backend sudah dalam bahasa Indonesia).
  try {
    const data: unknown = await response.json();
    if (isChatErrorResponse(data)) {
      return {
        ok: false,
        errorCode: data.error.code,
        errorMessage: data.error.message,
      };
    }
  } catch {
    // jatuh ke error generik di bawah
  }

  return {
    ok: false,
    errorCode: 'SERVER_ERROR',
    errorMessage: 'Layanan sedang bermasalah. Silakan coba lagi nanti.',
  };
}
