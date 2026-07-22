import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Edit2, Check, X, ShieldAlert, Award, FileCheck, 
  CheckCircle2, AlertTriangle, ListTodo, Plus, Trash2, Calendar, 
  ChevronRight, Play, CheckCircle, AlertCircle, Phone, User, Pencil,
  Download, FileText, Sparkles, Bold, Italic, List, ListOrdered, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Paperclip, MessageSquare, Send,
  Save, Loader2
} from 'lucide-react';

// Rich Text Editor kustom
function RichTextEditor({ value, onChange, placeholder = "Tulis isi laporan kendala..." }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border-b border-slate-200 p-2 select-none">
        {/* Group 1: Basic styling */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Tebal (Bold)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Miring (Italic)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

        {/* Group 2: Heading & Font Size */}
        <select
          onChange={(e) => {
            executeCommand('formatBlock', e.target.value);
            e.target.value = "";
          }}
          className="bg-white border border-slate-300 text-slate-700 text-[10px] sm:text-xs px-1.5 py-0.5 rounded outline-none cursor-pointer font-medium h-7"
          defaultValue=""
          title="Format Heading"
        >
          <option value="" disabled>Heading</option>
          <option value="<p>">Normal</option>
          <option value="<h1>">Heading 1</option>
          <option value="<h2>">Heading 2</option>
          <option value="<h3>">Heading 3</option>
        </select>

        <select
          onChange={(e) => executeCommand('fontSize', e.target.value)}
          className="bg-white border border-slate-300 text-slate-700 text-[10px] sm:text-xs px-1.5 py-0.5 rounded outline-none cursor-pointer font-medium h-7"
          defaultValue=""
          title="Ukuran Font"
        >
          <option value="" disabled>Ukuran</option>
          <option value="1">Sangat Kecil</option>
          <option value="2">Kecil</option>
          <option value="3">Normal</option>
          <option value="4">Sedang</option>
          <option value="5">Besar</option>
          <option value="6">Sangat Besar</option>
          <option value="7">Maksimal</option>
        </select>
        <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

        {/* Group 3: Colors */}
        <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded h-7">
          <span className="text-[9px] uppercase font-bold text-slate-500">Teks</span>
          <input
            type="color"
            onChange={(e) => executeCommand('foreColor', e.target.value)}
            className="w-4 h-4 p-0 border-0 cursor-pointer bg-transparent rounded"
            defaultValue="#151c27"
            title="Pilih Warna Teks"
          />
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-300 px-1.5 py-0.5 rounded h-7">
          <span className="text-[9px] uppercase font-bold text-slate-500">Stabilo</span>
          <input
            type="color"
            onChange={(e) => executeCommand('hiliteColor', e.target.value)}
            className="w-4 h-4 p-0 border-0 cursor-pointer bg-transparent rounded"
            defaultValue="#ffffff"
            title="Pilih Warna Highlight"
          />
        </div>
        <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

        {/* Group 4: Lists */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Daftar Simbol (Bullet List)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Daftar Nomor (Numbered List)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-300 mx-0.5"></div>

        {/* Group 5: Alignment */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Rata Kiri"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Rata Tengah"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Rata Kanan"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          className="p-1.5 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Rata Kanan Kiri (Justify)"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 min-h-[140px] focus:outline-none text-xs text-slate-100 kendala-rich-text bg-white"
        placeholder={placeholder}
        style={{ outline: 'none' }}
      ></div>
    </div>
  );
}

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
  onUpdateContact,
  schoolDocs = [],
  onAddSchoolDoc,
  onDeleteSchoolDoc,
  kendala = [],
  kendalaComments = [],
  kendalaDocs = [],
  onAddKendala,
  onDeleteKendala,
  onAddKendalaComment,
  onDeleteKendalaComment,
  onDeleteKendalaDoc,
  initialTab = 'profile'
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'profile');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [progresInput, setProgresInput] = useState(school?.progres_fisik || 0);
  const [uploadingState, setUploadingState] = useState({});
  const [pendingDocs, setPendingDocs] = useState({});   // { [categoryKey]: newDocObject }
  const [savingDocKey, setSavingDocKey] = useState(null); // key sedang dalam proses simpan

  // Phase 5 Kendala states
  const [isReporting, setIsReporting] = useState(false);
  const [kendalaTanggal, setKendalaTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kendalaContent, setKendalaContent] = useState('');
  const [kendalaTempFiles, setKendalaTempFiles] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [expandedKendala, setExpandedKendala] = useState({});

  // Inline edit state: which field is being edited and its temp value
  const [inlineField, setInlineField] = useState(null); // 'kecamatan' | 'desa' | 'kepala_sekolah' | 'hp_kepala_sekolah' | 'perencanaId' | 'pengawasId' | 'fasilitatorId'
  const [inlineValue, setInlineValue] = useState('');
  const inlineInputRef = useRef(null);

  // Inline new contact creation
  const [newContactFor, setNewContactFor] = useState(null); // 'perencanaId' | 'pengawasId'
  const [newContactData, setNewContactData] = useState({ nama: '', hp: '' });

  const [tempPerencanaId, setTempPerencanaId] = useState(school?.perencanaId || '');
  const [tempPengawasId, setTempPengawasId] = useState(school?.pengawasId || '');

  useEffect(() => {
    setTempPerencanaId(school?.perencanaId || '');
    setTempPengawasId(school?.pengawasId || '');
  }, [school]);

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
      if (inlineField === 'perencanaHp' && school.perencanaId) {
        const contactObj = contacts.find((c) => c.id === school.perencanaId);
        if (contactObj && onUpdateContact) {
          onUpdateContact({ ...contactObj, hp: inlineValue });
        }
      } else if (inlineField === 'pengawasHp' && school.pengawasId) {
        const contactObj = contacts.find((c) => c.id === school.pengawasId);
        if (contactObj && onUpdateContact) {
          onUpdateContact({ ...contactObj, hp: inlineValue });
        }
      } else {
        onUpdateSchool({ ...school, [inlineField]: inlineValue });
      }
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

  // Save newly created contact and assign to temp state
  const saveNewContact = (fieldName) => {
    if (!newContactData.nama.trim() || !newContactData.hp.trim()) return;
    const suffix = fieldName === 'perencanaId' ? 'p' : 'w';
    const newId = `contact-${Date.now()}-${suffix}`;
    onAddContact({ id: newId, nama: newContactData.nama, hp: newContactData.hp });
    if (fieldName === 'perencanaId') {
      setTempPerencanaId(newId);
    } else {
      setTempPengawasId(newId);
    }
    setNewContactFor(null);
    setNewContactData({ nama: '', hp: '' });
  };

  const handleSaveMitra = () => {
    onUpdateSchool({
      ...school,
      perencanaId: tempPerencanaId || null,
      pengawasId: tempPengawasId || null
    });
    window.showAlert('Mitra pelaksana lapangan berhasil disimpan!');
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

  const getDirectImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    
    if (url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('googleusercontent.com')) {
      let fileId = null;
      // Extract from uc?id=...
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      } else {
        // Extract from /file/d/...
        const dMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (dMatch && dMatch[1]) {
          fileId = dMatch[1];
        }
      }
      
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}?authuser=0`;
      }
    }
    return url;
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

    if (file.size > 10 * 1024 * 1024) {
      return window.showAlert('Ukuran file terlalu besar! Maksimal ukuran file adalah 10MB.');
    }

    // Reset pending jika ada yang lama untuk kategori ini
    setPendingDocs((prev) => { const copy = { ...prev }; delete copy[categoryKey]; return copy; });

    setUploadingState((prev) => ({
      ...prev,
      [categoryKey]: { progress: 0, fileName: file.name }
    }));

    const progressInterval = setInterval(() => {
      setUploadingState((prev) => {
        const state = prev[categoryKey];
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
              id: `sdoc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sekolahId: school.npsn,
              category: categoryKey,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(1) + ' KB',
              fileData: event.target.result, // Base64 data URL
              uploadedBy: activeUser ? activeUser.nama : 'Guest',
              uploadedAt: new Date().toISOString()
            };
            // Simpan ke pending — user harus klik Simpan
            setPendingDocs((latest) => ({ ...latest, [categoryKey]: newDoc }));
            setUploadingState((latest) => {
              const copy = { ...latest };
              delete copy[categoryKey];
              return copy;
            });
          };
          return {
            ...prev,
            [categoryKey]: { ...state, progress: 100 }
          };
        }
        return {
          ...prev,
          [categoryKey]: { ...state, progress: nextProgress }
        };
      });
    }, 150);

    e.target.value = '';
  };

  // Dipanggil saat tombol Simpan ditekan — baru kirim ke Google Sheets
  const handleSaveSchoolDoc = async (categoryKey) => {
    const doc = pendingDocs[categoryKey];
    if (!doc) return;
    setSavingDocKey(categoryKey);
    try {
      onAddSchoolDoc(doc);
      setPendingDocs((prev) => { const copy = { ...prev }; delete copy[categoryKey]; return copy; });
    } finally {
      setSavingDocKey(null);
    }
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
      if (file.fileData && file.fileData.startsWith('http')) {
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

  const handleSaveKendalaSubmit = (e) => {
    e.preventDefault();
    if (!kendalaTanggal) return window.showAlert('Tanggal laporan wajib diisi');
    if (!kendalaContent.trim()) return window.showAlert('Isi laporan kendala wajib diisi');

    const newReport = {
      id: `kendala-${Date.now()}`,
      schoolId: school.npsn,
      userId: activeUser ? activeUser.id : 'guest',
      userName: activeUser ? activeUser.nama : 'Guest',
      tanggal: kendalaTanggal,
      isi: kendalaContent,
      createdAt: new Date().toISOString()
    };

    onAddKendala(newReport, kendalaTempFiles);
    
    // Reset form
    setKendalaContent('');
    setKendalaTempFiles([]);
    setKendalaTanggal(new Date().toISOString().split('T')[0]);
    setIsReporting(false);
    window.showAlert('Laporan kendala berhasil ditambahkan!');
  };

  const handleCommentSubmit = (e, kendalaId) => {
    e.preventDefault();
    const txt = commentInputs[kendalaId] || '';
    if (!txt.trim()) return;

    const newComment = {
      id: `kcomment-${Date.now()}`,
      kendalaId,
      userId: activeUser ? activeUser.id : 'guest',
      userName: activeUser ? activeUser.nama : 'Guest',
      userRole: activeUser ? activeUser.jabatanTim : 'Guest',
      tanggal: new Date().toISOString().split('T')[0],
      isi: txt,
      createdAt: new Date().toISOString()
    };

    onAddKendalaComment(newComment);
    setCommentInputs(prev => ({ ...prev, [kendalaId]: '' }));
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
            src={getDirectImageUrl(school.foto_banner)}
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
        <button
          onClick={() => setActiveTab('kendala')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'kendala'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertCircle className="w-4 h-4" /> Laporkan Kendala ({kendala.filter(k => k.schoolId === school.npsn).length})
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

                    {/* Alamat (inline-editable) */}
                    <div className="sm:col-span-2">
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Alamat Sekolah</span>
                      {inlineField === 'alamat' ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            value={inlineValue}
                            onChange={(e) => setInlineValue(e.target.value)}
                            onKeyDown={handleInlineKeyDown}
                            onBlur={saveInlineField}
                            className="flex-1 bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                            placeholder="Alamat Lengkap Sekolah"
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
                          <span className={`text-sm font-medium ${school.alamat ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                            {school.alamat || 'Belum diisi'}
                          </span>
                          {isAuthorizedToEdit && (
                            <button
                              onClick={() => startInlineEdit('alamat')}
                              className={`p-1 rounded-lg hover:text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer ${!school.alamat ? 'opacity-100 text-amber-500/60 hover:text-amber-400' : 'opacity-0 group-hover/field:opacity-100 text-slate-600'}`}
                              title="Edit Alamat"
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

                </div>                {/* Section: Mitra Pelaksana Lapangan */}
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm uppercase tracking-wider border-b border-slate-800 pb-2 mb-4">
                    Mitra Pelaksana Lapangan
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Perencana Dropdown */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Perencana Lapangan</span>
                      {isAuthorizedToEdit ? (
                        <div className="mt-1.5 space-y-2">
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
                                <button onClick={() => setNewContactFor(null)} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.95] transition-all cursor-pointer">Batal</button>
                                <button onClick={() => saveNewContact('perencanaId')} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-[0.95] transition-all duration-150 select-none cursor-pointer">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <select
                              value={tempPerencanaId || ''}
                              onChange={(e) => {
                                if (e.target.value === 'new') {
                                  setNewContactFor('perencanaId');
                                } else {
                                  setTempPerencanaId(e.target.value);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                              <option value="">-- Pilih Kontak --</option>
                              {contacts.map((c) => (
                                <option key={c.id} value={c.id}>{c.nama} ({c.hp})</option>
                              ))}
                              <option value="new" className="text-indigo-400 font-bold bg-slate-900">+ Tambah Kontak Baru</option>
                            </select>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm font-medium text-slate-200">
                          {school.perencanaId ? (contacts.find(c => c.id === school.perencanaId)?.nama || school.perencanaId) : <span className="text-slate-655 italic">Belum ditentukan</span>}
                        </div>
                      )}
                    </div>

                    {/* HP Perencana (Display only, dynamic based on selected temp ID) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">HP Perencana</span>
                      <div className="mt-2 text-sm font-medium text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {(contacts.find(c => c.id === tempPerencanaId)?.hp) || <span className="text-slate-655 italic">-</span>}
                      </div>
                    </div>

                    {/* Pengawas Dropdown */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">Pengawas Lapangan</span>
                      {isAuthorizedToEdit ? (
                        <div className="mt-1.5 space-y-2">
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
                                <button onClick={() => setNewContactFor(null)} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 active:scale-[0.95] transition-all cursor-pointer">Batal</button>
                                <button onClick={() => saveNewContact('pengawasId')} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-[0.95] transition-all duration-150 select-none cursor-pointer">Simpan</button>
                              </div>
                            </div>
                          ) : (
                            <select
                              value={tempPengawasId || ''}
                              onChange={(e) => {
                                if (e.target.value === 'new') {
                                  setNewContactFor('pengawasId');
                                } else {
                                  setTempPengawasId(e.target.value);
                                }
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                              <option value="">-- Pilih Kontak --</option>
                              {contacts.map((c) => (
                                <option key={c.id} value={c.id}>{c.nama} ({c.hp})</option>
                              ))}
                              <option value="new" className="text-indigo-400 font-bold bg-slate-900">+ Tambah Kontak Baru</option>
                            </select>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm font-medium text-slate-200">
                          {school.pengawasId ? (contacts.find(c => c.id === school.pengawasId)?.nama || school.pengawasId) : <span className="text-slate-655 italic">Belum ditentukan</span>}
                        </div>
                      )}
                    </div>

                    {/* HP Pengawas (Display only, dynamic based on selected temp ID) */}
                    <div>
                      <span className="block text-[10px] uppercase font-semibold text-slate-500">HP Pengawas</span>
                      <div className="mt-2 text-sm font-medium text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        {(contacts.find(c => c.id === tempPengawasId)?.hp) || <span className="text-slate-655 italic">-</span>}
                      </div>
                    </div>

                  </div>

                  {/* Manual Save Button for Mitra Pelaksana */}
                  {isAuthorizedToEdit && (
                    <div className="flex justify-end mt-4 pt-4 border-t border-slate-850/60">
                      <button
                        onClick={handleSaveMitra}
                        disabled={tempPerencanaId === (school.perencanaId || '') && tempPengawasId === (school.pengawasId || '')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                          tempPerencanaId === (school.perencanaId || '') && tempPengawasId === (school.pengawasId || '')
                            ? 'bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed shadow-none'
                            : 'bg-indigo-650 hover:bg-indigo-500 text-white shadow-indigo-600/10'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" /> Simpan Perubahan Mitra
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* Right Column: Progress & Docs checklist */}
              <div className="flex flex-col gap-6 lg:h-full">
                
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
                        className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-[0.98] active:translate-y-[0.5px] transition-all duration-150 select-none cursor-pointer"
                      >
                        Simpan Progres Fisik
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-950/40 rounded-xl border border-slate-855 p-4">
                      <AlertTriangle className="w-5 h-5 text-slate-605 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Hanya Fasilitator atau Super Admin yang dapat mengubah progres.
                      </p>
                    </div>
                  )}
                </div>

                {/* Documents table list */}
                <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 flex-1">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" /> Progres Upload Dokumen
                  </h3>
                  
                  {/* Table list */}
                  <div className="overflow-x-auto flex-1 min-h-[240px] overflow-y-auto border border-slate-855/80 rounded-xl bg-slate-950/20">
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
                          const abbreviations = {
                            administrasi: 'DA',
                            teknis: 'DT',
                            rab_fisik: 'RF',
                            rab_meubeler: 'RM',
                            rab_manajemen: 'RN',
                            kurva_s: 'KS',
                            berita_acara: 'BA',
                            pks: 'PKS',
                            lap_pendahuluan: 'LP',
                            lap_harian: 'LH',
                            lap_mingguan: 'LM',
                            lap_bulanan: 'LB',
                            lap_progres_50: 'LP50',
                            lap_progres_100: 'LP100',
                            lap_akhir: 'LA',
                            lap_lainnya: 'LL'
                          };
                          const abbr = abbreviations[doc.key] || 'DOC';

                          return (
                            <tr key={doc.key} className="hover:bg-slate-900/20 transition-colors">
                              <td className="py-2.5 px-3 font-medium text-slate-300">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="block truncate max-w-[170px] sm:max-w-none text-[11px]" title={doc.label}>
                                    {doc.label}
                                  </span>
                                  {isAuthorizedToEdit && (
                                    <label className="p-1 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer shrink-0" title="Unggah Dokumen">
                                      <Plus className="w-3.5 h-3.5" />
                                      <input
                                        type="file"
                                        onChange={(e) => handleUploadSchoolDoc(e, doc.key)}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                                <span className="text-[8px] text-slate-500 font-semibold uppercase block leading-tight mt-0.5">{doc.type}</span>

                                {/* Uploading state inline */}
                                {uploadingState[doc.key] && (
                                  <div className="mt-1.5 bg-slate-950/40 border border-dashed border-indigo-500/20 rounded-lg p-2 space-y-1 animate-pulse">
                                    <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400">
                                      <span className="truncate max-w-[120px] text-indigo-300">
                                        {uploadingState[doc.key].fileName}
                                      </span>
                                      <span className="text-indigo-400 font-bold">{uploadingState[doc.key].progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                                      <div 
                                        className="bg-indigo-500 h-full rounded-full transition-all duration-155"
                                        style={{ width: `${uploadingState[doc.key].progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Files List inside Table Row */}
                                {uploadedCount > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {mySchoolDocs
                                      .filter((d) => d.category === doc.key)
                                      .map((file, idx) => (
                                        <div key={file.id} className="flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950/90 border border-slate-855 rounded-lg px-2 py-0.5 text-[9px] transition-colors" title={`${file.fileName} (Diunggah oleh: ${file.uploadedBy})`}>
                                          <span 
                                            onClick={() => handleOpenFile(file)}
                                            className="text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer font-bold select-none"
                                          >
                                            {abbr}-{idx + 1}
                                          </span>
                                          <div className="flex items-center gap-1 ml-1 border-l border-slate-800/80 pl-1 shrink-0">
                                            <button 
                                              onClick={() => handleDownloadFile(file)}
                                              className="text-slate-500 hover:text-indigo-400 p-0.5 transition-colors cursor-pointer" 
                                              title={`Download ${file.fileName}`}
                                            >
                                              <Download className="w-2.5 h-2.5" />
                                            </button>
                                            {canDeleteDoc(file) && (
                                              <button
                                                onClick={async () => {
                                                  if (await window.showConfirm(`Hapus dokumen "${file.fileName}"?`)) {
                                                    onDeleteSchoolDoc(file.id);
                                                  }
                                                }}
                                                className="text-slate-650 hover:text-rose-450 p-0.5 transition-colors cursor-pointer"
                                                title={`Hapus ${file.fileName}`}
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    }
                                  </div>
                                )}
                              </td>
                              <td className={`py-2.5 px-3 text-center font-bold text-xs transition-colors ${
                                uploadedCount > 0 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : 'bg-rose-500/20 text-rose-450'
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
                        {uploadingState[cat.key] && (
                          <div className="bg-slate-950/40 border border-dashed border-indigo-500/20 rounded-xl p-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                              <span className="truncate max-w-[150px] text-indigo-300 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 animate-bounce text-indigo-400" />
                                {uploadingState[cat.key].fileName}
                              </span>
                              <span className="text-indigo-400 font-bold">{uploadingState[cat.key].progress}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-155"
                                style={{ width: `${uploadingState[cat.key].progress}%` }}
                              />
                            </div>
                          </div>
                        )}
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

                        {catFiles.length === 0 && !pendingDocs[cat.key] && !uploadingState[cat.key] && (
                          <div className="text-center py-6 text-[10px] text-slate-650 italic border border-dashed border-slate-850/60 rounded-xl select-none">
                            Belum ada berkas diunggah
                          </div>
                        )}
                      </div>

                      {/* Pending Save Footer */}
                      {pendingDocs[cat.key] && (
                        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 select-none">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="text-[10px] text-emerald-400 font-semibold truncate">{pendingDocs[cat.key].fileName}</span>
                            <span className="text-[9px] text-slate-500 shrink-0">siap disimpan</span>
                          </div>
                          <button
                            onClick={() => handleSaveSchoolDoc(cat.key)}
                            disabled={savingDocKey === cat.key}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow shadow-emerald-900/30 shrink-0"
                          >
                            {savingDocKey === cat.key ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...</>
                            ) : (
                              <><Save className="w-3 h-3" /> Simpan</>
                            )}
                          </button>
                        </div>
                      )}
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
                        {uploadingState[cat.key] && (
                          <div className="bg-slate-950/40 border border-dashed border-indigo-500/20 rounded-xl p-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                              <span className="truncate max-w-[150px] text-indigo-300 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5 animate-bounce text-indigo-400" />
                                {uploadingState[cat.key].fileName}
                              </span>
                              <span className="text-indigo-400 font-bold">{uploadingState[cat.key].progress}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-155"
                                style={{ width: `${uploadingState[cat.key].progress}%` }}
                              />
                            </div>
                          </div>
                        )}
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

                        {catFiles.length === 0 && !pendingDocs[cat.key] && !uploadingState[cat.key] && (
                          <div className="text-center py-6 text-[10px] text-slate-650 italic border border-dashed border-slate-850/60 rounded-xl select-none">
                            Belum ada berkas diunggah
                          </div>
                        )}
                      </div>

                      {/* Pending Save Footer */}
                      {pendingDocs[cat.key] && (
                        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 select-none">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                            <span className="text-[10px] text-emerald-400 font-semibold truncate">{pendingDocs[cat.key].fileName}</span>
                            <span className="text-[9px] text-slate-500 shrink-0">siap disimpan</span>
                          </div>
                          <button
                            onClick={() => handleSaveSchoolDoc(cat.key)}
                            disabled={savingDocKey === cat.key}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow shadow-emerald-900/30 shrink-0"
                          >
                            {savingDocKey === cat.key ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...</>
                            ) : (
                              <><Save className="w-3 h-3" /> Simpan</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Laporkan Kendala */}
          {activeTab === 'kendala' && (() => {
            const canReportKendala = activeUser ? (activeUser.jabatanTim === 'Fasilitator' && school.fasilitatorId === activeUser.id) || activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin' : false;
            const schoolKendalas = (kendala || []).filter(k => k.schoolId === school.npsn).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            const handleFileChange = (e) => {
              const files = Array.from(e.target.files);
              files.forEach(file => {
                if (file.size > 10 * 1024 * 1024) {
                  window.showAlert('Ukuran berkas maksimal 10MB');
                  return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                  setKendalaTempFiles(prev => [...prev, {
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    data: event.target.result // Base64
                  }]);
                };
                reader.readAsDataURL(file);
              });
              e.target.value = '';
            };

            const handleRemoveTempFile = (idx) => {
              setKendalaTempFiles(prev => prev.filter((_, i) => i !== idx));
            };

            return (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800 select-none">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">Laporan Kendala Lapangan</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Laporkan kendala pendampingan di lapangan untuk ditanggapi oleh tim koordinasi.</p>
                  </div>
                  {canReportKendala && !isReporting && (
                    <button
                      onClick={() => setIsReporting(true)}
                      className="px-3 py-1.5 text-xs font-bold btn-orange-glow rounded-xl cursor-pointer flex items-center gap-1.5 select-none shadow-md border-0"
                    >
                      <Plus className="w-4 h-4 text-white" /> Laporkan Kendala
                    </button>
                  )}
                </div>

                {/* Form Pelaporan Kendala */}
                {isReporting && (
                  <form onSubmit={handleSaveKendalaSubmit} className="bg-slate-900/20 border border-slate-855 rounded-2xl p-5 space-y-4 animate-scale-in">
                    <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider pb-2 border-b border-slate-800/60">Formulir Laporan Kendala Baru</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggal Laporan / Kejadian</label>
                        <input
                          type="date"
                          value={kendalaTanggal}
                          onChange={(e) => setKendalaTanggal(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Isi Laporan Kendala</label>
                      <RichTextEditor
                        value={kendalaContent}
                        onChange={(val) => setKendalaContent(val)}
                        placeholder="Deskripsikan kendala yang terjadi secara rinci..."
                      />
                    </div>

                    {/* File Attachment Input */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Paperclip className="w-3.5 h-3.5" /> Berkas Pendukung (Opsional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-1.5 text-[10px] font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 select-none">
                          <Plus className="w-3.5 h-3.5" /> Pilih Berkas
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-slate-500">{kendalaTempFiles.length} berkas dipilih</span>
                      </div>

                      {/* Temp Files List */}
                      {kendalaTempFiles.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {kendalaTempFiles.map((f, i) => (
                            <div key={i} className="bg-slate-950/40 border border-slate-850 rounded-xl p-2.5 flex justify-between items-center gap-2">
                              <span className="text-xs text-slate-350 truncate font-semibold" title={f.name}>{f.name}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[9px] text-slate-500 font-medium">{f.size}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTempFile(i)}
                                  className="p-1 rounded text-slate-550 hover:text-rose-450 hover:bg-rose-500/10 cursor-pointer border-0"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-800/60 select-none">
                      <button
                        type="button"
                        onClick={() => {
                          setIsReporting(false);
                          setKendalaContent('');
                          setKendalaTempFiles([]);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 cursor-pointer border-0"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer border-0"
                      >
                        Simpan Laporan
                      </button>
                    </div>
                  </form>
                )}

                {/* Kendala Reports List */}
                <div className="space-y-4">
                  {schoolKendalas.map(item => {
                    const reporter = users.find(u => u.id === item.userId);
                    const reporterRole = reporter ? reporter.jabatanTim : 'Fasilitator';
                    const docs = kendalaDocs.filter(d => d.kendalaId === item.id);
                    const comments = kendalaComments.filter(c => c.kendalaId === item.id).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    const isExpanded = expandedKendala[item.id] !== false;

                    const canDelete = activeUser && (item.userId === activeUser.id || activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin');

                    return (
                      <div key={item.id} className="bg-slate-900/20 border border-slate-855 rounded-2xl p-5 space-y-4">
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-3 pb-3 border-b border-slate-800/60">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                              <AlertCircle className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-200 text-sm">{item.userName}</h4>
                                <span className="text-[10px] font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-650/20 px-2 py-0.5 rounded-lg">{reporterRole}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium">Melaporkan pada: {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                          </div>

                          {canDelete && (
                            <button
                              onClick={async () => {
                                if (await window.showConfirm('Apakah Anda yakin ingin menghapus laporan kendala ini beserta seluruh berkas dan komentar terkait?')) {
                                  onDeleteKendala(item.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-450 hover:bg-rose-500/10 cursor-pointer border-0"
                              title="Hapus Laporan Kendala"
                            >
                              <Trash2 className="w-4 h-4 text-slate-500" />
                            </button>
                          )}
                        </div>

                        {/* Card Body */}
                        <div 
                          className="kendala-rich-text text-xs text-slate-100 bg-white border border-slate-200 p-4 rounded-xl leading-relaxed whitespace-pre-line"
                          dangerouslySetInnerHTML={{ __html: item.isi }}
                        />

                        {/* Files list */}
                        {docs.length > 0 && (
                          <div className="space-y-2">
                            <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Berkas Pendukung ({docs.length})</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {docs.map(file => (
                                <div key={file.id} className="bg-slate-950/60 border border-slate-855 rounded-xl p-3 flex justify-between items-center gap-2">
                                  <div className="min-w-0 flex-1">
                                    <span
                                      onClick={() => handleOpenFile(file)}
                                      className="font-semibold text-slate-350 text-xs truncate block cursor-pointer hover:text-indigo-400 hover:underline"
                                      title="Klik untuk membuka dokumen"
                                    >
                                      {file.fileName}
                                    </span>
                                    <div className="text-[9px] text-slate-500 mt-0.5">Oleh: {file.uploadedBy} • {file.fileSize}</div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleDownloadFile(file)}
                                      className="p-1 rounded bg-slate-900 text-indigo-400 hover:text-indigo-300 cursor-pointer border-0"
                                      title="Download File"
                                    >
                                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                                    </button>
                                    {(activeUser && (file.uploadedBy === activeUser.nama || activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin')) && (
                                      <button
                                        onClick={async () => {
                                          if (await window.showConfirm(`Hapus berkas "${file.fileName}"?`)) {
                                            onDeleteKendalaDoc(file.id);
                                          }
                                        }}
                                        className="p-1 rounded bg-slate-900 text-slate-550 hover:text-rose-455 cursor-pointer border-0"
                                        title="Hapus Berkas"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Comments Utas (Accordion) */}
                        <div className="pt-2 border-t border-slate-200">
                          <button
                            onClick={() => setExpandedKendala(prev => ({ ...prev, [item.id]: !isExpanded }))}
                            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold select-none cursor-pointer border-0 bg-transparent"
                          >
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            <span>Komentar & Diskusi ({comments.length})</span>
                          </button>

                          {isExpanded && (
                            <div className="mt-4 space-y-3.5 pl-2 sm:pl-4 border-l border-slate-300 animate-fade-in">
                              {/* List of comments */}
                              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {comments.map(c => {
                                  const canDeleteComment = activeUser && (c.userId === activeUser.id || activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin');

                                  return (
                                    <div key={c.id} className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 relative group">
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-xs text-slate-700">{c.userName}</span>
                                          <span className="text-[9px] font-bold bg-slate-200 border border-slate-300 text-slate-500 px-1.5 py-0.5 rounded">{c.userRole}</span>
                                          <span className="text-[9px] text-slate-500">{new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        {canDeleteComment && (
                                          <button
                                            onClick={async () => {
                                              if (await window.showConfirm('Hapus komentar ini?')) {
                                                onDeleteKendalaComment(c.id);
                                              }
                                            }}
                                            className="p-1 rounded text-slate-500 hover:text-rose-455 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0 bg-transparent"
                                            title="Hapus Komentar"
                                          >
                                            <X className="w-3.5 h-3.5 text-slate-550" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">{c.isi}</p>
                                    </div>
                                  );
                                })}

                                {comments.length === 0 && (
                                  <div className="text-[10px] text-slate-500 italic select-none py-2">Belum ada komentar balasan. Koordinator atau Ketua Tim dapat memberikan tanggapan di sini.</div>
                                )}
                              </div>

                              {/* Comment Form */}
                              {activeUser && (
                                <form onSubmit={(e) => handleCommentSubmit(e, item.id)} className="flex gap-2 items-center pt-2">
                                  <input
                                    type="text"
                                    placeholder="Tulis tanggapan atau solusi..."
                                    value={commentInputs[item.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                                    required
                                  />
                                  <button
                                    type="submit"
                                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all cursor-pointer border-0 shadow shrink-0"
                                    title="Kirim Komentar"
                                  >
                                    <Send className="w-4 h-4 text-white" />
                                  </button>
                                </form>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {schoolKendalas.length === 0 && !isReporting && (
                    <div className="text-center py-10 bg-slate-900/10 border border-dashed border-slate-850 rounded-2xl select-none">
                      <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2.5" />
                      <h4 className="font-bold text-slate-400 text-xs">Belum ada laporan kendala</h4>
                      <p className="text-[10px] text-slate-550 mt-1">Sekolah ini saat ini tidak memiliki laporan kendala atau hambatan pekerjaan lapangan.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
