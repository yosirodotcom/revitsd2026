import React, { useState } from 'react';
import { Contact, Plus, Edit2, Trash2, Check, X, Phone, User } from 'lucide-react';

export default function ContactManagement({ contacts, onAddContact, onUpdateContact, onDeleteContact }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const [formData, setFormData] = useState({
    nama: '',
    hp: ''
  });

  const resetForm = () => {
    setFormData({ nama: '', hp: '' });
    setIsAdding(false);
    setEditingContact(null);
  };

  const handleEditClick = (contact) => {
    setEditingContact(contact);
    setFormData({
      nama: contact.nama || '',
      hp: contact.hp || ''
    });
    setIsAdding(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.hp.trim()) {
      return window.showAlert('Nama dan Nomor HP wajib diisi');
    }

    if (editingContact) {
      onUpdateContact({
        ...editingContact,
        ...formData
      });
      window.showAlert('Kontak mitra berhasil diperbarui!');
    } else {
      const newContact = {
        id: `contact-${Date.now()}`,
        ...formData
      };
      onAddContact(newContact);
      window.showAlert('Kontak mitra baru berhasil ditambahkan!');
    }
    resetForm();
  };

  const handleDeleteClick = async (contact) => {
    if (await window.showConfirm(`Apakah Anda yakin ingin menghapus kontak "${contact.nama}"?`)) {
      onDeleteContact(contact.id);
      window.showAlert('Kontak berhasil dihapus.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <Contact className="w-6 h-6 text-indigo-400" /> Kelola Kontak Mitra Lapangan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daftar terpusat mitra eksternal (Perencana & Pengawas). Satu kontak dapat ditugaskan ke beberapa sekolah sekaligus tanpa duplikasi.
          </p>
        </div>

        {!isAdding && !editingContact && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Kontak
          </button>
        )}
      </div>

      {/* Form Add / Edit */}
      {(isAdding || editingContact) && (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-200 text-base mb-4 flex items-center gap-2">
            {editingContact ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-indigo-400" />}
            {editingContact ? `Edit Kontak: ${editingContact.nama}` : 'Tambah Kontak Baru'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nama Perencana atau Pengawas"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Nomor HP / WA
              </label>
              <input
                type="text"
                value={formData.hp}
                onChange={(e) => setFormData({ ...formData, hp: e.target.value.replace(/[^0-9+-]/g, '') })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Contoh: 08123456789"
                required
              />
            </div>

            <div className="md:col-span-2 pt-3 flex items-center justify-end gap-2 border-t border-slate-800/80">
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
                <Check className="w-4 h-4" /> {editingContact ? 'Perbarui Kontak' : 'Tambahkan Kontak'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table List of Contacts */}
      <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider select-none">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Nomor HP / Telepon</th>
                <th className="px-6 py-4">Identifikasi ID</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <span>{contact.nama}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {contact.hp}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{contact.id}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleEditClick(contact)}
                        title="Edit kontak"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(contact)}
                        title="Hapus kontak"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-500 font-semibold italic">
                    Belum ada kontak mitra terdaftar. Tambahkan kontak perencana/pengawas baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
