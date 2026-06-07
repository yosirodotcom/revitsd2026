# 🏫 Dokumen Proyek: Dashboard Monitoring Revitalisasi SD 2027

Dokumen ini dibuat khusus untuk memandu **AI Agent (Gemini/Antigravity)** dalam memahami konteks proyek ini secara utuh tanpa perlu membaca ulang seluruh file dari awal.

---

## 📌 1. Gambaran Umum Proyek
Aplikasi ini adalah dashboard monitoring progres fisik dan administrasi keuangan proyek **Revitalisasi Sekolah Dasar (SD) Tahun 2027**. 
* **Tujuan**: Mempermudah pemantauan progres revitalisasi sekolah, penjadwalan dinas otomatis, pencatatan log harian lapangan (dengan kompresi gambar), pelaporan PDF bulanan, hingga rekapitulasi penggajian (payroll) honorarium tim pelaksana swakelola.
* **Arsitektur**: Berjalan sepenuhnya di sisi klien (*Client-side / Frontend-only*) dengan penyimpanan state yang persisten menggunakan `localStorage` agar tidak melampaui kuota 5MB browser.

---

## 🛠️ 2. Tech Stack & Dependensi
* **Framework**: React (Vite)
* **Styling**: Tailwind CSS v4 (menggunakan `@tailwindcss/vite` plugin)
* **Icons**: `lucide-react`
* **Deployment**: Dikonfigurasi untuk Vercel ([vercel.json](file:///e:/repos/revitsd2026/vercel.json))

---

## 📁 3. Arsitektur File & Kode Sumber

### 🗂️ Data Awal & Seeding
* [initialData.js](file:///e:/repos/revitsd2026/src/data/initialData.js) - Memuat data profil default untuk **10 anggota tim pelaksana** beserta panduan tugas formal per peran (*Duty Reports*).
* [initialSchools.js](file:///e:/repos/revitsd2026/src/data/initialSchools.js) - Hasil seeding **41 sekolah dasar** dari berkas `data_sekolah.csv`.

### 🧩 Komponen Navigasi & Utama
* [App.jsx](file:///e:/repos/revitsd2026/src/App.jsx) - Root component yang mengatur seluruh state global aplikasi (`users`, `schools`, `contacts`, `tasks`, `trips`, `logs`, `reports`, `dutyReports`, `expenses`, `payments`, `settings`) dan sinkronisasi ke `localStorage`.
* [Sidebar.jsx](file:///e:/repos/revitsd2026/src/components/Sidebar.jsx) - Navigasi samping dinamis yang menampilkan menu secara bersyarat sesuai dengan peran/jabatan user aktif.
* [PlaceholderView.jsx](file:///e:/repos/revitsd2026/src/components/PlaceholderView.jsx) - Indikator fallback visual yang bersih.

### 👤 Manajemen User & Tim
* [UserSelect.jsx](file:///e:/repos/revitsd2026/src/components/UserSelect.jsx) - Halaman pendaratan kartu profil untuk memilih user aktif (Multi-user simulation).
* [ProfileModal.jsx](file:///e:/repos/revitsd2026/src/components/ProfileModal.jsx) - Modal edit mandiri untuk data profil kepegawaian pribadi masing-masing anggota.
* [TeamManagement.jsx](file:///e:/repos/revitsd2026/src/components/TeamManagement.jsx) - Panel CRUD khusus bagi **Super Admin** untuk mengelola anggota tim pelaksana.

### 🏫 Manajemen Sekolah Dasar & Detail
* [SchoolList.jsx](file:///e:/repos/revitsd2026/src/components/SchoolList.jsx) - Tampilan grid daftar sekolah dasar yang dilengkapi filter Kabupaten, filter binaan Fasilitator, pencarian instan, tombol Klaim, dan tombol tambah sekolah baru (Master) oleh Admin.
* [SchoolDetail.jsx](file:///e:/repos/revitsd2026/src/components/SchoolDetail.jsx) - Halaman detail komprehensif sekolah terbagi menjadi beberapa tab:
  * **Profil Sekolah**: Detail metadata geografis (Kabupaten, Kecamatan, Desa, Kepala Sekolah).
  * **Papan Tugas (Kanban)**: Board tugas pekerjaan (*To Do*, *In Progress*, *Done*). Progres fisik sekolah dihitung otomatis dari persentase tugas selesai terhadap total tugas.
  * **Mitra Lapangan**: Dropdown untuk memilih dan mengaitkan Kontak Perencana & Pengawas lapangan.
  * **Pengecekan Log/Laporan**: Indikator visual progres tugas.

### 📞 Kontak Mitra Lapangan
* [ContactManagement.jsx](file:///e:/repos/revitsd2026/src/components/ContactManagement.jsx) - Database terpusat untuk profil kontak pihak ketiga (Pengawas & Perencana lapangan) guna menghindari redundansi data.

### 🚗 Perjalanan Dinas & Simulasi Waktu
* [TravelSchedule.jsx](file:///e:/repos/revitsd2026/src/components/TravelSchedule.jsx) - Sistem pengajuan, persetujuan, dan pencatatan perjalanan dinas.
  * **Simulasi Tanggal Hari Ini**: Fitur pemaju tanggal sistem untuk memudahkan simulasi pelacakan waktu dinas.
  * **Penghitungan Otomatis Kewajiban Dinas**:
    * **Fasilitator**: Wajib dinas 5 hari jika progres fisik sekolah $\ge 50\%$ (Kunjungan I) dan jika progres mencapai $100\%$ (Kunjungan II).
    * **Koordinator**: Wajib dinas 4 hari pada bulan ke-3 dan bulan ke-6 proyek.
  * **Antrean Prioritas**: Mengurutkan prioritas verifikasi berdasarkan tingkat progres sekolah yang paling tinggi.

### 📸 Log Harian & PDF Laporan Bulanan
* [DailyLogs.jsx](file:///e:/repos/revitsd2026/src/components/DailyLogs.jsx) - Jurnal aktivitas harian pelaksana swakelola. Dilengkapi input unggah gambar bukti kegiatan dengan kompresi berbasis HTML5 Canvas secara otomatis menjadi format JPEG dengan resolusi maksimal `600px` dan kualitas `60%` (Base64) untuk menghemat ruang penyimpanan.
* [MonthlyPdfReports.jsx](file:///e:/repos/revitsd2026/src/components/MonthlyPdfReports.jsx) - Modul pengajuan berkas PDF laporan bulanan (Bulan 1 - Bulan 6). Dilengkapi validasi ekstensi wajib `.pdf` dan batas ukuran berkas maksimal `1.5MB`. Koordinator & Ketua Tim memiliki hak akses untuk memberikan status persetujuan (*Approved* / *Rejected*).
* [DutyReports.jsx](file:///e:/repos/revitsd2026/src/components/DutyReports.jsx) - Lembar centang kewajiban formal pekerjaan per peran sebagai bukti pertanggungjawaban bulanan.

### 💸 Payroll & Keuangan Proyek
* [FinancialDashboard.jsx](file:///e:/repos/revitsd2026/src/components/FinancialDashboard.jsx) - Panel khusus bagi peran **Tenaga Administrasi** (Wida Arindya Sari) untuk melacak alokasi dana proyek:
  * **Honor Bulanan**: Dibayar otomatis per bulan jika laporan bulanan disetujui.
  * **Honor Output & Outcome**: Bonus tambahan yang dibayarkan jika minimal $\ge 75\%$ atau $\ge 90\%$ sekolah binaan mencapai target progres fisik dan seluruh berkas disetujui.
  * **Dinas Payout**: Pembayaran kompensasi perjalanan dinas selesai.
  * **ATK Logs**: Input manual pencatatan pengeluaran Alat Tulis Kantor.
  * **Grafik Pie/Donut**: Visualisasi pemakaian anggaran (ATK vs Honor vs Perjalanan Dinas).

---

## 👥 4. Matriks Akses Peran Pengguna (10 Peran Utama)

| No | Peran / Jabatan | Nama Default | Hak Akses Utama |
|----|-----------------|--------------|-----------------|
| 1 | **Super Admin** | Yosi Ronadi | Kelola Tim (CRUD), Kelola Sekolah Master, Set Linimasa Proyek Global |
| 2 | **Ketua Tim** | Ir. H. Mulyono | Reviu akhir berkas PDF, Verifikasi progres global |
| 3 | **Koordinator** | Hendra Wijaya | Reviu laporan bulanan Fasilitator, Klaim & Monitor dinas bulanan |
| 4 | **Fasilitator Teknik** | Rizal | Klaim sekolah, Kelola Kanban tugas fisik, Input Log Harian + Gambar, Unggah PDF Laporan |
| 5 | **Fasilitator Teknik** | Ahmad | Sama seperti Rizal |
| 6 | **Fasilitator Pemberdayaan** | Siti Aminah | Sama seperti Rizal (Fokus non-teknis) |
| 7 | **Fasilitator Pemberdayaan** | Budi Santoso | Sama seperti Siti Aminah |
| 8 | **Tenaga Administrasi** | Wida Arindya Sari | Kelola ATK, Payroll Honor Bulanan, Output & Outcome, Klaim Perjalanan Dinas |
| 9 | **Tenaga Lapangan (Perencana)** | (Dibuat Dinamis) | Terdaftar di Kontak Mitra |
| 10 | **Tenaga Lapangan (Pengawas)** | (Dibuat Dinamis) | Terdaftar di Kontak Mitra |

---

## ⚙️ 5. Skema State & Penyimpanan (`localStorage`)

Aplikasi menyimpan seluruh data dalam satu namespace utama agar mudah disinkronkan. Struktur data JSON di `localStorage` memuat kunci-kunci berikut:
* `revitsd_users` - Array objek berisi daftar user (anggota tim).
* `revitsd_schools` - Array objek sekolah (ID, nama, kabupaten, koordinat, desa, kecamatan, kepala sekolah, fasilitator terhubung).
* `revitsd_contacts` - Array mitra eksternal (Perencana / Pengawas).
* `revitsd_tasks` - Array Kanban tugas per sekolah (id, schoolId, title, status: `'todo'|'in_progress'|'done'`).
* `revitsd_trips` - Catatan perjalanan dinas (id, userId, schoolId, date, status: `'planned'|'completed'|'paid'`, duration, reason, simDate).
* `revitsd_logs` - Log harian (id, userId, schoolId, date, description, photoBase64).
* `revitsd_reports` - Laporan bulanan PDF (id, schoolId, month: `1..6`, fileName, fileSize, base64Data, status: `'pending'|'approved'|'rejected'`, note, uploadedBy).
* `revitsd_dutyReports` - Ceklist kewajiban peran bulanan.
* `revitsd_expenses` - Catatan pengeluaran ATK (id, date, amount, description, notedBy).
* `revitsd_payments` - Transaksi payroll & dinas (id, type: `'honor'|'bonus_output'|'bonus_outcome'|'travel'`, amount, date, userId, details).
* `revitsd_settings` - Pengaturan tanggal mulai & akhir proyek (`projectStart`, `projectEnd`, `simulatedToday`).

---

## 🚀 6. Cara Menjalankan & Memulai Uji Coba

1. **Jalankan server pengembangan**:
   ```powershell
   npm run dev
   ```
2. **Buka browser** ke alamat yang diberikan (umumnya `http://localhost:5173`).
3. **Skenario Simulasi Cepat**:
   * Masuk sebagai **Super Admin (Yosi Ronadi)** -> Set Linimasa proyek di Dashboard.
   * Masuk sebagai **Fasilitator (Rizal)** -> Masuk ke "Semua Sekolah", klaim salah satu sekolah, lalu isi "Papan Tugas Lapangan" (Kanban).
   * Lakukan perjalanan dinas di menu "Jadwal Perjalanan Dinas" dengan memanfaatkan fitur **Tanggal Simulasi Hari Ini** (misal ubah ke 3 bulan setelah tanggal mulai proyek).
   * Buat log harian dan unggah foto kegiatan, lalu cek apakah ukuran fotonya otomatis mengecil.
   * Masuk sebagai **Tenaga Administrasi (Wida Arindya Sari)** -> Buka "Payroll & Keuangan" untuk memproses pembayaran honor dan klaim dinas yang selesai.
