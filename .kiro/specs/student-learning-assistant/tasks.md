# Implementation Plan: Student Learning Assistant

## Overview

Rencana ini memecah desain menjadi langkah-langkah pengkodean kecil yang berurutan dan saling membangun, dikerjakan **langsung di dalam folder `frontend/` dan `backend/` yang sudah ada** (R8.3). Hanya stack yang sudah terpasang yang digunakan — tanpa menambahkan dependency runtime baru (R8.1, R8.2):

- **Frontend:** React 19, React DOM 19, TypeScript ~6, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`). Navigasi, HTTP, dan state memakai view-switching `useState`, `fetch` + `AbortController`, dan React hooks bawaan — tanpa `react-router`, `axios`, atau library state eksternal.
- **Backend (CommonJS):** Express 5, `cors`, `dotenv`, `@aws-sdk/client-bedrock-runtime`.

Urutan pengerjaan: Backend terlebih dahulu (konfigurasi → service → route → entry), lalu scaffolding Frontend (konfigurasi Tailwind → tipe & data → api → shell & komponen → view → komponen chat), diakhiri verifikasi build.

**Catatan tentang pengujian:** Belum ada test runner yang terpasang di `frontend/` maupun `backend/`. Sesuai steering "Aturan Alur Kerja Implementasi" (Batasan teknologi) dan R8.4, menambahkan test runner / library PBT **tertunda sampai memperoleh persetujuan pemilik proyek**. Oleh karena itu seluruh tugas pengujian (termasuk 15 property test dari desain) dikumpulkan dalam satu task **opsional** di akhir (ditandai `*`) yang hanya dikerjakan jika disetujui. Logika inti ditulis sebagai **fungsi murni yang mudah diuji** agar siap diuji begitu runtime disetujui. Rencana utama dapat diselesaikan dan diverifikasi tanpa persetujuan tersebut (lewat `npm run build` / `tsc` dan start manual backend).

## Tasks

- [x] 1. Scaffold konfigurasi & variabel lingkungan Backend
  - Buat `backend/config.js`: muat `.env` via `dotenv`, ekspor objek konfigurasi (`PORT` default 3001, `FRONTEND_ORIGIN`, `AWS_REGION`, `BEDROCK_MODEL_ID`).
  - Implementasikan fungsi murni `validateConfig(env)` yang mengembalikan tepat daftar nama variabel wajib yang hilang (`FRONTEND_ORIGIN`, `AWS_REGION`, `BEDROCK_MODEL_ID`).
  - Buat `backend/.env.example` yang mendokumentasikan seluruh kunci (`PORT`, `FRONTEND_ORIGIN`, `AWS_REGION`, `BEDROCK_MODEL_ID`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) tanpa nilai rahasia.
  - _Requirements: 7.4, 7.5, 8.2, 8.3_

- [x] 2. Implementasikan Bedrock Service Backend
  - Buat `backend/services/bedrock.js`: bungkus `BedrockRuntimeClient` + `InvokeModelCommand` dari `@aws-sdk/client-bedrock-runtime`.
  - Susun payload prompt dari pesan Siswa dan uraikan respons model menjadi teks `reply`.
  - Terapkan timeout 30 detik (via `AbortController`/opsi klien SDK); petakan kondisi timeout vs kegagalan upstream menjadi hasil yang dapat dibedakan oleh pemanggil.
  - Pakai `AWS_REGION` + `BEDROCK_MODEL_ID` dari config; kredensial mengikuti default credential provider chain AWS SDK.
  - _Requirements: 3.2, 3.3, 4.1, 8.2_

- [x] 3. Implementasikan route chat & health Backend
  - Buat `backend/routes/chat.js`: handler `POST /api/chat` yang memvalidasi panjang pesan 1..4000 (fungsi validasi murni); jika tidak valid kembalikan `400 INVALID_INPUT` **tanpa** memanggil Bedrock Service.
  - Panggil Bedrock Service untuk pesan valid; petakan hasil/kesalahan ke respons terstruktur: sukses `200 { reply }`; error `{ error: { code, message } }` dengan code `UPSTREAM_TIMEOUT`(504), `UPSTREAM_ERROR`(502), `CONFIG_ERROR`(503), `INTERNAL_ERROR`(500).
  - Tambahkan handler `GET /api/health` → `200 { status: "ok" }`.
  - _Requirements: 7.1, 7.2, 3.2, 4.1_

- [x] 4. Implementasikan entry point Backend (`index.js`)
  - Muat konfigurasi dari `config.js`, jalankan `validateConfig()`; jika ada variabel hilang, catat daftar variabel yang hilang ke log dan `process.exit(1)` **tanpa** `listen` (R7.5).
  - Buat app Express, pasang middleware `cors` dengan `origin` tunggal dari `FRONTEND_ORIGIN` (origin lain ditolak), dan `express.json()` body parser.
  - Daftarkan route dari `routes/chat.js`, lalu `listen` pada `PORT`.
  - _Requirements: 7.3, 7.4, 7.5, 8.2_

- [x] 5. Checkpoint Backend
  - Pastikan backend dapat distart secara manual (`node index.js`) dengan `.env` lengkap, dan berhenti dengan log yang jelas saat variabel wajib hilang. Pastikan semua berjalan; tanyakan ke pengguna bila ada pertanyaan.

- [x] 6. Konfigurasi Tailwind v4 & bersihkan starter Vite di Frontend
  - Tambahkan plugin `@tailwindcss/vite` ke daftar `plugins` di `frontend/vite.config.ts` (paket sudah terpasang; bukan dependency baru).
  - Tambahkan `@import "tailwindcss";` di bagian atas `frontend/src/index.css`, **pertahankan** variabel warna aksen yang ada (`--accent: #aa3bff` dan varian dark mode) serta dukungan `prefers-color-scheme`.
  - Bersihkan konten starter: kosongkan/hapus pemakaian `frontend/src/App.css` dan hapus markup hero/counter dari `App.tsx` (akan digantikan shell pada task berikutnya).
  - _Requirements: 8.1, 8.3_

- [x] 7. Definisikan tipe TypeScript Frontend (`types.ts`)
  - Buat `frontend/src/types.ts` berisi: `MenuKey`, `MenuItem`, `ChatRole`, `ChatMessage`, `ChatStatus`, `ChatSession`, `ProgressReport`, `ScheduleItem`, `Reminder`, `QuickLink`.
  - Sertakan tipe kontrak Backend: `ChatRequestBody`, `ChatSuccessResponse`, `ChatErrorResponse`.
  - _Requirements: 1.1, 5.1, 6.1, 6.2, 6.3, 6.4_

- [x] 8. Buat modul data contoh Frontend (`data/`)
  - [x] 8.1 Buat `frontend/src/data/menus.ts`
    - Daftar 5 menu dengan urutan tetap: Dashboard, Chatbot Assistant, Laporan Progress, Jadwal, Pengingat.
    - _Requirements: 1.1_

  - [x] 8.2 Buat `frontend/src/data/quickLinks.ts`
    - Antara 3 sampai 6 `QuickLink`; setiap `target` menunjuk `MenuKey` valid selain `dashboard`.
    - _Requirements: 6.1_

  - [x] 8.3 Buat `progressReports.ts`, `scheduleItems.ts`, `reminders.ts`
    - Masing-masing berisi 1..20 baris data contoh sesuai tipe.
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 9. Implementasikan client API Frontend (`api.ts`)
  - Buat `frontend/src/api.ts` dengan `sendChatMessage(message, signal)` memakai `fetch` ke endpoint Backend `POST /api/chat`.
  - Bungkus pemanggilan dengan `AbortController` + `setTimeout(30000)`; petakan abort → `errorCode 'TIMEOUT'`, kegagalan jaringan → `'NETWORK'`, dan error terstruktur backend → code/pesan backend; semua pesan error siap tampil dalam bahasa Indonesia.
  - Kembalikan bentuk `ChatApiResult { ok, reply?, errorCode?, errorMessage? }`.
  - _Requirements: 7.6, 7.7, 4.2, 4.3_

- [x] 10. Implementasikan logika navigasi murni & shell `App.tsx`
  - [x] 10.1 Implementasikan helper resolusi view & mode responsif (fungsi murni)
    - Tambahkan fungsi `resolveView(menuKey)` yang total: mengembalikan komponen view untuk 5 `MenuKey` valid dan `DashboardView` untuk nilai lain (default).
    - Tambahkan `resolveMode(width)`: `desktop` jika `width >= 1024`, selain itu `mobile` (termasuk 768..<1024).
    - Letakkan sebagai fungsi murni (mis. di `App.tsx` atau modul util kecil) agar mudah diuji.
    - _Requirements: 1.3, 6.6, 2.1, 2.2, 2.6_

  - [x] 10.2 Implementasikan shell `App.tsx`
    - State `activeMenu: MenuKey` (awal `'dashboard'`, R1.2) dan `sidebarOpen: boolean`.
    - Implementasikan `selectMenu(k)` idempoten: memilih menu yang sama tidak mengubah state; render `Sidebar`, `MobileMenuButton`, dan `MainContent`.
    - _Requirements: 1.2, 1.5, 1.3_

- [x] 11. Implementasikan komponen layout Frontend
  - [x] 11.1 Buat `frontend/src/components/Sidebar.tsx`
    - Render 5 menu berurutan dari `data/menus.ts`; tandai tepat satu item aktif dengan gaya aksen; di bawah `lg` render sebagai overlay/drawer dengan backdrop dan transisi <=300ms; memilih menu di mobile menutup sidebar.
    - _Requirements: 1.1, 1.4, 2.3, 2.4_

  - [x] 11.2 Buat `frontend/src/components/MobileMenuButton.tsx`
    - Tombol pembuka sidebar yang tampil hanya di bawah `lg` (viewport < 1024px) dan tersembunyi di desktop.
    - _Requirements: 2.1, 2.2, 2.6_

  - [x] 11.3 Buat `frontend/src/components/MainContent.tsx`
    - Resolusi view dari `activeMenu` via `resolveView`; bungkus area konten dengan error boundary React yang mempertahankan `activeMenu` sebelumnya dan menampilkan indikasi kegagalan alih-alih crash; layout fleksibel tanpa scroll horizontal.
    - _Requirements: 1.3, 1.6, 2.5, 6.6_

- [x] 12. Checkpoint layout
  - Pastikan shell + sidebar + navigasi responsif ter-render tanpa error TypeScript. Pastikan semua berjalan; tanyakan ke pengguna bila ada pertanyaan.

- [x] 13. Implementasikan komponen data contoh & view statis
  - [x] 13.1 Buat `SampleBadge.tsx` dan `SampleDataTable.tsx`
    - `SampleBadge`: penanda visual bertuliskan "data contoh". `SampleDataTable`: tabel generik untuk baris data + empty-state "belum ada data" ketika kosong.
    - _Requirements: 6.5, 6.7_

  - [x] 13.2 Buat `views/DashboardView.tsx`
    - Teks sambutan + render 3..6 kartu akses cepat dari `data/quickLinks.ts` yang berpindah ke menu tujuan.
    - _Requirements: 6.1_

  - [x] 13.3 Buat `LaporanProgressView.tsx`, `JadwalView.tsx`, `PengingatView.tsx`
    - Setiap view menampilkan `SampleDataTable` + `SampleBadge` dari modul data terkait, dengan empty-state saat data kosong.
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.7_

- [x] 14. Implementasikan komponen chat & `ChatbotAssistantView`
  - [x] 14.1 Implementasikan operasi `ChatSession` murni
    - Fungsi murni untuk: menambah pesan user, menambah pesan assistant (tepat satu pesan di akhir, role `assistant`, tanpa mengubah pesan lama), transisi ke state error (riwayat tidak berubah), dan menaikkan `retryCount` dengan batas maksimal 3.
    - Validasi klien murni: `ok` jika dan hanya jika panjang `trim(s)` 1..2000; saat `ok` payload = `trim(s)`.
    - _Requirements: 3.4, 3.6, 4.4, 4.5, 5.1_

  - [x] 14.2 Buat `frontend/src/chat/MessageList.tsx`
    - Render daftar pesan berurutan sesuai `createdAt`, membedakan gelembung `user` vs `assistant`; gulir vertikal dan auto-scroll menjaga pesan terbaru terlihat.
    - _Requirements: 5.1, 5.5_

  - [x] 14.3 Buat `frontend/src/chat/MessageComposer.tsx`
    - Textarea + hitungan karakter + validasi <=2000; tombol kirim dinonaktifkan saat input tidak valid atau saat `status == 'sending'` (dengan indikator proses).
    - _Requirements: 3.5, 3.6_

  - [x] 14.4 Buat `frontend/src/chat/ErrorBanner.tsx`
    - Tampilkan pesan error bahasa Indonesia + kontrol "Coba lagi"; batasi maksimal 3 percobaan dengan jeda minimal 1 detik antar percobaan; nonaktifkan kontrol setelah 3 percobaan.
    - _Requirements: 4.2, 4.3, 4.5_

  - [x] 14.5 Buat `frontend/src/views/ChatbotAssistantView.tsx`
    - Kelola `ChatSession` via hooks + operasi murni (14.1); rangkai `MessageList`, `MessageComposer`, `ErrorBanner`.
    - Alur kirim: validasi lokal → tampilkan pesan user + status `sending` + tombol disabled → `sendChatMessage` (AbortController 30s) → tampilkan jawaban asisten atau transisikan ke error (riwayat tetap) lalu aktifkan tombol kembali.
    - Mulai sesi kosong baru saat halaman dimuat; jangan menulis ke penyimpanan persisten.
    - _Requirements: 3.1, 3.4, 3.5, 3.7, 4.4, 5.2, 5.3_

- [x] 15. Verifikasi akhir (build & start manual)
  - Jalankan build Frontend: `npm run build` di `frontend/` (menjalankan `tsc -b && vite build`) dan perbaiki galat tipe/build bila ada.
  - Lakukan pengecekan start Backend manual: `node index.js` di `backend/` dengan `.env` lengkap untuk memastikan server listen, dan konfirmasi perilaku exit saat variabel wajib hilang.
  - _Requirements: 7.1, 7.4, 7.5, 8.1, 8.2, 8.3_

- [x]* 16. (OPSIONAL — menunggu persetujuan pemilik) Setup test runner + PBT dan implementasi 15 properti
  - **Catatan R8.4 / steering:** Task ini menambah dependency baru (test runner + library PBT, mis. Vitest + fast-check untuk Frontend; runner + fast-check untuk Backend). JANGAN kerjakan tanpa persetujuan eksplisit pemilik proyek. Rencana utama (task 1–15) sudah lengkap tanpa task ini.
  - Setelah disetujui: pasang runner + PBT (min. 100 iterasi/property), lalu implementasikan satu property test per properti berikut, masing-masing dianotasi `Feature: student-learning-assistant, Property {n}: ...`:
    - **Property 1** Validasi batas pesan Frontend — _Validates: 3.1, 3.6_
    - **Property 2** Validasi batas pesan Backend tanpa memanggil Bedrock saat invalid — _Validates: 7.1, 7.2_
    - **Property 3** Resolusi view total dengan default Dashboard — _Validates: 1.3, 6.6_
    - **Property 4** Tepat satu Active_Menu — _Validates: 1.4_
    - **Property 5** Idempotensi pemilihan menu — _Validates: 1.5_
    - **Property 6** Pemetaan lebar viewport ke mode responsif — _Validates: 2.1, 2.2, 2.6_
    - **Property 7** Penambahan jawaban asisten — _Validates: 3.4_
    - **Property 8** Invarian urutan pesan — _Validates: 5.1_
    - **Property 9** Tombol kirim nonaktif saat memproses — _Validates: 3.5_
    - **Property 10** Pelestarian riwayat saat kesalahan — _Validates: 4.4_
    - **Property 11** Batas percobaan ulang — _Validates: 4.5_
    - **Property 12** Pemrosesan Backend tanpa-status — _Validates: 5.4_
    - **Property 13** Invarian tautan akses cepat Dashboard — _Validates: 6.1_
    - **Property 14** Kebijakan CORS berbasis origin — _Validates: 7.3_
    - **Property 15** Validasi konfigurasi startup — _Validates: 7.5_
  - Tambahkan pula unit/example/integration test (dengan mock Bedrock) sesuai Testing Strategy desain.
  - _Requirements: 8.4 (dan properti yang direferensikan di atas)_

## Notes

- Task dengan `*` bersifat **opsional** dan tidak dikerjakan tanpa persetujuan pemilik (penambahan test runner/PBT = dependency baru, R8.4).
- Setiap task mereferensikan requirement spesifik untuk ketertelusuran.
- Checkpoint memastikan validasi bertahap tanpa menjalankan aplikasi end-to-end secara manual sebagai bagian wajib (verifikasi lewat build/`tsc` dan start manual terbatas).
- Logika inti ditulis sebagai fungsi murni agar siap diuji begitu runtime pengujian disetujui.
- Seluruh pekerjaan terbatas pada penulisan/perubahan kode di dalam `frontend/` dan `backend/` yang sudah ada (R8.3).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "6"] },
    { "id": 1, "tasks": ["2", "7"] },
    { "id": 2, "tasks": ["3", "8.1", "8.2", "8.3", "9", "10.1"] },
    { "id": 3, "tasks": ["4", "10.2", "11.2", "13.1", "14.1"] },
    { "id": 4, "tasks": ["11.1", "11.3", "13.2", "13.3", "14.2", "14.3", "14.4"] },
    { "id": 5, "tasks": ["14.5"] },
    { "id": 6, "tasks": ["15"] },
    { "id": 7, "tasks": ["16"] }
  ]
}
```
