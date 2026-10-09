'use strict';

// =============================================================================
// Property test — Property 14 (student-learning-assistant)
//
// Menguji fungsi murni `isAllowedOrigin(origin, allowedOrigin)` dari config.js
// yang mencerminkan kebijakan `cors({ origin: FRONTEND_ORIGIN })` di index.js:
// origin diizinkan jika dan hanya jika sama persis dengan FRONTEND_ORIGIN.
// =============================================================================

const test = require('node:test');
const assert = require('node:assert');
const fc = require('fast-check');

const { isAllowedOrigin } = require('../config');

// Feature: student-learning-assistant, Property 14: Kebijakan CORS berbasis origin — Untuk semua nilai origin o, kebijakan CORS mengizinkan permintaan jika dan hanya jika o sama persis dengan FRONTEND_ORIGIN yang dikonfigurasi; origin lain ditolak.
test('Property 14: isAllowedOrigin mengizinkan iff origin sama persis dengan FRONTEND_ORIGIN', () => {
  fc.assert(
    fc.property(
      // origin arbitrer (termuat juga kemungkinan sama dengan allowed).
      fc.string(),
      // FRONTEND_ORIGIN yang dikonfigurasi.
      fc.string(),
      (o, allowed) => {
        assert.strictEqual(isAllowedOrigin(o, allowed), o === allowed);
      },
    ),
    { numRuns: 100 },
  );
});

// Pastikan kasus "cocok persis" selalu diizinkan untuk origin bentuk URL nyata.
test('isAllowedOrigin mengizinkan origin yang identik dengan konfigurasi', () => {
  fc.assert(
    fc.property(fc.webUrl(), (url) => {
      assert.strictEqual(isAllowedOrigin(url, url), true);
    }),
    { numRuns: 100 },
  );
});
