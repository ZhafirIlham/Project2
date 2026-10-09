// MessageList — daftar pesan percakapan chat (Task 14.2).
//
// Tanggung jawab:
// - Menampilkan pesan secara BERURUTAN sesuai `createdAt` menaik (R5.1) serta
//   MEMBEDAKAN gelembung pengirim `user` (kanan, latar aksen) vs `assistant`
//   (kiri, latar permukaan/berbingkai).
// - Menyediakan GULIR VERTIKAL pada kontainer dan AUTO-SCROLL ke pesan terbaru
//   agar tetap terlihat saat jumlah pesan melebihi area tampilan (R5.5).
//
// Catatan desain:
// - Komponen presentasional murni; tidak memiliki state percakapan. Parent
//   (ChatbotAssistantView) memiliki Chat_Session dan meneruskan `messages`.
// - Tema memakai CSS variables (--accent, --accent-bg, --border, --bg, --text,
//   --text-h) sesuai konvensi aplikasi; tanpa dependensi baru.
// - Pembungkusan konten panjang: `whitespace-pre-wrap break-words` menjaga agar
//   teks panjang membungkus dan tidak memicu scroll horizontal (R2.5).

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

export interface MessageListProps {
  messages: ChatMessage[];
  /** Saat true, menampilkan gelembung "sedang mengetik" bergaya asisten (R3.5). */
  isSending?: boolean;
}

/**
 * Daftar gelembung pesan dengan auto-scroll ke pesan terbaru.
 *
 * - R5.1: urut berdasarkan `createdAt` menaik; `user` vs `assistant` dibedakan.
 * - R5.5: kontainer bisa digulir vertikal; pesan terbaru dijaga terlihat.
 */
function MessageList({ messages, isSending = false }: MessageListProps) {
  // Sentinel di bagian bawah daftar; dipakai untuk menggulir ke pesan terbaru.
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // R5.1: render salinan dangkal yang diurutkan menaik berdasarkan `createdAt`.
  // Parent idealnya sudah menambahkan pesan secara terurut, namun pengurutan di
  // sini membuat tampilan tetap benar tanpa bergantung pada urutan masukan.
  const ordered = [...messages].sort((a, b) => a.createdAt - b.createdAt);

  // R5.5: setiap kali jumlah pesan berubah (atau status mengetik berubah),
  // gulir sentinel bawah ke dalam tampilan agar pesan terbaru tetap terlihat.
  // Aman jika ref masih null (mis. render pertama sebelum mount selesai).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isSending]);

  const isEmpty = ordered.length === 0;

  return (
    // Kontainer scrollable: `flex-1`/`h-full` agar mengisi tinggi yang
    // dibatasi parent; `overflow-y-auto` menyediakan gulir vertikal (R5.5).
    // `aria-live="polite"` agar pesan asisten baru diumumkan oleh screen reader.
    <div
      className="flex-1 h-full min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {isEmpty && !isSending ? (
        // Empty state ramah (bahasa Indonesia), terpusat & muted.
        <div className="flex h-full items-center justify-center">
          <p className="max-w-sm text-center text-sm text-[var(--text)]">
            Mulai percakapan dengan mengetik pertanyaan di bawah.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((message) => {
            const isUser = message.role === 'user';
            return (
              <li
                key={message.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap break-words',
                    isUser
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] bg-[var(--accent-bg)] text-[var(--text)]',
                  ].join(' ')}
                >
                  <span className="sr-only">
                    {isUser ? 'Anda: ' : 'Asisten: '}
                  </span>
                  {message.content}
                </div>
              </li>
            );
          })}

          {/* R3.5: indikator sementara bergaya asisten saat pesan sedang dikirim. */}
          {isSending ? (
            <li className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl border border-[var(--border)] bg-[var(--accent-bg)] px-4 py-2 text-sm text-[var(--text)]">
                <span className="sr-only">Asisten: </span>
                <span aria-hidden="true">sedang mengetik…</span>
              </div>
            </li>
          ) : null}
        </ul>
      )}

      {/* Sentinel bawah: target auto-scroll agar pesan terbaru tetap terlihat. */}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;
