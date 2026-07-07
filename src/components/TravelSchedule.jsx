import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, AlertCircle, CheckCircle, Clock, MapPin, Send, Plus, HelpCircle, X, ChevronDown, ChevronUp, Pencil, Save, Users, Eye, Trash2, FileText, Download, Upload, Camera, Image, AlertTriangle } from 'lucide-react';

export default function TravelSchedule({ 
  schools, 
  users, 
  activeUser, 
  settings, 
  onUpdateSettings,
  onUpdateUser,
  trips, 
  onAddTrip,
  onApproveTrip,
  onRejectTrip,
  onApproveTripsBatch,
  onRejectTripsBatch,
  onUpdateTrip,
  onDeleteTrip,
  onUpdateTripsBatch,
  onDeleteTripsBatch,
  tripDocs = [],
  schoolDocs = [],
  onAddTripDoc,
  onDeleteTripDoc,
  onCloseDocsModal,
  warnings = [],
  onDismissWarning
}) {
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayDate = getTodayDateStr();

  const getDurationFriendly = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return '-';
    try {
      const start = new Date(startDateStr);
      const end = new Date(endDateStr);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
      
      let years = end.getFullYear() - start.getFullYear();
      let months = end.getMonth() - start.getMonth();
      let days = end.getDate() - start.getDate();
      
      if (days < 0) {
        months -= 1;
        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
        days += prevMonth.getDate();
      }
      
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      
      const totalMonths = (years * 12) + months;
      
      const parts = [];
      if (totalMonths > 0) parts.push(`${totalMonths} Bulan`);
      if (days > 0 || parts.length === 0) parts.push(`${days} Hari`);
      
      return parts.join(' ');
    } catch {
      return '-';
    }
  };

  const [collectiveStart, setCollectiveStart] = useState('');
  const [collectiveEnd, setCollectiveEnd] = useState('');
  const [collectiveType, setCollectiveType] = useState(1); // 1 or 2
  const [tripDates, setTripDates] = useState({});
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);
  const [selectedSchoolNpsns, setSelectedSchoolNpsns] = useState([]);
  const [expandedBatches, setExpandedBatches] = useState({});
  const [editingTrip, setEditingTrip] = useState(null);
  const [docsModalTrip, setDocsModalTrip] = useState(null);
  const [docModalActiveTab, setDocModalActiveTab] = useState('surat_tugas');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [photoUploadingTripKey, setPhotoUploadingTripKey] = useState(null); // key = batch key when uploading
  const [photoUploadProgress, setPhotoUploadProgress] = useState(null);

  // Rejection & Revert/Return notes states
  const [rejectingTripIds, setRejectingTripIds] = useState(null);
  const [rejectTripNote, setRejectTripNote] = useState('');
  const [returningTripBatch, setReturningTripBatch] = useState(null);
  const [returnTripNote, setReturnTripNote] = useState('');

  // Cek apakah sekolah sudah memiliki trip non-rejected untuk kunjungan tertentu (dari fasilitator yg login)
  const hasSchoolTrip = (schoolNpsn, visitNum, fasilitatorId) => {
    const uid = fasilitatorId || activeUser.id;
    return trips.some(t =>
      t.sekolahId === schoolNpsn &&
      t.kunjunganKe === visitNum &&
      t.userId === uid &&
      t.statusPersetujuan !== 'rejected'
    );
  };

  // Auto-select all schools that are not already scheduled when modal opens or collectiveType changes
  useEffect(() => {
    if (showCollectiveModal) {
      const selectable = mySchools.filter(school => {
        const alreadyScheduled = hasSchoolTrip(school.npsn, collectiveType, activeUser.id);
        return !alreadyScheduled;
      });
      setSelectedSchoolNpsns(selectable.map(s => s.npsn));
    }
  }, [showCollectiveModal, collectiveType, schools, activeUser.id]);

  // Per-user default trip days editing state
  // Keyed by userId, stores local edit value
  const [editingTripDays, setEditingTripDays] = useState({});
  const [savingTripDays, setSavingTripDays] = useState({});

  const getDefaultDays = (user) => {
    if (!user) return 5;
    if (user.defaultTripDays && Number(user.defaultTripDays) > 0) return Number(user.defaultTripDays);
    return user.jabatanTim === 'Fasilitator' ? 5 : 4;
  };

  const handleSaveTripDaysForUser = (user) => {
    const val = editingTripDays[user.id];
    if (val === undefined || val === null || val === '') return;
    const days = Math.max(1, parseInt(val) || 1);
    setSavingTripDays(prev => ({ ...prev, [user.id]: true }));
    onUpdateUser({ ...user, defaultTripDays: days });
    setTimeout(() => {
      setSavingTripDays(prev => ({ ...prev, [user.id]: false }));
      setEditingTripDays(prev => { const n = { ...prev }; delete n[user.id]; return n; });
    }, 800);
  };

  const handleStartDateChange = (val) => {
    setCollectiveStart(val);
    if (val) {
      const duration = getDefaultDays(activeUser);
      const d = new Date(val);
      d.setDate(d.getDate() + (duration - 1));
      setCollectiveEnd(d.toISOString().split('T')[0]);
    } else {
      setCollectiveEnd('');
    }
  };

  // Date helper functions
  const addMonths = (dateStr, months) => {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  const getMonthsDifference = (d1Str, d2Str) => {
    const date1 = new Date(d1Str);
    const date2 = new Date(d2Str);
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return dateStr;
    }
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

  // Standard Target Dates based on project settings
  const projectStart = settings.projectStartDate || '2026-06-12';
  const month3Date = addMonths(projectStart, 3); // Default: 2026-09-12
  const month6Date = addMonths(projectStart, 6); // Default: 2026-12-12

  // Determine triggers for a school
  const getSchoolTriggers = (school) => {
    const start = school.tanggal_mulai_sekolah || projectStart;
    const monthsElapsed = getMonthsDifference(start, todayDate);

    const req1_progress = school.progres_fisik >= 50;
    const req1_time = monthsElapsed >= 3;
    // Kunjungan I trigger: progress >= 50% OR >= 3 months
    const triggerKunjungan1 = req1_progress || req1_time;
    const reasonKunjungan1 = req1_progress 
      ? `Progres fisik mencapai ${school.progres_fisik}% (Syarat >= 50%)`
      : `Usia proyek mencapai ${monthsElapsed} bulan (Syarat >= 3 Bulan)`;

    const req2_progress = school.progres_fisik === 100;
    const req2_time = monthsElapsed >= 6;
    // Kunjungan II trigger: progress = 100% OR >= 6 months
    const triggerKunjungan2 = req2_progress || req2_time;
    const reasonKunjungan2 = req2_progress
      ? 'Progres fisik mencapai 100%'
      : `Usia proyek mencapai ${monthsElapsed} bulan (Syarat >= 6 Bulan)`;

    return {
      monthsElapsed,
      req1_progress,
      req1_time,
      triggerKunjungan1,
      reasonKunjungan1,
      req2_progress,
      req2_time,
      triggerKunjungan2,
      reasonKunjungan2
    };
  };

  // Filter schools for this user
  const isFasilitator = activeUser.jabatanTim === 'Fasilitator';
  const isKoordinator = activeUser.jabatanTim === 'Koordinator';
  const isSuperAdmin = activeUser.jabatanTim === 'Super Admin' || activeUser.role === 'admin';

  // Users eligible for trip days configuration (Fasilitator & Koordinator)
  const tripEligibleUsers = users.filter(u => u.jabatanTim === 'Fasilitator' || u.jabatanTim === 'Koordinator');

  // Get active schools for calculation
  const getCoordinatorSchoolFilter = (school) => {
    if (!school.fasilitatorId) return false;
    const fasilitator = users.find(u => u.id === school.fasilitatorId);
    return fasilitator && fasilitator.coordinatorId === activeUser.id;
  };

  const mySchools = isFasilitator
    ? schools.filter((s) => s.fasilitatorId === activeUser.id)
    : isKoordinator
    ? schools.filter(getCoordinatorSchoolFilter)
    : schools;

  const handleSaveCollectiveTrip = () => {
    const selectedSchools = mySchools.filter(school => selectedSchoolNpsns.includes(school.npsn));

    if (selectedSchools.length === 0) {
      window.showAlert(`Silakan pilih minimal satu sekolah binaan untuk dijadwalkan.`);
      return;
    }

    const sDate = new Date(collectiveStart);
    const eDate = new Date(collectiveEnd || collectiveStart);
    const diffMs = eDate.getTime() - sDate.getTime();
    const duration = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const newTrips = selectedSchools.map(school => ({
      id: `trip-${Date.now()}-${school.npsn}`,
      sekolahId: school.npsn,
      userId: activeUser.id,
      userRoleTim: activeUser.jabatanTim,
      kunjunganKe: Number(collectiveType),
      tanggalMulai: collectiveStart,
      tanggalSelesai: collectiveEnd || collectiveStart,
      durasiHari: duration,
      statusPekerjaanSaatKunjungan: school.progres_fisik || 0,
      laporanHasil: `Kunjungan Lapangan Ke-${collectiveType} Terjadwal Kolektif`,
      statusPersetujuan: 'pending',
      approvedBySuperAdmin: false
    }));

    onAddTrip(newTrips);
    window.showAlert(`Jadwal Kunjungan Ke-${collectiveType} Kolektif berhasil disimpan untuk ${selectedSchools.length} sekolah!`);
    setShowCollectiveModal(false);
  };

  const handleSaveTripInline = (schoolNpsn, visitNum) => {
    const tripDate = tripDates[`${schoolNpsn}-${visitNum}`] || todayDate;
    
    const duration = getDefaultDays(activeUser);
    const startDate = new Date(tripDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (duration - 1));

    const targetSchool = schools.find(s => s.npsn === schoolNpsn);

    const newTrip = {
      id: `trip-${Date.now()}`,
      sekolahId: schoolNpsn,
      userId: activeUser.id,
      userRoleTim: activeUser.jabatanTim,
      kunjunganKe: Number(visitNum),
      tanggalMulai: tripDate,
      tanggalSelesai: endDate.toISOString().split('T')[0],
      durasiHari: duration,
      statusPekerjaanSaatKunjungan: targetSchool ? targetSchool.progres_fisik : 0,
      laporanHasil: `Kunjungan Lapangan Ke-${visitNum} Terjadwal`,
      statusPersetujuan: 'pending',
      approvedBySuperAdmin: false
    };

    onAddTrip(newTrip);
    window.showAlert(`Laporan Perjalanan Dinas Kunjungan ${visitNum} berhasil disimpan!`);
  };


  const getSchoolTrips = (npsn) => {
    return trips.filter(t => t.sekolahId === npsn);
  };

  // --- KOORDINATOR PRIORITIZATION QUEUE LOGIC ---
  // A Koordinator travels for 4 days based on two check points (50% and 100%).
  // Priority rule:
  // - High Priority: Schools that have not reached 50% (for Visit 1) or 100% (for Visit 2)
  //   BUT the facilitator has already done their visit (meaning there are delays/problems).
  // - Normal/Random: Schools that have already met progress targets.
  const getPriorityList = () => {
    if (!isKoordinator) return [];

    return mySchools.map(school => {
      const schoolTrips = getSchoolTrips(school.npsn);
      const triggers = getSchoolTriggers(school);
      
      const facKunjungan1Done = schoolTrips.some(t => t.userRoleTim === 'Fasilitator' && t.kunjunganKe === 1 && (t.statusPersetujuan === 'approved' || t.statusPersetujuan === undefined));
      const facKunjungan2Done = schoolTrips.some(t => t.userRoleTim === 'Fasilitator' && t.kunjunganKe === 2 && (t.statusPersetujuan === 'approved' || t.statusPersetujuan === undefined));
      
      const koorKunjungan1Done = schoolTrips.some(t => t.userRoleTim === 'Koordinator' && t.kunjunganKe === 1 && t.statusPersetujuan !== 'rejected');
      const koorKunjungan2Done = schoolTrips.some(t => t.userRoleTim === 'Koordinator' && t.kunjunganKe === 2 && t.statusPersetujuan !== 'rejected');

      let priorityScore = 0; // 0 = no action, 1 = completed, 2 = random/low priority, 3 = high priority
      let statusText = 'Tidak ada penugasan aktif';
      let targetVisit = 0;

      if (!koorKunjungan1Done) {
        targetVisit = 1;
        if (school.progres_fisik >= 50) {
          priorityScore = 2; // Normal (Reached 50%)
          statusText = 'Wajib Supervisi Kunjungan I (Sekolah sudah mencapai 50%)';
        } else if (facKunjungan1Done && school.progres_fisik < 50) {
          priorityScore = 3; // HIGH PRIORITY (Facilitator visited but progress delayed)
          statusText = 'KRITIS: Fasilitator telah berkunjung ke-1, namun progres masih < 50%';
        } else {
          priorityScore = 0;
          statusText = 'Menunggu target progres 50% atau kunjungan Fasilitator';
        }
      } else if (!koorKunjungan2Done) {
        targetVisit = 2;
        if (school.progres_fisik === 100) {
          priorityScore = 2; // Normal
          statusText = 'Wajib Supervisi Kunjungan II (Sekolah sudah mencapai 100%)';
        } else if (facKunjungan2Done && school.progres_fisik < 100) {
          priorityScore = 3; // HIGH PRIORITY (Facilitator visited but progress delayed)
          statusText = 'KRITIS: Fasilitator telah berkunjung ke-2, namun progres masih < 100%';
        } else {
          priorityScore = 0;
          statusText = 'Menunggu target progres 100% atau kunjungan Fasilitator';
        }
      } else {
        priorityScore = 1; // Completed
        statusText = 'Seluruh Supervisi Koordinator Selesai';
      }

      return {
        school,
        priorityScore,
        statusText,
        targetVisit,
        koorKunjungan1Done,
        koorKunjungan2Done
      };
    }).filter(item => item.priorityScore > 0)
      .sort((a, b) => b.priorityScore - a.priorityScore); // High priority first
  };

  const coordinatorPriorities = getPriorityList();

  // ---- Doc categories config for 6-tab modal ----
  const DOC_CATEGORIES = [
    { key: 'surat_tugas', label: 'Surat Tugas', icon: FileText, color: 'indigo', adminOnly: true },
    { key: 'sppd', label: 'SPPD', icon: FileText, color: 'violet', adminOnly: true },
    { key: 'transport_antar_kab', label: 'Transportasi Antar Kab.', icon: FileText, color: 'blue', adminOnly: false },
    { key: 'transport_lokal', label: 'Transportasi Lokal', icon: FileText, color: 'cyan', adminOnly: false },
    { key: 'penginapan', label: 'Penginapan', icon: FileText, color: 'teal', adminOnly: false },
    { key: 'foto_dokumentasi', label: 'Foto Dokumentasi', icon: Camera, color: 'emerald', adminOnly: false },
  ];

  // ---- Compress image to JPEG using canvas (same technique as DailyLogs) ----
  const compressImageToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 800;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width >= height) { height = Math.round((height / width) * MAX_DIM); width = MAX_DIM; }
          else { width = Math.round((width / height) * MAX_DIM); height = MAX_DIM; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.70));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // ---- Handle batch photo upload (for fasilitator own trips) ----
  const handleBatchPhotoUpload = async (file, batchKey, batchTrips) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { window.showAlert('Ukuran file maksimal 10MB.'); return; }
    setPhotoUploadingTripKey(batchKey);
    setPhotoUploadProgress(10);
    try {
      let base64Data;
      if (file.type.startsWith('image/')) {
        base64Data = await compressImageToBase64(file);
      } else {
        base64Data = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = (ev) => res(ev.target.result);
          reader.onerror = rej;
          reader.readAsDataURL(file);
        });
      }
      setPhotoUploadProgress(80);
      // Attach photo to all trips in the batch (link by first trip id as representative)
      batchTrips.forEach(trip => {
        onAddTripDoc({
          tripId: trip.id,
          name: file.name,
          fileName: file.name,
          fileSize: file.size,
          category: 'foto_dokumentasi',
          fileData: base64Data,
          uploadedBy: activeUser.id,
          uploadedAt: new Date().toISOString()
        });
      });
      setPhotoUploadProgress(100);
      setTimeout(() => { setPhotoUploadingTripKey(null); setPhotoUploadProgress(null); }, 700);
      window.showAlert('Foto dokumentasi berhasil diupload!');
    } catch (err) {
      setPhotoUploadingTripKey(null); setPhotoUploadProgress(null);
      window.showAlert('Gagal mengupload foto. Silakan coba lagi.');
    }
  };

  // ---- Computed: trips missing photos for current user (Koordinator/Ketua Tim/Super Admin) ----
  // todayDate is already defined above from settings?.simulatedToday

  const myMissingPhotoWarnings = (warnings || []).filter(w =>
    w.type === 'missing_trip_photos' &&
    w.userId === activeUser.id &&
    !w.dismissed
  );

  return (
    <>
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Main Content - Single Column Layout */}
      <div className="space-y-6">

        {/* ⚠ Missing Photo Documentation Warnings (Koordinator / Ketua Tim / Super Admin) */}
        {myMissingPhotoWarnings.length > 0 && (
          <div className="bg-rose-500/5 border border-rose-500/30 rounded-2xl p-5 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-rose-300 text-sm">Peringatan: Foto Dokumentasi Belum Diupload</h4>
                <p className="text-[11px] text-rose-400/70 mt-0.5">
                  Terdapat {myMissingPhotoWarnings.length} perjalanan dinas yang sudah selesai namun belum dilengkapi foto dokumentasi.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {myMissingPhotoWarnings.map(w => (
                <div key={w.id} className="flex items-start justify-between gap-3 bg-rose-500/5 border border-rose-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Camera className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-rose-200/90 leading-relaxed">{w.message}</p>
                  </div>
                  {onDismissWarning && (
                    <button
                      onClick={() => onDismissWarning(w.id)}
                      className="shrink-0 p-1 rounded-lg hover:bg-rose-500/15 text-rose-500 hover:text-rose-300 transition-colors border-0 cursor-pointer"
                      title="Tutup peringatan ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rules summary (Full Width Card) */}
        <details className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 select-none group open:bg-slate-900/50 transition-colors">
          <summary className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer list-none outline-none">
            <AlertCircle className="w-4 h-4 text-indigo-400" /> 
            <span>Aturan Kunjungan Dinas</span>
            <div className="ml-auto p-1 rounded-full bg-slate-800/50 group-hover:bg-slate-800 transition-colors">
              <ChevronDown className="w-4 h-4 text-indigo-400/70 group-open:rotate-180 transition-transform duration-300" />
            </div>
          </summary>
          
          <div className="pt-4 mt-4 border-t border-slate-800/60 animate-fade-in">
            <div className={`grid grid-cols-1 ${!isFasilitator ? 'md:grid-cols-2 gap-6' : ''} text-xs text-slate-400 leading-relaxed`}>
              <div>
                <span className="block font-bold text-indigo-400">Ketentuan Fasilitator (default {getDefaultDays(users.find(u => u.jabatanTim === 'Fasilitator') || { jabatanTim: 'Fasilitator' })} Hari)</span>
                <p className="mt-1 text-slate-400">
                  Kunjungan wajib dilakukan pada 2 checkpoint utama:
                </p>
                <ul className="list-disc list-inside mt-1.5 pl-1 space-y-1 text-slate-400">
                  <li>Kunjungan I: Progres ≥ 50% ATAU Bulan ke-3 (Mulai {month3Date})</li>
                  <li>Kunjungan II: Progres 100% ATAU Bulan ke-6 (Mulai {month6Date})</li>
                </ul>
              </div>
              
              {!isFasilitator && (
                <div className="pt-3 md:pt-0 md:pl-6 md:border-l border-slate-800/80">
                  <span className="block font-bold text-indigo-400">Ketentuan Koordinator (default {getDefaultDays(users.find(u => u.jabatanTim === 'Koordinator') || { jabatanTim: 'Koordinator' })} Hari)</span>
                  <p className="mt-1 text-slate-400">
                    Supervising dinas dilakukan setelah:
                  </p>
                  <ul className="list-disc list-inside mt-1.5 pl-1 space-y-1 text-slate-400">
                    <li>Supervisi I: Progres sekolah ≥ 50%.</li>
                    <li>Supervisi II: Progres sekolah mencapai 100%.</li>
                    <li>Prioritas Kunjungan: Diutamakan pada sekolah bermasalah yang progresnya terhambat (&lt;50% / &lt;100%) meskipun Fasilitator sudah berkunjung.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </details>

      {/* Trip Documents Modal - 6 Tab Categories */}
      {docsModalTrip && createPortal(
        (() => {
          const modalTrip = docsModalTrip.trip || docsModalTrip;
          const firstTrip = Array.isArray(modalTrip) ? modalTrip[0] : modalTrip;
          const tripIds = Array.isArray(modalTrip) ? modalTrip.map(t => t.id) : [modalTrip.id];

          // Active tab from state, default to surat_tugas
          const activeTabKey = docModalActiveTab;
          const activeCat = DOC_CATEGORIES.find(c => c.key === activeTabKey) || DOC_CATEGORIES[0];
          const ActiveIcon = activeCat.icon;

          // Count docs per category for badges
          const docCountByCategory = {};
          DOC_CATEGORIES.forEach(cat => {
            docCountByCategory[cat.key] = tripDocs.filter(d =>
              tripIds.includes(d.tripId) && d.category === cat.key
            ).length;
          });

          // Filtered docs for current tab
          const filteredDocs = tripDocs.filter(d =>
            tripIds.includes(d.tripId) && d.category === activeTabKey
          );

          // Determine if current user can upload in this tab
          const canUpload = isSuperAdmin || (activeTabKey === 'foto_dokumentasi' && !activeCat.adminOnly);

          // Color palette per category
          const colorMap = {
            indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', bar: 'bg-indigo-500' },
            violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400', bar: 'bg-violet-500' },
            blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
            cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', bar: 'bg-cyan-500' },
            teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/20', text: 'text-teal-400', bar: 'bg-teal-500' },
            emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'bg-emerald-500' },
          };
          const colors = colorMap[activeCat.color] || colorMap.indigo;

          const handleDocUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) {
              window.showAlert('Ukuran file maksimal 10MB.');
              e.target.value = '';
              return;
            }
            setUploadFileName(file.name);
            setUploadProgress(0);

            const doUpload = async () => {
              let base64Data;
              if (file.type.startsWith('image/') && activeTabKey === 'foto_dokumentasi') {
                base64Data = await compressImageToBase64(file);
              } else {
                base64Data = await new Promise((res, rej) => {
                  const reader = new FileReader();
                  reader.onload = ev => res(ev.target.result);
                  reader.onerror = rej;
                  reader.readAsDataURL(file);
                });
              }
              // Upload to all trips in batch (for kolektif)
              tripIds.forEach(tripId => {
                onAddTripDoc({
                  tripId,
                  name: file.name,
                  fileName: file.name,
                  fileSize: file.size,
                  category: activeTabKey,
                  fileData: base64Data,
                  uploadedBy: activeUser.id,
                  uploadedAt: new Date().toISOString()
                });
              });
              e.target.value = '';
              setUploadProgress(null);
              setUploadFileName('');
              window.showAlert('Dokumen berhasil diupload!');
            };

            // Simulate progress, then upload
            let prog = 0;
            const interval = setInterval(() => {
              prog += 25;
              setUploadProgress(Math.min(prog, 90));
              if (prog >= 75) {
                clearInterval(interval);
                doUpload().catch(() => {
                  setUploadProgress(null);
                  setUploadFileName('');
                  window.showAlert('Gagal mengupload. Coba lagi.');
                });
              }
            }, 120);
          };

          return (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                      <ActiveIcon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-200 text-sm truncate">Dokumen Perjalanan Dinas</h3>
                      <p className="text-[10px] text-slate-500 truncate">
                        {Array.isArray(modalTrip) ? `Kunjungan Kolektif (${modalTrip.length} Sekolah)` : schools.find(s => String(s.npsn) === String(firstTrip.sekolahId))?.nama_sekolah || `NPSN ${firstTrip.sekolahId}`}
                        {' '} • Kunjungan ke-{firstTrip?.kunjunganKe} ({formatDateShort(firstTrip?.tanggalMulai)} – {formatDateShort(firstTrip?.tanggalSelesai)})
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setDocsModalTrip(null); setDocModalActiveTab('surat_tugas'); onCloseDocsModal?.(); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors border-0 cursor-pointer shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-0.5 px-3 pt-3 bg-slate-950/30 shrink-0 overflow-x-auto pb-0">
                  {DOC_CATEGORIES.map(cat => {
                    const CatIcon = cat.icon;
                    const count = docCountByCategory[cat.key] || 0;
                    const isActive = cat.key === activeTabKey;
                    const catColors = colorMap[cat.color] || colorMap.indigo;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setDocModalActiveTab(cat.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-t-xl text-[10px] font-bold transition-all whitespace-nowrap border-0 cursor-pointer relative ${
                          isActive
                            ? `bg-slate-900 ${catColors.text} shadow-inner`
                            : 'bg-slate-950/40 text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
                        }`}
                      >
                        <CatIcon className="w-3 h-3" />
                        {cat.label}
                        {count > 0 && (
                          <span className={`ml-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? catColors.bg + ' ' + catColors.text : 'bg-slate-800 text-slate-400'}`}>
                            {count}
                          </span>
                        )}
                        {isActive && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${catColors.bar} rounded-full`} />}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 overflow-y-auto space-y-4 flex-1">
                  {/* Upload area */}
                  {canUpload && (
                    <div className={`${colors.bg} border ${colors.border} rounded-xl p-4 flex flex-col gap-3`}>
                      <label className={`text-xs font-semibold ${colors.text}`}>
                        Unggah {activeCat.label} Baru
                        {activeTabKey === 'foto_dokumentasi' && <span className="text-slate-500 font-normal ml-1">(Gambar akan dikompres otomatis)</span>}
                      </label>
                      {uploadProgress !== null ? (
                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                            <span className={`truncate max-w-[150px] ${colors.text}`}>{uploadFileName}</span>
                            <span className={colors.text}>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                            <div className={`${colors.bar} h-full rounded-full transition-all duration-150`} style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept={activeTabKey === 'foto_dokumentasi' ? '.jpg,.jpeg,.png,.webp' : '.pdf,.jpg,.jpeg,.png'}
                          className={`block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold ${colors.bg} file:${colors.text} hover:file:opacity-80 file:cursor-pointer file:transition-colors`}
                          onChange={handleDocUpload}
                        />
                      )}
                      <p className="text-[10px] text-slate-500">
                        {activeTabKey === 'foto_dokumentasi' ? 'Format: JPG, PNG, WEBP. Maks: 10MB. Gambar dikompres otomatis.' : 'Format: PDF, JPG, PNG. Maks: 10MB.'}
                      </p>
                    </div>
                  )}
                  {!canUpload && (
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                      <p className="text-[11px] text-slate-500 italic">Hanya Super Admin yang dapat mengunggah dokumen pada kategori ini.</p>
                    </div>
                  )}

                  {/* Document list */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={`text-xs font-semibold ${colors.text}`}>
                        Daftar {activeCat.label} Terlampir
                      </label>
                      <span className="text-[10px] text-slate-500">{filteredDocs.length} berkas</span>
                    </div>
                    {filteredDocs.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                        <ActiveIcon className="w-6 h-6 text-slate-700" />
                        <p className="text-xs text-slate-600 italic">Belum ada {activeCat.label.toLowerCase()} terlampir.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredDocs.map(doc => {
                          const isImage = doc.fileData?.startsWith('data:image') || doc.category === 'foto_dokumentasi' || (doc.fileData && (doc.fileData.includes('drive.google.com') || doc.fileData.includes('googleusercontent.com')));
                          return (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl gap-3">
                              {/* Preview thumbnail for images */}
                              <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                                {isImage ? (
                                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-700 bg-slate-900">
                                    <img src={getDirectImageUrl(doc.fileData)} alt={doc.name} crossOrigin={doc.fileData && doc.fileData.startsWith('data:') ? undefined : "anonymous"} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0`}>
                                    <FileText className={`w-5 h-5 ${colors.text}`} />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-slate-200 truncate">{doc.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB • ` : ''}
                                    {formatDateShort(doc.uploadedAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={doc.fileData}
                                  download={doc.name}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`p-1.5 ${colors.bg} hover:opacity-80 ${colors.text} rounded-lg transition-colors`}
                                  title="Unduh / Lihat"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                                {isSuperAdmin && (
                                  <button
                                    onClick={async () => {
                                      if (await window.showConfirm('Hapus dokumen ini?')) {
                                        onDeleteTripDoc(doc.id);
                                      }
                                    }}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border-0 cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })(),
        document.body
      )}
        {/* ======================== PENGATURAN HARI DINAS DEFAULT ======================== */}

        {/* Super Admin: lihat & edit semua user Fasilitator & Koordinator */}
        {isSuperAdmin && (
          <details className="bg-slate-900/30 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 group open:bg-slate-900/50 transition-colors">
            <summary className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer list-none select-none outline-none">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Pengaturan Default Hari Perjalanan Dinas</span>
              <span className="ml-auto text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full mr-2">Super Admin</span>
              <div className="p-1 rounded-full bg-slate-800/50 group-hover:bg-slate-800 transition-colors">
                <ChevronDown className="w-4 h-4 text-amber-400/70 group-open:rotate-180 transition-transform duration-300" />
              </div>
            </summary>
            
            <div className="pt-4 mt-4 border-t border-amber-500/10 animate-fade-in">
              <p className="text-[10px] text-slate-500 mb-4">Tentukan jumlah hari default perjalanan dinas untuk setiap anggota tim. Masing-masing anggota dapat mengubah sendiri nilai defaultnya.</p>
              <div className="space-y-2">
                {tripEligibleUsers.map(user => {
                  const currentDays = getDefaultDays(user);
                  const isEditing = editingTripDays[user.id] !== undefined;
                  const isSaving = savingTripDays[user.id];
                  const editVal = isEditing ? editingTripDays[user.id] : currentDays;
                  return (
                    <div key={user.id} className="flex items-center gap-3 bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2.5 hover:border-slate-700 transition-colors">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200 block truncate">{user.nama}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          user.jabatanTim === 'Fasilitator' 
                            ? 'text-indigo-400 bg-indigo-500/10' 
                            : 'text-emerald-400 bg-emerald-500/10'
                        }`}>{user.jabatanTim}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={editVal}
                          onFocus={() => setEditingTripDays(prev => ({ ...prev, [user.id]: currentDays }))}
                          onChange={e => setEditingTripDays(prev => ({ ...prev, [user.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveTripDaysForUser(user); if (e.key === 'Escape') setEditingTripDays(prev => { const n = { ...prev }; delete n[user.id]; return n; }); }}
                          className={`w-14 bg-slate-900 border rounded-lg px-2 py-1.5 text-xs font-bold text-center focus:outline-none transition-colors ${
                            isEditing ? 'border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-800 text-slate-200'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500">hari</span>
                        {isEditing && (
                          <button
                            onClick={() => handleSaveTripDaysForUser(user)}
                            disabled={isSaving}
                            className="px-2 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border-0 shadow-lg shadow-amber-600/20"
                          >
                            {isSaving ? <Clock className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {isSaving ? '' : 'Simpan'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {tripEligibleUsers.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-3">Belum ada Fasilitator atau Koordinator terdaftar.</p>
                )}
              </div>
            </div>
          </details>
        )}



        {/* Scheduler and Status Sections */}
        <div className="space-y-6">
          
          {/* FASILITATOR SCHEDULER VIEW */}
          {isFasilitator && (
            <div className="space-y-6">
              {/* Button Trigger for Floating Form */}
              {(() => {
                const remainingSchools1 = mySchools.filter(s => !hasSchoolTrip(s.npsn, 1, activeUser.id));
                const remainingSchools2 = mySchools.filter(s => !hasSchoolTrip(s.npsn, 2, activeUser.id));
                const allScheduled1 = mySchools.length > 0 && remainingSchools1.length === 0;
                const allScheduled2 = mySchools.length > 0 && remainingSchools2.length === 0;

                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 select-none">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-slate-200 text-sm">Jadwal Kunjungan Kolektif</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tentukan tanggal perjalanan dinas sekaligus untuk sebagian atau seluruh sekolah binaan Anda.</p>
                        {/* Progress summary */}
                        <div className="flex gap-3 mt-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            allScheduled1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                          }`}>
                            Kunj. I: {mySchools.length - remainingSchools1.length}/{mySchools.length} sekolah
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                            allScheduled2 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                            Kunj. II: {mySchools.length - remainingSchools2.length}/{mySchools.length} sekolah
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCollectiveModal(true)}
                        disabled={mySchools.length === 0}
                        className={`px-5 py-2.5 text-white font-bold text-xs rounded-xl transition-all duration-300 flex items-center gap-2 transform border-0 w-full sm:w-auto justify-center ${
                          mySchools.length === 0
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'btn-orange-glow hover:-translate-y-0.5 cursor-pointer'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        Jadwalkan Kunjungan
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Floating Form Modal (Overlay) */}
              {showCollectiveModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 max-w-xl w-full space-y-6 shadow-2xl relative animate-scale-in">
                    {/* Close Button */}
                    <button
                      onClick={() => setShowCollectiveModal(false)}
                      className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer border-0"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm">
                        Atur Jadwal Kunjungan Kolektif (Fasilitator)
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Tentukan tanggal perjalanan dinas satu kali langsung untuk seluruh sekolah binaan Anda.
                      </p>
                    </div>

                    {/* Tipe Kunjungan Selector (Combo Box) */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase font-bold text-slate-400">Tipe Kunjungan</label>
                      <select
                        value={collectiveType}
                        onChange={(e) => setCollectiveType(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      >
                        <option value={1}>Kunjungan I (Progres ≥ 50% / ≥ 3 Bulan)</option>
                        <option value={2}>Kunjungan II (Progres 100% / ≥ 6 Bulan)</option>
                      </select>
                    </div>

                    {/* Date Inputs Panel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-850/50 p-4 rounded-xl">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Tanggal Keberangkatan</label>
                        <input
                          type="date"
                          value={collectiveStart}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex justify-between">
                          <span>Tanggal Selesai</span>
                          <span className="text-indigo-400 lowercase font-medium">
                            {(() => {
                              if (collectiveStart && collectiveEnd) {
                                const s = new Date(collectiveStart);
                                const e = new Date(collectiveEnd);
                                if (e >= s) {
                                  const diff = e.getTime() - s.getTime();
                                  const days = Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
                                  return `${days} hari kerja`;
                                }
                              }
                              return 'default 5 hari';
                            })()}
                          </span>
                        </label>
                        <input
                          type="date"
                          value={collectiveEnd}
                          onChange={(e) => setCollectiveEnd(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Affected Schools Selection (Checkboxes) */}
                    <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          Pilih Sekolah yang Akan Dikunjungi
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSchoolNpsns(mySchools.map(s => s.npsn))}
                            className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 bg-transparent border-0 cursor-pointer"
                          >
                            Pilih Semua
                          </button>
                          <span className="text-slate-500 text-[9px]">|</span>
                          <button
                            type="button"
                            onClick={() => setSelectedSchoolNpsns([])}
                            className="text-[9px] font-bold text-slate-500 hover:text-slate-400 bg-transparent border-0 cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {mySchools.map(school => {
                          const triggers = getSchoolTriggers(school);
                          const alreadyScheduled = hasSchoolTrip(school.npsn, collectiveType, activeUser.id);
                          const isPending = trips.some(t =>
                            t.sekolahId === school.npsn &&
                            t.kunjunganKe === collectiveType &&
                            t.userId === activeUser.id &&
                            t.statusPersetujuan === 'pending'
                          );
                          const isEligible = collectiveType === 1 ? triggers.triggerKunjungan1 : triggers.triggerKunjungan2;
                          const isChecked = selectedSchoolNpsns.includes(school.npsn);
                          // Disabled jika sudah ada trip non-rejected untuk kunjungan ini
                          const isDisabled = alreadyScheduled;

                          return (
                            <label 
                              key={school.npsn} 
                              className={`flex items-center gap-3 bg-slate-900/45 border rounded-lg p-2.5 transition-all ${
                                isDisabled
                                  ? 'border-slate-800 opacity-50 cursor-not-allowed'
                                  : isChecked ? 'border-indigo-500/30 bg-indigo-500/[0.02] cursor-pointer hover:bg-slate-800/20' : 'border-slate-850 cursor-pointer hover:bg-slate-800/20'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  if (e.target.checked) {
                                    setSelectedSchoolNpsns([...selectedSchoolNpsns, school.npsn]);
                                  } else {
                                    setSelectedSchoolNpsns(selectedSchoolNpsns.filter(id => id !== school.npsn));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 bg-slate-950 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-slate-200 text-xs truncate">{school.nama_sekolah}</span>
                                  <span className="text-[10px] text-slate-500 font-bold shrink-0">Progres: {school.progres_fisik || 0}%</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {alreadyScheduled ? (
                                    isPending ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                        ⏳ Menunggu Persetujuan
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        ✓ Sudah Dijadwalkan
                                      </span>
                                    )
                                  ) : isEligible ? (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                      Siap Dijadwalkan
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-900 border border-slate-800 text-slate-500">
                                      Belum Layak (Saran Ditunda)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                        {mySchools.length === 0 && (
                          <p className="text-xs text-slate-500 italic text-center py-4">Belum ada sekolah binaan terdaftar.</p>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCollectiveModal(false)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-600 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-850"
                      >
                        Batal
                      </button>
                      {(() => {
                        const toScheduleCount = selectedSchoolNpsns.length;
                        const isDateValid = collectiveStart && collectiveEnd && new Date(collectiveEnd) >= new Date(collectiveStart);
                        const isButtonEnabled = isDateValid && toScheduleCount > 0;

                        return (
                          <button
                            onClick={handleSaveCollectiveTrip}
                            disabled={!isButtonEnabled}
                            className={`py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border-0 ${
                              isButtonEnabled
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/10'
                                : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-850'
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                            Ajukan Jadwal Kunjungan
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                </div>,
                document.body
              )}

              {/* Schools Status Details Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                <div className="p-6 border-b border-slate-800 select-none">
                  <h3 className="font-semibold text-slate-200 text-sm">
                    Daftar Sekolah Binaan & Status Binaan
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Informasi kelayakan kunjungan dinas ke sekolah berdasarkan progres fisik dan linimasa proyek.
                  </p>
                </div>

                {mySchools.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-10 select-none">
                    Anda belum mengklaim sekolah binaan.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-350">
                      <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider select-none">
                        <tr>
                          <th className="px-6 py-4">Nama Sekolah / NPSN</th>
                          <th className="px-6 py-4">Wilayah</th>
                          <th className="px-6 py-4">Progres Fisik</th>
                          <th className="px-6 py-4 text-center">Kunjungan I (50% / Bln 3)</th>
                          <th className="px-6 py-4 text-center">Kunjungan II (100% / Bln 6)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {mySchools.map((school) => {
                          const triggers = getSchoolTriggers(school);
                          const trip1 = trips.find(t => String(t.sekolahId) === String(school.npsn) && t.kunjunganKe === 1 && t.userId === activeUser.id && t.statusPersetujuan !== 'rejected');
                          const trip2 = trips.find(t => String(t.sekolahId) === String(school.npsn) && t.kunjunganKe === 2 && t.userId === activeUser.id && t.statusPersetujuan !== 'rejected');

                          const renderVisitCell = (trip, isEligible) => (
                            <div className="flex flex-col items-center gap-1 select-none">
                              {trip ? (
                                trip.statusPersetujuan === 'pending' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 animate-pulse">
                                    <Clock className="w-3 h-3" /> Menunggu Approval
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                    <CheckCircle className="w-3 h-3" /> Terlaksana
                                  </span>
                                )
                              ) : isEligible ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                                  <AlertCircle className="w-3 h-3" /> Siap Dikunjungi
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-850">
                                  Belum Waktunya
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500 block">
                                {trip ? formatDateShort(trip.tanggalMulai) : isEligible ? 'Syarat Terpenuhi' : 'Menunggu syarat'}
                              </span>
                            </div>
                          );

                          return (
                            <tr key={school.npsn} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4">
                                <span className="font-bold text-slate-200 block">{school.nama_sekolah}</span>
                                <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">NPSN {school.npsn}</span>
                              </td>
                              <td className="px-6 py-4 font-medium text-slate-400">
                                <span className="block">{school.kabupaten}</span>
                                <span className="text-[10px] text-slate-500 block">{school.kecamatan ? `Kec. ${school.kecamatan}` : '-'}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 select-none">
                                  <span className="font-bold text-emerald-400 w-8">{school.progres_fisik || 0}%</span>
                                  <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${school.progres_fisik || 0}%` }}></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">{renderVisitCell(trip1, triggers.triggerKunjungan1)}</td>
                              <td className="px-6 py-4 text-center">{renderVisitCell(trip2, triggers.triggerKunjungan2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KOORDINATOR SCHEDULER VIEW */}
          {isKoordinator && (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-200 text-sm">
                  Supervisi & Antrean Kunjungan Dinas Koordinator
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Daftar sekolah yang diurutkan berdasarkan skala prioritas kondisi keterlambatan lapangan.</p>
              </div>

              {coordinatorPriorities.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Tidak ada jadwal kunjungan aktif. Sekolah binaan belum mencapai target progres.
                </p>
              ) : (
                <div className="space-y-4">
                  {coordinatorPriorities.map(({ school, priorityScore, statusText, targetVisit }) => {
                    const isHighPriority = priorityScore === 3;

                    return (
                      <div 
                        key={school.npsn} 
                        className={`border rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          isHighPriority 
                            ? 'bg-rose-500/[0.02] border-rose-500/20' 
                            : 'bg-slate-950/60 border-slate-850'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-slate-500 font-bold tracking-wider">NPSN {school.npsn}</span>
                            {isHighPriority && (
                              <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20">
                                PRIORITAS TINGGI
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-200 text-sm">{school.nama_sekolah}</h4>
                          <p className="text-[10px] font-medium text-slate-400">{statusText}</p>
                          <div className="flex gap-4 pt-1 text-xs text-slate-500">
                            <span>Kab: <strong>{school.kabupaten}</strong></span>
                            <span>Progres: <strong className={isHighPriority ? 'text-rose-400' : 'text-emerald-400'}>{school.progres_fisik}%</strong></span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={tripDates[`${school.npsn}-${targetVisit}`] || todayDate}
                              onChange={(e) => setTripDates({
                                ...tripDates,
                                [`${school.npsn}-${targetVisit}`]: e.target.value
                              })}
                              className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                              onClick={() => handleSaveTripInline(school.npsn, targetVisit)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                                isHighPriority 
                                  ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/10' 
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-lg shadow-indigo-600/10'
                              }`}
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======= SUPER ADMIN: PANEL REVIU BATCH PERJALANAN DINAS ======= */}
          {isSuperAdmin && (() => {
            // Kelompokkan trips berdasarkan userId + kunjunganKe + tanggalMulai (= satu batch)
            const fasilitatorTrips = trips.filter(t => t.userRoleTim === 'Fasilitator');
            const batchMap = {};
            fasilitatorTrips.forEach(t => {
              const key = `${t.userId}||${t.kunjunganKe}||${t.tanggalMulai}`;
              if (!batchMap[key]) batchMap[key] = [];
              batchMap[key].push(t);
            });
            const batches = Object.values(batchMap).sort((a, b) =>
              (b[0].tanggalMulai || '').localeCompare(a[0].tanggalMulai || '')
            );

            if (batches.length === 0) {
              return (
                <div className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/10 rounded-2xl p-6">
                  <h3 className="font-semibold text-slate-200 text-sm mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" /> Reviu Perjalanan Dinas Fasilitator
                    <span className="ml-auto text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">Super Admin</span>
                  </h3>
                  <p className="text-xs text-slate-500 italic text-center py-6">Belum ada pengajuan perjalanan dinas dari Fasilitator.</p>
                </div>
              );
            }

            return (
              <div className="bg-slate-900/30 backdrop-blur-md border border-indigo-500/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm">Reviu Perjalanan Dinas Fasilitator</h3>
                    <p className="text-[10px] text-slate-500">Tinjau persyaratan setiap batch pengajuan sebelum memberikan persetujuan.</p>
                  </div>
                  <span className="ml-auto text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full shrink-0">Super Admin</span>
                </div>

                {batches.map((batchTrips, batchIdx) => {
                  const firstTrip = batchTrips[0];
                  const fasUser = users.find(u => u.id === firstTrip.userId);
                  const batchKey = `batch-${batchIdx}`;
                  const isExpanded = expandedBatches[batchKey];
                  const batchStatus = batchTrips.every(t => t.statusPersetujuan === 'approved' || t.statusPersetujuan === undefined && t.approvedBySuperAdmin)
                    ? 'approved'
                    : batchTrips.every(t => t.statusPersetujuan === 'rejected')
                    ? 'rejected'
                    : batchTrips.some(t => t.statusPersetujuan === 'pending')
                    ? 'pending'
                    : 'mixed';

                  const schoolEligibilityList = batchTrips.map(t => {
                    const school = schools.find(s => String(s.npsn) === String(t.sekolahId));
                    if (!school) return { t, school: null, isEligible: false, reason: 'Sekolah tidak ditemukan', triggers: null };
                    const triggers = getSchoolTriggers(school);
                    const isEligible = firstTrip.kunjunganKe === 1 ? triggers.triggerKunjungan1 : triggers.triggerKunjungan2;
                    const reason = firstTrip.kunjunganKe === 1 ? triggers.reasonKunjungan1 : triggers.reasonKunjungan2;
                    return { t, school, isEligible, reason, triggers };
                  });
                  const ineligibleCount = schoolEligibilityList.filter(e => !e.isEligible).length;
                  const pendingIds = batchTrips.filter(t => t.statusPersetujuan === 'pending').map(t => t.id);

                  return (
                    <div
                      key={batchKey}
                      className={`border rounded-2xl overflow-hidden ${
                        batchStatus === 'approved' ? 'border-emerald-500/20 bg-emerald-500/[0.02]'
                        : batchStatus === 'rejected' ? 'border-slate-800/60 opacity-60'
                        : ineligibleCount > 0 ? 'border-amber-500/30 bg-amber-500/[0.01]'
                        : 'border-slate-800'
                      }`}
                    >
                      {/* Batch Header */}
                      <div
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-800/20 transition-colors"
                        onClick={() => setExpandedBatches(prev => ({ ...prev, [batchKey]: !prev[batchKey] }))}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Users className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-200 text-xs">{fasUser ? fasUser.nama : firstTrip.userId}</span>
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold">Fasilitator</span>
                              <span className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded font-bold">Kunjungan ke-{firstTrip.kunjunganKe}</span>
                              {ineligibleCount > 0 && (
                                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                  ⚠ {ineligibleCount} Sekolah Belum Layak
                                </span>
                              )}
                              {(() => {
                                const batchTripIds = batchTrips.map(t => t.id);
                                const photoCount = tripDocs.filter(d => batchTripIds.includes(d.tripId) && d.category === 'foto_dokumentasi').length;
                                const isOverdue = firstTrip.tanggalSelesai && firstTrip.tanggalSelesai < todayDate;
                                if (photoCount > 0) {
                                  return (
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                      <Camera className="w-2.5 h-2.5" /> {photoCount} Foto
                                    </span>
                                  );
                                }
                                if (isOverdue) {
                                  return (
                                    <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-1 animate-pulse">
                                      <Camera className="w-2.5 h-2.5" /> Foto Belum Ada
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              📅 {formatDateShort(firstTrip.tanggalMulai)} s/d {formatDateShort(firstTrip.tanggalSelesai)} • {firstTrip.durasiHari} hari • {batchTrips.length} sekolah
                            </p>
                            {firstTrip.catatanPersetujuan && (
                              <div className="mt-2 text-[10px] text-slate-400 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5 max-w-xl">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed text-slate-350">
                                  <strong className="text-amber-500 font-bold">Catatan Reviewer:</strong> {firstTrip.catatanPersetujuan}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status badge */}
                          {batchStatus === 'approved' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Disetujui
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReturningTripBatch(batchTrips);
                                  setReturnTripNote('');
                                }}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/20 cursor-pointer"
                                title="Kembalikan Status / Batalkan Keputusan"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {batchStatus === 'rejected' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 flex items-center gap-1">
                                <X className="w-3 h-3" /> Ditolak
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReturningTripBatch(batchTrips);
                                  setReturnTripNote('');
                                }}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/20 cursor-pointer"
                                title="Kembalikan Status / Batalkan Keputusan"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await window.showConfirm('Hapus riwayat pengajuan perjalanan dinas yang ditolak ini secara permanen?')) {
                                    if (onDeleteTripsBatch) {
                                      onDeleteTripsBatch(batchTrips.map(t => t.id));
                                    } else {
                                      batchTrips.forEach(t => onDeleteTrip(t.id));
                                    }
                                    window.showAlert('Riwayat berhasil dihapus.');
                                  }
                                }}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20 cursor-pointer"
                                title="Hapus Riwayat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          {batchStatus === 'pending' && (
                            <>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await window.showConfirm(`Setujui ${pendingIds.length} perjalanan dinas dalam batch ini?`)) {
                                    onApproveTripsBatch(pendingIds, activeUser.nama);
                                    window.showAlert('Batch perjalanan dinas berhasil disetujui!');
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border-0 shadow-lg shadow-emerald-600/20"
                              >
                                <CheckCircle className="w-3 h-3" /> Setujui Batch
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRejectingTripIds(pendingIds);
                                  setRejectTripNote('');
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border-0"
                              >
                                <X className="w-3 h-3" /> Tolak
                              </button>
                              </>
                            )}
                            
                            {/* Batch Level Document Button - Unified 6-tab modal */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setDocsModalTrip({ trip: batchTrips }); setDocModalActiveTab('surat_tugas'); }}
                              className="px-2 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-500/20 cursor-pointer ml-2"
                              title="Kelola Semua Dokumen Perjalanan"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Dokumen</span>
                            </button>

                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />}

                          </div>
                        </div>

                      {/* Expandable school list */}
                      {isExpanded && (
                        <div className="border-t border-slate-800/60 p-4 overflow-x-auto">
                          <table className="w-full text-left text-xs whitespace-nowrap">
                            <thead>
                              <tr className="border-b border-slate-800/60 text-slate-400">
                                <th className="pb-3 font-semibold px-2">Nama Sekolah</th>
                                <th className="pb-3 font-semibold px-2 text-center">{firstTrip.kunjunganKe === 1 ? 'Progress 50%' : 'Progress 100%'}</th>
                                <th className="pb-3 font-semibold px-2 text-center">{firstTrip.kunjunganKe === 1 ? '3 Bulan Pekerjaan' : '6 Bulan Pekerjaan'}</th>
                                <th className="pb-3 font-semibold px-2 text-center">Kelayakan</th>
                                <th className="pb-3 font-semibold px-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {schoolEligibilityList.map(({ t, school, isEligible, reason, triggers }) => {
                                const progValue = school ? (school.progres_fisik || 0) : 0;
                                const isProgOk = firstTrip.kunjunganKe === 1 ? progValue >= 50 : progValue >= 100;
                                const months = triggers ? triggers.monthsElapsed : 0;
                                const isMonthOk = firstTrip.kunjunganKe === 1 ? months >= 3 : months >= 6;

                                return (
                                  <tr key={t.id} className="hover:bg-slate-800/10 transition-colors">
                                    <td className="py-3 px-2 min-w-[200px]">
                                      <p className="font-semibold text-slate-200 truncate whitespace-normal">
                                        {school ? school.nama_sekolah : `NPSN ${t.sekolahId}`}
                                      </p>
                                      <p className="text-[9px] text-slate-500 mt-0.5 whitespace-normal">{reason}</p>
                                    </td>
                                    
                                    <td className="py-3 px-2 text-center">
                                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${isProgOk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'} font-bold text-[9px]`}>
                                        {progValue}%
                                      </div>
                                    </td>
                                    
                                    <td className="py-3 px-2 text-center">
                                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${isMonthOk ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'} font-bold text-[9px]`}>
                                        {months} bln
                                      </div>
                                    </td>
                                    
                                    <td className="py-3 px-2 text-center">
                                      {isEligible ? (
                                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">
                                          ✓ Layak
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg">
                                          ⚠ Belum Layak
                                        </span>
                                      )}
                                    </td>
                                    
                                    <td className="py-3 px-2 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {t.statusPersetujuan === 'approved' ? (
                                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg">Disetujui</span>
                                        ) : t.statusPersetujuan === 'rejected' ? (
                                          <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-lg">Ditolak</span>
                                        ) : (
                                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded-lg animate-pulse">Pending</span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Triplog History (non-Super Admin) */}
          {!isSuperAdmin && (() => {
            const userTrips = trips.filter(t => t.userId === activeUser.id);
            const groupedUserTrips = {};
            userTrips.forEach(t => {
              const key = `${t.tanggalMulai}-${t.tanggalSelesai}-${t.kunjunganKe}`;
              if (!groupedUserTrips[key]) groupedUserTrips[key] = [];
              groupedUserTrips[key].push(t);
            });
            const userBatches = Object.values(groupedUserTrips).sort((a, b) => new Date(b[0].tanggalMulai) - new Date(a[0].tanggalMulai));

            return (
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
                <h3 className="font-semibold text-slate-200 text-sm mb-4 border-b border-slate-800 pb-2">
                  Riwayat Perjalanan Dinas Saya
                </h3>
                {userBatches.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    Belum ada riwayat dinas tercatat.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userBatches.map((batchTrips, batchIdx) => {
                      const firstTrip = batchTrips[0];
                      const batchStatus = batchTrips.every(t => t.statusPersetujuan === 'approved' || (t.statusPersetujuan === undefined && t.approvedBySuperAdmin))
                        ? 'approved'
                        : batchTrips.every(t => t.statusPersetujuan === 'rejected')
                        ? 'rejected'
                        : batchTrips.some(t => t.statusPersetujuan === 'pending')
                        ? 'pending'
                        : 'mixed';
                        
                      const schoolsArr = batchTrips.map(t => {
                        const s = schools.find(school => String(school.npsn) === String(t.sekolahId));
                        return s ? s.nama_sekolah : `NPSN ${t.sekolahId}`;
                      });

                      const romanVisit = firstTrip.kunjunganKe === 1 ? 'I' : firstTrip.kunjunganKe === 2 ? 'II' : firstTrip.kunjunganKe;
                      const title = `Perjalanan Dinas ${romanVisit}`;

                      const badgeColors = [
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        'bg-rose-500/10 text-rose-400 border-rose-500/30',
                        'bg-blue-500/10 text-blue-400 border-blue-500/30',
                        'bg-purple-500/10 text-purple-400 border-purple-500/30'
                      ];
                      
                      return (
                        <div key={`userbatch-${batchIdx}`} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg shadow-black/20 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
                          {/* Decorative glow */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-indigo-500/10"></div>
                          
                          <div className="flex justify-between items-start text-xs flex-wrap gap-4 relative z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 via-white to-purple-100 text-base tracking-tight drop-shadow-sm">
                                  {title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-medium">
                                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {formatDateShort(firstTrip.tanggalMulai)} s/d {formatDateShort(firstTrip.tanggalSelesai)}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> {firstTrip.durasiHari} Hari</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                           <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/50 relative z-10 space-y-3">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-indigo-400" />
                              Daftar Sekolah Kunjungan ({batchTrips.length} Sekolah)
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              {batchTrips.map(t => {
                                const school = schools.find(s => String(s.npsn) === String(t.sekolahId));
                                const schoolName = school ? school.nama_sekolah : `NPSN ${t.sekolahId}`;
                                const progValue = school ? (school.progres_fisik || 0) : 0;
                                
                                const schoolStart = school?.tanggal_mulai_sekolah || projectStart;
                                const visitDate = t.tanggalMulai || t.date || firstTrip.tanggalMulai;
                                
                                // Calculate months elapsed at visit
                                const d1 = new Date(schoolStart);
                                const d2 = new Date(visitDate);
                                const monthsElapsedAtVisit = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                                
                                const isProgOk = firstTrip.kunjunganKe === 1 ? progValue >= 50 : progValue >= 100;
                                const isTimeOk = firstTrip.kunjunganKe === 1 ? monthsElapsedAtVisit >= 3 : monthsElapsedAtVisit >= 6;
                                const isEligible = isProgOk || isTimeOk;
                                
                                const durationStr = getDurationFriendly(schoolStart, visitDate);
                                const doc50 = (schoolDocs || []).find(d => String(d.sekolahId) === String(t.sekolahId) && d.category === 'lap_progres_50');

                                return (
                                  <div 
                                    key={t.id} 
                                    className="flex flex-row items-center justify-between px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all duration-300 gap-2 text-xs"
                                  >
                                    <div className="min-w-0 flex-1 flex flex-row items-center gap-3">
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isEligible ? 'bg-emerald-400' : 'bg-rose-550 animate-pulse'}`}></div>
                                        <span className="font-extrabold text-xs text-slate-100 truncate max-w-[150px] sm:max-w-[200px]" title={schoolName}>{schoolName}</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                          isProgOk 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                          Prog: {progValue}%
                                        </span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                          isTimeOk 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        }`}>
                                          Dinas: {durationStr}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center shrink-0">
                                      {doc50 ? (
                                        <a 
                                          href={doc50.fileData} 
                                          download={doc50.fileName}
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-1 rounded-lg border transition-all cursor-pointer text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20"
                                          title="Unduh Laporan 50%"
                                        >
                                          <Download className="w-3 h-3" /> Lap 50%
                                        </a>
                                      ) : (
                                        <span className="text-[9px] font-bold text-rose-455 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 select-none">
                                          Lap 50% (-)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/50 mt-2">
                            {batchStatus === 'approved' ? (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Disetujui {firstTrip.approvedBy ? `(${firstTrip.approvedBy})` : ''}
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 w-full justify-between flex-wrap">
                                {batchStatus === 'rejected' ? (
                                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Ditolak
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3" /> Menunggu Approval
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => { setDocsModalTrip({ trip: batchTrips }); setDocModalActiveTab('surat_tugas'); }}
                                    className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors cursor-pointer border border-indigo-500/20 flex items-center gap-1"
                                    title="Kelola Dokumen"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span className="text-[9px] font-bold">Dokumen</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingTrip({ ...firstTrip, isBatch: true, batchTrips });
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer border-0"
                                    title="Ubah Tanggal"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const confirmMsg = batchStatus === 'rejected'
                                        ? `Apakah Anda yakin ingin menghapus riwayat perjalanan dinas yang ditolak untuk ${batchTrips.length} sekolah ini?`
                                        : `Apakah Anda yakin ingin membatalkan ajuan perjalanan dinas untuk ${batchTrips.length} sekolah ini?`;
                                      if (await window.showConfirm(confirmMsg)) {
                                        onDeleteTripsBatch(batchTrips.map(t => t.id));
                                        window.showAlert(batchStatus === 'rejected' ? 'Riwayat berhasil dihapus.' : 'Ajuan berhasil dibatalkan.');
                                      }
                                    }}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-500/20"
                                    title={batchStatus === 'rejected' ? "Hapus Riwayat" : "Batalkan Ajuan"}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {firstTrip.catatanPersetujuan && (
                            <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${batchStatus === 'rejected' ? 'text-rose-450' : 'text-amber-400'}`} />
                              <span className="leading-relaxed">
                                <strong className={`${batchStatus === 'rejected' ? 'text-rose-400' : 'text-amber-400'} font-bold`}>
                                  Catatan {batchStatus === 'rejected' ? 'Penolakan' : 'Reviewer'}:
                                </strong>{' '}
                                {firstTrip.catatanPersetujuan}
                              </span>
                            </div>
                          )}

                          {/* Photo Documentation Section */}
                          {(() => {
                            const batchTripIds = batchTrips.map(t => t.id);
                            const batchPhotos = (tripDocs || []).filter(d =>
                              batchTripIds.includes(d.tripId) && d.category === 'foto_dokumentasi'
                            );
                            const isOverdue = firstTrip.tanggalSelesai && firstTrip.tanggalSelesai < todayDate;
                            const batchKey = `photo-${batchIdx}`;
                            const isUploading = photoUploadingTripKey === batchKey;

                            return (
                              <div className={`rounded-xl border p-3.5 relative z-10 space-y-3 ${
                                isOverdue && batchPhotos.length === 0
                                  ? 'bg-rose-500/5 border-rose-500/20'
                                  : 'bg-slate-950/40 border-slate-800/50'
                              }`}>
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <Camera className={`w-3.5 h-3.5 ${batchPhotos.length > 0 ? 'text-emerald-400' : isOverdue ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                                    <span className={`text-[10px] font-bold ${batchPhotos.length > 0 ? 'text-emerald-400' : isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                                      Foto Dokumentasi
                                    </span>
                                    {batchPhotos.length > 0 && (
                                      <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                                        {batchPhotos.length} foto
                                      </span>
                                    )}
                                    {isOverdue && batchPhotos.length === 0 && (
                                      <span className="text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded-full animate-pulse">
                                        Wajib Diisi!
                                      </span>
                                    )}
                                  </div>

                                  {/* Upload trigger */}
                                  {isOverdue && !isUploading && (
                                    <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg transition-colors cursor-pointer border border-emerald-500/30 text-[9px] font-bold">
                                      <Upload className="w-3 h-3" />
                                      Upload Foto
                                      <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp"
                                        className="hidden"
                                        onChange={(e) => {
                                          handleBatchPhotoUpload(e.target.files[0], batchKey, batchTrips);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  )}
                                  {isUploading && (
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${photoUploadProgress || 0}%` }} />
                                      </div>
                                      <span className="text-[9px] text-emerald-400 font-bold">{photoUploadProgress}%</span>
                                    </div>
                                  )}
                                </div>

                                {/* Photo thumbnails */}
                                {batchPhotos.length > 0 && (
                                  <div className="flex gap-2 flex-wrap">
                                    {batchPhotos.slice(0, 6).map(photo => (
                                      <a key={photo.id} href={photo.fileData} download={photo.name} target="_blank" rel="noreferrer"
                                        className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 hover:border-emerald-500/50 transition-colors shrink-0 block"
                                        title={photo.name}
                                      >
                                        <img src={getDirectImageUrl(photo.fileData)} alt={photo.name} crossOrigin={photo.fileData && photo.fileData.startsWith('data:') ? undefined : "anonymous"} className="w-full h-full object-cover" />
                                      </a>
                                    ))}
                                    {batchPhotos.length > 6 && (
                                      <div className="w-14 h-14 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                                        <span className="text-[10px] font-bold text-slate-400">+{batchPhotos.length - 6}</span>
                                      </div>
                                    )}
                                    <button
                                      onClick={() => { setDocsModalTrip({ trip: batchTrips }); setDocModalActiveTab('foto_dokumentasi'); }}
                                      className="w-14 h-14 rounded-lg border border-dashed border-emerald-500/30 bg-emerald-500/5 flex flex-col items-center justify-center gap-0.5 text-emerald-500/70 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors cursor-pointer shrink-0"
                                      title="Kelola semua foto"
                                    >
                                      <Image className="w-4 h-4" />
                                      <span className="text-[8px] font-bold">Semua</span>
                                    </button>
                                  </div>
                                )}

                                {isOverdue && batchPhotos.length === 0 && (
                                  <p className="text-[10px] text-rose-400/70 italic">
                                    Perjalanan dinas ini sudah selesai. Upload minimal 1 foto dokumentasi agar catatan lengkap.
                                  </p>
                                )}
                                {!isOverdue && batchPhotos.length === 0 && (
                                  <p className="text-[10px] text-slate-600 italic">
                                    Foto dokumentasi dapat diupload setelah tanggal selesai dinas ({formatDateShort(firstTrip.tanggalSelesai)}).
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {batchStatus !== 'pending' && (
                            <div className="flex justify-end pt-1 gap-2">
                              <button
                                onClick={() => { setDocsModalTrip({ trip: batchTrips }); setDocModalActiveTab('surat_tugas'); }}
                                className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors flex items-center gap-1.5 border border-indigo-500/20 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Dokumen</span>
                              </button>
                            </div>
                          )}
                        </div>

                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </div>

    </div>

      {/* Edit Trip Modal */}
      {editingTrip && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-200">Ubah Ajuan Perjalanan Dinas</h3>
              </div>
              <button onClick={() => setEditingTrip(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors border-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Mulai</label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={editingTrip.tanggalMulai}
                  onChange={(e) => setEditingTrip({ ...editingTrip, tanggalMulai: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tanggal Selesai</label>
                <input
                  type="date"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={editingTrip.tanggalSelesai || editingTrip.tanggalMulai}
                  onChange={(e) => setEditingTrip({ ...editingTrip, tanggalSelesai: e.target.value })}
                />
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-400/90 leading-relaxed">
                  Durasi hari akan dihitung ulang secara otomatis berdasarkan selisih tanggal mulai dan selesai.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/50">
              <button
                onClick={() => setEditingTrip(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const sDate = new Date(editingTrip.tanggalMulai);
                  const eDate = new Date(editingTrip.tanggalSelesai || editingTrip.tanggalMulai);
                  const diffMs = eDate.getTime() - sDate.getTime();
                  const duration = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

                  if (editingTrip.isBatch && editingTrip.batchTrips) {
                    const updatedTrips = editingTrip.batchTrips.map(t => ({
                      ...t,
                      tanggalMulai: editingTrip.tanggalMulai,
                      tanggalSelesai: editingTrip.tanggalSelesai,
                      durasiHari: duration,
                      statusPersetujuan: t.statusPersetujuan === 'rejected' ? 'pending' : t.statusPersetujuan,
                      approvedBySuperAdmin: t.statusPersetujuan === 'rejected' ? false : t.approvedBySuperAdmin,
                      approvedBy: t.statusPersetujuan === 'rejected' ? null : t.approvedBy,
                      approvedAt: t.statusPersetujuan === 'rejected' ? null : t.approvedAt
                    }));
                    onUpdateTripsBatch(updatedTrips);
                  } else {
                    onUpdateTrip({
                      ...editingTrip,
                      durasiHari: duration,
                      statusPersetujuan: editingTrip.statusPersetujuan === 'rejected' ? 'pending' : editingTrip.statusPersetujuan,
                      approvedBySuperAdmin: editingTrip.statusPersetujuan === 'rejected' ? false : editingTrip.approvedBySuperAdmin,
                      approvedBy: editingTrip.statusPersetujuan === 'rejected' ? null : editingTrip.approvedBy,
                      approvedAt: editingTrip.statusPersetujuan === 'rejected' ? null : editingTrip.approvedAt
                    });
                  }
                  window.showAlert('Ajuan perjalanan dinas berhasil diubah!');
                  setEditingTrip(null);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer border-0 shadow-lg shadow-indigo-500/20"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Input Catatan Penolakan Perjalanan Dinas */}
      {rejectingTripIds && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative select-none animate-scale-in">
            <h3 className="text-base font-extrabold text-white mb-2">
              Tolak Ajuan Perjalanan Dinas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Berikan alasan penolakan agar pelaksana mengetahui perbaikan apa saja yang harus dilakukan.
            </p>
            
            <textarea
              value={rejectTripNote}
              onChange={(e) => setRejectTripNote(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none font-['Outfit',sans-serif]"
              required
            />
            
            <div className="flex gap-2.5 w-full mt-4 justify-end">
              <button
                onClick={() => {
                  setRejectingTripIds(null);
                  setRejectTripNote('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border-0"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!rejectTripNote.trim()) {
                    window.showAlert('Alasan penolakan wajib diisi!');
                    return;
                  }
                  onRejectTripsBatch(rejectingTripIds, rejectTripNote);
                  setRejectingTripIds(null);
                  setRejectTripNote('');
                  window.showAlert('Batch perjalanan dinas ditolak.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-lg shadow-rose-650/10 border-0"
              >
                Tolak Perjalanan Dinas
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Input Catatan Pengembalian Perjalanan Dinas */}
      {returningTripBatch && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative select-none animate-scale-in">
            <h3 className="text-base font-extrabold text-white mb-2">
              Kembalikan Ajuan Perjalanan Dinas
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Berikan alasan pengembalian keputusan agar pelaksana mengetahui perbaikan apa saja yang harus dilakukan.
            </p>
            
            <textarea
              value={returnTripNote}
              onChange={(e) => setReturnTripNote(e.target.value)}
              placeholder="Masukkan alasan pengembalian keputusan..."
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none font-['Outfit',sans-serif]"
              required
            />
            
            <div className="flex gap-2.5 w-full mt-4 justify-end">
              <button
                onClick={() => {
                  setReturningTripBatch(null);
                  setReturnTripNote('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border-0"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!returnTripNote.trim()) {
                    window.showAlert('Alasan pengembalian wajib diisi!');
                    return;
                  }
                  const batchUpdates = returningTripBatch.map(t => ({ 
                    ...t, 
                    statusPersetujuan: 'pending', 
                    approvedBySuperAdmin: false, 
                    approvedBy: null, 
                    approvedAt: null,
                    catatanPersetujuan: returnTripNote
                  }));
                  onUpdateTripsBatch(batchUpdates);
                  setReturningTripBatch(null);
                  setReturnTripNote('');
                  window.showAlert('Status berhasil dikembalikan menjadi Menunggu Approval.');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-650 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-650/10 border-0"
              >
                Kembalikan Status
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
