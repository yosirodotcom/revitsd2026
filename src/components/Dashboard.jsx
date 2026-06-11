import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Play,
  Users,
  Plane,
  X,
  CircleDollarSign
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
  onRejectTrip,
  onSelectSchool,
  onViewChange,
  expenses = [],
  payments = []
}) {
  const [dates, setDates] = useState({
    projectStartDate: settings.projectStartDate || '2026-06-12',
    projectEndDate: settings.projectEndDate || '2026-12-12',
    googleAppsScriptUrl: settings.googleAppsScriptUrl || '',
    googleAppsScriptToken: settings.googleAppsScriptToken || 'REVITSD2026_SECURE_TOKEN'
  });

  const [selectedFacilitator, setSelectedFacilitator] = useState(null);
  const [facModalId, setFacModalId] = useState(null);
  const [facModalTab, setFacModalTab] = useState('reports');
  const [payrollDetailModal, setPayrollDetailModal] = useState(null);

  const isAdministrasi = activeUser?.jabatanTim === 'Tenaga Administrasi';
  const isSuperAdmin = activeUser?.role === 'admin' || activeUser?.jabatanTim === 'Super Admin';

  const [financialSettings, setFinancialSettings] = useState({
    totalProjectContract: settings.totalProjectContract || 1500000000,
    honorKetuaTim: settings.honorKetuaTim || 7000000,
    honorKoordinator: settings.honorKoordinator || 6000000,
    honorFasilitator: settings.honorFasilitator || 5000000,
    honorAdministrasi: settings.honorAdministrasi || 5000000,
    deductionAdminFlat: settings.deductionAdminFlat || 100000,
    deductionAdminKetuaTim: settings.deductionAdminKetuaTim || 100000,
    deductionAdminKoordinator: settings.deductionAdminKoordinator || 100000,
    deductionAdminFasilitator: settings.deductionAdminFasilitator || 100000,
    deductionAdminAdministrasi: settings.deductionAdminAdministrasi || 100000,
    deductionTaxPct: settings.deductionTaxPct || 15,
    deductionLembagaPct: settings.deductionLembagaPct || 10
  });

  useEffect(() => {
    setFinancialSettings({
      totalProjectContract: settings.totalProjectContract || 1500000000,
      honorKetuaTim: settings.honorKetuaTim || 7000000,
      honorKoordinator: settings.honorKoordinator || 6000000,
      honorFasilitator: settings.honorFasilitator || 5000000,
      honorAdministrasi: settings.honorAdministrasi || 5000000,
      deductionAdminFlat: settings.deductionAdminFlat || 100000,
      deductionAdminKetuaTim: settings.deductionAdminKetuaTim || 100000,
      deductionAdminKoordinator: settings.deductionAdminKoordinator || 100000,
      deductionAdminFasilitator: settings.deductionAdminFasilitator || 100000,
      deductionAdminAdministrasi: settings.deductionAdminAdministrasi || 100000,
      deductionTaxPct: settings.deductionTaxPct || 15,
      deductionLembagaPct: settings.deductionLembagaPct || 10
    });
  }, [settings]);

  const handleSaveFinancialSettings = (e) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      ...financialSettings
    });
    window.showAlert('Pengaturan anggaran dan honorarium berhasil disimpan!');
  };

  const getUserPayrollStatus = (user, month) => {
    const baseMonthly = settings[`honor${user.jabatanTim.replace(' ', '')}`] || {
      'Ketua Tim': 7000000,
      'Koordinator': 6000000,
      'Fasilitator': 5000000,
      'Tenaga Administrasi': 5000000
    }[user.jabatanTim] || 5000000;

    const taxPct = Number(settings.deductionTaxPct ?? 15);
    const lembagaPct = Number(settings.deductionLembagaPct ?? 10);
    
    let adminFlat = 100000;
    if (user.jabatanTim === 'Ketua Tim') {
      adminFlat = Number(settings.deductionAdminKetuaTim ?? settings.deductionAdminFlat ?? 100000);
    } else if (user.jabatanTim === 'Koordinator') {
      adminFlat = Number(settings.deductionAdminKoordinator ?? settings.deductionAdminFlat ?? 100000);
    } else if (user.jabatanTim === 'Fasilitator') {
      adminFlat = Number(settings.deductionAdminFasilitator ?? settings.deductionAdminFlat ?? 100000);
    } else if (user.jabatanTim === 'Tenaga Administrasi') {
      adminFlat = Number(settings.deductionAdminAdministrasi ?? settings.deductionAdminFlat ?? 100000);
    } else {
      adminFlat = Number(settings.deductionAdminFlat ?? 100000);
    }

    let pctPart1 = 0;
    let pctPart2 = 0;
    let pctPart3 = 0;

    if (user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') {
      pctPart1 = 0.50;
      pctPart2 = 0.25;
      pctPart3 = 0.25;
    } else if (user.jabatanTim === 'Fasilitator') {
      pctPart1 = 0.70;
      pctPart2 = 0.20;
      pctPart3 = 0.10;
    } else {
      pctPart1 = 1.00;
      pctPart2 = 0;
      pctPart3 = 0;
    }

    const grossPart1 = baseMonthly * pctPart1;
    const grossPart2 = baseMonthly * pctPart2;
    const grossPart3 = baseMonthly * pctPart3;

    // Check month report
    const userReport = reports.find(r => r.userId === user.id && Number(r.bulanKe) === Number(month));
    const reportFinished = user.jabatanTim === 'Tenaga Administrasi' || (userReport && userReport.status === 'approved');

    // Overseen schools progress
    let mySchools = [];
    if (user.jabatanTim === 'Fasilitator') {
      mySchools = schools.filter(s => s.fasilitatorId === user.id);
    } else {
      mySchools = schools; // Ketua Tim & Koordinator supervise all
    }
    const totalBinaan = mySchools.length;

    const binProgress50 = mySchools.filter(s => (s.progres_fisik || 0) >= 50).length;
    const pctProgress50 = totalBinaan > 0 ? (binProgress50 / totalBinaan) : 0;
    const allProgress50DocsUploaded = totalBinaan > 0 && mySchools.every(s => 
      s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_50 !== 'belum'
    );
    const part2Eligible = totalBinaan > 0 && pctProgress50 >= 0.75 && allProgress50DocsUploaded;

    const binProgress100 = mySchools.filter(s => (s.progres_fisik || 0) === 100).length;
    const pctProgress100 = totalBinaan > 0 ? (binProgress100 / totalBinaan) : 0;
    const allProgress100DocsUploaded = totalBinaan > 0 && mySchools.every(s => 
      s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_100 !== 'belum'
    );
    const part3Eligible = totalBinaan > 0 && pctProgress100 >= 0.90 && allProgress100DocsUploaded;

    const getDeductionDetails = (gross) => {
      if (gross === 0) return { tax: 0, lembaga: 0, admin: 0, net: 0 };
      const tax = Math.round(gross * (taxPct / 100));
      const lembaga = Math.round(gross * (lembagaPct / 100));
      const admin = adminFlat;
      const net = Math.max(0, gross - tax - lembaga - admin);
      return { tax, lembaga, admin, net };
    };

    return {
      baseMonthly,
      adminFlat,
      totalBinaan,
      binProgress50,
      pctProgress50,
      allProgress50DocsUploaded,
      binProgress100,
      pctProgress100,
      allProgress100DocsUploaded,
      userReport,
      reportFinished,
      parts: [
        {
          id: 'part1',
          name: user.jabatanTim === 'Tenaga Administrasi' ? 'Honor Bulanan (100%)' : `Bagian 1 (Laporan Bulanan - ${pctPart1 * 100}%)`,
          gross: grossPart1,
          eligible: reportFinished,
          isPaid: payments.some(p => p.userId === user.id && (p.komponen === `tetap_bulan_${month}_part1` || p.komponen === `tetap_bulan_${month}`)),
          conditions: user.jabatanTim === 'Tenaga Administrasi' ? 'Diterima penuh setiap bulan' : 'Laporan bulanan PDF disetujui (Approved)',
          key: `tetap_bulan_${month}_part1`,
          ...getDeductionDetails(grossPart1)
        },
        {
          id: 'part2',
          name: `Bagian 2 (Target 50% - ${pctPart2 * 100}%)`,
          gross: grossPart2,
          eligible: part2Eligible,
          isPaid: payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part2`),
          conditions: `75% sekolah dampingan (${binProgress50}/${totalBinaan}, ${Math.round(pctProgress50 * 100)}%) mencapai progres >= 50% & seluruh laporan mingguan, bulanan, progres 50% diunggah`,
          key: `tetap_bulan_${month}_part2`,
          ...getDeductionDetails(grossPart2)
        },
        {
          id: 'part3',
          name: `Bagian 3 (Target 100% - ${pctPart3 * 100}%)`,
          gross: grossPart3,
          eligible: part3Eligible,
          isPaid: payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part3`),
          conditions: `90% sekolah dampingan (${binProgress100}/${totalBinaan}, ${Math.round(pctProgress100 * 100)}%) mencapai progres 100% & seluruh laporan mingguan, bulanan, progres 100% diunggah`,
          key: `tetap_bulan_${month}_part3`,
          ...getDeductionDetails(grossPart3)
        }
      ].filter(p => p.gross > 0)
    };
  };

  // Central funding calculations
  const totalProjectContract = settings.totalProjectContract || 1500000000;
  
  const totalAtk = expenses.filter(e => e.kategori === 'atk').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalHonor = expenses.filter(e => e.kategori === 'honor').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalDinas = expenses.filter(e => e.kategori === 'dinas').reduce((acc, curr) => acc + curr.jumlah, 0);
  const grandTotalExpenses = totalAtk + totalHonor + totalDinas;

  // Stage 2 & 3 checks
  const ketuaTim = users.find(u => u.jabatanTim === 'Ketua Tim');
  const cond1 = reports.some(r => r.userId === (ketuaTim?.id || 'etty-rabihati') && Number(r.bulanKe) === 4 && r.status === 'approved');
  const cond2 = grandTotalExpenses >= 0.50 * totalProjectContract;
  
  const progress50Schools = schools.filter(s => (s.progres_fisik || 0) >= 50);
  const cond3 = schools.length > 0 && (progress50Schools.length / schools.length) >= 0.75;
  const cond4 = progress50Schools.length > 0 && progress50Schools.every(s => 
    s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_50 !== 'belum'
  );

  const isTahap2Eligible = cond1 && cond2 && cond3 && cond4;

  const cond1_t3 = [1,2,3,4,5,6].every(m => reports.some(r => r.userId === (ketuaTim?.id || 'etty-rabihati') && Number(r.bulanKe) === m && r.status === 'approved'));
  const progress100Schools = schools.filter(s => (s.progres_fisik || 0) === 100);
  const cond2_t3 = schools.length > 0 && (progress100Schools.length / schools.length) >= 0.90;
  const cond3_t3 = progress100Schools.length > 0 && progress100Schools.every(s => 
    s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_100 !== 'belum'
  );

  const isTahap3Eligible = cond1_t3 && cond2_t3 && cond3_t3;

  const totalDanaPusatDiterima = (0.60 * totalProjectContract) + 
                                  (isTahap2Eligible ? 0.25 * totalProjectContract : 0) + 
                                  (isTahap3Eligible ? 0.15 * totalProjectContract : 0);

  // Sync state if settings change (e.g. from TravelSchedule or another tab)
  useEffect(() => {
    setDates({
      projectStartDate: settings.projectStartDate || '2026-06-12',
      projectEndDate: settings.projectEndDate || '2026-12-12',
      googleAppsScriptUrl: settings.googleAppsScriptUrl || '',
      googleAppsScriptToken: settings.googleAppsScriptToken || 'REVITSD2026_SECURE_TOKEN'
    });
  }, [settings]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings(dates);
    window.showAlert('Konfigurasi linimasa global berhasil disimpan!');
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
  const showRightColumn = (activeUser?.role === 'admin') || !isFacilitator;

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

  let totalLabel = "Total Sekolah Dampingan";
  let totalCount = schools.length;
  let totalSubtitle = "Sekolah Dasar Master";
  
  if (isFacilitator) {
    totalLabel = "Sekolah Dampingan Anda";
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
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };
  const todayStr = getTodayDateStr();

  const startMs = new Date(dates.projectStartDate).getTime();
  const endMs = new Date(dates.projectEndDate).getTime();
  const todayMs = new Date(todayStr).getTime();
  
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
  const monthsElapsed = getMonthsDifference(dates.projectStartDate, todayStr);

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
            schools: facSchools.map(s => ({ npsn: s.npsn, nama: s.nama_sekolah, progres: s.progres_fisik, kabupaten: s.kabupaten }))
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

      {isAdministrasi ? (
        // RENDER FINANCIAL ADMIN DASHBOARD
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>
            <div className="max-w-3xl">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 tracking-wider uppercase">
                Tahun Anggaran 2026
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-4">
                Dashboard Administrasi Keuangan
              </h2>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed mt-2 font-medium">
                Halo, {activeUser?.nama}! Anda berada di dashboard pengelolaan administrasi keuangan proyek revitalisasi. Gunakan panel di bawah ini untuk melacak pencairan dana pusat, menyetel tarif honorarium tim, dan memantau status kelayakan payroll bulanan.
              </p>
            </div>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nilai Kontrak Proyek</span>
                <span className="text-xl font-extrabold text-slate-100 block">Rp {totalProjectContract.toLocaleString('id-ID')}</span>
                <span className="text-xs text-slate-400 font-medium">Alokasi Dana Pusat</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <School className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dana Pusat Diterima</span>
                <span className="text-xl font-extrabold text-emerald-400 block">Rp {totalDanaPusatDiterima.toLocaleString('id-ID')}</span>
                <span className="text-xs text-slate-400 font-medium">{Math.round((totalDanaPusatDiterima / totalProjectContract) * 100)}% dari Nilai Kontrak</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Realisasi Pengeluaran</span>
                <span className="text-xl font-extrabold text-amber-400 block">Rp {grandTotalExpenses.toLocaleString('id-ID')}</span>
                <span className="text-xs text-slate-400 font-medium">{Math.round((grandTotalExpenses / totalProjectContract) * 100)}% Penyerapan Dana</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sisa Saldo Kas Bendahara</span>
                <span className={`text-xl font-extrabold block ${totalDanaPusatDiterima - grandTotalExpenses >= 0 ? 'text-indigo-400' : 'text-rose-455'}`}>
                  Rp {(totalDanaPusatDiterima - grandTotalExpenses).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-slate-400 font-medium">Dana Masuk - Pengeluaran</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <CircleDollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Aliran Dana Transfer Pusat */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-850 pb-3">
              <Clock className="w-4 h-4 text-indigo-400" /> Aliran Dana Transfer Pusat
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tahap 1 */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-emerald-500/30 bg-emerald-500/5 relative animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">Tahap 1 (60%)</span>
                    <h4 className="font-bold text-slate-200 text-xs mt-1.5">Rp {(0.60 * totalProjectContract).toLocaleString('id-ID')}</h4>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> SUDAH CAIR</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Pencairan awal sebesar 60% langsung disalurkan ke rekening bendahara saat proyek dimulai.
                </p>
              </div>

              {/* Tahap 2 */}
              <div className={`bg-slate-950/60 rounded-2xl p-4 border ${isTahap2Eligible ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800'} relative`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] font-bold ${isTahap2Eligible ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded`}>Tahap 2 (25%)</span>
                    <h4 className="font-bold text-slate-200 text-xs mt-1.5">Rp {(0.25 * totalProjectContract).toLocaleString('id-ID')}</h4>
                  </div>
                  <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${isTahap2Eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isTahap2Eligible ? 'LAYAK CAIR' : 'MENUNGGU SYARAT'}
                  </span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-900/60 space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1. Lap. Ketua Tim (B4):</span>
                    <span className={`font-bold ${cond1 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond1 ? '✓ Selesai' : '✗ Belum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2. Penyerapan &ge; 50%:</span>
                    <span className={`font-bold ${cond2 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond2 ? '✓ Terpenuhi' : '✗ Belum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3. &ge; 75% SD progres &ge; 50%:</span>
                    <span className={`font-bold ${cond3 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond3 ? '✓ Terpenuhi' : '✗ Belum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">4. Dokumen 50% terunggah:</span>
                    <span className={`font-bold ${cond4 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond4 ? '✓ Lengkap' : '✗ Belum'}</span>
                  </div>
                </div>
              </div>

              {/* Tahap 3 */}
              <div className={`bg-slate-950/60 rounded-2xl p-4 border ${isTahap3Eligible ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800'} relative`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[10px] font-bold ${isTahap3Eligible ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded`}>Tahap 3 (15%)</span>
                    <h4 className="font-bold text-slate-200 text-xs mt-1.5">Rp {(0.15 * totalProjectContract).toLocaleString('id-ID')}</h4>
                  </div>
                  <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${isTahap3Eligible ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isTahap3Eligible ? 'LAYAK CAIR' : 'MENUNGGU SYARAT'}
                  </span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-900/60 space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1. Semua Lap. Ketua Tim:</span>
                    <span className={`font-bold ${cond1_t3 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond1_t3 ? '✓ Selesai' : '✗ Belum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">2. &ge; 90% SD progres 100%:</span>
                    <span className={`font-bold ${cond2_t3 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond2_t3 ? '✓ Terpenuhi' : '✗ Belum'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">3. Dokumen 100% terunggah:</span>
                    <span className={`font-bold ${cond3_t3 ? 'text-emerald-400' : 'text-rose-450'}`}>{cond3_t3 ? '✓ Lengkap' : '✗ Belum'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3 mb-4 flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Pantauan Pembayaran & Kelayakan Honorarium Tim
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Status kelayakan pembayaran honor per bulan (Bulan 1 s/d 6). Klik peran untuk detail.</p>
              </div>
              <button
                onClick={() => onViewChange('bayar-honor')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow flex items-center gap-1 cursor-pointer border-0"
              >
                Buka Halaman Pembayaran Honor <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 border-b border-slate-850 text-slate-500 uppercase text-[9px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Anggota</th>
                    <th className="px-4 py-3">Jabatan</th>
                    <th className="px-4 py-3">Honor Bulanan</th>
                    {[1,2,3,4,5,6].map(m => (
                      <th key={m} className="px-4 py-3 text-center">Bulan {m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.filter(u => u.jabatanTim !== 'Super Admin').map(user => {
                    const helper = (month) => {
                      const userBaseMonthly = settings[`honor${user.jabatanTim.replace(' ', '')}`] || {
                        'Ketua Tim': 7000000,
                        'Koordinator': 6000000,
                        'Fasilitator': 5000000,
                        'Tenaga Administrasi': 5000000
                      }[user.jabatanTim] || 5000000;
                      
                      let pctPart1 = 0, pctPart2 = 0, pctPart3 = 0;
                      if (user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') {
                        pctPart1 = 0.50; pctPart2 = 0.25; pctPart3 = 0.25;
                      } else if (user.jabatanTim === 'Fasilitator') {
                        pctPart1 = 0.70; pctPart2 = 0.20; pctPart3 = 0.10;
                      } else {
                        pctPart1 = 1.00; pctPart2 = 0; pctPart3 = 0;
                      }

                      const userReport = reports.find(r => r.userId === user.id && Number(r.bulanKe) === Number(month));
                      const reportFinished = user.jabatanTim === 'Tenaga Administrasi' || (userReport && userReport.status === 'approved');

                      let mySchools = [];
                      if (user.jabatanTim === 'Fasilitator') {
                        mySchools = schools.filter(s => s.fasilitatorId === user.id);
                      } else {
                        mySchools = schools;
                      }
                      const totalBinaan = mySchools.length;
                      
                      const binProgress50 = mySchools.filter(s => (s.progres_fisik || 0) >= 50).length;
                      const pctProgress50 = totalBinaan > 0 ? (binProgress50 / totalBinaan) : 0;
                      const allProgress50DocsUploaded = totalBinaan > 0 && mySchools.every(s => 
                        s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_50 !== 'belum'
                      );
                      const part2Eligible = totalBinaan > 0 && pctProgress50 >= 0.75 && allProgress50DocsUploaded;

                      const binProgress100 = mySchools.filter(s => (s.progres_fisik || 0) === 100).length;
                      const pctProgress100 = totalBinaan > 0 ? (binProgress100 / totalBinaan) : 0;
                      const allProgress100DocsUploaded = totalBinaan > 0 && mySchools.every(s => 
                        s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_100 !== 'belum'
                      );
                      const part3Eligible = totalBinaan > 0 && pctProgress100 >= 0.90 && allProgress100DocsUploaded;

                      const part1Paid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part1`);
                      const part2Paid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part2`);
                      const part3Paid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part3`);

                      const totalParts = (pctPart1 > 0 ? 1 : 0) + (pctPart2 > 0 ? 1 : 0) + (pctPart3 > 0 ? 1 : 0);
                      const paidParts = (part1Paid ? 1 : 0) + (part2Paid ? 1 : 0) + (part3Paid ? 1 : 0);
                      const eligibleUnpaidParts = ((reportFinished && !part1Paid) ? 1 : 0) + 
                                                   ((part2Eligible && !part2Paid) ? 1 : 0) + 
                                                   ((part3Eligible && !part3Paid) ? 1 : 0);

                      if (paidParts === totalParts) return 'all-paid';
                      if (paidParts > 0) return 'part-paid';
                      if (eligibleUnpaidParts > 0) return 'ready';
                      return 'waiting';
                    };

                    const userBaseMonthly = settings[`honor${user.jabatanTim.replace(' ', '')}`] || {
                      'Ketua Tim': 7000000,
                      'Koordinator': 6000000,
                      'Fasilitator': 5000000,
                      'Tenaga Administrasi': 5000000
                    }[user.jabatanTim] || 5000000;

                    return (
                      <tr key={user.id} className="hover:bg-slate-900/10">
                        <td className="px-4 py-3 font-bold text-slate-200">{user.nama}</td>
                        <td className="px-4 py-3 font-medium text-slate-400">{user.jabatanTim}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-400">Rp {userBaseMonthly.toLocaleString('id-ID')}</td>
                        {[1,2,3,4,5,6].map(m => {
                          const status = helper(m);
                          return (
                            <td key={m} className="px-4 py-3 text-center">
                              <span 
                                onClick={() => setPayrollDetailModal({ user, month: m })}
                                className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer hover:scale-105 transition-all select-none ${
                                status === 'all-paid'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                  : status === 'part-paid'
                                  ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/20'
                                  : status === 'ready'
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                                  : 'bg-slate-900 border-slate-850 text-slate-500 hover:bg-slate-805'
                              }`}
                                title="Klik untuk memantau detail persyaratan kelayakan honor"
                              >
                                {status === 'all-paid' && 'Lunas'}
                                {status === 'part-paid' && 'Cicil'}
                                {status === 'ready' && 'Layak'}
                                {status === 'waiting' && 'Belum'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // RENDER ORIGINAL PHYSICAL DASHBOARD
        <div className="space-y-6">
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
                      <h4 
                        onClick={() => targetSchool && onSelectSchool && onSelectSchool(targetSchool.npsn)}
                        className="font-bold text-slate-200 text-xs truncate hover:text-indigo-400 cursor-pointer transition-colors"
                        title="Klik untuk melihat detail sekolah"
                      >
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
                          window.showAlert('Perjalanan dinas disetujui!');
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border-0"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={async () => {
                          if (await window.showConfirm('Tolak permohonan kunjungan dinas ini?')) {
                            onRejectTrip(trip.id);
                            window.showAlert('Perjalanan dinas ditolak.');
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
      <div className={showRightColumn ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : "space-y-6"}>
        
        {/* Left Column (2/3 width or full width) */}
        <div className={showRightColumn ? "lg:col-span-2 space-y-6" : "space-y-6"}>
          
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
                  <span>Waktu Berjalan</span>
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
                    <span className="block text-[8px] uppercase font-bold text-indigo-400">Hari Ini</span>
                    <span className="text-[11px] font-bold text-indigo-300">{formatLocalDate(todayStr)}</span>
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

          {/* Average Progress per Fasilitator */}
          <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
            <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" /> Rata-Rata Progres Fisik per Fasilitator
            </h3>

            {facilitatorStats.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">Belum ada data fasilitator.</p>
            ) : (
              <div className="space-y-3">
                {facilitatorStats.map(fac => {
                  const isSelected = selectedFacilitator === fac.id;
                  return (
                    <div
                      key={fac.id}
                      className={`rounded-2xl overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? 'bg-indigo-950/40 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/20 hover:bg-slate-950/40'
                      }`}
                    >
                      <button
                        onClick={() => setSelectedFacilitator(isSelected ? null : fac.id)}
                        className="w-full text-left p-3.5 flex items-center justify-between gap-3 cursor-pointer bg-transparent border-0 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-300'
                              : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                          }`}>
                            <UserCheck className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className={`text-sm font-bold block truncate transition-colors ${isSelected ? 'text-indigo-200' : 'text-slate-200'}`}>{fac.name}</span>
                            <span className="text-[10px] text-slate-500 font-medium">{fac.schoolCount} Sekolah Dampingan</span>
                          </div>
                        </div>
                        <span className={`font-bold text-sm shrink-0 ${isSelected ? 'text-indigo-300' : 'text-emerald-400'}`}>{fac.avgProgress}%</span>
                      </button>
                      <div className="px-3.5 pb-2">
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-400 to-purple-400'
                                : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                            }`}
                            style={{ width: `${fac.avgProgress}%` }}
                          />
                        </div>
                      </div>
                      {/* Detail Button */}
                      <div className="px-3.5 pb-3 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setFacModalId(fac.id); setFacModalTab('reports'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/15 hover:text-purple-300 transition-all"
                        >
                          <FileText className="w-3 h-3" /> Dokumen Laporan
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFacModalId(fac.id); setFacModalTab('trips'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold cursor-pointer border border-sky-500/20 bg-sky-500/5 text-sky-400 hover:bg-sky-500/15 hover:text-sky-300 transition-all"
                        >
                          <Plane className="w-3 h-3" /> Perjalanan Dinas
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conditional Facilitator Section */}
          {isFacilitator && (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
              <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
                <School className="w-4 h-4 text-indigo-400" /> Daftar Sekolah Dampingan Anda
              </h3>

              {displaySchools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 italic mb-3">Anda belum mengklaim sekolah dampingan.</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Silakan buka menu <strong>"Daftar Sekolah"</strong> untuk memilih dan mengklaim sekolah dasar yang akan Anda dampingi.
                  </p>
                  {onViewChange && (
                    <button
                      onClick={() => onViewChange('sekolah')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
                    >
                      Buka Daftar Sekolah
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {displaySchools.map(school => (
                    <div 
                      key={school.npsn} 
                      onClick={() => onSelectSchool && onSelectSchool(school.npsn)}
                      className="bg-slate-950/20 border border-slate-850/40 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-500/40 hover:bg-indigo-950/10 cursor-pointer transition-all duration-300"
                    >
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
          )}

        </div>

        {/* Right Column (1/3 width) */}
        {showRightColumn && (
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
                  <div className="border-t border-slate-850 my-2 pt-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">Penyimpanan Sheets & Drive</span>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          URL Google Apps Script Web App
                        </label>
                        <input
                          type="url"
                          value={dates.googleAppsScriptUrl}
                          onChange={(e) => setDates({ ...dates, googleAppsScriptUrl: e.target.value })}
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Token Keamanan API
                        </label>
                        <input
                          type="password"
                          value={dates.googleAppsScriptToken}
                          onChange={(e) => setDates({ ...dates, googleAppsScriptToken: e.target.value })}
                          placeholder="REVITSD2026_SECURE_TOKEN"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>
                    </div>
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

          {/* Ranked School Progress — filtered by selectedFacilitator */}
          {!isFacilitator && (() => {
            const selectedFacName = selectedFacilitator
              ? users.find(u => u.id === selectedFacilitator)?.nama || 'Fasilitator'
              : null;
            const filteredSchools = selectedFacilitator
              ? sortedSchoolsByProgress.filter(s => s.fasilitatorId === selectedFacilitator)
              : sortedSchoolsByProgress;

            return (
              <div className={`bg-slate-900/30 backdrop-blur-md border rounded-3xl p-6 shadow-md transition-all duration-300 ${
                selectedFacilitator ? 'border-indigo-500/30 ring-1 ring-indigo-500/10' : 'border-slate-800'
              }`}>
                <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center justify-between border-b border-slate-850 pb-2.5">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Progres Fisik Sekolah
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    Urut Terbesar
                  </span>
                </h3>

                {/* Active filter indicator */}
                {selectedFacilitator && (
                  <div className="flex items-center justify-between bg-indigo-950/40 border border-indigo-500/20 rounded-xl px-3 py-2 mb-3 animate-fade-in">
                    <span className="text-[11px] text-indigo-300 font-semibold">
                      <UserCheck className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                      Sekolah dampingan <strong>{selectedFacName}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedFacilitator(null)}
                      className="text-[10px] text-indigo-400 hover:text-white font-bold bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 px-2 py-0.5 rounded-lg cursor-pointer transition-colors"
                    >
                      ✕ Reset
                    </button>
                  </div>
                )}

                {filteredSchools.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-6">
                    {selectedFacilitator ? 'Fasilitator ini belum memiliki sekolah dampingan.' : 'Belum ada sekolah terdaftar.'}
                  </p>
                ) : (
                  <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3">
                    {filteredSchools.map((school) => (
                      <div 
                        key={school.npsn} 
                        onClick={() => onSelectSchool && onSelectSchool(school.npsn)}
                        className="bg-slate-950/20 border border-slate-850/40 rounded-2xl p-3.5 space-y-2 hover:border-indigo-500/40 hover:bg-indigo-950/10 cursor-pointer transition-all duration-300"
                      >
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
            );
          })()}

          </div>
        )}

      </div>

      {/* ===== FACILITATOR DETAIL MODAL ===== */}
      {facModalId && (() => {
        const modalFac = users.find(u => u.id === facModalId);
        const modalFacName = modalFac?.nama || 'Fasilitator';
        const modalFacSchools = schools.filter(s => s.fasilitatorId === facModalId);
        const modalFacNpsns = modalFacSchools.map(s => s.npsn);
        const modalReports = reports.filter(r => modalFacNpsns.includes(r.schoolId) || r.uploadedBy === facModalId);
        const modalTrips = trips.filter(t => t.userId === facModalId);

        const getSchoolName = (npsn) => {
          const s = schools.find(sc => sc.npsn === npsn);
          return s ? s.nama_sekolah : `NPSN ${npsn}`;
        };

        return createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setFacModalId(null)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
              className="relative bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800/80 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">{modalFacName}</h2>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {modalFac?.jabatanTim} • {modalFacSchools.length} Sekolah Dampingan
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setFacModalId(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Tab Navigation */}
                <div className="flex gap-2">
                  {[
                    { key: 'reports', label: 'Dokumen Laporan', icon: FileText, count: modalReports.length, accent: 'purple' },
                    { key: 'trips', label: 'Perjalanan Dinas', icon: Plane, count: modalTrips.length, accent: 'sky' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setFacModalTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${
                        facModalTab === tab.key
                          ? tab.accent === 'purple'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                      <span className={`text-[9px] ml-1 px-1.5 py-0.5 rounded-md font-bold ${
                        facModalTab === tab.key
                          ? tab.accent === 'purple' ? 'bg-purple-500/20 text-purple-300' : 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}>{tab.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {/* Reports Tab */}
                {facModalTab === 'reports' && (
                  <>
                    {modalReports.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-xs text-slate-500 italic">Belum ada laporan dari fasilitator ini.</p>
                      </div>
                    ) : (
                      modalReports.map((report) => {
                        const statusConfig = {
                          approved: { label: 'Disetujui', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                          rejected: { label: 'Ditolak', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
                          pending: { label: 'Menunggu Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                        };
                        const st = statusConfig[report.status] || statusConfig.pending;
                        return (
                          <div key={report.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span className="font-bold text-slate-200 text-sm truncate">{report.fileName}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  <span 
                                    onClick={() => {
                                      setFacModalId(null);
                                      onSelectSchool && onSelectSchool(report.schoolId);
                                    }}
                                    className="hover:text-indigo-400 cursor-pointer transition-colors hover:underline"
                                    title="Lihat detail sekolah"
                                  >
                                    {getSchoolName(report.schoolId)}
                                  </span> — <span className="text-slate-500">Bulan {report.month}</span>
                                </p>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${st.color}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-850/40 text-[10px] text-slate-500">
                              <span>Ukuran: {report.fileSize ? `${(report.fileSize / 1024).toFixed(0)} KB` : '-'}</span>
                              {report.note && (
                                <span className="text-slate-400 italic truncate">Catatan: "{report.note}"</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </>
                )}

                {/* Trips Tab */}
                {facModalTab === 'trips' && (
                  <>
                    {modalTrips.length === 0 ? (
                      <div className="text-center py-12">
                        <Plane className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-xs text-slate-500 italic">Belum ada perjalanan dinas dari fasilitator ini.</p>
                      </div>
                    ) : (
                      modalTrips.map((trip) => {
                        const tripSchool = schools.find(s => s.npsn === trip.sekolahId);
                        const statusConfig = {
                          planned: { label: 'Direncanakan', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                          completed: { label: 'Selesai', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                          paid: { label: 'Dibayar', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                        };
                        const approvalConfig = {
                          pending: { label: 'Menunggu Persetujuan', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/15' },
                          approved: { label: 'Disetujui', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/15' },
                          rejected: { label: 'Ditolak', color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/15' },
                        };
                        const st = statusConfig[trip.status] || statusConfig.planned;
                        const ap = trip.statusPersetujuan ? (approvalConfig[trip.statusPersetujuan] || null) : null;
                        return (
                          <div key={trip.id} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Plane className="w-4 h-4 text-sky-400 shrink-0" />
                                  <span className="font-bold text-slate-200 text-sm truncate">
                                  <span 
                                    onClick={() => {
                                      setFacModalId(null);
                                      onSelectSchool && onSelectSchool(trip.sekolahId);
                                    }}
                                    className="font-bold text-slate-200 text-sm truncate hover:text-indigo-400 cursor-pointer transition-colors hover:underline"
                                    title="Lihat detail sekolah"
                                  >
                                    {tripSchool ? tripSchool.nama_sekolah : `NPSN ${trip.sekolahId}`}
                                  </span>
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium">
                                  Kunjungan ke-{trip.kunjunganKe || '?'} • Durasi {trip.durasiHari || '?'} Hari
                                </p>
                              </div>
                              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${st.color}`}>
                                {st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2.5 pt-2 border-t border-slate-850/40 text-[10px] text-slate-500 font-mono">
                              <span>📅 {trip.tanggalMulai} s/d {trip.tanggalSelesai}</span>
                            </div>
                            {ap && (
                              <div className={`mt-2 text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${ap.color} ${ap.bg}`}>
                                {ap.label}{trip.approvedBy ? ` oleh ${trip.approvedBy}` : ''}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* Detailed Payroll Eligibility Modal */}
      {payrollDetailModal && (() => {
        const { user, month } = payrollDetailModal;
        const details = getUserPayrollStatus(user, month);
        const hasUnpaidReady = details.parts.some(p => p.eligible && !p.isPaid);

        return createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
              
              {/* Close Button */}
              <button 
                onClick={() => setPayrollDetailModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white transition-colors border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Header */}
              <div className="border-b border-slate-800 pb-4 mb-4">
                <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Detail Kelayakan Honor
                </span>
                <h3 className="text-lg font-extrabold text-white mt-2">{user.nama}</h3>
                <div className="flex gap-2.5 items-center mt-1 text-[11px] text-slate-400 font-medium">
                  <span>Jabatan: <strong>{user.jabatanTim}</strong></span>
                  <span>•</span>
                  <span>Bulan Ke: <strong>{month}</strong></span>
                </div>
              </div>

              {/* Detail Content (Scrollable if needed) */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-slate-305">
                
                {/* Pokok Rate info */}
                <div className="flex justify-between items-center bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Honor Pokok Bulanan</span>
                    <span className="text-sm font-extrabold text-white mt-0.5 block">Rp {details.baseMonthly.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">Skema Potongan</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Pajak {settings.deductionTaxPct || 15}% • Lembaga {settings.deductionLembagaPct || 10}% • Flat Rp {(details.adminFlat || 100000).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Subtitle */}
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Status Kelayakan per Komponen Honorarium
                </div>

                {/* Components Checklist */}
                <div className="space-y-3">
                  {details.parts.map((part) => {
                    const isPartPaid = part.isPaid;
                    const isPartEligible = part.eligible;
                    
                    return (
                      <div key={part.id} className={`p-4 rounded-2xl border ${
                        isPartPaid 
                          ? 'border-emerald-500/20 bg-emerald-500/5' 
                          : isPartEligible
                          ? 'border-amber-500/20 bg-amber-500/5'
                          : 'border-slate-850 bg-slate-950/20'
                      } space-y-3`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-white block">{part.name}</span>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                              Nilai Kotor: Rp {part.gross.toLocaleString('id-ID')}
                            </span>
                          </div>
                          
                          {/* Eligibility Badge */}
                          <div className="flex items-center gap-1.5">
                            {isPartPaid ? (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Lunas
                              </span>
                            ) : isPartEligible ? (
                              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 animate-pulse" /> Layak
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium bg-slate-905 px-2 py-0.5 rounded border border-slate-850 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Belum Layak
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Deductions Breakdown */}
                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900/60 text-[9px] text-slate-400 grid grid-cols-2 gap-1.5 font-mono">
                          <div>Pajak: Rp {part.tax.toLocaleString('id-ID')}</div>
                          <div>Lembaga: Rp {part.lembaga.toLocaleString('id-ID')}</div>
                          <div>Admin: Rp {part.admin.toLocaleString('id-ID')}</div>
                          <div className="col-span-2 pt-1 border-t border-dashed border-slate-900/60 text-[10px] font-bold text-emerald-400">
                            Penerimaan Bersih: Rp {part.net.toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Conditions Checklist */}
                        <div className="text-[10px] pt-1 space-y-1.5">
                          <span className="text-slate-500 font-semibold block text-[9px] uppercase tracking-wider">Syarat Kelayakan:</span>
                          
                          {part.id === 'part1' && (
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                details.reportFinished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                              }`}>
                                {details.reportFinished ? '✓' : '✗'}
                              </span>
                              <span className="text-slate-300">
                                Laporan bulanan PDF disetujui
                              </span>
                            </div>
                          )}

                          {part.id === 'part2' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  details.pctProgress50 >= 0.75 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                                }`}>
                                  {details.pctProgress50 >= 0.75 ? '✓' : '✗'}
                                </span>
                                <span className="text-slate-300">
                                  Min. 75% sekolah progres &ge; 50% ({details.binProgress50}/{details.totalBinaan} sekolah, {Math.round(details.pctProgress50 * 100)}%)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  details.allProgress50DocsUploaded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                                }`}>
                                  {details.allProgress50DocsUploaded ? '✓' : '✗'}
                                </span>
                                <span className="text-slate-300">
                                  Seluruh laporan mingguan, bulanan, & progres 50% diunggah
                                </span>
                              </div>
                            </div>
                          )}

                          {part.id === 'part3' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  details.pctProgress100 >= 0.90 ? 'bg-emerald-500/10 text-emerald-405' : 'bg-rose-500/10 text-rose-450'
                                }`}>
                                  {details.pctProgress100 >= 0.90 ? '✓' : '✗'}
                                </span>
                                <span className="text-slate-300">
                                  Min. 90% sekolah progres 100% ({details.binProgress100}/{details.totalBinaan} sekolah, {Math.round(details.pctProgress100 * 100)}%)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  details.allProgress100DocsUploaded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-450'
                                }`}>
                                  {details.allProgress100DocsUploaded ? '✓' : '✗'}
                                </span>
                                <span className="text-slate-300">
                                  Seluruh laporan mingguan, bulanan, & progres 100% diunggah
                                </span>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="border-t border-slate-800 pt-4 mt-4 flex gap-3">
                <button
                  onClick={() => setPayrollDetailModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border-0"
                >
                  Tutup
                </button>
                {hasUnpaidReady && (
                  <button
                    onClick={() => {
                      setPayrollDetailModal(null);
                      onViewChange('bayar-honor');
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-650/10 flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          </div>,
          document.body
        );
      })()}

      </div>
      )}
    </div>
  );
}
