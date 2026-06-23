# 🏫 Dokumen Proyek: Dashboard Monitoring Revitalisasi SD 2026

Dokumen ini dibuat khusus untuk memandu **AI Agent (Gemini/Antigravity)** dalam memahami konteks proyek ini secara utuh tanpa perlu membaca ulang seluruh file dari awal.

---

## 📌 1. Gambaran Umum Proyek
Aplikasi ini adalah dashboard monitoring progres fisik dan administrasi keuangan proyek **Revitalisasi Sekolah Dasar (SD) Tahun 2026**. 
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

### 🏢 Hirarki Organisasi
Sistem menerapkan struktur hirarki berjenjang sebagai berikut:
1. **Super Admin**: Administrator utama, memiliki akses penuh mengatur seluruh entitas (termasuk memetakan bawahan untuk Koordinator).
2. **Ketua Tim**: Pimpinan proyek secara keseluruhan.
3. **Koordinator**: Membawahi beberapa **Fasilitator** tertentu. (Super Admin dapat menetapkan Fasilitator mana yang diawasi oleh Koordinator tertentu. Koordinator *hanya* dapat melihat data, laporan, dan progres dari Fasilitator yang berada di bawahnya saja).
4. **Fasilitator (Teknik & Pemberdayaan)**: Tenaga lapangan yang berada di bawah pengawasan Koordinator tertentu yang telah di-assign.
5. **Tenaga Administrasi**: Berada langsung di bawah **Ketua Tim** (tanpa memiliki bawahan), bertugas mengurus keuangan dan persetujuan administratif.

### 📋 Tabel Hak Akses

| No | Peran / Jabatan | Nama Default | Hak Akses Utama |
|----|-----------------|--------------|-----------------|
| 1 | **Super Admin** | Yosi Ronadi | Kelola Tim (CRUD), Kelola Sekolah Master, Set Linimasa Proyek Global, Assign Fasilitator ke Koordinator |
| 2 | **Ketua Tim** | Ir. H. Mulyono | Reviu akhir berkas PDF, Verifikasi progres global |
| 3 | **Koordinator** | Hendra Wijaya | Reviu laporan bulanan Fasilitator & Monitor dinas bulanan (Hanya terbatas pada Fasilitator bawahannya) |
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

---

## 🚨 7. Aturan Khusus: Evaluasi Backend & Apps Script (Wajib Baca)

Setiap kali terjadi perubahan kode (terutama pada state, schema, atau penambahan entitas/kolom baru di sisi React Frontend):
1. **BACA ATURAN INI TERLEBIH DAHULU** sebelum melanjutkan langkah coding.
2. **Evaluasi Dampak Backend**: Tentukan apakah perubahan kode tersebut memerlukan penyesuaian pada skema tabel Google Sheets atau penanganan berkas Google Drive.
3. **Perbarui Walkthrough**: Jika backend memerlukan perubahan struktur, perbarui berkas panduan setup [walkthrough.md](file:///C:/Users/Kerja%20Sama%20Polnep/.gemini/antigravity-ide/brain/c7484b94-d046-4809-bd51-1ffcaf7df6d6/walkthrough.md) (khususnya skema `SCHEMAS` dan kode `Code.gs` di dalamnya) agar tetap sinkron.
4. **Instruksi Pengguna**: Tampilkan saran instruksi yang jelas kepada pengguna di akhir giliran untuk segera memperbarui kode Apps Script di Google Sheets secara manual agar sinkronisasi data tetap berjalan lancar.
5. **Acuan Apps Script Terakhir (Sangat Penting)**: Jika Anda memodifikasi atau merujuk kode Apps Script (Google Sheets Backend), pastikan untuk selalu merujuk dan memperbarui file [codegs_revitsd_2026.gs](file:///d:/repos/revitsd2026/codegs_revitsd_2026.gs) untuk program SD 2026 dan [code_revitpaud_2026.gs](file:///d:/repos/revitsd2026/code_revitpaud_2026.gs) untuk program PAUD 2026 sebagai *source of truth*, agar variabel baru atau struktur yang telah disesuaikan tidak hilang atau kembali ke versi lama.

---

## 🌐 8. Dokumentasi Sinkronisasi & Penanganan Masalah

Bagian ini mencatat daftar kendala sinkronisasi yang pernah dialami beserta solusi penyelesaiannya untuk referensi tim pengembang atau AI Agent di masa mendatang.

### A. Kendala Kolom Baru (Kasus: `taxPct`) Hilang atau Kembali ke Default
* **Gejala**: Ketika nilai pajak diubah dan disimpan, nilainya kembali menjadi kosong (*Default*). Dan jika kolom dibuat manual di Sheets, kolom tersebut tiba-tiba terhapus kembali saat halaman direfresh.
* **Penyebab**: Google Apps Script di server masih menjalankan **kode versi lama** yang tidak menyertakan nama kolom baru pada konstanta `SCHEMAS.users`. Saat terjadi sinkronisasi, Apps Script membersihkan tabel (`sheet.clearContents()`) dan menulis ulang header sesuai skema lama yang tidak memiliki kolom baru tersebut.
* **Solusi**:
  1. Perbarui skema pada `Code.gs` di Google Apps Script editor.
  2. Lakukan deployment ulang dengan memilih **Deploy** → **Manage deployments** → **Edit** → Pilih **New version** (Wajib) → **Deploy**.
  3. Tambahkan kembali kolom baru di baris header spreadsheet (misalnya `taxPct` pada sheet `users`), atau hapus sheet tersebut agar sistem membuatkannya yang baru secara otomatis saat disinkronisasikan.

### B. Masalah Tabrakan Data Antar-Browser (Data Terhapus oleh Browser Lain)
* **Gejala**: Ketika browser A mengupdate data dengan sukses, lalu browser B (yang masih menampilkan data lama) dibuka dan menekan tombol sinkronisasi, data di browser B yang kosong/outdated menimpa database Google Sheets sehingga data dari browser A hilang.
* **Penyebab**: Aliran sinkronisasi bawaan selalu bertipe *Push-then-Fetch* (mengirim data lokal terlebih dahulu secara membabi buta, baru mengambil data server). Browser yang lama mengirimkan datanya yang kosong/ketinggalan zaman dan menimpa server.
* **Solusi**:
  * Implementasikan **Smart Sync** dengan memantau status data lokal menggunakan flag kotor (`isDirty` / `revit_is_dirty` di `localStorage`).
  * Jika browser **tidak melakukan perubahan data lokal** (status *Clean*), browser hanya diperbolehkan melakukan **penarikan saja (*Pull-Only*)** dan melewati proses *Push*. Browser hanya akan melakukan *Push* jika statusnya *Dirty* (ada perubahan lokal yang belum tersimpan).

### C. CORS Error & Kegagalan Koneksi Bergantian (Chrome vs Edge)
* **Gejala**: Koneksi sukses di satu browser (misal Chrome), tetapi saat dibuka di browser lain (Edge/Firefox/Incognito) mengalami error CORS / 404 (Not Found). Jika diperbaiki di Edge, gantian Chrome yang putus.
* **Penyebab**: 
  1. Penggunaan URL deployment pengujian (`/dev`). URL `/dev` hanya bekerja pada browser yang sedang login dengan akun Google pemilik script.
  2. Pengaturan **Execute as** diatur ke "User accessing the web app" atau **Who has access** tidak diatur ke "Anyone".
* **Solusi**:
  * Gunakan URL deployment resmi yang berakhiran dengan `/exec`.
  * Konfigurasikan deployment Apps Script dengan opsi: **Execute as: Me (email Anda)** dan **Who has access: Anyone**.

### D. Perubahan Kunci di `.env` Tidak Berefek (Stale Cache URL/Token)
* **Gejala**: Pengembang sudah mengubah URL atau Token Apps Script di file `.env` dan me-restart server Vite, tetapi aplikasi tetap mencoba menghubungi URL lama.
* **Penyebab**: Aplikasi menyimpan pengaturan URL/Token di `localStorage` (`revit_settings`), dan React memprioritaskan data dari `localStorage` dibandingkan variabel lingkungan `.env`.
* **Solusi**: Ditambahkan logika pendeteksi perubahan `.env` di `App.jsx`. Jika variabel lingkungan `.env` berubah, aplikasi akan otomatis menimpa cache `localStorage` dengan nilai `.env` terbaru saat server dijalankan ulang.

### E. Data Hilang Karena Caching Browser (GET Request Ter-Cache)
* **Gejala**: Penambahan data baru berhasil (status "Tersambung" hijau), namun setelah sinkronisasi otomatis selesai, data yang baru saja ditambahkan mendadak hilang dari layar.
* **Penyebab**: Browser (terutama Chrome/Edge) secara agresif melakukan *caching* pada HTTP GET request. Ketika React melakukan *pull* dari URL Apps Script yang statis, browser mengembalikan data lama dari memori *cache* lokal alih-alih menghubungi server Google secara langsung. Aplikasi mengira server telah menghapus data tersebut.
* **Solusi**: 
  * Tambahkan parameter *Cache-Busting* dinamis pada URL *fetch* di `api.js` (misalnya `&_t=${Date.now()}`).
  * Sisipkan parameter opsi `cache: 'no-store'` pada pengaturan `fetch()`.

### F. Data Hilang Akibat Race Condition Flag Dirty Saat Background Sync
* **Gejala**: Pengguna menekan tombol "Simpan" (atau menghapus) tepat pada momen ketika proses sinkronisasi otomatis latar belakang sedang berlangsung. Data baru tidak tersimpan di server dan seketika terhapus dari layar pengguna.
* **Penyebab**: Proses `pushData` ke Google Sheets memakan waktu sekitar ~2.5 detik. Pada kode lama, *flag* penanda data kotor (`revit_is_dirty`) dikembalikan menjadi `false` *SETELAH* proses `pushData` selesai. Akibatnya, jika pengguna melakukan input data baru dalam jeda 2.5 detik tersebut (yang akan mengubah *flag* menjadi `true`), *flag* tersebut akan tanpa sengaja ditimpa menjadi `false` lagi saat sinkronisasi sebelumnya selesai. Saat penarikan data (*pull*) terjadi, sistem gagal mendeteksi ada perubahan lokal yang masih tertunda dan dengan membabi-buta menimpakan data server lama ke layar pengguna.
* **Solusi**: Pengosongan *flag* `revit_is_dirty` menjadi `false` dipindahkan posisinya menjadi *SEBELUM* fungsi `await pushData` dipanggil. Sehingga, perubahan baru oleh pengguna akan kembali menyalakan *flag* ke `true` dan mencegah penarikan data lama menghapus data lokal yang belum dikirim. Data yang tertunda lalu akan dikirim pada siklus *sync* secara rekursif.

