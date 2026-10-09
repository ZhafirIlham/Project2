// Data contoh laporan progress belajar (in-memory) sesuai R6.2.
// Setiap baris memiliki id unik stabil dan progressPercent dalam rentang 0..100.
import type { ProgressReport } from '../types';

export const progressReports: ProgressReport[] = [
  { id: 'pr-1', subject: 'Matematika', topic: 'Persamaan Linear Satu Variabel', progressPercent: 85, updatedAt: '2024-05-10' },
  { id: 'pr-2', subject: 'Bahasa Indonesia', topic: 'Teks Eksposisi', progressPercent: 70, updatedAt: '2024-05-09' },
  { id: 'pr-3', subject: 'IPA', topic: 'Sistem Pencernaan Manusia', progressPercent: 60, updatedAt: '2024-05-08' },
  { id: 'pr-4', subject: 'IPS', topic: 'Interaksi Antarruang', progressPercent: 45, updatedAt: '2024-05-07' },
  { id: 'pr-5', subject: 'Bahasa Inggris', topic: 'Simple Present Tense', progressPercent: 90, updatedAt: '2024-05-06' },
  { id: 'pr-6', subject: 'Matematika', topic: 'Statistika Dasar', progressPercent: 30, updatedAt: '2024-05-05' },
  { id: 'pr-7', subject: 'IPA', topic: 'Gerak dan Gaya', progressPercent: 100, updatedAt: '2024-05-04' },
];
