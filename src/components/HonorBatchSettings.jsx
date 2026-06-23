import React, { useState } from 'react';
import { 
  BadgeCheck, 
  Search, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Coins, 
  ShieldCheck, 
  Calendar 
} from 'lucide-react';

export default function HonorBatchSettings({ 
  users, 
  schools, 
  reports, 
  payments, 
  settings, 
  onSetPaymentsStatus 
}) {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedPart, setSelectedPart] = useState('part1'); // 'part1' | 'part2' | 'part3'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // 1. DEDUCTION & ELIGIBILITY CALCULATOR
  const getMemberStatusForPart = (user, month, partId) => {
    const activePrefix = localStorage.getItem('active_program_prefix') || 'revit';
    const isPaud = activePrefix === 'revitpaud';
    const baseMonthly = (user.jabatanTim === 'Tenaga Administrasi' ? settings.honorAdministrasi : settings[`honor${user.jabatanTim.replace(' ', '')}`]) || {
      'Ketua Tim': isPaud ? 6000000 : 7000000,
      'Koordinator': isPaud ? 5000000 : 6000000,
      'Fasilitator': isPaud ? 4000000 : 5000000,
      'Tenaga Administrasi': isPaud ? 4000000 : 5000000
    }[user.jabatanTim] || (isPaud ? 4000000 : 5000000);

    let pctPart1 = 0, pctPart2 = 0, pctPart3 = 0;
    if (user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') {
      pctPart1 = 0.50; pctPart2 = 0.25; pctPart3 = 0.25;
    } else if (user.jabatanTim === 'Fasilitator') {
      pctPart1 = 0.70; pctPart2 = 0.20; pctPart3 = 0.10;
    } else {
      pctPart1 = 1.00; pctPart2 = 0; pctPart3 = 0;
    }

    const taxPct = user.taxPct !== undefined && user.taxPct !== null ? Number(user.taxPct) : Number(settings.deductionTaxPct ?? 15);
    const lembagaPct = Number(settings.deductionLembagaPct ?? 10);

    const getDeductionDetails = (gross) => {
      if (gross === 0) return { tax: 0, lembaga: 0, net: 0 };
      const tax = Math.round(gross * (taxPct / 100));
      const lembaga = Math.round(gross * (lembagaPct / 100));
      const net = Math.max(0, gross - tax - lembaga);
      return { tax, lembaga, net };
    };

    // Calculate eligibility
    const userReport = reports.find(r => r.userId === user.id && Number(r.bulanKe) === Number(month));
    const reportFinished = 
      user.jabatanTim === 'Tenaga Administrasi' || 
      ((user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') 
        ? !!userReport 
        : (userReport && userReport.status === 'approved'));

    const projectStart = settings.projectStartDate || '2026-06-12';
    const start = new Date(projectStart);
    start.setMonth(start.getMonth() + Number(month));
    const todayVal = new Date(settings.simulatedToday || new Date().toISOString().split('T')[0]);
    const isTimeReached = todayVal >= start;

    let mySchools = [];
    if (user.jabatanTim === 'Fasilitator') {
      mySchools = schools.filter(s => s.fasilitatorId === user.id);
    } else if (user.jabatanTim === 'Koordinator') {
      const myFacilitators = users.filter(u => u.jabatanTim === 'Fasilitator' && u.coordinatorId === user.id).map(u => u.id);
      mySchools = schools.filter(s => myFacilitators.includes(s.fasilitatorId));
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

    let isEligible = false;
    let gross = 0;
    let label = '';

    if (partId === 'part1') {
      isEligible = reportFinished && isTimeReached;
      gross = baseMonthly * pctPart1;
      label = 'Bagian 1 (Laporan Bulanan)';
    } else if (partId === 'part2') {
      isEligible = part2Eligible && isTimeReached;
      gross = baseMonthly * pctPart2;
      label = 'Bagian 2 (Milestone 50%)';
    } else if (partId === 'part3') {
      isEligible = part3Eligible && isTimeReached;
      gross = baseMonthly * pctPart3;
      label = 'Bagian 3 (Milestone 100%)';
    }

    const deductions = getDeductionDetails(gross);
    const isPaid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_${partId}`);

    return {
      user,
      gross,
      isEligible,
      isPaid,
      label,
      deductions,
      taxPct,
      lembagaPct,
      pctShare: partId === 'part1' ? pctPart1 : partId === 'part2' ? pctPart2 : pctPart3
    };
  };

  // Get filtered members
  const teamMembers = users.filter(u => u.jabatanTim !== 'Super Admin');
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.jabatanTim.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const memberData = filteredMembers.map(member => {
    return getMemberStatusForPart(member, selectedMonth, selectedPart);
  }).filter(data => data.pctShare > 0); // Omit stages that are 0% for that role (e.g. part2/part3 for Admin)

  // Handlers for selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(memberData.map(m => m.user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectRow = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // 2. BATCH ACTION ACTIONS
  const handleProcessBatch = async (statusToSet) => {
    if (selectedUserIds.length === 0) {
      return window.showAlert('Silakan pilih minimal satu anggota tim terlebih dahulu.');
    }

    const selectedData = memberData.filter(d => selectedUserIds.includes(d.user.id));

    if (statusToSet === 'paid') {
      // Mark as Paid
      const alreadyPaidNames = selectedData.filter(d => d.isPaid).map(d => d.user.nama);
      if (alreadyPaidNames.length > 0) {
        if (!await window.showConfirm(`Beberapa anggota yang dipilih sudah ditandai LUNAS (${alreadyPaidNames.join(', ')}). Apakah Anda yakin ingin memproses ulang pembayarannya?`)) {
          return;
        }
      }

      // Calculate totals for confirmation
      const totalGross = selectedData.reduce((acc, d) => acc + d.gross, 0);
      const totalTax = selectedData.reduce((acc, d) => acc + d.deductions.tax, 0);
      const totalLembaga = selectedData.reduce((acc, d) => acc + d.deductions.lembaga, 0);
      const totalDeduction = totalTax + totalLembaga;
      const totalNet = selectedData.reduce((acc, d) => acc + d.deductions.net, 0);

      const confirmMsg = `Konfirmasi Pembayaran Batch (Bulan Ke-${selectedMonth} - ${selectedPart.toUpperCase()}):
      
- Jumlah Anggota: ${selectedData.length} orang
- Total Kotor: Rp ${totalGross.toLocaleString('id-ID')}
- Potongan Pajak: Rp ${totalTax.toLocaleString('id-ID')}
- Potongan Lembaga: Rp ${totalLembaga.toLocaleString('id-ID')}
- Total Potongan: Rp ${totalDeduction.toLocaleString('id-ID')}
-----------------------------------------------------------
- Total Bersih Dibayar: Rp ${totalNet.toLocaleString('id-ID')}

Tindakan ini akan membuat log pengeluaran honorarium dan menandai kelayakan di dashboard menjadi LUNAS. Lanjutkan?`;

      if (await window.showConfirm(confirmMsg)) {
        const paymentUpdates = [];
        const expenseAdditions = [];

        selectedData.forEach(d => {
          const compKey = `tetap_bulan_${selectedMonth}_${selectedPart}`;
          const paymentId = `payment-${d.user.id}-${compKey}`;

          paymentUpdates.push({
            id: paymentId,
            userId: d.user.id,
            komponen: compKey,
            isPaid: true,
            paidAt: new Date().toISOString()
          });

          expenseAdditions.push({
            id: `exp-honor-batch-${d.user.id}-${Date.now()}`,
            kategori: 'honor',
            deskripsi: `Honor Bulanan Ke-${selectedMonth} ${selectedPart.toUpperCase()} - ${d.user.nama} (Batch Lunas. Kotor: Rp ${d.gross.toLocaleString('id-ID')}, Bersih: Rp ${d.deductions.net.toLocaleString('id-ID')})`,
            jumlah: d.gross,
            tanggal: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          });
        });

        onSetPaymentsStatus(paymentUpdates, expenseAdditions, []);
        window.showAlert('Batch pelunasan honor berhasil disimpan dan disinkronkan!');
        setSelectedUserIds([]);
      }
    } else {
      // Mark as Unpaid (Remove payment record)
      const confirmMsg = `Apakah Anda yakin ingin membatalkan pelunasan honor (${selectedPart.toUpperCase()}) Bulan Ke-${selectedMonth} untuk ${selectedData.length} anggota tim terpilih?
      
Status pembayaran akan kembali menjadi "Layak" atau "Belum" sesuai dengan progres yang berjalan.`;

      if (await window.showConfirm(confirmMsg)) {
        const paymentIdsToRemove = selectedData.map(d => `payment-${d.user.id}-tetap_bulan_${selectedMonth}_${selectedPart}`);
        
        onSetPaymentsStatus([], [], paymentIdsToRemove);
        window.showAlert('Batch pembatalan pelunasan berhasil diproses!');
        setSelectedUserIds([]);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-105 flex items-center gap-2">
          <BadgeCheck className="w-6 h-6 text-indigo-400" /> Pelunasan Batch Honorarium Tim
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Menu khusus untuk melunasi atau membatalkan status pembayaran honorarium anggota tim secara massal per bulan dan per tahapan.
        </p>
      </div>

      {/* Info Warning Alert */}
      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3 items-start select-none">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-200">Panduan Pelunasan Batch</p>
          <p>
            Memilih tahapan pembayaran dan menandai anggota tim sebagai **"Lunas"** akan langsung mencatat nominal honor kotor tersebut ke dalam rekap pengeluaran swakelola secara otomatis. Anda juga dapat membatalkan status pembayaran jika terdapat kesalahan input data.
          </p>
        </div>
      </div>

      {/* Filter Options Area */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bulan Ke:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(Number(e.target.value));
                setSelectedUserIds([]);
              }}
              className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(m => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tahap / Bagian:</span>
            <select
              value={selectedPart}
              onChange={(e) => {
                setSelectedPart(e.target.value);
                setSelectedUserIds([]);
              }}
              className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="part1">Bagian 1 (Laporan Bulanan)</option>
              <option value="part2">Bagian 2 (Milestone Progres 50%)</option>
              <option value="part3">Bagian 3 (Milestone Progres 100%)</option>
            </select>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Cari anggota tim atau peran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Grid table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-350">
            <thead className="bg-slate-950 border-b border-slate-850 text-slate-500 uppercase text-[9px] tracking-wider font-bold select-none">
              <tr>
                <th className="px-5 py-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={memberData.length > 0 && selectedUserIds.length === memberData.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-4">Nama Anggota</th>
                <th className="px-5 py-4">Jabatan</th>
                <th className="px-5 py-4 text-center">Persentase</th>
                <th className="px-5 py-4 text-center">Kelayakan</th>
                <th className="px-5 py-4 text-right">Honor Kotor</th>
                <th className="px-5 py-4 text-right">Pajak</th>
                <th className="px-5 py-4 text-right">Lembaga</th>
                <th className="px-5 py-4 text-right">Total Potongan</th>
                <th className="px-5 py-4 text-right">Bersih Dibayar</th>
                <th className="px-5 py-4 text-center">Status Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {memberData.map((data) => {
                const isRowSelected = selectedUserIds.includes(data.user.id);
                const totalPotongan = data.deductions.tax + data.deductions.lembaga;
                return (
                  <tr 
                    key={data.user.id} 
                    className={`hover:bg-slate-900/10 transition-colors ${
                      isRowSelected ? 'bg-indigo-500/[0.02]' : ''
                    }`}
                  >
                    <td className="px-5 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        onChange={() => handleSelectRow(data.user.id)}
                        className="w-3.5 h-3.5 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-205">
                      {data.user.nama}
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-medium">
                      {data.user.jabatanTim}
                    </td>
                    <td className="px-5 py-3 text-center font-semibold text-slate-500">
                      {Math.round(data.pctShare * 100)}%
                    </td>
                    <td className="px-5 py-3 text-center select-none">
                      {data.isEligible ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          ✓ Layak
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-rose-405 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          <img src="/cross_icon.png" alt="✗" className="w-3 h-3 object-contain shrink-0" /> Belum Layak
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-indigo-400 font-mono">
                      Rp {data.gross.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 text-right text-rose-400 font-mono text-[11px]">
                      Rp {data.deductions.tax.toLocaleString('id-ID')}
                      <span className="text-[9px] text-slate-500 block">({data.taxPct}%)</span>
                    </td>
                    <td className="px-5 py-3 text-right text-rose-400 font-mono text-[11px]">
                      Rp {data.deductions.lembaga.toLocaleString('id-ID')}
                      <span className="text-[9px] text-slate-500 block">({data.lembagaPct}%)</span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-rose-500 font-mono">
                      Rp {totalPotongan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-400 font-mono">
                      Rp {data.deductions.net.toLocaleString('id-ID')}
                    </td>
                    <td className="px-5 py-3 text-center select-none">
                      {data.isPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-950 border border-slate-850 px-2.5 py-0.5 rounded-full font-semibold">
                          Belum Lunas
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {memberData.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-5 py-10 text-center text-slate-500 font-semibold italic">
                    {searchQuery ? 'Tidak ada anggota tim yang cocok dengan pencarian.' : 'Tidak ada data honorarium untuk bagian ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Actions Summary panel */}
      {selectedUserIds.length > 0 && (
        <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in select-none">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Aksi Massal ({selectedUserIds.length} Terpilih)
            </span>
            <div className="text-xs text-slate-300 font-medium pt-1.5 flex flex-wrap gap-x-5 gap-y-1">
              <span>Total Kotor: <strong className="text-indigo-300 font-mono">Rp {memberData.filter(d => selectedUserIds.includes(d.user.id)).reduce((acc, d) => acc + d.gross, 0).toLocaleString('id-ID')}</strong></span>
              <span>Total Potongan: <strong className="text-rose-400 font-mono">Rp {memberData.filter(d => selectedUserIds.includes(d.user.id)).reduce((acc, d) => acc + (d.deductions.tax + d.deductions.lembaga), 0).toLocaleString('id-ID')}</strong></span>
              <span>Total Bersih: <strong className="text-emerald-400 font-bold font-mono">Rp {memberData.filter(d => selectedUserIds.includes(d.user.id)).reduce((acc, d) => acc + d.deductions.net, 0).toLocaleString('id-ID')}</strong></span>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => handleProcessBatch('unpaid')}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batalkan Pelunasan
            </button>
            <button
              onClick={() => handleProcessBatch('paid')}
              className="flex-1 md:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 cursor-pointer border-0"
            >
              <Coins className="w-4 h-4" />
              Tandai Lunas (Batch)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
