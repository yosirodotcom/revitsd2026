import React, { useState } from 'react';
import { FileText, Plus, Check, X, ShieldAlert, Award, FileSearch, Download, User, Calendar } from 'lucide-react';

export default function MonthlyPdfReports({ 
  reports, 
  users, 
  activeUser, 
  onAddReport 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('Semua');
  const [selectedFasilitatorFilter, setSelectedFasilitatorFilter] = useState('Semua');
  
  // Dual-mode toggle for roles that can upload AND review (e.g. Koordinator, Ketua Tim)
  const canUpload = ['Ketua Tim', 'Koordinator', 'Fasilitator'].includes(activeUser.jabatanTim);
  const canReview = ['Koordinator', 'Super Admin', 'Ketua Tim'].includes(activeUser.jabatanTim);
  const [subTab, setSubTab] = useState(canUpload ? 'my' : 'all');

  const [formData, setFormData] = useState({
    bulanKe: 1,
    fileName: '',
    fileData: ''
  });

  // Handle PDF upload conversion to Base64
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return alert('Hanya berkas berformat PDF (.pdf) yang diperbolehkan!');
    }

    // Size limit of 1.5MB for LocalStorage protection
    if (file.size > 1.5 * 1024 * 1024) {
      return alert('Ukuran file PDF terlalu besar! Maksimal ukuran file adalah 1.5MB untuk kebutuhan demo lokal ini.');
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      setFormData((prev) => ({
        ...prev,
        fileName: file.name,
        fileData: event.target.result // Base64 data URL
      }));
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fileData) return alert('Silakan pilih berkas PDF terlebih dahulu');

    // Check if report for this month already exists
    const exists = reports.some(r => r.userId === activeUser.id && r.bulanKe === Number(formData.bulanKe));
    if (exists) {
      if (!window.confirm(`Laporan untuk Bulan Ke-${formData.bulanKe} sudah pernah dikirim. Apakah Anda ingin menindihnya?`)) {
        return;
      }
    }

    const newReport = {
      id: `report-${activeUser.id}-bulan-${formData.bulanKe}`,
      userId: activeUser.id,
      bulanKe: Number(formData.bulanKe),
      fileName: formData.fileName,
      fileData: formData.fileData,
      submittedAt: new Date().toISOString()
    };

    onAddReport(newReport);
    alert(`Laporan Bulanan Ke-${formData.bulanKe} berhasil dikirim!`);
    setFormData({ bulanKe: 1, fileName: '', fileData: '' });
    setIsAdding(false);
  };

  // Safe PDF opener from Base64 Data URL (converts to Blob first to avoid browser security blockages)
  const openPdf = (base64Data, filename) => {
    try {
      const arr = base64Data.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new Blob([u8arr], { type: mime });
      const fileUrl = URL.createObjectURL(file);
      window.open(fileUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Gagal membuka file PDF');
    }
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.nama : 'Anggota';
  };

  // Filters logic for reports
  const filteredReports = reports.filter((rep) => {
    const matchesMonth = selectedMonthFilter === 'Semua' || rep.bulanKe === Number(selectedMonthFilter);
    
    let matchesUser = true;
    if (canUpload && subTab === 'my') {
      matchesUser = rep.userId === activeUser.id;
    } else if (selectedFasilitatorFilter !== 'Semua') {
      matchesUser = rep.userId === selectedFasilitatorFilter;
    } else if (activeUser.jabatanTim === 'Koordinator') {
      // Koordinator sees all facilitators' reports (not including own unless selected)
      matchesUser = rep.userId !== activeUser.id;
    }

    return matchesMonth && matchesUser;
  }).sort((a, b) => b.bulanKe - a.bulanKe); // Sort by month desc

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" /> Laporan Bulanan Periodik (PDF)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kirim atau pantau berkas PDF laporan bulanan (Bulan 1 s/d 6) untuk verifikasi pembayaran honorarium.
          </p>
        </div>

        {canUpload && subTab === 'my' && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Unggah Laporan Baru
          </button>
        )}
      </div>

      {/* Dual Mode Sub-Tabs */}
      {canUpload && canReview && (
        <div className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 max-w-xs select-none">
          <button
            onClick={() => { setSubTab('my'); setIsAdding(false); }}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'my' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Laporan Saya
          </button>
          <button
            onClick={() => { setSubTab('all'); setIsAdding(false); }}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pantau Laporan Tim
          </button>
        </div>
      )}

      {/* Reviewer Filter Controls */}
      {canReview && (subTab === 'all' || !canUpload) && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 select-none animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Filter Bulan:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="Semua">Semua Bulan</option>
              {[1,2,3,4,5,6].map(m => (
                <option key={m} value={m}>Bulan Ke-{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Filter Pengirim:</span>
            <select
              value={selectedFasilitatorFilter}
              onChange={(e) => setSelectedFasilitatorFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="Semua">Semua Anggota</option>
              {users.filter(u => u.id !== activeUser.id && u.role !== 'admin').map((f) => (
                <option key={f.id} value={f.id}>{f.nama} ({f.jabatanTim})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Form Upload */}
      {isAdding && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 max-w-xl">
          <h3 className="font-semibold text-slate-200 text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" /> Kirim Laporan Periodik Bulanan
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Bulan Laporan
                </label>
                <select
                  value={formData.bulanKe}
                  onChange={(e) => setFormData({ ...formData, bulanKe: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      Laporan Bulan Ke-{num}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Berkas PDF (Maks 1.5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 py-2.5"
                  required
                />
              </div>
            </div>

            {formData.fileName && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 text-xs text-indigo-400 font-mono flex items-center gap-2 select-none">
                <FileText className="w-4 h-4" /> {formData.fileName} (Berkas siap dikirim)
              </div>
            )}

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => {
                  setFormData({ bulanKe: 1, fileName: '', fileData: '' });
                  setIsAdding(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!formData.fileData}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <Check className="w-4 h-4" /> Kirim Laporan PDF
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Table/Grid */}
      <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider select-none">
              <tr>
                {(subTab === 'all' || !canUpload) && <th className="px-6 py-4">Nama Pengirim</th>}
                <th className="px-6 py-4">Periode Laporan</th>
                <th className="px-6 py-4">Nama File PDF</th>
                <th className="px-6 py-4">Tanggal Pengiriman</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-900/20 transition-colors">
                  {(subTab === 'all' || !canUpload) && (
                    <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <span>{getUserName(rep.userId)}</span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg">
                      Bulan Ke-{rep.bulanKe}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs max-w-xs truncate">
                    {rep.fileName}
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs flex items-center gap-1.5 mt-2.5 md:mt-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(rep.submittedAt).toLocaleDateString('id-ID', {
                      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openPdf(rep.fileData, rep.fileName)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Lihat PDF
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={(subTab === 'all' || !canUpload) ? 5 : 4} className="px-6 py-10 text-center text-slate-500 font-semibold italic">
                    Belum ada laporan PDF bulanan yang diunggah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
