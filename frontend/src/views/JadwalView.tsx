// View Jadwal untuk Student Learning Assistant (Task 13.3).
//
// Menampilkan tabel data contoh jadwal belajar/kegiatan memakai komponen
// generik `SampleDataTable<ScheduleItem>` beserta penanda `SampleBadge`.
//
// Perilaku terkait requirement:
// - R6.3: menampilkan daftar jadwal dari data contoh in-memory.
// - R6.5: menandai konten sebagai data contoh lewat `SampleBadge`.
// - R6.7: empty-state ditangani oleh `SampleDataTable` ketika data kosong.

import { scheduleItems } from '../data/scheduleItems';
import type { ScheduleItem } from '../types';
import SampleBadge from '../components/SampleBadge';
import SampleDataTable from '../components/SampleDataTable';
import type { SampleColumn } from '../components/SampleDataTable';

const columns: SampleColumn<ScheduleItem>[] = [
  {
    key: 'title',
    header: 'Kegiatan',
    render: (row) => <span className="font-medium text-[var(--text-h)]">{row.title}</span>,
  },
  {
    key: 'day',
    header: 'Hari',
    render: (row) => row.day,
  },
  {
    key: 'time',
    header: 'Waktu',
    render: (row) => <span className="tabular-nums">{row.time}</span>,
  },
  {
    key: 'location',
    header: 'Lokasi',
    render: (row) => row.location,
  },
];

function JadwalView() {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-[var(--text-h)]">Jadwal</h2>
          <SampleBadge />
        </div>
        <p className="text-sm text-[var(--text)]">
          Daftar kegiatan belajar beserta hari, waktu, dan lokasinya.
        </p>
      </header>

      <SampleDataTable<ScheduleItem>
        columns={columns}
        rows={scheduleItems}
        getRowKey={(r) => r.id}
        emptyMessage="Belum ada jadwal yang tersedia."
      />
    </section>
  );
}

export default JadwalView;
