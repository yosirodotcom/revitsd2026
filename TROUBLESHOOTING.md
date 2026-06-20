# 🛠️ Dokumentasi Troubleshooting & Penanganan Masalah Sinkronisasi

Dokumen ini berisi rangkuman kasus-kasus teknis, *bug*, dan permasalahan sinkronisasi yang pernah terjadi selama masa pengembangan dan pengujian aplikasi **Dashboard Monitoring Revitalisasi SD 2026**. 

Tujuan dokumen ini adalah sebagai buku panduan (*playbook*) bagi developer atau *AI Agent* di masa mendatang agar tidak mengulangi kesalahan yang sama dan dapat menyelesaikan masalah serupa dengan cepat.

---

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

### G. Log Harian Tidak Bisa Dihapus — Card Hanya Berpindah Posisi
* **Gejala**: Ketika pengguna (Fasilitator) menekan tombol hapus pada log harian, log tersebut tidak terhapus melainkan hanya berpindah posisi di layar. Jumlah card tetap sama sebelum dan sesudah penghapusan.
* **Penyebab**: Terdapat sebuah `useEffect` migrasi di `App.jsx` yang memantau perubahan `activityLogs` (dependency `[activityLogs]`). useEffect ini berfungsi memeriksa semua entry bertipe `manual_log` di `activityLogs` dan membuat ulang daily log jika tidak ditemukan log harian yang cocok. Kronologi bug-nya:
  1. `handleDeleteLog` berhasil menghapus log harian dari state `logs`.
  2. Bersamaan dengan itu, `handleDeleteLog` juga menambahkan entry baru ke `activityLogs` (tipe `delete_daily_log`) untuk mencatat riwayat aksi.
  3. Perubahan `activityLogs` memicu useEffect tersebut.
  4. useEffect mendeteksi bahwa ada entry `manual_log` (misal: "tes kucing") di `activityLogs` yang **tidak lagi memiliki** daily log yang cocok (karena baru saja dihapus).
  5. useEffect **langsung membuat ulang** log harian tersebut dengan ID dan `createdAt` baru.
  6. Akibatnya, log "muncul kembali" di posisi berbeda karena timestamp pembuatan berubah.
* **Solusi**: 
  * Menghapus `useEffect` migrasi `manual_log → daily logs` tersebut dari `App.jsx`.
  * useEffect ini sudah **tidak diperlukan** karena fungsi `handleAddManualActivityLog` sudah membuat **kedua entri** (activity log + daily log) secara bersamaan saat pengguna menambah log manual dari sidebar Log Aktivitas.
* **Perbaikan Tambahan**:
  * Handler `handleDeleteLog`, `handleEditLog`, dan `handleAddLog` direfaktor agar menggabungkan perubahan `logs` dan `activityLogs` dalam **satu panggilan `syncWithNewState` tunggal** (atomik), menghindari race condition di mana `addActivityLog()` terpisah memicu sinkronisasi dengan data `logs` yang basi (*stale closure*).

### H. Data Lokal Tertimpa oleh Server Setelah Push (Stale Fetch After Push)
* **Gejala**: Perubahan data (tambah/hapus/edit) berhasil sesaat, lalu data kembali ke kondisi semula setelah indikator sinkronisasi berubah menjadi "Tersambung". Terutama terlihat pada operasi penghapusan.
* **Penyebab**: Alur `triggerSync` lama menjalankan `pushData` kemudian **langsung** menjalankan `fetchData` dalam satu siklus. Google Sheets memiliki jeda pemrosesan (*processing delay*), sehingga `fetchData` yang dijalankan segera setelah `pushData` mengembalikan data **sebelum** push diproses. Data lama dari server kemudian menimpa state lokal yang sudah benar melalui `setLogs(remoteData.logs)`.
* **Solusi**: 
  * Setelah `pushData` berhasil, `triggerSync` langsung melakukan `return` **tanpa** menjalankan `fetchData`.
  * Data lokal dianggap sebagai *source of truth* setelah push berhasil.
  * Penarikan data dari server (*pull*) hanya dilakukan pada siklus sinkronisasi latar belakang berkala (setiap 60 detik) di mana tidak ada perubahan lokal yang tertunda, sehingga Google Sheets sudah memiliki cukup waktu untuk memproses data.

### I. Gambar Dokumentasi Rapat (Meetings) Pecah / Tidak Tampil di Browser User Lain (Fasilitator)
* **Gejala**: Ketika Super Admin menambahkan foto dokumentasi rapat, gambar tersebut tampil normal di browser miliknya sendiri. Namun, saat user lain (misal: Fasilitator / Rizal) membuka agenda rapat tersebut, gambar dokumentasi rapat pecah/tidak tampil (menampilkan ikon gambar rusak dan teks alternatif *"Dokumentasi Rapat"*), sedangkan tautan unduhan jika diklik tetap berfungsi normal.
* **Penyebab**: 
  1. **Pemotongan Base64 di Google Sheets**: Awalnya, data gambar dikirim dalam format Base64 yang sangat panjang. Sel Google Sheets memiliki batas maksimal 50.000 karakter, sehingga string Base64 yang dikirim terpotong secara paksa dan menjadi korup di sisi server.
  2. **Skema Google Apps Script Belum Lengkap**: Skema `meetings` di Apps Script (`Code.gs`) belum didaftarkan untuk mengalihkan Base64 menjadi file di Google Drive.
  3. **Konflik Multi-Akun Google (403 Forbidden)**: Ketika diunggah ke Google Drive dan diset ke "Anyone with link can view", frontend mengonversi URL menjadi direct link `https://lh3.googleusercontent.com/d/FILE_ID`. Namun, di browser pengguna yang masuk ke banyak akun Google sekaligus, browser menyertakan cookie Google secara cross-origin. Google mencoba mengotorisasi request menggunakan akun default browser, yang berujung pada status **403 Forbidden** jika ada konflik kredensial. Sementara itu, jika link diklik, context-nya adalah *first-party* (tab baru) yang berhasil mengidentifikasi sesi aktif pengguna.
* **Solusi**:
  1. **Daftarkan dan Konversi di Apps Script**: Daftarkan skema `meetings` dan tambahkan handler di fungsi `doPost` Apps Script untuk mendeteksi `newItem.fotoKegiatan` bertipe Base64, mengunggahnya ke Google Drive, dan menyimpan link URL publiknya di Spreadsheet.
  2. **Gunakan Direct Image URL & Akses Anonim di Frontend**: Konversi URL Drive ke format direct image `https://lh3.googleusercontent.com/d/FILE_ID`. Agar request ini terhindar dari konflik multi-akun, tambahkan atribut `crossOrigin="anonymous"` pada tag `<img>` di frontend (`MeetingManagement.jsx`, `Dashboard.jsx`, `DailyLogs.jsx`). Hal ini memaksa browser mengambil gambar tanpa cookie, sehingga server Google menyajikan gambar secara publik dengan sukses (`200 OK`) berkat header `Access-Control-Allow-Origin: *`.

### J. Aplikasi Blank / Crash Saat Mengunggah Berkas Besar (QuotaExceededError di LocalStorage)
* **Gejala**: Ketika pengguna mencoba mengunggah dokumen berukuran antara 4MB hingga 10MB (misalnya dokumen personil KTP/CV/SK), tampilan aplikasi mendadak menjadi putih kosong (*blank screen*) dan tidak dapat merespons.
* **Penyebab**: 
  1. **Batasan Quota LocalStorage**: Browser membatasi kapasitas `localStorage` maksimal sebesar 5MB per asal (*origin*). Berkas 4MB jika dikonversi menjadi string Base64 ukurannya membengkak menjadi sekitar ~5.3MB.
  2. **Duplikasi Data di Log**: Saat berkas diunggah, data Base64 utuh yang berukuran besar dikirimkan ganda, baik ke state utama (`personnelDocs` / `schoolDocs` / `reports`) maupun ke riwayat aktivitas (`activityLogs`) yang disimpan ke `localStorage` tanpa penanganan kesalahan (*uncaught exception*).
* **Solusi**:
  1. **Optimalisasi Payload Log**: Modifikasi fungsi `handleAddReport`, `handleAddSchoolDoc`, dan `handleAddPersonnelDoc` agar **tidak menyertakan isi Base64 file** (`fileData`) pada log aktivitas yang dikirim ke `addActivityLog()`. Sebagai gantinya, log aktivitas hanya menyimpan referensi metadata dokumen saja.
  2. **Pencarian Berkas Dinamis**: Perbarui fungsi pembuka berkas `handleOpenActivityFile` di frontend agar secara dinamis mencari `fileData` dari state utama berdasarkan ID jika properti `fileData` tidak ada di entri log.
  3. **Global Proteksi Quota**: Tambahkan pembungkus (*wrapper*) global `try-catch` pada `localStorage.setItem` (di [main.jsx](file:///d:/repos/revitsd2026/src/main.jsx)) untuk mencegah aplikasi crash jika kuota penuh. Dengan proteksi ini, data tetap tersimpan di memori React state (in-memory) sehingga proses sinkronisasi ke Google Drive tetap dapat berjalan sukses. Setelah disinkronkan, server akan mengembalikan URL Drive pendek yang sangat kecil untuk menggantikan data Base64 lokal, sehingga membebaskan kapasitas penyimpanan `localStorage`.
