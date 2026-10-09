'use strict';

// =============================================================================
// Property test — Property 2 (student-learning-assistant)
//
// Menguji fungsi murni `validateMessage` yang diekspor dari routes/chat.js.
// Bagian "Bedrock tidak dipanggil saat tidak valid" diuji pada level integrasi
// di chat.integration.test.js; properti inti di sini adalah kebenaran predikat
// validasi untuk semua string.
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

const { validateMessage } = require('../routes/chat');

// Feature: student-learning-assistant, Property 2: Validasi batas pesan di Backend tanpa memanggil Bedrock saat tidak valid — Untuk semua string s, validasi server mengembalikan ok == true jika dan hanya jika 1 <= len(s) <= 4000 (dan bukan whitespace-only); ketika ok == false, Bedrock_Service tidak pernah dipanggil dan respons kesalahan INVALID_INPUT dikembalikan.
test('Property 2: validateMessage ok iff string dengan panjang 1..4000 dan bukan whitespace-only', () => {
  fc.assert(
    fc.property(
      // Sertakan string panjang (hingga 5000) agar cabang > 4000 ikut diuji.
      fc.string({ maxLength: 5000 }),
      (s) => {
        const expected =
          typeof s === 'string' &&
          s.length >= 1 &&
          s.length <= 4000 &&
          s.trim() !== '';
        const result = validateMessage(s);
        assert.strictEqual(result.ok, expected);
        // Saat valid, nilai yang diteruskan adalah string mentah apa adanya.
        if (result.ok) {
          assert.strictEqual(result.value, s);
        }
      },
    ),
    { numRuns: 100 },
  );
});

// Pemeriksaan tambahan: tipe non-string selalu tidak valid (defensif, bukan
// bagian dari properti utama namun melengkapi kontrak validateMessage).
test('validateMessage menolak nilai non-string', () => {
  for (const bad of [undefined, null, 123, {}, [], true]) {
    assert.strictEqual(validateMessage(bad).ok, false);
  }
});
