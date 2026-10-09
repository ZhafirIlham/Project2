'use strict';

// =============================================================================
// Entry point Backend (R7.3, R7.4, R7.5, R8.2)
//
// Urutan startup (lihat design.md — "Backend — Modul Internal", entry index.js):
//   1. Muat konfigurasi dari config.js (config.js sudah memanggil dotenv, R7.4).
//   2. Jalankan validateConfig(process.env) untuk validasi startup (R7.5).
//      Jika ada variabel wajib yang hilang, catat daftar variabel tersebut ke
//      log dan process.exit(1) TANPA membuat/menjalankan server (tidak listen).
//   3. Buat app Express, pasang middleware CORS (origin tunggal dari
//      FRONTEND_ORIGIN, R7.3) dan express.json() body parser.
//   4. Daftarkan route dari routes/chat.js, lalu listen pada PORT.
// =============================================================================

const express = require('express');
const cors = require('cors');

const config = require('./config');
const { validateConfig } = require('./config');

// Langkah validasi startup (R7.5): dijalankan SEBELUM membuat/menjalankan
// server. validateConfig bersifat murni dan mengembalikan daftar nama variabel
// wajib yang hilang berdasarkan objek environment yang diberikan.
const missing = validateConfig(process.env);

if (missing.length > 0) {
  console.error(
    'Konfigurasi tidak lengkap. Variabel lingkungan wajib berikut hilang: ' +
      missing.join(', ') +
      '. Server tidak dijalankan. Lengkapi berkas .env lalu jalankan ulang.'
  );
  // Hentikan proses tanpa pernah memanggil app.listen (R7.5).
  process.exit(1);
}

// Konfigurasi valid: lanjutkan membangun aplikasi Express.
const app = express();

// CORS dengan origin tunggal dari FRONTEND_ORIGIN (R7.3). Permintaan dari origin
// lain tidak akan mendapat header CORS yang mengizinkan sehingga ditolak oleh
// browser.
app.use(cors({ origin: config.FRONTEND_ORIGIN }));

// Body parser JSON agar req.body.message terisi untuk route chat.
app.use(express.json());

// Router sudah mendefinisikan path lengkap (/api/chat dan /api/health), jadi
// dipasang pada root tanpa prefix tambahan.
const chatRouter = require('./routes/chat');
app.use(chatRouter);

// Jalankan server pada PORT (R8.2).
app.listen(config.PORT, () => {
  console.log('Backend berjalan dan mendengarkan pada port ' + config.PORT);
});
