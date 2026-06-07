import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit2, Check, X, ShieldAlert, Award, FileCheck, 
  CheckCircle2, AlertTriangle, ListTodo, Plus, Trash2, Calendar, 
  ChevronRight, Play, CheckCircle
} from 'lucide-react';

export default function SchoolDetail({ 
  school, 
  users, 
  contacts, 
  tasks, 
  activeUser, 
  onBack, 
  onUpdateSchool, 
  onAddTask, 
  onUpdateTaskStatus, 
  onDeleteTask,
  onAddContact 
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'tasks'
  const [isEditing, setIsEditing] = useState(false);
  const [progresInput, setProgresInput] = useState(school.progres_fisik || 0);

  // Form states for profile
  const [formData, setFormData] = useState({
    desa: '',
    kecamatan: '',
    kepala_sekolah: '',
    hp_kepala_sekolah: '',
    perencanaId: '',
    pengawasId: '',
    fasilitatorId: '',
  });

  // Inline contact creator states
  const [isAddingPerencana, setIsAddingPerencana] = useState(false);
  const [newPerencana, setNewPerencana] = useState({ nama: '', hp: '' });
  const [isAddingPengawas, setIsAddingPengawas] = useState(false);
  const [newPengawas, setNewPengawas] = useState({ nama: '', hp: '' });

  // Add Task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  // Filter tasks for this school
  const schoolTasks = tasks.filter((t) => t.sekolahId === school.npsn);
  const totalTasks = schoolTasks.length;
  const doneTasks = schoolTasks.filter((t) => t.status === 'done').length;
  
  // Calculate dynamic progress if tasks exist, else use manual/stored progress
  const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : school.progres_fisik;

  useEffect(() => {
    if (school) {
      setProgresInput(school.progres_fisik || 0);
      setFormData({
        desa: school.desa || '',
        kecamatan: school.kecamatan || '',
        kepala_sekolah: school.kepala_sekolah || '',
        hp_kepala_sekolah: school.hp_kepala_sekolah || '',
        perencanaId: school.perencanaId || '',
        pengawasId: school.pengawasId || '',
        fasilitatorId: school.fasilitatorId || '',
      });
      setIsAddingPerencana(false);
      setIsAddingPengawas(false);
    }
  }, [school]);

  // Sync calculated progress to school parent state when tasks update
  useEffect(() => {
    if (totalTasks > 0 && calculatedProgress !== school.progres_fisik) {
      onUpdateSchool({
        ...school,
        progres_fisik: calculatedProgress
      });
    }
  }, [calculatedProgress, totalTasks]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    let updatedPerencanaId = formData.perencanaId;
    let updatedPengawasId = formData.pengawasId;

    // 1. Process inline Perencana if created
    if (isAddingPerencana && newPerencana.nama && newPerencana.hp) {
      const pid = `contact-${Date.now()}-p`;
      onAddContact({ id: pid, nama: newPerencana.nama, hp: newPerencana.hp });
      updatedPerencanaId = pid;
    }

    // 2. Process inline Pengawas if created
    if (isAddingPengawas && newPengawas.nama && newPengawas.hp) {
      const pid = `contact-${Date.now()}-w`;
      onAddContact({ id: pid, nama: newPengawas.nama, hp: newPengawas.hp });
      updatedPengawasId = pid;
    }

    onUpdateSchool({
      ...school,
      ...formData,
      perencanaId: updatedPerencanaId,
      pengawasId: updatedPengawasId,
      progres_fisik: totalTasks > 0 ? calculatedProgress : Number(progresInput),
    });

    alert('Informasi profil sekolah berhasil disimpan!');
    setIsEditing(false);
    setIsAddingPerencana(false);
    setIsAddingPengawas(false);
  };

  const handleQuickProgressSave = () => {
    if (totalTasks > 0) {
      return alert('Progress fisik dihitung otomatis berdasarkan Papan Tugas. Selesaikan tugas untuk menambah progress!');
    }
    onUpdateSchool({
      ...school,
      progres_fisik: Number(progresInput),
    });
    alert(`Progres fisik berhasil diubah menjadi ${progresInput}%`);
  };

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return alert('Judul tugas wajib diisi');

    const newTask = {
      id: `task-${Date.now()}`,
      sekolahId: school.npsn,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      status: 'todo',
      dueDate: taskForm.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: school.fasilitatorId || activeUser.id,
    };

    onAddTask(newTask);
    setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '' });
    setIsAddingTask(false);
    alert('Tugas lapangan baru berhasil ditambahkan!');
  };

  const handleDocumentAction = (docType, newStatus) => {
    const fieldMap = {
      mingguan: 'dokumen_mingguan',
      bulanan: 'dokumen_bulanan',
      progres50: 'dokumen_progres_50',
      progres100: 'dokumen_progres_100',
    };
    
    const fieldName = fieldMap[docType];
    if (!fieldName) return;

    onUpdateSchool({
      ...school,
      [fieldName]: newStatus
    });

    const msg = newStatus === 'dikirim' ? 'Dokumen berhasil dikirim ke Koordinator.' : 'Dokumen berhasil disetujui (direviu).';
    alert(msg);
  };

  const getContactDetails = (id) => {
    const contact = contacts.find((c) => c.id === id);
    return contact ? { nama: contact.nama, hp: contact.hp } : { nama: 'Belum ditentukan', hp: '-' };
  };

  const getFacilitatorName = (id) => {
    const user = users.find((u) => u.id === id);
    return user ? user.nama : 'Belum Ditugaskan';
  };

  const isMySchool = school.fasilitatorId === activeUser.id;
  const isAuthorizedToEdit = isMySchool || activeUser.role === 'admin';
  const isReviuAuthorized = activeUser.jabatanTim === 'Koordinator' || activeUser.role === 'admin';
  const facilitators = users.filter((u) => u.jabatanTim === 'Fasilitator' || u.jabatanTim === 'Ketua Tim');

  const perencana = getContactDetails(school.perencanaId);
  const pengawas = getContactDetails(school.pengawasId);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Navigation & Actions Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar
        </button>

        {isAuthorizedToEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" /> Lengkapi Profil Sekolah
          </button>
        )}
      </div>

      {/* Title & Stats Summary Banner */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            NPSN {school.npsn} • Kabupaten {school.kabupaten}
          </span>
          <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight mt-1">
            {school.nama_sekolah}
          </h2>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="text-xs font-medium bg-slate-950 border border-slate-850 px-3 py-1 rounded-xl text-slate-400">
              Kecamatan: {school.kecamatan || <span className="text-slate-600 italic">Belum diisi</span>}
            </span>
            <span className="text-xs font-medium bg-slate-950 border border-slate-850 px-3 py-1 rounded-xl text-slate-400">
              Desa: {school.desa || <span className="text-slate-600 italic">Belum diisi</span>}
            </span>
            <span className="text-xs font-medium bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl text-indigo-400">
              Pendamping: {getFacilitatorName(school.fasilitatorId)}
            </span>
          </div>
        </div>

        {/* Circular Progress Badge */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 w-full md:w-auto min-w-[200px] select-none">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center font-bold text-lg text-emerald-400">
            {school.progres_fisik}%
          </div>
          <div>
            <span className="block text-[10px] uppercase font-semibold text-slate-500">Progres Fisik</span>
            <span className="text-xs text-slate-400 font-medium">
              {totalTasks > 0 ? `Dihitung otomatis (${doneTasks}/${totalTasks} Tugas)` : 'Diinput Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-800 gap-2 select-none">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Profil & Kelengkapan Dokumen
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tasks'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListTodo className="w-4 h-4" /> Papan Tugas Lapangan ({totalTasks})
        </button>
      </div>

      {/* Alert Checkpoint Dinas */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
          {school.progres_fisik >= 50 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-400 text-sm">Target Kunjungan I Aktif</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Progres fisik telah mencapai 50% atau lebih. Fasilitator wajib melaksanakan Perjalanan Dinas Kunjungan I (selama 5 hari).
                </p>
              </div>
            </div>
          )}
          {school.progres_fisik === 100 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
              <Award className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-400 text-sm">Target Kunjungan II Selesai Pekerjaan</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Progres fisik telah mencapai 100%. Fasilitator wajib melaksanakan Kunjungan II (selama 5 hari) untuk serah terima aset.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Mode Content */}
      {isEditing ? (
        <form onSubmit={handleSaveProfile} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h3 className="font-semibold text-slate-100 text-base">Edit Informasi Profil Sekolah</h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
            >
              <X className="w-4 h-4" /> Batal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kecamatan</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nama Kecamatan"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Desa / Kelurahan</label>
              <input
                type="text"
                value={formData.desa}
                onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nama Desa"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.kepala_sekolah}
                onChange={(e) => setFormData({ ...formData, kepala_sekolah: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nama Kepala Sekolah"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">No HP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.hp_kepala_sekolah}
                onChange={(e) => setFormData({ ...formData, hp_kepala_sekolah: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Nomor Telepon/HP"
              />
            </div>

            <div className="border-t border-slate-800/60 pt-4 md:col-span-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
              Personil Perencana & Pengawas Lapangan
            </div>

            {/* Normalized Perencana Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Perencana</label>
              {!isAddingPerencana ? (
                <div className="flex gap-2">
                  <select
                    value={formData.perencanaId}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsAddingPerencana(true);
                      } else {
                        setFormData({ ...formData, perencanaId: e.target.value });
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- Pilih Kontak Mitra --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama} ({c.hp})</option>
                    ))}
                    <option value="new" className="text-indigo-400 font-bold bg-slate-900">+ Tambah Kontak Baru</option>
                  </select>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-indigo-400 font-semibold mb-1">
                    <span>Mitra Baru</span>
                    <button type="button" onClick={() => setIsAddingPerencana(false)} className="text-slate-500 hover:text-slate-300">Batal</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nama Perencana Baru"
                    value={newPerencana.nama}
                    onChange={(e) => setNewPerencana({ ...newPerencana, nama: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="No HP"
                    value={newPerencana.hp}
                    onChange={(e) => setNewPerencana({ ...newPerencana, hp: e.target.value.replace(/[^0-9+-]/g, '') })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Normalized Pengawas Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengawas</label>
              {!isAddingPengawas ? (
                <div className="flex gap-2">
                  <select
                    value={formData.pengawasId}
                    onChange={(e) => {
                      if (e.target.value === 'new') {
                        setIsAddingPengawas(true);
                      } else {
                        setFormData({ ...formData, pengawasId: e.target.value });
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">-- Pilih Kontak Mitra --</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama} ({c.hp})</option>
                    ))}
                    <option value="new" className="text-indigo-400 font-bold bg-slate-900">+ Tambah Kontak Baru</option>
                  </select>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-indigo-400 font-semibold mb-1">
                    <span>Mitra Baru</span>
                    <button type="button" onClick={() => setIsAddingPengawas(false)} className="text-slate-500 hover:text-slate-300">Batal</button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nama Pengawas Baru"
                    value={newPengawas.nama}
                    onChange={(e) => setNewPengawas({ ...newPengawas, nama: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="No HP"
                    value={newPengawas.hp}
                    onChange={(e) => setNewPengawas({ ...newPengawas, hp: e.target.value.replace(/[^0-9+-]/g, '') })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {activeUser.role === 'admin' && (
              <div className="md:col-span-2 pt-4 border-t border-slate-800/60">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Fasilitator Pendamping (Super Admin Only)</label>
                <select
                  value={formData.fasilitatorId}
                  onChange={(e) => setFormData({ ...formData, fasilitatorId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Kosongkan / Belum Ditugaskan --</option>
                  {facilitators.map(f => (
                    <option key={f.id} value={f.id}>{f.nama} ({f.jabatanTim})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg"
            >
              <Check className="w-4 h-4" /> Simpan Perubahan
            </button>
          </div>
        </form>
      ) : (
        /* Normal Tabs Content */
        <div>
          {/* Tab 1: Profile & Documents */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Metadata */}
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Informasi Sekolah & Kepegawaian
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Nama Sekolah</span>
                      <span className="text-sm font-medium text-slate-200">{school.nama_sekolah}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">NPSN</span>
                      <span className="text-sm font-mono font-medium text-slate-200">{school.npsn}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Kecamatan / Desa</span>
                      <span className="text-sm font-medium text-slate-200">
                        {school.kecamatan && school.desa ? `${school.kecamatan}, ${school.desa}` : <span className="text-slate-600 italic">Belum diisi</span>}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Kabupaten</span>
                      <span className="text-sm font-medium text-slate-200">{school.kabupaten}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Kepala Sekolah</span>
                      <span className="text-sm font-medium text-slate-200">{school.kepala_sekolah || <span className="text-slate-600 italic">Belum diisi</span>}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">No HP Kepala Sekolah</span>
                      <span className="text-sm font-medium text-slate-200">{school.hp_kepala_sekolah || <span className="text-slate-600 italic">Belum diisi</span>}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Mitra Pelaksana Lapangan (Ternormalisasi)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Perencana Lapangan</span>
                      <span className="text-sm font-medium text-slate-200">{perencana.nama}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">HP Perencana</span>
                      <span className="text-sm font-medium text-slate-200">{perencana.hp}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Pengawas Lapangan</span>
                      <span className="text-sm font-medium text-slate-200">{pengawas.nama}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">HP Pengawas</span>
                      <span className="text-sm font-medium text-slate-200">{pengawas.hp}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Progress & Docs checklist */}
              <div className="space-y-6">
                
                {/* Manual Progress Slider (Only if NO tasks are assigned) */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    Update Progres Konstruksi
                  </h3>
                  {totalTasks > 0 ? (
                    <div className="bg-slate-950/40 rounded-xl border border-slate-850 p-4 text-center">
                      <ListTodo className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Progress fisik dihitung otomatis berdasarkan Papan Tugas. Progres saat ini: <strong>{calculatedProgress}%</strong>.
                      </p>
                    </div>
                  ) : isAuthorizedToEdit ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progresInput}
                          onChange={(e) => setProgresInput(e.target.value)}
                          className="flex-1 accent-indigo-500 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="w-16">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={progresInput}
                            onChange={(e) => setProgresInput(e.target.value)}
                            className="w-full text-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-sm font-bold text-slate-200"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleQuickProgressSave}
                        className="w-full py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                      >
                        Simpan Progres Fisik
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-slate-850 p-4">
                      <AlertTriangle className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Hanya Fasilitator Pendamping atau Super Admin yang dapat mengubah progres.
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents list */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" /> Berkas Laporan Sekolah
                  </h3>
                  <div className="space-y-3">
                    {[
                      { id: 'mingguan', name: 'Laporan Mingguan', field: 'dokumen_mingguan' },
                      { id: 'bulanan', name: 'Laporan Bulanan', field: 'dokumen_bulanan' },
                      { id: 'progres50', name: 'Laporan Progres 50%', field: 'dokumen_progres_50' },
                      { id: 'progres100', name: 'Laporan Progres 100%', field: 'dokumen_progres_100' },
                    ].map((doc) => {
                      const status = school[doc.field] || 'belum';
                      
                      return (
                        <div key={doc.id} className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 flex flex-col justify-between gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-300">{doc.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                              status === 'belum' 
                                ? 'bg-slate-800 text-slate-500 border border-slate-700/50'
                                : status === 'dikirim'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {status === 'belum' && 'Belum Dikirim'}
                              {status === 'dikirim' && 'Menunggu Reviu'}
                              {status === 'direviu' && 'Sudah Direviu'}
                            </span>
                          </div>

                          <div className="flex justify-end gap-1.5 pt-1.5 border-t border-slate-900/60">
                            {isMySchool && status === 'belum' && (
                              <button
                                onClick={() => handleDocumentAction(doc.id, 'dikirim')}
                                className="px-2.5 py-1 text-[10px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                              >
                                Kirim Laporan
                              </button>
                            )}

                            {isReviuAuthorized && status === 'dikirim' && (
                              <button
                                onClick={() => handleDocumentAction(doc.id, 'direviu')}
                                className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                              >
                                Setujui Reviu
                              </button>
                            )}
                            
                            {status === 'direviu' && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium select-none">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Selesai direviu
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Papan Tugas (Kanban-like Columns) */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              
              {/* Task board header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">Tugas Pemantauan Konstruksi</h3>
                  <p className="text-[11px] text-slate-500">Mencatat, memantau pengerjaan fisik di sekolah ini secara detail.</p>
                </div>
                {isAuthorizedToEdit && (
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tambah Pekerjaan
                  </button>
                )}
              </div>

              {/* Task Form (Modal or Inline) */}
              {isAddingTask && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 max-w-md">
                  <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Pekerjaan Lapangan Baru</h4>
                  <form onSubmit={handleAddTaskSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Nama Pekerjaan (Contoh: Pemasangan Kusen Pintu)"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <textarea
                        placeholder="Keterangan singkat"
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 focus:outline-none h-16 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <select
                          value={taskForm.priority}
                          onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                        >
                          <option value="low">Prioritas Rendah</option>
                          <option value="medium">Prioritas Sedang</option>
                          <option value="high">Prioritas Tinggi</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="date"
                          value={taskForm.dueDate}
                          onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs text-slate-200"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingTask(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-850"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Tambah Tugas
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Kanban Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
                
                {/* Column Loop */}
                {[
                  { id: 'todo', name: 'Belum Mulai (To Do)', color: 'border-slate-800 bg-slate-900/10' },
                  { id: 'inprogress', name: 'Sedang Pengerjaan', color: 'border-amber-500/10 bg-amber-500/[0.01]' },
                  { id: 'done', name: 'Selesai (Done)', color: 'border-emerald-500/10 bg-emerald-500/[0.01]' }
                ].map((col) => {
                  const colTasks = schoolTasks.filter((t) => t.status === col.id);

                  return (
                    <div key={col.id} className={`border rounded-2xl p-4 flex flex-col gap-3 min-h-[300px] ${col.color}`}>
                      <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800/60">
                        <span>{col.name}</span>
                        <span className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-[10px] text-indigo-400">{colTasks.length}</span>
                      </div>

                      {/* Tasks Cards list */}
                      <div className="flex-1 space-y-3 overflow-y-auto max-h-[450px] pr-1 no-scrollbar">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 transition-all space-y-2 relative group"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="font-semibold text-slate-200 text-xs leading-snug line-clamp-2">{task.title}</h5>
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                task.priority === 'high'
                                  ? 'bg-rose-500/10 text-rose-400'
                                  : task.priority === 'medium'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-[10px] text-slate-500 leading-normal line-clamp-3">{task.description}</p>
                            )}

                            {/* Task Footer: date & controls */}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-900/60 text-[9px] text-slate-500 font-semibold">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-600" /> {task.dueDate}
                              </span>
                              
                              {/* Action Buttons to move status */}
                              <div className="flex gap-1">
                                {isAuthorizedToEdit && (
                                  <>
                                    {task.status === 'todo' && (
                                      <button
                                        onClick={() => onUpdateTaskStatus(task.id, 'inprogress')}
                                        className="p-1 rounded bg-slate-950 hover:bg-slate-850 text-indigo-400"
                                        title="Kerjakan tugas"
                                      >
                                        <Play className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    {task.status === 'inprogress' && (
                                      <button
                                        onClick={() => onUpdateTaskStatus(task.id, 'done')}
                                        className="p-1 rounded bg-slate-950 hover:bg-slate-850 text-emerald-400"
                                        title="Selesaikan tugas"
                                      >
                                        <CheckCircle className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    
                                    {/* Delete task button */}
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Hapus tugas ini?')) {
                                          onDeleteTask(task.id);
                                        }
                                      }}
                                      className="p-1 rounded bg-slate-950 hover:bg-rose-950/40 text-slate-600 hover:text-rose-400"
                                      title="Hapus tugas"
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                          </div>
                        ))}

                        {colTasks.length === 0 && (
                          <div className="text-center py-8 text-[10px] text-slate-600 italic border border-dashed border-slate-850 rounded-xl">
                            Kosong
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}

              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
