// Data contoh jadwal belajar/kegiatan (in-memory) sesuai R6.3.
// Setiap baris memiliki id unik stabil.
import type { ScheduleItem } from '../types';

export const scheduleItems: ScheduleItem[] = [
  { id: 'sch-1', title: 'Matematika', day: 'Senin', time: '08:00 - 09:30', location: 'Ruang 101' },
  { id: 'sch-2', title: 'Bahasa Indonesia', day: 'Senin', time: '10:00 - 11:30', location: 'Ruang 102' },
  { id: 'sch-3', title: 'IPA', day: 'Selasa', time: '08:00 - 09:30', location: 'Lab IPA' },
  { id: 'sch-4', title: 'Bahasa Inggris', day: 'Rabu', time: '09:00 - 10:30', location: 'Daring' },
  { id: 'sch-5', title: 'IPS', day: 'Kamis', time: '13:00 - 14:30', location: 'Ruang 103' },
  { id: 'sch-6', title: 'Bimbingan Belajar', day: 'Jumat', time: '15:00 - 16:30', location: 'Perpustakaan' },
  { id: 'sch-7', title: 'Ekstrakurikuler Robotik', day: 'Sabtu', time: '08:00 - 10:00', location: 'Lab Komputer' },
];
