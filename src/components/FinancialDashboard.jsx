import React, { useState, useEffect } from 'react';
import { CircleDollarSign, Plus, Check, Trash2, Receipt, ArrowUpRight, TrendingUp, AlertCircle, FileCheck, CheckCircle, Pencil, X } from 'lucide-react';

export default function FinancialDashboard({ 
  users, 
  schools, 
  reports, 
  trips, 
  expenses, 
  payments, 
  activeUser, 
  onAddExpense, 
  onDeleteExpense, 
  onAddPayment, 
  onPayTrip,
  settings,
  onUpdateSettings,
  onUpdateUsers,
  onUpdateSettingsAndUsers,
  activeView
}) {
  const [activeTab, setActiveTab] = useState(() => {
    if (activeView === 'pantau-honor' || activeView === 'bayar-honor') {
      return 'payroll';
    } else if (activeView === 'keuangan') {
      return 'recap';
    } else if (activeView === 'settings-anggaran') {
      return 'settings';
    }
    return 'recap';
  }); // 'recap' | 'payroll' | 'trips' | 'settings'
  const [isAddingAtk, setIsAddingAtk] = useState(false);
  const [localUsers, setLocalUsers] = useState([]);

  useEffect(() => {
    if (users) {
      setLocalUsers(users);
    }
  }, [users]);

  const [financialSettings, setFinancialSettings] = useState({
    totalProjectContract: settings?.totalProjectContract || 1500000000,
    honorKetuaTim: settings?.honorKetuaTim || 7000000,
    honorKoordinator: settings?.honorKoordinator || 6000000,
    honorFasilitator: settings?.honorFasilitator || 5000000,
    honorAdministrasi: settings?.honorAdministrasi || 5000000,
    deductionTaxPct: settings?.deductionTaxPct || 15,
    deductionLembagaPct: settings?.deductionLembagaPct || 10,
    biayaOperasional: settings?.biayaOperasional || 0
  });

  useEffect(() => {
    setFinancialSettings({
      totalProjectContract: settings?.totalProjectContract || 1500000000,
      honorKetuaTim: settings?.honorKetuaTim || 7000000,
      honorKoordinator: settings?.honorKoordinator || 6000000,
      honorFasilitator: settings?.honorFasilitator || 5000000,
      honorAdministrasi: settings?.honorAdministrasi || 5000000,
      deductionTaxPct: settings?.deductionTaxPct || 15,
      deductionLembagaPct: settings?.deductionLembagaPct || 10,
      biayaOperasional: settings?.biayaOperasional || 0
    });
  }, [settings]);

  const formatNumberWithDots = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseNumberFromDots = (str) => {
    if (!str) return 0;
    const cleaned = str.toString().replace(/\./g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleSaveFinancialSettings = (e) => {
    e.preventDefault();
    if (onUpdateSettingsAndUsers) {
      onUpdateSettingsAndUsers(
        {
          ...settings,
          ...financialSettings
        },
        localUsers
      );
    } else {
      onUpdateSettings({
        ...settings,
        ...financialSettings
      });
      if (onUpdateUsers) {
        onUpdateUsers(localUsers);
      }
    }
    window.showAlert('Pengaturan anggaran dan honorarium berhasil disimpan!');
  };
  
  const [atkForm, setTaskForm] = useState({
    deskripsi: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  const isAdministrasi = activeUser.jabatanTim === 'Tenaga Administrasi';
  const isSuperAdmin = activeUser.role === 'admin' || activeUser.jabatanTim === 'Super Admin';
  const isAuthorized = isAdministrasi || isSuperAdmin;

  useEffect(() => {
    if (activeView === 'pantau-honor' || activeView === 'bayar-honor') {
      setActiveTab('payroll');
    } else if (activeView === 'keuangan') {
      setActiveTab('recap');
    } else if (activeView === 'settings-anggaran') {
      setActiveTab('settings');
    }
  }, [activeView]);

  const DINAS_RATES = {
    'Fasilitator': 2500000, // Rp 500k/day * 5 days
    'Koordinator': 2400000  // Rp 600k/day * 4 days
  };

  // 1. CALCULATE TOTAL SPENDING
  const totalAtk = (expenses || []).filter(e => e && e.kategori === 'atk').reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const totalHonor = (expenses || []).filter(e => e && e.kategori === 'honor').reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const totalDinas = (expenses || []).filter(e => e && e.kategori === 'dinas').reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  
  const biayaNonOperasional = totalHonor;
  const biayaOperasional = settings?.biayaOperasional !== undefined && settings?.biayaOperasional !== null 
    ? Number(settings.biayaOperasional) 
    : (totalAtk + totalDinas);
  const grandTotal = biayaOperasional + biayaNonOperasional;

  // Percentage Calculations for Chart
  const pctOperasional = grandTotal > 0 ? Math.round((biayaOperasional / grandTotal) * 100) : 0;
  const pctNonOperasional = grandTotal > 0 ? Math.round((biayaNonOperasional / grandTotal) * 100) : 0;
  const pctAtk = grandTotal > 0 ? Math.round((totalAtk / grandTotal) * 100) : 0;
  const pctHonor = grandTotal > 0 ? Math.round((totalHonor / grandTotal) * 100) : 0;
  const pctDinas = grandTotal > 0 ? Math.round((totalDinas / grandTotal) * 100) : 0;

  // 2. PAYROLL ELIGIBILITY CALCULATION FOR A USER
  const getUserPayrollStatus = (user, month) => {
    if (!user) return { baseMonthly: 0, parts: [] };
    const jabatanSafe = typeof user.jabatanTim === 'string' ? user.jabatanTim.replace(' ', '') : '';
    const baseMonthly = (user.jabatanTim === 'Tenaga Administrasi' ? settings?.honorAdministrasi : settings?.[`honor${jabatanSafe}`]) || {
      'Ketua Tim': 7000000,
      'Koordinator': 6000000,
      'Fasilitator': 5000000,
      'Tenaga Administrasi': 5000000
    }[user.jabatanTim] || 5000000;

    const taxPct = user.taxPct !== undefined && user.taxPct !== null ? Number(user.taxPct) : Number(settings?.deductionTaxPct ?? 15);
    const lembagaPct = Number(settings?.deductionLembagaPct ?? 10);

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
    const reportFinished = 
      user.jabatanTim === 'Tenaga Administrasi' || 
      ((user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') 
        ? !!userReport 
        : (userReport && userReport.status === 'approved'));

    // Time restriction: payment is allowed only after the month has been completed
    const projectStart = settings?.projectStartDate || '2026-06-12';
    const start = new Date(projectStart);
    start.setMonth(start.getMonth() + Number(month));
    const targetDateStr = start.toISOString().split('T')[0];
    const todayVal = new Date(settings?.simulatedToday || new Date().toISOString().split('T')[0]);
    const targetVal = new Date(targetDateStr);
    const isTimeReached = todayVal >= targetVal;

    // Overseen schools progress
    let mySchools = [];
    if (user.jabatanTim === 'Fasilitator') {
      mySchools = schools.filter(s => s.fasilitatorId === user.id);
    } else if (user.jabatanTim === 'Koordinator') {
      const myFacilitators = users.filter(u => u.jabatanTim === 'Fasilitator' && u.coordinatorId === user.id).map(u => u.id);
      mySchools = schools.filter(s => myFacilitators.includes(s.fasilitatorId));
    } else {
      mySchools = schools; // Ketua Tim & Admin supervise all
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
      if (gross === 0) return { tax: 0, lembaga: 0, net: 0 };
      const tax = Math.round(gross * (taxPct / 100));
      const lembaga = Math.round(gross * (lembagaPct / 100));
      const net = Math.max(0, gross - tax - lembaga);
      return { tax, lembaga, net };
    };

    return {
      baseMonthly,
      totalBinaan,
      binProgress50,
      pctProgress50,
      allProgress50DocsUploaded,
      binProgress100,
      pctProgress100,
      allProgress100DocsUploaded,
      taxPct,
      parts: [
        {
          id: 'part1',
          name: user.jabatanTim === 'Tenaga Administrasi' ? 'Honor Bulanan (100%)' : `Bagian 1 (Laporan Bulanan - ${pctPart1 * 100}%)`,
          gross: grossPart1,
          eligible: reportFinished && isTimeReached,
          isPaid: payments.some(p => p.userId === user.id && (p.komponen === `tetap_bulan_${month}_part1` || p.komponen === `tetap_bulan_${month}`)),
          conditions: user.jabatanTim === 'Tenaga Administrasi' 
            ? `Telah melewati Bulan ke-${month}` 
            : (user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator')
            ? `Laporan bulanan PDF diunggah & telah melewati Bulan ke-${month}`
            : `Laporan bulanan PDF disetujui (Approved) & telah melewati Bulan ke-${month}`,
          key: `tetap_bulan_${month}_part1`,
          ...getDeductionDetails(grossPart1)
        },
        {
          id: 'part2',
          name: `Bagian 2 (Target 50% - ${pctPart2 * 100}%)`,
          gross: grossPart2,
          eligible: part2Eligible && isTimeReached,
          isPaid: payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part2`),
          conditions: `75% sekolah binaan (${binProgress50}/${totalBinaan}, ${Math.round(pctProgress50 * 100)}%) mencapai progres >= 50% & seluruh laporan mingguan, bulanan, progres 50% diunggah & telah melewati Bulan ke-${month}`,
          key: `tetap_bulan_${month}_part2`,
          ...getDeductionDetails(grossPart2)
        },
        {
          id: 'part3',
          name: `Bagian 3 (Target 100% - ${pctPart3 * 100}%)`,
          gross: grossPart3,
          eligible: part3Eligible && isTimeReached,
          isPaid: payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part3`),
          conditions: `90% sekolah binaan (${binProgress100}/${totalBinaan}, ${Math.round(pctProgress100 * 100)}%) mencapai progres 100% & seluruh laporan mingguan, bulanan, progres 100% diunggah & telah melewati Bulan ke-${month}`,
          key: `tetap_bulan_${month}_part3`,
          ...getDeductionDetails(grossPart3)
        }
      ].filter(p => p.gross > 0)
    };
  };

  const handleAddAtkSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(atkForm.jumlah);
    if (!atkForm.deskripsi.trim() || isNaN(amountNum) || amountNum <= 0) {
      return window.showAlert('Deskripsi dan Jumlah Uang harus valid');
    }

    const newExpense = {
      id: `exp-${Date.now()}`,
      kategori: 'atk',
      deskripsi: atkForm.deskripsi,
      jumlah: amountNum,
      tanggal: atkForm.tanggal,
      createdAt: new Date().toISOString()
    };

    onAddExpense(newExpense);
    window.showAlert('Pengeluaran ATK berhasil dicatat!');
    setTaskForm({ deskripsi: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0] });
    setIsAddingAtk(false);
  };

  const handlePayHonor = async (user, component, grossAmount, netAmount, taxAmount, lembagaAmount) => {
    if (!isAuthorized) return window.showAlert('Anda tidak memiliki akses otorisasi pembayaran');
    
    const labelComponent = component
      .replace('tetap_bulan_', 'Bulan Ke-')
      .replace('_part1', ' Bagian 1 (Laporan)')
      .replace('_part2', ' Bagian 2 (Target 50%)')
      .replace('_part3', ' Bagian 3 (Target 100%)');

    const userTaxPct = user && user.taxPct !== undefined && user.taxPct !== null ? Number(user.taxPct) : Number(settings?.deductionTaxPct ?? 15);

    const confirmMsg = `Konfirmasi pembayaran honor "${labelComponent}" untuk ${user?.nama || 'Anggota'}:
    
- Honor Kotor: Rp ${grossAmount.toLocaleString('id-ID')}
- Potongan Pajak (${userTaxPct}%): Rp ${taxAmount.toLocaleString('id-ID')}
- Potongan Lembaga (${settings?.deductionLembagaPct || 10}%): Rp ${lembagaAmount.toLocaleString('id-ID')}
-----------------------------------------------------------
- Bersih Dibayarkan: Rp ${netAmount.toLocaleString('id-ID')}

Apakah Anda yakin ingin memproses pembayaran ini?`;

    if (await window.showConfirm(confirmMsg)) {
      const paymentId = `payment-${user.id}-${component}`;
      const newPayment = {
        id: paymentId,
        userId: user.id,
        komponen: component,
        isPaid: true,
        paidAt: new Date().toISOString()
      };

      const newExpense = {
        id: `exp-honor-${Date.now()}`,
        kategori: 'honor',
        deskripsi: `Honor ${labelComponent} - ${user.nama} (Kotor: Rp ${grossAmount.toLocaleString('id-ID')}, Pajak: Rp ${taxAmount.toLocaleString('id-ID')}, Lembaga: Rp ${lembagaAmount.toLocaleString('id-ID')}. Bersih: Rp ${netAmount.toLocaleString('id-ID')})`,
        jumlah: grossAmount, // gross amount for budget absorption
        tanggal: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      onAddPayment(newPayment, newExpense);
      window.showAlert('Pembayaran honor berhasil dicatat dan masuk rekap pengeluaran!');
    }
  };

  const handlePayTripClaim = async (trip) => {
    if (!isAuthorized) return window.showAlert('Anda tidak memiliki akses otorisasi pembayaran');
    const amount = DINAS_RATES[trip.userRoleTim] || 2000000;
    const targetSchool = schools.find(s => s.npsn === trip.sekolahId);
    
    if (await window.showConfirm(`Konfirmasi pembayaran klaim Uang Harian Perjalanan Dinas untuk ${getFasilitatorName(trip.userId)} sebesar Rp ${amount.toLocaleString('id-ID')}?`)) {
      
      const newExpense = {
        id: `exp-dinas-${Date.now()}`,
        kategori: 'dinas',
        deskripsi: `Uang Perjalanan Dinas ${trip.userRoleTim} (${trip.laporanHasil.substring(0,25)}...) - ${getFasilitatorName(trip.userId)} ke ${targetSchool ? targetSchool.nama_sekolah : 'Sekolah'}`,
        jumlah: amount,
        tanggal: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      onPayTrip(trip.id, newExpense);
      window.showAlert('Klaim perjalanan dinas berhasil dibayarkan!');
    }
  };

  const getFasilitatorName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.nama : 'Anggota';
  };

  // Filters for trips payments
  const unpaidTrips = trips.filter(t => !t.isPaid); // add isPaid key on trips
  const paidTrips = trips.filter(t => t.isPaid);

  const showTabsControl = activeView !== 'bayar-honor' && activeView !== 'settings-anggaran';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tabs Control */}
      {showTabsControl && (
        <div className="flex border-b border-slate-800 gap-2 select-none">
          {(activeView === 'keuangan' || activeView === 'pantau-honor' || !activeView) && (
            <button
              onClick={() => setActiveTab('recap')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'recap'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Rekapitulasi Pengeluaran
            </button>
          )}
          {(activeView === 'keuangan' || activeView === 'pantau-honor' || activeView === 'bayar-honor' || !activeView) && (
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'payroll'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSuperAdmin ? 'Pantau & Bayar Honorarium' : 'Pantau Honorarium'}
            </button>
          )}
          {(activeView === 'keuangan' || activeView === 'pantau-honor' || !activeView) && (
            <button
              onClick={() => setActiveTab('trips')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'trips'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Klaim Perjalanan Dinas ({unpaidTrips.length})
            </button>
          )}
          {activeView !== 'keuangan' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Pengaturan Anggaran
            </button>
          )}
        </div>
      )}

      {/* TAB 1: REKAPITULASI PENGELUARAN */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pengeluaran</span>
                <h3 className="text-xl md:text-2xl font-extrabold text-white mt-1">Rp {grandTotal.toLocaleString('id-ID')}</h3>
              </div>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pengeluaran ATK</span>
                <h3 className="text-xl md:text-2xl font-extrabold text-teal-400 mt-1">Rp {totalAtk.toLocaleString('id-ID')}</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-semibold block mt-1">{pctAtk}% dari total biaya</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pengeluaran Honor</span>
                <h3 className="text-xl md:text-2xl font-extrabold text-indigo-400 mt-1">Rp {totalHonor.toLocaleString('id-ID')}</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-semibold block mt-1">{pctHonor}% dari total biaya</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Biaya Perjalanan Dinas</span>
                <h3 className="text-xl md:text-2xl font-extrabold text-amber-400 mt-1">Rp {totalDinas.toLocaleString('id-ID')}</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-semibold block mt-1">{pctDinas}% dari total biaya</span>
            </div>
          </div>

          {/* Visual chart & ATK input form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Proporsi Biaya */}
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 select-none space-y-4">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <TrendingUp className="w-4.5 h-4.5 text-indigo-400" /> Proporsi Pengeluaran Proyek
              </h3>
              
              {grandTotal === 0 ? (
                <p className="text-xs text-slate-505 italic text-center py-12">Belum ada data pengeluaran masuk</p>
              ) : (
                <div className="space-y-4">
                  {/* Progress Flex-Bar */}
                  <div className="w-full bg-slate-850 h-6 rounded-xl overflow-hidden flex">
                    {totalAtk > 0 && <div className="bg-teal-500 h-full" style={{ width: `${pctAtk}%` }} title="ATK" />}
                    {totalHonor > 0 && <div className="bg-indigo-500 h-full" style={{ width: `${pctHonor}%` }} title="Honor" />}
                    {totalDinas > 0 && <div className="bg-amber-500 h-full" style={{ width: `${pctDinas}%` }} title="Perjalanan Dinas" />}
                  </div>

                  {/* Legend list */}
                  <div className="space-y-2.5 text-xs text-slate-400">
                    <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 bg-teal-500 rounded-full"></span> ATK (Kertas, Tinta, dll.)
                      </span>
                      <span className="font-bold text-slate-200">{pctAtk}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span> Honor Pelaksana
                      </span>
                      <span className="font-bold text-slate-200">{pctHonor}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-xl border border-slate-850">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Perjalanan Dinas
                      </span>
                      <span className="font-bold text-slate-200">{pctDinas}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Manual ATK */}
            <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-slate-200 text-sm flex items-center justify-between gap-1.5 border-b border-slate-800 pb-2 mb-4">
                  <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4 text-indigo-400" /> Pencatatan Manual Biaya ATK</span>
                  {!isAddingAtk && isAuthorized && (
                    <button 
                      onClick={() => setIsAddingAtk(true)}
                      className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Catat ATK
                    </button>
                  )}
                </h3>

                {isAddingAtk && (
                  <form onSubmit={handleAddAtkSubmit} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3 mb-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Keterangan Pengeluaran ATK</label>
                        <input
                          type="text"
                          value={atkForm.deskripsi}
                          onChange={(e) => setTaskForm({ ...atkForm, deskripsi: e.target.value })}
                          placeholder="Contoh: Pembelian tinta warna printer HP"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Jumlah Uang (Rp)</label>
                        <input
                          type="number"
                          value={atkForm.jumlah}
                          onChange={(e) => setTaskForm({ ...atkForm, jumlah: e.target.value })}
                          placeholder="Jumlah Uang"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-900/60 select-none">
                      <button
                        type="button"
                        onClick={() => setIsAddingAtk(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-900"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Simpan ATK
                      </button>
                    </div>
                  </form>
                )}

                {/* List Expenses Log Table */}
                <div className="overflow-x-auto max-h-[250px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 border-b border-slate-850 text-slate-500 uppercase text-[9px] tracking-wider select-none font-semibold">
                      <tr>
                        <th className="px-4 py-2">Tanggal</th>
                        <th className="px-4 py-2">Kategori</th>
                        <th className="px-4 py-2">Keterangan Transaksi</th>
                        <th className="px-4 py-2 text-right">Jumlah Uang</th>
                        {isAuthorized && <th className="px-4 py-2 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {[...expenses].sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)).map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-900/10">
                          <td className="px-4 py-2 text-slate-400">{exp.tanggal}</td>
                          <td className="px-4 py-2 uppercase font-bold text-[9px]">
                            <span className={`px-1.5 py-0.5 rounded ${
                              exp.kategori === 'atk'
                                ? 'bg-teal-500/10 text-teal-400'
                                : exp.kategori === 'honor'
                                ? 'bg-indigo-500/10 text-indigo-400'
                                : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {exp.kategori}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-medium text-slate-300 truncate max-w-xs">{exp.deskripsi}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-200">Rp {exp.jumlah.toLocaleString('id-ID')}</td>
                          {isAuthorized && (
                            <td className="px-4 py-2 text-right">
                              {exp.kategori === 'atk' && (
                                <button
                                  onClick={async () => {
                                    if (await window.showConfirm('Hapus transaksi pengeluaran ATK ini?')) {
                                      onDeleteExpense(exp.id);
                                    }
                                  }}
                                  className="p-1 rounded bg-slate-950 text-slate-600 hover:text-rose-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={isAuthorized ? 5 : 4} className="px-4 py-8 text-center text-slate-600 italic">
                            Belum ada catatan transaksi pengeluaran
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PAYROLL PANEL */}
      {activeTab === 'payroll' && (
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              Sistem Pembayaran Honorarium Swakelola
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Kalkulasi kelayakan pembayaran (tetap, output, outcome) dilakukan otomatis sesuai butir kelengkapan laporan.</p>
          </div>

          <div className="space-y-6">
            {(users || []).filter(u => u && u.jabatanTim && u.jabatanTim !== 'Super Admin').map((user) => {
              const jabatanSafe = typeof user.jabatanTim === 'string' ? user.jabatanTim.replace(' ', '') : '';
              const baseMonthly = (user.jabatanTim === 'Tenaga Administrasi' ? settings?.honorAdministrasi : settings?.[`honor${jabatanSafe}`]) || {
                'Ketua Tim': 7000000,
                'Koordinator': 6000000,
                'Fasilitator': 5000000,
                'Tenaga Administrasi': 5000000
              }[user.jabatanTim] || 5000000;

              return (
                <div key={user.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                  
                  {/* User Profile Title */}
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{user.nama}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Jabatan Tim: {user.jabatanTim} • Pokok: Rp {baseMonthly.toLocaleString('id-ID')}/bln</p>
                    </div>
                  </div>

                  {/* Monthly breakdown */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Pembayaran per Bulan</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((month) => {
                        const mStatus = getUserPayrollStatus(user, month);
                        return (
                          <div key={month} className="bg-slate-900/40 p-4 border border-slate-850 rounded-xl space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                              <span className="font-bold text-indigo-400">Bulan Ke-{month}</span>
                              <span className="text-[9px] text-slate-500 font-semibold">Total Pokok: Rp {mStatus.baseMonthly.toLocaleString('id-ID')}</span>
                            </div>
                            
                            <div className="space-y-2.5">
                              {mStatus.parts.map((part) => (
                                <div key={part.id} className="bg-slate-950/60 p-3 rounded-lg border border-slate-900 space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="text-xs font-bold text-slate-200 block">{part.name}</span>
                                      <span className="text-[9px] text-slate-500 block leading-normal mt-0.5" title={part.conditions}>
                                        Syarat: {part.conditions}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {part.isPaid ? (
                                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                          <CheckCircle className="w-3.5 h-3.5" /> Lunas
                                        </span>
                                      ) : part.eligible ? (
                                        isSuperAdmin ? (
                                          <button
                                            onClick={() => handlePayHonor(user, part.key, part.gross, part.net, part.tax, part.lembaga)}
                                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold cursor-pointer border-0 shadow"
                                          >
                                            Bayar
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
                                            Siap Dibayar
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[9px] text-slate-600 font-medium italic flex items-center gap-1"><AlertCircle className="w-3 h-3 text-slate-600" /> Belum Layak</span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Deductions detail */}
                                  <div className="pt-2 border-t border-slate-900/60 text-[9px] text-slate-500 grid grid-cols-2 gap-1.5 font-mono">
                                    <div>Kotor: <strong className="text-slate-300">Rp {part.gross.toLocaleString('id-ID')}</strong></div>
                                    <div>Pajak ({mStatus.taxPct}%): <strong className="text-slate-300">Rp {part.tax.toLocaleString('id-ID')}</strong></div>
                                    <div>Lembaga ({settings?.deductionLembagaPct || 10}%): <strong className="text-slate-300">Rp {part.lembaga.toLocaleString('id-ID')}</strong></div>
                                    <div className="col-span-2 pt-1 border-t border-dashed border-slate-900/60 text-xs font-bold text-emerald-600">
                                      Bersih: Rp {part.net.toLocaleString('id-ID')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* TAB 3: TRIPS CLAIMS */}
      {activeTab === 'trips' && (
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm">
              Verifikasi Klaim Uang Harian Perjalanan Dinas
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Daftar perjalanan dinas yang telah diselesaikan pelaksana dan menunggu pembayaran uang harian.</p>
          </div>

          <div className="space-y-4">
            {unpaidTrips.map((trip) => {
              const targetSchool = schools.find(s => s.npsn === trip.sekolahId);
              const amount = DINAS_RATES[trip.userRoleTim] || 2000000;
              const isApproved = trip.statusPersetujuan === 'approved' || trip.statusPersetujuan === undefined;
              const isPending = trip.statusPersetujuan === 'pending';
              const isRejected = trip.statusPersetujuan === 'rejected';

              return (
                <div key={trip.id} className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-slate-200">{getFasilitatorName(trip.userId)}</span>
                      <span className="text-[10px] text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded font-semibold border border-indigo-500/10">
                        {trip.userRoleTim}
                      </span>
                      {isPending && (
                        <span className="text-[9px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold animate-pulse">
                          Pending Approval
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[9px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                          Ditolak
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-300 text-sm">
                      Kunjungan ke-{trip.kunjunganKe} ke {targetSchool ? targetSchool.nama_sekolah : `NPSN ${trip.sekolahId}`}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-normal italic">Laporan: "{trip.laporanHasil}"</p>
                    <div className="flex gap-4 pt-1 text-[10px] text-slate-500 font-semibold">
                      <span>Tanggal Dinas: <strong>{trip.tanggalMulai} s/d {trip.tanggalSelesai}</strong></span>
                      <span>Durasi: <strong>{trip.durasiHari} Hari Kerja</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    <span className="font-bold text-slate-200 text-sm shrink-0">Rp {amount.toLocaleString('id-ID')}</span>
                    {isApproved ? (
                      isSuperAdmin ? (
                        <button
                          onClick={() => handlePayTripClaim(trip)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
                        >
                          Bayar Klaim Dinas
                        </button>
                      ) : (
                        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                          Siap Dibayar
                        </span>
                      )
                    ) : isRejected ? (
                      <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                        Ditolak Super Admin
                      </span>
                    ) : (
                      <div className="flex flex-col items-end gap-1 select-none">
                        <span className="text-[8px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap animate-pulse">
                          Butuh Approval Super Admin
                        </span>
                        <button
                          disabled
                          className="px-3 py-1.5 bg-slate-900 text-slate-600 rounded-xl font-bold text-xs cursor-not-allowed border border-slate-800"
                          title="Perjalanan dinas ini belum disetujui oleh Super Admin"
                        >
                          Bayar Klaim Dinas
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {unpaidTrips.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-8 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                Tidak ada klaim perjalanan dinas baru yang perlu diproses.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PENGATURAN ANGGARAN & HONORARIUM */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2 border-b border-slate-850 pb-3 mb-4">
            Pengaturan Anggaran & Honorarium
          </h3>
          <form onSubmit={handleSaveFinancialSettings} className="space-y-6 flex-1">
            
            {/* GROUP 1: ALOKASI DANA KONTRAK & HONORARIUM */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wider border-b border-slate-900 pb-2">
                Alokasi Dana Proyek & Honorarium Pokok
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">Total Nilai Kontrak Proyek (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-500 select-none">Rp</span>
                    <input
                      type="text"
                      value={formatNumberWithDots(financialSettings.totalProjectContract)}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, totalProjectContract: parseNumberFromDots(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">Biaya Operasional Proyek (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-500 select-none">Rp</span>
                    <input
                      type="text"
                      value={formatNumberWithDots(financialSettings.biayaOperasional)}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, biayaOperasional: parseNumberFromDots(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!isAdministrasi}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">Honor Ketua Tim / Bulan (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-500 select-none">Rp</span>
                    <input
                      type="text"
                      value={formatNumberWithDots(financialSettings.honorKetuaTim)}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, honorKetuaTim: parseNumberFromDots(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">Honor Koordinator / Bulan (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-500 select-none">Rp</span>
                    <input
                      type="text"
                      value={formatNumberWithDots(financialSettings.honorKoordinator)}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, honorKoordinator: parseNumberFromDots(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">Honor Fasilitator / Bulan (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-500 select-none">Rp</span>
                    <input
                      type="text"
                      value={formatNumberWithDots(financialSettings.honorFasilitator)}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, honorFasilitator: parseNumberFromDots(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-350 uppercase tracking-wider mb-1.5">Honor Tenaga Administrasi / Bulan (Rp)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-sm font-semibold text-slate-500 select-none">Rp</span>
                    <input
                      type="text"
                      value={formatNumberWithDots(financialSettings.honorAdministrasi)}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, honorAdministrasi: parseNumberFromDots(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP 2: VARIABEL POTONGAN (DEDUCTIONS) */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-5">
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider border-b border-slate-900 pb-2 flex justify-between items-center">
                <span>Variabel Potongan (Pajak & Lembaga)</span>
                <span className="text-[9px] text-slate-500 font-medium normal-case">Dipotong otomatis dari nilai kotor saat pembayaran</span>
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pajak (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={financialSettings.deductionTaxPct}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, deductionTaxPct: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-rose-500/30 transition-colors shadow-inner"
                      required
                    />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-semibold text-slate-500 select-none">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lembaga (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={financialSettings.deductionLembagaPct}
                      onChange={(e) => setFinancialSettings({ ...financialSettings, deductionLembagaPct: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-slate-100 focus:outline-none focus:border-rose-500/30 transition-colors shadow-inner"
                      required
                    />
                    <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-semibold text-slate-500 select-none">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP 3: POTONGAN PAJAK KUSTOM PER ANGGOTA TIM */}
            <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex justify-between items-center">
                <span>Pajak Kustom Per Anggota Tim</span>
                <span className="text-[9px] text-slate-500 font-medium normal-case">Kosongkan untuk menggunakan tarif pajak default global</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(localUsers || []).filter(u => u && u.jabatanTim && u.jabatanTim !== 'Super Admin').map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-2xl hover:border-slate-800 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">{member.nama}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">{member.jabatanTim}</span>
                    </div>
                    <div className="relative w-28 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={member.taxPct !== undefined && member.taxPct !== null ? member.taxPct : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          setLocalUsers(localUsers.map(u => u && u.id === member.id ? { ...u, taxPct: val } : u));
                        }}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-indigo-500/30 transition-colors font-mono"
                        placeholder="Default"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-500 select-none">%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-sm font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/10 border-0 cursor-pointer"
              >
                Simpan Pengaturan Keuangan
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
