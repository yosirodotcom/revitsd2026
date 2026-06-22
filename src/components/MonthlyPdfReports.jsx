import React, { useState } from 'react';
import { FileText, Plus, Check, X, ShieldAlert, Award, FileSearch, Download, User, Calendar, Eye, Trash2, Pencil } from 'lucide-react';

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
    fileData: ''
  });
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');

  // Handle PDF upload conversion to Base64 and auto-submit
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      e.target.value = '';
      return window.showAlert('Hanya berkas berformat PDF (.pdf) yang diperbolehkan!');
    }

    // Size limit of 10MB for LocalStorage protection
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
          reader.onload = async (event) => {
            const targetMonth = Number(formData.bulanKe);
            // Check if report for this month already exists
            const exists = reports.some(r => r.userId === activeUser.id && r.bulanKe === targetMonth);
            if (exists) {
              if (!await window.showConfirm(`Laporan untuk Bulan Ke-${targetMonth} sudah pernah dikirim. Apakah Anda ingin menindihnya?`)) {
                e.target.value = '';
                setUploadProgress(null);
                setUploadFileName('');
                return;
              }
            }

            const newReport = {
              id: `report-${activeUser.id}-bulan-${targetMonth}`,
              userId: activeUser.id,
              bulanKe: targetMonth,
              fileName: file.name,
              fileData: event.target.result, // Base64 data URL
              submittedAt: new Date().toISOString(),
              status: 'pending',
              note: ''
            };

            onAddReport(newReport);
            setFormData({ bulanKe: 1, fileName: '', fileData: '' });
            e.target.value = '';
            setUploadProgress(null);
            setUploadFileName('');
            setIsAdding(false);
          };
          return 100;
        }
        return next;
      });
    }, 150);
  };

  const handleEditReportFileChange = (reportId, e) => {
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

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const rep = reports.find(r => r.id === reportId);
      if (!rep) return;

      const updatedReport = {
        ...rep,
        fileName: file.name,
        fileData: event.target.result,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        note: ''
      };

      onAddReport(updatedReport);
      e.target.value = '';
      window.showAlert(`Laporan Bulan Ke-${rep.bulanKe} berhasil diperbarui.`);
    };
  };

  // Safe PDF opener from Base64 Data URL (converts to Blob first to avoid browser security blockages)
  const openPdf = (base64Data, filename) => {
    try {
      if (base64Data && base64Data.startsWith('http')) {
        const newWindow = window.open(base64Data, '_blank');
        if (!newWindow) {
          window.showAlert('Pop-up terblokir! Silakan izinkan pop-up untuk membuka file.');
        }
        return;
      }
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
            <FileText className="w-6 h-6 text-indigo-400" /> {onlyReview ? 'Pantau & Reviu Laporan Tim (PDF)' : 'Laporan Bulanan Saya (PDF)'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {onlyReview 
              ? 'Reviu berkas PDF laporan bulanan dari fasilitator di bawah supervisi Anda untuk verifikasi pembayaran honorarium.' 
              : 'Kirim berkas PDF laporan bulanan Anda (Bulan 1 s/d 6) untuk verifikasi pembayaran honorarium.'}
          </p>
        </div>

        {canUpload && subTab === 'my' && !isAdding && (
          <button
            onClick={() => {
              const uploaded = reports.filter(r => r.userId === activeUser.id).map(r => r.bulanKe);
              const available = [1, 2, 3, 4, 5, 6].filter(m => !uploaded.includes(m));
              if (available.length === 0) {
                window.showAlert('Semua laporan bulanan (Bulan 1 s/d 6) sudah diunggah.');
                return;
              }
              setFormData({ bulanKe: available[0], fileName: '', fileData: '' });
              setIsAdding(true);
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Unggah Laporan Baru
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
              {visibleUsers.map((f) => (
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
          <div className="space-y-4">
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
                  {[1, 2, 3, 4, 5, 6].map((num) => {
                    const isUploaded = uploadedMonths.includes(num);
                    return (
                      <option key={num} value={num} disabled={isUploaded}>
                        Laporan Bulan Ke-{num} {isUploaded ? '(Sudah diunggah)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Berkas PDF (Maks 10MB)
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 py-2.5"
                    required
                  />
                )}
              </div>
            </div>

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
                <th className="px-6 py-4">Nama File PDF</th>
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
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs max-w-xs truncate">
                    {rep.fileName}
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
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-indigo-400 transition-all cursor-pointer"
                        title="Lihat PDF"
                      >
                        <Eye className="w-4 h-4" />
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
                            <label
                              className="p-2 rounded-xl bg-slate-950 hover:bg-indigo-950/40 border border-slate-855 hover:border-indigo-500/30 text-indigo-400 transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Edit / Unggah Ulang PDF Laporan"
                            >
                              <Pencil className="w-4 h-4" />
                              <input
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={(e) => handleEditReportFileChange(rep.id, e)}
                              />
                            </label>
                          )}

                          {rep.status === 'rejected' && (
                            <button
                              onClick={async () => {
                                if (await window.showConfirm(`Apakah Anda yakin ingin menghapus Laporan Bulan Ke-${rep.bulanKe} yang ditolak ini?`)) {
                                  onDeleteReport(rep.id);
                                  window.showAlert(`Laporan Bulan Ke-${rep.bulanKe} berhasil dihapus.`);
                                }
                              }}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-850 hover:border-rose-500/30 text-rose-450 transition-all cursor-pointer"
                              title="Hapus Laporan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                    Belum ada laporan PDF bulanan yang diunggah.
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
