import React, { useState } from 'react';
import { X, Plus, Clock, Trash2, Camera, Image, CheckCircle2, Paperclip } from 'lucide-react';

export default function MemberLogsModal({ 
  user, 
  logs = [], 
  onClose, 
  onAddLog, 
  onDeleteLog 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    aktivitas: '',
    foto: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return window.showAlert('Hanya berkas gambar yang didukung!');

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

        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setFormData((prev) => ({ ...prev, foto: dataUrl }));
      };
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.aktivitas.trim()) return window.showAlert('Uraian aktivitas wajib diisi!');

    const newLog = {
      id: `log-${user.id}-${Date.now()}`,
      userId: user.id,
      tanggal: formData.tanggal,
      aktivitas: formData.aktivitas,
      foto: formData.foto,
      createdAt: new Date().toISOString()
    };

    onAddLog(newLog);
    window.showAlert(`Log harian untuk "${user.nama}" berhasil disimpan!`);
    setFormData({
      tanggal: new Date().toISOString().split('T')[0],
      aktivitas: '',
      foto: ''
    });
    setIsAdding(false);
  };

  const handleDeleteClick = async (log) => {
    if (await window.showConfirm(`Apakah Anda yakin ingin menghapus log harian tanggal ${log.tanggal} milik "${user.nama}"?`)) {
      onDeleteLog(log.id);
      window.showAlert('Log harian berhasil dihapus.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-400" />
              <span>Kelola Log & Jurnal Lapangan</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Mengelola log aktivitas & bukti foto milik: <strong className="text-slate-200">{user.nama}</strong>
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
              <h4 className="font-semibold text-slate-200 text-xs">Jurnal Lapangan</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Gunakan bukti foto untuk mendokumentasikan kegiatan. Foto yang diunggah akan otomatis terkompresi untuk menghemat ruang penyimpanan browser.
              </p>
            </div>
          </div>

          {isAdding ? (
            <form onSubmit={handleSubmit} className="bg-slate-955/40 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Catat Log Harian Baru
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Pilih Gambar Bukti
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full bg-slate-950 border border-slate-855 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Uraian Aktivitas Pekerjaan
                </label>
                <textarea
                  value={formData.aktivitas}
                  onChange={(e) => setFormData({ ...formData, aktivitas: e.target.value })}
                  placeholder="Deskripsikan pekerjaan hari ini secara mendetail..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                  required
                />
              </div>

              {formData.foto && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Preview Foto Bukti
                  </label>
                  <div className="relative border border-slate-850 rounded-xl overflow-hidden w-40 aspect-video bg-slate-950 flex items-center justify-center">
                    <img src={formData.foto} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, foto: '' }))}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-455 hover:text-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-650/10 cursor-pointer"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-850 hover:border-indigo-500/40 bg-slate-950/30 hover:bg-slate-950/60 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Catat Aktivitas Log Baru
            </button>
          )}

          {/* List of daily logs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histori Log Jurnal</h4>
            {logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 space-y-3 flex flex-col sm:flex-row justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> {log.tanggal}
                        </span>
                        <button
                          onClick={() => handleDeleteClick(log)}
                          className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-955/40 border border-slate-850 hover:border-rose-500/30 text-rose-455 hover:text-rose-450 transition-all cursor-pointer sm:hidden"
                          title="Hapus Log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-350 whitespace-pre-line leading-relaxed">
                        {log.aktivitas}
                      </p>
                      {log.foto && (
                        <div className="pt-1 select-none">
                          <button
                            type="button"
                            onClick={() => window.open(log.foto)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-850 text-indigo-455 hover:text-indigo-400 rounded-xl transition-all cursor-pointer"
                            title="Buka lampiran di tab baru"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Buka Lampiran</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteClick(log)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-955/40 border border-slate-850 hover:border-rose-500/30 text-rose-455 hover:text-rose-400 transition-all cursor-pointer hidden sm:block self-start shrink-0"
                      title="Hapus Log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-555 italic text-center py-6 border border-slate-850 rounded-xl bg-slate-950/10">
                Belum ada catatan log kerja harian.
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
