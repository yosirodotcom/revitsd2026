import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, AlertCircle, CheckCircle, Clock, MapPin, Send, Plus, HelpCircle, X, ChevronDown, ChevronUp, Pencil, Save, Users, Eye, Trash2, FileText, Download, Upload } from 'lucide-react';

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
  onAddTripDoc,
  onDeleteTripDoc
}) {
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayDate = getTodayDateStr();

  const [collectiveStart, setCollectiveStart] = useState('');
  const [collectiveEnd, setCollectiveEnd] = useState('');
  const [collectiveType, setCollectiveType] = useState(1); // 1 or 2
  const [tripDates, setTripDates] = useState({});
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);
  const [selectedSchoolNpsns, setSelectedSchoolNpsns] = useState([]);
  const [expandedBatches, setExpandedBatches] = useState({});
  const [editingTrip, setEditingTrip] = useState(null);
  const [docsModalTrip, setDocsModalTrip] = useState(null);

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

  // Auto-select eligible schools when modal opens or collectiveType changes
  useEffect(() => {
    if (showCollectiveModal) {
      const eligible = mySchools.filter(school => {
        const triggers = getSchoolTriggers(school);
        const alreadyScheduled = hasSchoolTrip(school.npsn, collectiveType, activeUser.id);
        const isEligible = collectiveType === 1 ? triggers.triggerKunjungan1 : triggers.triggerKunjungan2;
        return isEligible && !alreadyScheduled;
      });
      setSelectedSchoolNpsns(eligible.map(s => s.npsn));
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
  const mySchools = isFasilitator 
    ? schools.filter((s) => s.fasilitatorId === activeUser.id)
    : isKoordinator
    ? schools.filter((s) => s.fasilitatorId) // Koordinator sees all assigned schools
    : schools;

  const handleSaveCollectiveTrip = () => {
    const selectedSchools = mySchools.filter(school => selectedSchoolNpsns.includes(school.npsn));

    if (selectedSchools.length === 0) {
      window.showAlert(`Silakan pilih minimal satu sekolah dampingan untuk dijadwalkan.`);
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

  return (
    <>
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Main Content - Single Column Layout */}
      <div className="space-y-6">
        
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

      {/* Trip Documents Modal */}
      {docsModalTrip && createPortal(
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-200">Dokumen Perjalanan Dinas</h3>
              </div>
              <button onClick={() => setDocsModalTrip(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors border-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Trip Info */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-sm font-semibold text-slate-200">
                  {Array.isArray(docsModalTrip) 
                    ? `Kunjungan Kolektif (${docsModalTrip.length} Sekolah)` 
                    : schools.find(s => String(s.npsn) === String(docsModalTrip.sekolahId))?.nama_sekolah || `NPSN ${docsModalTrip.sekolahId}`}
                </span>
                <span className="text-xs text-slate-400">
                  Kunjungan ke-{Array.isArray(docsModalTrip) ? docsModalTrip[0].kunjunganKe : docsModalTrip.kunjunganKe} ({formatDateShort(Array.isArray(docsModalTrip) ? docsModalTrip[0].tanggalMulai : docsModalTrip.tanggalMulai)} - {formatDateShort(Array.isArray(docsModalTrip) ? docsModalTrip[0].tanggalSelesai : docsModalTrip.tanggalSelesai)})
                </span>
              </div>

              {/* Upload Input for Super Admin */}
              {isSuperAdmin && (
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <label className="text-xs font-semibold text-indigo-300">Unggah Dokumen Baru (SPPD / Surat Tugas)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="block w-full text-xs text-slate-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-xs file:font-semibold
                      file:bg-indigo-500/20 file:text-indigo-400
                      hover:file:bg-indigo-500/30 file:cursor-pointer file:transition-colors"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      
                      // Max 5MB
                      if (file.size > 5 * 1024 * 1024) {
                        window.showAlert('Ukuran file maksimal 5MB.');
                        e.target.value = '';
                        return;
                      }

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const base64Data = event.target.result;
                        const targetTripId = Array.isArray(docsModalTrip) ? docsModalTrip[0].id : docsModalTrip.id;
                        onAddTripDoc({
                          tripId: targetTripId,
                          name: file.name,
                          fileData: base64Data,
                          uploadedBy: activeUser.id,
                          uploadedAt: new Date().toISOString()
                        });
                        e.target.value = '';
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <p className="text-[10px] text-slate-500">Format: PDF, JPG, PNG. Maks: 5MB.</p>
                </div>
              )}

              {/* Document List */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">Daftar Dokumen Terlampir</label>
                {tripDocs.filter(d => d.tripId === (Array.isArray(docsModalTrip) ? docsModalTrip[0].id : docsModalTrip.id)).length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                    Belum ada dokumen terlampir.
                  </p>
                ) : (
                  tripDocs.filter(d => d.tripId === (Array.isArray(docsModalTrip) ? docsModalTrip[0].id : docsModalTrip.id)).map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center shrink-0 border border-slate-800">
                          <FileText className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">Diunggah pada {formatDateShort(doc.uploadedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <a
                          href={doc.fileData}
                          download={doc.name}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
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
                  ))
                )}
              </div>
            </div>
          </div>
        </div>,
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
                        <p className="text-[10px] text-slate-500 mt-0.5">Tentukan tanggal perjalanan dinas sekaligus untuk sebagian atau seluruh sekolah dampingan Anda.</p>
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
                        Atur Jadwal Kolektif
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
                        Tentukan tanggal perjalanan dinas satu kali langsung untuk seluruh sekolah dampingan Anda.
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
                          <p className="text-xs text-slate-500 italic text-center py-4">Belum ada sekolah dampingan terdaftar.</p>
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
                            Simpan Rencana Kunjungan
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
                    Daftar Sekolah Dampingan & Status Dampingan
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Informasi kelayakan kunjungan dinas ke sekolah berdasarkan progres fisik dan linimasa proyek.
                  </p>
                </div>

                {mySchools.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-10 select-none">
                    Anda belum mengklaim sekolah pendampingan.
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
                  Tidak ada jadwal kunjungan aktif. Sekolah dampingan belum mencapai target progres.
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
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              📅 {formatDateShort(firstTrip.tanggalMulai)} s/d {formatDateShort(firstTrip.tanggalSelesai)} • {firstTrip.durasiHari} hari • {batchTrips.length} sekolah
                            </p>
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await window.showConfirm('Batalkan keputusan persetujuan dan kembalikan batch ini ke status Menunggu Approval?')) {
                                    const batchUpdates = batchTrips.map(t => ({ ...t, statusPersetujuan: 'pending', approvedBySuperAdmin: false, approvedBy: null, approvedAt: null }));
                                    onUpdateTripsBatch(batchUpdates);
                                    window.showAlert('Status berhasil dikembalikan menjadi Menunggu Approval.');
                                  }
                                }}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/20 cursor-pointer"
                                title="Batalkan Keputusan"
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await window.showConfirm('Batalkan keputusan penolakan dan kembalikan batch ini ke status Menunggu Approval?')) {
                                    const batchUpdates = batchTrips.map(t => ({ ...t, statusPersetujuan: 'pending', approvedBySuperAdmin: false, approvedBy: null, approvedAt: null }));
                                    onUpdateTripsBatch(batchUpdates);
                                    window.showAlert('Status berhasil dikembalikan menjadi Menunggu Approval.');
                                  }
                                }}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors border border-amber-500/20 cursor-pointer"
                                title="Batalkan Keputusan"
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
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await window.showConfirm(`Tolak ${pendingIds.length} perjalanan dinas dalam batch ini?`)) {
                                    onRejectTripsBatch(pendingIds);
                                    window.showAlert('Batch perjalanan dinas ditolak.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border-0"
                              >
                                <X className="w-3 h-3" /> Tolak
                              </button>
                              </>
                            )}
                            
                            {/* Batch Level Document Button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); setDocsModalTrip(batchTrips); }}
                              className="px-2 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-500/20 cursor-pointer ml-2"
                              title="Kelola Dokumen Perjalanan (Surat Tugas)"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold">Surat Tugas</span>
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
                          
                          <div className="bg-slate-950/50 rounded-xl p-3.5 border border-slate-800/50 relative z-10">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              Lokasi Kunjungan ({batchTrips.length} Sekolah)
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {schoolsArr.map((schoolName, i) => {
                                const colorClass = badgeColors[i % badgeColors.length];
                                return (
                                  <span key={i} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${colorClass} shadow-sm backdrop-blur-sm transition-transform hover:scale-105 cursor-default`}>
                                    {schoolName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/50 mt-2">
                            {batchStatus === 'approved' ? (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Disetujui {firstTrip.approvedBy ? `(${firstTrip.approvedBy})` : ''}
                              </span>
                            ) : batchStatus === 'rejected' ? (
                              <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                                <X className="w-3 h-3" /> Ditolak
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 w-full justify-between flex-wrap">
                                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 animate-pulse">
                                  <Clock className="w-3 h-3" /> Menunggu Approval
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setDocsModalTrip(batchTrips)}
                                    className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors cursor-pointer border border-indigo-500/20 flex items-center gap-1"
                                    title="Lihat Dokumen"
                                  >
                                    <FileText className="w-3 h-3" />
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
                                      if (await window.showConfirm(`Apakah Anda yakin ingin membatalkan ajuan perjalanan dinas untuk ${batchTrips.length} sekolah ini?`)) {
                                        onDeleteTripsBatch(batchTrips.map(t => t.id));
                                        window.showAlert('Ajuan berhasil dibatalkan.');
                                      }
                                    }}
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer border border-rose-500/20"
                                    title="Batalkan Ajuan"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          {batchStatus !== 'pending' && (
                            <div className="flex justify-end pt-1">
                              <button
                                onClick={() => setDocsModalTrip(batchTrips)}
                                className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors flex items-center gap-1.5 border border-indigo-500/20 cursor-pointer"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Lihat Surat Tugas</span>
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
                      durasiHari: duration
                    }));
                    onUpdateTripsBatch(updatedTrips);
                  } else {
                    onUpdateTrip({
                      ...editingTrip,
                      durasiHari: duration
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
    </>
  );
}
