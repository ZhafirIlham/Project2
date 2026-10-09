// Komponen ErrorBanner presentational untuk Student Learning Assistant (Task 14.4).
//
// Menampilkan pesan kesalahan chatbot dalam bahasa Indonesia beserta kontrol
// "Coba lagi". Komponen ini SEPENUHNYA presentational dan dikendalikan via props
// (tidak memakai hooks, tidak menyimpan state, tidak mengatur timer sendiri).
//
// Pemetaan ke requirements:
// - R4.2: menampilkan pesan kesalahan bahasa Indonesia yang dapat dibaca Siswa
//   beserta kontrol untuk mencoba ulang permintaan yang sama.
// - R4.3: menampilkan pesan kegagalan koneksi beserta kontrol coba ulang
//   (pesan `message` disediakan parent sesuai kategori kesalahan).
// - R4.5: batas maksimal 3 percobaan ulang dengan jeda minimal 1 detik antar
//   percobaan.
//
// PENTING — pembagian tanggung jawab:
//   Penegakan jeda >= 1 detik antar percobaan dan batas 3 percobaan (R4.5)
//   DILAKUKAN OLEH PARENT (ChatbotAssistantView, Task 14.5) menggunakan
//   incrementRetry/canRetry dari chatSession serta pemanggilan api. Banner ini
//   hanya MEREFLEKSIKAN keadaan tersebut: ia menonaktifkan tombol ketika parent
//   memberi tahu `canRetry === false` (anggaran percobaan habis) atau
//   `isRetrying === true` (percobaan sedang berjalan / masih dalam cooldown).

export interface ErrorBannerProps {
  /** Pesan kesalahan bahasa Indonesia untuk ditampilkan (R4.2/R4.3). */
  message: string;
  /**
   * Apakah percobaan ulang masih diperbolehkan. Parent menghitung ini melalui
   * `canRetry(session)` (yaitu `retryCount < MAX_RETRIES` / `< 3`). (R4.5)
   */
  canRetry: boolean;
  /**
   * `true` selama percobaan ulang sedang berjalan ATAU selama cooldown >= 1 detik
   * antar percobaan — tombol dinonaktifkan agar jeda terjaga (R4.5).
   */
  isRetrying?: boolean;
  /** Dipanggil saat tombol ditekan; parent menangani increment + jeda + kirim ulang. */
  onRetry: () => void;
  /** Opsional: sisa percobaan untuk diinformasikan ke Siswa. */
  attemptsLeft?: number;
}

function ErrorBanner({
  message,
  canRetry,
  isRetrying = false,
  onRetry,
  attemptsLeft,
}: ErrorBannerProps) {
  // Tombol aktif hanya bila percobaan masih diizinkan DAN tidak sedang mencoba.
  const disabled = !canRetry || isRetrying;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-300"
    >
      {/* Pesan kesalahan bahasa Indonesia (R4.2/R4.3) */}
      <p className="text-sm leading-relaxed">{message}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={onRetry}
          disabled={disabled}
          aria-label="Coba lagi mengirim permintaan"
          className={[
            'inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
            'border-red-500/50 text-red-700 dark:text-red-300',
            disabled
              ? 'cursor-not-allowed opacity-50'
              : 'hover:bg-red-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500',
          ].join(' ')}
        >
          {isRetrying ? 'Mencoba...' : 'Coba lagi'}
        </button>

        {/* Catatan ketika batas percobaan tercapai (R4.5). */}
        {!canRetry && (
          <span className="text-xs text-[var(--text)]">
            Batas percobaan tercapai. Silakan coba lagi nanti.
          </span>
        )}

        {/* Sisa percobaan opsional, hanya saat masih boleh mencoba. */}
        {canRetry && typeof attemptsLeft === 'number' && attemptsLeft > 0 && (
          <span className="text-xs text-[var(--text)]">
            Sisa percobaan: {attemptsLeft}
          </span>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;
