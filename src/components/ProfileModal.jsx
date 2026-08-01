import React, { useState, useEffect } from 'react';
import { X, Check, Eye, EyeOff, Lock, CreditCard } from 'lucide-react';

export default function ProfileModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    nama: '',
    jabatanKepegawaian: '',
    jabatanTim: '',
    pendidikan: '',
    statusPegawai: '',
    password: '',
    namaBank: '',
    nomorRekening: '',
    atasNama: '',
    npwp: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        nama: user.nama || '',
        jabatanKepegawaian: user.jabatanKepegawaian || '',
        jabatanTim: user.jabatanTim || '',
        pendidikan: user.pendidikan || '',
        statusPegawai: user.statusPegawai || '',
        password: user.password || '',
        namaBank: user.namaBank || '',
        nomorRekening: user.nomorRekening || '',
        atasNama: user.atasNama || '',
        npwp: user.npwp || ''
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) return window.showAlert('Nama harus diisi');
    onSave({
      ...user,
      ...formData,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <h3 className="font-semibold text-slate-100 text-lg">Ubah Profil</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Contoh: Etty Rabihati, M.T."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Jabatan dalam Kepegawaian
            </label>
            <input
              type="text"
              value={formData.jabatanKepegawaian}
              onChange={(e) => setFormData({ ...formData, jabatanKepegawaian: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Contoh: Dosen Teknik Sipil"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Pendidikan Terakhir
              </label>
              <select
                value={formData.pendidikan}
                onChange={(e) => setFormData({ ...formData, pendidikan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Diploma">Diploma</option>
                <option value="Strata 1">Strata 1</option>
                <option value="Strata 2">Strata 2</option>
                <option value="Strata 3">Strata 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Status Pegawai
              </label>
              <select
                value={formData.statusPegawai}
                onChange={(e) => setFormData({ ...formData, statusPegawai: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="PNS">PNS</option>
                <option value="PPPK">PPPK</option>
                <option value="Alumni">Alumni</option>
                <option value="Jasa Lainnya">Jasa Lainnya</option>
              </select>
            </div>
          </div>

          {user.role === 'admin' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Jabatan dalam Tim Pelaksana
              </label>
              <input
                type="text"
                value={formData.jabatanTim}
                disabled
                className="w-full bg-slate-950/40 border border-slate-850 text-slate-500 rounded-xl px-4 py-2 text-sm cursor-not-allowed focus:outline-none"
              />
            </div>
          )}

          {/* Section Rekening Bank & NPWP */}
          <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Informasi Rekening Bank & NPWP
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  value={formData.namaBank}
                  onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Contoh: Bank Kalbar / Mandiri / BCA"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nomor Rekening
                </label>
                <input
                  type="text"
                  value={formData.nomorRekening}
                  onChange={(e) => setFormData({ ...formData, nomorRekening: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Atas Nama Rekening
              </label>
              <input
                type="text"
                value={formData.atasNama}
                onChange={(e) => setFormData({ ...formData, atasNama: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nama Pemilik Rekening"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nomor NPWP
              </label>
              <input
                type="text"
                value={formData.npwp}
                onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="00.000.000.0-000.000"
              />
            </div>
          </div>

          {/* Password Security Section */}
          <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Keamanan Akun
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Masukkan password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Kosongkan password jika tidak ingin menggunakan sandi saat memilih akun.
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
            >
              <Check className="w-4 h-4" /> Simpan Profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
