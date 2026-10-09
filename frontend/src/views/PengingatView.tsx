// View Pengingat untuk Student Learning Assistant (Task 13.3).
//
// Menampilkan tabel data contoh pengingat tugas/aktivitas memakai komponen
// generik `SampleDataTable<Reminder>` beserta penanda `SampleBadge`.
//
// Perilaku terkait requirement:
// - R6.4: menampilkan daftar pengingat dari data contoh in-memory.
// - R6.5: menandai konten sebagai data contoh lewat `SampleBadge`.
// - R6.7: empty-state ditangani oleh `SampleDataTable` ketika data kosong.

import { reminders } from '../data/reminders';
import type { Reminder } from '../types';
import SampleBadge from '../components/SampleBadge';
import SampleDataTable from '../components/SampleDataTable';
import type { SampleColumn } from '../components/SampleDataTable';

const PRIORITY_LABEL: Record<Reminder['priority'], string> = {
  low: 'Rendah',
  medium: 'Sedang',
  high: 'Tinggi',
};

const PRIORITY_CHIP: Record<Reminder['priority'], string> = {
  low: 'border-[var(--border)] bg-[var(--bg)] text-[var(--text)]',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  high: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400',
};

const columns: SampleColumn<Reminder>[] = [
  {
    key: 'title',
    header: 'Pengingat',
    render: (row) => <span className="font-medium text-[var(--text-h)]">{row.title}</span>,
  },
  {
    key: 'dueDate',
    header: 'Jatuh Tempo',
    render: (row) => <span className="tabular-nums">{row.dueDate}</span>,
  },
  {
    key: 'priority',
    header: 'Prioritas',
    render: (row) => (
      <span
        className={[
          'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
          PRIORITY_CHIP[row.priority],
        ].join(' ')}
      >
        {PRIORITY_LABEL[row.priority]}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span className={row.done ? 'text-[var(--accent)]' : 'text-[var(--text)]'}>
        {row.done ? 'Selesai' : 'Belum'}
      </span>
    ),
  },
];

function PengingatView() {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-[var(--text-h)]">Pengingat</h2>
          <SampleBadge />
        </div>
        <p className="text-sm text-[var(--text)]">
          Daftar tugas dan aktivitas beserta tenggat, prioritas, dan statusnya.
        </p>
      </header>

      <SampleDataTable<Reminder>
        columns={columns}
        rows={reminders}
        getRowKey={(r) => r.id}
        emptyMessage="Belum ada pengingat yang tersedia."
      />
    </section>
  );
}

export default PengingatView;
