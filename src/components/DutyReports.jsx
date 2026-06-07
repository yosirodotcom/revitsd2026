import React, { useState } from 'react';
import { FileCheck, ShieldAlert, Check, X, Clipboard, Edit3, User, BarChart } from 'lucide-react';
import { roleDuties } from '../data/initialData';

export default function DutyReports({ 
  users, 
  activeUser, 
  dutyReports, 
  onSaveReport 
}) {
  const [editingItemIdx, setEditingItemIdx] = useState(null);
  const [selectedUserMonitor, setSelectedUserMonitor] = useState(null);

  const [formData, setFormData] = useState({
    status: 'belum',
    keterangan: ''
  });

  const isSuperAdmin = activeUser.role === 'admin';

  // Get active duties list for logged in user (if not Admin)
  const myDuties = roleDuties[activeUser.jabatanTim] || [];

  const getUserReports = (userId) => {
    return dutyReports.filter(r => r.userId === userId);
  };

  const getReportForItem = (userId, itemIndex) => {
    return dutyReports.find(r => r.userId === userId && r.dutyIndex === itemIndex) || {
      status: 'belum',
      keterangan: '',
      updatedAt: ''
    };
  };

  const handleEditClick = (itemIndex) => {
    const report = getReportForItem(activeUser.id, itemIndex);
    setEditingItemIdx(itemIndex);
    setFormData({
      status: report.status || 'belum',
      keterangan: report.keterangan || ''
    });
  };

  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (editingItemIdx === null) return;

    const reportId = `report-${activeUser.id}-${editingItemIdx}`;
    const newReport = {
      id: reportId,
      userId: activeUser.id,
      dutyIndex: editingItemIdx,
      status: formData.status,
      keterangan: formData.keterangan,
      updatedAt: new Date().toISOString()
    };

    onSaveReport(newReport);
    alert('Laporan tanggung jawab berhasil diperbarui!');
    setEditingItemIdx(null);
  };

  // Helper stats for monitor
  const getUserProgress = (userId, roleTim) => {
    const dutiesList = roleDuties[roleTim] || [];
    if (dutiesList.length === 0) return { pct: 0, text: '0/0' };

    const reports = getUserReports(userId);
    const completed = reports.filter(r => r.status === 'selesai').length;
    
    return {
      pct: Math.round((completed / dutiesList.length) * 100),
      text: `${completed} / ${dutiesList.length} Selesai`
    };
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-400" /> Tanggung Jawab & Kewajiban Peran
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin 
              ? 'Pantau tingkat kepatuhan dan laporan tanggung jawab resmi seluruh anggota tim pelaksana.'
              : `Daftar butir tanggung jawab resmi Anda sebagai ${activeUser.jabatanTim}. Harap laporkan progresnya secara berkala.`}
          </p>
        </div>
      </div>

      {/* SUPER ADMIN MONITORING DASHBOARD */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
          
          {/* User list with progress bars */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 space-y-4 h-fit">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BarChart className="w-4 h-4 text-indigo-400" /> Kepatuhan Anggota Tim
            </h3>
            
            <div className="space-y-2">
              {users.filter(u => u.role !== 'admin').map((user) => {
                const prog = getUserProgress(user.id, user.jabatanTim);
                const isSelected = selectedUserMonitor === user.id;

                return (
                  <div 
                    key={user.id}
                    onClick={() => setSelectedUserMonitor(user.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected 
                        ? 'bg-indigo-500/[0.03] border-indigo-500/30'
                        : 'bg-slate-950/40 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-200">{user.nama}</span>
                      <span className="text-[10px] text-indigo-400 font-semibold">{user.jabatanTim}</span>
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                        <span>Penyelesaian Tugas</span>
                        <span className="font-bold text-slate-400">{prog.text}</span>
                      </div>
                      <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${prog.pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drill down report viewer */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
            {selectedUserMonitor ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-200 text-sm">
                      Detail Laporan: {users.find(u => u.id === selectedUserMonitor)?.nama}
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Jabatan Tim: {users.find(u => u.id === selectedUserMonitor)?.jabatanTim}
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedUserMonitor(null)}
                    className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-850 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                {/* List of reports */}
                <div className="space-y-4 overflow-y-auto max-h-[450px] pr-1 no-scrollbar">
                  {(roleDuties[users.find(u => u.id === selectedUserMonitor)?.jabatanTim] || []).map((duty, idx) => {
                    const report = getReportForItem(selectedUserMonitor, idx + 1);

                    return (
                      <div key={idx} className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-900 border border-slate-800 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed flex-1">{duty}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase shrink-0 ${
                            report.status === 'selesai'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : report.status === 'proses'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                          }`}>
                            {report.status === 'selesai' && 'Terlaksana'}
                            {report.status === 'proses' && 'Proses'}
                            {report.status === 'belum' && 'Belum'}
                          </span>
                        </div>

                        {report.keterangan && (
                          <div className="bg-slate-900/60 p-2.5 border border-slate-900 rounded-lg italic text-[11px] text-slate-400">
                            " {report.keterangan} "
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <Clipboard className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-sm font-semibold">Silakan pilih salah satu anggota tim di panel kiri</p>
                <p className="text-xs text-slate-600 mt-1">Pilih anggota untuk memantau butir kewajiban lapangan mereka.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* INDIVIDUAL USER REPORTING LIST */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-semibold text-slate-200 text-sm mb-4 border-b border-slate-800 pb-2 select-none">
              Pelaporan Tanggung Jawab Saya
            </h3>

            <div className="space-y-4">
              {myDuties.map((duty, idx) => {
                const itemNum = idx + 1;
                const report = getReportForItem(activeUser.id, itemNum);
                const isEditingThis = editingItemIdx === itemNum;

                return (
                  <div 
                    key={idx}
                    className={`bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all rounded-2xl p-5 space-y-4 ${
                      isEditingThis ? 'ring-1 ring-indigo-500/20 bg-indigo-500/[0.01]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-950 border border-slate-850 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 select-none">
                          {itemNum}
                        </span>
                        <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal">{duty}</p>
                      </div>

                      <div className="flex items-center gap-2 select-none shrink-0 ml-auto sm:ml-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          report.status === 'selesai'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : report.status === 'proses'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-slate-800 text-slate-500 border border-slate-700/50'
                        }`}>
                          {report.status === 'selesai' && 'Terlaksana'}
                          {report.status === 'proses' && 'Dalam Proses'}
                          {report.status === 'belum' && 'Belum'}
                        </span>

                        {!isEditingThis && (
                          <button
                            onClick={() => handleEditClick(itemNum)}
                            className="p-1 rounded bg-slate-950 border border-slate-850 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {report.keterangan && !isEditingThis && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-3 border border-slate-900 rounded-xl italic">
                        " {report.keterangan} "
                      </p>
                    )}

                    {/* Inline Editor */}
                    {isEditingThis && (
                      <form onSubmit={handleSaveSubmit} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 animate-fade-in">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 select-none">
                          <span>Form Laporan Kewajiban</span>
                          <button type="button" onClick={() => setEditingItemIdx(null)} className="text-slate-600 hover:text-slate-400">Tutup</button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-1 select-none">
                            <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Status Progres</label>
                            <select
                              value={formData.status}
                              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                            >
                              <option value="belum">Belum Terlaksana</option>
                              <option value="proses">Dalam Proses</option>
                              <option value="selesai">Terlaksana</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Uraian / Bukti Hasil</label>
                            <input
                              type="text"
                              value={formData.keterangan}
                              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                              placeholder="Uraian tindakan yang sudah Anda lakukan..."
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingItemIdx(null)}
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:bg-slate-850"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Simpan Laporan
                          </button>
                        </div>
                      </form>
                    )}

                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mini Stat Card */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 select-none h-fit space-y-4">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider border-b border-slate-800 pb-2">
              Statistik Kepatuhan Saya
            </h3>
            
            {(() => {
              const myProg = getUserProgress(activeUser.id, activeUser.jabatanTim);
              return (
                <div className="text-center py-6 bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 border-2 border-indigo-500/20 flex items-center justify-center font-bold text-lg text-indigo-400 mx-auto">
                    {myProg.pct}%
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">Tugas Terpenuhi</span>
                    <span className="text-xs text-slate-300 font-semibold">{myProg.text}</span>
                  </div>
                </div>
              );
            })()}
            
            <p className="text-[10px] text-slate-500 leading-relaxed italic bg-slate-950/20 p-2.5 rounded-lg border border-slate-850">
              * Butir kewajiban di atas mengacu pada peraturan dinas swakelola Kementerian Pendidikan dan Kebudayaan.
            </p>
          </div>

        </div>
      )}

    </div>
  );
}
