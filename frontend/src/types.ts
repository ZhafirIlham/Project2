// Definisi tipe TypeScript Frontend untuk Student Learning Assistant.
// Berisi tipe navigasi, model pesan/sesi chat (in-memory), model data contoh,
// dan kontrak request/response Backend. Pure type declarations — tanpa impor.

// ---------------------------------------------------------------------------
// Navigasi & Menu (lihat design: "Manajemen State & Navigasi")
// ---------------------------------------------------------------------------

/** Kunci menu yang valid; urutan tetap sesuai R1.1. */
export type MenuKey =
  | 'dashboard'
  | 'chatbot'
  | 'laporan-progress'
  | 'jadwal'
  | 'pengingat';

/** Satu item menu pada Sidebar. */
export interface MenuItem {
  key: MenuKey;
  label: string; // "Dashboard", "Chatbot Assistant", ...
}

// ---------------------------------------------------------------------------
// Model Pesan & Sesi Chat (Frontend, in-memory — lihat design: "Data Models")
// ---------------------------------------------------------------------------

/** Peran pengirim pesan dalam percakapan. */
export type ChatRole = 'user' | 'assistant';

/** Satu pesan dalam percakapan chat. */
export interface ChatMessage {
  id: string;            // id unik (crypto.randomUUID())
  role: ChatRole;
  content: string;
  createdAt: number;     // epoch ms, untuk urutan tampil (R5.1)
}

/** Status siklus hidup pengiriman pesan. */
export type ChatStatus = 'idle' | 'sending' | 'error';

/** Sesi chat sementara yang hidup di memori React selama sesi berjalan. */
export interface ChatSession {
  messages: ChatMessage[];
  status: ChatStatus;
  errorMessage: string | null;    // pesan error aktif (bahasa Indonesia)
  lastUserMessage: string | null; // untuk fitur coba ulang (R4.5/R7.7)
  retryCount: number;             // 0..3, batas percobaan ulang (R4.5)
}

// ---------------------------------------------------------------------------
// Model Data Contoh (Frontend, dari memori — lihat design: "Data Models")
// ---------------------------------------------------------------------------

/** Baris laporan progress belajar. */
export interface ProgressReport {
  id: string;
  subject: string;         // mata pelajaran
  topic: string;           // topik/materi
  progressPercent: number; // 0..100
  updatedAt: string;       // tanggal (string tampilan)
}

/** Baris jadwal belajar/kegiatan. */
export interface ScheduleItem {
  id: string;
  title: string;
  day: string;      // mis. "Senin"
  time: string;     // mis. "08:00 - 09:30"
  location: string;
}

/** Baris pengingat tugas/aktivitas. */
export interface Reminder {
  id: string;
  title: string;
  dueDate: string;                     // tanggal jatuh tempo (string tampilan)
  priority: 'low' | 'medium' | 'high';
  done: boolean;
}

/** Tautan akses cepat pada Dashboard (3..6 tautan, R6.1). */
export interface QuickLink {
  label: string;
  target: MenuKey; // menu tujuan selain 'dashboard'
}

// ---------------------------------------------------------------------------
// Kontrak Request/Response Backend (lihat design: "Bentuk Request/Response
// Backend"). Didokumentasikan sebagai acuan Frontend untuk POST /api/chat.
// ---------------------------------------------------------------------------

/** Body request ke POST /api/chat. */
export interface ChatRequestBody {
  message: string;
}

/** Respons sukses (200) dari POST /api/chat. */
export interface ChatSuccessResponse {
  reply: string;
}

/** Respons gagal (4xx/5xx) dari POST /api/chat. */
export interface ChatErrorResponse {
  error: { code: string; message: string };
}
