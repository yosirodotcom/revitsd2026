import React, { useState } from 'react';
import { X, FileText, Plus, Eye, Trash2, Calendar, CheckCircle2, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function MemberReportsModal({ 
  user, 
  reports = [], 
  onClose, 
  onAddReport, 
  onDeleteReport 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ bulanKe: 1, fileName: '', driveUrl: '' });

  const normalizeUrl = (url) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  };

  const handleSaveReportLink = (e) => {
    e.preventDefault();
    const targetMonth = Number(formData.bulanKe);
    const formattedUrl = normalizeUrl(formData.driveUrl);

    if (!formattedUrl) {
      return window.showAlert('Link Google Drive wajib diisi!');
    }

    const reportName = formData.fileName.trim() || `Laporan Bulan Ke-${targetMonth}.pdf`;
    const newReport = {
      id: `report-${user.id}-bulan-${targetMonth}`,
      userId: user.id,
      bulanKe: targetMonth,
      fileName: reportName,
      fileData: formattedUrl, // GDrive URL
      submittedAt: new Date().toISOString()
    };

    onAddReport(newReport);
    setIsAdding(false);
    setFormData({ bulanKe: 1, fileName: '', driveUrl: '' });
    window.showAlert(`Link Laporan Bulan Ke-${targetMonth} berhasil disimpan.`);
  };

  const handleOpenPdf = (rep) => {
    try {
      if (!rep || !rep.fileData) return window.showAlert('Link laporan tidak tersedia.');
      if (typeof rep.fileData === 'string' && rep.fileData.startsWith('http')) {
        const win = window.open(rep.fileData, '_blank', 'noopener,noreferrer');
        if (!win) window.showAlert('Pop-up terblokir! Silakan izinkan pop-up di browser.');
        return;
      }
      // Base64 legacy fallback
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
              <span>Kelola Dokumen Pelaporan (GDrive)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mengelola Link Laporan Bulanan milik: <strong className="text-slate-200">{user.nama}</strong>
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
              <h4 className="font-semibold text-slate-200 text-xs">Informasi Laporan GDrive</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Masukkan link Google Drive berkas laporan bulanan. Klik pada laporan akan secara otomatis membuka dokumen di Tab Baru.
              </p>
            </div>
          </div>

          {isAdding ? (
            <form onSubmit={handleSaveReportLink} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-400" /> Input Link Laporan Baru
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
                    Nama / Judul Berkas (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder={`Laporan Bulan Ke-${formData.bulanKe}.pdf`}
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Link Google Drive *Wajib
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/xxx/view"
                  value={formData.driveUrl}
                  onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-450 hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-all shadow"
                >
                  Simpan Link
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                const uploaded = reports.map(r => r.bulanKe);
                const available = [1, 2, 3, 4, 5, 6].filter(m => !uploaded.includes(m));
                if (available.length === 0) {
                  return window.showAlert('Semua laporan bulanan (Bulan 1 s/d 6) sudah diunggah.');
                }
                setFormData({ bulanKe: available[0], fileName: '', driveUrl: '' });
                setIsAdding(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-850 hover:border-indigo-500/40 bg-slate-950/30 hover:bg-slate-950/60 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Input Link Laporan Bulanan Baru
            </button>
          )}

          {/* List of reports */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daftar Link Laporan GDrive</h4>
            {reports.length > 0 ? (
              <div className="space-y-2">
                {reports.map((rep) => (
                  <div 
                    key={rep.id} 
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                        <LinkIcon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => handleOpenPdf(rep)}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 truncate pr-2 flex items-center gap-1 group text-left"
                          title="Buka di Tab Baru"
                        >
                          <span className="truncate underline underline-offset-2">{rep.fileName || `Laporan Bulan Ke-${rep.bulanKe}`}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 shrink-0" />
                        </button>
                        <p className="text-[9px] text-slate-500 font-medium mt-0.5 truncate max-w-md">
                          Bulan Ke-{rep.bulanKe} • {new Date(rep.submittedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => handleOpenPdf(rep)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-455 hover:text-indigo-400 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                        title="Buka Link GDrive di Tab Baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Buka</span>
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
                Belum ada link GDrive laporan bulanan yang dimasukkan.
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
