import React, { useState } from 'react';
import { Search, Filter, Plus, Check, MapPin, UserCheck, ShieldAlert, Award } from 'lucide-react';

export default function SchoolList({ schools, users, activeUser, onClaimSchool, onAddSchool, onSelectSchool }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Semua');
  const [selectedFacilitatorFilter, setSelectedFacilitatorFilter] = useState('Semua');
  
  // Modals state
  const [isClaiming, setIsClaiming] = useState(false);
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  
  // Form state
  const [newSchoolData, setNewSchoolData] = useState({
    npsn: '',
    nama_sekolah: '',
    kabupaten: 'Melawi',
  });

  const [claimSchoolId, setClaimSchoolId] = useState('');

  // Get unique Kabupatens
  const kabupatens = ['Semua', ...new Set(schools.map((s) => s.kabupaten))];

  // Filters logic
  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.nama_sekolah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.npsn.includes(searchTerm);
      
    const matchesKabupaten =
      selectedKabupaten === 'Semua' || school.kabupaten === selectedKabupaten;

    let matchesFacilitator = true;
    if (selectedFacilitatorFilter === 'Saya') {
      matchesFacilitator = school.fasilitatorId === activeUser.id;
    } else if (selectedFacilitatorFilter === 'Belum Ada') {
      matchesFacilitator = !school.fasilitatorId;
    } else if (selectedFacilitatorFilter !== 'Semua') {
      matchesFacilitator = school.fasilitatorId === selectedFacilitatorFilter;
    }

    return matchesSearch && matchesKabupaten && matchesFacilitator;
  });

  // Get list of unassigned schools for claim dropdown
  const unassignedSchools = schools.filter((s) => !s.fasilitatorId);

  // Handle Add Master School (Admin only)
  const handleAddMasterSchoolSubmit = (e) => {
    e.preventDefault();
    if (!newSchoolData.npsn.trim() || !newSchoolData.nama_sekolah.trim()) {
      return alert('NPSN dan Nama Sekolah wajib diisi');
    }
    
    // Check duplication
    if (schools.some((s) => s.npsn === newSchoolData.npsn)) {
      return alert('Sekolah dengan NPSN tersebut sudah terdaftar');
    }

    const newSchool = {
      ...newSchoolData,
      desa: '',
      kecamatan: '',
      kepala_sekolah: '',
      hp_kepala_sekolah: '',
      perencanaId: null,
      pengawasId: null,
      fasilitatorId: null,
      progres_fisik: 0,
      tanggal_mulai_sekolah: null,
      dokumen_mingguan: 'belum',
      dokumen_bulanan: 'belum',
      dokumen_progres_50: 'belum',
      dokumen_progres_100: 'belum',
    };

    onAddSchool(newSchool);
    alert('Sekolah baru berhasil ditambahkan ke Master Data');
    setNewSchoolData({ npsn: '', nama_sekolah: '', kabupaten: 'Melawi' });
    setIsAddingMaster(false);
  };

  // Handle Claim
  const handleClaimSubmit = (e) => {
    e.preventDefault();
    if (!claimSchoolId) return alert('Silakan pilih sekolah');
    onClaimSchool(claimSchoolId, activeUser.id);
    alert('Sekolah berhasil ditambahkan ke daftar tanggung jawab Anda!');
    setClaimSchoolId('');
    setIsClaiming(false);
  };

  const getFacilitatorName = (id) => {
    const user = users.find((u) => u.id === id);
    return user ? user.nama : 'Belum Ditugaskan';
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-slate-100 flex items-center gap-2">
            <School className="w-6 h-6 text-indigo-400" /> 
            {activeUser.jabatanTim === 'Fasilitator' ? 'Sekolah Pendampingan Saya' : 'Daftar Semua Sekolah'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {activeUser.jabatanTim === 'Fasilitator' 
              ? 'Kelola sekolah yang menjadi tanggung jawab Anda atau klaim sekolah pendampingan baru.'
              : 'Pantau status progres konstruksi dan alokasi fasilitator untuk seluruh sekolah dasar.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeUser.jabatanTim === 'Fasilitator' && (
            <button
              onClick={() => setIsClaiming(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Klaim Sekolah Tugas
            </button>
          )}

          {activeUser.role === 'admin' && (
            <button
              onClick={() => setIsAddingMaster(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Sekolah Master
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari Nama Sekolah / NPSN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Kabupaten Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
          <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex-1">
            <span className="block text-[8px] uppercase font-semibold text-slate-500">Kabupaten</span>
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              className="w-full bg-transparent border-0 text-slate-200 text-xs font-semibold focus:outline-none py-0.5 cursor-pointer"
            >
              {kabupatens.map((kab) => (
                <option key={kab} value={kab} className="bg-slate-950">{kab}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Facilitator Assignment Filter */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1">
          <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex-1">
            <span className="block text-[8px] uppercase font-semibold text-slate-500">Fasilitator</span>
            <select
              value={selectedFacilitatorFilter}
              onChange={(e) => setSelectedFacilitatorFilter(e.target.value)}
              className="w-full bg-transparent border-0 text-slate-200 text-xs font-semibold focus:outline-none py-0.5 cursor-pointer"
            >
              <option value="Semua" className="bg-slate-950">Semua</option>
              {activeUser.jabatanTim === 'Fasilitator' && (
                <option value="Saya" className="bg-slate-950">Hanya Sekolah Saya</option>
              )}
              <option value="Belum Ada" className="bg-slate-950">Belum Ditugaskan</option>
              {users
                .filter((u) => u.jabatanTim === 'Fasilitator' || u.jabatanTim === 'Ketua Tim')
                .map((f) => (
                  <option key={f.id} value={f.id} className="bg-slate-950">{f.nama}</option>
                ))}
            </select>
          </div>
        </div>

        {/* Stats Helper */}
        <div className="flex items-center justify-center sm:justify-end text-xs text-slate-400 font-semibold px-2">
          Terfilter: {filteredSchools.length} dari {schools.length} Sekolah
        </div>
      </div>

      {/* Grid List Sekolah */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => {
          const hasFacilitator = !!school.fasilitatorId;
          const isMySchool = school.fasilitatorId === activeUser.id;

          return (
            <div
              key={school.npsn}
              onClick={() => onSelectSchool(school.npsn)}
              className={`group bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 cursor-pointer transition-all duration-300 hover:scale-[1.015] hover:shadow-lg hover:shadow-indigo-500/[0.02] flex flex-col justify-between ${
                isMySchool ? 'ring-1 ring-indigo-500/20 bg-indigo-500/[0.01]' : ''
              }`}
            >
              <div>
                {/* School Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 tracking-wider">NPSN {school.npsn}</span>
                    <h3 className="font-bold text-slate-200 group-hover:text-white text-base leading-tight mt-0.5 line-clamp-1 transition-colors">
                      {school.nama_sekolah}
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/15 shrink-0 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {school.kabupaten}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="my-4 bg-slate-950/60 rounded-xl p-3 border border-slate-850">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-1.5">
                    <span>Progres Fisik</span>
                    <span className="text-emerald-400">{school.progres_fisik}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${school.progres_fisik}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* School Footer (Facilitator Info) */}
              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs mt-2">
                <span className="text-slate-500">Fasilitator:</span>
                <span className={`font-semibold ${hasFacilitator ? 'text-indigo-400' : 'text-amber-500/80 italic'}`}>
                  {isMySchool ? 'Anda (Pendamping)' : getFacilitatorName(school.fasilitatorId)}
                </span>
              </div>
            </div>
          );
        })}

        {filteredSchools.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-semibold border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            Tidak ada sekolah yang cocok dengan filter atau pencarian Anda.
          </div>
        )}
      </div>

      {/* Modal 1: Klaim Sekolah (Fasilitator) */}
      {isClaiming && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-slate-100 text-lg">Klaim Sekolah Tugas</h3>
              <button
                onClick={() => setIsClaiming(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleClaimSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Pilih sekolah dari daftar master yang belum memiliki fasilitator pendamping. Sekolah ini akan masuk ke daftar tanggung jawab Anda.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Sekolah Dasar
                </label>
                <select
                  value={claimSchoolId}
                  onChange={(e) => setClaimSchoolId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">-- Pilih Sekolah --</option>
                  {unassignedSchools.map((s) => (
                    <option key={s.npsn} value={s.npsn}>
                      {s.nama_sekolah} ({s.kabupaten})
                    </option>
                  ))}
                </select>
              </div>
              {unassignedSchools.length === 0 && (
                <p className="text-xs text-rose-400 font-semibold italic text-center">
                  Seluruh sekolah master sudah teralokasi dengan fasilitator!
                </p>
              )}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsClaiming(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!claimSchoolId}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <Check className="w-4 h-4" /> Konfirmasi Klaim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Tambah Sekolah Master Baru (Admin Only) */}
      {isAddingMaster && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-semibold text-slate-100 text-lg">Tambah Sekolah Master Baru</h3>
              <button
                onClick={() => setIsAddingMaster(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMasterSchoolSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  NPSN Sekolah (8 Digit Angka)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  pattern="[0-9]{8}"
                  value={newSchoolData.npsn}
                  onChange={(e) => setNewSchoolData({ ...newSchoolData, npsn: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Contoh: 30104982"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Sekolah Dasar
                </label>
                <input
                  type="text"
                  value={newSchoolData.nama_sekolah}
                  onChange={(e) => setNewSchoolData({ ...newSchoolData, nama_sekolah: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Contoh: SD Negeri 55 Pontianak"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Kabupaten
                </label>
                <select
                  value={newSchoolData.kabupaten}
                  onChange={(e) => setNewSchoolData({ ...newSchoolData, kabupaten: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="Melawi">Melawi</option>
                  <option value="Sintang">Sintang</option>
                  <option value="Sekadau">Sekadau</option>
                  <option value="Landak">Landak</option>
                  <option value="Ketapang">Ketapang</option>
                  <option value="Sanggau">Sanggau</option>
                  <option value="Mempawah">Mempawah</option>
                  <option value="Pontianak">Pontianak</option>
                  <option value="Bengkayang">Bengkayang</option>
                  <option value="Sambas">Sambas</option>
                  <option value="Singkawang">Singkawang</option>
                  <option value="Kapuas Hulu">Kapuas Hulu</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsAddingMaster(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <Check className="w-4 h-4" /> Simpan Sekolah Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple Icon Import mock if needed (X mapping)
function XIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
