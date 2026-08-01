import React, { useState } from 'react';
import { X, Eye, Trash2, FileText, CheckCircle2, Save, Loader2, Link as LinkIcon, ExternalLink, Plus } from 'lucide-react';

const CATEGORIES = [
  { key: 'KTP', label: 'KTP (Kartu Tanda Penduduk)', desc: 'Link Google Drive scan KTP asli.', isMultiple: false },
  { key: 'Daftar Riwayat Hidup', label: 'Daftar Riwayat Hidup (CV)', desc: 'Link Google Drive dokumen riwayat hidup lengkap.', isMultiple: false },
  { key: 'SK PNS', label: 'SK PNS (Surat Keputusan)', desc: 'Bagi PNS/PPPK, link Google Drive SK kepegawaian terakhir.', isMultiple: false },
  { key: 'Sertifikat', label: 'Sertifikat Keahlian / Pelatihan', desc: 'Link Google Drive sertifikat kompetensi (bisa lebih dari satu).', isMultiple: true },
  { key: 'Lainnya', label: 'Dokumen Lainnya', desc: 'Link Google Drive berkas pendukung administrasi tambahan.', isMultiple: true }
];

export default function PersonnelDocumentsModal({ 
  user, 
  activeUser, 
  documents = [], 
  onClose, 
  onAddDoc, 
  onDeleteDoc,
  onSave 
}) {
  const isSuperAdmin = activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin';
  const isOwnDocuments = activeUser.id === user.id;

  const [addingCategoryKey, setAddingCategoryKey] = useState(null);
  const [docNameInput, setDocNameInput] = useState('');
  const [docUrlInput, setDocUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const normalizeUrl = (url) => {
    if (!url) return '';
    let trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    return trimmed;
  };

  const handleSaveGDriveDoc = (categoryKey) => {
    const formattedUrl = normalizeUrl(docUrlInput);
    if (!formattedUrl) {
      return window.showAlert('Link Google Drive wajib diisi!');
    }
    const catObj = CATEGORIES.find(c => c.key === categoryKey);
    const newDoc = {
      id: `pdoc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: categoryKey,
      fileName: docNameInput.trim() || `${catObj ? catObj.label : 'Dokumen'}.pdf`,
      fileSize: 'Link GDrive',
      fileData: formattedUrl,
      uploadedAt: new Date().toISOString()
    };

    onAddDoc(newDoc);
    setAddingCategoryKey(null);
    setDocNameInput('');
    setDocUrlInput('');
    window.showAlert('Link Google Drive dokumen personil berhasil disimpan.');
  };

  const handleDeleteClick = async (file) => {
    if (await window.showConfirm(`Apakah Anda yakin ingin menghapus dokumen "${file.fileName}"?`)) {
      onDeleteDoc(file.id);
    }
  };

  const handleOpenFile = (file) => {
    try {
      if (!file || !file.fileData) return window.showAlert('Link dokumen tidak tersedia.');
      if (typeof file.fileData === 'string' && file.fileData.startsWith('http')) {
        const newWindow = window.open(file.fileData, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          window.showAlert('Pop-up terblokir! Silakan izinkan pop-up di browser Anda.');
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
              <span>Dokumen Personil (GDrive)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOwnDocuments ? 'Kelola link Google Drive berkas kepegawaian Anda sendiri.' : `Mengelola berkas kepegawaian milik: ${user.nama}`}
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
              <h4 className="font-semibold text-slate-200 text-xs">Penggunaan Link Google Drive</h4>
              <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                Dokumen personil disimpan dalam bentuk link Google Drive. Klik dokumen untuk membuka dan melihat secara langsung di **Tab Baru**.
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
                              <LinkIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleOpenFile(file)}
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 truncate pr-2 flex items-center gap-1 group text-left"
                                title="Buka di Tab Baru"
                              >
                                <span className="truncate underline underline-offset-2">{file.fileName}</span>
                                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-300 shrink-0" />
                              </button>
                              <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                                {file.fileSize || 'Link GDrive'} • {new Date(file.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleOpenFile(file)}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-450 hover:text-indigo-400 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Buka Link GDrive di Tab Baru"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Buka</span>
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

                  {/* Inline Form Input Link GDrive */}
                  {addingCategoryKey === category.key ? (
                    <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-3 space-y-2.5 select-none">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                          <LinkIcon className="w-3.5 h-3.5 text-indigo-400" /> Input Link Google Drive
                        </span>
                        <button 
                          type="button"
                          onClick={() => setAddingCategoryKey(null)}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Berkas (Opsional)</label>
                        <input
                          type="text"
                          placeholder={`${category.label}.pdf`}
                          value={docNameInput}
                          onChange={(e) => setDocNameInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Link GDrive *Wajib</label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/file/d/xxx/view"
                          value={docUrlInput}
                          onChange={(e) => setDocUrlInput(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAddingCategoryKey(null)}
                          className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveGDriveDoc(category.key)}
                          className="px-3 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow"
                        >
                          Simpan Link
                        </button>
                      </div>
                    </div>
                  ) : shouldShowUpload ? (
                    <div className="pt-1 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingCategoryKey(category.key);
                          setDocNameInput('');
                          setDocUrlInput('');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-800 hover:border-indigo-500/40 bg-slate-950/30 hover:bg-slate-950/60 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 transition-all duration-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-indigo-400" />
                        <span>+ Input Link Google Drive</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/20 border-t border-slate-800/80 flex items-center justify-between select-none gap-3">
          <p className="text-[10px] text-slate-500">
            Klik <span className="text-indigo-400 font-semibold">Simpan</span> untuk menyimpan perubahan.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              onClick={async () => {
                if (!onSave) { onClose(); return; }
                setIsSaving(true);
                try {
                  await onSave();
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30"
            >
              {isSaving ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Simpan</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
