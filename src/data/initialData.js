// Data awal anggota tim pelaksana swakelola program revitalisasi SD 2026
export const initialUsers = [
  {
    id: "yosi-ronadi",
    nama: "Yosi Ronadi",
    jabatanKepegawaian: "Super Admin",
    jabatanTim: "Super Admin",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "admin",
    password: "4051"
  },
  {
    id: "etty-rabihati",
    nama: "Etty Rabihati",
    jabatanKepegawaian: "Ketua Jurusan Teknik Sipil",
    jabatanTim: "Ketua Tim",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "user",
    password: "sipil"
  },
  {
    id: "chandra-bayu",
    nama: "Chandra Bayu",
    jabatanKepegawaian: "Ketua Jurusan Teknik Arsitektur",
    jabatanTim: "Koordinator",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "user",
    password: "arsitektur"
  },
  {
    id: "rizal",
    nama: "Rizal",
    jabatanKepegawaian: "Kepala Bengkel Teknik Sipil / Dosen Teknik Sipil",
    jabatanTim: "Fasilitator",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "user"
  },
  {
    id: "hartanto-wahyu-sasongko",
    nama: "Hartanto Wahyu Sasongko",
    jabatanKepegawaian: "Dosen Teknik Sipil",
    jabatanTim: "Fasilitator",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "user"
  },
  {
    id: "dian-perwita-sari",
    nama: "Dian Perwita Sari",
    jabatanKepegawaian: "Dosen Teknik Arsitektur",
    jabatanTim: "Fasilitator",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "user"
  },
  {
    id: "dewi-ria-indriana",
    nama: "Dewi Ria Indriana",
    jabatanKepegawaian: "Dosen Teknik Arsitektur",
    jabatanTim: "Fasilitator",
    pendidikan: "Strata 2",
    statusPegawai: "PPPK",
    role: "user"
  },
  {
    id: "achmad-idris-setianto",
    nama: "Achmad Idris Setianto",
    jabatanKepegawaian: "-",
    jabatanTim: "Fasilitator",
    pendidikan: "Strata 2",
    statusPegawai: "Alumni",
    role: "user"
  },
  {
    id: "ahmad-maulana-iqbal",
    nama: "Ahmad Maulana Iqbal",
    jabatanKepegawaian: "-",
    jabatanTim: "Fasilitator",
    pendidikan: "Diploma",
    statusPegawai: "Alumni",
    role: "user"
  },
  {
    id: "wida-arindya-sari",
    nama: "Wida Arindya Sari",
    jabatanKepegawaian: "Dosen Akuntansi",
    jabatanTim: "Tenaga Administrasi",
    pendidikan: "Strata 2",
    statusPegawai: "PNS",
    role: "user"
  }
];

// Data tugas & tanggung jawab statis berdasarkan peran
export const roleDuties = {
  "Ketua Tim": [
    "Menyusun rencana dan linimasa kerja kegiatan pendampingan Bantuan Pemerintah Revitalisasi Sekolah Dasar.",
    "Memimpin/mengoordinasikan dan bertanggung jawab terhadap kinerja seluruh tim.",
    "Memastikan pekerjaan seluruh Tim Pelaksana Swakelola berjalan sesuai dengan rencana kerja dan lingkup pekerjaan, termasuk penyelesaian masalah dalam pelaksanaan program ini.",
    "Mengesahkan laporan hasil pelaksanaan pekerjaan Tim Pelaksana Swakelola, hasil pelaksanaan pendampingan di seluruh wilayah kerjanya, dan pembinaan teknis.",
    "Melakukan koordinasi hasil pendampingan Program Revitalisasi Satuan Pendidikan kepada instansi terkait.",
    "Menyusun dan melaporkan hasil pekerjaan pendampingan."
  ],
  "Koordinator": [
    "Mengoordinasikan penugasan Fasilitator.",
    "Mendampingi paling banyak 11 fasilitator sesuai wilayah kerjanya.",
    "Berkoordinasi dengan Tenaga Ahli Pusat dalam pelaksanaan teknis pendampingan Bantuan Pemerintah Revitalisasi Sekolah Dasar.",
    "Melakukan supervisi kepada fasilitator dalam pelaksanaan Bantuan Pemerintah Revitalisasi Sekolah Dasar.",
    "Memvalidasi dan menyetujui hasil verifikasi progres dan laporan, kesesuaian antara pelaksanaan dan panduan, progres fisik 50%, serta penyelesaian 100% pekerjaan revitalisasi Sekolah Dasar yang disampaikan oleh Fasilitator.",
    "Melakukan kunjungan lapangan sebanyak dua kali sesuai dengan ketentuan kunjungan.",
    "Memberikan rekomendasi penyelesaian masalah terkait pelaksanaan program Revitalisasi yang terjadi di lapangan.",
    "Memantau kemajuan pelaksanaan program dan menyusun laporan periodik tim pelaksana swakelola.",
    "Menilai dan bertanggung jawab atas kinerja fasilitator."
  ],
  "Fasilitator": [
    "Mendampingi paling banyak 8 sekolah dasar di wilayah kerjanya.",
    "Mengikuti persiapan dan melaksanakan sosialisasi mekanisme pelaksanaan dan pelaporan program Bantuan Pemerintah Revitalisasi Sekolah Dasar, termasuk penggunaan aplikasi, teknis pelaksanaan pekerjaan, dan bentuk pelaporan.",
    "Mereviu perubahan gambar rencana kerja, rencana anggaran biaya, rencana kerja dan syarat-syarat yang disusun oleh Tim Teknis P2SP, jika ada.",
    "Melaporkan dan mengonsultasikan hasil reviu perubahan perencanaan kepada Koordinator.",
    "Mendampingi dan memastikan kesesuaian teknis pelaksanaan serta kelengkapan dan kesesuaian format laporan dengan panduan pelaksanaan, yang meliputi: a) pendahuluan; dan b) kemajuan mingguan dan bulanan dari sekolah dasar.",
    "Melakukan kunjungan lapangan sebanyak 2 (dua) kali, sesuai dengan ketentuan perjalanan dinas untuk memverifikasi progres, mencatat kendala di lapangan, dan memverifikasi penyelesaian pekerjaan.",
    "Memverifikasi progres 50% dan laporan pelaksanaan pekerjaan untuk pencairan Tahap II.",
    "Mengidentifikasi dan memberikan rekomendasi penyelesaian permasalahan yang ada di sekolah dasar atas persetujuan Koordinator.",
    "Memverifikasi penyelesaian 100% pekerjaan Bantuan Pemerintah Revitalisasi Sekolah Dasar dan laporan akhir.",
    "Mendampingi dan memastikan kesiapan sekolah dasar dalam proses serah terima aset sampai dengan ditandatanganinya berita acara serah terima antara sekolah dasar dengan PPK dan sekolah dasar dengan dinas/yayasan.",
    "Menyampaikan laporan periodik fasilitator secara berkala (mingguan) kepada Koordinator."
  ],
  "Tenaga Administrasi": [
    "Mendukung administrasi surat-menyurat, pengarsipan berkas pelaporan, dan dokumentasi rapat tim pelaksana swakelola.",
    "Mengelola rekapitulasi anggaran dan memantau kelayakan pembayaran honorarium anggota tim pelaksana swakelola."
  ]
};
