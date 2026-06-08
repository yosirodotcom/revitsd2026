import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock, MapPin, Send, Plus, HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function TravelSchedule({ 
  schools, 
  users, 
  activeUser, 
  settings, 
  onUpdateSettings,
  trips, 
  onAddTrip,
  onApproveTrip,
  onRejectTrip
}) {
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayDate = getTodayDateStr();

  const [collectiveStart, setCollectiveStart] = useState(todayDate);
  const [collectiveEnd, setCollectiveEnd] = useState('');
  const [collectiveType, setCollectiveType] = useState(1); // 1 or 2
  const [tripDates, setTripDates] = useState({});

  useEffect(() => {
    setCollectiveStart(todayDate);
    if (todayDate) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() + 4);
      setCollectiveEnd(d.toISOString().split('T')[0]);
    }
  }, [todayDate]);

  const handleStartDateChange = (val) => {
    setCollectiveStart(val);
    if (val) {
      const d = new Date(val);
      d.setDate(d.getDate() + 4);
      setCollectiveEnd(d.toISOString().split('T')[0]);
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

  // Get active schools for calculation
  const mySchools = isFasilitator 
    ? schools.filter((s) => s.fasilitatorId === activeUser.id)
    : isKoordinator
    ? schools.filter((s) => s.fasilitatorId) // Koordinator sees all assigned schools
    : schools;

  const handleSaveCollectiveTrip = () => {
    const eligibleSchools = mySchools.filter(school => {
      const schoolTrips = getSchoolTrips(school.npsn);
      const triggers = getSchoolTriggers(school);
      if (collectiveType === 1) {
        const trip1Done = schoolTrips.some(t => t.kunjunganKe === 1 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
        return triggers.triggerKunjungan1 && !trip1Done;
      } else {
        const trip2Done = schoolTrips.some(t => t.kunjunganKe === 2 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
        return triggers.triggerKunjungan2 && !trip2Done;
      }
    });

    if (eligibleSchools.length === 0) {
      window.showAlert(`Tidak ada sekolah dampingan yang siap/memenuhi syarat untuk Kunjungan ke-${collectiveType} saat ini.`);
      return;
    }

    const sDate = new Date(collectiveStart);
    const eDate = new Date(collectiveEnd || collectiveStart);
    const diffMs = eDate.getTime() - sDate.getTime();
    const duration = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const newTrips = eligibleSchools.map(school => ({
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
    window.showAlert(`Jadwal Kunjungan Ke-${collectiveType} Kolektif berhasil disimpan untuk ${eligibleSchools.length} sekolah!`);
  };

  const handleSaveTripInline = (schoolNpsn, visitNum) => {
    const tripDate = tripDates[`${schoolNpsn}-${visitNum}`] || todayDate;
    
    const duration = activeUser.jabatanTim === 'Fasilitator' ? 5 : 4;
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
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Main Grid content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Rules summary */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 select-none h-fit">
          <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-indigo-400" /> Aturan Kunjungan Dinas
          </h3>
          <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
            <div>
              <span className="block font-bold text-indigo-400">Ketentuan Fasilitator (5 Hari)</span>
              <p className="mt-1">
                Kunjungan wajib dilakukan pada 2 checkpoint utama:
              </p>
              <ul className="list-disc list-inside mt-1 pl-1 space-y-1">
                <li>Kunjungan I: Progres ≥ 50% ATAU Bulan ke-3 (Mulai {month3Date})</li>
                <li>Kunjungan II: Progres 100% ATAU Bulan ke-6 (Mulai {month6Date})</li>
              </ul>
            </div>
            
            {!isFasilitator && (
              <div className="pt-3 border-t border-slate-800/80">
                <span className="block font-bold text-indigo-400">Ketentuan Koordinator (4 Hari)</span>
                <p className="mt-1">
                  Supervising dinas dilakukan setelah:
                </p>
                <ul className="list-disc list-inside mt-1 pl-1 space-y-1">
                  <li>Supervisi I: Progres sekolah ≥ 50%.</li>
                  <li>Supervisi II: Progres sekolah mencapai 100%.</li>
                  <li>Prioritas Kunjungan: Diutamakan pada sekolah bermasalah yang progresnya terhambat (&lt;50% / &lt;100%) meskipun Fasilitator sudah berkunjung.</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Scheduler based on role */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FASILITATOR SCHEDULER VIEW */}
          {isFasilitator && (
            <div className="space-y-6">
              
              {/* Collective Scheduling Panel */}
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6 select-none">
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">
                    Atur Jadwal Kunjungan Kolektif (Fasilitator)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Tentukan tanggal perjalanan dinas satu kali langsung untuk seluruh sekolah dampingan Anda.
                  </p>
                </div>

                {/* Tipe Kunjungan Selector */}
                <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 border border-slate-850 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCollectiveType(1)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      collectiveType === 1
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    Kunjungan I (Progres ≥ 50% / ≥ 3 Bulan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectiveType(2)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      collectiveType === 2
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    Kunjungan II (Progres 100% / ≥ 6 Bulan)
                  </button>
                </div>

                {/* Date Inputs Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-slate-950/40 border border-slate-850/50 p-4 rounded-xl">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Tanggal Keberangkatan</label>
                    <input
                      type="date"
                      value={collectiveStart}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
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
                      className="w-full bg-slate-950 border border-slate-855 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    {(() => {
                      const toScheduleCount = mySchools.filter(school => {
                        const schoolTrips = getSchoolTrips(school.npsn);
                        const triggers = getSchoolTriggers(school);
                        if (collectiveType === 1) {
                          const trip1Done = schoolTrips.some(t => t.kunjunganKe === 1 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                          return triggers.triggerKunjungan1 && !trip1Done;
                        } else {
                          const trip2Done = schoolTrips.some(t => t.kunjunganKe === 2 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                          return triggers.triggerKunjungan2 && !trip2Done;
                        }
                      }).length;

                      const isDateValid = collectiveStart && collectiveEnd && new Date(collectiveEnd) >= new Date(collectiveStart);
                      const isButtonEnabled = isDateValid && toScheduleCount > 0;

                      return (
                        <button
                          onClick={handleSaveCollectiveTrip}
                          disabled={!isButtonEnabled}
                          className={`w-full py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            isButtonEnabled
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-lg shadow-emerald-600/10'
                              : 'bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-800'
                          }`}
                        >
                          <Calendar className="w-4 h-4" />
                          Simpan Rencana Kunjungan
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Affected Schools */}
                <div className="bg-slate-950/60 border border-slate-855 p-4 rounded-xl">
                  <span className="block text-[10px] font-bold text-slate-400 mb-2.5 uppercase tracking-wide">
                  Sekolah Dampingan yang Siap Dijadwalkan untuk Kunjungan {collectiveType === 1 ? 'I' : 'II'} ({
                      mySchools.filter(school => {
                        const schoolTrips = getSchoolTrips(school.npsn);
                        const triggers = getSchoolTriggers(school);
                        if (collectiveType === 1) {
                          const trip1Done = schoolTrips.some(t => t.kunjunganKe === 1 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                          return triggers.triggerKunjungan1 && !trip1Done;
                        } else {
                          const trip2Done = schoolTrips.some(t => t.kunjunganKe === 2 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                          return triggers.triggerKunjungan2 && !trip2Done;
                        }
                      }).length
                    })
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {(() => {
                      const toSchedule = mySchools.filter(school => {
                        const schoolTrips = getSchoolTrips(school.npsn);
                        const triggers = getSchoolTriggers(school);
                        if (collectiveType === 1) {
                          const trip1Done = schoolTrips.some(t => t.kunjunganKe === 1 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                          return triggers.triggerKunjungan1 && !trip1Done;
                        } else {
                          const trip2Done = schoolTrips.some(t => t.kunjunganKe === 2 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                          return triggers.triggerKunjungan2 && !trip2Done;
                        }
                      });

                      if (toSchedule.length === 0) {
                        return (
                          <p className="text-[11px] text-slate-500 italic py-1">
                            Tidak ada sekolah dampingan yang memenuhi syarat dan belum dijadwalkan untuk Kunjungan {collectiveType === 1 ? 'I' : 'II'} saat ini.
                          </p>
                        );
                      }

                      return toSchedule.map(school => (
                        <div key={school.npsn} className="flex justify-between items-center bg-slate-900/40 border border-slate-850/50 px-3 py-1.5 rounded-lg text-xs">
                          <div>
                            <span className="font-semibold text-slate-350">{school.nama_sekolah}</span>
                            <span className="text-[9px] text-slate-500 block">Progres: {school.progres_fisik}%</span>
                          </div>
                          <span className="text-[10px] text-indigo-400 font-semibold">Siap Dijadwalkan</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Schools Status Details Panel */}
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-slate-200 text-sm border-b border-slate-850 pb-2 select-none">
                  Daftar Sekolah Dampingan & Status Dampingan
                </h3>

                {mySchools.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    Anda belum mengklaim sekolah pendampingan.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {mySchools.map((school) => {
                      const schoolTrips = getSchoolTrips(school.npsn);
                      const triggers = getSchoolTriggers(school);
                      
                      const trip1 = schoolTrips.find(t => t.kunjunganKe === 1 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                      const trip2 = schoolTrips.find(t => t.kunjunganKe === 2 && t.userRoleTim === 'Fasilitator' && t.statusPersetujuan !== 'rejected');
                      
                      const trip1Done = trip1 && (trip1.statusPersetujuan === 'approved' || trip1.statusPersetujuan === undefined);
                      const trip2Done = trip2 && (trip2.statusPersetujuan === 'approved' || trip2.statusPersetujuan === undefined);
                      const trip1Pending = trip1 && trip1.statusPersetujuan === 'pending';
                      const trip2Pending = trip2 && trip2.statusPersetujuan === 'pending';

                      return (
                        <div key={school.npsn} className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl space-y-4">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-900 pb-3">
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold tracking-wider">NPSN {school.npsn}</span>
                              <h4 className="font-bold text-slate-200 text-sm mt-0.5">{school.nama_sekolah}</h4>
                              <div className="flex gap-4 mt-1.5 text-xs text-slate-400">
                                <span>Kabupaten: <strong>{school.kabupaten}</strong></span>
                                <span>Kecamatan: <strong>{school.kecamatan || '-'}</strong></span>
                                <span>Desa: <strong>{school.desa || '-'}</strong></span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl select-none">
                              <span className="text-xs text-slate-400">Progres Fisik:</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-emerald-400">{school.progres_fisik}%</span>
                                <div className="w-16 h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${school.progres_fisik}%` }}></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status Checkpoints */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Checkpoint 1: Kunjungan I */}
                            <div className="bg-slate-900/20 border border-slate-850/80 p-3.5 rounded-xl space-y-3">
                              <div className="flex justify-between items-center select-none">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-350">Kunjungan I</span>
                                {trip1Done ? (
                                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Terlaksana
                                  </span>
                                ) : trip1Pending ? (
                                  <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3" /> Menunggu Approval
                                  </span>
                                ) : triggers.triggerKunjungan1 ? (
                                  <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Siap Dijadwalkan
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                                    Belum Waktunya
                                  </span>
                                )}
                              </div>

                              {trip1Done ? (
                                <div className="bg-slate-950/40 border border-slate-850/50 p-2.5 rounded-lg text-[11px] text-slate-400 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Tanggal Dinas:</span>
                                    <span className="font-semibold text-slate-200">{trip1.tanggalMulai} s/d {trip1.tanggalSelesai}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Durasi:</span>
                                    <span className="font-semibold text-slate-200">{trip1.durasiHari} Hari Kerja</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 pt-1">
                                  <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-1 select-none">Persyaratan Kunjungan I:</span>
                                  <div className="flex flex-col gap-1 text-[10px] text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                      {triggers.req1_progress ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                                      )}
                                      <span className={triggers.req1_progress ? 'text-slate-200 font-medium' : ''}>Progres ≥ 50% (Saat ini: {school.progres_fisik}%)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {triggers.req1_time ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                                      )}
                                      <span className={triggers.req1_time ? 'text-slate-200 font-medium' : ''}>Umur Proyek ≥ 3 Bulan (Saat ini: {triggers.monthsElapsed} Bulan)</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Checkpoint 2: Kunjungan II */}
                            <div className="bg-slate-900/20 border border-slate-850/80 p-3.5 rounded-xl space-y-3">
                              <div className="flex justify-between items-center select-none">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-350">Kunjungan II</span>
                                {trip2Done ? (
                                  <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Terlaksana
                                  </span>
                                ) : trip2Pending ? (
                                  <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 animate-pulse">
                                    <Clock className="w-3 h-3" /> Menunggu Approval
                                  </span>
                                ) : triggers.triggerKunjungan2 ? (
                                  <span className="text-[9px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Siap Dijadwalkan
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                                    Belum Waktunya
                                  </span>
                                )}
                              </div>

                              {trip2Done ? (
                                <div className="bg-slate-950/40 border border-slate-850/50 p-2.5 rounded-lg text-[11px] text-slate-400 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Tanggal Dinas:</span>
                                    <span className="font-semibold text-slate-200">{trip2.tanggalMulai} s/d {trip2.tanggalSelesai}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Durasi:</span>
                                    <span className="font-semibold text-slate-200">{trip2.durasiHari} Hari Kerja</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1.5 pt-1">
                                  <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-wide mb-1 select-none">Persyaratan Kunjungan II:</span>
                                  <div className="flex flex-col gap-1 text-[10px] text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                      {triggers.req2_progress ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                                      )}
                                      <span className={triggers.req2_progress ? 'text-slate-200 font-medium' : ''}>Progres = 100% (Saat ini: {school.progres_fisik}%)</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {triggers.req2_time ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                      ) : (
                                        <Clock className="w-3.5 h-3.5 text-slate-650 shrink-0" />
                                      )}
                                      <span className={triggers.req2_time ? 'text-slate-200 font-medium' : ''}>Umur Proyek ≥ 6 Bulan (Saat ini: {triggers.monthsElapsed} Bulan)</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

          {/* Triplog History */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-200 text-sm mb-4 border-b border-slate-800 pb-2">
              Riwayat Perjalanan Dinas Terdaftar
            </h3>
            {trips.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">
                Belum ada riwayat dinas tercatat dalam database lokal.
              </p>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => {
                  const targetSchool = schools.find(s => s.npsn === trip.sekolahId);
                  
                  return (
                    <div key={trip.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                      <div className="flex justify-between items-start text-xs flex-wrap gap-2">
                        <div>
                          <span className="font-bold text-slate-200">{targetSchool ? targetSchool.nama_sekolah : `NPSN ${trip.sekolahId}`}</span>
                          <span className="text-[10px] text-slate-500 block">Dinas: {trip.userRoleTim} (Kunjungan ke-{trip.kunjunganKe})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-indigo-400 block font-semibold">{trip.tanggalMulai} s/d {trip.tanggalSelesai}</span>
                          <span className="text-[9px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400 inline-block mt-0.5">
                            {trip.durasiHari} Hari Kerja
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 border border-slate-900 rounded-lg italic">
                        " {trip.laporanHasil} "
                      </p>

                      {/* Approval Status Badge & Super Admin Action Buttons */}
                      <div className="flex items-center justify-between border-t border-slate-900/40 pt-2.5 mt-2">
                        <div className="flex items-center gap-1.5">
                          {trip.statusPersetujuan === 'approved' || trip.statusPersetujuan === undefined ? (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Disetujui Super Admin {trip.approvedBy ? `(${trip.approvedBy})` : ''}
                            </span>
                          ) : trip.statusPersetujuan === 'rejected' ? (
                            <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                              <X className="w-3 h-3" /> Ditolak oleh Super Admin
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-pulse" /> Menunggu Approval Super Admin
                            </span>
                          )}
                        </div>

                        {/* Admin Action Buttons */}
                        {activeUser.jabatanTim === 'Super Admin' && trip.statusPersetujuan === 'pending' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                onApproveTrip(trip.id, activeUser.nama);
                                window.showAlert('Perjalanan dinas berhasil disetujui!');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border-0"
                            >
                              <CheckCircle className="w-3 h-3" /> Setujui
                            </button>
                            <button
                              onClick={async () => {
                                if (await window.showConfirm('Tolak pengajuan perjalanan dinas ini?')) {
                                  onRejectTrip(trip.id);
                                  window.showAlert('Perjalanan dinas ditolak.');
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border-0"
                            >
                              <X className="w-3 h-3" /> Tolak
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

        </div>
      </div>

    </div>
  );
}
