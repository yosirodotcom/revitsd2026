import React, { useState, useEffect, useRef, useMemo } from 'react';
import SchoolDetail from './SchoolDetail';
import { 
  School, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  MapPin, 
  ArrowLeft, 
  LogIn, 
  X, 
  Search, 
  Layers, 
  Info,
  ChevronRight,
  Award,
  Check,
  Calendar,
  DollarSign,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

// Leaflet Map Component for Public Dashboard
function PublicMap({ schools = [], users = [], selectedFacilitator = 'all', onSelectSchool }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!window.L || !mapRef.current) return;

    const filteredSchools = selectedFacilitator === 'all'
      ? schools
      : schools.filter(s => s.fasilitatorId === selectedFacilitator);

    const parseCoordinates = (sch) => {
      if (!sch.koordinat) return null;
      const regex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
      const match = sch.koordinat.match(regex);
      if (match) return [parseFloat(match[1]), parseFloat(match[2])];
      const urlRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const urlMatch = sch.koordinat.match(urlRegex);
      if (urlMatch) return [parseFloat(urlMatch[1]), parseFloat(urlMatch[2])];
      return null;
    };

    const getSchoolCoordinates = (sch) => {
      const parsed = parseCoordinates(sch);
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

      const base = centers[sch.kabupaten] || [-0.0263, 109.3425];
      const npsnNum = parseInt(sch.npsn) || 0;
      const latOffset = ((npsnNum % 100) / 100 - 0.5) * 0.12;
      const lngOffset = (((npsnNum / 100) % 100) / 100 - 0.5) * 0.12;
      return [base[0] + latOffset, base[1] + lngOffset];
    };

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = window.L.map(mapRef.current, { zoomControl: true }).setView([-0.0263, 109.3425], 8);
    mapInstanceRef.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const markers = [];

    filteredSchools.forEach(sch => {
      const coords = getSchoolCoordinates(sch);
      const prog = Number(sch.progres_fisik) || 0;

      let pulseColor = 'bg-indigo-400';
      let coreColor = 'bg-indigo-500 shadow-indigo-500/50';
      if (prog === 100) {
        pulseColor = 'bg-emerald-400';
        coreColor = 'bg-emerald-500 shadow-emerald-500/50';
      } else if (prog === 0) {
        pulseColor = 'bg-amber-400';
        coreColor = 'bg-amber-500 shadow-amber-500/50';
      }

      const customIcon = window.L.divIcon({
        html: `<div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full ${pulseColor} opacity-30"></span>
          <div class="relative rounded-full h-4 w-4 ${coreColor} border-2 border-slate-950 flex items-center justify-center shadow-lg cursor-pointer">
            <div class="h-1.5 w-1.5 rounded-full bg-white"></div>
          </div>
        </div>`,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = window.L.marker(coords, { icon: customIcon });
      const fasilObj = users.find(u => u.id === sch.fasilitatorId);
      const fasilName = fasilObj ? fasilObj.nama : 'Belum Ditentukan';

      const popupHtml = `
        <div class="p-2 font-sans" style="color: #f1f5f9; min-width: 170px;">
          <div class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">NPSN ${sch.npsn}</div>
          <h4 class="font-bold text-xs text-white mt-0.5 leading-snug">${sch.nama_sekolah}</h4>
          <div class="text-[10px] text-slate-350 mt-1">Kab. ${sch.kabupaten || '-'}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">Fasil: <span class="text-indigo-300 font-semibold">${fasilName}</span></div>
          <div class="flex items-center gap-1.5 text-[11px] text-slate-200 mt-2 font-bold">
            <span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${prog}% Progres</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: true, maxWidth: 220 });
      marker.addTo(map);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = new window.L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.15));
    }

    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [schools, users, selectedFacilitator]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-xl">
      <div ref={mapRef} className="w-full h-full z-10" />
    </div>
  );
}

// Colors for SVG line charts
const LINE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
  '#06b6d4', '#f97316', '#14b8a6', '#a855f7', '#3b82f6',
  '#eab308', '#ef4444', '#64748b', '#0284c7', '#d97706'
];

export default function PublicDashboard({ 
  schools = [], 
  users = [], 
  weeklyProgress = [], 
  settings = {}, 
  programName = 'Revitalisasi Sekolah Dasar 2026',
  contacts = [],
  tasks = [],
  schoolDocs = [],
  kendala = [],
  kendalaComments = [],
  kendalaDocs = [],
  onLogin, 
  onBack 
}) {
  // Filters State
  const [chartFasilitatorFilter, setChartFasilitatorFilter] = useState('all');
  const [deviasiFasilitatorFilter, setDeviasiFasilitatorFilter] = useState('all');
  const [deviasiTypeFilter, setDeviasiTypeFilter] = useState('all'); // 'all' | 'negatif' | 'positif'
  const [tableFasilitatorFilter, setTableFasilitatorFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [tableSortField, setTableSortField] = useState('progres_fisik'); // Default sort by highest progress
  const [tableSortDir, setTableSortDir] = useState('desc');

  // Modals State
  const [activeModalCard, setActiveModalCard] = useState(null); // 'pks' | 'mc0' | 'progress50' | null
  const [mc0SubTab, setMc0SubTab] = useState('all'); // 'all' | 'belum' | 'tanpa_dokumen' | 'lengkap'
  const [pksSubTab, setPksSubTab] = useState('belum'); // 'belum' | 'sudah' | 'all'
  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState(null);

  // Chart Tooltips State
  const [kumulatifHover, setKumulatifHover] = useState(null);
  const [deviasiHover, setDeviasiHover] = useState(null);

  // Chart Zoom State
  const [kumZoomLevel, setKumZoomLevel] = useState(0);
  const [devZoomLevel, setDevZoomLevel] = useState(0);

  // Chart Fullscreen State: null | 'kumulatif' | 'deviasi'
  const [fullscreenChart, setFullscreenChart] = useState(null);

  // Helper matching school ID
  const isSameSchool = (w, sch) => {
    if (!w || !sch) return false;
    const wId = String(w.schoolId || w.sekolahId || w.schoolNpsn || w.npsn || '').trim();
    const sId = String(sch.npsn || sch.id || sch.sekolahId || '').trim();
    return wId.length > 0 && sId.length > 0 && (wId === sId || wId.endsWith(sId) || sId.endsWith(wId));
  };

  // Helper: detect the last week where actual data input was made for a specific school
  const getSchoolLastWeek = (sch, wpArray) => {
    const schoolWp = (wpArray || [])
      .filter(w => isSameSchool(w, sch))
      .sort((a, b) => Number(a.minggu) - Number(b.minggu));

    if (schoolWp.length === 0) {
      return Number(sch?.progres_fisik) > 0 ? 4 : 1;
    }

    let lastWeek = 0;

    // 1. Check for realisasi > 0
    schoolWp.forEach(w => {
      if (Number(w.realisasi) > 0) {
        lastWeek = Math.max(lastWeek, Number(w.minggu));
      }
    });

    // 2. Fallback: detect last week where kumulatif changed from previous week
    if (lastWeek === 0) {
      for (let i = 0; i < schoolWp.length; i++) {
        const val = Number(schoolWp[i].kumulatif) || 0;
        const prevVal = i > 0 ? (Number(schoolWp[i - 1].kumulatif) || 0) : 0;
        if (val > 0 && val !== prevVal) {
          lastWeek = Number(schoolWp[i].minggu);
        }
      }
    }

    // 3. Fallback: if kumulatif > 0 exists at M1
    if (lastWeek === 0) {
      const first = schoolWp.find(w => Number(w.kumulatif) > 0);
      if (first) lastWeek = Number(first.minggu);
    }

    return Math.max(1, lastWeek || (Number(sch?.progres_fisik) > 0 ? 4 : 1));
  };

  // Facilitators list
  const facilitators = users.filter(u => u.jabatanTim === 'Fasilitator' || u.role === 'fasilitator')
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const getFacilitatorName = (sch) => {
    if (!sch) return 'Belum Ditentukan';
    const f = users.find(u => u.id === sch.fasilitatorId);
    return f ? f.nama : 'Belum Ditentukan';
  };

  const isPksDone = (sch) => {
    if (!sch.tanggal_pks) return false;
    const str = String(sch.tanggal_pks).trim().toLowerCase();
    return str !== '' && str !== 'belum' && !str.startsWith('belum');
  };

  const getMc0Info = (sch) => {
    if (!sch.tanggal_mc0) return { status: 'belum', label: 'Belum MC-0' };
    const dateStr = String(sch.tanggal_mc0).trim().toLowerCase();
    if (dateStr === '' || dateStr === 'belum' || dateStr.startsWith('belum')) {
      return { status: 'belum', label: 'Belum MC-0' };
    }
    const kel = String(sch.kelengkapan_mc0 || '').trim().toLowerCase();
    if (kel.includes('sesuai') && kel.includes('lengkap')) {
      return { status: 'lengkap', label: 'MC-0 (Dokumen Lengkap)' };
    }
    return { status: 'tanpa_dokumen', label: 'MC-0 (Dokumen Belum Lengkap)' };
  };

  const isDanaTahap1Done = (sch) => {
    if (!sch.tanggal_dana_tahap1) return false;
    const str = String(sch.tanggal_dana_tahap1).trim().toLowerCase();
    return str !== '' && str !== 'belum' && !str.startsWith('belum');
  };

  const getLastWeeklyUpdate = (schoolId) => {
    const schoolRecords = weeklyProgress.filter(w => String(w.schoolId) === String(schoolId));
    if (schoolRecords.length === 0) return null;
    return schoolRecords.reduce((max, curr) => (curr.minggu > max.minggu ? curr : max), schoolRecords[0]);
  };

  // Card Calculations
  const totalSchools = schools.length;
  const progressStartedList = schools.filter(s => (Number(s.progres_fisik) || 0) > 0);
  const progressStartedCount = progressStartedList.length;
  const progressStartedPct = totalSchools > 0 ? Math.round((progressStartedCount / totalSchools) * 100) : 0;

  const pksDoneList = schools.filter(isPksDone);
  const pksBelumList = schools.filter(s => !isPksDone(s));
  const pksDoneCount = pksDoneList.length;
  const pksPct = totalSchools > 0 ? Math.round((pksDoneCount / totalSchools) * 100) : 0;

  const mc0StatusList = schools.map(s => ({ school: s, ...getMc0Info(s) }));
  const mc0BelumList = mc0StatusList.filter(item => item.status === 'belum');
  const mc0TanpaDokumenList = mc0StatusList.filter(item => item.status === 'tanpa_dokumen');
  const mc0LengkapList = mc0StatusList.filter(item => item.status === 'lengkap');
  const mc0DoneCount = mc0TanpaDokumenList.length + mc0LengkapList.length;

  const progress50List = schools.filter(s => (Number(s.progres_fisik) || 0) >= 50);
  const progress50Count = progress50List.length;

  const avgProgress = totalSchools > 0 
    ? (schools.reduce((sum, s) => sum + (Number(s.progres_fisik) || 0), 0) / totalSchools).toFixed(1)
    : '0';

  // SVG Chart 1: Progres Kumulatif
  const ABSOLUTE_MAX_WEEKS = 24;
  const filteredKumulatifSchools = chartFasilitatorFilter === 'all'
    ? schools
    : schools.filter(s => s.fasilitatorId === chartFasilitatorFilter);

  // Compute the effective max week from actual data
  // GSheet may pre-fill rows for all 24 weeks, but only weeks with realisasi > 0 have real data.
  // We detect the last week where ANY school has a non-zero realisasi (actual weekly increment).
  const dataMaxWeek = useMemo(() => {
    if (!weeklyProgress || weeklyProgress.length === 0) return 4;

    let lastActiveWeek = 0;
    weeklyProgress.forEach(wp => {
      const realisasi = Number(wp.realisasi) || 0;
      const kumulatif = Number(wp.kumulatif) || 0;
      const minggu = Number(wp.minggu) || 0;
      if ((realisasi > 0 || kumulatif > 0) && minggu > lastActiveWeek) {
        lastActiveWeek = minggu;
      }
    });

    if (lastActiveWeek === 0) {
      weeklyProgress.forEach(wp => {
        const m = Number(wp.minggu) || 0;
        if (m > lastActiveWeek) lastActiveWeek = m;
      });
    }

    return Math.max(4, Math.min(24, lastActiveWeek || 4));
  }, [weeklyProgress]);

  // Auto-fit range: dataMaxWeek + 2 buffer (capped at 24)
  const autoFitWeeks = Math.min(ABSOLUTE_MAX_WEEKS, dataMaxWeek + 2);

  // Apply zoom: each zoom level adjusts by ±3 weeks
  const kumDisplayWeeks = Math.max(4, Math.min(ABSOLUTE_MAX_WEEKS, autoFitWeeks - kumZoomLevel * 3));
  const devDisplayWeeks = Math.max(4, Math.min(ABSOLUTE_MAX_WEEKS, autoFitWeeks - devZoomLevel * 3));

  // Helper: generate nice x-axis tick values for a given display range
  const getXTicks = (displayWeeks) => {
    const ticks = [1];
    if (displayWeeks <= 6) {
      for (let i = 2; i <= displayWeeks; i++) ticks.push(i);
    } else if (displayWeeks <= 12) {
      const step = 2;
      for (let i = step + 1; i <= displayWeeks; i += step) ticks.push(i);
      if (!ticks.includes(displayWeeks)) ticks.push(displayWeeks);
    } else {
      const step = Math.ceil(displayWeeks / 6);
      for (let i = step + 1; i <= displayWeeks; i += step) ticks.push(i);
      if (!ticks.includes(displayWeeks)) ticks.push(displayWeeks);
    }
    return [...new Set(ticks)].sort((a, b) => a - b);
  };

  const kumulatifChartWidth = 760;
  const kumulatifChartHeight = 280;
  const kumPadding = { top: 25, right: 170, bottom: 35, left: 45 };
  const kumPlotWidth = kumulatifChartWidth - kumPadding.left - kumPadding.right;
  const kumPlotHeight = kumulatifChartHeight - kumPadding.top - kumPadding.bottom;

  const getKumulatifX = (week) => kumPadding.left + ((week - 1) / (kumDisplayWeeks - 1)) * kumPlotWidth;
  const getKumulatifY = (pct) => kumPadding.top + (1 - Math.min(100, Math.max(0, pct)) / 100) * kumPlotHeight;

  // SVG Chart 2: Deviasi
  const filteredDeviasiSchoolsInitial = deviasiFasilitatorFilter === 'all'
    ? schools
    : schools.filter(s => s.fasilitatorId === deviasiFasilitatorFilter);

  const filteredDeviasiSchools = filteredDeviasiSchoolsInitial.filter(sch => {
    const lastRec = getLastWeeklyUpdate(sch.npsn);
    const devVal = lastRec ? Number(lastRec.deviasi) || 0 : 0;
    if (deviasiTypeFilter === 'negatif') return devVal < 0;
    if (deviasiTypeFilter === 'positif') return devVal >= 0;
    return true;
  });

  const deviasiChartWidth = 760;
  const deviasiChartHeight = 280;
  const devPadding = { top: 25, right: 170, bottom: 35, left: 45 };
  const devPlotWidth = deviasiChartWidth - devPadding.left - devPadding.right;
  const devPlotHeight = deviasiChartHeight - devPadding.top - devPadding.bottom;

  const maxDevAbs = 25; // -25% to +25%
  const getDeviasiX = (week) => devPadding.left + ((week - 1) / (devDisplayWeeks - 1)) * devPlotWidth;
  const getDeviasiY = (devVal) => {
    const clamped = Math.min(maxDevAbs, Math.max(-maxDevAbs, devVal));
    const norm = (clamped + maxDevAbs) / (2 * maxDevAbs); // 0 to 1
    return devPadding.top + (1 - norm) * devPlotHeight;
  };
  const zeroDeviasiY = getDeviasiY(0);

  // Point Generator Helpers for Line Charts
  const getKumulatifPoints = (sch) => {
    const schoolWp = weeklyProgress
      .filter(w => isSameSchool(w, sch))
      .sort((a, b) => Number(a.minggu) - Number(b.minggu));

    const totalProg = Number(sch.progres_fisik) || 0;
    const lastWeek = getSchoolLastWeek(sch, weeklyProgress);

    let points = [];

    const activeWp = schoolWp.filter(w => Number(w.minggu) <= lastWeek && Number(w.minggu) <= kumDisplayWeeks);

    if (activeWp.length > 0) {
      if (Number(activeWp[0].minggu) > 1) {
        points.push({ week: 1, x: getKumulatifX(1), y: getKumulatifY(0), val: 0 });
      }
      activeWp.forEach(w => {
        const val = Number(w.kumulatif) || 0;
        points.push({ week: Number(w.minggu), x: getKumulatifX(Number(w.minggu)), y: getKumulatifY(val), val });
      });
    } else if (totalProg > 0) {
      const targetWeek = Math.min(kumDisplayWeeks, lastWeek);
      points.push({ week: 1, x: getKumulatifX(1), y: getKumulatifY(0), val: 0 });
      for (let w = 2; w < targetWeek; w++) {
        const interpVal = Math.round((w - 1) / (targetWeek - 1) * totalProg * 100) / 100;
        points.push({ week: w, x: getKumulatifX(w), y: getKumulatifY(interpVal), val: interpVal });
      }
      points.push({ week: targetWeek, x: getKumulatifX(targetWeek), y: getKumulatifY(totalProg), val: totalProg });
    } else {
      points.push({ week: 1, x: getKumulatifX(1), y: getKumulatifY(0), val: 0 });
      if (lastWeek > 1) {
        points.push({ week: lastWeek, x: getKumulatifX(lastWeek), y: getKumulatifY(0), val: 0 });
      }
    }

    return points;
  };

  const getDeviasiPoints = (sch) => {
    const schoolWp = weeklyProgress
      .filter(w => isSameSchool(w, sch))
      .sort((a, b) => Number(a.minggu) - Number(b.minggu));

    const totalProg = Number(sch.progres_fisik) || 0;
    const lastWeek = getSchoolLastWeek(sch, weeklyProgress);

    let points = [];

    const activeWp = schoolWp.filter(w => Number(w.minggu) <= lastWeek && Number(w.minggu) <= devDisplayWeeks);

    if (activeWp.length > 0) {
      if (Number(activeWp[0].minggu) > 1) {
        points.push({ week: 1, x: getDeviasiX(1), y: getDeviasiY(0), val: 0 });
      }
      activeWp.forEach(w => {
        const devVal = Number(w.deviasi) || (Number(w.kumulatif || 0) - Number(w.rencana || 0));
        points.push({ week: Number(w.minggu), x: getDeviasiX(Number(w.minggu)), y: getDeviasiY(devVal), val: devVal });
      });
    } else if (totalProg > 0) {
      const targetWeek = Math.min(devDisplayWeeks, lastWeek);
      const targetPlan = Math.min(100, Math.round(targetWeek * 4.16 * 100) / 100);
      const endDev = Math.round((totalProg - targetPlan) * 10) / 10;

      points.push({ week: 1, x: getDeviasiX(1), y: getDeviasiY(0), val: 0 });
      for (let w = 2; w < targetWeek; w++) {
        const interpVal = Math.round((w - 1) / (targetWeek - 1) * endDev * 100) / 100;
        points.push({ week: w, x: getDeviasiX(w), y: getDeviasiY(interpVal), val: interpVal });
      }
      points.push({ week: targetWeek, x: getDeviasiX(targetWeek), y: getDeviasiY(endDev), val: endDev });
    } else {
      points.push({ week: 1, x: getDeviasiX(1), y: getDeviasiY(0), val: 0 });
      if (lastWeek > 1) {
        points.push({ week: lastWeek, x: getDeviasiX(lastWeek), y: getDeviasiY(0), val: 0 });
      }
    }

    return points;
  };

  // Filtered & Sorted Table Schools
  const filteredTableSchools = schools.filter(sch => {
    const matchesFasil = tableFasilitatorFilter === 'all' || sch.fasilitatorId === tableFasilitatorFilter;
    const matchesQuery = !tableSearch || 
      sch.nama_sekolah.toLowerCase().includes(tableSearch.toLowerCase()) ||
      sch.npsn.includes(tableSearch) ||
      sch.kabupaten.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesFasil && matchesQuery;
  });

  const handleTableSort = (field) => {
    if (tableSortField === field) {
      setTableSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortField(field);
      setTableSortDir(field === 'nama_sekolah' ? 'asc' : 'desc');
    }
  };

  const sortedTableSchools = useMemo(() => {
    return [...filteredTableSchools].sort((a, b) => {
      let valA, valB;
      if (tableSortField === 'nama_sekolah') {
        valA = String(a.nama_sekolah || '').toLowerCase();
        valB = String(b.nama_sekolah || '').toLowerCase();
        return tableSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (tableSortField === 'progres_fisik') {
        valA = Number(a.progres_fisik) || 0;
        valB = Number(b.progres_fisik) || 0;
      } else if (tableSortField === 'mc0') {
        const rank = { lengkap: 3, tanpa_dokumen: 2, belum: 1 };
        valA = rank[getMc0Info(a).status] || 0;
        valB = rank[getMc0Info(b).status] || 0;
      } else if (tableSortField === 'pks') {
        valA = isPksDone(a) ? 1 : 0;
        valB = isPksDone(b) ? 1 : 0;
      } else if (tableSortField === 'dana') {
        valA = isDanaTahap1Done(a) ? 1 : 0;
        valB = isDanaTahap1Done(b) ? 1 : 0;
      } else if (tableSortField === 'data') {
        valA = getLastWeeklyUpdate(a.npsn)?.minggu || 0;
        valB = getLastWeeklyUpdate(b.npsn)?.minggu || 0;
      } else {
        valA = 0;
        valB = 0;
      }

      if (valA < valB) return tableSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return tableSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTableSchools, tableSortField, tableSortDir, weeklyProgress]);

  const renderSortIcon = (field) => {
    if (tableSortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50 group-hover/th:opacity-100 transition-opacity shrink-0" />;
    }
    return tableSortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-400 font-bold shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-400 font-bold shrink-0" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Outfit',sans-serif] p-4 md:p-8 select-none">
      
      {/* 1. HEADER BAR */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-8">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-md"
              title="Kembali ke Pemilih Program"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wider uppercase font-black px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Dashboard Publik • Read-Only
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
              Sistem Informasi Monitoring {programName}
            </h1>
          </div>
        </div>

        <button
          onClick={onLogin}
          className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer border-0"
        >
          <LogIn className="w-4 h-4" />
          <span>Masuk ke Sistem</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">

        {/* 2. SUMMARY METRIC CARDS (5 Horizontal Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Total Sekolah */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Sekolah</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-3xl font-black text-white">{totalSchools}</div>
                <span className="text-xs font-extrabold text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">{progressStartedPct}% Berprogres</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
                <span>Lokasi Revitalisasi</span>
                <span className="text-indigo-300 font-semibold">{progressStartedCount} Sekolah</span>
              </p>
            </div>
          </div>

          {/* Card 2: Status PKS */}
          <div 
            onClick={() => {
              setPksSubTab('belum');
              setActiveModalCard('pks');
            }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 hover:border-emerald-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-400 transition-colors">Sudah PKS</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{pksDoneCount}</span>
                <span className="text-xs text-slate-400 font-bold">/ {totalSchools}</span>
                <span className="ml-auto text-xs font-extrabold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">{pksPct}%</span>
              </div>
              <p className="text-[11px] text-emerald-400/80 font-medium mt-1 group-hover:underline flex items-center gap-1">
                <span>Klik detail sekolah</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* Card 3: Status MC-0 */}
          <div 
            onClick={() => {
              setMc0SubTab('all');
              setActiveModalCard('mc0');
            }}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-400 transition-colors">Status MC-0</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{mc0DoneCount}</span>
                <span className="text-xs text-slate-400 font-bold">/ {totalSchools}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1 font-medium">
                <span className="text-emerald-400">{mc0LengkapList.length} Lengkap</span> • 
                <span className="text-amber-400">{mc0TanpaDokumenList.length} Belum Doc</span> • 
                <span className="text-rose-400">{mc0BelumList.length} Belum</span>
              </div>
            </div>
          </div>

          {/* Card 4: Progress >= 50% */}
          <div 
            onClick={() => setActiveModalCard('progress50')}
            className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 hover:border-sky-500/50 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 group-hover:text-sky-400 transition-colors">Progres ≥ 50%</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">{progress50Count}</span>
                <span className="text-xs text-slate-400 font-bold">Sekolah</span>
              </div>
              <p className="text-[11px] text-sky-400/80 font-medium mt-1 group-hover:underline flex items-center gap-1">
                <span>Klik detail sekolah</span>
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </div>

          {/* Card 5: Progress Keseluruhan */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Rata-Rata Progres</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="text-3xl font-black text-purple-400">{avgProgress}%</div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, parseFloat(avgProgress)))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. CHARTS SECTION (2 Line Charts Berdampingan) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CHART 1: Line Chart Progres Kumulatif per Sekolah */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Progres Kumulatif per Sekolah</span>
                </h3>
                <p className="text-[11px] text-slate-400">Menampilkan data hingga Minggu {kumDisplayWeeks} (dari {dataMaxWeek} minggu terisi)</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setKumZoomLevel(prev => Math.min(prev + 1, Math.floor((autoFitWeeks - 4) / 3)))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setKumZoomLevel(prev => Math.max(prev - 1, -Math.floor((ABSOLUTE_MAX_WEEKS - autoFitWeeks) / 3)))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setKumZoomLevel(0)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFullscreenChart('kumulatif')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Filter Fasilitator */}
                <select
                  value={chartFasilitatorFilter}
                  onChange={(e) => setChartFasilitatorFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="all">Semua Fasilitator ({schools.length} Sekolah)</option>
                  {facilitators.map(f => (
                    <option key={f.id} value={f.id}>{f.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="relative w-full overflow-x-auto no-scrollbar">
              <svg 
                viewBox={`0 0 ${kumulatifChartWidth} ${kumulatifChartHeight}`} 
                className="w-full h-auto min-w-[500px]"
              >
                {/* Horizontal Grid lines (Y-axis 0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map(val => {
                  const y = getKumulatifY(val);
                  return (
                    <g key={val}>
                      <line 
                        x1={kumPadding.left} 
                        y1={y} 
                        x2={kumulatifChartWidth - kumPadding.right} 
                        y2={y} 
                        stroke="#334155" 
                        strokeWidth="1" 
                        strokeDasharray={val === 0 || val === 100 ? "none" : "3 3"} 
                        opacity={val === 0 || val === 100 ? 0.6 : 0.3}
                      />
                      <text 
                        x={kumPadding.left - 8} 
                        y={y + 4} 
                        textAnchor="end" 
                        className="fill-slate-500 text-[9px] font-semibold"
                      >
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* X-axis week ticks (dynamic based on display range) */}
                {getXTicks(kumDisplayWeeks).map(w => {
                  const x = getKumulatifX(w);
                  return (
                    <g key={w}>
                      <line 
                        x1={x} 
                        y1={kumPadding.top} 
                        x2={x} 
                        y2={kumulatifChartHeight - kumPadding.bottom} 
                        stroke="#334155" 
                        strokeWidth="1" 
                        strokeDasharray="2 2" 
                        opacity="0.2"
                      />
                      <text 
                        x={x} 
                        y={kumulatifChartHeight - kumPadding.bottom + 16} 
                        textAnchor="middle" 
                        className="fill-slate-400 text-[9px] font-semibold"
                      >
                        M-{w}
                      </text>
                    </g>
                  );
                })}

                {/* Data extent indicator line (vertical dashed) */}
                {dataMaxWeek < kumDisplayWeeks && (
                  <line
                    x1={getKumulatifX(dataMaxWeek)}
                    y1={kumPadding.top}
                    x2={getKumulatifX(dataMaxWeek)}
                    y2={kumulatifChartHeight - kumPadding.bottom}
                    stroke="#6366f1"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    opacity="0.4"
                  />
                )}

                {/* Lines per School */}
                {filteredKumulatifSchools.map((sch, schIdx) => {
                  const color = LINE_COLORS[schIdx % LINE_COLORS.length];
                  const points = getKumulatifPoints(sch);

                  if (points.length === 0) return null;

                  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                  const lastPoint = points[points.length - 1];

                  return (
                    <g key={sch.npsn} className="group/line">
                      <path 
                        d={pathD} 
                        stroke={color} 
                        strokeWidth="2" 
                        fill="none" 
                        className="transition-all duration-200 group-hover/line:stroke-width-4"
                        opacity="0.85"
                      />
                      
                      {/* Data Points */}
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill={color}
                          className="cursor-pointer transition-transform hover:r-5"
                          onMouseEnter={() => setKumulatifHover({ school: sch, point: p })}
                          onMouseLeave={() => setKumulatifHover(null)}
                          onClick={() => setSelectedSchoolDetail(sch)}
                        />
                      ))}

                      {/* Label Nama Sekolah di Ujung Garis */}
                      <text
                        x={lastPoint.x + 6}
                        y={lastPoint.y + 3}
                        className="fill-slate-300 hover:fill-white text-[9px] font-bold cursor-pointer transition-colors"
                        onClick={() => setSelectedSchoolDetail(sch)}
                      >
                        {sch.nama_sekolah.length > 18 ? `${sch.nama_sekolah.substring(0, 16)}...` : sch.nama_sekolah} ({lastPoint.val}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            <p className="text-[10px] text-slate-500 italic mt-2 text-center">
              💡 Klik nama sekolah di ujung garis untuk melihat informasi detail sekolah tersebut.
            </p>
          </div>

          {/* CHART 2: Line Chart Deviasi per Sekolah */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl flex flex-col justify-between">
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Deviasi Progress per Sekolah</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Selisih realisasi kumulatif terhadap target rencana (Baseline = 0%)</p>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setDevZoomLevel(prev => Math.min(prev + 1, Math.floor((autoFitWeeks - 4) / 3)))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDevZoomLevel(prev => Math.max(prev - 1, -Math.floor((ABSOLUTE_MAX_WEEKS - autoFitWeeks) / 3)))}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDevZoomLevel(0)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setFullscreenChart('deviasi')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Filters Container */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Deviasi Type Toggle Buttons */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[10px] font-bold">
                  <button
                    onClick={() => setDeviasiTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${deviasiTypeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setDeviasiTypeFilter('negatif')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${deviasiTypeFilter === 'negatif' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Negatif ↓
                  </button>
                  <button
                    onClick={() => setDeviasiTypeFilter('positif')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${deviasiTypeFilter === 'positif' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Positif ↑
                  </button>
                </div>

                {/* Filter Fasilitator */}
                <select
                  value={deviasiFasilitatorFilter}
                  onChange={(e) => setDeviasiFasilitatorFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="all">Semua Fasil</option>
                  {facilitators.map(f => (
                    <option key={f.id} value={f.id}>{f.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* SVG Chart Container */}
            <div className="relative w-full overflow-x-auto no-scrollbar">
              <svg 
                viewBox={`0 0 ${deviasiChartWidth} ${deviasiChartHeight}`} 
                className="w-full h-auto min-w-[500px]"
              >
                {/* Horizontal Baseline (0%) and Limits (+20%, -20%) */}
                {[-20, -10, 0, 10, 20].map(val => {
                  const y = getDeviasiY(val);
                  const isZero = val === 0;
                  return (
                    <g key={val}>
                      <line 
                        x1={devPadding.left} 
                        y1={y} 
                        x2={deviasiChartWidth - devPadding.right} 
                        y2={y} 
                        stroke={isZero ? "#94a3b8" : "#334155"} 
                        strokeWidth={isZero ? "1.5" : "1"} 
                        strokeDasharray={isZero ? "none" : "3 3"} 
                        opacity={isZero ? 0.8 : 0.3}
                      />
                      <text 
                        x={devPadding.left - 8} 
                        y={y + 4} 
                        textAnchor="end" 
                        className={`text-[9px] font-bold ${isZero ? 'fill-slate-200' : val > 0 ? 'fill-emerald-400' : 'fill-rose-400'}`}
                      >
                        {val > 0 ? `+${val}%` : `${val}%`}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis week ticks (dynamic based on display range) */}
                {getXTicks(devDisplayWeeks).map(w => {
                  const x = getDeviasiX(w);
                  return (
                    <g key={w}>
                      <line 
                        x1={x} 
                        y1={devPadding.top} 
                        x2={x} 
                        y2={deviasiChartHeight - devPadding.bottom} 
                        stroke="#334155" 
                        strokeWidth="1" 
                        strokeDasharray="2 2" 
                        opacity="0.2"
                      />
                      <text 
                        x={x} 
                        y={deviasiChartHeight - devPadding.bottom + 16} 
                        textAnchor="middle" 
                        className="fill-slate-400 text-[9px] font-semibold"
                      >
                        M-{w}
                      </text>
                    </g>
                  );
                })}

                {/* Data extent indicator line (vertical dashed) */}
                {dataMaxWeek < devDisplayWeeks && (
                  <line
                    x1={getDeviasiX(dataMaxWeek)}
                    y1={devPadding.top}
                    x2={getDeviasiX(dataMaxWeek)}
                    y2={deviasiChartHeight - devPadding.bottom}
                    stroke="#f59e0b"
                    strokeWidth="1"
                    strokeDasharray="4 3"
                    opacity="0.4"
                  />
                )}

                {/* Lines per School */}
                {filteredDeviasiSchools.map((sch) => {
                  const points = getDeviasiPoints(sch);

                  if (points.length === 0) return null;

                  const lastPoint = points[points.length - 1];
                  const isNeg = lastPoint.val < 0;
                  const strokeColor = isNeg ? '#ef4444' : '#10b981';

                  const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

                  return (
                    <g key={sch.npsn} className="group/line">
                      <path 
                        d={pathD} 
                        stroke={strokeColor} 
                        strokeWidth="2" 
                        fill="none" 
                        className="transition-all duration-200 group-hover/line:stroke-width-4"
                        opacity="0.8"
                      />
                      
                      {/* Data Points */}
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill={strokeColor}
                          className="cursor-pointer transition-transform hover:r-5"
                          onMouseEnter={() => setDeviasiHover({ school: sch, point: p })}
                          onMouseLeave={() => setDeviasiHover(null)}
                          onClick={() => setSelectedSchoolDetail(sch)}
                        />
                      ))}

                      {/* Label Nama Sekolah di Ujung Garis */}
                      <text
                        x={lastPoint.x + 6}
                        y={lastPoint.y + 3}
                        className={`text-[9px] font-bold cursor-pointer transition-colors ${isNeg ? 'fill-rose-400 hover:fill-rose-200' : 'fill-emerald-400 hover:fill-emerald-200'}`}
                        onClick={() => setSelectedSchoolDetail(sch)}
                      >
                        {sch.nama_sekolah.length > 18 ? `${sch.nama_sekolah.substring(0, 16)}...` : sch.nama_sekolah} ({lastPoint.val > 0 ? `+${lastPoint.val}` : lastPoint.val}%)
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <p className="text-[10px] text-slate-500 italic mt-2 text-center">
              💡 Garis merah menandakan deviasi keterlambatan progres (&lt; 0%), garis hijau menandakan progres melampaui target (≥ 0%).
            </p>
          </div>

        </div>

        {/* 4. TABEL MONITORING SEKOLAH & PETA SEBARAN (Side-by-Side or Stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: TABEL MONITORING SEKOLAH (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-400" />
                  <span>Tabel Rekapitulasi Sekolah</span>
                </h3>
                <p className="text-[11px] text-slate-400">Daftar lengkap sekolah beserta status PKS, MC-0, & progres fisik</p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Cari sekolah..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all w-36 sm:w-44"
                  />
                </div>

                <select
                  value={tableFasilitatorFilter}
                  onChange={(e) => setTableFasilitatorFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                >
                  <option value="all">Semua Fasil</option>
                  {facilitators.map(f => (
                    <option key={f.id} value={f.id}>{f.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto no-scrollbar max-h-[420px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold sticky top-0 z-10 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th 
                      onClick={() => handleTableSort('nama_sekolah')} 
                      className="py-2.5 px-3 cursor-pointer select-none group/th hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Nama Sekolah</span>
                        {renderSortIcon('nama_sekolah')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleTableSort('progres_fisik')} 
                      className="py-2.5 px-3 text-center cursor-pointer select-none group/th hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Progress</span>
                        {renderSortIcon('progres_fisik')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleTableSort('mc0')} 
                      className="py-2.5 px-3 text-center cursor-pointer select-none group/th hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>MC-0</span>
                        {renderSortIcon('mc0')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleTableSort('pks')} 
                      className="py-2.5 px-3 text-center cursor-pointer select-none group/th hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>PKS</span>
                        {renderSortIcon('pks')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleTableSort('dana')} 
                      className="py-2.5 px-3 text-center cursor-pointer select-none group/th hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Dana T1</span>
                        {renderSortIcon('dana')}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleTableSort('data')} 
                      className="py-2.5 px-3 text-center cursor-pointer select-none group/th hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Data</span>
                        {renderSortIcon('data')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sortedTableSchools.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500 italic text-xs">
                        Tidak ada data sekolah yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    sortedTableSchools.map((sch, idx) => {
                      const prog = Number(sch.progres_fisik) || 0;
                      const pksOk = isPksDone(sch);
                      const mc0Info = getMc0Info(sch);
                      const danaOk = isDanaTahap1Done(sch);
                      const lastUpdate = getLastWeeklyUpdate(sch.npsn);
                      const fasilName = getFacilitatorName(sch);

                      return (
                        <tr 
                          key={sch.npsn}
                          onClick={() => setSelectedSchoolDetail(sch)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3 text-slate-500 font-mono font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-tight">
                              {sch.nama_sekolah}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Fasil: <span className="text-slate-400 font-semibold">{fasilName}</span> • Kab. {sch.kabupaten || '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center min-w-[100px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${prog === 100 ? 'bg-emerald-500' : prog >= 50 ? 'bg-sky-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, Math.max(0, prog))}%` }}
                                />
                              </div>
                              <span className="font-extrabold text-[11px] text-slate-200 w-8 text-right">{prog}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {mc0Info.status === 'lengkap' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="MC-0 Lengkap">
                                Ya
                              </span>
                            ) : mc0Info.status === 'tanpa_dokumen' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Belum Dokumen">
                                Ya*
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Tidak
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {pksOk ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ya</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Tidak</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {danaOk ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ya</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Tidak</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-[11px] text-indigo-300">
                            {lastUpdate ? `M-${lastUpdate.minggu}` : '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT: PETA SEBARAN SEKOLAH (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Peta Sebaran Sekolah</span>
                </h3>
                <p className="text-[11px] text-slate-400">Lokasi titik geografis sekolah ter-filter</p>
              </div>

              <span className="text-[10px] font-bold text-slate-400 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800">
                {tableFasilitatorFilter === 'all' ? `${schools.length} Lokasi` : 'Terfilter'}
              </span>
            </div>

            <PublicMap 
              schools={schools} 
              users={users} 
              selectedFacilitator={tableFasilitatorFilter} 
              onSelectSchool={(sch) => setSelectedSchoolDetail(sch)}
            />
          </div>

        </div>

      </div>

      {/* FULLSCREEN CHART MODAL */}
      {fullscreenChart && (
        <div 
          className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex flex-col animate-fade-in select-none p-4 md:p-6"
          onKeyDown={(e) => { if (e.key === 'Escape') setFullscreenChart(null); }}
          tabIndex={0}
          ref={(el) => el && el.focus()}
        >
          {/* Main Fullscreen Container Card */}
          <div className="flex-1 bg-slate-900/95 border border-slate-800/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Fullscreen Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-800/80 shrink-0 gap-3 bg-slate-950/40">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  {fullscreenChart === 'kumulatif' ? (
                    <><TrendingUp className="w-5 h-5 text-indigo-400" /> Progres Kumulatif per Sekolah</>
                  ) : (
                    <><AlertTriangle className="w-5 h-5 text-amber-400" /> Deviasi Progress per Sekolah</>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {fullscreenChart === 'kumulatif'
                    ? `Menampilkan data hingga Minggu ${kumDisplayWeeks} (dari ${dataMaxWeek} minggu terisi)`
                    : 'Selisih realisasi kumulatif terhadap target rencana (Baseline = 0%)'
                  }
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => fullscreenChart === 'kumulatif'
                      ? setKumZoomLevel(prev => Math.min(prev + 1, Math.floor((autoFitWeeks - 4) / 3)))
                      : setDevZoomLevel(prev => Math.min(prev + 1, Math.floor((autoFitWeeks - 4) / 3)))
                    }
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fullscreenChart === 'kumulatif'
                      ? setKumZoomLevel(prev => Math.max(prev - 1, -Math.floor((ABSOLUTE_MAX_WEEKS - autoFitWeeks) / 3)))
                      : setDevZoomLevel(prev => Math.max(prev - 1, -Math.floor((ABSOLUTE_MAX_WEEKS - autoFitWeeks) / 3)))
                    }
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fullscreenChart === 'kumulatif' ? setKumZoomLevel(0) : setDevZoomLevel(0)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Filters */}
                {fullscreenChart === 'kumulatif' && (
                  <select
                    value={chartFasilitatorFilter}
                    onChange={(e) => setChartFasilitatorFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="all">Semua Fasilitator ({schools.length})</option>
                    {facilitators.map(f => (
                      <option key={f.id} value={f.id}>{f.nama}</option>
                    ))}
                  </select>
                )}
                {fullscreenChart === 'deviasi' && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-[11px] font-bold">
                      <button onClick={() => setDeviasiTypeFilter('all')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${deviasiTypeFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Semua</button>
                      <button onClick={() => setDeviasiTypeFilter('negatif')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${deviasiTypeFilter === 'negatif' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Negatif ↓</button>
                      <button onClick={() => setDeviasiTypeFilter('positif')} className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${deviasiTypeFilter === 'positif' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>Positif ↑</button>
                    </div>
                    <select
                      value={deviasiFasilitatorFilter}
                      onChange={(e) => setDeviasiFasilitatorFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="all">Semua Fasil</option>
                      {facilitators.map(f => (
                        <option key={f.id} value={f.id}>{f.nama}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setFullscreenChart(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer border border-slate-800"
                  title="Tutup Fullscreen (Esc)"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fullscreen Chart Body */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/20">
              {fullscreenChart === 'kumulatif' && (
                <svg 
                  viewBox={`0 0 ${kumulatifChartWidth} ${kumulatifChartHeight}`} 
                  className="w-full h-full max-h-[calc(100vh-160px)]"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Y-axis grid */}
                  {[0, 25, 50, 75, 100].map(val => {
                    const y = getKumulatifY(val);
                    return (
                      <g key={val}>
                        <line x1={kumPadding.left} y1={y} x2={kumulatifChartWidth - kumPadding.right} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray={val === 0 || val === 100 ? "none" : "3 3"} opacity={val === 0 || val === 100 ? 0.7 : 0.4} />
                        <text x={kumPadding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-300 text-[9px] font-bold">{val}%</text>
                      </g>
                    );
                  })}
                  {/* X-axis ticks */}
                  {getXTicks(kumDisplayWeeks).map(w => {
                    const x = getKumulatifX(w);
                    return (
                      <g key={w}>
                        <line x1={x} y1={kumPadding.top} x2={x} y2={kumulatifChartHeight - kumPadding.bottom} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
                        <text x={x} y={kumulatifChartHeight - kumPadding.bottom + 16} textAnchor="middle" className="fill-slate-300 text-[9px] font-bold">M-{w}</text>
                      </g>
                    );
                  })}
                  {/* Data extent line */}
                  {dataMaxWeek < kumDisplayWeeks && (
                    <line x1={getKumulatifX(dataMaxWeek)} y1={kumPadding.top} x2={getKumulatifX(dataMaxWeek)} y2={kumulatifChartHeight - kumPadding.bottom} stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                  )}
                  {/* Lines per School */}
                  {filteredKumulatifSchools.map((sch, schIdx) => {
                    const color = LINE_COLORS[schIdx % LINE_COLORS.length];
                    const points = getKumulatifPoints(sch);

                    if (points.length === 0) return null;
                    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                    const lastPoint = points[points.length - 1];
                    return (
                      <g key={sch.npsn}>
                        <path d={pathD} stroke={color} strokeWidth="2.5" fill="none" opacity="0.9" />
                        {points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill={color} className="cursor-pointer" onMouseEnter={() => setKumulatifHover({ school: sch, point: p })} onMouseLeave={() => setKumulatifHover(null)} onClick={() => setSelectedSchoolDetail(sch)} />
                        ))}
                        <text x={lastPoint.x + 6} y={lastPoint.y + 3} className="fill-slate-200 hover:fill-white text-[9px] font-bold cursor-pointer transition-colors" onClick={() => setSelectedSchoolDetail(sch)}>
                          {sch.nama_sekolah.length > 18 ? `${sch.nama_sekolah.substring(0, 16)}...` : sch.nama_sekolah} ({lastPoint.val}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}

              {fullscreenChart === 'deviasi' && (
                <svg 
                  viewBox={`0 0 ${deviasiChartWidth} ${deviasiChartHeight}`} 
                  className="w-full h-full max-h-[calc(100vh-160px)]"
                  preserveAspectRatio="xMidYMid meet"
                >
                  {/* Y-axis grid */}
                  {[-20, -10, 0, 10, 20].map(val => {
                    const y = getDeviasiY(val);
                    const isZero = val === 0;
                    return (
                      <g key={val}>
                        <line x1={devPadding.left} y1={y} x2={deviasiChartWidth - devPadding.right} y2={y} stroke={isZero ? "#94a3b8" : "#334155"} strokeWidth={isZero ? "1.5" : "1"} strokeDasharray={isZero ? "none" : "3 3"} opacity={isZero ? 0.9 : 0.4} />
                        <text x={devPadding.left - 8} y={y + 4} textAnchor="end" className={`text-[9px] font-bold ${isZero ? 'fill-slate-100' : val > 0 ? 'fill-emerald-400' : 'fill-rose-400'}`}>
                          {val > 0 ? `+${val}%` : `${val}%`}
                        </text>
                      </g>
                    );
                  })}
                  {/* X-axis ticks */}
                  {getXTicks(devDisplayWeeks).map(w => {
                    const x = getDeviasiX(w);
                    return (
                      <g key={w}>
                        <line x1={x} y1={devPadding.top} x2={x} y2={deviasiChartHeight - devPadding.bottom} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" opacity="0.3" />
                        <text x={x} y={deviasiChartHeight - devPadding.bottom + 16} textAnchor="middle" className="fill-slate-300 text-[9px] font-bold">M-{w}</text>
                      </g>
                    );
                  })}
                  {/* Data extent line */}
                  {dataMaxWeek < devDisplayWeeks && (
                    <line x1={getDeviasiX(dataMaxWeek)} y1={devPadding.top} x2={getDeviasiX(dataMaxWeek)} y2={deviasiChartHeight - devPadding.bottom} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
                  )}
                  {/* Lines per School */}
                  {filteredDeviasiSchools.map((sch) => {
                    const points = getDeviasiPoints(sch);

                    if (points.length === 0) return null;
                    const lastPoint = points[points.length - 1];
                    const isNeg = lastPoint.val < 0;
                    const strokeColor = isNeg ? '#ef4444' : '#10b981';
                    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
                    return (
                      <g key={sch.npsn}>
                        <path d={pathD} stroke={strokeColor} strokeWidth="2.5" fill="none" opacity="0.9" />
                        {points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill={strokeColor} className="cursor-pointer" onMouseEnter={() => setDeviasiHover({ school: sch, point: p })} onMouseLeave={() => setDeviasiHover(null)} onClick={() => setSelectedSchoolDetail(sch)} />
                        ))}
                        <text x={lastPoint.x + 6} y={lastPoint.y + 3} className={`text-[9px] font-bold cursor-pointer transition-colors ${isNeg ? 'fill-rose-300 hover:fill-rose-100' : 'fill-emerald-300 hover:fill-emerald-100'}`} onClick={() => setSelectedSchoolDetail(sch)}>
                          {sch.nama_sekolah.length > 18 ? `${sch.nama_sekolah.substring(0, 16)}...` : sch.nama_sekolah} ({lastPoint.val > 0 ? `+${lastPoint.val}` : lastPoint.val}%)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-slate-800/80 text-center shrink-0 bg-slate-950/40">
              <p className="text-[11px] text-slate-400">
                {fullscreenChart === 'kumulatif' 
                  ? '💡 Klik nama sekolah di ujung garis untuk melihat informasi detail sekolah tersebut.'
                  : '💡 Garis merah menandakan deviasi keterlambatan (< 0%), garis hijau menandakan progres melampaui target (≥ 0%).'
                }
                &nbsp;Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 text-[10px] font-mono border border-slate-700">Esc</kbd> atau klik ikon di pojok kanan atas untuk keluar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP MODAL: CARD DETAILS (PKS / MC-0 / Progress 50%) */}
      {activeModalCard && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-5 relative">
            
            <button
              onClick={() => setActiveModalCard(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title Header */}
            {activeModalCard === 'pks' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" /> Detail Perjanjian Kerja Sama (PKS)
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Daftar Status Perjanjian Kerja Sama (PKS)
                </h3>

                {/* Sub-Tabs for PKS */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setPksSubTab('belum')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${pksSubTab === 'belum' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                  >
                    Belum PKS ({pksBelumList.length})
                  </button>
                  <button
                    onClick={() => setPksSubTab('sudah')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${pksSubTab === 'sudah' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                  >
                    Sudah PKS ({pksDoneList.length})
                  </button>
                  <button
                    onClick={() => setPksSubTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${pksSubTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'}`}
                  >
                    Semua ({totalSchools})
                  </button>
                </div>
              </div>
            )}

            {activeModalCard === 'mc0' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <FileText className="w-4 h-4" /> Detail Mutual Check 0 (MC-0)
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  Daftar Status Pelaksanaan & Kelengkapan MC-0
                </h3>

                {/* Sub-Tabs for MC0 */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => setMc0SubTab('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mc0SubTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Semua ({mc0StatusList.length})
                  </button>
                  <button
                    onClick={() => setMc0SubTab('lengkap')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mc0SubTab === 'lengkap' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    MC-0 + Dokumen Lengkap ({mc0LengkapList.length})
                  </button>
                  <button
                    onClick={() => setMc0SubTab('tanpa_dokumen')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mc0SubTab === 'tanpa_dokumen' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    MC-0 Belum Kirim Dokumen ({mc0TanpaDokumenList.length})
                  </button>
                  <button
                    onClick={() => setMc0SubTab('belum')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mc0SubTab === 'belum' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                  >
                    Belum MC-0 ({mc0BelumList.length})
                  </button>
                </div>
              </div>
            )}

            {activeModalCard === 'progress50' && (
              <div>
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4" /> Detail Progres Fisik ≥ 50%
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  Daftar Sekolah yang Telah Mencapai Progres Fisik Minimal 50% ({progress50Count} Sekolah)
                </h3>
              </div>
            )}

            {/* Modal Table Content */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-3">Nama Sekolah</th>
                    <th className="py-3 px-3">Fasilitator</th>
                    <th className="py-3 px-3">Kabupaten</th>
                    <th className="py-3 px-3 text-center">Progress</th>
                    <th className="py-3 px-3 text-center">Status / Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(activeModalCard === 'pks' 
                      ? (pksSubTab === 'belum' ? pksBelumList : pksSubTab === 'sudah' ? pksDoneList : schools)
                      : activeModalCard === 'progress50' 
                      ? progress50List 
                      : schools
                    )
                    .filter(sch => {
                      if (activeModalCard === 'mc0') {
                        const info = getMc0Info(sch);
                        if (mc0SubTab === 'lengkap') return info.status === 'lengkap';
                        if (mc0SubTab === 'tanpa_dokumen') return info.status === 'tanpa_dokumen';
                        if (mc0SubTab === 'belum') return info.status === 'belum';
                      }
                      return true;
                    })
                    .map((sch, idx) => {
                      const pksOk = isPksDone(sch);
                      const mc0Info = getMc0Info(sch);
                      const prog = Number(sch.progres_fisik) || 0;
                      const fasilName = getFacilitatorName(sch);

                      return (
                        <tr 
                          key={sch.npsn} 
                          onClick={() => setSelectedSchoolDetail(sch)}
                          className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3 text-slate-500 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white group-hover:text-indigo-300 group-hover:underline transition-colors flex items-center gap-1.5">
                              <span>{sch.nama_sekolah}</span>
                              <Info className="w-3 h-3 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-indigo-300 font-medium">{fasilName}</td>
                          <td className="py-2.5 px-3 text-slate-400">{sch.kabupaten || '-'}</td>
                          <td className="py-2.5 px-3 text-center font-extrabold text-slate-200">{prog}%</td>
                          <td className="py-2.5 px-3 text-center">
                            {activeModalCard === 'pks' && (
                              pksOk ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  PKS: {sch.tanggal_pks}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  Belum PKS
                                </span>
                              )
                            )}

                            {activeModalCard === 'mc0' && (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                mc0Info.status === 'lengkap' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : mc0Info.status === 'tanpa_dokumen'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {mc0Info.label} {sch.tanggal_mc0 ? `(${sch.tanggal_mc0})` : ''}
                              </span>
                            )}

                            {activeModalCard === 'progress50' && (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Progres Fisik {prog}%
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. POPUP MODAL: DETIL INDIVIDUAL SEKOLAH (READ-ONLY SCHOOLDETAIL VIEW) */}
      {selectedSchoolDetail && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in select-none">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl relative text-slate-100">
            {/* Top Modal Header Bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Read-Only Mode
                </span>
                <h3 className="text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                  {selectedSchoolDetail.nama_sekolah}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSchoolDetail(null)}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer border border-slate-800 flex items-center gap-1.5 text-xs font-bold"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Tutup</span>
              </button>
            </div>

            {/* SchoolDetail Component in Read-Only Mode */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <SchoolDetail
                school={selectedSchoolDetail}
                users={users}
                contacts={contacts}
                tasks={tasks}
                activeUser={null}
                onBack={null}
                schoolDocs={schoolDocs}
                kendala={kendala}
                kendalaComments={kendalaComments}
                kendalaDocs={kendalaDocs}
                weeklyProgress={weeklyProgress}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
