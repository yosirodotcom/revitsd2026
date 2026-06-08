import React, { useState } from 'react';
import { 
  X, Calendar, FileText, UploadCloud, Trash2, 
  TrendingUp, ListTodo, Activity, Clock, Eye, ShieldAlert 
} from 'lucide-react';

export default function RightActivitySidebar({ 
  isOpen, 
  onClose, 
  logs = [], 
  onOpenFile 
}) {
  const [dateFilter, setDateFilter] = useState('');

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

  // Filter logs by date if dateFilter is set
  const filteredLogs = logs.filter(log => {
    if (!dateFilter) return true;
    // Extract YYYY-MM-DD from log.timestamp
    const logDate = log.timestamp.split('T')[0];
    return logDate === dateFilter;
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
        return <FileText className="w-4 h-4 text-purple-400" />;
      case 'add_trip':
        return <Calendar className="w-4 h-4 text-blue-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Background Backdrop Overlay on Mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden cursor-pointer"
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 z-50 flex flex-col justify-between text-slate-300 shadow-2xl transition-all duration-300 transform select-none md:sticky md:top-0 md:translate-x-0 md:h-screen md:w-80 md:bg-slate-900 md:border-l md:z-0 shrink-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm tracking-tight uppercase">
              Log Aktivitas Kerja
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-350 hover:bg-slate-800/50 transition-colors cursor-pointer border-0 md:hidden"
            title="Tutup Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-850 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
              Filter Tanggal:
            </span>
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer select-none border-0"
            >
              Reset
            </button>
          )}
        </div>

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
                  {log.fileRef && log.fileRef.fileData && (
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
                {dateFilter 
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
