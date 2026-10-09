// Data contoh pengingat tugas/aktivitas (in-memory) sesuai R6.4.
// Setiap baris memiliki id unik stabil, priority salah satu dari 'low'|'medium'|'high'.
import type { Reminder } from '../types';

export const reminders: Reminder[] = [
  { id: 'rem-1', title: 'Kumpulkan tugas Matematika Bab 3', dueDate: '2024-05-12', priority: 'high', done: false },
  { id: 'rem-2', title: 'Baca materi Teks Eksposisi', dueDate: '2024-05-13', priority: 'medium', done: false },
  { id: 'rem-3', title: 'Latihan soal IPA Sistem Pencernaan', dueDate: '2024-05-14', priority: 'medium', done: true },
  { id: 'rem-4', title: 'Hafalan kosakata Bahasa Inggris', dueDate: '2024-05-15', priority: 'low', done: false },
  { id: 'rem-5', title: 'Persiapan presentasi IPS', dueDate: '2024-05-16', priority: 'high', done: false },
  { id: 'rem-6', title: 'Review catatan Statistika', dueDate: '2024-05-17', priority: 'low', done: true },
  { id: 'rem-7', title: 'Ikut bimbingan belajar', dueDate: '2024-05-18', priority: 'medium', done: false },
];
