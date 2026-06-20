import React, { useState } from 'react';
import { X, FileText, Plus, Eye, Trash2, Calendar, CheckCircle2 } from 'lucide-react';

export default function MemberReportsModal({ 
  user, 
  reports = [], 
  onClose, 
  onAddReport, 
  onDeleteReport 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ bulanKe: 1 });
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      e.target.value = '';
      return window.showAlert('Hanya berkas berformat PDF (.pdf) yang diperbolehkan!');
    }

    if (file.size > 10 * 1024 * 1024) {
      e.target.value = '';
      return window.showAlert('Ukuran file PDF terlalu besar! Maksimal ukuran file adalah 10MB.');
    }

    setUploadFileName(file.name);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        const next = prev + 20;
        if (next >= 100) {
          clearInterval(interval);
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const targetMonth = Number(formData.bulanKe);
            const newReport = {
              id: `report-${user.id}-bulan-${targetMonth}`,
              userId: user.id,
              bulanKe: targetMonth,
              fileName: file.name,
              fileData: event.target.result, // Base64
              submittedAt: new Date().toISOString()
            };

            onAddReport(newReport);
            setIsAdding(false);
            setUploadProgress(null);
            setUploadFileName('');
          };
          return 100;
        }
        return next;
      });
    }, 150);
  };

  const handleOpenPdf = (rep) => {
    try {
      const arr = rep.fileData.split(',');
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
      window.showAlert('Gagal membuka file PDF');
    }
  };

  const handleDeleteClick = async (rep) => {
    if (await window.showConfirm(`Apakah Anda yakin ingin menghapus Laporan Bulan Ke-${rep.bulanKe} milik "${user.nama}"?`)) {
      onDeleteReport(rep.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Kelola Dokumen Pelaporan (PDF)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mengelola Laporan Bulanan PDF milik: <strong className="text-slate-200">{user.nama}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-350 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200 text-xs">Informasi Laporan</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Batas maksimal ukuran file PDF adalah 1.5MB. Laporan ini digunakan untuk rekap payroll dan evaluasi progres bulanan.
              </p>
            </div>
          </div>

          {isAdding ? (
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Unggah Laporan Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Periode Bulan
                  </label>
                  <select
                    value={formData.bulanKe}
                    onChange={(e) => setFormData({ ...formData, bulanKe: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((m) => {
                      const exists = reports.some(r => r.bulanKe === m);
                      return (
                        <option key={m} value={m} disabled={exists}>
                          Laporan Bulan Ke-{m} {exists ? '(Sudah Ada)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Berkas PDF (Maks 10MB)
                  </label>
                  {uploadProgress !== null ? (
                    <div className="space-y-1.5 pt-1.5">
                      <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                        <span className="truncate max-w-[120px] text-indigo-300">{uploadFileName}</span>
                        <span className="text-indigo-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-150"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-450 hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const uploaded = reports.map(r => r.bulanKe);
                const available = [1, 2, 3, 4, 5, 6].filter(m => !uploaded.includes(m));
                if (available.length === 0) {
                  return window.showAlert('Semua laporan bulanan (Bulan 1 s/d 6) sudah diunggah.');
                }
                setFormData({ bulanKe: available[0] });
                setIsAdding(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-850 hover:border-indigo-500/40 bg-slate-950/30 hover:bg-slate-950/60 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Unggah Laporan Bulanan Baru
            </button>
          )}

          {/* List of reports */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Berkas PDF Terunggah</h4>
            {reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((rep) => (
                  <div 
                    key={rep.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate pr-2">
                          Laporan Bulan Ke-{rep.bulanKe}
                        </p>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 truncate max-w-md" title={rep.fileName}>
                          {rep.fileName} • {new Date(rep.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => handleOpenPdf(rep)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-455 hover:text-indigo-400 transition-all cursor-pointer"
                        title="Buka PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(rep)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-rose-900/40 text-rose-455 hover:text-rose-400 transition-all cursor-pointer"
                        title="Hapus Laporan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-550 italic text-center py-6 border border-slate-850 rounded-xl bg-slate-950/10">
                Belum ada berkas PDF laporan bulanan yang diunggah.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/20 border-t border-slate-800/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-slate-200 transition-colors cursor-pointer"
          >
            Tutup Dialog
          </button>
        </div>
      </div>
    </div>
  );
}
