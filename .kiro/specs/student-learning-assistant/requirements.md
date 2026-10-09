# Requirements Document

## Introduction

Student Learning Assistant adalah aplikasi web chatbot asisten belajar siswa. Aplikasi terdiri dari frontend (React + TypeScript + Vite + Tailwind CSS) yang menyajikan antarmuka sidebar bersih, modern, dan responsif dengan lima menu: Dashboard, Chatbot Assistant, Laporan Progress, Jadwal, dan Pengingat. Backend (Node.js + Express) berfungsi sebagai perantara ke AWS Bedrock untuk menghasilkan jawaban AI.

Pada tahap awal, aplikasi berjalan tanpa database. Seluruh data percakapan dan status aplikasi bersifat sementara (in-memory di sisi browser) dan tidak dipersistensi antar sesi. Implementasi dibatasi pada stack yang sudah tersedia tanpa menambahkan library baru.

## Glossary

- **Frontend**: Aplikasi klien berbasis React + TypeScript + Vite + Tailwind CSS yang dijalankan di browser pengguna.
- **Backend**: Server Node.js + Express yang menerima permintaan dari Frontend dan meneruskannya ke AWS Bedrock.
- **Bedrock_Service**: Layanan AWS Bedrock yang menghasilkan jawaban AI melalui `@aws-sdk/client-bedrock-runtime`.
- **Sidebar**: Komponen navigasi tetap pada Frontend yang menampilkan lima menu utama.
- **Chat_Interface**: Area percakapan pada menu Chatbot Assistant tempat Siswa mengirim pesan dan menerima jawaban.
- **Siswa**: Pengguna aplikasi yang berinteraksi dengan Frontend.
- **Active_Menu**: Menu yang sedang ditampilkan dan ditandai aktif pada Sidebar.
- **Chat_Session**: Kumpulan pesan percakapan yang disimpan sementara di memori browser selama satu sesi aktif.
- **Breakpoint_Mobile**: Kondisi lebar viewport kurang dari 768 piksel.
- **Breakpoint_Desktop**: Kondisi lebar viewport 1024 piksel atau lebih.
- **Catatan Rentang Breakpoint**: Rentang lebar viewport 768 piksel sampai kurang dari 1024 piksel menerapkan perilaku Breakpoint_Mobile.

## Requirements

### Requirement 1: Navigasi Sidebar

**User Story:** Sebagai Siswa, saya ingin navigasi sidebar dengan lima menu, sehingga saya dapat berpindah antar fitur aplikasi dengan mudah.

#### Acceptance Criteria

1. THE Sidebar SHALL menampilkan tepat lima item menu secara berurutan dari atas ke bawah dengan label "Dashboard", "Chatbot Assistant", "Laporan Progress", "Jadwal", dan "Pengingat".
2. WHEN Frontend dimuat pertama kali, THE Frontend SHALL menetapkan "Dashboard" sebagai Active_Menu dan menampilkan konten Dashboard dalam waktu paling lama 2 detik.
3. WHEN Siswa memilih salah satu item menu, THE Frontend SHALL menampilkan konten yang sesuai dan menetapkannya sebagai Active_Menu dalam waktu paling lama 1 detik.
4. THE Sidebar SHALL menandai tepat satu Active_Menu pada satu waktu dengan indikator visual aktif yang dapat dibedakan dari item menu lain yang tidak aktif.
5. WHEN Siswa memilih item menu yang sudah menjadi Active_Menu, THE Frontend SHALL mempertahankan konten dan status Active_Menu tersebut tanpa memuat ulang.
6. IF konten untuk sebuah menu gagal dimuat, THEN THE Frontend SHALL mempertahankan Active_Menu sebelumnya dan menampilkan indikasi kegagalan.

### Requirement 2: Antarmuka Responsif

**User Story:** Sebagai Siswa, saya ingin antarmuka yang responsif, sehingga aplikasi tetap dapat digunakan di layar perangkat seluler maupun desktop.

#### Acceptance Criteria

1. WHILE viewport memiliki lebar lebih besar atau sama dengan 1024px (Breakpoint_Desktop), THE Sidebar SHALL ditampilkan dalam keadaan tetap terlihat di sisi kiri layar tanpa memerlukan interaksi Siswa.
2. WHILE viewport memiliki lebar kurang dari 768px (Breakpoint_Mobile), THE Sidebar SHALL disembunyikan secara default dan menyediakan tombol pembuka yang terlihat pada viewport.
3. WHEN Siswa menekan tombol pembuka Sidebar pada Breakpoint_Mobile, THE Frontend SHALL menampilkan Sidebar sebagai lapisan di atas konten dalam waktu maksimal 300 milidetik.
4. WHEN Siswa memilih item menu pada Breakpoint_Mobile, THE Frontend SHALL menyembunyikan kembali Sidebar dalam waktu maksimal 300 milidetik setelah konten menu ditampilkan.
5. WHILE viewport berada pada Breakpoint_Mobile atau Breakpoint_Desktop, THE Frontend SHALL menyesuaikan tata letak area konten sehingga seluruh elemen tetap terlihat sepenuhnya tanpa scroll horizontal dan tanpa pemotongan konten.
6. IF viewport memiliki lebar antara 768px dan kurang dari 1024px, THEN THE Frontend SHALL menerapkan perilaku Breakpoint_Mobile dengan Sidebar disembunyikan secara default.

### Requirement 3: Chatbot Assistant dengan AWS Bedrock

**User Story:** Sebagai Siswa, saya ingin mengajukan pertanyaan belajar ke chatbot, sehingga saya mendapatkan jawaban yang dihasilkan oleh AI.

#### Acceptance Criteria

1. WHEN Siswa mengirim pesan dengan panjang 1 sampai 2000 karakter (setelah dipangkas spasi) melalui Chat_Interface, THE Frontend SHALL mengirim isi pesan tersebut ke Backend dalam waktu paling lama 2 detik.
2. WHEN Backend menerima pesan dari Frontend, THE Backend SHALL meneruskan pesan ke Bedrock_Service dan menunggu jawaban paling lama 30 detik.
3. WHEN Backend menerima jawaban dari Bedrock_Service, THE Backend SHALL mengembalikan isi jawaban tersebut ke Frontend.
4. WHEN Frontend menerima jawaban dari Backend, THE Chat_Interface SHALL menampilkan jawaban tersebut sebagai pesan dari asisten dalam waktu paling lama 1 detik.
5. WHILE Backend sedang menunggu jawaban dari Bedrock_Service, THE Chat_Interface SHALL menampilkan indikator proses yang terlihat dan menonaktifkan tombol kirim.
6. IF Siswa mencoba mengirim pesan kosong, hanya berisi spasi, atau melebihi 2000 karakter, THEN THE Frontend SHALL menolak pengiriman dan tidak memanggil Backend.
7. IF Bedrock_Service gagal atau melewati batas waktu 30 detik, THEN THE Chat_Interface SHALL menampilkan indikasi kesalahan dan mengaktifkan kembali tombol kirim.

### Requirement 4: Penanganan Kesalahan Chatbot

**User Story:** Sebagai Siswa, saya ingin diberi tahu ketika permintaan ke chatbot gagal, sehingga saya memahami situasinya dan dapat mencoba kembali.

#### Acceptance Criteria

1. IF Backend tidak menerima jawaban dari Bedrock_Service dalam waktu 30 detik atau menerima respons gagal, THEN THE Backend SHALL mengembalikan respons kesalahan berisi kode kategori kesalahan dan pesan deskriptif ke Frontend dalam waktu paling lama 2 detik setelah kondisi gagal terdeteksi.
2. IF Frontend menerima respons kesalahan dari Backend, THEN THE Chat_Interface SHALL menampilkan pesan kesalahan dalam bahasa Indonesia yang dapat dibaca Siswa beserta kontrol untuk mencoba ulang permintaan yang sama.
3. IF Frontend gagal menghubungi Backend dalam waktu 30 detik, THEN THE Chat_Interface SHALL menampilkan pesan yang menyatakan bahwa koneksi ke layanan gagal beserta kontrol untuk mencoba ulang.
4. WHEN pesan kesalahan ditampilkan, THE Chat_Interface SHALL mempertahankan seluruh riwayat pesan Chat_Session sebelumnya tanpa menghapus atau mengubah urutannya.
5. WHEN Siswa memilih kontrol coba ulang setelah pesan kesalahan ditampilkan, THE Chat_Interface SHALL mengirim kembali permintaan terakhir ke Backend paling banyak 3 kali percobaan ulang, dengan jeda minimal 1 detik antar percobaan.

### Requirement 5: Riwayat Percakapan Sementara (Tanpa Database)

**User Story:** Sebagai Siswa, saya ingin melihat percakapan saya selama sesi berlangsung, sehingga saya dapat mengikuti alur tanya jawab tanpa perlu penyimpanan permanen.

#### Acceptance Criteria

1. WHEN Siswa mengirim pesan dan menerima jawaban, THE Chat_Interface SHALL menampilkan kedua pesan tersebut secara berurutan sesuai waktu kirim dalam Chat_Session.
2. THE Frontend SHALL menyimpan Chat_Session hanya di memori browser selama sesi aktif dan tidak menuliskannya ke penyimpanan persisten apa pun.
3. WHEN Siswa memuat ulang halaman, THE Frontend SHALL memulai Chat_Session baru yang kosong tanpa memuat riwayat sebelumnya.
4. THE Backend SHALL memproses setiap permintaan secara tanpa-status dan tidak menyimpan isi pesan ke penyimpanan permanen.
5. IF jumlah pesan dalam Chat_Session bertambah melebihi area tampilan, THEN THE Chat_Interface SHALL menyediakan gulir vertikal dan menjaga pesan terbaru tetap terlihat.

### Requirement 6: Konten Menu Dashboard, Laporan Progress, Jadwal, dan Pengingat

**User Story:** Sebagai Siswa, saya ingin setiap menu menampilkan halaman yang sesuai, sehingga aplikasi terasa lengkap dan terstruktur sejak tahap awal.

#### Acceptance Criteria

1. WHEN Active_Menu adalah "Dashboard", THE Frontend SHALL menampilkan halaman Dashboard yang berisi satu teks sambutan dan antara 3 sampai 6 tautan akses cepat yang masing-masing mengarah ke salah satu menu lain.
2. WHEN Active_Menu adalah "Laporan Progress", THE Frontend SHALL menampilkan halaman Laporan Progress dengan antara 1 sampai 20 baris data contoh yang dimuat dari memori Frontend.
3. WHEN Active_Menu adalah "Jadwal", THE Frontend SHALL menampilkan halaman Jadwal dengan antara 1 sampai 20 baris data contoh yang dimuat dari memori Frontend.
4. WHEN Active_Menu adalah "Pengingat", THE Frontend SHALL menampilkan halaman Pengingat dengan antara 1 sampai 20 baris data contoh yang dimuat dari memori Frontend.
5. THE Frontend SHALL menampilkan penanda visual bertuliskan status "data contoh" pada halaman Laporan Progress, Jadwal, dan Pengingat untuk menunjukkan konten belum terhubung ke data persisten.
6. IF Active_Menu bernilai selain kelima label menu yang ditetapkan, THEN THE Frontend SHALL menampilkan halaman Dashboard sebagai halaman bawaan.
7. IF data contoh untuk halaman Laporan Progress, Jadwal, atau Pengingat kosong, THEN THE Frontend SHALL menampilkan pesan bahwa belum ada data yang tersedia.

### Requirement 7: Integrasi Frontend dan Backend

**User Story:** Sebagai Siswa, saya ingin Frontend dan Backend berjalan dengan konfigurasi yang benar, sehingga permintaan chatbot dapat diproses tanpa hambatan koneksi.

#### Acceptance Criteria

1. WHEN Backend menerima permintaan HTTP berisi pesan Siswa dengan panjang 1 sampai 4000 karakter pada endpoint chatbot yang telah ditentukan, THE Backend SHALL mengembalikan jawaban Bedrock_Service dalam waktu paling lama 30 detik.
2. IF permintaan HTTP yang diterima Backend memiliki pesan Siswa kosong atau melebihi 4000 karakter, THEN THE Backend SHALL menolak permintaan tanpa memanggil Bedrock_Service dan mengembalikan indikasi kesalahan yang menyatakan pesan tidak valid.
3. THE Backend SHALL mengaktifkan CORS sehingga permintaan dari origin Frontend yang telah ditentukan diterima dan permintaan dari origin lain ditolak.
4. THE Backend SHALL membaca konfigurasi AWS Bedrock_Service dari variabel lingkungan melalui mekanisme dotenv saat Backend memulai.
5. IF satu atau lebih variabel lingkungan konfigurasi Bedrock_Service tidak tersedia saat Backend memulai, THEN THE Backend SHALL mencatat pesan kesalahan yang menyatakan konfigurasi mana yang hilang dan menghentikan proses inisialisasi tanpa menerima permintaan chatbot.
6. WHEN Siswa mengirim pesan melalui Frontend, THE Frontend SHALL mengirim permintaan chatbot ke endpoint Backend yang telah ditentukan.
7. IF permintaan chatbot dari Frontend gagal karena kesalahan koneksi atau Backend tidak merespons dalam waktu 30 detik, THEN THE Frontend SHALL menampilkan indikasi kesalahan dan mempertahankan pesan Siswa agar dapat dikirim ulang.

### Requirement 8: Batasan Teknologi

**User Story:** Sebagai pemilik proyek, saya ingin implementasi tetap pada stack yang sudah ada, sehingga proyek tetap sederhana dan mudah dirawat.

#### Acceptance Criteria

1. THE Frontend SHALL dibangun hanya menggunakan dependency yang telah terdaftar dalam berkas `frontend/package.json`, yaitu React, React DOM, TypeScript, Vite, dan Tailwind CSS, tanpa menambahkan dependency runtime lain.
2. THE Backend SHALL dibangun hanya menggunakan dependency yang telah terdaftar dalam berkas `backend/package.json`, yaitu Express, cors, dotenv, dan @aws-sdk/client-bedrock-runtime, tanpa menambahkan dependency runtime lain.
3. THE Frontend SHALL dibuat di dalam folder `frontend/` yang sudah ada dan THE Backend SHALL dibuat di dalam folder `backend/` yang sudah ada, tanpa membuat folder proyek baru di luar kedua folder tersebut.
4. IF sebuah fitur membutuhkan library tambahan di luar daftar dependency pada Kriteria 1 dan 2, THEN THE implementasi SHALL tidak menambahkan library tersebut ke berkas `package.json` dan SHALL menampilkan pemberitahuan kepada pemilik proyek bahwa penambahan tertunda sampai memperoleh persetujuan.
