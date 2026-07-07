import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Edit2, 
  Trash2, 
  Users, 
  FileText, 
  X, 
  Check, 
  BookOpen,
  Filter,
  Camera,
  Image,
  Youtube,
  ExternalLink,
  ChevronRight,
  Download,
  Paperclip,
  File
} from 'lucide-react';

const getDirectImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  if (url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('googleusercontent.com')) {
    let fileId = null;
    const idMatch = url.match(/id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    } else {
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

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  try {
    let d;
    if (str.includes('T')) {
      d = new Date(str);
    } else {
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        d = new Date(year, month, day);
      } else {
        d = new Date(str);
      }
    }
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  try {
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes} WIB`;
      }
    }
    const simpleMatch = str.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
      const hours = simpleMatch[1].padStart(2, '0');
      const minutes = simpleMatch[2];
      return `${hours}:${minutes} WIB`;
    }
  } catch (e) {
    // fallback
  }
  return timeStr;
};

const cleanInputDate = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (str.includes('T')) {
    const part = str.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      return part;
    }
  }
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  } catch (e) {
    return '';
  }
};

const cleanInputTime = (val) => {
  if (!val) return '';
  const str = String(val).trim();
  try {
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      }
    }
    const simpleMatch = str.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
      const hours = simpleMatch[1].padStart(2, '0');
      const minutes = simpleMatch[2];
      return `${hours}:${minutes}`;
    }
  } catch (e) {
    // fallback
  }
  return '';
};

export default function MeetingManagement({ 
  meetings, 
  meetingDocs = [],
  users, 
  activeUser, 
  settings = {},
  onAddMeeting, 
  onUpdateMeeting, 
  onDeleteMeeting 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua'); // 'semua' | 'akan-datang' | 'selesai'
  const [isAdding, setIsAdding] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [notulenMeeting, setNotulenMeeting] = useState(null); // Rapat yang sedang diisi notulennya saja
  const [selectedMeetingDetail, setSelectedMeetingDetail] = useState(null); // Rapat yang sedang dilihat detailnya
  const [formDocs, setFormDocs] = useState([]);

  const isSuperAdmin = activeUser.jabatanTim === 'Super Admin';

  const [formData, setFormData] = useState({
    judul: '',
    tanggal: '',
    isMultiDay: false,
    tanggalSelesai: '',
    jam: '',
    lokasi: '',
    pesertaIds: [],
    keterangan: '',
    fotoKegiatan: '',
    linkYoutube: ''
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [notulenText, setNotulenText] = useState('');

  // Reset Form
  const resetForm = () => {
    setFormData({
      judul: '',
      tanggal: '',
      isMultiDay: false,
      tanggalSelesai: '',
      jam: '',
      lokasi: '',
      pesertaIds: [],
      keterangan: '',
      fotoKegiatan: '',
      linkYoutube: ''
    });
    setPreviewImage(null);
    setFormDocs([]);
    setIsAdding(false);
    setEditingMeeting(null);
  };

  // Trigger Edit Form
  const handleEditClick = (meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      judul: meeting.judul || '',
      tanggal: cleanInputDate(meeting.tanggal) || '',
      isMultiDay: !!meeting.isMultiDay,
      tanggalSelesai: cleanInputDate(meeting.tanggalSelesai) || '',
      jam: cleanInputTime(meeting.jam) || '',
      lokasi: meeting.lokasi || '',
      pesertaIds: meeting.pesertaIds || [],
      keterangan: meeting.keterangan || '',
      fotoKegiatan: meeting.fotoKegiatan || '',
      linkYoutube: meeting.linkYoutube || ''
    });
    const existingDocs = meetingDocs ? meetingDocs.filter(d => d.meetingId === meeting.id) : [];
    setFormDocs(existingDocs);
    setPreviewImage(meeting.fotoKegiatan || null);
    setIsAdding(false);
  };

  // Trigger Notulen-Only Form
  const handleNotulenClick = (meeting) => {
    setNotulenMeeting(meeting);
    setNotulenText(meeting.keterangan || '');
  };

  // Canvas Image Compression (resolusi maks 600px, kualitas 60% JPEG)
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

        // Compress to JPEG with 0.6 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPreviewImage(dataUrl);
        setFormData((prev) => ({ ...prev, fotoKegiatan: dataUrl }));
      };
    };
  };

  // Handle Document Upload
  const handleDocUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      // 10MB size limit to prevent localStorage storage issues
      if (file.size > 10 * 1024 * 1024) {
        return window.showAlert(`Ukuran file "${file.name}" terlalu besar! Maksimal 10MB.`);
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const newDoc = {
          id: `doc-meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          meetingId: editingMeeting ? editingMeeting.id : '',
          name: file.name,
          fileData: event.target.result, // Base64 Data URL
          size: file.size,
          uploadedBy: activeUser.nama,
          uploadedAt: new Date().toISOString()
        };
        setFormDocs(prev => [...prev, newDoc]);
      };
    });
    // Clear value
    e.target.value = '';
  };

  // Remove doc from form selection list
  const handleDeleteFormDoc = (docId) => {
    setFormDocs(prev => prev.filter(d => d.id !== docId));
  };

  // Download or view document (handles local base64 and remote Google Drive URLs)
  const downloadDocument = (doc) => {
    try {
      if (!doc.fileData) return window.showAlert('File tidak memiliki data');
      
      if (doc.fileData.startsWith('http')) {
        window.open(doc.fileData, '_blank');
        return;
      }
      
      const arr = doc.fileData.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new Blob([u8arr], { type: mime });
      const fileUrl = URL.createObjectURL(file);
      
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error(err);
      window.showAlert('Gagal mengunduh dokumen');
    }
  };

  // Submit Form Rapat (Tambah/Edit)
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.judul.trim()) return window.showAlert('Judul rapat wajib diisi');
    if (!formData.tanggal) return window.showAlert('Tanggal rapat wajib diisi');
    if (formData.isMultiDay) {
      if (!formData.tanggalSelesai) return window.showAlert('Tanggal selesai rapat wajib diisi');
      if (formData.tanggalSelesai < formData.tanggal) {
        return window.showAlert('Tanggal selesai tidak boleh sebelum tanggal mulai');
      }
    } else {
      if (!formData.jam) return window.showAlert('Jam rapat wajib diisi');
    }
    if (!formData.lokasi.trim()) return window.showAlert('Lokasi rapat wajib diisi');
    if (formData.pesertaIds.length === 0) return window.showAlert('Pilih minimal satu peserta rapat');

    const cleanData = {
      ...formData,
      jam: formData.isMultiDay ? '' : formData.jam,
      tanggalSelesai: formData.isMultiDay ? formData.tanggalSelesai : ''
    };

    if (editingMeeting) {
      onUpdateMeeting({
        ...editingMeeting,
        ...cleanData
      }, formDocs);
      window.showAlert('Data rapat berhasil diperbarui');
    } else {
      const newMeeting = {
        id: 'meet-' + Date.now(),
        ...cleanData,
        createdAt: new Date().toISOString()
      };
      onAddMeeting(newMeeting, formDocs);
      window.showAlert('Rapat baru berhasil dijadwalkan');
    }
    resetForm();
  };

  // Submit Notulen
  const handleSaveNotulen = (e) => {
    e.preventDefault();
    if (!notulenMeeting) return;

    onUpdateMeeting({
      ...notulenMeeting,
      keterangan: notulenText
    });

    window.showAlert('Catatan / Notulen rapat berhasil disimpan');
    setNotulenMeeting(null);
    setNotulenText('');
  };

  // Delete Rapat
  const handleDeleteClick = async (meeting) => {
    if (await window.showConfirm(`Apakah Anda yakin ingin menghapus agenda rapat "${meeting.judul}"?`)) {
      onDeleteMeeting(meeting.id);
      window.showAlert('Rapat berhasil dihapus');
    }
  };

  // Helper Initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper to determine meeting status
  const getMeetingStatus = (meet, todayStr) => {
    const startDate = meet.tanggal ? meet.tanggal.substring(0, 10) : '';
    const endDate = meet.isMultiDay 
      ? (meet.tanggalSelesai ? meet.tanggalSelesai.substring(0, 10) : startDate)
      : startDate;
    
    if (endDate < todayStr) return 'selesai';
    if (startDate <= todayStr && todayStr <= endDate) {
      // Jika rapat hari ini dan single-day serta memiliki jam mulai, cek jam jika bukan simulasi tanggal
      if (startDate === todayStr && !meet.isMultiDay && meet.jam && !settings.simulatedToday) {
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        if (meet.jam > currentTime) {
          return 'upcoming';
        }
      }
      return 'ongoing';
    }
    return 'upcoming';
  };

  // Toggle Selection Peserta
  const togglePeserta = (userId) => {
    setFormData(prev => {
      const ids = prev.pesertaIds.includes(userId)
        ? prev.pesertaIds.filter(id => id !== userId)
        : [...prev.pesertaIds, userId];
      return { ...prev, pesertaIds: ids };
    });
  };

  // Select All / Deselect All
  const selectAllPeserta = () => {
    const allIds = users.map(u => u.id);
    setFormData(prev => ({
      ...prev,
      pesertaIds: prev.pesertaIds.length === allIds.length ? [] : allIds
    }));
  };

  // Extract YouTube Embed URL
  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    // Regular expression to match standard YouTube URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}` 
      : null;
  };

  // Filter & Search Logic
  const filteredMeetings = meetings.filter(meeting => {
    // Enforce hierarchy filter
    const isMeetingVisible = (meet) => {
      if (!activeUser) return true;
      const role = activeUser.jabatanTim;
      if (role === 'Super Admin') return true;
      
      const participants = meet.pesertaIds || [];
      if (participants.includes(activeUser.id)) return true;
      
      if (role === 'Fasilitator' || role === 'Tenaga Administrasi') {
        return false;
      }
      
      if (participants.length === 0) return true;
      
      return participants.some(pid => {
        const pUser = users.find(u => u.id === pid);
        const pRole = pUser ? pUser.jabatanTim : '';
        
        if (role === 'Ketua Tim') {
          return pRole !== 'Super Admin';
        }
        if (role === 'Koordinator') {
          return pRole !== 'Super Admin' && pRole !== 'Ketua Tim';
        }
        return false;
      });
    };

    if (!isMeetingVisible(meeting)) return false;

    const matchesSearch = 
      meeting.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
      meeting.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.keterangan && meeting.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));

    const todayStr = settings.simulatedToday || new Date().toISOString().split('T')[0];
    const status = getMeetingStatus(meeting, todayStr);
    
    if (statusFilter === 'akan-datang') {
      return matchesSearch && status !== 'selesai';
    } else if (statusFilter === 'selesai') {
      return matchesSearch && status === 'selesai';
    }
    return matchesSearch;
  }).sort((a, b) => b.tanggal.localeCompare(a.tanggal) || (b.jam || '').localeCompare(a.jam || ''));

  return (
    <div className="space-y-6 animate-fade-in p-2 md:p-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-900">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-indigo-400" /> Agenda Rapat Tim Swakelola
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isSuperAdmin 
              ? 'Kelola agenda pertemuan, catat hasil risalah/notulen rapat, unggah foto dokumentasi, dan tautan rekaman YouTube.' 
              : 'Pantau agenda pertemuan tim pelaksana swakelola, notulen pembahasan, foto dokumentasi, serta rekaman rapat.'}
          </p>
        </div>

        {isSuperAdmin && !isAdding && !editingMeeting && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 border-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Buat Jadwal Rapat
          </button>
        )}
      </div>

      {/* Main Grid View */}
      {!isAdding && !editingMeeting ? (
        <div className="space-y-4">
          
          {/* Controls: Search & Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-900/20 backdrop-blur-md border border-slate-900 p-4 rounded-2xl">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul, lokasi, atau notulen..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-550 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Filter Status:
              </span>
              <div className="flex bg-slate-950 border border-slate-850 p-1 rounded-xl">
                {[
                  { id: 'semua', label: 'Semua Rapat' },
                  { id: 'akan-datang', label: 'Akan Datang' },
                  { id: 'selesai', label: 'Sudah Selesai' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setStatusFilter(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border-0 cursor-pointer ${
                      statusFilter === opt.id 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rapat Cards List */}
          {filteredMeetings.length === 0 ? (
            <div className="bg-slate-900/10 border border-slate-900/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">Belum Ada Agenda Rapat</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {searchTerm || statusFilter !== 'semua' 
                  ? 'Tidak ada agenda rapat yang cocok dengan filter pencarian Anda saat ini.' 
                  : 'Rencana pertemuan koordinasi antar tim belum dibuat. Jadwalkan rapat pertama untuk memulai.'}
              </p>
              {(searchTerm || statusFilter !== 'semua') && (
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('semua'); }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  Reset Pencarian
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredMeetings.map((meet) => {
                const todayStr = settings.simulatedToday || new Date().toISOString().split('T')[0];
                const status = getMeetingStatus(meet, todayStr);
                const isPast = status === 'selesai';

                return (
                  <div 
                    key={meet.id} 
                    className="bg-slate-900/30 backdrop-blur-md border border-slate-850 hover:border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg shadow-indigo-600/[0.02] relative group overflow-hidden"
                  >
                    
                    <div className="space-y-4">
                      {/* Info Utama & Status Badge */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <h3 
                            onClick={() => setSelectedMeetingDetail(meet)}
                            className="text-sm md:text-base font-extrabold text-slate-100 hover:text-indigo-400 cursor-pointer group-hover:underline transition-all leading-tight break-words"
                          >
                            {meet.judul}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-450 text-[11px] font-medium pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              {meet.isMultiDay ? (
                                `${formatDisplayDate(meet.tanggal)} s.d. ${formatDisplayDate(meet.tanggalSelesai)} • Multi-Hari`
                              ) : (
                                `${formatDisplayDate(meet.tanggal)} • Pukul ${formatDisplayTime(meet.jam)}`
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {meet.lokasi}
                            </span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0 pt-0.5">
                          {status === 'selesai' ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase bg-slate-500/10 text-slate-400 border-slate-500/20 whitespace-nowrap">
                              Selesai
                            </span>
                          ) : status === 'ongoing' ? (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20 whitespace-nowrap">
                              Sedang Berlangsung
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border tracking-wide uppercase bg-indigo-500/10 text-indigo-400 border-indigo-500/20 whitespace-nowrap">
                              Akan Datang
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Preview Media Indicators */}
                      {(meet.fotoKegiatan || meet.linkYoutube) && (
                        <div className="flex items-center gap-2 pt-1">
                          {meet.fotoKegiatan && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                              <Image className="w-3 h-3" /> Foto Dokumentasi
                            </span>
                          )}
                          {meet.linkYoutube && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-rose-450 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                              <Youtube className="w-3 h-3" /> Rekaman Video
                            </span>
                          )}
                        </div>
                      )}

                      {/* Anggota yang Diundang */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-900">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Peserta Diundang ({meet.pesertaIds.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {meet.pesertaIds.map(pid => {
                            const foundUser = users.find(u => u.id === pid);
                            if (!foundUser) return null;
                            return (
                              <span 
                                key={pid} 
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-850/80 text-[10px] font-semibold text-slate-300"
                                title={`${foundUser.nama} (${foundUser.jabatanTim})`}
                              >
                                <span className="w-3.5 h-3.5 rounded bg-indigo-600 text-[8px] font-bold text-white flex items-center justify-center">
                                  {getInitials(foundUser.nama)}
                                </span>
                                <span className="truncate max-w-[90px]">{foundUser.nama}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notulen / Keterangan */}
                      <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 space-y-2 mt-2">
                        <div className="flex items-center justify-between border-b border-slate-900/60 pb-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" /> Notulen Rapat / Keterangan
                          </span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleNotulenClick(meet)}
                              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3" /> {meet.keterangan ? 'Edit Notulen' : 'Tulis Notulen'}
                            </button>
                          )}
                        </div>
                        {meet.keterangan ? (
                          <p className="text-xs text-slate-350 leading-relaxed font-normal whitespace-pre-line max-h-24 overflow-y-auto no-scrollbar">
                            {meet.keterangan}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-600 italic select-none">
                            Belum ada catatan atau notulen hasil rapat. {isSuperAdmin && 'Klik tombol untuk menambahkan.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-4 select-none">
                      <button
                        onClick={() => setSelectedMeetingDetail(meet)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent"
                      >
                        Buka Detail Rapat <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      
                      {isSuperAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(meet)}
                            title="Ubah detail rapat"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/25 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(meet)}
                            title="Hapus agenda rapat"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      ) : (
        /* Create or Edit Meeting Form View */
        <div className="bg-slate-900/40 border border-slate-850 rounded-3xl p-6 shadow-xl max-w-4xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
              {editingMeeting ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-indigo-400" />}
              {editingMeeting ? `Edit Jadwal Rapat: ${editingMeeting.judul}` : 'Buat Jadwal Rapat Baru'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 rounded-lg text-slate-450 hover:text-slate-200 hover:bg-slate-850 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Judul Pertemuan / Rapat
                </label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  placeholder="Contoh: Rapat Koordinasi Evaluasi Progres Fisik Bulan Ke-2"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Lokasi / Tempat Rapat
                </label>
                <input
                  type="text"
                  value={formData.lokasi}
                  onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  placeholder="Contoh: Ruang Sidang Teknik Sipil atau Zoom Online"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Tanggal Rapat
                </label>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    tanggal: e.target.value,
                    tanggalSelesai: formData.isMultiDay && (!formData.tanggalSelesai || formData.tanggalSelesai < e.target.value) ? e.target.value : formData.tanggalSelesai
                  })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono cursor-pointer"
                  required
                />
                <div className="flex items-center gap-2 pt-1 select-none">
                  <input
                    type="checkbox"
                    id="isMultiDay"
                    checked={formData.isMultiDay}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      isMultiDay: e.target.checked,
                      tanggalSelesai: e.target.checked ? (formData.tanggalSelesai || formData.tanggal) : ''
                    })}
                    className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-650 focus:ring-indigo-600 focus:ring-opacity-25 cursor-pointer"
                  />
                  <label htmlFor="isMultiDay" className="text-[11px] font-semibold text-slate-300 cursor-pointer">
                    Rapat diselenggarakan sampai tanggal tertentu
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Jam / Waktu Mulai
                </label>
                <input
                  type="time"
                  value={formData.isMultiDay ? '' : formData.jam}
                  onChange={(e) => setFormData({ ...formData, jam: e.target.value })}
                  disabled={formData.isMultiDay}
                  className={`w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-colors font-mono ${
                    formData.isMultiDay 
                      ? 'text-slate-600 border-slate-900 bg-slate-950/40 cursor-not-allowed opacity-50' 
                      : 'text-slate-100 focus:border-indigo-500 cursor-pointer'
                  }`}
                  required={!formData.isMultiDay}
                />
              </div>

              {formData.isMultiDay && (
                <div className="space-y-2 md:col-span-2 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                    Sampai Tanggal (Tanggal Selesai Rapat)
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalSelesai}
                    min={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-550 transition-colors font-mono cursor-pointer"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Tautan Video Rekaman Rapat (YouTube)
                </label>
                <input
                  type="url"
                  value={formData.linkYoutube}
                  onChange={(e) => setFormData({ ...formData, linkYoutube: e.target.value })}
                  placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Foto Dokumentasi / Kegiatan (Kompresi Otomatis)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer transition-colors shadow-sm">
                    <Camera className="w-4 h-4 text-slate-400" /> Pilih Foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    Unggah bukti foto rapat. Sistem otomatis mengompresi gambar.
                  </span>
                </div>
              </div>

            </div>

            {/* Preview and Upload Image Area */}
            {previewImage && (
              <div className="space-y-1.5 max-w-sm">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                  Preview Foto Dokumentasi
                </label>
                <div className="relative border border-slate-800 rounded-xl overflow-hidden aspect-video bg-slate-950 flex items-center justify-center">
                  <img src={previewImage} alt="Dokumentasi rapat" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewImage(null);
                      setFormData((prev) => ({ ...prev, fotoKegiatan: '' }));
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-950 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Selection Peserta (Checked Grid) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between select-none">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Undang Anggota Tim (Pilih Peserta)
                </label>
                <button
                  type="button"
                  onClick={selectAllPeserta}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 border-0 bg-transparent cursor-pointer"
                >
                  {formData.pesertaIds.length === users.length ? 'Batal Pilih Semua' : 'Pilih Semua Anggota'}
                </button>
              </div>

              {/* Grid cards of Users for multi-selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {users.map((user) => {
                  const isSelected = formData.pesertaIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => togglePeserta(user.id)}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition-all ${
                        isSelected 
                          ? 'bg-indigo-500/10 border-indigo-500 text-slate-100' 
                          : 'bg-slate-950/60 border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-350'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-550 text-white' 
                          : 'border-slate-700 bg-slate-900 text-transparent'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">{user.nama}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 truncate">{user.jabatanTim}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {formData.pesertaIds.length === 0 && (
                <p className="text-[10px] text-rose-450 italic mt-1.5 select-none font-medium">
                  * Belum ada peserta yang dipilih. Harap pilih minimal satu orang.
                </p>
              )}
            </div>

            {/* Lampiran Dokumen Area */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                Dokumen Lampiran / Bahan Rapat (Maks 1.5MB per file)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 bg-slate-900 border border-slate-850 hover:bg-slate-850 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white cursor-pointer transition-colors shadow-sm select-none">
                  <Paperclip className="w-4 h-4 text-indigo-400" /> Unggah Dokumen
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*"
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Mendukung berkas PDF, Word, Excel, PPT, Teks, atau Gambar.
                </span>
              </div>

              {/* List of uploaded documents */}
              {formDocs.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {formDocs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850 text-slate-200 select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <File className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate text-slate-200" title={doc.name}>
                            {doc.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Dokumen'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFormDoc(doc.id)}
                        className="p-1 rounded-lg hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 transition-colors border-0 bg-transparent cursor-pointer"
                        title="Hapus dokumen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notulen / Keterangan Awal */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider select-none">
                Keterangan Awal / Notulen Hasil Rapat (Opsional)
              </label>
              <textarea
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                rows={5}
                placeholder="Tuliskan detail agenda rapat, tautan room meeting (jika online), atau langsung tuliskan keputusan rapat di sini..."
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-650 resize-y"
              />
            </div>

            {/* Submit Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-450 hover:text-slate-200 hover:bg-slate-850 transition-colors border-0 bg-transparent cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 border-0 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {editingMeeting ? 'Simpan Perubahan' : 'Jadwalkan Rapat'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* QUICK NOTULEN MODAL */}
      {notulenMeeting && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0" onClick={() => setNotulenMeeting(null)} />
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-white text-base truncate max-w-[320px]">
                  Tulis Notulen: {notulenMeeting.judul}
                </h3>
              </div>
              <button
                onClick={() => setNotulenMeeting(null)}
                className="p-1 rounded-lg text-slate-450 hover:text-slate-200 hover:bg-slate-800 border-0 bg-transparent cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotulen} className="space-y-4">
              <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-850 leading-relaxed font-medium">
                <div className="font-bold text-slate-300">Detail Pertemuan:</div>
                <div className="mt-1">
                  Waktu Pelaksanaan: {notulenMeeting.isMultiDay ? (
                    `${formatDisplayDate(notulenMeeting.tanggal)} s.d. ${formatDisplayDate(notulenMeeting.tanggalSelesai)} (Multi-Hari)`
                  ) : (
                    `${formatDisplayDate(notulenMeeting.tanggal)} pukul ${formatDisplayTime(notulenMeeting.jam)}`
                  )}
                </div>
                <div>Tempat / Lokasi: {notulenMeeting.lokasi}</div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider">
                  Catatan Notulen / Hasil Keputusan Rapat
                </label>
                <textarea
                  value={notulenText}
                  onChange={(e) => setNotulenText(e.target.value)}
                  rows={8}
                  placeholder="Tuliskan risalah rapat, daftar hadir rincian, pembahasan masalah di lapangan, serta keputusan penting yang disepakati bersama oleh tim..."
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-3.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors resize-y select-text"
                  required
                />
              </div>

              <div className="flex gap-2.5 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setNotulenMeeting(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-450 hover:text-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-650/20 border-0 cursor-pointer"
                >
                  Simpan Notulen
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* DETAIL RAPAT MODAL (PUBLIC FOR ALL ROLES) */}
      {selectedMeetingDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" onClick={() => setSelectedMeetingDetail(null)} />
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto no-scrollbar">
            
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1.5 pr-8">
                <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
                  Detail Risalah Rapat
                </span>
                <h3 className="font-extrabold text-slate-100 text-lg md:text-xl leading-snug">
                  {selectedMeetingDetail.judul}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-450 text-[11px] font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {selectedMeetingDetail.isMultiDay ? (
                      `${formatDisplayDate(selectedMeetingDetail.tanggal)} s.d. ${formatDisplayDate(selectedMeetingDetail.tanggalSelesai)} • Multi-Hari`
                    ) : (
                      `${formatDisplayDate(selectedMeetingDetail.tanggal)} • Pukul ${formatDisplayTime(selectedMeetingDetail.jam)}`
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {selectedMeetingDetail.lokasi}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeetingDetail(null)}
                className="p-1.5 rounded-lg text-slate-450 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 bg-slate-900/60 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Section (Two Column Layout if media exists) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Agenda/Notulen & Attendees (8/12 or 12/12) */}
              <div className={`${(selectedMeetingDetail.fotoKegiatan || selectedMeetingDetail.linkYoutube) ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-5`}>
                
                {/* Risalah / Notulen */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <FileText className="w-4 h-4 text-indigo-400" /> Hasil Pembahasan / Notulen Rapat
                  </h4>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 md:p-5">
                    {selectedMeetingDetail.keterangan ? (
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line select-text">
                        {selectedMeetingDetail.keterangan}
                      </p>
                    ) : (
                      <p className="text-xs md:text-sm text-slate-500 italic select-none">
                        Belum ada catatan atau notulen hasil pembahasan untuk rapat ini.
                      </p>
                    )}
                  </div>
                </div>

                {/* Peserta Rapat */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Users className="w-4 h-4 text-indigo-400" /> Daftar Hadir Peserta ({selectedMeetingDetail.pesertaIds.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedMeetingDetail.pesertaIds.map(pid => {
                      const foundUser = users.find(u => u.id === pid);
                      if (!foundUser) return null;
                      return (
                        <div 
                          key={pid} 
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/40 border border-slate-850/60 select-none"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {getInitials(foundUser.nama)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate leading-snug">{foundUser.nama}</div>
                            <div className="text-[9px] text-slate-500 truncate mt-0.5">{foundUser.jabatanTim}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dokumen Lampiran Rapat */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                    <Paperclip className="w-4 h-4 text-indigo-400" /> Dokumen Pendukung / Lampiran ({
                      (meetingDocs || []).filter(d => d.meetingId === selectedMeetingDetail.id).length
                    })
                  </h4>
                  {(() => {
                    const currentDocs = (meetingDocs || []).filter(d => d.meetingId === selectedMeetingDetail.id);
                    if (currentDocs.length === 0) {
                      return (
                        <p className="text-xs text-slate-500 italic select-none pl-1">
                          Tidak ada berkas lampiran pendukung rapat yang diunggah.
                        </p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentDocs.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-850/60 select-none hover:border-indigo-500/25 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <File className="w-4 h-4 text-indigo-400 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-200 truncate pr-1" title={doc.name}>
                                  {doc.name}
                                </p>
                                <p className="text-[9px] text-slate-500">
                                  {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Dokumen'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => downloadDocument(doc)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                              title="Buka / Unduh Dokumen"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </div>

              {/* Right Column: Foto Dokumentasi & Embed YouTube (5/12) */}
              {(selectedMeetingDetail.fotoKegiatan || selectedMeetingDetail.linkYoutube) && (
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Foto Dokumentasi */}
                  {selectedMeetingDetail.fotoKegiatan && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                        <Image className="w-4 h-4 text-indigo-400" /> Foto Dokumentasi Kegiatan
                      </h4>
                      <div 
                        className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950 aspect-video flex items-center justify-center cursor-zoom-in"
                        onClick={() => window.open(selectedMeetingDetail.fotoKegiatan)}
                        title="Klik untuk membuka dalam ukuran penuh"
                      >
                        <img 
                          src={getDirectImageUrl(selectedMeetingDetail.fotoKegiatan)} 
                          alt="Dokumentasi Rapat" 
                          crossOrigin={selectedMeetingDetail.fotoKegiatan && selectedMeetingDetail.fotoKegiatan.startsWith('data:') ? undefined : "anonymous"}
                          className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-300" 
                        />
                      </div>
                    </div>
                  )}

                  {/* YouTube Embed Player */}
                  {selectedMeetingDetail.linkYoutube && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
                        <Youtube className="w-4 h-4 text-rose-450" /> Rekaman Jalannya Rapat
                      </h4>
                      {getYoutubeEmbedUrl(selectedMeetingDetail.linkYoutube) ? (
                        <div className="w-full aspect-video rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 shadow-md">
                          <iframe 
                            src={getYoutubeEmbedUrl(selectedMeetingDetail.linkYoutube)} 
                            className="w-full h-full border-0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title="Rekaman Rapat"
                          ></iframe>
                        </div>
                      ) : (
                        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 text-center space-y-2.5">
                          <p className="text-xs text-slate-500">
                            Tautan video eksternal terdaftar. Klik tombol di bawah ini untuk menonton rekaman rapat di tab baru:
                          </p>
                          <a
                            href={selectedMeetingDetail.linkYoutube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border border-rose-500/20 hover:border-transparent rounded-xl text-xs font-bold transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Buka Rekaman Video
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 select-none">
              {isSuperAdmin ? (
                <button
                  onClick={() => {
                    handleEditClick(selectedMeetingDetail);
                    setSelectedMeetingDetail(null);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Rapat
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setSelectedMeetingDetail(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
