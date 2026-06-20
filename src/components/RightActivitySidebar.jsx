import React, { useState } from 'react';
import { 
  X, Calendar, FileText, UploadCloud, Trash2, 
  TrendingUp, ListTodo, Activity, Clock, Eye, ShieldAlert, Filter, Send, Paperclip 
} from 'lucide-react';

export default function RightActivitySidebar({ 
  isOpen, 
  onClose, 
  logs = [], 
  onOpenFile,
  onAddManualLog
}) {
  const [filterType, setFilterType] = useState('range'); // 'range' | 'month'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [manualLogText, setManualLogText] = useState('');
  const [manualLogFile, setManualLogFile] = useState(null);
  const [manualLogFileName, setManualLogFileName] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      if (window.showAlert) window.showAlert('Ukuran berkas maksimal 10MB');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setManualLogFile(reader.result);
      setManualLogFileName(file.name);
    };
  };

  const handleManualLogSubmit = (e) => {
    e.preventDefault();
    if (!manualLogText.trim() || !onAddManualLog) return;
    
    let fileRef = null;
    if (manualLogFile) {
      fileRef = {
        fileName: manualLogFileName,
        fileData: manualLogFile
      };
    }
    
    onAddManualLog(manualLogText.trim(), fileRef);
    setManualLogText('');
    setManualLogFile(null);
    setManualLogFileName('');
  };

  const isFilterActive = (filterType === 'range' && (startDate || endDate)) || (filterType === 'month' && selectedMonth);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
  };

  const formatTimestamp = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace('.', ':');
    } catch (e) {
      return isoString;
    }
  };

  // Filter logs based on filterType
  const filteredLogs = logs.filter(log => {
    if (!log || !log.timestamp) return false;
    const logDateStr = log.timestamp.split('T')[0]; // YYYY-MM-DD
    
    if (filterType === 'range') {
      if (startDate && logDateStr < startDate) return false;
      if (endDate && logDateStr > endDate) return false;
      return true;
    } else if (filterType === 'month') {
      if (!selectedMonth) return true;
      return logDateStr.startsWith(selectedMonth);
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Helper to choose the right icon for each action type
  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'upload_personnel_doc':
      case 'upload_monthly_report':
      case 'upload_school_doc':
        return <UploadCloud className="w-4 h-4 text-indigo-400" />;
      case 'delete_personnel_doc':
      case 'delete_monthly_report':
      case 'delete_school_doc':
        return <Trash2 className="w-4 h-4 text-rose-455" />;
      case 'update_progress':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'claim_school':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'add_task':
      case 'update_task':
        return <ListTodo className="w-4 h-4 text-sky-400" />;
      case 'delete_task':
        return <Trash2 className="w-4 h-4 text-rose-455" />;
      case 'add_daily_log':
      case 'manual_log':
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'add_trip':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      case 'join_meeting':
        return <Calendar className="w-4 h-4 text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Background Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-50 flex flex-col justify-between text-slate-300 shadow-2xl transition-all duration-300 transform select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm tracking-tight uppercase">
              Log Aktivitas Kerja
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                showFilters 
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-650/20' 
                  : isFilterActive
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
                  : 'bg-transparent border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-800/50'
              }`}
              title={showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
            >
              <Filter className="w-4.5 h-4.5" />
              {isFilterActive && !showFilters && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-450 border border-slate-900 animate-pulse" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-355 hover:bg-slate-800/50 transition-colors cursor-pointer border-0 bg-transparent"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Type Toggle & Inputs */}
        {showFilters && (
          <div className="animate-fade-in shrink-0">
            {/* Filter Type Toggle */}
            <div className="p-3 bg-slate-950/20 border-b border-slate-850/60 flex items-center justify-center gap-2 select-none shrink-0">
              <button
                onClick={() => { setFilterType('range'); resetFilters(); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border-0 ${
                  filterType === 'range' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Rentang Tanggal
              </button>
              <button
                onClick={() => { setFilterType('month'); resetFilters(); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wider uppercase transition-all cursor-pointer border-0 ${
                  filterType === 'month' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Pilih Bulan
              </button>
            </div>

            {/* Filter Inputs Area */}
            <div className="p-4 bg-slate-955/20 border-b border-slate-850 flex flex-col gap-3 shrink-0">
              {filterType === 'range' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12 shrink-0">Mulai:</span>
                    <input 
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-250 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 w-12 shrink-0">Selesai:</span>
                    <input 
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-slate-255 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Bulan:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-550 cursor-pointer"
                  >
                    <option value="">Semua Bulan</option>
                    {Array.from(new Set(logs.map(log => {
                      if (!log || !log.timestamp) return '';
                      const date = new Date(log.timestamp);
                      if (isNaN(date.getTime())) return '';
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      return `${year}-${month}`;
                    }))).filter(Boolean).sort((a, b) => b.localeCompare(a)).map(ym => {
                      const [year, month] = ym.split('-');
                      const monthNames = [
                        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                      ];
                      const label = `${monthNames[parseInt(month) - 1]} ${year}`;
                      return (
                        <option key={ym} value={ym}>{label}</option>
                      );
                    })}
                  </select>
                </div>
              )}

              {isFilterActive && (
                <button
                  onClick={resetFilters}
                  className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer select-none border-0 mt-1"
                >
                  Hapus Filter / Tampilkan Semua
                </button>
              )}
            </div>
          </div>
        )}

        {/* Manual Log Input Form */}
        {onAddManualLog && (
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
            <form onSubmit={handleManualLogSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualLogText}
                  onChange={(e) => setManualLogText(e.target.value)}
                  placeholder="Catat aktivitas manual..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <label className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center border border-slate-700" title="Lampirkan File/Gambar (Max 5MB)">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
                <button
                  type="submit"
                  disabled={!manualLogText.trim()}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-all cursor-pointer border-0 shadow-sm flex items-center justify-center"
                  title="Kirim Catatan"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {manualLogFileName && (
                <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 rounded-lg animate-fade-in">
                  <span className="text-[10px] font-medium text-indigo-400 truncate pr-2 flex-1 flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3 shrink-0" /> {manualLogFileName}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => { setManualLogFile(null); setManualLogFileName(''); }}
                    className="text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/20 bg-transparent border-0 cursor-pointer p-1 rounded-full transition-colors shrink-0 flex items-center justify-center"
                    title="Hapus Lampiran"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Logs Feed Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div 
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-all flex gap-3 group"
              >
                {/* Icon Container */}
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:scale-105 transition-transform">
                  {getActionIcon(log.actionType)}
                </div>

                {/* Text Details */}
                <div className="flex-1 min-w-0">
                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-1 break-words">
                    {log.description}
                  </p>

                  {/* Attachment Link */}
                  {log.fileRef && (log.fileRef.fileData || log.fileRef.id) && (
                    <button
                      onClick={() => onOpenFile(log.fileRef)}
                      className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-lg transition-all cursor-pointer select-none"
                    >
                      <Eye className="w-3 h-3 text-indigo-400" />
                      <span className="truncate max-w-[180px]" title={log.fileRef.fileName}>
                        Buka Lampiran
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-slate-600 text-[11px] font-bold border border-dashed border-slate-850 rounded-2xl bg-slate-950/10 flex flex-col items-center justify-center gap-2 select-none">
              <ShieldAlert className="w-6 h-6 text-slate-700" />
              <span>
                {isFilterActive 
                  ? 'Tidak ada aktivitas pada tanggal terpilih.' 
                  : 'Belum ada rekaman aktivitas kerja.'}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center text-[9px] text-slate-600">
          Tercatat Otomatis • Histori 50 Terakhir
        </div>
      </div>
    </>
  );
}
