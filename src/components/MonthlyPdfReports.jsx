import React, { useState } from 'react';
import { FileText, Plus, Check, X, ShieldAlert, Award, FileSearch, Download, User, Calendar, Eye, Trash2, Link as LinkIcon, ExternalLink, Loader2, Edit3 } from 'lucide-react';

export default function MonthlyPdfReports({ 
  reports, 
  users, 
  activeUser, 
  onAddReport,
  onDeleteReport,
  onUpdateReportStatus,
  onlyMy = false,
  onlyReview = false
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [rejectingReportId, setRejectingReportId] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [approvingReportId, setApprovingReportId] = useState(null);
  const [approveNote, setApproveNote] = useState('');
  const uploadedMonths = reports.filter(r => r.userId === activeUser.id).map(r => r.bulanKe);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState('Semua');
  const [selectedFasilitatorFilter, setSelectedFasilitatorFilter] = useState('Semua');
  
  // Dual-mode toggle for roles that can upload AND review (e.g. Koordinator, Ketua Tim)
  const canUpload = !onlyReview && ['Ketua Tim', 'Koordinator', 'Fasilitator'].includes(activeUser.jabatanTim);
  const canReview = !onlyMy && ['Koordinator', 'Super Admin', 'Ketua Tim'].includes(activeUser.jabatanTim);
  const [subTab, setSubTab] = useState(onlyReview ? 'all' : 'my');

  // Hierarchical visibility helper
  const getVisibleUsersForReview = () => {
    const isSuperAdmin = activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin';
    if (isSuperAdmin) {
      return users.filter(u => u.role !== 'admin');
    }
    if (activeUser.jabatanTim === 'Ketua Tim') {
      return users.filter(u => u.id !== activeUser.id && u.role !== 'admin');
    }
    if (activeUser.jabatanTim === 'Koordinator') {
      return users.filter(u => u.jabatanTim === 'Fasilitator' && u.coordinatorId === activeUser.id);
    }
    return [];
  };

  const visibleUsers = getVisibleUsersForReview();
  const visibleUserIds = visibleUsers.map(u => u.id);

  const [formData, setFormData] = useState({
    bulanKe: 1,
    fileName: '',
    driveUrl: ''
  });
  const [isSavingReport, setIsSavingReport] = useState(false);

  const normalizeUrl = (url) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  };

  // Submit report link
  const handleSaveReport = async () => {
    const targetMonth = Number(formData.bulanKe);
    const formattedUrl = normalizeUrl(formData.driveUrl);
    
    if (!formattedUrl) {
      return window.showAlert('Link Google Drive wajib diisi!');
    }

    const exists = reports.some(r => r.userId === activeUser.id && r.bulanKe === targetMonth && (!editingReport || editingReport.bulanKe !== targetMonth));
    if (exists) {
      if (!await window.showConfirm(`Laporan untuk Bulan Ke-${targetMonth} sudah pernah dikirim. Apakah Anda ingin menindihnya?`)) {
        return;
      }
    }
    setIsSavingReport(true);
    try {
      const reportName = formData.fileName.trim() || `Laporan Bulanan Bulan Ke-${targetMonth}.pdf`;
      const newReport = {
        id: editingReport ? editingReport.id : `report-${activeUser.id}-bulan-${targetMonth}`,
        userId: activeUser.id,
        bulanKe: targetMonth,
        fileName: reportName,
        fileData: formattedUrl, // GDrive Link
        submittedAt: new Date().toISOString(),
        status: 'pending',
        note: ''
      };

      onAddReport(newReport);
      setFormData({ bulanKe: 1, fileName: '', driveUrl: '' });
      setIsAdding(false);
      setEditingReport(null);
      window.showAlert(`Link Laporan Bulan Ke-${targetMonth} berhasil disimpan.`);
    } finally {
      setIsSavingReport(false);
    }
  };

  // Safe opener: Opens GDrive link or legacy Blob in a NEW TAB
  const openPdf = (fileData, filename) => {
    try {
      if (!fileData) {
        return window.showAlert('Link dokumen tidak tersedia.');
      }
      if (typeof fileData === 'string' && fileData.startsWith('http')) {
        const newWindow = window.open(fileData, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          window.showAlert('Pop-up terblokir! Silakan izinkan pop-up untuk membuka file.');
        }
        return;
      }
      // Base64 legacy fallback
      const arr = fileData.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new Blob([u8arr], { type: mime });
      const fileUrl = URL.createObjectURL(file);
      const newWindow = window.open(fileUrl, '_blank');
      if (!newWindow) {
        window.showAlert('Pop-up terblokir! Silakan izinkan pop-up untuk membuka file.');
      }
    } catch (err) {
      console.error(err);
      window.showAlert('Gagal membuka file PDF');
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
    } else {
      if (selectedFasilitatorFilter !== 'Semua') {
        matchesUser = rep.userId === selectedFasilitatorFilter && visibleUserIds.includes(rep.userId);
      } else {
        matchesUser = visibleUserIds.includes(rep.userId);
      }
    }

    return matchesMonth && matchesUser;
  }).sort((a, b) => b.bulanKe - a.bulanKe); // Sort by month desc

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" /> {onlyReview ? 'Pantau & Reviu Laporan Tim' : 'Laporan Bulanan Saya'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {onlyReview 
              ? 'Reviu link Google Drive laporan bulanan dari fasilitator di bawah supervisi Anda untuk verifikasi pembayaran honorarium.' 
              : 'Kirim link Google Drive laporan bulanan Anda (Bulan 1 s/d 6) untuk verifikasi pembayaran honorarium.'}
          </p>
        </div>

        {canUpload && subTab === 'my' && !isAdding && (
          <button
            onClick={() => {
              const approvedMonths = reports.filter(r => r.userId === activeUser.id && r.status === 'approved').map(r => r.bulanKe);
              const available = [1, 2, 3, 4, 5, 6].filter(m => !approvedMonths.includes(m));
              if (available.length === 0) {
                window.showAlert('Semua laporan bulanan (Bulan 1 s/d 6) sudah disetujui.');
                return;
              }
              setEditingReport(null);
              setFormData({ bulanKe: available[0], fileName: '', driveUrl: '' });
              setIsAdding(true);
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Input Link Laporan Baru
          </button>
        )}
      </div>

      {/* Dual Mode Sub-Tabs */}
      {canUpload && canReview && (
        <div 
          className="flex bg-slate-900/60 border border-slate-800 rounded-xl p-1 select-none"
          style={{ width: '320px', minWidth: '320px' }}
        >
          <button
            onClick={() => { setSubTab('my'); setIsAdding(false); setEditingReport(null); }}
            className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              subTab === 'my' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Laporan Saya
          </button>
          <button
            onClick={() => { setSubTab('all'); setIsAdding(false); setEditingReport(null); }}
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
              {visibleUsers.map((f) => (
                <option key={f.id} value={f.id}>{f.nama} ({f.jabatanTim})</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Form Input Link GDrive */}
      {isAdding && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 max-w-xl animate-fade-in">
          <h3 className="font-semibold text-slate-200 text-base mb-4 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-400" /> {editingReport ? `Revisi Link Laporan Bulan Ke-${formData.bulanKe}` : 'Kirim Link Laporan Periodik Bulanan'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Bulan Laporan
                </label>
                <select
                  value={formData.bulanKe}
                  onChange={(e) => setFormData({ ...formData, bulanKe: Number(e.target.value) })}
                  disabled={!!editingReport}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const existingRep = reports.find(r => r.userId === activeUser.id && r.bulanKe === num);
                    const isApproved = existingRep?.status === 'approved';
                    let labelSuffix = '';
                    if (isApproved) labelSuffix = '(Sudah Disetujui)';
                    else if (existingRep?.status === 'rejected') labelSuffix = '(Perlu Perbaikan)';
                    else if (existingRep) labelSuffix = '(Pending - Tindih)';

                    return (
                      <option key={num} value={num} disabled={isApproved && (!editingReport || editingReport.bulanKe !== num)}>
                        Laporan Bulan Ke-{num} {labelSuffix}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nama / Judul Berkas (Opsional)
                </label>
                <input
                  type="text"
                  placeholder={`Laporan Bulanan Bulan ${formData.bulanKe}.pdf`}
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 py-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Link Google Drive Laporan <span className="text-indigo-400 font-bold">*Wajib</span>
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/xxx/view?usp=sharing"
                value={formData.driveUrl}
                onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Pastikan akses link Google Drive diatur ke "Siapa saja yang memiliki link" agar dapat diverifikasi oleh Koordinator.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-800/70">
              <p className="text-[10px] text-slate-500">
                Link laporan akan dibuka secara otomatis di <span className="text-indigo-400 font-semibold">Tab Baru</span> saat direviu.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ bulanKe: 1, fileName: '', driveUrl: '' });
                    setIsAdding(false);
                    setEditingReport(null);
                  }}
                  disabled={isSavingReport}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveReport}
                  disabled={isSavingReport || !formData.driveUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/30"
                >
                  {isSavingReport ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    <><LinkIcon className="w-4 h-4" /> Simpan Link</>
                  )}
                </button>
              </div>
            </div>
          </div>
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
                <th className="px-6 py-4">Link / Berkas Laporan GDrive</th>
                <th className="px-6 py-4">Tanggal Pengiriman</th>
                <th className="px-6 py-4">Status</th>
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
                  <td className="px-6 py-4 text-slate-300 text-xs max-w-xs">
                    <button
                      onClick={() => openPdf(rep.fileData, rep.fileName)}
                      className="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 truncate max-w-xs group cursor-pointer text-left"
                      title="Klik untuk membuka link Google Drive di Tab Baru"
                    >
                      <LinkIcon className="w-3.5 h-3.5 shrink-0 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="truncate underline underline-offset-2">{rep.fileName || `Laporan Bulan Ke-${rep.bulanKe}`}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 text-slate-500 group-hover:text-indigo-300" />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        {new Date(rep.submittedAt).toLocaleDateString('id-ID', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {rep.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg w-fit">
                          <Check className="w-3 h-3 text-emerald-400" /> Disetujui
                        </span>
                      )}
                      {rep.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg w-fit">
                          <X className="w-3 h-3 text-rose-450" /> Perlu Perbaikan
                        </span>
                      )}
                      {(rep.status === 'pending' || !rep.status) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg w-fit animate-pulse">
                          <Calendar className="w-3 h-3 text-amber-400" /> Pending
                        </span>
                      )}
                      {rep.note && (
                        <span className="text-[10px] text-rose-400 font-medium italic block max-w-[200px] truncate" title={rep.note}>
                          Catatan: {rep.note}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openPdf(rep.fileData, rep.fileName)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-indigo-400 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        title="Buka Link Google Drive di Tab Baru"
                      >
                        <ExternalLink className="w-4 h-4 text-emerald-400" />
                        <span className="hidden sm:inline">Buka Tab Baru</span>
                      </button>

                      {/* Reviewer Actions */}
                      {canReview && subTab === 'all' && (
                        <>
                          {rep.status !== 'approved' && (
                            <button
                              onClick={() => {
                                setApprovingReportId(rep.id);
                                setApproveNote('');
                              }}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-850 hover:border-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
                              title="Setujui Laporan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {rep.status !== 'rejected' && (
                            <button
                              onClick={() => {
                                setRejectingReportId(rep.id);
                                setRejectNote('');
                              }}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-rose-955/40 border border-slate-850 hover:border-rose-500/30 text-rose-450 transition-all cursor-pointer"
                              title="Kembalikan untuk Diperbaiki"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      {((subTab === 'my' && rep.userId === activeUser.id) || (!canReview && rep.userId === activeUser.id)) && (
                        <div className="flex items-center gap-2">
                          {(rep.status === 'rejected' || rep.status === 'pending' || !rep.status) && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingReport(rep);
                                  setFormData({
                                    bulanKe: rep.bulanKe,
                                    fileName: rep.fileName || '',
                                    driveUrl: rep.fileData || ''
                                  });
                                  setIsAdding(true);
                                }}
                                className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-950/40 border border-slate-850 hover:border-indigo-500/30 text-indigo-400 transition-all cursor-pointer flex items-center justify-center"
                                title="Edit Link Laporan GDrive"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={async () => {
                                  const label = rep.status === 'rejected' ? 'yang ditolak' : 'ini';
                                  if (await window.showConfirm(`Apakah Anda yakin ingin menghapus Laporan Bulan Ke-${rep.bulanKe} ${label}? Data juga akan dihapus dari Google Sheets.`)) {
                                    onDeleteReport(rep.id);
                                    window.showAlert(`Laporan Bulan Ke-${rep.bulanKe} berhasil dihapus.`);
                                  }
                                }}
                                className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-850 hover:border-rose-500/30 text-rose-450 hover:text-rose-400 transition-all cursor-pointer"
                                title="Hapus Laporan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={(subTab === 'all' || !canUpload) ? 6 : 5} className="px-6 py-10 text-center text-slate-500 font-semibold italic">
                    Belum ada link laporan GDrive yang dimasukkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input Catatan Perbaikan */}
      {rejectingReportId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative select-none animate-scale-in">
            <h3 className="text-base font-extrabold text-white mb-2">
              Kembalikan Laporan Bulanan
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Berikan catatan perbaikan agar pengirim mengetahui bagian laporan yang perlu diperbaiki.
            </p>
            
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Masukkan alasan pengembalian / instruksi perbaikan..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none font-['Outfit',sans-serif]"
              required
            />
            
            <div className="flex gap-2.5 w-full mt-4 justify-end">
              <button
                onClick={() => {
                  setRejectingReportId(null);
                  setRejectNote('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  if (!rejectNote.trim()) {
                    window.showAlert('Catatan perbaikan wajib diisi!');
                    return;
                  }
                  onUpdateReportStatus(rejectingReportId, 'rejected', rejectNote);
                  setRejectingReportId(null);
                  setRejectNote('');
                  window.showAlert('Laporan berhasil dikembalikan untuk diperbaiki.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-lg shadow-rose-650/10"
              >
                Kembalikan Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Catatan Persetujuan (Opsional) */}
      {approvingReportId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative select-none animate-scale-in">
            <h3 className="text-base font-extrabold text-white mb-2">
              Setujui Laporan Bulanan
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Anda dapat memberikan catatan atau pesan apresiasi (opsional) sebelum menyetujui laporan ini.
            </p>
            
            <textarea
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
              placeholder="Tulis catatan opsional atau pesan apresiasi..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none font-['Outfit',sans-serif]"
            />
            
            <div className="flex gap-2.5 w-full mt-4 justify-end">
              <button
                onClick={() => {
                  setApprovingReportId(null);
                  setApproveNote('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  onUpdateReportStatus(approvingReportId, 'approved', approveNote);
                  setApprovingReportId(null);
                  setApproveNote('');
                  window.showAlert('Laporan berhasil disetujui.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shadow-lg shadow-emerald-650/10"
              >
                Setujui Laporan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
