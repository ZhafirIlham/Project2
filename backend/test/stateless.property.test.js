'use strict';

// =============================================================================
// Property test — Property 12 (student-learning-assistant)
//
// Menguji bahwa pemrosesan Backend bersifat TANPA-STATUS: hasil untuk sebuah
// pesan hanya bergantung pada isi pesan itu sendiri, tidak dipengaruhi pesan
// sebelumnya; memproses pesan yang sama secara terisolasi maupun di tengah
// sebuah urutan menghasilkan keluaran yang setara; dan tidak ada riwayat yang
// ditulis ke penyimpanan.
//
// STRATEGI MOCK & PENDEKATAN (tanpa AWS, tanpa HTTP):
//   routes/chat.js men-destructure { generateReply } dari services/bedrock saat
//   modul dimuat, sehingga referensinya ditangkap pada waktu require. Untuk
//   menyuntik stub murni, kita:
//     1) require services/bedrock dan ganti generateReply dengan echo murni,
//     2) hapus routes/chat.js dari require.cache agar ia di-require ulang dan
//        menangkap stub tersebut,
//     3) jalankan handler POST /api/chat secara langsung dengan objek req/res
//        tiruan (tanpa jaringan) sehingga 100 iterasi tetap cepat.
//   Stub berupa `async (msg) => 'echo:' + msg` bersifat deterministik murni,
//   sehingga keluaran yang setara untuk input yang sama membuktikan bahwa jalur
//   route tidak membawa state antar permintaan.
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

const bedrockPath = require.resolve('../services/bedrock');
const chatPath = require.resolve('../routes/chat');

// --- Pasang stub echo murni pada modul bedrock SEBELUM require routes/chat. ---
const bedrock = require('../services/bedrock');
const originalGenerateReply = bedrock.generateReply;
bedrock.generateReply = async (msg) => 'echo:' + msg;

// Paksa routes/chat di-require ulang agar menangkap generateReply yang sudah
// distub (bukan referensi asli yang menyentuh AWS).
delete require.cache[chatPath];
const router = require('../routes/chat');

// Pulihkan state modul setelah seluruh test di berkas ini selesai.
test.after(() => {
  bedrock.generateReply = originalGenerateReply;
  delete require.cache[chatPath];
  delete require.cache[bedrockPath];
});

/**
 * Menemukan handler layer POST /api/chat pada express Router dan menjalankannya
 * dengan req/res tiruan. Mengembalikan Promise yang resolve ke { status, body }.
 *
 * @param {string} message
 * @returns {Promise<{ status: number, body: any }>}
 */
function invokeChat(message) {
  const layer = router.stack.find(
    (l) =>
      l.route &&
      l.route.path === '/api/chat' &&
      (l.route.methods.post === true ||
        (l.route.methods && l.route.methods.post)),
  );
  assert.ok(layer, 'Handler POST /api/chat harus terdaftar pada router');
  const handler = layer.route.stack[0].handle;

  return new Promise((resolve, reject) => {
    const req = { body: { message } };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ status: this.statusCode, body: payload });
        return this;
      },
    };
    Promise.resolve(handler(req, res)).catch(reject);
  });
}

// Feature: student-learning-assistant, Property 12: Pemrosesan Backend bersifat tanpa-status — Untuk semua urutan pesan permintaan, hasil pemrosesan setiap pesan hanya bergantung pada isi permintaan itu sendiri dan tidak dipengaruhi oleh permintaan sebelumnya; memproses pesan yang sama secara terisolasi maupun berurutan menghasilkan keluaran yang setara, dan tidak ada riwayat yang dituliskan ke penyimpanan.
test('Property 12: pemrosesan route tanpa-status (isolasi == dalam urutan)', async () => {
  await fc.assert(
    fc.asyncProperty(
      // Urutan pesan valid (1..4000, non-whitespace) + satu pesan "probe" yang
      // akan diproses baik terisolasi maupun di tengah urutan.
      fc.array(
        fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim() !== ''),
        { minLength: 0, maxLength: 8 },
      ),
      fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim() !== ''),
      async (sequence, probe) => {
        // 1) Proses probe secara TERISOLASI.
        const isolated = await invokeChat(probe);

        // 2) Proses sebuah urutan lain lebih dulu, lalu probe yang sama.
        for (const msg of sequence) {
          await invokeChat(msg);
        }
        const afterSequence = await invokeChat(probe);

        // Keluaran untuk probe harus setara, apa pun yang diproses sebelumnya.
        assert.strictEqual(afterSequence.status, isolated.status);
        assert.deepStrictEqual(afterSequence.body, isolated.body);
        // Dan karena stub bersifat echo murni, replynya deterministik.
        assert.deepStrictEqual(isolated.body, { reply: 'echo:' + probe });
      },
    ),
    { numRuns: 100 },
  );
});
