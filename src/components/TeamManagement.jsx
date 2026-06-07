import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, User, Award, Check, X } from 'lucide-react';

export default function TeamManagement({ users, activeUser, onAddUser, onUpdateUser, onDeleteUser }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    jabatanKepegawaian: '',
    jabatanTim: 'Fasilitator',
    pendidikan: 'Strata 2',
    statusPegawai: 'PNS',
    role: 'user'
  });

  const resetForm = () => {
    setFormData({
      nama: '',
      jabatanKepegawaian: '',
      jabatanTim: 'Fasilitator',
      pendidikan: 'Strata 2',
      statusPegawai: 'PNS',
      role: 'user'
    });
    setIsAdding(false);
    setEditingUser(null);
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      nama: user.nama || '',
      jabatanKepegawaian: user.jabatanKepegawaian || '',
      jabatanTim: user.jabatanTim || '',
      pendidikan: user.pendidikan || '',
      statusPegawai: user.statusPegawai || '',
      role: user.role || 'user'
    });
    setIsAdding(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) return alert('Nama harus diisi');

    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        ...formData
      });
      alert('Data anggota tim berhasil diperbarui');
    } else {
      const newUser = {
        id: formData.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        ...formData
      };
      onAddUser(newUser);
      alert('Anggota tim baru berhasil ditambahkan');
    }
    resetForm();
  };

  const handleDeleteClick = (user) => {
    if (user.id === activeUser.id) {
      return alert('Anda tidak dapat menghapus akun Anda sendiri.');
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus anggota tim "${user.nama}"?`)) {
      onDeleteUser(user.id);
      alert('Anggota tim berhasil dihapus.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" /> Kelola Anggota Tim
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Menu khusus Super Admin untuk menambah, mengubah, dan mengedit data kepegawaian seluruh anggota tim.
          </p>
        </div>

        {!isAdding && !editingUser && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10"
          >
            <UserPlus className="w-4 h-4" /> Tambah Anggota
          </button>
        )}
      </div>

      {/* Form Area (Add or Edit) */}
      {(isAdding || editingUser) && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 text-base mb-4 flex items-center gap-2">
            {editingUser ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <UserPlus className="w-4 h-4 text-indigo-400" />}
            {editingUser ? `Edit Data Anggota: ${editingUser.nama}` : 'Tambah Anggota Tim Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nama Lengkap & Gelar"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Jabatan Kepegawaian
              </label>
              <input
                type="text"
                value={formData.jabatanKepegawaian}
                onChange={(e) => setFormData({ ...formData, jabatanKepegawaian: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Contoh: Dosen / Dosen Teknik Arsitektur"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Jabatan Tim Pelaksana
              </label>
              <select
                value={formData.jabatanTim}
                onChange={(e) => setFormData({ ...formData, jabatanTim: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Ketua Tim">Ketua Tim</option>
                <option value="Koordinator">Koordinator</option>
                <option value="Fasilitator">Fasilitator</option>
                <option value="Tenaga Administrasi">Tenaga Administrasi</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

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
                Status Kepegawaian
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Hak Akses Aplikasi
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="user">User Biasa</option>
                <option value="admin">Super Admin (Akses Penuh)</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-3 flex items-center justify-end gap-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-850 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/10"
              >
                <Check className="w-4 h-4" /> {editingUser ? 'Perbarui Anggota' : 'Tambahkan Anggota'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider select-none">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Jabatan Kepegawaian</th>
                <th className="px-6 py-4">Jabatan Tim</th>
                <th className="px-6 py-4 text-center">Pendidikan</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Akses</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-900/20 transition-colors ${user.id === activeUser.id ? 'bg-indigo-500/[0.02]' : ''}`}
                >
                  {/* Nama */}
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>{user.nama}</span>
                      {user.id === activeUser.id && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Anda
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Jabatan Kepegawaian */}
                  <td className="px-6 py-4 text-slate-400">
                    {user.jabatanKepegawaian !== '-' ? user.jabatanKepegawaian : <span className="text-slate-600">-</span>}
                  </td>
                  {/* Jabatan Tim */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                      {user.jabatanTim}
                    </span>
                  </td>
                  {/* Pendidikan */}
                  <td className="px-6 py-4 text-center text-slate-400">{user.pendidikan}</td>
                  {/* Status */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        user.statusPegawai === 'PNS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : user.statusPegawai === 'PPPK'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}
                    >
                      {user.statusPegawai}
                    </span>
                  </td>
                  {/* Akses */}
                  <td className="px-6 py-4 text-center">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded-full">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-500/5 border border-slate-500/10 px-2 py-0.5 rounded-full">
                        <User className="w-3 h-3" /> User
                      </span>
                    )}
                  </td>
                  {/* Aksi */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(user)}
                        title="Edit data anggota"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        title="Hapus anggota"
                        disabled={user.id === activeUser.id}
                        className={`p-1.5 rounded-lg text-slate-400 transition-colors ${
                          user.id === activeUser.id
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:text-rose-400 hover:bg-slate-800'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
