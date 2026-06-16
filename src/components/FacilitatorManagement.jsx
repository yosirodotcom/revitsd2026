import React, { useState } from 'react';
import { 
  Users, 
  School, 
  MapPin, 
  UserPlus, 
  UserMinus, 
  AlertCircle, 
  CheckCircle, 
  Award,
  Info,
  ChevronRight,
  X
} from 'lucide-react';

export default function FacilitatorManagement({ users, schools, onClaimSchool }) {
  const [activeTab, setActiveTab] = useState('facilitators');
  const [selectedSchoolForFac, setSelectedSchoolForFac] = useState({}); // { [facId]: npsn }
  const [selectedFacForSchool, setSelectedFacForSchool] = useState({}); // { [npsn]: facId }
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: '' }

  // Show a temporary notification helper
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Filter only facilitators from team list
  const facilitators = users.filter((u) => u.jabatanTim === 'Fasilitator');

  // Get schools assigned to a facilitator
  const getAssignedSchools = (facId) => {
    return schools.filter((s) => s.fasilitatorId === facId);
  };

  // Get unassigned schools
  const unassignedSchools = schools.filter((s) => !s.fasilitatorId);

  // Initials generator
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Handle Assign School to Facilitator
  const handleAssign = (npsn, facId) => {
    if (!npsn || !facId) return;

    // Check if facilitator has reached the 8 school limit
    const currentCount = getAssignedSchools(facId).length;
    if (currentCount >= 8) {
      showNotification('error', 'Gagal: Fasilitator telah mencapai batas maksimal penugasan (8 sekolah).');
      return;
    }

    const school = schools.find((s) => s.npsn === npsn);
    const fac = users.find((u) => u.id === facId);

    onClaimSchool(npsn, facId);
    showNotification('success', `Berhasil menugaskan ${school?.nama_sekolah || npsn} kepada ${fac?.nama || facId}.`);
    
    // Clear select state
    setSelectedSchoolForFac(prev => ({ ...prev, [facId]: '' }));
    setSelectedFacForSchool(prev => ({ ...prev, [npsn]: '' }));
  };

  // Handle Unassign School
  const handleUnassign = async (npsn) => {
    const school = schools.find((s) => s.npsn === npsn);
    const currentFacId = school?.fasilitatorId;
    const fac = users.find((u) => u.id === currentFacId);

    if (await window.showConfirm(`Apakah Anda yakin ingin melepas penugasan sekolah ${school?.nama_sekolah} dari fasilitator ${fac?.nama || 'fasilitator'}?`)) {
      onClaimSchool(npsn, null);
      showNotification('success', `Berhasil melepas penugasan ${school?.nama_sekolah} dari ${fac?.nama || 'fasilitator'}.`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      
      {/* Dynamic Alert Banner */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-fade-in ${
          notification.type === 'error'
            ? 'bg-rose-950/90 border-rose-800 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-850 text-emerald-200'
        }`}>
          {notification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-900/30 rounded-lg text-slate-400 hover:text-slate-200 transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Info Warning Alert */}
      <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3 items-start select-none">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-200">Panduan Penugasan Swakelola</p>
          <p>
            Beban kerja masing-masing **Fasilitator** dibatasi maksimal **8 sekolah dasar**. 
            Satu sekolah dasar hanya dapat diawasi oleh **1 fasilitator** dalam satu waktu. 
            Sekolah yang telah ditugaskan ke salah satu fasilitator tidak akan muncul di opsi penugasan fasilitator lainnya.
          </p>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        {/* Facilitators Count */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Fasilitator</span>
              <span className="text-3xl font-extrabold text-slate-100 block mt-1">{facilitators.length} orang</span>
              <span className="text-xs text-slate-400 mt-1 block">Tim pelaksana aktif</span>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Assigned Schools */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekolah Terfasilitasi</span>
              <span className="text-3xl font-extrabold text-emerald-400 block mt-1">
                {schools.length - unassignedSchools.length} <span className="text-xs text-slate-400 font-normal">/ {schools.length}</span>
              </span>
              <span className="text-xs text-slate-400 mt-1 block">Sudah memiliki fasilitator</span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 rounded-xl">
              <School className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Unassigned Schools */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md hover:border-slate-700/60 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sekolah Belum Terfasilitasi</span>
              <span className={`text-3xl font-extrabold block mt-1 ${unassignedSchools.length > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                {unassignedSchools.length} <span className="text-xs text-slate-400 font-normal">sekolah</span>
              </span>
              <span className="text-xs text-slate-400 mt-1 block">Menunggu penugasan fasilitator</span>
            </div>
            <div className={`p-3 rounded-xl border ${
              unassignedSchools.length > 0
                ? 'bg-amber-500/10 border-amber-500/15 text-amber-500'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex border-b border-slate-800 gap-6 select-none">
        <button
          onClick={() => setActiveTab('facilitators')}
          className={`pb-3 text-sm font-semibold relative transition-colors ${
            activeTab === 'facilitators' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Penugasan Per Fasilitator
          {activeTab === 'facilitators' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`pb-3 text-sm font-semibold relative transition-colors flex items-center gap-2 ${
            activeTab === 'unassigned' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Sekolah Belum Ditugaskan
          {unassignedSchools.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full">
              {unassignedSchools.length}
            </span>
          )}
          {activeTab === 'unassigned' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Tab 1: Facilitators work load list */}
      {activeTab === 'facilitators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {facilitators.map((fac) => {
            const assigned = getAssignedSchools(fac.id);
            const isFull = assigned.length >= 8;
            
            // Calculate progress bar color
            let progressColor = 'bg-indigo-600';
            if (assigned.length <= 3) progressColor = 'bg-emerald-500';
            else if (assigned.length >= 7) progressColor = 'bg-rose-500';
            else if (assigned.length >= 5) progressColor = 'bg-amber-500';

            return (
              <div 
                key={fac.id}
                className="bg-slate-900/30 backdrop-blur-md border border-slate-800 hover:border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between space-y-5 transition-all duration-200 hover:scale-[1.005] hover:shadow-lg hover:shadow-indigo-500/[0.01]"
              >
                {/* Facilitator Header */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10 shrink-0 select-none">
                    {getInitials(fac.nama)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-100 text-base leading-tight truncate">{fac.nama}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-300">{fac.jabatanKepegawaian !== '-' ? fac.jabatanKepegawaian : 'Fasilitator Lapangan'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-650"></span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 font-semibold">{fac.pendidikan}</span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 font-semibold">{fac.statusPegawai}</span>
                    </p>
                  </div>
                </div>

                {/* Workload Indicator (Visual load bar) */}
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850 select-none">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-1.5">
                    <span>Beban Penugasan Sekolah</span>
                    <span className={isFull ? 'text-rose-400 font-bold' : 'text-slate-350'}>
                      {assigned.length} / 8 <span className="text-[10px] text-slate-500 font-medium">(Maks 8)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-850 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${(assigned.length / 8) * 100}%` }}
                    />
                  </div>
                </div>

                {/* List of currently assigned schools */}
                <div className="space-y-2 flex-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 select-none">
                    Daftar Sekolah Binaan ({assigned.length})
                  </span>
                  
                  {assigned.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-850 bg-slate-950/20 rounded-xl text-slate-500 text-xs italic font-medium select-none">
                      Belum ada sekolah yang ditugaskan ke fasilitator ini.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {assigned.map((school) => (
                        <div 
                          key={school.npsn} 
                          className="flex justify-between items-center bg-slate-950/40 border border-slate-850/80 px-3 py-2 rounded-xl group/item"
                        >
                          <div className="min-w-0 pr-2">
                            <h4 className="font-semibold text-slate-200 text-xs truncate leading-tight group-hover/item:text-white transition-colors">
                              {school.nama_sekolah}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                              <span>NPSN {school.npsn}</span>
                              <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5 shrink-0" /> {school.kabupaten}</span>
                              <span className="text-emerald-500 font-semibold">{school.progres_fisik}% Progres</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleUnassign(school.npsn)}
                            title="Lepas Tugas"
                            className="p-1.5 rounded-lg border border-slate-850 bg-slate-900/50 hover:bg-rose-950/30 hover:border-rose-900/40 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add assignment dropdown section */}
                <div className="pt-3 border-t border-slate-850">
                  {isFull ? (
                    <div className="text-[11px] text-rose-400 bg-rose-500/[0.02] border border-rose-950 px-3 py-2 rounded-xl font-medium flex items-center gap-1.5 select-none">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>Batas kuota penugasan tercapai. Lepas tugas sekolah lain terlebih dahulu.</span>
                    </div>
                  ) : unassignedSchools.length === 0 ? (
                    <div className="text-[11px] text-slate-500 bg-slate-950/40 border border-slate-850 px-3 py-2 rounded-xl font-medium select-none">
                      Semua sekolah dasar terdaftar sudah memiliki fasilitator.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 select-none">
                      <div className="flex-1">
                        <select
                          value={selectedSchoolForFac[fac.id] || ''}
                          onChange={(e) => setSelectedSchoolForFac(prev => ({ ...prev, [fac.id]: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                        >
                          <option value="">-- Pilih Sekolah Dasar --</option>
                          {unassignedSchools.map((s) => (
                            <option key={s.npsn} value={s.npsn} className="bg-slate-950">
                              {s.nama_sekolah} ({s.kabupaten})
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => handleAssign(selectedSchoolForFac[fac.id], fac.id)}
                        disabled={!selectedSchoolForFac[fac.id]}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          selectedSchoolForFac[fac.id]
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/10'
                            : 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Tugaskan
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Schools without facilitators */}
      {activeTab === 'unassigned' && (
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden">
          {unassignedSchools.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 select-none">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-100 text-base">Semua Sekolah Sudah Terfasilitasi</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Seluruh <strong>{schools.length} sekolah dasar</strong> dalam sistem telah berhasil ditugaskan ke fasilitator masing-masing.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-850">
              {/* Header row */}
              <div className="bg-slate-950/40 px-6 py-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <div className="md:col-span-2">Nama Sekolah Dasar / NPSN</div>
                <div>Kabupaten</div>
                <div className="text-right md:text-left">Tindakan Penugasan</div>
              </div>

              {/* Data rows */}
              {unassignedSchools.map((school) => {
                const selectedFac = selectedFacForSchool[school.npsn] || '';
                
                return (
                  <div 
                    key={school.npsn} 
                    className="px-6 py-4 grid grid-cols-1 md:grid-cols-4 items-center gap-4 text-xs group hover:bg-slate-900/10 transition-colors"
                  >
                    {/* School Name & NPSN */}
                    <div className="md:col-span-2">
                      <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">
                        {school.nama_sekolah}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">NPSN {school.npsn}</span>
                    </div>

                    {/* Kabupaten */}
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/15 inline-flex items-center gap-1 select-none">
                        <MapPin className="w-3 h-3" /> {school.kabupaten}
                      </span>
                    </div>

                    {/* Action form */}
                    <div className="flex items-center gap-2 select-none">
                      <select
                        value={selectedFac}
                        onChange={(e) => setSelectedFacForSchool(prev => ({ ...prev, [school.npsn]: e.target.value }))}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer flex-1"
                      >
                        <option value="">-- Pilih Fasilitator --</option>
                        {facilitators.map((fac) => {
                          const currentLoad = getAssignedSchools(fac.id).length;
                          const isFull = currentLoad >= 8;

                          return (
                            <option 
                              key={fac.id} 
                              value={fac.id} 
                              disabled={isFull}
                              className="bg-slate-950 disabled:text-slate-600 disabled:bg-slate-900"
                            >
                              {fac.nama} ({currentLoad}/8 {isFull ? ' - PENUH' : ''})
                            </option>
                          );
                        })}
                      </select>
                      
                      <button
                        onClick={() => handleAssign(school.npsn, selectedFac)}
                        disabled={!selectedFac}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                          selectedFac
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                            : 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
