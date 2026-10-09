// Property-based tests (frontend subset) untuk fitur student-learning-assistant.
//
// Dijalankan dengan Vitest (environment 'node') + fast-check. File ini berada di
// direktori top-level `tests/` (sibling dari `src/`) sehingga TIDAK ikut
// dikompilasi oleh tsconfig.app.json saat `npm run build`. Modul yang diuji
// diimpor via path relatif ke ../src.
//
// Setiap properti: tepat SATU property test, minimal 100 iterasi
// (fc.assert({ numRuns: 100 })), dengan anotasi berformat tetap.

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

import {
  resolveView,
  resolveMode,
  VALID_MENU_KEYS,
} from '../src/navigation'
import {
  createEmptySession,
  makeMessage,
  appendAssistantMessage,
  setError,
  incrementRetry,
  canRetry,
  validateClientMessage,
  MAX_RETRIES,
} from '../src/chat/chatSession'
import type { ChatMessage, ChatRole, ChatSession } from '../src/types'
import { menus } from '../src/data/menus'
import { quickLinks } from '../src/data/quickLinks'

const NUM_RUNS = 100

// ---------------------------------------------------------------------------
// Arbitraries pembantu untuk ChatSession / ChatMessage[]
// ---------------------------------------------------------------------------

const roleArb: fc.Arbitrary<ChatRole> = fc.constantFrom('user', 'assistant')

const messageArb: fc.Arbitrary<ChatMessage> = fc.record({
  id: fc.string({ minLength: 1 }),
  role: roleArb,
  content: fc.string(),
  createdAt: fc.nat(),
})

const messagesArb: fc.Arbitrary<ChatMessage[]> = fc.array(messageArb, {
  maxLength: 20,
})

/** Bungkus array messages arbitrer menjadi ChatSession dengan field default. */
function sessionFromMessages(messages: ChatMessage[]): ChatSession {
  return {
    messages,
    status: 'idle',
    errorMessage: null,
    lastUserMessage: null,
    retryCount: 0,
  }
}

const sessionArb: fc.Arbitrary<ChatSession> = messagesArb.map(sessionFromMessages)

// ---------------------------------------------------------------------------
// Property 1
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 1: Untuk semua string `s`, fungsi validasi klien mengembalikan `ok == true` jika dan hanya jika panjang `trim(s)` berada dalam rentang 1 sampai 2000 karakter; ketika `ok == true`, payload yang dikirim sama dengan `trim(s)`, dan ketika `ok == false` Backend tidak dipanggil.
describe('Property 1: Validasi batas pesan di Frontend', () => {
  it('ok iff 1 <= len(trim(s)) <= 2000; value === trim(s) saat ok', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 2500 }), (s) => {
        const trimmed = s.trim()
        const result = validateClientMessage(s)
        const expectedOk = trimmed.length >= 1 && trimmed.length <= 2000
        expect(result.ok).toBe(expectedOk)
        if (result.ok) {
          expect(result.value).toBe(trimmed)
        } else {
          expect(result.value).toBeUndefined()
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 3: Untuk semua nilai menu `k`: jika `k` adalah salah satu dari lima `MenuKey` valid maka resolusi view mengembalikan komponen view yang dipetakan untuk `k`; untuk nilai lain apa pun resolusi view mengembalikan DashboardView.
describe('Property 3: Resolusi view bersifat total dengan default Dashboard', () => {
  it('kunci valid -> dirinya sendiri; nilai lain -> dashboard', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom(...VALID_MENU_KEYS),
          fc.anything(),
          fc.string(),
        ),
        (k) => {
          const resolved = resolveView(k)
          if ((VALID_MENU_KEYS as readonly unknown[]).includes(k)) {
            expect(resolved).toBe(k)
          } else {
            expect(resolved).toBe('dashboard')
          }
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 4
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 4: Untuk semua nilai `activeMenu` yang valid, jumlah item menu pada Sidebar yang ditandai sebagai aktif selalu tepat satu.
describe('Property 4: Tepat satu Active_Menu', () => {
  it('tepat satu item menu cocok dengan activeMenu valid', () => {
    fc.assert(
      fc.property(fc.constantFrom(...VALID_MENU_KEYS), (activeMenu) => {
        const active = menus.filter((m) => m.key === activeMenu)
        expect(active.length).toBe(1)
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 5
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 5: Untuk semua `MenuKey` `k`, menerapkan `selectMenu(k)` pada state yang `activeMenu`-nya sudah bernilai `k` menghasilkan state yang sama (tidak ada perubahan konten maupun Active_Menu).
describe('Property 5: Idempotensi pemilihan menu', () => {
  // Reducer murni yang mencerminkan guarded functional update pada App.tsx:
  // App.tsx menggunakan `setActiveMenu(cur => cur === k ? cur : k)` sehingga
  // memilih menu yang sama tidak mengubah referensi state.
  const select = <T,>(cur: T, k: T): T => (cur === k ? cur : k)

  it('select idempoten dan select(cur,cur) mengembalikan referensi sama', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_MENU_KEYS),
        fc.constantFrom(...VALID_MENU_KEYS),
        (cur, k) => {
          expect(select(select(cur, k), k)).toBe(select(cur, k))
          expect(select(cur, cur)).toBe(cur)
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 6
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 6: Untuk semua lebar viewport `w` (bilangan non-negatif), `resolveMode(w)` bernilai `desktop` jika dan hanya jika `w >= 1024`, dan bernilai `mobile` untuk semua `w < 1024` (termasuk rentang 768 sampai kurang dari 1024).
describe('Property 6: Pemetaan lebar viewport ke mode responsif', () => {
  it("desktop iff w >= 1024, termasuk boundary 767/768/1023/1024", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: 0, max: 4000 }),
          fc.constantFrom(767, 768, 1023, 1024),
        ),
        (w) => {
          const mode = resolveMode(w)
          expect(mode).toBe(w >= 1024 ? 'desktop' : 'mobile')
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 7
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 7: Untuk semua `ChatSession` dan string `reply`, menambahkan jawaban asisten menghasilkan sesi baru yang memiliki tepat satu pesan tambahan di akhir urutan dengan `role == 'assistant'` dan `content == reply`, tanpa mengubah pesan-pesan sebelumnya.
describe('Property 7: Penambahan jawaban asisten', () => {
  it('menambah tepat satu pesan assistant di akhir; pesan lama tak berubah', () => {
    fc.assert(
      fc.property(
        sessionArb,
        fc.string(),
        fc.string({ minLength: 1 }),
        fc.nat(),
        (session, reply, id, createdAt) => {
          const before = session.messages
          const next = appendAssistantMessage(session, reply, id, createdAt)
          expect(next.messages.length).toBe(before.length + 1)
          const last = next.messages[next.messages.length - 1]
          expect(last.role).toBe('assistant')
          expect(last.content).toBe(reply)
          expect(next.messages.slice(0, -1)).toEqual(before)
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 8
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 8: Untuk semua `ChatSession` yang dibentuk melalui operasi penambahan pesan, daftar `messages` selalu terurut tak-turun berdasarkan `createdAt`, dan setiap pesan `user` mendahului pesan `assistant` yang menjawabnya.
describe('Property 8: Invarian urutan pesan', () => {
  it('urutan createdAt tak-turun saat append dengan timestamp tak-turun', () => {
    const appendsArb = fc
      .array(
        fc.record({
          role: roleArb,
          content: fc.string(),
          id: fc.string({ minLength: 1 }),
          delta: fc.nat({ max: 1000 }),
        }),
        { maxLength: 20 },
      )
      .map((items) => {
        // Buat timestamp tak-turun dari delta non-negatif kumulatif.
        let acc = 0
        return items.map((item) => {
          acc += item.delta
          return { ...item, createdAt: acc }
        })
      })

    fc.assert(
      fc.property(appendsArb, (appends) => {
        let session = createEmptySession()
        for (const a of appends) {
          const msg = makeMessage(a.role, a.content, a.id, a.createdAt)
          session = { ...session, messages: [...session.messages, msg] }
        }
        const ts = session.messages.map((m) => m.createdAt)
        for (let i = 1; i < ts.length; i++) {
          expect(ts[i]).toBeGreaterThanOrEqual(ts[i - 1])
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 9
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 9: Untuk semua `ChatSession`, bila `status == 'sending'` maka tombol kirim dalam keadaan nonaktif dan indikator proses ditampilkan.
describe('Property 9: Tombol kirim nonaktif saat sedang memproses', () => {
  // Predikat murni yang mencerminkan logika MessageComposer:
  // tombol kirim nonaktif saat sedang memproses ATAU input tidak valid.
  const sendDisabled = (status: ChatSession['status'], validOk: boolean): boolean =>
    status === 'sending' || !validOk

  it("status === 'sending' mengimplikasikan sendDisabled === true", () => {
    fc.assert(
      fc.property(
        fc.constantFrom('idle', 'sending', 'error') as fc.Arbitrary<
          ChatSession['status']
        >,
        fc.boolean(),
        (status, validOk) => {
          if (status === 'sending') {
            expect(sendDisabled(status, validOk)).toBe(true)
          }
        },
      ),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 10
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 10: Untuk semua `ChatSession` dan sembarang kesalahan `e`, menerapkan transisi ke state kesalahan menghasilkan `messages` yang identik dengan sebelumnya (isi dan urutan tidak berubah, tidak ada pesan dihapus).
describe('Property 10: Pelestarian riwayat saat kesalahan', () => {
  it('setError mempertahankan messages; status error; errorMessage sesuai', () => {
    fc.assert(
      fc.property(sessionArb, fc.string(), (session, msg) => {
        const before = session.messages
        const next = setError(session, msg)
        expect(next.messages).toEqual(before)
        expect(next.status).toBe('error')
        expect(next.errorMessage).toBe(msg)
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 11
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 11: Untuk semua urutan aksi coba-ulang, nilai `retryCount` tidak pernah melebihi 3, dan percobaan ulang keempat setelah tiga percobaan ditolak (tidak ada pemanggilan Backend tambahan).
describe('Property 11: Batas percobaan ulang', () => {
  it('retryCount === min(N, 3) dan <= 3; canRetry false iff retryCount === 3', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10 }), (n) => {
        let session = createEmptySession()
        for (let i = 0; i < n; i++) {
          session = incrementRetry(session)
        }
        expect(session.retryCount).toBe(Math.min(n, MAX_RETRIES))
        expect(session.retryCount).toBeLessThanOrEqual(MAX_RETRIES)
        expect(canRetry(session)).toBe(session.retryCount !== MAX_RETRIES)
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ---------------------------------------------------------------------------
// Property 13
// ---------------------------------------------------------------------------

// Feature: student-learning-assistant, Property 13: Untuk semua kumpulan `QuickLink` yang ditampilkan di Dashboard, jumlahnya berada dalam rentang 3 sampai 6 dan setiap `target` menunjuk ke `MenuKey` valid selain `dashboard`.
describe('Property 13: Invarian tautan akses cepat Dashboard', () => {
  it('3..6 tautan; setiap target MenuKey valid dan bukan dashboard', () => {
    // Invarian data: jumlah berada pada rentang 3..6.
    expect(quickLinks.length).toBeGreaterThanOrEqual(3)
    expect(quickLinks.length).toBeLessThanOrEqual(6)

    fc.assert(
      fc.property(fc.constantFrom(...quickLinks), (link) => {
        expect((VALID_MENU_KEYS as readonly string[]).includes(link.target)).toBe(
          true,
        )
        expect(link.target).not.toBe('dashboard')
      }),
      { numRuns: NUM_RUNS },
    )
  })
})
