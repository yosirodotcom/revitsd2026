import React, { useState } from 'react';
import { Calendar, Info, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard({ activeUser, settings, onUpdateSettings }) {
  const [dates, setDates] = useState({
    projectStartDate: settings.projectStartDate || '2027-06-12',
    projectEndDate: settings.projectEndDate || '2027-12-12',
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings(dates);
    alert('Pengaturan linimasa proyek global berhasil diperbarui!');
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'Anda memegang kendali penuh atas sistem ini. Anda dapat mengelola tim pelaksana, memantau seluruh progres sekolah dan perjalanan dinas, serta mengonfigurasi pengaturan proyek global.';
      case 'Ketua Tim':
        return 'Anda bertanggung jawab atas koordinasi umum, penyusunan linimasa utama, pengesahan laporan, serta pengawasan kinerja seluruh tim pelaksana swakelola.';
      case 'Koordinator':
        return 'Tugas utama Anda adalah mensupervisi kinerja para fasilitator lapangan di wilayah kerja Anda, menyetujui laporan fisik dan verifikasi 50% & 100%, serta memecahkan kendala teknis.';
      case 'Fasilitator':
        return 'Anda adalah garda terdepan pendampingan sekolah dasar. Anda memantau progres konstruksi di lapangan secara mingguan, berkunjung pada progres 50% & 100%, serta melengkapi laporan berkala.';
      case 'Tenaga Administrasi':
        return 'Anda mengelola dokumentasi administrasi, memantau rekapitulasi pengeluaran (ATK, Perjalanan Dinas, Honor), serta melakukan pembayaran honor sesuai kelayakan progres laporan.';
      default:
        return 'Anggota tim pelaksana swakelola program revitalisasi sekolah dasar.';
    }
  };

  // Format Date to Local ID
  const formatLocalDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            Tahun Anggaran 2027
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight mt-3">
            Halo, {activeUser.nama}!
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mt-2">
            {getRoleDescription(activeUser.jabatanTim)}
          </p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Project Timeframe Info */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-indigo-400" /> Linimasa Proyek Aktif
            </h3>
            <div className="space-y-3">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <span className="block text-[10px] uppercase font-semibold text-slate-500">Mulai Pengerjaan</span>
                <span className="text-sm font-semibold text-slate-200">{formatLocalDate(settings.projectStartDate)}</span>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                <span className="block text-[10px] uppercase font-semibold text-slate-500">Target Selesai</span>
                <span className="text-sm font-semibold text-slate-200">{formatLocalDate(settings.projectEndDate)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/50 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> Acuan untuk checkpoint bulan ke-3 & ke-6.
          </div>
        </div>

        {/* Dynamic Controls / Actions based on Roles */}
        {activeUser.role === 'admin' ? (
          /* Super Admin Settings Form */
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:col-span-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-indigo-400" /> Pengaturan Linimasa Global (Super Admin)
            </h3>
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Mulai Proyek
                  </label>
                  <input
                    type="date"
                    value={dates.projectStartDate}
                    onChange={(e) => setDates({ ...dates, projectStartDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Selesai Proyek
                  </label>
                  <input
                    type="date"
                    value={dates.projectEndDate}
                    onChange={(e) => setDates({ ...dates, projectEndDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/10"
                >
                  Simpan Konfigurasi Tanggal
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* User Status Board */
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Status Kepegawaian Anda
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950/20 border border-slate-800/40 rounded-xl p-3 text-center">
                  <span className="block text-[9px] uppercase font-semibold text-slate-500">Jabatan Tim</span>
                  <span className="text-xs font-semibold text-indigo-400 mt-1 block">{activeUser.jabatanTim}</span>
                </div>
                <div className="bg-slate-950/20 border border-slate-800/40 rounded-xl p-3 text-center">
                  <span className="block text-[9px] uppercase font-semibold text-slate-500">Status Pegawai</span>
                  <span className="text-xs font-semibold text-emerald-400 mt-1 block">{activeUser.statusPegawai}</span>
                </div>
                <div className="bg-slate-950/20 border border-slate-800/40 rounded-xl p-3 text-center">
                  <span className="block text-[9px] uppercase font-semibold text-slate-500">Pendidikan</span>
                  <span className="text-xs font-semibold text-purple-400 mt-1 block">{activeUser.pendidikan}</span>
                </div>
                <div className="bg-slate-950/20 border border-slate-800/40 rounded-xl p-3 text-center">
                  <span className="block text-[9px] uppercase font-semibold text-slate-500">Akses Sistem</span>
                  <span className="text-xs font-semibold text-amber-400 mt-1 block">{activeUser.role === 'admin' ? 'Admin' : 'User'}</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-4 leading-relaxed bg-slate-950/30 border border-slate-800/50 rounded-xl p-3">
                <strong>Catatan Kepegawaian:</strong> {activeUser.jabatanKepegawaian !== '-' ? activeUser.jabatanKepegawaian : 'Personil lapangan non-staf dinas.'}
              </p>
            </div>
            <div className="text-[10px] text-indigo-400 mt-4 text-right italic font-medium select-none">
              Portal Revitalisasi SD 2027 • Menghubungkan Pengawas & Pelaksana
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
