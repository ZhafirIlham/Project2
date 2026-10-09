'use strict';

// =============================================================================
// Route chat & health Backend (R7.1, R7.2, R3.2, R4.1)
//
// Modul ini mendefinisikan Express Router untuk dua endpoint (lihat design.md —
// "Backend — Endpoint & Antarmuka HTTP" dan "Backend — Modul Internal"):
//
//   POST /api/chat   -> validasi pesan 1..4000, panggil Bedrock Service, lalu
//                       petakan hasil/kesalahan ke respons terstruktur.
//   GET  /api/health -> 200 { status: "ok" } (health check sederhana).
//
// Tabel kode kesalahan terstruktur (error.code) yang dikembalikan handler ini:
//   INVALID_INPUT    400  Pesan bukan string / kosong / > 4000 karakter (R7.2)
//   UPSTREAM_TIMEOUT 504  Bedrock melewati batas waktu 30 detik (R4.1)
//   UPSTREAM_ERROR   502  Bedrock mengembalikan kegagalan (R4.1)
//   INTERNAL_ERROR   500  Kesalahan tak terduga lain
//
// Catatan tentang CONFIG_ERROR (503): kondisi konfigurasi tidak lengkap dicegah
// saat startup di index.js (R7.5), bukan di jalur permintaan normal. Oleh karena
// itu handler ini sengaja TIDAK memicu CONFIG_ERROR agar tidak over-engineering.
// =============================================================================

const express = require('express');

const { generateReply, BedrockServiceError } = require('../services/bedrock');

const router = express.Router();

// Batas panjang pesan yang divalidasi di sisi Backend (R7.1/R7.2).
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 4000;

/**
 * Fungsi murni validasi pesan permintaan (R7.1/R7.2).
 *
 * Aturan: `message` harus berupa string; setelah pemeriksaan keberadaan/tipe,
 * panjang string mentah harus berada pada rentang 1..4000 karakter. String
 * kosong atau yang hanya berisi spasi (whitespace-only) dianggap TIDAK valid.
 *
 * Fungsi ini tidak memiliki efek samping (tidak memanggil service, tidak
 * membaca I/O) sehingga mudah diuji secara terpisah.
 *
 * @param {unknown} message - nilai `message` mentah dari body permintaan.
 * @returns {{ ok: true, value: string } | { ok: false }} hasil validasi;
 *   saat `ok === true`, `value` adalah string pesan yang valid.
 */
function validateMessage(message) {
  if (typeof message !== 'string') {
    return { ok: false };
  }

  // Panjang string mentah harus 1..4000.
  if (
    message.length < MESSAGE_MIN_LENGTH ||
    message.length > MESSAGE_MAX_LENGTH
  ) {
    return { ok: false };
  }

  // Tolak pesan yang hanya berisi spasi (tidak ada konten bermakna).
  if (message.trim() === '') {
    return { ok: false };
  }

  return { ok: true, value: message };
}

/**
 * POST /api/chat
 *
 * Alur: baca `req.body.message` -> validasi (murni) -> jika tidak valid balas
 * 400 INVALID_INPUT TANPA memanggil Bedrock -> jika valid panggil
 * `generateReply(message)` -> 200 { reply } saat sukses; petakan kegagalan ke
 * respons error terstruktur berdasarkan `BedrockServiceError.kind`.
 */
router.post('/api/chat', async (req, res) => {
  const body = req.body || {};
  const validation = validateMessage(body.message);

  if (!validation.ok) {
    // Validasi gagal: balas 400 tanpa pernah memanggil Bedrock Service (R7.2).
    return res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message:
          'Pesan tidak valid. Pesan harus berupa teks tidak kosong dan maksimal 4000 karakter.',
      },
    });
  }

  try {
    const reply = await generateReply(validation.value);
    return res.status(200).json({ reply });
  } catch (err) {
    if (err instanceof BedrockServiceError) {
      if (err.kind === 'timeout') {
        return res.status(504).json({
          error: {
            code: 'UPSTREAM_TIMEOUT',
            message:
              'Layanan AI tidak merespons dalam batas waktu. Silakan coba lagi beberapa saat lagi.',
          },
        });
      }

      if (err.kind === 'upstream') {
        return res.status(502).json({
          error: {
            code: 'UPSTREAM_ERROR',
            message:
              'Layanan AI sedang mengalami gangguan saat memproses permintaan. Silakan coba lagi.',
          },
        });
      }
    }

    // Kesalahan tak terduga lain -> 500 INTERNAL_ERROR.
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message:
          'Terjadi kesalahan tak terduga di server. Silakan coba lagi nanti.',
      },
    });
  }
});

/**
 * GET /api/health
 *
 * Health check sederhana untuk memastikan server hidup dan dapat merespons.
 */
router.get('/api/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

// Router adalah ekspor utama agar index.js (Task 4) dapat memasangnya.
// `validateMessage` dilampirkan sebagai properti agar dapat diuji terpisah
// tanpa mengubah ekspor utama berupa router.
module.exports = router;
module.exports.validateMessage = validateMessage;
