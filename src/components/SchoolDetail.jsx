import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Edit2, Check, X, ShieldAlert, Award, FileCheck, 
  CheckCircle2, AlertTriangle, ListTodo, Plus, Trash2, Calendar, 
  ChevronRight, Play, CheckCircle, AlertCircle, Phone, User, Pencil,
  Download, FileText, Sparkles
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
  onAddContact,
  schoolDocs = [],
  onAddSchoolDoc,
  onDeleteSchoolDoc
}) {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'documents'
  const [progresInput, setProgresInput] = useState(school?.progres_fisik || 0);

  // Inline edit state: which field is being edited and its temp value
  const [inlineField, setInlineField] = useState(null); // 'kecamatan' | 'desa' | 'kepala_sekolah' | 'hp_kepala_sekolah' | 'perencanaId' | 'pengawasId' | 'fasilitatorId'
  const [inlineValue, setInlineValue] = useState('');
  const inlineInputRef = useRef(null);

  // Inline new contact creation
  const [newContactFor, setNewContactFor] = useState(null); // 'perencanaId' | 'pengawasId'
  const [newContactData, setNewContactData] = useState({ nama: '', hp: '' });

  // Add Task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  });

  // Filter tasks for this school
  const schoolTasks = tasks && school ? tasks.filter((t) => t.sekolahId === school.npsn) : [];
  const totalTasks = schoolTasks.length;
  const doneTasks = schoolTasks.filter((t) => t.status === 'done').length;
  
  // Calculate dynamic progress if tasks exist, else use manual/stored progress
  const calculatedProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (school?.progres_fisik || 0);

  // Filter documents for this school
  const mySchoolDocs = schoolDocs && school ? schoolDocs.filter((d) => d.sekolahId === school.npsn) : [];

  // Pre-calculate document presence
  const hasMingguan = mySchoolDocs.some(d => d.category === 'lap_mingguan');
  const hasBulanan = mySchoolDocs.some(d => d.category === 'lap_bulanan');
  const hasProgres50 = mySchoolDocs.some(d => d.category === 'lap_progres_50');
  const hasProgres100 = mySchoolDocs.some(d => d.category === 'lap_progres_100');

  useEffect(() => {
    if (school) {
      setProgresInput(school.progres_fisik || 0);
    }
  }, [school]);

  // Focus the inline input when it appears
  useEffect(() => {
    if (inlineField && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [inlineField]);

  // Sync calculated progress to school parent state when tasks update
  useEffect(() => {
    if (school && totalTasks > 0 && calculatedProgress !== school.progres_fisik) {
      onUpdateSchool({
        ...school,
        progres_fisik: calculatedProgress
      });
    }
  }, [calculatedProgress, totalTasks]);

  // Sync document fields based on upload presence automatically
  useEffect(() => {
    if (!school) return;
    const expectedMingguan = hasMingguan ? 'direviu' : 'belum';
    const expectedBulanan = hasBulanan ? 'direviu' : 'belum';
    const expectedProgres50 = hasProgres50 ? 'direviu' : 'belum';
    const expectedProgres100 = hasProgres100 ? 'direviu' : 'belum';

    if (
      school.dokumen_mingguan !== expectedMingguan ||
      school.dokumen_bulanan !== expectedBulanan ||
      school.dokumen_progres_50 !== expectedProgres50 ||
      school.dokumen_progres_100 !== expectedProgres100
    ) {
      onUpdateSchool({
        ...school,
        dokumen_mingguan: expectedMingguan,
        dokumen_bulanan: expectedBulanan,
        dokumen_progres_50: expectedProgres50,
        dokumen_progres_100: expectedProgres100
      });
    }
  }, [hasMingguan, hasBulanan, hasProgres50, hasProgres100, school?.npsn]);

  // Guard clause for undefined school (executed safely after all hooks are initialized)
  if (!school) {
    return (
      <div className="space-y-6 p-6 text-center select-none animate-fade-in">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 max-w-md mx-auto shadow-2xl backdrop-blur-md">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-100 mb-2">Sekolah Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Data sekolah yang Anda pilih tidak tersedia atau telah dihapus dari sistem.
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg cursor-pointer"
          >
            Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  // Start inline editing for a text field
  const startInlineEdit = (fieldName) => {
    setInlineField(fieldName);
    setInlineValue(school[fieldName] || '');
    setNewContactFor(null);
  };

  // Start inline editing for a contact dropdown field
  const startContactEdit = (fieldName) => {
    setInlineField(fieldName);
    setInlineValue(school[fieldName] || '');
    setNewContactFor(null);
    setNewContactData({ nama: '', hp: '' });
  };

  // Save an inline text field
  const saveInlineField = () => {
    if (inlineField) {
      onUpdateSchool({ ...school, [inlineField]: inlineValue });
      setInlineField(null);
      setInlineValue('');
    }
  };

  // Save a contact selection
  const saveContactField = (fieldName, contactId) => {
    onUpdateSchool({ ...school, [fieldName]: contactId });
    setInlineField(null);
    setInlineValue('');
    setNewContactFor(null);
  };

  // Save newly created contact and assign
  const saveNewContact = (fieldName) => {
    if (!newContactData.nama.trim() || !newContactData.hp.trim()) return;
    const suffix = fieldName === 'perencanaId' ? 'p' : 'w';
    const newId = `contact-${Date.now()}-${suffix}`;
    onAddContact({ id: newId, nama: newContactData.nama, hp: newContactData.hp });
    onUpdateSchool({ ...school, [fieldName]: newId });
    setInlineField(null);
    setNewContactFor(null);
    setNewContactData({ nama: '', hp: '' });
  };

  // Cancel inline editing
  const cancelInlineEdit = () => {
    setInlineField(null);
    setInlineValue('');
    setNewContactFor(null);
    setNewContactData({ nama: '', hp: '' });
  };

  // Handle Enter/Escape on inline inputs
  const handleInlineKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineField();
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  // Handle Enter on new contact creation
  const handleNewContactKeyDown = (e, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveNewContact(fieldName);
    } else if (e.key === 'Escape') {
      cancelInlineEdit();
    }
  };

  const handleQuickProgressSave = () => {
    if (totalTasks > 0) {
      return window.showAlert('Progress fisik dihitung otomatis berdasarkan Papan Tugas. Selesaikan tugas untuk menambah progress!');
    }
    onUpdateSchool({
      ...school,
      progres_fisik: Number(progresInput),
    });
    window.showAlert(`Progres fisik berhasil diubah menjadi ${progresInput}%`);
  };

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return window.showAlert('Judul tugas wajib diisi');

    const newTask = {
      id: `task-${Date.now()}`,
      sekolahId: school.npsn,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      status: 'todo',
      dueDate: taskForm.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: school.fasilitatorId || (activeUser ? activeUser.id : ''),
    };

    onAddTask(newTask);
    setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '' });
    setIsAddingTask(false);
    window.showAlert('Tugas lapangan baru berhasil ditambahkan!');
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
    window.showAlert(msg);
  };

  const getContactDetails = (id) => {
    const contact = contacts.find((c) => c.id === id);
    return contact ? { nama: contact.nama, hp: contact.hp } : { nama: 'Belum ditentukan', hp: '-' };
  };

  const getFacilitatorName = (id) => {
    const user = users.find((u) => u.id === id);
    return user ? user.nama : 'Belum Ditugaskan';
  };

  const isMySchool = activeUser ? school.fasilitatorId === activeUser.id : false;
  const isAuthorizedToEdit = activeUser ? (isMySchool || activeUser.role === 'admin') : false;
  const isReviuAuthorized = activeUser ? (activeUser.jabatanTim === 'Koordinator' || activeUser.role === 'admin') : false;
  const canDeleteDoc = (file) => {
    if (!activeUser) return false;
    return (
      isAuthorizedToEdit ||
      file.uploadedBy === activeUser.nama ||
      activeUser.role === 'admin' ||
      activeUser.jabatanTim === 'Super Admin' ||
      activeUser.jabatanTim === 'Ketua Tim' ||
      activeUser.jabatanTim === 'Koordinator'
    );
  };
  const facilitators = users.filter((u) => u.jabatanTim === 'Fasilitator' || u.jabatanTim === 'Ketua Tim');

  const perencana = getContactDetails(school.perencanaId);
  const pengawas = getContactDetails(school.pengawasId);

  const docCategories = [
    { key: 'administrasi', label: 'Dokumen Administrasi' },
    { key: 'teknis', label: 'Dokumen Teknis' },
    { key: 'rab_fisik', label: 'RAB Fisik' },
    { key: 'rab_meubeler', label: 'RAB Meubeler' },
    { key: 'rab_manajemen', label: 'RAB Manajemen' },
    { key: 'kurva_s', label: 'Kurva S' },
    { key: 'berita_acara', label: 'Berita Acara' },
    { key: 'pks', label: 'PKS' }
  ];

  const reportCategories = [
    { key: 'lap_pendahuluan', label: 'Laporan Pendahuluan' },
    { key: 'lap_harian', label: 'Laporan Harian' },
    { key: 'lap_mingguan', label: 'Laporan Mingguan' },
    { key: 'lap_bulanan', label: 'Laporan Bulanan' },
    { key: 'lap_progres_50', label: 'Laporan Progress 50%' },
    { key: 'lap_progres_100', label: 'Laporan Progress 100%' },
    { key: 'lap_akhir', label: 'Laporan Akhir' },
    { key: 'lap_lainnya', label: 'Laporan Lainnya' }
  ];

  const technicalDocs = mySchoolDocs.filter((d) => docCategories.some((c) => c.key === d.category));
  const reportDocs = mySchoolDocs.filter((d) => reportCategories.some((c) => c.key === d.category));

  const allDocTypes = [
    ...docCategories.map(c => ({ ...c, type: 'Teknis' })),
    ...reportCategories.map(c => ({ ...c, type: 'Laporan' }))
  ];

  const handleUploadSchoolDoc = (e, categoryKey) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      return window.showAlert('Ukuran file terlalu besar! Maksimal ukuran file adalah 50MB.');
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const newDoc = {
        id: `sdoc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sekolahId: school.npsn,
        category: categoryKey,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        fileData: event.target.result, // Base64 data URL
        uploadedBy: activeUser ? activeUser.nama : 'Guest',
        uploadedAt: new Date().toISOString()
      };

      onAddSchoolDoc(newDoc);
      
      const isReport = reportCategories.some(c => c.key === categoryKey);
      const catLabel = isReport 
        ? reportCategories.find(c => c.key === categoryKey).label 
        : docCategories.find(c => c.key === categoryKey).label;

      window.showAlert(`Dokumen "${file.name}" berhasil diunggah dalam kategori "${catLabel}"!`);
      e.target.value = '';
    };
  };

  const handleDownloadFile = (file) => {
    try {
      const link = document.createElement('a');
      link.href = file.fileData;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      window.showAlert('Gagal mendownload file');
    }
  };

  const handleOpenFile = (file) => {
    try {
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
      handleDownloadFile(file);
    }
  };

  const handleUploadBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return window.showAlert('Ukuran file gambar terlalu besar! Maksimal 10MB.');
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        
        onUpdateSchool({
          ...school,
          foto_banner: compressedBase64
        });
        window.showAlert('Foto sekolah berhasil diperbarui!');
      };
    };
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Navigation & Actions Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>

      {/* School Banner Image */}
      <div className="relative group h-48 md:h-64 rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/60 select-none">
        {school.foto_banner ? (
          <img
            src={school.foto_banner}
            alt={school.nama_sekolah}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 flex flex-col items-center justify-center gap-2 text-slate-500">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">Klik untuk unggah foto sekolah</span>
          </div>
        )}
        
        {/* Overlay on Hover */}
        <label
          htmlFor="banner-upload-input"
          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity duration-300"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">
            {school.foto_banner ? 'Ganti Foto Sekolah' : 'Unggah Foto Sekolah'}
          </span>
          <input
            type="file"
            id="banner-upload-input"
            accept="image/*"
            onChange={handleUploadBanner}
            className="hidden"
          />
        </label>
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
              Fasilitator: {getFacilitatorName(school.fasilitatorId)}
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
              Diinput Manual
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
          Profil & Kelengkapan
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'documents'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Dokumen Pendukung Teknis ({technicalDocs.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Upload Laporan ({reportDocs.length})
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

      {/* Tab Content */}
      <div>
          {/* Tab 1: Profile & Documents */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Metadata with Inline Edit */}
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 lg:col-span-2 space-y-6">

                {/* Incomplete Data Alert for Facilitators */}
                {(() => {
                  const missing = [];
                  if (!school.kepala_sekolah) missing.push('Kepala Sekolah');
                  if (!school.hp_kepala_sekolah) missing.push('HP Kepsek');
                  if (!school.perencanaId) missing.push('Perencana');
                  if (!school.pengawasId) missing.push('Pengawas');
                  if (isMySchool && missing.length > 0) {
                    return (
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-400 text-xs">Data Belum Lengkap ({missing.length})</span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Klik ikon <Pencil className="w-3 h-3 inline text-slate-400" /> di samping field untuk mengisi. Tekan <kbd className="px-1 py-0.5 bg-slate-800 rounded text-[9px] text-slate-300 font-mono">Enter</kbd> untuk simpan.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  if (isMySchool && missing.length === 0) {
                    return (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-400 text-xs">Data Sekolah Sudah Lengkap</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Section: Informasi Sekolah */}
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Informasi Sekolah & Kepegawaian
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Nama Sekolah (read-only) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Nama Sekolah</span>
                      <span className="text-sm font-medium text-slate-200">{school.nama_sekolah}</span>
                    </div>

                    {/* NPSN (read-only) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">NPSN</span>
                      <span className="text-sm font-mono font-medium text-slate-200">{school.npsn}</span>
                    </div>

                    {/* Kecamatan (inline-editable) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Kecamatan</span>
                      {inlineField === 'kecamatan' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            onBlur={saveInlineField}
                            className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Nama Kecamatan"
                          />
                          <button onMouseDown={(e) => e.preventDefault()} onClick={saveInlineField} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onMouseDown={(e) => e.preventDefault()} onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/field mt-0.5">
                          <span className={`text-sm font-medium ${school.kecamatan ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                            {school.kecamatan || 'Belum diisi'}
                          </span>
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startInlineEdit('kecamatan')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.kecamatan ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Edit Kecamatan"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Desa (inline-editable) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Desa / Kelurahan</span>
                      {inlineField === 'desa' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            onBlur={saveInlineField}
                            className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Nama Desa"
                          />
                          <button onMouseDown={(e) => e.preventDefault()} onClick={saveInlineField} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onMouseDown={(e) => e.preventDefault()} onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/field mt-0.5">
                          <span className={`text-sm font-medium ${school.desa ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                            {school.desa || 'Belum diisi'}
                          </span>
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startInlineEdit('desa')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.desa ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Edit Desa"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Kabupaten (read-only) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Kabupaten</span>
                      <span className="text-sm font-medium text-slate-200">{school.kabupaten}</span>
                    </div>

                    {/* Google Maps / Koordinat (inline-editable) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Google Maps / Koordinat</span>
                      {inlineField === 'koordinat' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            onBlur={saveInlineField}
                            className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Link Maps atau Lat, Long"
                          />
                          <button onMouseDown={(e) => e.preventDefault()} onClick={saveInlineField} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onMouseDown={(e) => e.preventDefault()} onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span 
                            onClick={() => isAuthorizedToEdit && startInlineEdit('koordinat')}
                            className={`text-sm font-medium transition-colors ${
                              isAuthorizedToEdit ? 'cursor-pointer hover:text-indigo-400' : ''
                            } ${
                              school.koordinat ? 'text-slate-200 truncate max-w-[130px] sm:max-w-none block' : 'text-slate-650 italic'
                            }`}
                            title={isAuthorizedToEdit ? "Klik untuk mengedit lokasi" : ""}
                          >
                            {school.koordinat || 'Belum diisi'}
                          </span>
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startInlineEdit('koordinat')}
                              className="p-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer"
                              title="Edit Google Maps / Koordinat"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {school.koordinat && (
                            <a
                              href={school.koordinat.startsWith('http') ? school.koordinat : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.koordinat)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline shrink-0 cursor-pointer ml-1"
                            >
                              Peta
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Kepala Sekolah (inline-editable) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Kepala Sekolah</span>
                      {inlineField === 'kepala_sekolah' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            onBlur={saveInlineField}
                            className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Nama Kepala Sekolah"
                          />
                          <button onMouseDown={(e) => e.preventDefault()} onClick={saveInlineField} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onMouseDown={(e) => e.preventDefault()} onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/field mt-0.5">
                          {school.kepala_sekolah ? (
                            <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              {school.kepala_sekolah}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-600 italic">Belum diisi</span>
                          )}
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startInlineEdit('kepala_sekolah')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.kepala_sekolah ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Edit Kepala Sekolah"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* HP Kepala Sekolah (inline-editable) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">No HP Kepala Sekolah</span>
                      {inlineField === 'hp_kepala_sekolah' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value.replace(/[^0-9+-]/g, ''))}
                            onKeyDown={handleInlineKeyDown}
                            onBlur={saveInlineField}
                            className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="08xxxxxxxxxx"
                          />
                          <button onMouseDown={(e) => e.preventDefault()} onClick={saveInlineField} className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onMouseDown={(e) => e.preventDefault()} onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/field mt-0.5">
                          {school.hp_kepala_sekolah ? (
                            <span className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              {school.hp_kepala_sekolah}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-600 italic">Belum diisi</span>
                          )}
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startInlineEdit('hp_kepala_sekolah')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.hp_kepala_sekolah ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Edit No HP"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Google Map Embedded Iframe */}
                  <div className="mt-6 pt-5 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="block text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Peta Lokasi Sekolah</span>
                      <a
                        href={school.koordinat && school.koordinat.startsWith('http') ? school.koordinat : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.koordinat || `${school.nama_sekolah}, Kabupaten ${school.kabupaten}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline shrink-0 cursor-pointer"
                      >
                        Buka di Google Maps
                      </a>
                    </div>
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        (() => {
                          if (!school.koordinat) return `${school.nama_sekolah}, Kabupaten ${school.kabupaten}`;
                          if (school.koordinat.startsWith('http')) {
                            const match = school.koordinat.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                            if (match) return `${match[1]},${match[2]}`;
                            return `${school.nama_sekolah}, Kabupaten ${school.kabupaten}`;
                          }
                          return school.koordinat;
                        })()
                      )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="240"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      className="rounded-2xl border border-slate-800 shadow-xl bg-slate-950/40"
                      title="Google Map"
                    ></iframe>
                  </div>

                </div>

                {/* Section: Mitra Pelaksana Lapangan */}
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Mitra Pelaksana Lapangan
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Perencana (inline-editable dropdown) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Perencana Lapangan</span>
                      {inlineField === 'perencanaId' ? (
                        <div className="mt-0.5 space-y-2">
                          {newContactFor === 'perencanaId' ? (
                            <div className="bg-slate-950 border border-indigo-500/30 p-3 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-[10px] text-indigo-400 font-semibold">
                                <span>Kontak Perencana Baru</span>
                                <button onClick={() => setNewContactFor(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">Kembali</button>
                              </div>
                              <input
                                type="text"
                                placeholder="Nama Perencana"
                                value={newContactData.nama}
                                onChange={(e) => setNewContactData({ ...newContactData, nama: e.target.value })}
                                onKeyDown={(e) => handleNewContactKeyDown(e, 'perencanaId')}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="No HP"
                                value={newContactData.hp}
                                onChange={(e) => setNewContactData({ ...newContactData, hp: e.target.value.replace(/[^0-9+-]/g, '') })}
                                onKeyDown={(e) => handleNewContactKeyDown(e, 'perencanaId')}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                              />
                              <div className="flex gap-1.5 justify-end pt-1">
                                <button onClick={cancelInlineEdit} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer">Batal</button>
                                <button onClick={() => saveNewContact('perencanaId')} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={inlineValue}
                                onChange={(e) => {
                                  if (e.target.value === 'new') {
                                    setNewContactFor('perencanaId');
                                  } else {
                                    saveContactField('perencanaId', e.target.value);
                                  }
                                }}
                                className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                                autoFocus
                              >
                                <option value="">-- Pilih Kontak --</option>
                                {contacts.map((c) => (
                                  <option key={c.id} value={c.id}>{c.nama} ({c.hp})</option>
                                ))}
                                <option value="new" className="text-indigo-400 font-bold bg-slate-900">+ Tambah Kontak Baru</option>
                              </select>
                              <button onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/field mt-0.5">
                          {school.perencanaId ? (
                            <span className="text-sm font-medium text-slate-200">{perencana.nama}</span>
                          ) : (
                            <span className="text-sm font-medium text-slate-600 italic">Belum ditentukan</span>
                          )}
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startContactEdit('perencanaId')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.perencanaId ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Ubah Perencana"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* HP Perencana (read-only, from contact) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">HP Perencana</span>
                      <span className="text-sm font-medium text-slate-200 mt-0.5 block">
                        {school.perencanaId ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {perencana.hp}
                          </span>
                        ) : <span className="text-slate-600 italic">-</span>}
                      </span>
                    </div>

                    {/* Pengawas (inline-editable dropdown) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Pengawas Lapangan</span>
                      {inlineField === 'pengawasId' ? (
                        <div className="mt-0.5 space-y-2">
                          {newContactFor === 'pengawasId' ? (
                            <div className="bg-slate-950 border border-indigo-500/30 p-3 rounded-xl space-y-2">
                              <div className="flex justify-between items-center text-[10px] text-indigo-400 font-semibold">
                                <span>Kontak Pengawas Baru</span>
                                <button onClick={() => setNewContactFor(null)} className="text-slate-500 hover:text-slate-300 cursor-pointer">Kembali</button>
                              </div>
                              <input
                                type="text"
                                placeholder="Nama Pengawas"
                                value={newContactData.nama}
                                onChange={(e) => setNewContactData({ ...newContactData, nama: e.target.value })}
                                onKeyDown={(e) => handleNewContactKeyDown(e, 'pengawasId')}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                                autoFocus
                              />
                              <input
                                type="text"
                                placeholder="No HP"
                                value={newContactData.hp}
                                onChange={(e) => setNewContactData({ ...newContactData, hp: e.target.value.replace(/[^0-9+-]/g, '') })}
                                onKeyDown={(e) => handleNewContactKeyDown(e, 'pengawasId')}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                              />
                              <div className="flex gap-1.5 justify-end pt-1">
                                <button onClick={cancelInlineEdit} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer">Batal</button>
                                <button onClick={() => saveNewContact('pengawasId')} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <select
                                value={inlineValue}
                                onChange={(e) => {
                                  if (e.target.value === 'new') {
                                    setNewContactFor('pengawasId');
                                  } else {
                                    saveContactField('pengawasId', e.target.value);
                                  }
                                }}
                                className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                                autoFocus
                              >
                                <option value="">-- Pilih Kontak --</option>
                                {contacts.map((c) => (
                                  <option key={c.id} value={c.id}>{c.nama} ({c.hp})</option>
                                ))}
                                <option value="new" className="text-indigo-400 font-bold bg-slate-900">+ Tambah Kontak Baru</option>
                              </select>
                              <button onClick={cancelInlineEdit} className="p-1 rounded-lg text-slate-500 hover:bg-slate-800 transition-colors cursor-pointer">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/field mt-0.5">
                          {school.pengawasId ? (
                            <span className="text-sm font-medium text-slate-200">{pengawas.nama}</span>
                          ) : (
                            <span className="text-sm font-medium text-slate-600 italic">Belum ditentukan</span>
                          )}
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startContactEdit('pengawasId')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.pengawasId ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Ubah Pengawas"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* HP Pengawas (read-only, from contact) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">HP Pengawas</span>
                      <span className="text-sm font-medium text-slate-200 mt-0.5 block">
                        {school.pengawasId ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {pengawas.hp}
                          </span>
                        ) : <span className="text-slate-600 italic">-</span>}
                      </span>
                    </div>

                  </div>
                </div>
              </div>

              {/* Right Column: Progress & Docs checklist */}
              <div className="space-y-6">
                
                {/* Manual Progress Slider */}
                <div className={isAuthorizedToEdit ? 'card-update-progress-glow rounded-2xl p-6 transition-all duration-300' : 'bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 transition-all duration-300'}>
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-2 select-none">
                    <span className="flex items-center gap-2">
                      {isAuthorizedToEdit && <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />}
                      Update Progres Konstruksi
                    </span>
                    {isAuthorizedToEdit && (
                      <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 shadow-sm">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
                        </span>
                        Fokus Utama
                      </span>
                    )}
                  </h3>
                  {isAuthorizedToEdit ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progresInput}
                          onChange={(e) => setProgresInput(e.target.value)}
                          className="flex-1 accent-indigo-500 h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                          style={{
                            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${progresInput || 0}%, #e2e8f0 ${progresInput || 0}%, #e2e8f0 100%)`
                          }}
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
                      <AlertTriangle className="w-5 h-5 text-slate-605 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Hanya Fasilitator atau Super Admin yang dapat mengubah progres.
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents table list */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" /> Progres Upload Dokumen
                  </h3>
                  
                  {/* Table list */}
                  <div className="overflow-x-auto max-h-[360px] overflow-y-auto border border-slate-855/80 rounded-xl bg-slate-950/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 border-b border-slate-855 text-slate-400 text-[9px] uppercase tracking-wider font-bold select-none sticky top-0 backdrop-blur-md">
                          <th className="py-2.5 px-3">Nama Dokumen / Laporan</th>
                          <th className="py-2.5 px-3 text-center">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {allDocTypes.map((doc) => {
                          const uploadedCount = mySchoolDocs.filter((d) => d.category === doc.key).length;

                          return (
                            <tr key={doc.key} className="hover:bg-slate-900/20 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-300">
                                <span className="block truncate max-w-[170px] sm:max-w-none text-[11px]" title={doc.label}>
                                  {doc.label}
                                </span>
                                <span className="text-[8px] text-slate-500 font-semibold uppercase block leading-tight">{doc.type}</span>
                              </td>
                              <td className={`py-2.5 px-3 text-center font-bold text-xs transition-colors ${
                                uploadedCount > 0 
                                  ? 'bg-emerald-500/30 text-emerald-400' 
                                  : 'bg-rose-500/30 text-rose-450'
                              }`}>
                                {uploadedCount > 0 ? uploadedCount : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Dokumen Pendukung Teknis (Upload Panel) */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800 select-none">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">Dokumen Pendukung Teknis</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Unggah dan kelola kelengkapan dokumen teknis proyek sekolah ini.</p>
                </div>
              </div>

              {/* Grid of Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {docCategories.map((cat) => {
                  const catFiles = mySchoolDocs.filter((d) => d.category === cat.key);

                  return (
                    <div key={cat.key} className="bg-slate-900/20 border border-slate-850/80 rounded-2xl p-5 flex flex-col gap-4">
                      {/* Header with Title and Upload Button */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 select-none">
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">{cat.label}</h4>
                          <span className="text-[9px] text-slate-500">{catFiles.length} Berkas terunggah</span>
                        </div>
                        {isAuthorizedToEdit && (
                          <label className="px-2.5 py-1 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-all flex items-center gap-1 select-none shadow shadow-indigo-650/10">
                            <Plus className="w-3.5 h-3.5" />
                            Unggah
                            <input
                              type="file"
                              onChange={(e) => handleUploadSchoolDoc(e, cat.key)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Files List */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                        {catFiles.map((file) => (
                          <div
                            key={file.id}
                            className="bg-slate-950/60 border border-slate-855 rounded-xl p-3 flex justify-between items-center gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span 
                                onClick={() => handleOpenFile(file)}
                                className="font-semibold text-slate-350 text-xs truncate block cursor-pointer hover:text-indigo-400 hover:underline transition-all"
                                title="Klik untuk membuka dokumen"
                              >
                                {file.fileName}
                              </span>
                              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium mt-1 select-none">
                                <span>{file.fileSize}</span>
                                <span>•</span>
                                <span>Oleh: {file.uploadedBy}</span>
                                <span>•</span>
                                <span>{new Date(file.uploadedAt).toLocaleDateString('id-ID')}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleDownloadFile(file)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {canDeleteDoc(file) && (
                                <button
                                  onClick={async () => {
                                    if (await window.showConfirm(`Hapus dokumen "${file.fileName}"?`)) {
                                      onDeleteSchoolDoc(file.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Hapus Dokumen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {catFiles.length === 0 && (
                          <div className="text-center py-6 text-[10px] text-slate-650 italic border border-dashed border-slate-850/60 rounded-xl select-none">
                            Belum ada berkas diunggah
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Upload Laporan (Upload Panel) */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-slate-800 select-none">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">Upload Laporan Sekolah</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Unggah dan kelola kelengkapan dokumen laporan dari sekolah ini.</p>
                </div>
              </div>

              {/* Grid of Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportCategories.map((cat) => {
                  const catFiles = mySchoolDocs.filter((d) => d.category === cat.key);

                  return (
                    <div key={cat.key} className="bg-slate-900/20 border border-slate-855 rounded-2xl p-5 flex flex-col gap-4">
                      {/* Header with Title and Upload Button */}
                      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60 select-none">
                        <div>
                          <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">{cat.label}</h4>
                          <span className="text-[9px] text-slate-500">{catFiles.length} Berkas terunggah</span>
                        </div>
                        {isAuthorizedToEdit && (
                          <label className="px-2.5 py-1 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-all flex items-center gap-1 select-none shadow shadow-indigo-650/10">
                            <Plus className="w-3.5 h-3.5" />
                            Unggah
                            <input
                              type="file"
                              onChange={(e) => handleUploadSchoolDoc(e, cat.key)}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>

                      {/* Files List */}
                      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
                        {catFiles.map((file) => (
                          <div
                            key={file.id}
                            className="bg-slate-950/60 border border-slate-855 rounded-xl p-3 flex justify-between items-center gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <span 
                                onClick={() => handleOpenFile(file)}
                                className="font-semibold text-slate-350 text-xs truncate block cursor-pointer hover:text-indigo-400 hover:underline transition-all"
                                title="Klik untuk membuka dokumen"
                              >
                                {file.fileName}
                              </span>
                              <div className="flex items-center gap-2 text-[9px] text-slate-500 font-medium mt-1 select-none">
                                <span>{file.fileSize}</span>
                                <span>•</span>
                                <span>Oleh: {file.uploadedBy}</span>
                                <span>•</span>
                                <span>{new Date(file.uploadedAt).toLocaleDateString('id-ID')}</span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleDownloadFile(file)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                                title="Download File"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {canDeleteDoc(file) && (
                                <button
                                  onClick={async () => {
                                    if (await window.showConfirm(`Hapus dokumen "${file.fileName}"?`)) {
                                      onDeleteSchoolDoc(file.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Hapus Dokumen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {catFiles.length === 0 && (
                          <div className="text-center py-6 text-[10px] text-slate-650 italic border border-dashed border-slate-850/60 rounded-xl select-none">
                            Belum ada berkas diunggah
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
    </div>
  );
}
