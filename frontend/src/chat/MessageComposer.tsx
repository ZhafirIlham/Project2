// Komponen MessageComposer untuk Student Learning Assistant (Task 14.3).
//
// Area input chat: textarea terkontrol + hitungan karakter + validasi batas,
// dengan tombol kirim yang dinonaktifkan saat input tidak valid atau saat
// permintaan sedang diproses (status === 'sending'), lengkap dengan indikator
// proses.
//
// Perilaku terkait requirement:
// - R3.5: saat permintaan sedang berjalan (`isSending`), tombol kirim
//   dinonaktifkan dan menampilkan indikator proses ("Mengirim..." + spinner)
//   sehingga jelas permintaan sedang in-flight; textarea juga dinonaktifkan.
// - R3.6: validasi klien menolak pesan kosong/whitespace-only atau > 2000
//   karakter; tombol kirim dinonaktifkan ketika input tidak valid, dan
//   hitungan karakter ditampilkan (berubah merah saat melewati batas).
//
// Validasi memakai `validateClientMessage` dari `./chatSession` agar konsisten
// dengan logika inti (trim length 1..2000). `onSend` dipanggil dengan teks
// mentah — parent yang memvalidasi + memangkas lewat chatSession.

import { useState } from 'react';
import { validateClientMessage } from './chatSession';

/** Batas maksimal panjang pesan (konsisten dengan validateClientMessage). */
const MAX_LEN = 2000;

export interface MessageComposerProps {
  /** Dipanggil dengan teks input mentah; parent memvalidasi + memangkas via chatSession. */
  onSend: (message: string) => void;
  /** `true` selama permintaan berlangsung (status === 'sending'). */
  isSending: boolean;
}

function MessageComposer(props: MessageComposerProps) {
  const { onSend, isSending } = props;
  const [text, setText] = useState('');

  // Panjang terpangkas dipakai untuk hitungan & indikasi batas agar konsisten
  // dengan validasi (yang berbasis trim).
  const trimmedLength = text.trim().length;
  const overLimit = trimmedLength > MAX_LEN;

  // Validasi klien (R3.6): ok jika panjang trim 1..2000.
  const validation = validateClientMessage(text);

  // Gating tombol kirim (R3.5 + R3.6): nonaktif saat input tidak valid atau
  // saat permintaan sedang diproses.
  const sendDisabled = !validation.ok || isSending;

  function submit() {
    if (!validation.ok || isSending) {
      return;
    }
    onSend(text);
    setText('');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  // Enter mengirim, Shift+Enter menyisipkan baris baru — dijaga validasi yang sama.
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="chat-message-input" className="sr-only">
        Pesan untuk asisten
      </label>
      <textarea
        id="chat-message-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isSending}
        rows={3}
        placeholder="Tulis pertanyaanmu di sini..."
        aria-label="Pesan untuk asisten"
        aria-invalid={overLimit}
        className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text-h)] outline-none transition-colors placeholder:text-[var(--text)] focus:border-[var(--accent-border)] focus:ring-2 focus:ring-[var(--accent-border)] disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="flex items-center justify-between gap-3">
        {/* Hitungan karakter (R3.6): berubah merah saat melewati batas. */}
        <span
          aria-live="polite"
          className={
            overLimit
              ? 'text-sm font-medium text-red-500'
              : 'text-sm text-[var(--text)]'
          }
        >
          {trimmedLength} / {MAX_LEN}
        </span>

        <button
          type="submit"
          disabled={sendDisabled}
          aria-label={isSending ? 'Mengirim pesan' : 'Kirim pesan'}
          aria-busy={isSending}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-border)] bg-[var(--accent-bg)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[var(--accent-bg)] disabled:hover:text-[var(--accent)]"
        >
          {isSending && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
          {isSending ? 'Mengirim...' : 'Kirim'}
        </button>
      </div>
    </form>
  );
}

export default MessageComposer;
