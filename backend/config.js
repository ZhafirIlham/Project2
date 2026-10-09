'use strict';

// Memuat variabel lingkungan dari berkas .env ke process.env (R7.4).
// Pemanggilan ini aman dijalankan sekali saat modul dimuat; jika .env tidak
// ada, dotenv tidak menimpa variabel lingkungan yang sudah ada.
require('dotenv').config();

/**
 * Daftar nama variabel lingkungan wajib secara fungsional.
 *
 * Catatan:
 * - PORT tidak termasuk karena memiliki nilai default (3001).
 * - AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY tidak termasuk karena kredensial
 *   AWS mengikuti default credential provider chain AWS SDK (env, shared config,
 *   IAM role), sehingga tidak wajib diisi lewat .env.
 */
const REQUIRED_ENV_VARS = ['FRONTEND_ORIGIN', 'AWS_REGION', 'BEDROCK_MODEL_ID'];

/**
 * Fungsi murni validasi konfigurasi startup (R7.5).
 *
 * Diberi sebuah objek environment, kembalikan tepat daftar nama variabel wajib
 * yang hilang (tidak ada, kosong, atau hanya berisi spasi), dengan urutan sesuai
 * REQUIRED_ENV_VARS. Fungsi ini tidak membaca process.env sendiri dan tidak
 * menghentikan proses — ia hanya menghitung dan mengembalikan daftar yang hilang
 * agar mudah diuji.
 *
 * @param {Record<string, string | undefined>} env - objek environment.
 * @returns {string[]} daftar nama variabel wajib yang hilang.
 */
function validateConfig(env) {
    const source = env || {};
    return REQUIRED_ENV_VARS.filter((name) => {
        const value = source[name];
        return typeof value !== 'string' || value.trim() === '';
    });
}

/**
 * Fungsi murni kebijakan CORS berbasis origin (R7.3).
 *
 * Mengembalikan true jika dan hanya jika `origin` sama persis dengan
 * `allowedOrigin` yang dikonfigurasi (perbandingan kesetaraan string). Ini
 * mencerminkan perilaku `cors({ origin: FRONTEND_ORIGIN })` yang dipakai di
 * index.js, di mana middleware `cors` mengizinkan hanya origin yang cocok persis
 * dengan string tunggal yang diberikan. Difaktorkan sebagai predikat murni agar
 * mudah diuji tanpa menjalankan server.
 *
 * @param {string | undefined} origin - nilai header Origin permintaan.
 * @param {string | undefined} allowedOrigin - origin yang diizinkan (FRONTEND_ORIGIN).
 * @returns {boolean} true bila origin diizinkan.
 */
function isAllowedOrigin(origin, allowedOrigin) {
    return origin === allowedOrigin;
}

/**
 * Objek konfigurasi Backend yang dibaca dari process.env.
 * PORT memiliki nilai default 3001 bila tidak disetel.
 */
const config = {
    PORT: process.env.PORT || 3001,
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN,
    AWS_REGION: process.env.AWS_REGION,
    BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID,
};

module.exports = config;
module.exports.config = config;
module.exports.validateConfig = validateConfig;
module.exports.REQUIRED_ENV_VARS = REQUIRED_ENV_VARS;
module.exports.isAllowedOrigin = isAllowedOrigin;