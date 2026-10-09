'use strict';

// =============================================================================
// Bedrock Service (R3.2, R3.3, R4.1, R8.2)
//
// Modul ini mengisolasi seluruh integrasi AWS Bedrock di satu tempat, terpisah
// dari layer route dan konfigurasi (lihat design.md — "Backend — Modul Internal").
//
// Kontrak kesalahan (dibaca oleh routes/chat.js pada Task 3):
//   Fungsi `generateReply` akan MELEMPAR error bertipe (lihat BedrockServiceError)
//   dengan properti `kind` yang membedakan penyebab kegagalan:
//     - kind === 'timeout'  -> pemanggilan Bedrock melewati batas 30 detik
//                              (route memetakan ke UPSTREAM_TIMEOUT / 504, R4.1)
//     - kind === 'upstream' -> kegagalan SDK/model atau respons tak terurai
//                              (route memetakan ke UPSTREAM_ERROR / 502, R4.1)
//   Pada keberhasilan, fungsi mengembalikan string `reply` (teks jawaban model).
//
// Pendekatan "typed error" dipilih (ketimbang discriminated result) agar jalur
// sukses hanya mengembalikan string `reply` dan pemanggil cukup `try/catch` lalu
// bercabang berdasarkan `error.kind`.
// =============================================================================

const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const config = require('../config');

// Batas waktu pemanggilan Bedrock: 30 detik (R3.2 / R4.1).
const BEDROCK_TIMEOUT_MS = 30000;

// Batas token keluaran model. Nilai konservatif yang memadai untuk jawaban chat.
const MAX_TOKENS = 1024;

/**
 * Kesalahan layanan Bedrock yang dapat dibedakan oleh pemanggil.
 *
 * @property {'timeout' | 'upstream'} kind - kategori kegagalan.
 * @property {unknown} [cause] - penyebab asli (error SDK), untuk logging.
 */
class BedrockServiceError extends Error {
  /**
   * @param {'timeout' | 'upstream'} kind
   * @param {string} message
   * @param {unknown} [cause]
   */
  constructor(kind, message, cause) {
    super(message);
    this.name = 'BedrockServiceError';
    this.kind = kind;
    this.cause = cause;
  }
}

// Klien Bedrock dibuat sekali per proses dan diisolasi di modul ini.
// Region diambil dari config; KREDENSIAL TIDAK di-hardcode — dibiarkan mengikuti
// default credential provider chain AWS SDK (env, shared config, IAM role).
// Pembuatan klien ini tidak melakukan panggilan jaringan apa pun saat modul
// dimuat (require), sehingga aman di-`require` tanpa efek samping jaringan.
let client = null;

/**
 * Mengembalikan instance BedrockRuntimeClient (lazy singleton).
 * Dibuat saat pertama kali dibutuhkan agar `require('./services/bedrock')`
 * tidak memicu inisialisasi klien lebih awal dari yang diperlukan.
 *
 * @returns {BedrockRuntimeClient}
 */
function getClient() {
  if (client === null) {
    client = new BedrockRuntimeClient({ region: config.AWS_REGION });
  }
  return client;
}

/**
 * Menyusun body payload permintaan untuk model Bedrock.
 *
 * CATATAN MODEL: Payload ini mengasumsikan model yang kompatibel dengan
 * Anthropic Claude Messages API (format umum untuk model teks di Bedrock):
 *   {
 *     anthropic_version: "bedrock-2023-05-31",
 *     max_tokens: <n>,
 *     messages: [{ role: "user", content: <pesan siswa> }]
 *   }
 * Jika BEDROCK_MODEL_ID merujuk ke keluarga model lain (mis. Titan, Llama),
 * bentuk payload dan parsing respons di bawah perlu disesuaikan dengan skema
 * model tersebut.
 *
 * @param {string} message - pesan Siswa.
 * @returns {string} JSON string body permintaan.
 */
function buildPayload(message) {
  return JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: message }],
  });
}

/**
 * Mengurai respons InvokeModelCommand menjadi teks jawaban (`reply`).
 *
 * Respons Bedrock membawa body sebagai Uint8Array; body di-decode ke teks,
 * di-JSON.parse, lalu teks asisten diekstrak. Untuk Claude Messages, teks ada
 * di `responseJson.content[0].text`. Parsing dilakukan secara defensif: respons
 * yang tidak dapat diurai atau kosong diperlakukan sebagai kegagalan upstream.
 *
 * @param {{ body?: Uint8Array }} response - keluaran dari client.send.
 * @returns {string} teks jawaban model (reply) yang sudah terjamin non-kosong.
 * @throws {BedrockServiceError} kind 'upstream' bila respons tak terurai/kosong.
 */
function parseReply(response) {
  let text;
  try {
    // body dapat berupa Uint8Array; dekode ke string UTF-8.
    const raw = response && response.body;
    if (!raw) {
      throw new Error('Respons Bedrock tidak memiliki body.');
    }
    text = Buffer.from(raw).toString('utf-8');
  } catch (err) {
    throw new BedrockServiceError(
      'upstream',
      'Gagal membaca body respons dari Bedrock.',
      err,
    );
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    throw new BedrockServiceError(
      'upstream',
      'Respons Bedrock bukan JSON yang valid.',
      err,
    );
  }

  // Ekstraksi defensif teks asisten dari skema Claude Messages.
  const reply =
    json &&
    Array.isArray(json.content) &&
    json.content[0] &&
    typeof json.content[0].text === 'string'
      ? json.content[0].text
      : null;

  if (reply === null || reply.trim() === '') {
    throw new BedrockServiceError(
      'upstream',
      'Respons Bedrock tidak berisi teks jawaban yang dapat ditampilkan.',
    );
  }

  return reply;
}

/**
 * Memanggil Bedrock untuk menghasilkan jawaban atas pesan Siswa.
 *
 * Menerapkan timeout 30 detik menggunakan AbortController yang diteruskan ke
 * `client.send(command, { abortSignal })`; sebuah `setTimeout(30000)` memicu
 * abort bila model belum merespons. Kondisi abort/timeout dipetakan ke error
 * `kind: 'timeout'`; kegagalan SDK/model lain dipetakan ke `kind: 'upstream'`.
 *
 * @param {string} message - pesan Siswa (sudah divalidasi oleh layer route).
 * @returns {Promise<string>} teks jawaban model (reply).
 * @throws {BedrockServiceError} dengan `kind` 'timeout' atau 'upstream'.
 */
async function generateReply(message) {
  const command = new InvokeModelCommand({
    modelId: config.BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: buildPayload(message),
  });

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, BEDROCK_TIMEOUT_MS);

  let response;
  try {
    response = await getClient().send(command, {
      abortSignal: controller.signal,
    });
  } catch (err) {
    // Jika timer kita yang memicu abort, ini adalah kondisi timeout (R3.2/R4.1).
    if (timedOut || isAbortError(err)) {
      throw new BedrockServiceError(
        'timeout',
        'Permintaan ke layanan AI melewati batas waktu 30 detik.',
        err,
      );
    }
    // Kegagalan SDK/model lain -> upstream error (R4.1).
    throw new BedrockServiceError(
      'upstream',
      'Layanan AI mengembalikan kegagalan saat memproses permintaan.',
      err,
    );
  } finally {
    clearTimeout(timer);
  }

  // Parsing respons; dapat melempar BedrockServiceError kind 'upstream'.
  return parseReply(response);
}

/**
 * Mendeteksi apakah sebuah error merupakan pembatalan (abort).
 * SDK AWS/Node umumnya menandai abort dengan `name === 'AbortError'`.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
function isAbortError(err) {
  return (
    !!err &&
    typeof err === 'object' &&
    'name' in err &&
    err.name === 'AbortError'
  );
}

module.exports = {
  generateReply,
  BedrockServiceError,
  BEDROCK_TIMEOUT_MS,
};
