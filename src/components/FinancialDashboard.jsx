import React, { useState } from 'react';
import { CircleDollarSign, Plus, Check, Trash2, Receipt, ArrowUpRight, TrendingUp, AlertCircle, FileCheck, CheckCircle } from 'lucide-react';

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
  onPayTrip 
}) {
  const [activeTab, setActiveTab] = useState('recap'); // 'recap' | 'payroll' | 'trips'
  const [isAddingAtk, setIsAddingAtk] = useState(false);
  
  const [atkForm, setTaskForm] = useState({
    deskripsi: '',
    jumlah: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  const isAdministrasi = activeUser.jabatanTim === 'Tenaga Administrasi';
  const isSuperAdmin = activeUser.role === 'admin';
  const isAuthorized = isAdministrasi || isSuperAdmin;

  // BASE RATES DEFINITIONS
  const BASE_RATES = {
    'Ketua Tim': { baseMonthly: 7000000, totalContract: 42000000, fixedPct: 0.5, outputPct: 0.25, outcomePct: 0.25 },
    'Koordinator': { baseMonthly: 6000000, totalContract: 36000000, fixedPct: 0.5, outputPct: 0.25, outcomePct: 0.25 },
    'Fasilitator': { baseMonthly: 5000000, totalContract: 30000000, fixedPct: 0.7, outputPct: 0.2, outcomePct: 0.1 },
    'Tenaga Administrasi': { baseMonthly: 5000000, totalContract: 30000000, fixedPct: 1.0, outputPct: 0, outcomePct: 0 }
  };

  const DINAS_RATES = {
    'Fasilitator': 2500000, // Rp 500k/day * 5 days
    'Koordinator': 2400000  // Rp 600k/day * 4 days
  };

  // 1. CALCULATE TOTAL SPENDING
  const totalAtk = expenses.filter(e => e.kategori === 'atk').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalHonor = expenses.filter(e => e.kategori === 'honor').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalDinas = expenses.filter(e => e.kategori === 'dinas').reduce((acc, curr) => acc + curr.jumlah, 0);
  const grandTotal = totalAtk + totalHonor + totalDinas;

  // Percentage Calculations for Chart
  const pctAtk = grandTotal > 0 ? Math.round((totalAtk / grandTotal) * 100) : 0;
  const pctHonor = grandTotal > 0 ? Math.round((totalHonor / grandTotal) * 100) : 0;
  const pctDinas = grandTotal > 0 ? Math.round((totalDinas / grandTotal) * 100) : 0;

  // 2. PAYROLL ELIGIBILITY CALCULATION FOR A USER
  const getUserPayrollStatus = (user) => {
    const rates = BASE_RATES[user.jabatanTim] || { baseMonthly: 0, totalContract: 0, fixedPct: 0, outputPct: 0, outcomePct: 0 };
    const userReports = reports.filter(r => r.userId === user.id);
    const userPayments = payments.filter(p => p.userId === user.id);

    // Find supervised schools
    let mySchools = [];
    if (user.jabatanTim === 'Fasilitator') {
      mySchools = schools.filter(s => s.fasilitatorId === user.id);
    } else if (user.jabatanTim === 'Koordinator') {
      mySchools = schools.filter(s => s.fasilitatorId); // binaan schools
    } else {
      mySchools = schools; // Ketua Tim oversees all
    }

    const totalBinaan = mySchools.length;
    const binProgress50 = mySchools.filter(s => s.progres_fisik >= 50).length;
    const binProgress100 = mySchools.filter(s => s.progres_fisik === 100).length;

    // Check if reports are fully reviewed
    const allReports50Reviewed = totalBinaan > 0 && mySchools.every(s => 
      s.dokumen_mingguan === 'direviu' && 
      s.dokumen_bulanan === 'direviu' && 
      s.dokumen_progres_50 === 'direviu'
    );

    const allReports100Reviewed = totalBinaan > 0 && mySchools.every(s => 
      s.dokumen_mingguan === 'direviu' && 
      s.dokumen_bulanan === 'direviu' && 
      s.dokumen_progres_100 === 'direviu'
    );

    // Dynamic Criteria Checks
    // Output: 75% schools >= 50% AND reports reviewed
    const pct50 = totalBinaan > 0 ? (binProgress50 / totalBinaan) : 0;
    const outputEligible = totalBinaan > 0 && pct50 >= 0.75 && allReports50Reviewed;
    const outputReason = `Sekolah >= 50%: ${binProgress50}/${totalBinaan} (${Math.round(pct50*100)}%), Dokumen direviu: ${allReports50Reviewed ? 'YA' : 'BELUM'}`;

    // Outcome: 90% schools = 100% AND reports reviewed
    const pct100 = totalBinaan > 0 ? (binProgress100 / totalBinaan) : 0;
    const outcomeEligible = totalBinaan > 0 && pct100 >= 0.90 && allReports100Reviewed;
    const outcomeReason = `Sekolah 100%: ${binProgress100}/${totalBinaan} (${Math.round(pct100*100)}%), Dokumen direviu: ${allReports100Reviewed ? 'YA' : 'BELUM'}`;

    // Fixed Payout: Monthly eligible if User submitted report for that month
    // Note: Tenaga Administrasi can be paid if they submitted any log
    const fixedMonths = [1, 2, 3, 4, 5, 6].map(m => {
      const reportSubmitted = user.jabatanTim === 'Tenaga Administrasi' || userReports.some(r => r.bulanKe === m);
      const isPaid = userPayments.some(p => p.komponen === `tetap_bulan_${m}`);
      
      return {
        month: m,
        eligible: reportSubmitted,
        isPaid,
        amount: rates.baseMonthly * rates.fixedPct
      };
    });

    const outputAmount = rates.totalContract * rates.outputPct;
    const outcomeAmount = rates.totalContract * rates.outcomePct;

    return {
      rates,
      fixedMonths,
      output: {
        eligible: outputEligible,
        isPaid: userPayments.some(p => p.komponen === 'output'),
        amount: outputAmount,
        reason: outputReason
      },
      outcome: {
        eligible: outcomeEligible,
        isPaid: userPayments.some(p => p.komponen === 'outcome'),
        amount: outcomeAmount,
        reason: outcomeReason
      }
    };
  };

  const handleAddAtkSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(atkForm.jumlah);
    if (!atkForm.deskripsi.trim() || isNaN(amountNum) || amountNum <= 0) {
      return alert('Deskripsi dan Jumlah Uang harus valid');
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
    alert('Pengeluaran ATK berhasil dicatat!');
    setTaskForm({ deskripsi: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0] });
    setIsAddingAtk(false);
  };

  const handlePayHonor = (user, component, amount) => {
    if (!isAuthorized) return alert('Anda tidak memiliki akses otorisasi pembayaran');
    if (window.confirm(`Konfirmasi pembayaran "${component.toUpperCase()}" untuk ${user.nama} sebesar Rp ${amount.toLocaleString('id-ID')}?`)) {
      
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
        deskripsi: `Pembayaran Honor ${component.replace('tetap_bulan_', 'Tetap Bulan ')} - ${user.nama}`,
        jumlah: amount,
        tanggal: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      onAddPayment(newPayment, newExpense);
      alert('Pembayaran honor berhasil dicatat dan masuk rekap pengeluaran!');
    }
  };

  const handlePayTripClaim = (trip) => {
    if (!isAuthorized) return alert('Anda tidak memiliki akses otorisasi pembayaran');
    const amount = DINAS_RATES[trip.userRoleTim] || 2000000;
    const targetSchool = schools.find(s => s.npsn === trip.sekolahId);
    
    if (window.confirm(`Konfirmasi pembayaran klaim Uang Harian Perjalanan Dinas untuk ${getFasilitatorName(trip.userId)} sebesar Rp ${amount.toLocaleString('id-ID')}?`)) {
      
      const newExpense = {
        id: `exp-dinas-${Date.now()}`,
        kategori: 'dinas',
        deskripsi: `Uang Perjalanan Dinas ${trip.userRoleTim} (${trip.laporanHasil.substring(0,25)}...) - ${getFasilitatorName(trip.userId)} ke ${targetSchool ? targetSchool.nama_sekolah : 'Sekolah'}`,
        jumlah: amount,
        tanggal: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      onPayTrip(trip.id, newExpense);
      alert('Klaim perjalanan dinas berhasil dibayarkan!');
    }
  };

  const getFasilitatorName = (id) => {
    const user = users.find(u => u.id === id);
    return user ? user.nama : 'Anggota';
  };

  // Filters for trips payments
  const unpaidTrips = trips.filter(t => !t.isPaid); // add isPaid key on trips
  const paidTrips = trips.filter(t => t.isPaid);

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <CircleDollarSign className="w-6 h-6 text-indigo-400" /> Administrasi & Keuangan
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Menu khusus Tenaga Administrasi untuk mencatat pengeluaran ATK, memantau pengeluaran honorarium, dan membayar klaim dinas.
          </p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex border-b border-slate-800 gap-2 select-none">
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
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Pantau & Bayar Honorarium
        </button>
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
      </div>

      {/* TAB 1: REKAPITULASI PENGELUARAN */}
      {activeTab === 'recap' && (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pengeluaran</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-white mt-1">Rp {grandTotal.toLocaleString('id-ID')}</h3>
              <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Pengeluaran ATK</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-teal-400 mt-1">Rp {totalAtk.toLocaleString('id-ID')}</h3>
              <span className="text-[9px] text-slate-500 font-semibold block mt-1">{pctAtk}% dari total biaya</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Pengeluaran Honor</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-indigo-400 mt-1">Rp {totalHonor.toLocaleString('id-ID')}</h3>
              <span className="text-[9px] text-slate-500 font-semibold block mt-1">{pctHonor}% dari total biaya</span>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Biaya Perjalanan Dinas</span>
              <h3 className="text-xl md:text-2xl font-extrabold text-amber-400 mt-1">Rp {totalDinas.toLocaleString('id-ID')}</h3>
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
                <p className="text-xs text-slate-500 italic text-center py-12">Belum ada data pengeluaran masuk</p>
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
                      {expenses.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal)).map((exp) => (
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
                                  onClick={() => {
                                    if (window.confirm('Hapus transaksi pengeluaran ATK ini?')) {
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
            {users.filter(u => u.jabatanTim !== 'Super Admin').map((user) => {
              const status = getUserPayrollStatus(user);

              return (
                <div key={user.id} className="bg-slate-950 border border-slate-850 rounded-2xl p-5 space-y-4">
                  
                  {/* User Profile Title */}
                  <div className="flex justify-between items-center border-b border-slate-900 pb-3 flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{user.nama}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Jabatan Tim: {user.jabatanTim} • Pokok: Rp {status.rates.baseMonthly.toLocaleString('id-ID')}/bln</p>
                    </div>
                  </div>

                  {/* Components breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs select-none">
                    
                    {/* Fixed Component */}
                    <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-xl space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <span className="font-bold text-indigo-400">Honor Tetap</span>
                        <span className="text-[10px] font-semibold text-slate-500">{(status.rates.fixedPct*100)}% Pokok/bln</span>
                      </div>
                      
                      <div className="space-y-2">
                        {status.fixedMonths.map((m) => (
                          <div key={m.month} className="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                            <span className="font-medium text-slate-400">Bulan ke-{m.month}</span>
                            <div className="flex items-center gap-2">
                              {m.isPaid ? (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> Dibayar</span>
                              ) : m.eligible ? (
                                <button
                                  onClick={() => handlePayHonor(user, `tetap_bulan_${m.month}`, m.amount)}
                                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold cursor-pointer"
                                >
                                  Bayar Rp{(m.amount/1000).toLocaleString('id-ID')}k
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-600 font-medium italic">Menunggu Laporan</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Output Component */}
                    <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                          <span className="font-bold text-indigo-400">Honor Output</span>
                          <span className="text-[10px] font-semibold text-slate-500">{(status.rates.outputPct*100)}% Kontrak</span>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 text-[10px] text-slate-400 leading-relaxed">
                          <span className="block font-bold text-slate-300">Kriteria Kelayakan:</span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            <li>75% sekolah dampingan progres &ge; 50%</li>
                            <li>Laporan 50% direviu Koordinator</li>
                          </ul>
                        </div>
                        <div className="text-[10px] text-slate-500 bg-slate-950/20 border border-slate-900 rounded-lg p-2 leading-relaxed">
                          <strong>Kondisi:</strong> {status.output.reason}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-850 mt-4 flex items-center justify-between">
                        <span className="font-bold text-slate-300">Rp {status.output.amount.toLocaleString('id-ID')}</span>
                        {status.output.isPaid ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> Dibayar</span>
                        ) : status.output.eligible ? (
                          <button
                            onClick={() => handlePayHonor(user, 'output', status.output.amount)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Bayar Honor
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium italic flex items-center gap-1"><AlertCircle className="w-3 h-3 text-slate-600" /> Belum Layak</span>
                        )}
                      </div>
                    </div>

                    {/* Outcome Component */}
                    <div className="bg-slate-900/40 p-4 border border-slate-850 rounded-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                          <span className="font-bold text-indigo-400">Honor Outcome</span>
                          <span className="text-[10px] font-semibold text-slate-500">{(status.rates.outcomePct*100)}% Kontrak</span>
                        </div>
                        <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 text-[10px] text-slate-400 leading-relaxed">
                          <span className="block font-bold text-slate-300">Kriteria Kelayakan:</span>
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            <li>90% sekolah dampingan progres 100%</li>
                            <li>Laporan 100% direviu Koordinator</li>
                          </ul>
                        </div>
                        <div className="text-[10px] text-slate-500 bg-slate-950/20 border border-slate-900 rounded-lg p-2 leading-relaxed">
                          <strong>Kondisi:</strong> {status.outcome.reason}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-850 mt-4 flex items-center justify-between">
                        <span className="font-bold text-slate-300">Rp {status.outcome.amount.toLocaleString('id-ID')}</span>
                        {status.outcome.isPaid ? (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> Dibayar</span>
                        ) : status.outcome.eligible ? (
                          <button
                            onClick={() => handlePayHonor(user, 'outcome', status.outcome.amount)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Bayar Honor
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium italic flex items-center gap-1"><AlertCircle className="w-3 h-3 text-slate-600" /> Belum Layak</span>
                        )}
                      </div>
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
                      <button
                        onClick={() => handlePayTripClaim(trip)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
                      >
                        Bayar Klaim Dinas
                      </button>
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

    </div>
  );
}
