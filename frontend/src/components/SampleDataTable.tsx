// Komponen SampleDataTable generik untuk Student Learning Assistant (Task 13.1).
//
// Tabel reusable yang menerima tipe baris lewat parameter generik <T> sehingga
// setiap halaman (Laporan Progress, Jadwal, Pengingat) bisa menyediakan tipe
// barisnya sendiri dengan kolom & renderer yang ter-type-check.
//
// Perilaku terkait requirement:
// - R6.7: ketika data contoh kosong, menampilkan pesan bahwa belum ada data
//   yang tersedia (empty-state) alih-alih tabel kosong.
// - R2.5: tabel lebar dibungkus kontainer `overflow-x-auto` sehingga scroll
//   horizontal terjadi di dalam kontainer, bukan di level halaman.

import type { ReactNode } from 'react';

export interface SampleColumn<T> {
  key: string; // kunci kolom unik
  header: string; // label header kolom (Bahasa Indonesia)
  render: (row: T) => ReactNode; // renderer sel untuk baris
}

export interface SampleDataTableProps<T> {
  columns: SampleColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string; // kunci unik & stabil per baris
  emptyMessage?: string; // override teks empty-state
}

function SampleDataTable<T>(props: SampleDataTableProps<T>) {
  const { columns, rows, getRowKey, emptyMessage } = props;

  // Empty-state (R6.7): jangan render tabel kosong — tampilkan pesan di dalam
  // kotak bergaris & redup agar jelas belum ada data.
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] px-4 py-8 text-center text-sm text-[var(--text)]">
        {emptyMessage ?? 'Belum ada data yang tersedia.'}
      </div>
    );
  }

  // Tabel dibungkus kontainer `overflow-x-auto` (R2.5): tabel lebar menggulir
  // di dalam kontainer, tidak membuat scroll horizontal pada level halaman.
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 font-semibold text-[var(--text-h)]"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b border-[var(--border)] last:border-b-0"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[var(--text)]">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SampleDataTable;
