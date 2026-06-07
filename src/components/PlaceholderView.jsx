import React from 'react';
import { Lock, FileCode, CheckCircle2, CircleDot } from 'lucide-react';

export default function PlaceholderView({ viewId }) {
  const getViewDetails = (id) => {
    switch (id) {
      case 'sekolah':
        return {
          title: 'Daftar Sekolah & Klaim Mandiri',
          phase: 'Fase 2',
          desc: 'Menu ini akan memuat 41 data sekolah dasar hasil pendampingan dari data_sekolah.csv. Fasilitator dapat mengklaim tanggung jawab sekolah, mengedit info dasar sekolah, dan memantau kemajuan pekerjaan.',
          tasks: [
            'Seeding 41 sekolah dari file CSV',
            'Filter Kabupaten & pencarian instan',
            'Alokasi mandiri / Klaim sekolah oleh Fasilitator',
            'Pengisian info dasar sekolah (Desa, Kecamatan, Kepala Sekolah, dll.)'
          ]
        };
      case 'kontak':
        return {
          title: 'Kelola Kontak Mitra Perencana/Pengawas',
          phase: 'Fase 3',
          desc: 'Menu normalisasi data eksternal. Admin dan pelaksana dapat mengelola daftar nama & kontak (HP) Perencana dan Pengawas lapangan secara terpusat untuk menghindari duplikasi data.',
          tasks: [
            'CRUD Data Kontak Mitra Terpusat',
            'Sinkronisasi nomor HP otomatis untuk seluruh sekolah terkait',
            'Dropdown pemilihan kontak dinamis pada form sekolah'
          ]
        };
      case 'tanggung-jawab':
        return {
          title: 'Pelaporan Tanggung Jawab Peran',
          phase: 'Fase 4',
          desc: 'Form pelaporan dinamis berdasarkan peran pelaksana (Ketua Tim, Koordinator, Fasilitator, Tenaga Administrasi). Anggota mengisi keterangan progres serta memperbarui status butir kewajiban resmi.',
          tasks: [
            'Pemuatan butir tugas resmi otomatis sesuai peran',
            'Input status progres (Belum, Proses, Selesai) per butir tugas',
            'Teks deskripsi laporan penyelesaian tugas harian'
          ]
        };
      case 'laporan-bulanan':
        return {
          title: 'Laporan Bulanan PDF (Fasilitator)',
          phase: 'Fase 4',
          desc: 'Area unggah laporan berkala bulanan khusus untuk Fasilitator. Mendukung unggah berkas PDF dengan validasi ketat format file dan batas ukuran file.',
          tasks: [
            'Unggah berkas khusus format PDF',
            'Konversi file ke Base64 untuk penyimpanan lokal',
            'Status riwayat laporan bulanan 1 s/d 6'
          ]
        };
      case 'dinas':
        return {
          title: 'Jadwal Perjalanan Dinas (Trigger Progres & Waktu)',
          phase: 'Fase 3 & 4',
          desc: 'Sistem deteksi perjalanan dinas otomatis (Fasilitator 5 hari, Koordinator 4 hari). Memicu jadwal wajib dinas saat progres sekolah mencapai 50% / 100% atau ketika proyek memasuki bulan ke-3 / ke-6.',
          tasks: [
            'Perhitungan wajib kunjungan I (50% / Bulan ke-3)',
            'Perhitungan wajib kunjungan II (100% / Bulan ke-6)',
            'Input tanggal dinas & laporan perjalanan dinas',
            'Antrean prioritas sekolah bermasalah untuk Koordinator'
          ]
        };
      case 'pantau-honor':
        return {
          title: 'Pantau & Bayar Honorarium (Tenaga Administrasi)',
          phase: 'Fase 4',
          desc: 'Dashboard pemantauan kelayakan pembayaran honorarium tim (Tetap, Output, Outcome). Kelayakan dihitung otomatis berdasarkan persentase kemajuan fisik sekolah binaan dan status reviu laporan.',
          tasks: [
            'Perhitungan kelayakan honor otomatis (Merah/Hijau)',
            'Syarat kelayakan Output (75% Sekolah >= 50% + Laporan direviu)',
            'Syarat kelayakan Outcome (90% Sekolah 100% + Laporan direviu)',
            'Tombol "Bayar" untuk mencatat pengeluaran otomatis'
          ]
        };
      case 'keuangan':
        return {
          title: 'Rekapitulasi Pengeluaran Keuangan (Tenaga Administrasi)',
          phase: 'Fase 4',
          desc: 'Rangkuman keuangan proyek. Menampilkan total anggaran terpakai, infografis persentase kategori, input manual biaya ATK, serta otomatisasi biaya Honor & Perjalanan Dinas.',
          tasks: [
            'Input manual pengeluaran kategori ATK',
            'Pencatatan otomatis pengeluaran Honor saat dibayar',
            'Pencatatan otomatis biaya Perjalanan Dinas saat disetujui',
            'Visualisasi diagram alokasi dana interaktif'
          ]
        };
      case 'pantau-tanggung-jawab':
        return {
          title: 'Pantau Tugas & Tanggung Jawab Tim (Super Admin)',
          phase: 'Fase 4',
          desc: 'Menu pemantauan terpusat untuk Super Admin. Admin dapat memantau grafik persentase penyelesaian kewajiban resmi anggota tim dan membaca draf laporan tertulis mereka.',
          tasks: [
            'Grafik progres tugas per anggota tim pelaksana',
            'Detail pembacaan laporan tertulis per butir tugas',
            'Dashboard monitoring kepatuhan swakelola'
          ]
        };
      default:
        return {
          title: 'Fitur Mendatang',
          phase: 'Fase Pengembangan',
          desc: 'Fitur ini sedang dirancang dan akan tersedia pada fase pengembangan berikutnya.',
          tasks: []
        };
    }
  };

  const details = getViewDetails(viewId);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-fade-in select-none">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 shadow-lg shadow-indigo-500/5">
        <Lock className="w-6 h-6 animate-pulse" />
      </div>

      <span className="text-[10px] font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase">
        Rencana {details.phase}
      </span>

      <h2 className="text-2xl font-bold text-slate-100 mt-4 tracking-tight">
        {details.title}
      </h2>

      <p className="text-sm text-slate-400 max-w-lg mt-2 leading-relaxed">
        {details.desc}
      </p>

      {details.tasks.length > 0 && (
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 text-left max-w-md w-full mt-6 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5" /> Agenda Pekerjaan Fase Ini:
          </h4>
          <ul className="space-y-2">
            {details.tasks.map((task, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>{task}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-8">
        <CircleDot className="w-3 h-3 text-slate-600" />
        <span>Sedang dalam tahap perencanaan desain frontend</span>
      </div>
    </div>
  );
}
