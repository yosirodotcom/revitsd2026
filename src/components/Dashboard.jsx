import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Info, 
  Clock, 
  CheckCircle, 
  School, 
  UserCheck, 
  TrendingUp, 
  FileText, 
  ArrowRight, 
  MapPin, 
  AlertCircle, 
  CheckSquare, 
  Play
} from 'lucide-react';

export default function Dashboard({ 
  activeUser, 
  settings, 
  onUpdateSettings,
  schools = [],
  tasks = [],
  reports = [],
  logs = [],
  users = [],
  trips = [],
  onApproveTrip,
  onRejectTrip
}) {
  const [dates, setDates] = useState({
    projectStartDate: settings.projectStartDate || '2026-06-12',
    projectEndDate: settings.projectEndDate || '2026-12-12',
    simulatedToday: settings.simulatedToday || '2026-09-14',
  });

  // Sync state if settings change (e.g. from TravelSchedule or another tab)
  useEffect(() => {
    setDates({
      projectStartDate: settings.projectStartDate || '2026-06-12',
      projectEndDate: settings.projectEndDate || '2026-12-12',
      simulatedToday: settings.simulatedToday || '2026-09-14',
    });
  }, [settings]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings(dates);
    alert('Konfigurasi linimasa global berhasil disimpan!');
  };

  const getRoleDescription = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'Anda memegang kendali penuh atas sistem ini. Anda dapat mengelola tim pelaksana, memantau seluruh progres sekolah dan perjalanan dinas, serta mengonfigurasi pengaturan proyek global.';
      case 'Ketua Tim':
        return 'Anda bertanggung jawab atas koordinasi umum, penyusunan linimasa utama, pengesahan laporan, serta pengawasan kinerja seluruh tim pelaksana swakelola.';
      case 'Koordinator':
        return 'Tugas utama Anda adalah mensupervisi kinerja para fasilitator lapangan di wilayah kerja Anda, menyetujui laporan fisik dan verifikasi 50% & 100%, serta memecahkan kendala teknis.';
      case 'Fasilitator':
        return 'Anda adalah garda terdepan pendampingan sekolah dasar. Anda memantau progres konstruksi di lapangan secara mingguan, berkunjung pada progres 50% & 100%, serta melengkapi laporan berkala.';
      case 'Tenaga Administrasi':
        return 'Anda mengelola dokumentasi administrasi, memantau rekapitulasi pengeluaran (ATK, Perjalanan Dinas, Honor), serta melakukan pembayaran honor sesuai kelayakan progres laporan.';
      default:
        return 'Anggota tim pelaksana swakelola program revitalisasi sekolah dasar.';
    }
  };

  // Format Date to Local ID
  const formatLocalDate = (dateStr) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('id-ID', options);
    } catch {
      return dateStr;
    }
  };

  // 1. KPI Calculations & Filtering based on role
  const isFacilitator = activeUser?.jabatanTim === 'Fasilitator';

  // Filter based on role
  const displaySchools = isFacilitator 
    ? schools.filter(s => s.fasilitatorId === activeUser.id)
    : schools;

  const displaySchoolNpsns = displaySchools.map(s => s.npsn);

  const displayTasks = isFacilitator
    ? tasks.filter(t => displaySchoolNpsns.includes(t.schoolId))
    : tasks;

  const displayReports = isFacilitator
    ? reports.filter(r => displaySchoolNpsns.includes(r.schoolId))
    : reports;

  const displayLogs = isFacilitator
    ? logs.filter(l => displaySchoolNpsns.includes(l.schoolId))
    : logs;

  const totalSchoolsCount = displaySchools.length;

  let totalLabel = "Total Sekolah Binaan";
  let totalCount = schools.length;
  let totalSubtitle = "Sekolah Dasar Master";
  
  if (isFacilitator) {
    totalLabel = "Sekolah Binaan Anda";
    totalCount = displaySchools.length;
    totalSubtitle = "Sekolah dasar dampingan Anda";
  }

  let claimedLabel = "Sekolah Terdampingi";
  let claimedCount = schools.filter(s => s.fasilitatorId).length;
  let claimedPercentage = schools.length ? Math.round((claimedCount / schools.length) * 100) : 0;
  let claimedSubtitle = "Sudah diklaim Fasilitator";
  
  if (isFacilitator) {
    claimedLabel = "Sekolah Selesai (100%)";
    claimedCount = displaySchools.filter(s => s.progres_fisik === 100).length;
    claimedPercentage = totalSchoolsCount ? Math.round((claimedCount / totalSchoolsCount) * 100) : 0;
    claimedSubtitle = "Progres fisik mencapai 100%";
  }
  
  const totalProgress = displaySchools.reduce((acc, s) => acc + (s.progres_fisik || 0), 0);
  const avgProgress = displaySchools.length ? (totalProgress / displaySchools.length).toFixed(1) : '0.0';

  let avgLabel = "Rerata Progres Fisik";
  let avgSubtitle = "Dari semua sekolah dasar";
  if (isFacilitator) {
    avgLabel = "Rerata Progres Fisik Anda";
    avgSubtitle = "Rerata sekolah dampingan Anda";
  }

  const totalReportsUploaded = displayReports.length;
  let reportsLabel = "Laporan PDF Masuk";
  let reportsSubtitle = "Berkas laporan bulanan";
  if (isFacilitator) {
    reportsLabel = "Laporan Bulanan Anda";
    reportsSubtitle = "Berkas laporan bulanan Anda";
  }

  // 2. Timeline Elapsed Calculations
  const startMs = new Date(dates.projectStartDate).getTime();
  const endMs = new Date(dates.projectEndDate).getTime();
  const todayMs = new Date(dates.simulatedToday).getTime();
  
  const totalDuration = endMs - startMs;
  const elapsedDuration = todayMs - startMs;
  
  let timeProgress = 0;
  if (totalDuration > 0) {
    timeProgress = Math.min(100, Math.max(0, Math.round((elapsedDuration / totalDuration) * 100)));
  }

  const getMonthsDifference = (d1Str, d2Str) => {
    const date1 = new Date(d1Str);
    const date2 = new Date(d2Str);
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
  };
  const monthsElapsed = getMonthsDifference(dates.projectStartDate, dates.simulatedToday);

  // 3. Kabupaten breakdown calculations
  const kabGroups = {};
  displaySchools.forEach(school => {
    const kab = school.kabupaten || 'Lainnya';
    if (!kabGroups[kab]) {
      kabGroups[kab] = { name: kab, count: 0, totalProgress: 0 };
    }
    kabGroups[kab].count += 1;
    kabGroups[kab].totalProgress += (school.progres_fisik || 0);
  });
  
  const kabStats = Object.values(kabGroups).map(group => ({
    name: group.name,
    count: group.count,
    avgProgress: Math.round(group.totalProgress / group.count)
  })).sort((a, b) => b.avgProgress - a.avgProgress);

  // 4. Kanban statistics
  const taskTodo = displayTasks.filter(t => t.status === 'todo').length;
  const taskInProgress = displayTasks.filter(t => t.status === 'in_progress').length;
  const taskDone = displayTasks.filter(t => t.status === 'done').length;
  const totalTasks = displayTasks.length;
  const donePercentage = totalTasks ? Math.round((taskDone / totalTasks) * 100) : 0;

  // 6. Facilitator progress statistics
  const facilitatorStats = isFacilitator
    ? []
    : users
        .filter(u => u.jabatanTim === 'Fasilitator')
        .map(fac => {
          const facSchools = schools.filter(s => s.fasilitatorId === fac.id);
          const schoolCount = facSchools.length;
          const totalFacProgress = facSchools.reduce((acc, s) => acc + (s.progres_fisik || 0), 0);
          const avgFacProgress = schoolCount ? Math.round(totalFacProgress / schoolCount) : 0;
          
          return {
            id: fac.id,
            name: fac.nama,
            statusPegawai: fac.statusPegawai,
            schoolCount,
            avgProgress: avgFacProgress,
            schools: facSchools.map(s => ({ nama: s.nama_sekolah, progres: s.progres_fisik }))
          };
        })
        .sort((a, b) => b.avgProgress - a.avgProgress);

  // 5. Ranked School Progress
  const getFasilitatorName = (userId) => {
    if (!userId) return 'Belum ditugaskan';
    const user = users.find(u => u.id === userId);
    return user ? user.nama : 'Belum ditugaskan';
  };

  const sortedSchoolsByProgress = [...schools].sort(
    (a, b) => (b.progres_fisik || 0) - (a.progres_fisik || 0)
  );

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-3xl">
          <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 tracking-wider uppercase">
            Tahun Anggaran 2026
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight mt-4">
            {activeUser ? `Halo, ${activeUser.nama}!` : 'Selamat Datang di Portal Monitoring Revitalisasi SD 2026'}
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed mt-2 font-medium">
            {activeUser 
              ? getRoleDescription(activeUser.jabatanTim)
              : 'Sistem Informasi Swakelola Pemantauan Progres Fisik dan Keuangan Program Revitalisasi Sekolah Dasar. Silakan klik tombol "Masuk ke Sistem" di sudut kanan atas untuk melakukan pengelolaan data menggunakan akun simulasi.'}
          </p>
        </div>
      </div>

      {/* Super Admin Travel Approval Notifications */}
      {activeUser?.jabatanTim === 'Super Admin' && (() => {
        const pendingTrips = trips.filter(t => t.statusPersetujuan === 'pending');
        if (pendingTrips.length === 0) return null;

        return (
          <div className="bg-slate-900/40 border-2 border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                  Persetujuan Perjalanan Dinas Tertunda ({pendingTrips.length})
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Aksi Cepat Super Admin
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {pendingTrips.map(trip => {
                const targetSchool = schools.find(s => s.npsn === trip.sekolahId);
                const applicant = users.find(u => u.id === trip.userId);
                
                return (
                  <div key={trip.id} className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between gap-3 hover:border-slate-700 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500">Kunjungan ke-{trip.kunjunganKe}</span>
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                          {trip.userRoleTim}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-200 text-xs truncate">
                        {targetSchool ? targetSchool.nama_sekolah : `NPSN ${trip.sekolahId}`}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Diajukan oleh: <strong className="text-slate-300">{applicant ? applicant.nama : 'Anggota Tim'}</strong>
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        Tanggal: {trip.tanggalMulai} s/d {trip.tanggalSelesai} ({trip.durasiHari} Hari)
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-900/60 select-none">
                      <button
                        onClick={() => {
                          onApproveTrip(trip.id, activeUser.nama);
                          alert('Perjalanan dinas disetujui!');
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Tolak permohonan kunjungan dinas ini?')) {
                            onRejectTrip(trip.id);
                            alert('Perjalanan dinas ditolak.');
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-500/20"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Schools */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md hover:border-slate-700/80 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{totalLabel}</span>
            <span className="text-3xl font-extrabold text-slate-100 block">{totalCount}</span>
            <span className="text-xs text-slate-400 font-medium">{totalSubtitle}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <School className="w-6 h-6" />
          </div>
        </div>

        {/* Claimed Schools */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md hover:border-slate-700/80 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{claimedLabel}</span>
            <span className="text-3xl font-extrabold text-slate-100 block">{claimedCount} <span className="text-xs text-slate-400 font-normal">({claimedPercentage}%)</span></span>
            <span className="text-xs text-slate-400 font-medium">{claimedSubtitle}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Average Progress */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md hover:border-slate-700/80 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{avgLabel}</span>
            <span className="text-3xl font-extrabold text-emerald-400 block">{avgProgress}%</span>
            <span className="text-xs text-slate-400 font-medium">{avgSubtitle}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Reports */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md hover:border-slate-700/80 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{reportsLabel}</span>
            <span className="text-3xl font-extrabold text-slate-100 block">{totalReportsUploaded}</span>
            <span className="text-xs text-slate-400 font-medium">{reportsSubtitle}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid: Left (Stats + Regional), Right (Timeline settings / active user info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Project Timeline & Milestones Progress */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Linimasa Progres Waktu Proyek
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                Bulan ke-{monthsElapsed} dari 6 Bulan
              </span>
            </div>

            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-850">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-2">
                  <span>Waktu Berjalan (Simulasi)</span>
                  <span className="text-indigo-400 font-bold">{timeProgress}% dari Total Waktu</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
                
                {/* Timeline Dates Info */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/40 text-center">
                  <div className="text-left">
                    <span className="block text-[8px] uppercase font-bold text-slate-500">Mulai</span>
                    <span className="text-[11px] font-semibold text-slate-300">{formatLocalDate(dates.projectStartDate)}</span>
                  </div>
                  <div className="text-center bg-indigo-500/5 border border-indigo-500/10 rounded-xl px-2 py-1">
                    <span className="block text-[8px] uppercase font-bold text-indigo-400">Simulasi Hari Ini</span>
                    <span className="text-[11px] font-bold text-indigo-300">{formatLocalDate(dates.simulatedToday)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] uppercase font-bold text-slate-500">Target</span>
                    <span className="text-[11px] font-semibold text-slate-300">{formatLocalDate(dates.projectEndDate)}</span>
                  </div>
                </div>
              </div>

              {/* Informational Alerts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/30 border border-slate-850/60 rounded-2xl p-3 flex gap-2">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 block">Checkpoint Bulan Ke-3</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Supervising Koordinator ke-1 & minimal progres fisik 50% wajib tercapai.</p>
                  </div>
                </div>
                <div className="bg-slate-950/30 border border-slate-850/60 rounded-2xl p-3 flex gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 block">Checkpoint Bulan Ke-6</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">Penutupan pengerjaan fisik 100% dan laporan administrasi bulanan final.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Regional Progress by Kabupaten */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" /> Rata-Rata Progres Fisik per Kabupaten
            </h3>

            {kabStats.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">Data kabupaten belum tersedia.</p>
            ) : (
              <div className="space-y-4">
                {kabStats.map(stat => (
                  <div key={stat.name} className="space-y-1.5 bg-slate-950/20 border border-slate-850/40 rounded-2xl p-3.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-sm font-bold text-slate-200">{stat.name}</span>
                        <span className="text-[10px] text-slate-500 font-normal">({stat.count} Sekolah)</span>
                      </div>
                      <span className="text-emerald-400 font-bold text-sm">{stat.avgProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${stat.avgProgress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kanban & Tasks Overview */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-400" /> Distribusi Pekerjaan Fisik (Kanban)
              </h3>
              <span className="text-[10px] font-bold text-slate-400">Total: {totalTasks} Tugas Terdaftar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Todo */}
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Belum Dikerjakan (Todo)</span>
                  <span className="text-2xl font-extrabold text-slate-200 block mt-2">{taskTodo}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div className="bg-slate-600 h-full" style={{ width: `${totalTasks ? (taskTodo/totalTasks)*100 : 0}%` }} />
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Dalam Proses (In Progress)</span>
                  <span className="text-2xl font-extrabold text-amber-400 block mt-2">{taskInProgress}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${totalTasks ? (taskInProgress/totalTasks)*100 : 0}%` }} />
                </div>
              </div>

              {/* Done */}
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Selesai (Done)</span>
                  <span className="text-2xl font-extrabold text-emerald-400 block mt-2">{taskDone} <span className="text-xs text-slate-400 font-normal">({donePercentage}%)</span></span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-4 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${totalTasks ? (taskDone/totalTasks)*100 : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Facilitator vs Global Section */}
          {isFacilitator ? (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
              <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
                <School className="w-4 h-4 text-indigo-400" /> Daftar Sekolah Binaan Anda
              </h3>

              {displaySchools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 italic mb-3">Anda belum mengklaim sekolah binaan.</p>
                  <p className="text-xs text-slate-400">
                    Silakan buka menu <strong>"Semua Sekolah"</strong> untuk memilih dan mengklaim sekolah dasar yang akan Anda dampingi.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displaySchools.map(school => (
                    <div key={school.npsn} className="bg-slate-950/20 border border-slate-850/40 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200 text-sm">{school.nama_sekolah}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-400">
                            NPSN {school.npsn}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          <span>Wilayah: {school.kabupaten} {school.kecamatan ? `, Kec. ${school.kecamatan}` : ''} {school.desa ? `, Desa ${school.desa}` : ''}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {school.kepala_sekolah ? (
                            <span>Kepala Sekolah: <strong>{school.kepala_sekolah}</strong> {school.hp_kepala_sekolah ? `(${school.hp_kepala_sekolah})` : ''}</span>
                          ) : (
                            <span className="italic">Data kepala sekolah belum dilengkapi</span>
                          )}
                        </div>
                      </div>

                      {/* Progress info & bar */}
                      <div className="w-full md:w-48 shrink-0 space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Progres Fisik</span>
                          <span className="text-emerald-400">{school.progres_fisik || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${school.progres_fisik || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
              <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
                <UserCheck className="w-4 h-4 text-indigo-400" /> Progres Pendampingan per Fasilitator
              </h3>

              <div className="space-y-4">
                {facilitatorStats.map(fac => (
                  <div key={fac.id} className="bg-slate-950/20 border border-slate-850/40 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-sm">{fac.name}</span>
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-400`}>
                          {fac.statusPegawai}
                        </span>
                      </div>
                      
                      {/* Schools small list */}
                      <div className="text-[11px] text-slate-500 font-medium">
                        {fac.schoolCount > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-600 block mr-1 mt-0.5">Binaan ({fac.schoolCount}):</span>
                            {fac.schools.map((s, idx) => (
                              <span key={idx} className="bg-slate-950/45 px-2 py-0.5 rounded border border-slate-850 text-slate-400 font-semibold text-[10px] inline-block">
                                {s.nama} ({s.progres}%)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Belum mendampingi sekolah dasar</span>
                        )}
                      </div>
                    </div>

                    {/* Progress info & bar */}
                    <div className="w-full md:w-48 shrink-0 space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-400">Rerata Progres</span>
                        <span className="text-emerald-400">{fac.avgProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${fac.avgProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Dynamic Configuration (Super Admin) or Kepegawaian (Others) */}
          {activeUser ? (
            activeUser.role === 'admin' ? (
              <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-indigo-400" /> Konfigurasi Linimasa Global
                </h3>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Mulai Proyek
                    </label>
                    <input
                      type="date"
                      value={dates.projectStartDate}
                      onChange={(e) => setDates({ ...dates, projectStartDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Target Selesai
                    </label>
                    <input
                      type="date"
                      value={dates.projectEndDate}
                      onChange={(e) => setDates({ ...dates, projectEndDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tanggal Simulasi Hari Ini
                    </label>
                    <input
                      type="date"
                      value={dates.simulatedToday}
                      onChange={(e) => setDates({ ...dates, simulatedToday: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                      required
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                    >
                      Simpan Konfigurasi
                    </button>
                  </div>
                </form>
              </div>
            ) : null
          ) : (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
              <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-indigo-400" /> Panduan Masuk Sistem
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Sistem ini memfasilitasi monitoring swakelola dengan simulasi multi-peran (Super Admin, Ketua Tim, Koordinator, Fasilitator, dan Tenaga Administrasi).
              </p>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <span className="font-bold text-indigo-400 shrink-0">1.</span>
                  <span>Klik tombol <strong>"Masuk ke Sistem"</strong> di kanan atas halaman.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <span className="font-bold text-indigo-400 shrink-0">2.</span>
                  <span>Pilih profil salah satu anggota tim pelaksana swakelola.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                  <span className="font-bold text-indigo-400 shrink-0">3.</span>
                  <span>Gunakan menu samping untuk menguji fitur-fitur spesifik sesuai peran tersebut.</span>
                </div>
              </div>
            </div>
          )}

          {/* Ranked School Progress */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center justify-between border-b border-slate-850 pb-2.5">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Progres Fisik Sekolah
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                Urut Terbesar
              </span>
            </h3>

            {sortedSchoolsByProgress.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">Belum ada sekolah terdaftar.</p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3">
                {sortedSchoolsByProgress.map((school) => (
                  <div key={school.npsn} className="bg-slate-950/20 border border-slate-850/40 rounded-2xl p-3.5 space-y-2 hover:border-slate-800 transition-colors">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-200 text-xs block truncate" title={school.nama_sekolah}>
                          {school.nama_sekolah}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          Kab. {school.kabupaten}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 shrink-0">
                        {school.progres_fisik || 0}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${school.progres_fisik || 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5">
                      <span className="truncate">
                        Fasilitator: <strong className="text-slate-300 font-medium">{getFasilitatorName(school.fasilitatorId)}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
