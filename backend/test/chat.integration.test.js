'use strict';

// =============================================================================
// Integration test (dengan mock Bedrock) — student-learning-assistant
//
// Membuktikan pemetaan route POST /api/chat end-to-end di atas HTTP nyata tanpa
// menyentuh AWS. Memverifikasi:
//   - pesan valid (1..4000)                 → 200 { reply } passthrough   (R3.3, R7.1)
//   - pesan tidak valid (kosong/spasi/>4000) → 400 INVALID_INPUT, dan mock
//                                              generateReply TIDAK dipanggil   (R7.2)
//   - mock melempar BedrockServiceError 'timeout' → 504 UPSTREAM_TIMEOUT      (R4.1)
//   - mock melempar BedrockServiceError 'upstream' → 502 UPSTREAM_ERROR       (R4.1)
//   - mock melempar error generik                 → 500 INTERNAL_ERROR        (R4.1)
//
// STRATEGI MOCK:
//   routes/chat.js men-destructure { generateReply, BedrockServiceError } dari
//   services/bedrock pada waktu require. Agar handler memakai stub kita:
//     1) require services/bedrock, simpan generateReply asli, ganti dengan stub
//        yang dapat dikontrol per-test lewat variabel `stub`,
//     2) hapus routes/chat.js dari require.cache lalu require ulang sehingga ia
//        menangkap stub (dan BedrockServiceError asli yang sama → instanceof
//        tetap cocok di dalam handler),
//     3) bangun express app minimal (TANPA require index.js, agar tidak memicu
//        validateConfig/process.exit) dan listen pada port efemeral (0).
//   Server ditutup dan modul dipulihkan setelah test selesai.
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');
const express = require('express');

const bedrockPath = require.resolve('../services/bedrock');
const chatPath = require.resolve('../routes/chat');

const bedrock = require('../services/bedrock');
const { BedrockServiceError } = bedrock;
const originalGenerateReply = bedrock.generateReply;

// Stub yang dapat diganti per-test. Default: echo sederhana.
let stub = async (msg) => 'reply untuk: ' + msg;
let callCount = 0;

bedrock.generateReply = async (msg) => {
  callCount += 1;
  return stub(msg);
};

// Require ulang router agar menangkap stub di atas.
delete require.cache[chatPath];
const router = require('../routes/chat');

// Bangun app minimal tanpa menjalankan index.js.
const app = express();
app.use(express.json());
app.use(router);

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = 'http://127.0.0.1:' + port;
      resolve();
    });
  });
});

test.after(async () => {
  bedrock.generateReply = originalGenerateReply;
  delete require.cache[chatPath];
  delete require.cache[bedrockPath];
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

/**
 * Helper POST /api/chat memakai fetch bawaan Node.
 * @param {unknown} message
 */
async function postChat(message) {
  const resp = await fetch(baseUrl + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  const body = await resp.json();
  return { status: resp.status, body };
}

test('pesan valid → 200 { reply } passthrough (R3.3, R7.1)', async () => {
  stub = async (msg) => 'JAWABAN:' + msg;
  callCount = 0;
  const { status, body } = await postChat('Halo, bantu saya belajar.');
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(body, { reply: 'JAWABAN:Halo, bantu saya belajar.' });
  assert.strictEqual(callCount, 1, 'generateReply harus dipanggil tepat sekali');
});

test('pesan kosong → 400 INVALID_INPUT tanpa memanggil Bedrock (R7.2)', async () => {
  callCount = 0;
  const { status, body } = await postChat('');
  assert.strictEqual(status, 400);
  assert.strictEqual(body.error.code, 'INVALID_INPUT');
  assert.strictEqual(callCount, 0, 'generateReply TIDAK boleh dipanggil');
});

test('pesan whitespace-only → 400 INVALID_INPUT tanpa memanggil Bedrock (R7.2)', async () => {
  callCount = 0;
  const { status, body } = await postChat('    \t\n ');
  assert.strictEqual(status, 400);
  assert.strictEqual(body.error.code, 'INVALID_INPUT');
  assert.strictEqual(callCount, 0, 'generateReply TIDAK boleh dipanggil');
});

test('pesan > 4000 karakter → 400 INVALID_INPUT tanpa memanggil Bedrock (R7.2)', async () => {
  callCount = 0;
  const tooLong = 'a'.repeat(4001);
  const { status, body } = await postChat(tooLong);
  assert.strictEqual(status, 400);
  assert.strictEqual(body.error.code, 'INVALID_INPUT');
  assert.strictEqual(callCount, 0, 'generateReply TIDAK boleh dipanggil');
});

test('Bedrock timeout → 504 UPSTREAM_TIMEOUT (R4.1)', async () => {
  stub = async () => {
    throw new BedrockServiceError('timeout', 'batas waktu terlampaui');
  };
  const { status, body } = await postChat('pesan valid');
  assert.strictEqual(status, 504);
  assert.strictEqual(body.error.code, 'UPSTREAM_TIMEOUT');
});

test('Bedrock upstream → 502 UPSTREAM_ERROR (R4.1)', async () => {
  stub = async () => {
    throw new BedrockServiceError('upstream', 'gagal upstream');
  };
  const { status, body } = await postChat('pesan valid');
  assert.strictEqual(status, 502);
  assert.strictEqual(body.error.code, 'UPSTREAM_ERROR');
});

test('error generik → 500 INTERNAL_ERROR (R4.1)', async () => {
  stub = async () => {
    throw new Error('kegagalan tak terduga');
  };
  const { status, body } = await postChat('pesan valid');
  assert.strictEqual(status, 500);
  assert.strictEqual(body.error.code, 'INTERNAL_ERROR');
});
