import React, { useState } from 'react';
import { Calendar, Plus, Camera, Image, ShieldAlert, FileText, Check, X, Clock, User } from 'lucide-react';

export default function DailyLogs({ logs, users, activeUser, onAddLog }) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedUserFilter, setSelectedUserFilter] = useState(activeUser.role === 'admin' ? 'Semua' : activeUser.id);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    aktivitas: '',
    foto: ''
  });

  const isSuperAdmin = activeUser.role === 'admin';

  // Client-side image resize & compression using Canvas
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Hanya berkas gambar yang didukung!');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.6 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPreviewImage(dataUrl);
        setFormData((prev) => ({ ...prev, foto: dataUrl }));
      };
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.aktivitas.trim()) return alert('Aktivitas harian wajib diisi');

    const newLog = {
      id: `log-${activeUser.id}-${Date.now()}`,
      userId: activeUser.id,
      tanggal: formData.tanggal,
      aktivitas: formData.aktivitas,
      foto: formData.foto,
      createdAt: new Date().toISOString()
    };

    onAddLog(newLog);
    alert('Log kerja harian berhasil dicatat!');
    setFormData({ tanggal: new Date().toISOString().split('T')[0], aktivitas: '', foto: '' });
    setPreviewImage(null);
    setIsAdding(false);
  };

  const getUserName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.nama : 'Anggota Tim';
  };

  const getUserRole = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.jabatanTim : 'Pelaksana';
  };

  // Filter logs list
  const filteredLogs = logs.filter((log) => {
    if (selectedUserFilter === 'Semua') return true;
    return log.userId === selectedUserFilter;
  }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Sort by date desc

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" /> Log Kerja Harian
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin 
              ? 'Pantau log aktivitas kerja harian seluruh anggota tim pelaksana beserta bukti foto kegiatan.'
              : 'Tulis log jurnal harian Anda untuk melaporkan aktivitas pendampingan lapangan dilengkapi bukti foto.'}
          </p>
        </div>

        {!isSuperAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Catat Log Harian
          </button>
        )}
      </div>

      {/* Filter Admin */}
      {isSuperAdmin && (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3 select-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Pantau Anggota Tim:</span>
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="Semua">Semua Anggota Tim</option>
            {users.filter(u => u.role !== 'admin').map((u) => (
              <option key={u.id} value={u.id}>{u.nama} ({u.jabatanTim})</option>
            ))}
          </select>
        </div>
      )}

      {/* Form Add Log */}
      {isAdding && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-400" /> Catat Aktivitas Harian Baru
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Tanggal Kegiatan
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Bukti Foto Kegiatan (Kompresi Otomatis)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer hover:border-slate-700 transition-colors">
                    <Camera className="w-4 h-4 text-slate-400" /> Pilih Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Unggah foto langsung dari kamera/galeri. Sistem otomatis mengompresi gambar.
                  </span>
                </div>
              </div>
            </div>

            {/* Preview and Text Area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Uraian Aktivitas Pekerjaan
                </label>
                <textarea
                  value={formData.aktivitas}
                  onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
                  placeholder="Deskripsikan pekerjaan Anda hari ini secara mendetail..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors h-32 resize-none"
                  required
                />
              </div>

              {/* Preview image */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Preview Foto Bukti
                </label>
                {previewImage ? (
                  <div className="relative border border-slate-800 rounded-xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center">
                    <img src={previewImage} alt="Bukti harian" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData((prev) => ({ ...prev, foto: '' }));
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-950 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-600 text-xs flex flex-col items-center justify-center bg-slate-950/20 aspect-video select-none">
                    <Image className="w-6 h-6 text-slate-700 mb-1" /> Belum ada foto
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800/85">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg"
              >
                <Check className="w-4 h-4" /> Simpan Jurnal Log
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logs Feed List */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-6">
            
            {/* Left side: content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* User avatar indicator */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{getUserName(log.userId)}</span>
                  <span className="text-[10px] text-slate-500 font-medium">({getUserRole(log.userId)})</span>
                </div>
                {/* Date indicator */}
                <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {log.tanggal}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal pt-1.5 whitespace-pre-line">
                {log.aktivitas}
              </p>
            </div>

            {/* Right side: Photo Bukti */}
            {log.foto && (
              <div className="w-full md:w-48 shrink-0 select-none">
                <span className="block text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                  <Image className="w-3 h-3" /> Bukti Foto Kegiatan
                </span>
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950 aspect-video md:aspect-auto md:h-24 flex items-center justify-center cursor-zoom-in" onClick={() => window.open(log.foto)}>
                  <img src={log.foto} alt="Bukti kerja" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-semibold border border-dashed border-slate-850 rounded-2xl bg-slate-900/10">
            Belum ada catatan log kerja harian yang terdaftar.
          </div>
        )}
      </div>

    </div>
  );
}
