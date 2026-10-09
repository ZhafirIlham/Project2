'use strict';

// =============================================================================
// Property test — Property 15 (student-learning-assistant)
//
// Menguji fungsi murni `validateConfig(env)` dan daftar `REQUIRED_ENV_VARS`
// dari config.js. validateConfig mengembalikan tepat daftar nama variabel wajib
// yang hilang, dengan urutan sesuai REQUIRED_ENV_VARS.
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

const { validateConfig, REQUIRED_ENV_VARS } = require('../config');

// Feature: student-learning-assistant, Property 15: Validasi konfigurasi startup — Untuk semua subset variabel lingkungan wajib yang dihilangkan dari konfigurasi, validateConfig(env) mengembalikan tepat daftar nama variabel yang hilang tersebut; jika daftar tidak kosong, inisialisasi dibatalkan sehingga Backend tidak menerima permintaan.
test('Property 15: validateConfig mengembalikan tepat variabel wajib yang hilang (urutan REQUIRED_ENV_VARS)', () => {
  fc.assert(
    fc.property(
      // Untuk tiap variabel wajib, pilih apakah ia HADIR (true) atau DIHILANGKAN
      // (false). Panjang array = jumlah variabel wajib.
      fc.array(fc.boolean(), {
        minLength: REQUIRED_ENV_VARS.length,
        maxLength: REQUIRED_ENV_VARS.length,
      }),
      // Nilai non-kosong yang akan dipakai untuk variabel yang hadir.
      fc.string({ minLength: 1 }).filter((v) => v.trim() !== ''),
      (presentFlags, presentValue) => {
        const env = {};
        const expectedMissing = [];
        REQUIRED_ENV_VARS.forEach((name, i) => {
          if (presentFlags[i]) {
            env[name] = presentValue;
          } else {
            // Dihilangkan: tidak diset sama sekali.
            expectedMissing.push(name);
          }
        });

        const missing = validateConfig(env);
        // Harus tepat daftar yang hilang, dengan urutan sesuai REQUIRED_ENV_VARS.
        assert.deepStrictEqual(missing, expectedMissing);
      },
    ),
    { numRuns: 100 },
  );
});

// Nilai whitespace-only dihitung sebagai hilang (kontrak validateConfig).
test('validateConfig memperlakukan nilai whitespace-only sebagai hilang', () => {
  fc.assert(
    fc.property(
      fc.array(fc.boolean(), {
        minLength: REQUIRED_ENV_VARS.length,
        maxLength: REQUIRED_ENV_VARS.length,
      }),
      (whitespaceFlags) => {
        const env = {};
        const expectedMissing = [];
        REQUIRED_ENV_VARS.forEach((name, i) => {
          if (whitespaceFlags[i]) {
            // Set ke string berisi spasi/tab/newline saja → dianggap hilang.
            env[name] = '   \t\n ';
            expectedMissing.push(name);
          } else {
            env[name] = 'nilai-valid';
          }
        });
        assert.deepStrictEqual(validateConfig(env), expectedMissing);
      },
    ),
    { numRuns: 100 },
  );
});
