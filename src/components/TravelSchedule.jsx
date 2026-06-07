import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, Clock, MapPin, Send, Plus, HelpCircle, X } from 'lucide-react';

export default function TravelSchedule({ 
  schools, 
  users, 
  activeUser, 
  settings, 
  onUpdateSettings,
  trips, 
  onAddTrip 
}) {
  // Let the user simulate the system date so they can test time-based triggers (e.g., September 2026)
  const simulatedDate = settings.simulatedToday || '2026-09-14';
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSchoolNpsn, setRecordingSchoolNpsn] = useState('');
  
  const [formData, setFormData] = useState({
    kunjunganKe: 1,
    tanggalMulai: simulatedDate,
    laporanHasil: ''
  });

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
    const monthsElapsed = getMonthsDifference(start, simulatedDate);

    // Kunjungan I trigger: progress >= 50% OR >= 3 months
    const triggerKunjungan1 = school.progres_fisik >= 50 || monthsElapsed >= 3;
    const reasonKunjungan1 = school.progres_fisik >= 50 
      ? `Progres fisik mencapai ${school.progres_fisik}% (Syarat >= 50%)`
      : `Usia proyek mencapai ${monthsElapsed} bulan (Syarat >= 3 Bulan)`;

    // Kunjungan II trigger: progress = 100% OR >= 6 months
    const triggerKunjungan2 = school.progres_fisik === 100 || monthsElapsed >= 6;
    const reasonKunjungan2 = school.progres_fisik === 100
      ? 'Progres fisik mencapai 100%'
      : `Usia proyek mencapai ${monthsElapsed} bulan (Syarat >= 6 Bulan)`;

    return {
      triggerKunjungan1,
      reasonKunjungan1,
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

  const handleOpenRecordModal = (schoolNpsn, visitNum) => {
    setRecordingSchoolNpsn(schoolNpsn);
    setFormData({
      kunjunganKe: visitNum,
      tanggalMulai: simulatedDate,
      laporanHasil: ''
    });
    setIsRecording(true);
  };

  const handleRecordSubmit = (e) => {
    e.preventDefault();
    if (!formData.laporanHasil.trim()) return alert('Silakan masukkan laporan hasil kunjungan');

    const duration = isFasilitator ? 5 : 4;
    const startDate = new Date(formData.tanggalMulai);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (duration - 1)); // (e.g. Start 10 + 4 days = End 14 -> 5 days)

    const targetSchool = schools.find(s => s.npsn === recordingSchoolNpsn);

    const newTrip = {
      id: `trip-${Date.now()}`,
      sekolahId: recordingSchoolNpsn,
      userId: activeUser.id,
      userRoleTim: activeUser.jabatanTim,
      kunjunganKe: Number(formData.kunjunganKe),
      tanggalMulai: formData.tanggalMulai,
      tanggalSelesai: endDate.toISOString().split('T')[0],
      durasiHari: duration,
      statusPekerjaanSaatKunjungan: targetSchool ? targetSchool.progres_fisik : 0,
      laporanHasil: formData.laporanHasil
    };

    onAddTrip(newTrip);
    alert('Laporan Perjalanan Dinas berhasil disimpan!');
    setIsRecording(false);
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
      
      const facKunjungan1Done = schoolTrips.some(t => t.userRoleTim === 'Fasilitator' && t.kunjunganKe === 1);
      const facKunjungan2Done = schoolTrips.some(t => t.userRoleTim === 'Fasilitator' && t.kunjunganKe === 2);
      
      const koorKunjungan1Done = schoolTrips.some(t => t.userRoleTim === 'Koordinator' && t.kunjunganKe === 1);
      const koorKunjungan2Done = schoolTrips.some(t => t.userRoleTim === 'Koordinator' && t.kunjunganKe === 2);

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
      
      {/* Simulation Tools */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">Simulasi Penjadwalan Waktu</h4>
            <p className="text-[10px] text-slate-500">Membantu pengujian sistem trigger dinas bulan ke-3 (Sept 2027) dan ke-6 (Des 2027).</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 w-full sm:w-auto">
          <span className="text-[10px] font-semibold uppercase text-slate-500 mr-2">Tanggal Simulasi Hari Ini:</span>
          <input
            type="date"
            value={simulatedDate}
            onChange={(e) => onUpdateSettings({ ...settings, simulatedToday: e.target.value })}
            className="bg-transparent border-0 text-slate-200 text-xs font-bold focus:outline-none"
          />
        </div>
      </div>

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
                <li>Kunjungan I: Progres $\ge 50\%$ ATAU Bulan ke-3 (Mulai {month3Date})</li>
                <li>Kunjungan II: Progres $100\%$ ATAU Bulan ke-6 (Mulai {month6Date})</li>
              </ul>
            </div>
            
            <div className="pt-3 border-t border-slate-800/80">
              <span className="block font-bold text-indigo-400">Ketentuan Koordinator (4 Hari)</span>
              <p className="mt-1">
                Supervising dinas dilakukan setelah:
              </p>
              <ul className="list-disc list-inside mt-1 pl-1 space-y-1">
                <li>Supervisi I: Progres sekolah $\ge 50\%$.</li>
                <li>Supervisi II: Progres sekolah mencapai $100\%$.</li>
                <li>Prioritas Kunjungan: Diutamakan pada sekolah bermasalah yang progresnya terhambat (&lt;50% / &lt;100%) meskipun Fasilitator sudah berkunjung.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Scheduler based on role */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* FASILITATOR SCHEDULER VIEW */}
          {isFasilitator && (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
              <h3 className="font-semibold text-slate-200 text-sm mb-4 border-b border-slate-800 pb-2">
                Jadwal Kunjungan Wajib Dampingan Saya
              </h3>

              {mySchools.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Anda belum mengklaim sekolah pendampingan. Silakan klaim sekolah terlebih dahulu di menu "Sekolah Saya".
                </p>
              ) : (
                <div className="space-y-4">
                  {mySchools.map((school) => {
                    const schoolTrips = getSchoolTrips(school.npsn);
                    const triggers = getSchoolTriggers(school);
                    
                    const trip1Done = schoolTrips.some(t => t.kunjunganKe === 1 && t.userRoleTim === 'Fasilitator');
                    const trip2Done = schoolTrips.some(t => t.kunjunganKe === 2 && t.userRoleTim === 'Fasilitator');

                    return (
                      <div key={school.npsn} className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold tracking-wider">NPSN {school.npsn}</span>
                          <h4 className="font-bold text-slate-200 text-sm mt-0.5">{school.nama_sekolah}</h4>
                          <div className="flex gap-4 mt-2 text-xs text-slate-400">
                            <span>Kab: <strong>{school.kabupaten}</strong></span>
                            <span>Progres: <strong className="text-emerald-400">{school.progres_fisik}%</strong></span>
                          </div>
                        </div>

                        {/* Control buttons per check-point */}
                        <div className="flex flex-col gap-2 w-full md:w-auto">
                          
                          {/* Checkpoint I */}
                          <div className="flex items-center justify-between md:justify-end gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kunjungan I</span>
                            {trip1Done ? (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Dinas Terlaksana
                              </span>
                            ) : triggers.triggerKunjungan1 ? (
                              <button
                                onClick={() => handleOpenRecordModal(school.npsn, 1)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                              >
                                Wajib Dinas (5 Hari)
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-medium italic">Belum Waktunya</span>
                            )}
                          </div>

                          {/* Checkpoint II */}
                          <div className="flex items-center justify-between md:justify-end gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-850">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kunjungan II</span>
                            {trip2Done ? (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Dinas Terlaksana
                              </span>
                            ) : triggers.triggerKunjungan2 ? (
                              <button
                                onClick={() => handleOpenRecordModal(school.npsn, 2)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                              >
                                Wajib Dinas (5 Hari)
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-medium italic">Belum Waktunya</span>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                          <button
                            onClick={() => handleOpenRecordModal(school.npsn, targetVisit)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isHighPriority 
                                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/10' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" /> Catat Dinas (4 Hari)
                          </button>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Modal: Catat Perjalanan Dinas */}
      {isRecording && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-slate-100 text-lg">Catat Laporan Perjalanan Dinas</h3>
              <button
                onClick={() => setIsRecording(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-3 text-xs text-slate-400">
                Sistem akan otomatis menghitung durasi dinas selama <strong>{isFasilitator ? '5 hari' : '4 hari'} kerja</strong> sejak tanggal keberangkatan.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Kunjungan Ke
                  </label>
                  <input
                    type="text"
                    value={`Kunjungan Ke-${formData.kunjunganKe}`}
                    disabled
                    className="w-full bg-slate-950/50 border border-slate-850 rounded-xl px-4 py-2 text-sm text-slate-500 focus:outline-none cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Tanggal Mulai Dinas
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalMulai}
                    onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Laporan Hasil Kunjungan Lapangan
                </label>
                <textarea
                  value={formData.laporanHasil}
                  onChange={(e) => setFormData({ ...formData, laporanHasil: e.target.value })}
                  placeholder="Ceritakan temuan masalah, progres pekerjaan, koordinasi kepala sekolah, dll..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors h-28 resize-none"
                  required
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsRecording(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <Send className="w-4 h-4" /> Kirim Laporan Dinas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
