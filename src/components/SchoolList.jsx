import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Plus, Check, MapPin, UserCheck, ShieldAlert, Award, School, X, AlertCircle, LayoutGrid } from 'lucide-react';

const parseCoordinates = (school) => {
  if (!school.koordinat) return null;
  const regex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const match = school.koordinat.match(regex);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])];
  }
  const urlRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const urlMatch = school.koordinat.match(urlRegex);
  if (urlMatch) {
    return [parseFloat(urlMatch[1]), parseFloat(urlMatch[2])];
  }
  return null;
};

const getSchoolCoordinates = (school) => {
  const parsed = parseCoordinates(school);
  if (parsed) return parsed;

  const centers = {
    'Melawi': [-0.3392, 111.6994],
    'Sintang': [0.0764, 111.4981],
    'Sekadau': [0.0163, 110.9022],
    'Landak': [0.4222, 109.9614],
    'Ketapang': [-1.8422, 109.9708],
    'Sanggau': [0.1258, 110.4239],
    'Mempawah': [0.3691, 108.9511],
    'Pontianak': [-0.0263, 109.3425],
    'Bengkayang': [0.8219, 109.4975],
    'Sambas': [1.3631, 109.3014],
    'Singkawang': [0.9025, 108.9836],
    'Kapuas Hulu': [0.8174, 112.9292],
  };

  const base = centers[school.kabupaten] || [-0.0263, 109.3425];
  const npsnNum = parseInt(school.npsn) || 0;
  const latOffset = ((npsnNum % 100) / 100 - 0.5) * 0.12;
  const lngOffset = (((npsnNum / 100) % 100) / 100 - 0.5) * 0.12;
  
  return [base[0] + latOffset, base[1] + lngOffset];
};

export default function SchoolList({ schools, users, activeUser, onClaimSchool, onAddSchool, onSelectSchool, onUpdateSchool, tasks = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Semua');
  const [selectedFacilitatorFilter, setSelectedFacilitatorFilter] = useState('Semua');
  const [viewMode, setViewMode] = useState('grid');
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Modals state
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  
  // Form state
  const [newSchoolData, setNewSchoolData] = useState({
    npsn: '',
    nama_sekolah: '',
    kabupaten: 'Melawi',
  });

  const isFacilitator = activeUser?.jabatanTim === 'Fasilitator';

  // Base list of schools to display
  const displaySchools = isFacilitator
    ? schools.filter((s) => s.fasilitatorId === activeUser.id)
    : schools;

  // Get unique Kabupatens
  const kabupatens = ['Semua', ...new Set(displaySchools.map((s) => s.kabupaten))];

  // Filters logic
  const filteredSchools = displaySchools.filter((school) => {
    const matchesSearch =
      school.nama_sekolah.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.npsn.includes(searchTerm);
      
    const matchesKabupaten =
      selectedKabupaten === 'Semua' || school.kabupaten === selectedKabupaten;

    let matchesFacilitator = true;
    if (!isFacilitator) {
      if (selectedFacilitatorFilter === 'Saya') {
        matchesFacilitator = school.fasilitatorId === activeUser.id;
      } else if (selectedFacilitatorFilter === 'Belum Ada') {
        matchesFacilitator = !school.fasilitatorId;
      } else if (selectedFacilitatorFilter !== 'Semua') {
        matchesFacilitator = school.fasilitatorId === selectedFacilitatorFilter;
      }
    }

    return matchesSearch && matchesKabupaten && matchesFacilitator;
  });

  useEffect(() => {
    if (viewMode !== 'map' || !mapRef.current) return;
    if (!window.L) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = window.L.map(mapRef.current, {
      zoomControl: false
    }).setView([-0.0263, 109.3425], 8);
    
    mapInstanceRef.current = map;

    window.L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const markers = [];
    
    filteredSchools.forEach((school) => {
      const coords = getSchoolCoordinates(school);
      
      let pulseColor = 'bg-indigo-400';
      let coreColor = 'bg-indigo-500 shadow-indigo-500/50';
      if (school.progres_fisik === 100) {
        pulseColor = 'bg-emerald-400';
        coreColor = 'bg-emerald-500 shadow-emerald-500/50';
      } else if (school.progres_fisik === 0) {
        pulseColor = 'bg-amber-400';
        coreColor = 'bg-amber-500 shadow-amber-500/50';
      }

      const customIcon = window.L.divIcon({
        html: `<div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full ${pulseColor} opacity-30"></span>
          <div class="relative rounded-full h-4 w-4 ${coreColor} border-2 border-slate-950 flex items-center justify-center shadow-lg">
            <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
          </div>
        </div>`,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = window.L.marker(coords, { icon: customIcon }).addTo(map);

      const mapsUrl = school.koordinat && school.koordinat.startsWith('http')
        ? school.koordinat
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.koordinat || `${school.nama_sekolah}, Kabupaten ${school.kabupaten}`)}`;

      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 text-slate-100 font-sans';
      popupDiv.innerHTML = `
        <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">NPSN ${school.npsn}</div>
        <h4 class="font-bold text-sm text-slate-100 mt-0.5 leading-snug">${school.nama_sekolah}</h4>
        <div class="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
          <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-medium text-slate-400">${school.kabupaten}</span>
          <span class="text-emerald-400 font-bold">${school.progres_fisik}% Progres</span>
        </div>
        <div class="grid grid-cols-2 gap-2 mt-2.5">
          <button class="btn-detail bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer text-center border-0">
            Detail
          </button>
          <a href="${mapsUrl}" target="_blank" rel="noreferrer" class="bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 text-[10px] font-bold py-1.5 px-2 rounded-lg transition-colors cursor-pointer text-center no-underline border border-slate-700 block">
            Google Maps
          </a>
        </div>
      `;

      popupDiv.querySelector('.btn-detail').addEventListener('click', () => {
        onSelectSchool(school.npsn);
      });

      marker.bindPopup(popupDiv, {
        closeButton: false,
        maxWidth: 220,
        className: 'custom-leaflet-popup'
      });

      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = new window.L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewMode, filteredSchools, onSelectSchool]);


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
              ? 'Kelola sekolah yang menjadi tanggung jawab Anda.'
              : 'Pantau status progres konstruksi dan alokasi fasilitator untuk seluruh sekolah dasar.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-1 rounded-xl flex items-center gap-1 select-none">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Peta Lokasi
            </button>
          </div>

          {activeUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsAddingMaster(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Sekolah Master
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className={`bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 grid grid-cols-1 ${
        isFacilitator ? 'sm:grid-cols-3' : 'sm:grid-cols-4'
      } gap-4`}>
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
        {!isFacilitator && (
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
                <option value="Belum Ada" className="bg-slate-950">Belum Ditugaskan</option>
                {users
                  .filter((u) => u.jabatanTim === 'Fasilitator' || u.jabatanTim === 'Ketua Tim')
                  .map((f) => (
                    <option key={f.id} value={f.id} className="bg-slate-950">{f.nama}</option>
                  ))}
              </select>
            </div>
          </div>
        )}

        {/* Stats Helper */}
        <div className="flex items-center justify-center sm:justify-end text-xs text-slate-400 font-semibold px-2">
          Terfilter: {filteredSchools.length} dari {displaySchools.length} Sekolah
        </div>
      </div>

      {/* Grid List / Map View */}
      {viewMode === 'map' ? (
        <div className="relative w-full h-[550px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/10 shadow-2xl">
          <div id="school-map" className="w-full h-full z-10" ref={mapRef}></div>
          
          {/* Float overlay with summary info */}
          <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl max-w-[240px] text-xs space-y-2 pointer-events-none shadow-lg">
            <div className="font-bold text-slate-200">Keterangan Peta</div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-slate-300">Selesai (100% Progres)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
              <span className="text-slate-300">Dalam Proses (&lt; 100%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
              <span className="text-slate-300">Belum Mulai (0%)</span>
            </div>
            {filteredSchools.length === 0 && (
              <div className="pt-2 border-t border-slate-850 text-amber-400 font-semibold text-[10px]">
                Tidak ada titik sekolah terfilter.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((school) => {
            const isMySchool = school.fasilitatorId === activeUser.id;

            // Count missing data fields for facilitator's own schools
            const missingFields = [];
            if (!school.kepala_sekolah) missingFields.push('Kepala Sekolah');
            if (!school.hp_kepala_sekolah) missingFields.push('HP Kepsek');
            if (!school.perencanaId) missingFields.push('Perencana');
            if (!school.pengawasId) missingFields.push('Pengawas');
            const missingCount = missingFields.length;

            const schoolTasks = tasks ? tasks.filter((t) => t.sekolahId === school.npsn || t.schoolId === school.npsn) : [];
            const totalTasks = schoolTasks.length;
            const hasTasks = totalTasks > 0;
            const isAuthorizedToEdit = activeUser?.role === 'admin' || (activeUser?.jabatanTim === 'Fasilitator' && school.fasilitatorId === activeUser?.id);

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

                  {/* Missing Data Indicator (visible for facilitator's own schools) */}
                  {isMySchool && missingCount > 0 && (
                    <div className="mb-3 bg-amber-500/5 border border-amber-500/15 rounded-xl px-3 py-2 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-amber-400 block">Data Belum Lengkap ({missingCount})</span>
                        <span className="text-[9px] text-slate-500 leading-snug">
                          {missingFields.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Complete Data Badge */}
                  {isMySchool && missingCount === 0 && (
                    <div className="mb-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] font-semibold text-emerald-400">Data Sekolah Lengkap</span>
                    </div>
                  )}

                  {/* Progress bar or range slider */}
                  <div 
                    className="my-4 bg-slate-950/60 rounded-xl p-3 border border-slate-850"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-1.5 select-none">
                      <span className="flex items-center gap-1.5">
                        Progres Fisik
                        {hasTasks && (
                          <span 
                            className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                            title="Progres dihitung otomatis berdasarkan Papan Tugas (Kanban)"
                          >
                            Auto
                          </span>
                        )}
                      </span>
                      <span className="text-emerald-400 font-bold">{school.progres_fisik}%</span>
                    </div>
                    {isAuthorizedToEdit && !hasTasks ? (
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={school.progres_fisik || 0}
                        onChange={(e) => {
                          onUpdateSchool({
                            ...school,
                            progres_fisik: Number(e.target.value)
                          });
                        }}
                        className="w-full accent-emerald-500 h-2 rounded-lg appearance-none cursor-pointer focus:outline-none"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${school.progres_fisik || 0}%, #1e293b ${school.progres_fisik || 0}%, #1e293b 100%)`
                        }}
                        title="Geser untuk mengubah progres fisik"
                      />
                    ) : (
                      <div 
                        className="w-full bg-slate-800 rounded-full h-2 overflow-hidden cursor-help"
                        title={hasTasks ? "Progres dihitung otomatis dari Papan Tugas (Kanban)" : "Hanya Fasilitator Pendamping atau Super Admin yang dapat mengubah progres."}
                      >
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${school.progres_fisik}%` }}
                        />
                      </div>
                    )}
                  </div>
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
