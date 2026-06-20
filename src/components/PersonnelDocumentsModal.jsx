import React from 'react';
import { X, UploadCloud, Eye, Trash2, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

const CATEGORIES = [
  { key: 'KTP', label: 'KTP (Kartu Tanda Penduduk)', desc: 'Unggah berkas scan KTP asli (PDF/Gambar, maks 5MB).', isMultiple: false },
  { key: 'Daftar Riwayat Hidup', label: 'Daftar Riwayat Hidup (CV)', desc: 'Unggah dokumen riwayat hidup lengkap terbaru.', isMultiple: false },
  { key: 'SK PNS', label: 'SK PNS (Surat Keputusan)', desc: 'Bagi PNS/PPPK, unggah berkas SK kepegawaian terakhir.', isMultiple: false },
  { key: 'Sertifikat', label: 'Sertifikat Keahlian / Pelatihan', desc: 'Unggah sertifikat kompetensi atau piagam keahlian (bisa lebih dari satu).', isMultiple: true },
  { key: 'Lainnya', label: 'Dokumen Lainnya', desc: 'Unggah berkas pendukung administrasi tambahan lainnya.', isMultiple: true }
];

export default function PersonnelDocumentsModal({ 
  user, 
  activeUser, 
  documents = [], 
  onClose, 
  onAddDoc, 
  onDeleteDoc 
}) {
  const isSuperAdmin = activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin';
  const isOwnDocuments = activeUser.id === user.id;

  const [uploadingState, setUploadingState] = React.useState({});

  const handleUpload = (e, category) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      e.target.value = '';
      return window.showAlert('Format file tidak didukung! Hanya diperbolehkan berkas PDF (.pdf) atau Gambar (.png, .jpg, .jpeg).');
    }

    // Check size limit: 10MB
    if (file.size > 10.0 * 1024 * 1024) {
      e.target.value = '';
      return window.showAlert('Ukuran file terlalu besar! Maksimal ukuran file adalah 10MB.');
    }

    setUploadingState((prev) => ({
      ...prev,
      [category.key]: { progress: 0, fileName: file.name }
    }));

    const progressInterval = setInterval(() => {
      setUploadingState((prev) => {
        const state = prev[category.key];
        if (!state) {
          clearInterval(progressInterval);
          return prev;
        }
        const nextProgress = state.progress + 20;
        if (nextProgress >= 100) {
          clearInterval(progressInterval);
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const newDoc = {
              id: `pdoc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              userId: user.id,
              type: category.key,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(1) + ' KB',
              fileData: event.target.result, // Base64 data URL
              uploadedAt: new Date().toISOString()
            };

            onAddDoc(newDoc);
            setUploadingState((latest) => {
              const copy = { ...latest };
              delete copy[category.key];
              return copy;
            });
          };
          return {
            ...prev,
            [category.key]: { ...state, progress: 100 }
          };
        }
        return {
          ...prev,
          [category.key]: { ...state, progress: nextProgress }
        };
      });
    }, 150);

    e.target.value = '';
  };

  const handleDeleteClick = async (file) => {
    if (await window.showConfirm(`Apakah Anda yakin ingin menghapus dokumen "${file.fileName}"?`)) {
      onDeleteDoc(file.id);
    }
  };

  const handleOpenFile = (file) => {
    try {
      if (file.fileData.startsWith('http')) {
        const newWindow = window.open(file.fileData, '_blank');
        if (!newWindow) {
          window.showAlert('Pop-up terblokir! Silakan izinkan pop-up untuk membuka file.');
        }
        return;
      }
      
      const parts = file.fileData.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      
      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        window.showAlert('Pop-up terblokir! Silakan izinkan pop-up untuk membuka file.');
      }
    } catch (err) {
      console.error(err);
      window.showAlert('Gagal membuka file dokumen.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div>
            <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Dokumen Personil</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOwnDocuments ? 'Unggah dan kelola berkas kepegawaian Anda sendiri.' : `Mengelola berkas kepegawaian milik: ${user.nama}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-350 hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Info Banner */}
          <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-200 text-xs">Penyimpanan Otomatis</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Berkas diunggah secara lokal dan akan disinkronkan ke **Google Sheets & Google Drive** secara otomatis saat sinkronisasi diaktifkan. Ukuran maksimal file adalah 5MB.
              </p>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            {CATEGORIES.map((category) => {
              const catFiles = documents.filter((doc) => doc.type === category.key);
              const hasFile = catFiles.length > 0;
              const shouldShowUpload = category.isMultiple || !hasFile;

              return (
                <div 
                  key={category.key} 
                  className="p-4 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-750 transition-colors space-y-3"
                >
                  {/* Category Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                        {category.label}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {category.desc}
                      </p>
                    </div>

                    {/* Badge */}
                    {hasFile ? (
                      <span className="self-start sm:self-center px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                        {catFiles.length} Berkas
                      </span>
                    ) : (
                      <span className="self-start sm:self-center px-2 py-0.5 text-[9px] font-bold bg-slate-950 border border-slate-800 text-slate-500 rounded-lg">
                        Belum Ada
                      </span>
                    )}
                  </div>

                  {/* Uploaded Files Section */}
                  {hasFile && (
                    <div className="space-y-2">
                      {catFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-200 truncate pr-2" title={file.fileName}>
                                {file.fileName}
                              </p>
                              <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                {file.fileSize} • {new Date(file.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleOpenFile(file)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-450 hover:text-indigo-400 transition-all cursor-pointer"
                              title="Buka Dokumen"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(file)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:border-rose-900/40 text-rose-455 hover:text-rose-400 transition-all cursor-pointer"
                              title="Hapus Dokumen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Uploading Progress Bar or Action */}
                  {uploadingState[category.key] ? (
                    <div className="pt-2 select-none space-y-2 bg-slate-950/30 border border-dashed border-indigo-500/20 rounded-xl p-3">
                      <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                        <span className="truncate max-w-[200px] text-indigo-300 flex items-center gap-1.5">
                          <UploadCloud className="w-3.5 h-3.5 animate-bounce text-indigo-400" />
                          {uploadingState[category.key].fileName}
                        </span>
                        <span className="text-indigo-400 font-bold">{uploadingState[category.key].progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-150"
                          style={{ width: `${uploadingState[category.key].progress}%` }}
                        />
                      </div>
                    </div>
                  ) : shouldShowUpload ? (
                    <div className="pt-1 select-none">
                      <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/30 hover:bg-slate-950/60 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-all duration-200 cursor-pointer">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        <span>Unggah Berkas Baru</span>
                        <input
                          type="file"
                          accept=".pdf, image/*"
                          onChange={(e) => handleUpload(e, category)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/20 border-t border-slate-800/80 flex items-center justify-end select-none">
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
