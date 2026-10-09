import { defineConfig } from 'vitest/config'

// Konfigurasi Vitest minimal untuk property test logika murni (Task 16).
// Tes bersifat pure-logic (tanpa DOM/React rendering), sehingga environment
// 'node' sudah cukup — tidak perlu jsdom atau @testing-library.
// Tes diletakkan di direktori top-level `tests/` (sibling dari `src/`) agar
// tidak ikut dikompilasi oleh tsconfig.app.json (`include: ["src"]`) saat
// `npm run build` (`tsc -b && vite build`).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
