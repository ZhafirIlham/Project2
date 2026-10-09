// View Laporan Progress untuk Student Learning Assistant (Task 13.3).
//
// Menampilkan tabel data contoh laporan progress belajar memakai komponen
// generik `SampleDataTable<ProgressReport>` beserta penanda `SampleBadge`.
//
// Perilaku terkait requirement:
// - R6.2: menampilkan daftar laporan progress dari data contoh in-memory.
// - R6.5: menandai konten sebagai data contoh lewat `SampleBadge`.
// - R6.7: empty-state ditangani oleh `SampleDataTable` ketika data kosong.

import { progressReports } from '../data/progressReports';
import type { ProgressReport } from '../types';
import SampleBadge from '../components/SampleBadge';
import SampleDataTable from '../components/SampleDataTable';
import type { SampleColumn } from '../components/SampleDataTable';

const columns: SampleColumn<ProgressReport>[] = [
  {
    key: 'subject',
    header: 'Mata Pelajaran',
    render: (row) => <span className="font-medium text-[var(--text-h)]">{row.subject}</span>,
  },
  {
    key: 'topic',
    header: 'Topik',
    render: (row) => row.topic,
  },
  {
    key: 'progress',
    header: 'Progress',
    render: (row) => {
      const value = Math.max(0, Math.min(100, row.progressPercent));
      return (
        <div className="flex min-w-40 items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
            <div
              className="h-full rounded-full bg-[var(--accent)]"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right tabular-nums text-[var(--text)]">
            {value}%
          </span>
        </div>
      );
    },
  },
  {
    key: 'updatedAt',
    header: 'Diperbarui',
    render: (row) => <span className="tabular-nums">{row.updatedAt}</span>,
  },
];

function LaporanProgressView() {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-[var(--text-h)]">Laporan Progress</h2>
          <SampleBadge />
        </div>
        <p className="text-sm text-[var(--text)]">
          Ringkasan kemajuan belajar per mata pelajaran dan topik.
        </p>
      </header>

      <SampleDataTable<ProgressReport>
        columns={columns}
        rows={progressReports}
        getRowKey={(r) => r.id}
        emptyMessage="Belum ada laporan progress yang tersedia."
      />
    </section>
  );
}

export default LaporanProgressView;
