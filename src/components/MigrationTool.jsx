import React, { useState } from 'react';
import {
  Database, RefreshCw, CheckCircle, AlertTriangle, Play,
  Eye, ArrowRight, Loader2, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { runMigration, previewSheetData } from '../services/migrationService';

export default function MigrationTool({ activeUser, settings }) {
  const [sheetsUrl, setSheetsUrl] = useState(settings?.googleAppsScriptUrl || '');
  const [sheetsToken, setSheetsToken] = useState(settings?.googleAppsScriptToken || 'REVITSD2026_SECURE_TOKEN');
  const [programTarget, setProgramTarget] = useState('revitsd2026');

  const [isRunning, setIsRunning] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [log, setLog] = useState([]);

  const isSuperAdmin = activeUser?.role === 'admin' || activeUser?.jabatanTim === 'Super Admin';

  const addLog = (msg) => setLog(prev => [...prev, `${new Date().toLocaleTimeString('id-ID')} — ${msg}`]);

  const handlePreview = async () => {
    if (!sheetsUrl) return window.showAlert('URL Apps Script belum diisi!');
    setIsPreviewing(true);
    setPreview(null);
    try {
      addLog('Mengambil preview data dari Google Sheets...');
      const data = await previewSheetData(sheetsUrl, sheetsToken);
      setPreview(data);
      addLog(`Preview berhasil. Total records: ${Object.values(data).reduce((a, b) => a + b, 0)}`);
    } catch (err) {
      addLog(`ERROR preview: ${err.message}`);
      window.showAlert(`Gagal mengambil preview: ${err.message}`);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleMigrate = async () => {
    if (!sheetsUrl) return window.showAlert('URL Apps Script wajib diisi!');
    const confirmed = await window.showConfirm(
      `Mulai migrasi data dari Google Sheets ke Firebase (${programTarget})?\n\nData yang sudah ada di Firestore akan ditimpa oleh data dari Google Sheets.\n\nPastikan Firebase Storage sudah aktif (Blaze plan).`
    );
    if (!confirmed) return;

    setIsRunning(true);
    setResult(null);
    setProgress({ step: 0, total: 1, message: 'Memulai...', percent: 0 });
    setLog([]);
    setShowLog(true);

    try {
      const migResult = await runMigration({
        programId: programTarget,
        sheetsUrl,
        sheetsToken,
        onProgress: ({ step, total, message, percent }) => {
          setProgress({ step, total, message, percent });
          addLog(message);
        },
        overwriteExisting: true,
      });

      setResult(migResult);
      if (migResult.success) {
        addLog('✅ Migrasi selesai dengan sukses!');
        const totalRecords = Object.values(migResult.stats).reduce((a, b) => a + b, 0);
        addLog(`Total records tersimpan: ${totalRecords}`);
      } else {
        addLog(`❌ Migrasi gagal: ${migResult.errors.join(', ')}`);
      }
    } catch (err) {
      addLog(`ERROR FATAL: ${err.message}`);
      setResult({ success: false, stats: {}, errors: [err.message] });
    } finally {
      setIsRunning(false);
      setProgress(prev => prev ? { ...prev, percent: 100 } : null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-slate-400">Hanya Super Admin yang dapat mengakses fitur ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-start gap-4 pb-4 border-b border-slate-700">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
          <Database className="w-7 h-7 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Migrasi Data Google Sheets → Firebase</h2>
          <p className="text-sm text-slate-400 mt-1">
            Impor semua data dari Google Sheets ke Firestore. Jalankan satu kali setelah Firebase dikonfigurasi.
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-200">
          <p className="font-semibold mb-1">Persyaratan sebelum menjalankan migrasi:</p>
          <ul className="space-y-1 text-amber-300/80 list-disc list-inside">
            <li>Firebase project sudah di-upgrade ke <strong>Blaze plan</strong></li>
            <li>Firestore Database sudah aktif (<strong>region: asia-southeast1</strong>)</li>
            <li>Firebase Storage sudah aktif</li>
            <li>URL Apps Script Google Sheets masih aktif dan dapat diakses</li>
          </ul>
        </div>
      </div>

      {/* Form Konfigurasi */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Konfigurasi Sumber Data</h3>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Program Target di Firebase</label>
          <select
            value={programTarget}
            onChange={e => setProgramTarget(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="revitsd2026">Revitalisasi SD 2026 (revitsd2026)</option>
            <option value="revitpaud2026">Revitalisasi PAUD 2026 (revitpaud2026)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">URL Apps Script Google Sheets</label>
          <input
            type="url"
            value={sheetsUrl}
            onChange={e => setSheetsUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Token Keamanan</label>
          <input
            type="text"
            value={sheetsToken}
            onChange={e => setSheetsToken(e.target.value)}
            placeholder="REVITSD2026_SECURE_TOKEN"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Preview Data */}
      {preview && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" /> Preview Data di Google Sheets
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(preview).map(([key, count]) => (
              <div key={key} className="flex justify-between items-center bg-slate-900/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400 capitalize">{key}</span>
                <span className="text-sm font-bold text-indigo-400">{count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Total: <span className="text-white font-semibold">
              {Object.values(preview).reduce((a, b) => a + b, 0)} records
            </span> akan dimigrasikan ke Firestore.
          </p>
        </div>
      )}

      {/* Progress Bar */}
      {isRunning && progress && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              {progress.message}
            </span>
            <span className="text-sm font-bold text-indigo-400">{progress.percent}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-blue-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Hasil Migrasi */}
      {result && (
        <div className={`border rounded-xl p-5 ${result.success
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            {result.success
              ? <CheckCircle className="w-6 h-6 text-emerald-400" />
              : <AlertTriangle className="w-6 h-6 text-red-400" />}
            <h3 className={`font-semibold ${result.success ? 'text-emerald-300' : 'text-red-300'}`}>
              {result.success ? 'Migrasi Berhasil!' : 'Migrasi Gagal'}
            </h3>
          </div>
          {result.success && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {Object.entries(result.stats).filter(([, v]) => v > 0).map(([key, count]) => (
                <div key={key} className="flex justify-between bg-emerald-900/20 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-emerald-300/70 capitalize">{key}</span>
                  <span className="text-sm font-bold text-emerald-400">{count}</span>
                </div>
              ))}
            </div>
          )}
          {result.errors?.length > 0 && (
            <ul className="mt-3 space-y-1">
              {result.errors.map((e, i) => (
                <li key={i} className="text-xs text-red-300 flex gap-2">
                  <span>•</span><span>{e}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowLog(!showLog)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="font-mono">Log Migrasi ({log.length} entri)</span>
            {showLog ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showLog && (
            <div className="px-4 pb-4 max-h-48 overflow-y-auto space-y-0.5">
              {log.map((entry, i) => (
                <p key={i} className="text-xs font-mono text-slate-400">{entry}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handlePreview}
          disabled={isPreviewing || isRunning}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isPreviewing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Eye className="w-4 h-4" />}
          {isPreviewing ? 'Mengambil...' : 'Preview Data Sheets'}
        </button>

        <button
          onClick={handleMigrate}
          disabled={isRunning || isPreviewing}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-orange-500/20"
        >
          {isRunning
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Play className="w-4 h-4" />}
          {isRunning ? 'Sedang Migrasi...' : 'Mulai Migrasi ke Firebase'}
          {!isRunning && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-xs text-slate-500">
        ⚠️ Setelah migrasi selesai, refresh aplikasi dan login kembali untuk memuat data dari Firebase.
      </p>
    </div>
  );
}
