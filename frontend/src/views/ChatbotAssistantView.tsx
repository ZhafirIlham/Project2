// ChatbotAssistantView — area percakapan Chatbot Assistant (Task 14.5).
//
// Komponen ini adalah LAPISAN ORKESTRASI untuk fitur chatbot: ia memiliki
// `ChatSession` di memori React dan merangkai komponen presentational
// `MessageList`, `MessageComposer`, dan `ErrorBanner`. Seluruh transisi state
// dilakukan lewat operasi MURNI dari `chat/chatSession.ts` (Task 14.1), sehingga
// view hanya mengurus efek samping (fetch, timeout, AbortController, timer).
//
// Pemetaan ke requirements:
// - R3.1: pesan user ditampilkan + status 'sending' saat dikirim (<=2s; sinkron).
// - R3.4: tepat satu pesan asisten ditambahkan saat jawaban diterima.
// - R3.5: selama in-flight, tombol kirim dinonaktifkan (via `isSending`) dan
//   indikator proses tampil (MessageList + MessageComposer).
// - R3.7: saat gagal/timeout, status menjadi 'error' (bukan 'sending') sehingga
//   tombol kirim aktif kembali; indikasi kesalahan tampil.
// - R4.4: riwayat pesan dipertahankan utuh saat kesalahan ditampilkan.
// - R5.2: Chat_Session HANYA disimpan di memori — TIDAK ada akses
//   localStorage/sessionStorage/penyimpanan persisten apa pun di sini.
// - R5.3: sesi kosong BARU dibuat saat komponen dimuat (navigasi ke menu /
//   reload keduanya memicu mount sehingga sesi kosong terbentuk).
//
// Catatan timeout 30 detik: view INI yang MEMILIKI timeout. Ia membuat
// `AbortController`, memasang `setTimeout(30000)` untuk memanggil `abort()`,
// lalu meneruskan `signal` ke `sendChatMessage` (api.ts hanya menerima signal).

import { useEffect, useRef, useState } from 'react';
import type { ChatSession } from '../types';
import { sendChatMessage } from '../api';
import {
  MAX_RETRIES,
  appendAssistantMessage,
  appendUserMessage,
  canRetry,
  createEmptySession,
  incrementRetry,
  setError,
  validateClientMessage,
} from '../chat/chatSession';
import MessageList from '../chat/MessageList';
import MessageComposer from '../chat/MessageComposer';
import ErrorBanner from '../chat/ErrorBanner';

/** Batas waktu permintaan (R3.7/R4.3): dimiliki oleh view ini. */
const REQUEST_TIMEOUT_MS = 30_000;
/** Jeda minimal antar percobaan ulang (R4.5). */
const RETRY_COOLDOWN_MS = 1_000;
/** Pesan error generik jika Backend tidak menyertakan pesan deskriptif. */
const FALLBACK_ERROR_MESSAGE = 'Terjadi kesalahan. Silakan coba lagi.';

function ChatbotAssistantView() {
  // R5.3 + R5.2: sesi kosong BARU per-mount, hidup hanya di memori. Lazy init
  // memastikan `createEmptySession()` dipanggil sekali saat mount.
  const [session, setSession] = useState<ChatSession>(() => createEmptySession());

  // `true` selama percobaan ulang berjalan ATAU selama cooldown 1 detik —
  // dipakai untuk menonaktifkan tombol pada ErrorBanner (R4.5).
  const [isRetrying, setIsRetrying] = useState(false);

  // Controller permintaan in-flight; dipakai untuk membatalkan saat unmount.
  const abortRef = useRef<AbortController | null>(null);

  // Flag unmount agar callback async tidak melakukan setState setelah unmount.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      // Batalkan permintaan yang masih berjalan saat komponen di-unmount.
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Rutin pengiriman inti: timeout 30s dimiliki di sini (R3.7/R4.3).
  // -------------------------------------------------------------------------
  async function runRequest(messageText: string): Promise<void> {
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const result = await sendChatMessage(messageText, controller.signal);

      // Abaikan hasil jika komponen sudah di-unmount.
      if (!mountedRef.current) return;

      if (result.ok) {
        // R3.4: tepat satu pesan asisten; status kembali 'idle' (R3.7 —
        // composer aktif lagi), retryCount direset oleh appendAssistantMessage.
        setSession((s) =>
          appendAssistantMessage(s, result.reply ?? '', crypto.randomUUID(), Date.now()),
        );
      } else {
        // R4.4: riwayat lestari; R3.7: status 'error' → tombol kirim aktif lagi.
        setSession((s) => setError(s, result.errorMessage ?? FALLBACK_ERROR_MESSAGE));
      }
    } finally {
      clearTimeout(timer);
      // Lepas referensi controller jika masih milik permintaan ini.
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Kirim pesan baru (R3.1, R3.5, R3.6).
  // -------------------------------------------------------------------------
  function handleSend(raw: string): void {
    // Jangan mulai permintaan baru selagi ada yang berjalan.
    if (session.status === 'sending' || isRetrying) return;

    // R3.6: validasi klien (composer sudah gating, namun periksa ulang).
    const validation = validateClientMessage(raw);
    if (!validation.ok || validation.value === undefined) return;

    const text = validation.value;
    // R3.1: tampilkan pesan user + status 'sending' dalam satu update
    // (composer menonaktifkan tombol via isSending, R3.5).
    setSession((s) => appendUserMessage(s, text, crypto.randomUUID(), Date.now()));
    void runRequest(text);
  }

  // -------------------------------------------------------------------------
  // Coba ulang permintaan terakhir (R4.5): maks 3 percobaan, jeda >= 1 detik.
  // -------------------------------------------------------------------------
  async function handleRetry(): Promise<void> {
    // Tangkap payload & kelayakan dari state terkini saat handler dipanggil.
    const lastUserMessage = session.lastUserMessage;
    if (!canRetry(session) || isRetrying || lastUserMessage === null) return;

    setIsRetrying(true);
    try {
      // R4.5: jeda minimal 1 detik SEBELUM mengirim ulang.
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_COOLDOWN_MS));
      if (!mountedRef.current) return;

      // Naikkan retryCount (dibatasi MAX_RETRIES) + status 'sending'.
      setSession((s) => incrementRetry(s));
      await runRequest(lastUserMessage);
    } finally {
      if (mountedRef.current) {
        setIsRetrying(false);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Nilai turunan untuk komponen anak.
  // -------------------------------------------------------------------------
  const isSending = session.status === 'sending';
  const showError = session.status === 'error' && session.errorMessage !== null;
  const retryAllowed = canRetry(session);
  const attemptsLeft = MAX_RETRIES - session.retryCount;

  return (
    // Kolom flex dengan tinggi terbatas (h-[70vh]) agar MessageList menggulir
    // secara internal (overflow ditangani di dalamnya) dan composer tetap
    // terlihat di bawah. `min-h-0` penting agar anak flex bisa menyusut.
    <section
      aria-labelledby="chatbot-heading"
      className="flex h-[70vh] min-h-0 flex-col gap-3"
    >
      <header className="flex flex-col gap-1">
        <h2
          id="chatbot-heading"
          className="text-2xl font-semibold text-[var(--text-h)]"
        >
          Chatbot Assistant
        </h2>
        <p className="text-sm text-[var(--text)]">
          Ajukan pertanyaan belajarmu dan dapatkan jawaban dari asisten AI.
        </p>
      </header>

      {/* Daftar pesan: mengisi ruang tersisa & menggulir vertikal (R5.1/R5.5). */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
        <MessageList messages={session.messages} isSending={isSending} />
      </div>

      {/* Banner kesalahan hanya saat status 'error' (R4.2/R4.3/R4.5). */}
      {showError && session.errorMessage !== null ? (
        <ErrorBanner
          message={session.errorMessage}
          canRetry={retryAllowed}
          isRetrying={isRetrying}
          onRetry={() => void handleRetry()}
          attemptsLeft={attemptsLeft}
        />
      ) : null}

      {/* Area input pesan (R3.1/R3.5/R3.6). */}
      <MessageComposer onSend={handleSend} isSending={isSending} />
    </section>
  );
}

export default ChatbotAssistantView;
