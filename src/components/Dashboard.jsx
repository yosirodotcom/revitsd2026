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
  CircleDollarSign,
  Pencil,
  Check,
  Paperclip,
  Eye,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

function TripMultiMap({ schools, batchList }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.L || !mapRef.current) return;

    const parseCoordinates = (sch) => {
      if (!sch.koordinat) return null;
      const regex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
      const match = sch.koordinat.match(regex);
      if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
      }
      const urlRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const urlMatch = sch.koordinat.match(urlRegex);
      if (urlMatch) {
        return [parseFloat(urlMatch[1]), parseFloat(urlMatch[2])];
      }
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

    const map = window.L.map(mapRef.current, {
      zoomControl: true
    }).setView([-0.0263, 109.3425], 8);
    mapInstanceRef.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const markers = [];

    batchList.forEach(t => {
      const school = schools.find(s => String(s.npsn) === String(t.sekolahId));
      if (!school) return;

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

      const marker = window.L.marker(coords, { icon: customIcon });

      const mapsUrl = school.koordinat && school.koordinat.startsWith('http')
        ? school.koordinat
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(school.koordinat || `${school.nama_sekolah}, Kabupaten ${school.kabupaten}`)}`;

      const popupHtml = `
        <div class="p-1 font-sans" style="color: #f1f5f9; min-width: 140px;">
          <div class="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">NPSN ${school.npsn}</div>
          <h4 class="font-bold text-xs text-slate-100 mt-0.5 leading-snug">${school.nama_sekolah}</h4>
          <div class="flex items-center gap-1.5 text-[10px] text-slate-350 mt-1">
            <span class="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] font-medium text-slate-400">${school.kabupaten}</span>
            <span class="text-emerald-400 font-bold">${school.progres_fisik}% Progres</span>
          </div>
          <div class="mt-2">
            <a href="${mapsUrl}" target="_blank" rel="noreferrer" class="bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold py-1 px-2 rounded-lg transition-colors cursor-pointer text-center no-underline border-0 block">
              Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        maxWidth: 200,
        className: 'custom-leaflet-popup'
      });

      marker.addTo(map);
      markers.push(marker);
    });

    if (markers.length > 0) {
      const group = new window.L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [schools, batchList]);

  return (
    <div className="relative w-full h-[240px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950/60 shadow-xl">
      <div ref={mapRef} className="w-full h-full z-10" />
    </div>
  );
}

const formatDisplayTime = (timeStr) => {
  if (!timeStr) return '';
  const str = String(timeStr).trim();
  try {
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes} WIB`;
      }
    }
    const simpleMatch = str.match(/^(\d{1,2}):(\d{2})/);
    if (simpleMatch) {
      const hours = simpleMatch[1].padStart(2, '0');
      const minutes = simpleMatch[2];
      return `${hours}:${minutes} WIB`;
    }
  } catch (e) {
    // fallback
  }
  return timeStr;
};

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
  tripDocs = [],
  schoolDocs = [],
  onApproveTrip,
  onRejectTrip,
  onApproveTripsBatch,
  onRejectTripsBatch,
  onSelectSchool,
  onViewChange,
  onUpdateSchool,
  expenses = [],
  payments = [],
  meetings = [],
  onDeleteLog,
  onEditLog,
  warnings = [],
  onDismissWarning,
  onResetDatabase
}) {
  const [dates, setDates] = useState({
    projectStartDate: settings.projectStartDate || '2026-06-12',
    projectEndDate: settings.projectEndDate || '2026-12-12',
    googleAppsScriptUrl: settings.googleAppsScriptUrl || '',
    googleAppsScriptToken: settings.googleAppsScriptToken || 'REVITSD2026_SECURE_TOKEN',
    simulatedToday: ''
  });

  const [selectedFacilitator, setSelectedFacilitator] = useState(null);
  const [facModalId, setFacModalId] = useState(null);
  const [facModalTab, setFacModalTab] = useState('reports');
  const [payrollDetailModal, setPayrollDetailModal] = useState(null);
  const [isEditingOperasional, setIsEditingOperasional] = useState(false);
  const [editOperasionalVal, setEditOperasionalVal] = useState('');
  const [editingSchoolNpsn, setEditingSchoolNpsn] = useState(null);
  const [editingValue, setEditingValue] = useState(0);

  const [timelineDensity, setTimelineDensity] = useState('relaxed');
  const [viewMode, setViewMode] = useState('daily'); // 'monthly' | 'weekly' | 'daily'
  const [showDone, setShowDone] = useState(true);
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterType, setFilterType] = useState('all');
  const [visibleRangeText, setVisibleRangeText] = useState('');
  const [logPage, setLogPage] = useState(1);
  const [editingLogId, setEditingLogId] = useState(null);
  const [editingLogText, setEditingLogText] = useState('');
  const scrollContainerRef = React.useRef(null);
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState(null);

  const formatNumberWithDots = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const getDirectImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('data:')) return url;
    
    if (url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('googleusercontent.com')) {
      let fileId = null;
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
      } else {
        const dMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (dMatch && dMatch[1]) {
          fileId = dMatch[1];
        }
      }
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}?authuser=0`;
      }
    }
    return url;
  };

  const formatLogDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    } catch {
      return dateStr;
    }
  };

  const parseNumberFromDots = (str) => {
    if (!str) return 0;
    const cleaned = str.toString().replace(/\./g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const isAdministrasi = activeUser?.jabatanTim === 'Tenaga Administrasi';
  const isSuperAdmin = activeUser?.role === 'admin' || activeUser?.jabatanTim === 'Super Admin';


  const getUserPayrollStatus = (user, month) => {
    const baseMonthly = (user.jabatanTim === 'Tenaga Administrasi' ? settings.honorAdministrasi : settings[`honor${user.jabatanTim.replace(' ', '')}`]) || {
      'Ketua Tim': 7000000,
      'Koordinator': 6000000,
      'Fasilitator': 5000000,
      'Tenaga Administrasi': 5000000
    }[user.jabatanTim] || 5000000;

    const taxPct = user.taxPct !== undefined && user.taxPct !== null ? Number(user.taxPct) : Number(settings.deductionTaxPct ?? 15);
    const lembagaPct = Number(settings.deductionLembagaPct ?? 10);

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
    const projectStart = settings.projectStartDate || '2026-06-12';
    const start = new Date(projectStart);
    start.setMonth(start.getMonth() + Number(month));
    const targetDateStr = start.toISOString().split('T')[0];
    const todayVal = new Date();
    const targetVal = new Date(targetDateStr);
    const isTimeReached = todayVal >= targetVal;

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
      userReport,
      reportFinished,
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

  // Central funding calculations
  const totalProjectContract = settings.totalProjectContract || 1500000000;
  
  const totalAtk = expenses.filter(e => e.kategori === 'atk').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalHonor = expenses.filter(e => e.kategori === 'honor').reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalDinas = expenses.filter(e => e.kategori === 'dinas').reduce((acc, curr) => acc + curr.jumlah, 0);
  
  const biayaNonOperasional = totalHonor;
  const biayaOperasional = settings.biayaOperasional !== undefined && settings.biayaOperasional !== null 
    ? Number(settings.biayaOperasional) 
    : (totalAtk + totalDinas);
  const grandTotalExpenses = biayaOperasional + biayaNonOperasional;

  // Stage 2 & 3 checks
  const ketuaTim = users.find(u => u.jabatanTim === 'Ketua Tim');
  const cond1 = reports.some(r => r.userId === (ketuaTim?.id || 'etty-rabihati') && Number(r.bulanKe) === 4);
  const cond2 = grandTotalExpenses >= 0.50 * totalProjectContract;
  
  const progress50Schools = schools.filter(s => (s.progres_fisik || 0) >= 50);
  const cond3 = schools.length > 0 && (progress50Schools.length / schools.length) >= 0.75;
  const cond4 = progress50Schools.length > 0 && progress50Schools.every(s => 
    s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_50 !== 'belum'
  );

  const isTahap2Eligible = cond1 && cond2 && cond3 && cond4;

  const cond1_t3 = [1,2,3,4,5,6].every(m => reports.some(r => r.userId === (ketuaTim?.id || 'etty-rabihati') && Number(r.bulanKe) === m));
  const progress100Schools = schools.filter(s => (s.progres_fisik || 0) === 100);
  const cond2_t3 = schools.length > 0 && (progress100Schools.length / schools.length) >= 0.90;
  const cond3_t3 = progress100Schools.length > 0 && progress100Schools.every(s => 
    s.dokumen_mingguan !== 'belum' && s.dokumen_bulanan !== 'belum' && s.dokumen_progres_100 !== 'belum'
  );

  const isTahap3Eligible = cond1_t3 && cond2_t3 && cond3_t3;

  const totalDanaPusatDiterima = (settings?.danaTahap1Diterima ? 0.60 * totalProjectContract : 0) + 
                                  (settings?.danaTahap2Diterima ? 0.25 * totalProjectContract : 0) + 
                                  (settings?.danaTahap3Diterima ? 0.15 * totalProjectContract : 0);

  // Sync state if settings change (e.g. from TravelSchedule or another tab)
  useEffect(() => {
    setDates({
      projectStartDate: settings.projectStartDate || '2026-06-12',
      projectEndDate: settings.projectEndDate || '2026-12-12',
      googleAppsScriptUrl: settings.googleAppsScriptUrl || '',
      googleAppsScriptToken: settings.googleAppsScriptToken || 'REVITSD2026_SECURE_TOKEN',
      simulatedToday: ''
    });
  }, [settings]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      ...dates
    });
    window.showAlert('Konfigurasi linimasa global berhasil disimpan!');
  };

  const handleToggleDanaTahap = async (tahapNumber, currentVal) => {
    if (!isAdministrasi && !isSuperAdmin) {
      return window.showAlert('Hanya Tenaga Administrasi atau Super Admin yang dapat mengubah status penerimaan dana.');
    }
    const confirmMsg = currentVal
      ? `Apakah Anda yakin ingin membatalkan konfirmasi penerimaan Dana Tahap ${tahapNumber}?`
      : `Apakah Anda yakin ingin mengonfirmasi bahwa Dana Tahap ${tahapNumber} telah DITERIMA di rekening bendahara?`;
    if (await window.showConfirm(confirmMsg)) {
      onUpdateSettings({
        ...settings,
        [`danaTahap${tahapNumber}Diterima`]: !currentVal
      });
      window.showAlert(`Status Dana Tahap ${tahapNumber} berhasil diperbarui.`);
    }
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
        return 'Anda adalah garda terdepan fasilitasi sekolah dasar. Anda memantau progres konstruksi di lapangan secara mingguan, berkunjung pada progres 50% & 100%, serta melengkapi laporan berkala.';
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
    ? tasks.filter(t => displaySchoolNpsns.includes(t.schoolId || t.sekolahId))
    : tasks;

  const displayReports = isFacilitator
    ? reports.filter(r => r.userId === activeUser.id)
    : reports;

  const displayLogs = isFacilitator
    ? logs.filter(l => l.userId === activeUser.id)
    : logs;

  const totalSchoolsCount = displaySchools.length;

  let totalLabel = "Total Sekolah Binaan";
  let totalCount = schools.length;
  let totalSubtitle = "Sekolah Dasar Master";

  if (isFacilitator) {
    totalLabel = "Sekolah Binaan Anda";
    totalCount = displaySchools.length;
    totalSubtitle = "Sekolah dasar binaan Anda";
  }

  
  const totalProgress = displaySchools.reduce((acc, s) => acc + (s.progres_fisik || 0), 0);
  const avgProgress = displaySchools.length ? (totalProgress / displaySchools.length).toFixed(1) : '0.0';

  let avgLabel = "Rerata Progres Fisik";
  let avgSubtitle = "Dari semua sekolah dasar";
  if (isFacilitator) {
    avgLabel = "Rerata Progres Fisik Anda";
    avgSubtitle = "Rerata sekolah binaan Anda";
  }

  // (Removed old reportsLabel variables)

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
  const currentMonthIdx = Math.min(6, Math.max(1, monthsElapsed + 1));

  // Calculate monthly report percentage of facilitators
  const facilitators = users.filter(u => u.jabatanTim === 'Fasilitator');
  const totalFacs = facilitators.length;

  const getMonthReportPct = (m) => {
    if (totalFacs === 0) return 0;
    const uploadedCount = reports.filter(r => 
      Number(r.bulanKe) === m && 
      facilitators.some(f => f.id === r.userId)
    ).length;
    return Math.round((uploadedCount / totalFacs) * 100);
  };

  const monthlyReportPcts = [1, 2, 3, 4, 5, 6].map(m => {
    if (isFacilitator) {
      const r = reports.find(rep => rep.userId === activeUser.id && Number(rep.bulanKe) === m);
      return r ? 100 : 0;
    }
    return getMonthReportPct(m);
  });
  const currentMonthPct = monthlyReportPcts[currentMonthIdx - 1];

  // Gantt year boundaries
  const projectYear = (() => {
    try {
      return new Date(dates.projectStartDate || '2026-06-12').getFullYear();
    } catch {
      return 2026;
    }
  })();
  const timelineStartStr = `${projectYear}-01-01`;
  const timelineEndStr = `${projectYear}-12-31`;

  const timelineStartMs = new Date(timelineStartStr).getTime();
  const timelineEndMs = new Date(timelineEndStr).getTime();
  const timelineDuration = timelineEndMs - timelineStartMs;

  const monthsList = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

  const weeksList = React.useMemo(() => {
    const list = [];
    const start = new Date(projectYear, 0, 1);
    for (let w = 0; w < 52; w++) {
      const wStart = new Date(start);
      wStart.setDate(start.getDate() + w * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      
      const formatDay = (d) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}`;
      };
      
      list.push({
        index: w + 1,
        label: `W${w + 1}`,
        subLabel: `${formatDay(wStart)} - ${formatDay(wEnd)}`,
        startMs: wStart.getTime(),
        endMs: wEnd.getTime(),
        startDateStr: wStart.toISOString().split('T')[0],
        endDateStr: wEnd.toISOString().split('T')[0]
      });
    }
    return list;
  }, [projectYear]);

  const daysList = React.useMemo(() => {
    const list = [];
    const start = new Date(projectYear, 0, 1);
    const end = new Date(projectYear, 12, 0); // Dec 31
    const daysInYear = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
    
    for (let d = 0; d < daysInYear; d++) {
      const current = new Date(start);
      current.setDate(start.getDate() + d);
      
      const dateStr = current.toISOString().split('T')[0];
      const dayNum = current.getDate();
      
      const indDays = ['M', 'S', 'S', 'R', 'K', 'J', 'S']; // index 0 is Minggu
      const dayLabel = indDays[current.getDay()];
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      
      list.push({
        index: d,
        label: dayLabel,
        dayNum: dayNum,
        dateStr: dateStr,
        isWeekend,
        monthIdx: current.getMonth()
      });
    }
    return list;
  }, [projectYear]);

  const dayMonthsHeader = React.useMemo(() => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const lengths = [31, (projectYear % 4 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return lengths.map((len, idx) => ({
      label: `${months[idx]} ${projectYear}`,
      width: len * 80
    }));
  }, [projectYear]);

  const weekMonthsHeader = React.useMemo(() => {
    const groups = [];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    weeksList.forEach(w => {
      const monthIdx = new Date(w.startMs).getMonth();
      const monthLabel = `${months[monthIdx]} ${projectYear}`;
      
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.label === monthLabel) {
        lastGroup.count += 1;
      } else {
        groups.push({
          label: monthLabel,
          count: 1
        });
      }
    });
    
    return groups.map(g => ({
      label: g.label,
      width: g.count * 150
    }));
  }, [weeksList, projectYear]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    
    if (viewMode === 'daily') {
      const startDayIdx = Math.max(0, Math.floor(scrollLeft / 80));
      const endDayIdx = Math.min(daysList.length - 1, Math.floor((scrollLeft + width) / 80));
      
      const startDay = daysList[startDayIdx];
      const endDay = daysList[endDayIdx];
      
      if (startDay && endDay) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const parseD = (str) => {
          const parts = str.split('-');
          const m = months[parseInt(parts[1], 10) - 1];
          return `${parts[2]} ${m}`;
        };
        const year = startDay.dateStr.split('-')[0];
        setVisibleRangeText(`${parseD(startDay.dateStr)} – ${parseD(endDay.dateStr)} ${year}`);
      }
    } else if (viewMode === 'weekly') {
      const startWeekIdx = Math.max(0, Math.floor(scrollLeft / 150));
      const endWeekIdx = Math.min(weeksList.length - 1, Math.floor((scrollLeft + width) / 150));
      
      const startWeek = weeksList[startWeekIdx];
      const endWeek = weeksList[endWeekIdx];
      
      if (startWeek && endWeek) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        const parseD = (str) => {
          const parts = str.split('-');
          const m = months[parseInt(parts[1], 10) - 1];
          return `${parts[2]} ${m}`;
        };
        const year = startWeek.startDateStr.split('-')[0];
        setVisibleRangeText(`${parseD(startWeek.startDateStr)} – ${parseD(endWeek.endDateStr)} ${year}`);
      }
    }
  };

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      const step = viewMode === 'daily' ? 80 * 7 : 150 * 4;
      scrollContainerRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      const step = viewMode === 'daily' ? 80 * 7 : 150 * 4;
      scrollContainerRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll();
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [viewMode, daysList, weeksList]);

  useEffect(() => {
    if (viewMode === 'monthly' || !scrollContainerRef.current) return;
    
    const timer = setTimeout(() => {
      if (viewMode === 'daily') {
        const jan1 = new Date(projectYear, 0, 1);
        const todayD = new Date(todayStr);
        const daysDiff = Math.max(0, Math.round((todayD - jan1) / (24 * 60 * 60 * 1000)));
        const targetDays = Math.max(0, daysDiff - 3);
        scrollContainerRef.current.scrollLeft = targetDays * 80;
      } else if (viewMode === 'weekly') {
        const jan1 = new Date(projectYear, 0, 1);
        const todayD = new Date(todayStr);
        const daysDiff = Math.max(0, Math.round((todayD - jan1) / (24 * 60 * 60 * 1000)));
        const weeksDiff = Math.max(0, Math.floor(daysDiff / 7));
        const targetWeeks = Math.max(0, weeksDiff - 1);
        scrollContainerRef.current.scrollLeft = targetWeeks * 150;
      }
      handleScroll();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [viewMode, todayStr, projectYear]);

  // Compile timeline events
  const milestoneDateStr = (() => {
    try {
      const start = new Date(dates.projectStartDate || '2026-06-12');
      start.setMonth(start.getMonth() + 3);
      return start.toISOString().split('T')[0];
    } catch {
      return '';
    }
  })();

  const isTripVisible = (trip) => {
    if (!activeUser) return true; // Guest mode sees all
    const role = activeUser.jabatanTim;
    if (role === 'Super Admin') return true;
    if (trip.userId === activeUser.id) return true;
    
    if (role === 'Fasilitator' || role === 'Tenaga Administrasi') {
      return false; // Hanya bisa lihat dinas miliknya sendiri
    }
    
    const tripUserObj = users.find(u => u.id === trip.userId);
    const tripUserRole = tripUserObj ? tripUserObj.jabatanTim : '';
    
    if (role === 'Ketua Tim') {
      return tripUserRole !== 'Super Admin';
    }
    if (role === 'Koordinator') {
      return tripUserRole !== 'Super Admin' && tripUserRole !== 'Ketua Tim';
    }
    return false;
  };

  const isMeetingVisible = (meet) => {
    if (!activeUser) return true; // Guest mode sees all
    const role = activeUser.jabatanTim;
    if (role === 'Super Admin') return true;
    
    const participants = meet.pesertaIds || [];
    if (participants.includes(activeUser.id)) return true;
    
    if (role === 'Fasilitator' || role === 'Tenaga Administrasi') {
      return false; // Hanya bisa lihat rapat yang diundang
    }
    
    if (participants.length === 0) return true;
    
    return participants.some(pid => {
      const pUser = users.find(u => u.id === pid);
      const pRole = pUser ? pUser.jabatanTim : '';
      
      if (role === 'Ketua Tim') {
        return pRole !== 'Super Admin';
      }
      if (role === 'Koordinator') {
        return pRole !== 'Super Admin' && pRole !== 'Ketua Tim';
      }
      return false;
    });
  };

  const timelineEvents = [];

  // Add meetings
  if (Array.isArray(meetings)) {
    meetings.filter(isMeetingVisible).forEach(meet => {
      const start = meet.tanggal ? meet.tanggal.substring(0, 10) : '';
      const end = (meet.isMultiDay && meet.tanggalSelesai) ? meet.tanggalSelesai.substring(0, 10) : start;
      timelineEvents.push({
        id: meet.id,
        startDateStr: start,
        endDateStr: end,
        title: meet.judul,
        type: 'rapat',
        details: `Tempat: ${meet.lokasi}${meet.jam ? ` • Pukul ${formatDisplayTime(meet.jam)}` : ''}`,
        raw: meet
      });
    });
  }

  // Add trips
  if (Array.isArray(trips)) {
    const visibleTrips = trips.filter(t => t.statusPersetujuan !== 'rejected' && isTripVisible(t));
    const groupedTrips = {};
    
    visibleTrips.forEach(trip => {
      const key = `${trip.userId}-${trip.tanggalMulai}-${trip.tanggalSelesai}-${trip.kunjunganKe}`;
      if (!groupedTrips[key]) {
        groupedTrips[key] = [];
      }
      groupedTrips[key].push(trip);
    });

    Object.values(groupedTrips).forEach(batch => {
      const firstTrip = batch[0];
      const user = users.find(u => u.id === firstTrip.userId);
      const userName = user ? user.nama : 'Fasilitator';
      const userRole = firstTrip.userRoleTim || 'Fasilitator';
      const start = firstTrip.tanggalMulai ? firstTrip.tanggalMulai.substring(0, 10) : '';
      const end = firstTrip.tanggalSelesai ? firstTrip.tanggalSelesai.substring(0, 10) : start;
      
      const kabupatens = new Set();
      batch.forEach(t => {
        const school = schools.find(s => s.npsn === t.sekolahId);
        if (school && school.kabupaten) {
          kabupatens.add(school.kabupaten);
        }
      });
      const kabList = Array.from(kabupatens).join(', ') || 'Berbagai Lokasi';
      
      timelineEvents.push({
        id: `batch-${firstTrip.id}`,
        startDateStr: start,
        endDateStr: end,
        title: `Perjalanan Dinas ${userName} (${batch.length} Sekolah)`,
        type: 'dinas',
        details: `${userRole} • Kab: ${kabList} • Kunjungan ke-${firstTrip.kunjunganKe || '?'}`,
        raw: firstTrip,
        batch: batch,
        userName: userName,
        userRole: userRole
      });
    });
  }

  if (milestoneDateStr) {
    timelineEvents.push({
      id: 'milestone-3rd',
      startDateStr: milestoneDateStr,
      endDateStr: milestoneDateStr,
      title: 'Milestone Bulan Ke-3: Target Progres Fisik 50%',
      type: 'milestone',
      details: 'Supervising Koordinator ke-1 & Minimal Progres Fisik 50% wajib tercapai.',
      isMilestone: true
    });
  }

  const sortedEvents = timelineEvents
    .filter(e => e.startDateStr)
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.startDateStr.localeCompare(b.startDateStr);
      } else {
        return b.startDateStr.localeCompare(a.startDateStr);
      }
    });

  const displayEvents = sortedEvents.filter(e => {
    if (filterType === 'rapat' && e.type !== 'rapat') return false;
    if (filterType === 'dinas' && e.type !== 'dinas') return false;
    
    if (!showDone) {
      const isDone = e.endDateStr < todayStr;
      if (isDone) return false;
    }
    
    return true;
  });

  const tracksList = [];
  displayEvents.forEach(event => {
    if (event.isMilestone) return;
    
    let placed = false;
    for (let i = 0; i < tracksList.length; i++) {
      const track = tracksList[i];
      const lastEvent = track[track.length - 1];
      if (event.startDateStr > lastEvent.endDateStr) {
        track.push(event);
        placed = true;
        break;
      }
    }
    
    if (!placed) {
      tracksList.push([event]);
    }
  });

  const getTimelinePosition = (sDateStr, eDateStr) => {
    if (timelineDuration <= 0) return { left: '0%', width: '0%' };
    
    const evStartMs = new Date(sDateStr).getTime();
    const evEndMs = new Date(eDateStr).getTime();
    const leftMs = evStartMs - timelineStartMs;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const durationMs = Math.max(oneDayMs, (evEndMs - evStartMs) + oneDayMs);
    
    let leftPct = (leftMs / timelineDuration) * 100;
    let widthPct = (durationMs / timelineDuration) * 100;
    
    if (leftPct < 0) {
      widthPct += leftPct;
      leftPct = 0;
    }
    if (leftPct + widthPct > 100) {
      widthPct = 100 - leftPct;
    }
    return {
      left: `${leftPct.toFixed(4)}%`,
      width: `${Math.max(0.1, widthPct).toFixed(4)}%`
    };
  };

  const getTrackStyles = () => {
    if (viewMode === 'monthly') {
      return timelineDensity === 'relaxed' 
        ? { trackHeight: 'h-8', cardHeight: 'h-8', fontSize: 'text-[10px]' }
        : { trackHeight: 'h-6', cardHeight: 'h-6', fontSize: 'text-[8.5px]' };
    } else {
      return timelineDensity === 'relaxed'
        ? { trackHeight: 'h-14', cardHeight: 'h-14', fontSize: 'text-[10.5px]' }
        : { trackHeight: 'h-9', cardHeight: 'h-9', fontSize: 'text-[9.5px]' };
    }
  };
  const ts = getTrackStyles();

  const getMonthlyCapsuleColor = (event, trackIdx) => {
    if (event.type === 'rapat') {
      if (event.raw.isMultiDay) return 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100';
      return 'bg-emerald-50 text-emerald-800 border border-emerald-250 hover:bg-emerald-100';
    } else {
      if (trackIdx % 2 === 0) return 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100';
      return 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100';
    }
  };

  const todayPct = timelineDuration > 0 
    ? Math.min(100, Math.max(0, ((todayMs - timelineStartMs) / timelineDuration) * 100))
    : -1;

  const milestoneMs = milestoneDateStr ? new Date(milestoneDateStr).getTime() : 0;
  const milestonePct = timelineDuration > 0 && milestoneMs
    ? Math.min(100, Math.max(0, ((milestoneMs - timelineStartMs) / timelineDuration) * 100))
    : -1;

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
        .filter(u => {
          if (u.jabatanTim !== 'Fasilitator') return false;
          if (activeUser?.jabatanTim === 'Koordinator') return u.coordinatorId === activeUser.id;
          return true;
        })
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

  const getProjectMonthName = (monthIdx) => {
    try {
      const start = new Date(dates.projectStartDate || '2026-06-12');
      start.setMonth(start.getMonth() + (monthIdx - 1));
      const options = { month: 'long' };
      return start.toLocaleDateString('id-ID', options);
    } catch {
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return months[(5 + monthIdx) % 12];
    }
  };

  const getPendingTasks = () => {
    if (!isFacilitator || !activeUser) return [];

    const tasksList = [];

    // 1. Personal Monthly Reports (Month 1 up to current Month)
    for (let m = 1; m <= currentMonthIdx; m++) {
      const hasReport = reports.some(r => r.userId === activeUser.id && Number(r.bulanKe) === m);
      if (!hasReport) {
        const monthName = getProjectMonthName(m);
        tasksList.push({
          id: `rep-${m}`,
          category: 'report',
          title: `Laporan Bulanan Ke-${m} (${monthName})`,
          description: `Anda belum mengunggah Laporan Bulanan PDF Ke-${m} (${monthName}).`,
          actionLabel: 'Unggah Sekarang',
          action: () => onViewChange && onViewChange('laporan-bulanan')
        });
      }
    }

    // 2. Missing School Metadata & Document Uploads
    displaySchools.forEach(school => {
      // Check metadata fields
      if (!school.kepala_sekolah || String(school.kepala_sekolah).trim() === '') {
        tasksList.push({
          id: `kepsek-${school.npsn}`,
          category: 'school_info',
          title: `Nama Kepsek: ${school.nama_sekolah}`,
          description: `Nama Kepala Sekolah dasar binaan Anda belum diisi.`,
          actionLabel: 'Lengkapi Profil',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (!school.hp_kepala_sekolah || String(school.hp_kepala_sekolah).trim() === '') {
        tasksList.push({
          id: `hp-${school.npsn}`,
          category: 'school_info',
          title: `No. Telp Kepsek: ${school.nama_sekolah}`,
          description: `Nomor telepon Kepala Sekolah dasar binaan Anda belum diisi.`,
          actionLabel: 'Lengkapi Profil',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (!school.kecamatan || String(school.kecamatan).trim() === '') {
        tasksList.push({
          id: `kecamatan-${school.npsn}`,
          category: 'school_info',
          title: `Kecamatan: ${school.nama_sekolah}`,
          description: `Data wilayah Kecamatan belum dilengkapi.`,
          actionLabel: 'Lengkapi Profil',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (!school.desa || String(school.desa).trim() === '') {
        tasksList.push({
          id: `desa-${school.npsn}`,
          category: 'school_info',
          title: `Desa/Kelurahan: ${school.nama_sekolah}`,
          description: `Data wilayah Desa / Kelurahan belum dilengkapi.`,
          actionLabel: 'Lengkapi Profil',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (!school.koordinat || String(school.koordinat).trim() === '') {
        tasksList.push({
          id: `koordinat-${school.npsn}`,
          category: 'school_info',
          title: `Peta Lokasi: ${school.nama_sekolah}`,
          description: `Koordinat atau link Google Maps lokasi belum diisi.`,
          actionLabel: 'Lengkapi Profil',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (!school.perencanaId || String(school.perencanaId).trim() === '') {
        tasksList.push({
          id: `perencana-${school.npsn}`,
          category: 'school_info',
          title: `Mitra Perencana: ${school.nama_sekolah}`,
          description: `Mitra Lapangan Perencana belum dihubungkan.`,
          actionLabel: 'Tautkan Mitra',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (!school.pengawasId || String(school.pengawasId).trim() === '') {
        tasksList.push({
          id: `pengawas-${school.npsn}`,
          category: 'school_info',
          title: `Mitra Pengawas: ${school.nama_sekolah}`,
          description: `Mitra Lapangan Pengawas belum dihubungkan.`,
          actionLabel: 'Tautkan Mitra',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }

      // Check required documents
      if (school.dokumen_mingguan === 'belum') {
        tasksList.push({
          id: `doc-mingguan-${school.npsn}`,
          category: 'school_doc',
          title: `Laporan Mingguan: ${school.nama_sekolah}`,
          description: `Dokumen berkas Laporan Mingguan belum diunggah.`,
          actionLabel: 'Unggah Dokumen',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if (school.dokumen_bulanan === 'belum') {
        tasksList.push({
          id: `doc-bulanan-${school.npsn}`,
          category: 'school_doc',
          title: `Laporan Bulanan: ${school.nama_sekolah}`,
          description: `Dokumen berkas Laporan Bulanan belum diunggah.`,
          actionLabel: 'Unggah Dokumen',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if ((school.progres_fisik || 0) >= 50 && school.dokumen_progres_50 === 'belum') {
        tasksList.push({
          id: `doc-50-${school.npsn}`,
          category: 'school_doc',
          title: `Laporan Progres 50%: ${school.nama_sekolah}`,
          description: `Progres fisik mencapai >= 50%. Wajib mengunggah Laporan Progres 50%.`,
          actionLabel: 'Unggah Dokumen',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
      if ((school.progres_fisik || 0) === 100 && school.dokumen_progres_100 === 'belum') {
        tasksList.push({
          id: `doc-100-${school.npsn}`,
          category: 'school_doc',
          title: `Laporan Progres 100%: ${school.nama_sekolah}`,
          description: `Pekerjaan 100% selesai. Wajib mengunggah Laporan Progres 100%.`,
          actionLabel: 'Unggah Dokumen',
          action: () => onSelectSchool && onSelectSchool(school.npsn)
        });
      }
    });

    return tasksList;
  };

  const facilitatorPendingTasks = getPendingTasks();

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

            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-md min-h-[170px]">
              <div className="flex items-start justify-between w-full">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Realisasi Pengeluaran</span>
                  <span className="text-xl font-extrabold text-amber-400 block">Rp {grandTotalExpenses.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-slate-400 font-medium block">{Math.round((grandTotalExpenses / totalProjectContract) * 100)}% Penyerapan Dana</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-4 text-[10px]">
                {/* Biaya Operasional */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Biaya Operasional</span>
                  {isEditingOperasional ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        value={formatNumberWithDots(editOperasionalVal)}
                        onChange={(e) => setEditOperasionalVal(parseNumberFromDots(e.target.value))}
                        className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-100 font-bold focus:outline-none focus:border-indigo-500 w-24"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            biayaOperasional: Number(editOperasionalVal)
                          });
                          setIsEditingOperasional(false);
                        }}
                        className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer transition-colors"
                        title="Simpan"
                      >
                        <Check className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => setIsEditingOperasional(false)}
                        className="p-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors animate-fade-in"
                        title="Batal"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-bold text-slate-350">Rp {biayaOperasional.toLocaleString('id-ID')}</span>
                      {isAdministrasi && (
                        <button
                          onClick={() => {
                            setIsEditingOperasional(true);
                            setEditOperasionalVal(biayaOperasional);
                          }}
                          className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5 cursor-pointer"
                          title="Ubah Biaya Operasional"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Biaya Non-Operasional */}
                <div className="space-y-1">
                  <span className="text-slate-500 font-semibold block">Biaya Non-Operasional</span>
                  <span className="font-bold text-indigo-400 block mt-0.5">Rp {biayaNonOperasional.toLocaleString('id-ID')}</span>
                  <span className="text-[8px] text-slate-500 italic block leading-none mt-0.5">Otomatis dari honor</span>
                </div>
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
              <div className={`bg-slate-950/60 rounded-2xl p-4 border ${settings?.danaTahap1Diterima ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800'} relative animate-fade-in flex flex-col justify-between min-h-[180px]`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold ${settings?.danaTahap1Diterima ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded`}>Tahap 1 (60%)</span>
                      <h4 className="font-bold text-slate-200 text-xs mt-1.5">Rp {(0.60 * totalProjectContract).toLocaleString('id-ID')}</h4>
                    </div>
                    {settings?.danaTahap1Diterima ? (
                      <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> SUDAH CAIR</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> SIAP CAIR</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mb-3">
                    Pencairan awal sebesar 60% disalurkan ke rekening bendahara saat proyek dimulai.
                  </p>
                </div>
                {(isAdministrasi || isSuperAdmin) && (
                  <button
                    onClick={() => handleToggleDanaTahap(1, settings?.danaTahap1Diterima)}
                    className={`w-full py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all border-0 shadow cursor-pointer ${
                      settings?.danaTahap1Diterima 
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/15'
                    }`}
                  >
                    {settings?.danaTahap1Diterima ? 'Batalkan Konfirmasi' : 'Konfirmasi Dana Diterima'}
                  </button>
                )}
              </div>

              {/* Tahap 2 */}
              <div className={`bg-slate-950/60 rounded-2xl p-4 border ${settings?.danaTahap2Diterima ? 'border-emerald-500/30 bg-emerald-500/5' : isTahap2Eligible ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800'} relative flex flex-col justify-between min-h-[260px]`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold ${settings?.danaTahap2Diterima ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : isTahap2Eligible ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded`}>Tahap 2 (25%)</span>
                      <h4 className="font-bold text-slate-200 text-xs mt-1.5">Rp {(0.25 * totalProjectContract).toLocaleString('id-ID')}</h4>
                    </div>
                    {settings?.danaTahap2Diterima ? (
                      <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> SUDAH CAIR</span>
                    ) : isTahap2Eligible ? (
                      <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> SIAP CAIR</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> MENUNGGU SYARAT</span>
                    )}
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

                {settings?.danaTahap2Diterima ? (
                  (isAdministrasi || isSuperAdmin) && (
                    <button
                      onClick={() => handleToggleDanaTahap(2, true)}
                      className="w-full mt-4 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all border bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white border-0 shadow cursor-pointer"
                    >
                      Batalkan Konfirmasi
                    </button>
                  )
                ) : isTahap2Eligible ? (
                  (isAdministrasi || isSuperAdmin) && (
                    <button
                      onClick={() => handleToggleDanaTahap(2, false)}
                      className="w-full mt-4 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all border bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow cursor-pointer shadow-indigo-600/15"
                    >
                      Konfirmasi Dana Diterima
                    </button>
                  )
                ) : (
                  <div className="w-full mt-4 py-1.5 rounded-xl text-[10px] font-bold text-center text-slate-500 bg-slate-900 border border-slate-850 select-none">
                    Belum Memenuhi Syarat
                  </div>
                )}
              </div>

              {/* Tahap 3 */}
              <div className={`bg-slate-950/60 rounded-2xl p-4 border ${settings?.danaTahap3Diterima ? 'border-emerald-500/30 bg-emerald-500/5' : isTahap3Eligible ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800'} relative flex flex-col justify-between min-h-[260px]`}>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-bold ${settings?.danaTahap3Diterima ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : isTahap3Eligible ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' : 'text-slate-400 bg-slate-900 border border-slate-800'} px-2.5 py-0.5 rounded`}>Tahap 3 (15%)</span>
                      <h4 className="font-bold text-slate-200 text-xs mt-1.5">Rp {(0.15 * totalProjectContract).toLocaleString('id-ID')}</h4>
                    </div>
                    {settings?.danaTahap3Diterima ? (
                      <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5"><CheckCircle className="w-3.5 h-3.5" /> SUDAH CAIR</span>
                    ) : isTahap3Eligible ? (
                      <span className="text-[10px] text-indigo-400 font-extrabold flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> SIAP CAIR</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-0.5"><Clock className="w-3.5 h-3.5" /> MENUNGGU SYARAT</span>
                    )}
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

                {settings?.danaTahap3Diterima ? (
                  (isAdministrasi || isSuperAdmin) && (
                    <button
                      onClick={() => handleToggleDanaTahap(3, true)}
                      className="w-full mt-4 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all border bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white border-0 shadow cursor-pointer"
                    >
                      Batalkan Konfirmasi
                    </button>
                  )
                ) : isTahap3Eligible ? (
                  (isAdministrasi || isSuperAdmin) && (
                    <button
                      onClick={() => handleToggleDanaTahap(3, false)}
                      className="w-full mt-4 py-1.5 rounded-xl text-[10px] font-bold tracking-wide transition-all border bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow cursor-pointer shadow-indigo-600/15"
                    >
                      Konfirmasi Dana Diterima
                    </button>
                  )
                ) : (
                  <div className="w-full mt-4 py-1.5 rounded-xl text-[10px] font-bold text-center text-slate-500 bg-slate-900 border border-slate-850 select-none">
                    Belum Memenuhi Syarat
                  </div>
                )}
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
                      const userBaseMonthly = (user.jabatanTim === 'Tenaga Administrasi' ? settings.honorAdministrasi : settings[`honor${user.jabatanTim.replace(' ', '')}`]) || {
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
                      const reportFinished = 
                        user.jabatanTim === 'Tenaga Administrasi' || 
                        ((user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') 
                          ? !!userReport 
                          : (userReport && userReport.status === 'approved'));

                      // Time restriction: payment is allowed only after the month has been completed
                      const projectStart = settings.projectStartDate || '2026-06-12';
                      const start = new Date(projectStart);
                      start.setMonth(start.getMonth() + Number(month));
                      const targetDateStr = start.toISOString().split('T')[0];
                      const todayVal = new Date();
                      const targetVal = new Date(targetDateStr);
                      const isTimeReached = todayVal >= targetVal;

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

                      const part1Paid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part1`);
                      const part2Paid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part2`);
                      const part3Paid = payments.some(p => p.userId === user.id && p.komponen === `tetap_bulan_${month}_part3`);

                      const totalParts = (pctPart1 > 0 ? 1 : 0) + (pctPart2 > 0 ? 1 : 0) + (pctPart3 > 0 ? 1 : 0);
                      const paidParts = (part1Paid ? 1 : 0) + (part2Paid ? 1 : 0) + (part3Paid ? 1 : 0);
                      const eligibleParts = ((reportFinished && isTimeReached) ? 1 : 0) + 
                                            ((part2Eligible && isTimeReached) ? 1 : 0) + 
                                            ((part3Eligible && isTimeReached) ? 1 : 0);

                      let status = 'waiting';
                      if (paidParts === totalParts) {
                        status = 'all-paid';
                      } else if (paidParts > 0) {
                        status = 'part-paid';
                      } else if (eligibleParts > 0) {
                        status = 'ready';
                      }

                      return {
                        status,
                        totalParts,
                        paidParts,
                        eligibleParts
                      };
                    };

                    const userBaseMonthly = (user.jabatanTim === 'Tenaga Administrasi' ? settings.honorAdministrasi : settings[`honor${user.jabatanTim.replace(' ', '')}`]) || {
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
                          const { status, totalParts, paidParts, eligibleParts } = helper(m);
                          const progressPct = totalParts > 0 ? Math.round((eligibleParts / totalParts) * 100) : 0;

                          let bgStyle = {};
                          let textClass = 'text-slate-500';
                          let borderClass = 'border-slate-850';
                          let label = 'Belum';

                          if (status === 'all-paid') {
                            label = 'Lunas';
                            textClass = 'text-sky-950';
                            borderClass = 'border-sky-500/20';
                            bgStyle = { background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.45) 100%, rgba(6, 78, 59, 0.75) 100%)' };
                          } else if (status === 'part-paid') {
                            label = totalParts > 1 ? `Cicil (${paidParts}/${totalParts})` : 'Cicil';
                            textClass = 'text-sky-950';
                            borderClass = 'border-sky-500/20';
                            bgStyle = { background: `linear-gradient(90deg, rgba(14, 165, 233, 0.45) ${progressPct}%, rgba(6, 78, 59, 0.75) ${progressPct}%)` };
                          } else if (status === 'ready') {
                            if (progressPct === 100) {
                              label = 'Layak';
                              textClass = 'text-sky-950';
                              borderClass = 'border-sky-500/20';
                              bgStyle = { background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.45) 100%, rgba(6, 78, 59, 0.75) 100%)' };
                            } else {
                              label = totalParts > 1 ? `Layak (${eligibleParts}/${totalParts})` : 'Layak';
                              textClass = 'text-sky-950';
                              borderClass = 'border-sky-500/20';
                              bgStyle = { background: `linear-gradient(90deg, rgba(14, 165, 233, 0.45) ${progressPct}%, rgba(6, 78, 59, 0.75) ${progressPct}%)` };
                            }
                          } else {
                            label = 'Belum';
                            textClass = 'text-emerald-700/80';
                            borderClass = 'border-emerald-950/20';
                            bgStyle = { background: 'rgba(6, 78, 59, 0.4)' };
                          }

                          return (
                            <td key={m} className="px-4 py-3 text-center">
                              <span 
                                onClick={() => setPayrollDetailModal({ user, month: m })}
                                className={`inline-flex items-center justify-center px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer hover:scale-105 transition-all select-none w-20 ${textClass} ${borderClass}`}
                                style={bgStyle}
                                title={`Klik untuk memantau detail persyaratan kelayakan honor (${eligibleParts}/${totalParts} bagian layak)`}
                              >
                                {label}
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
              : 'Sistem Informasi Swakelola Pemantauan Progres Fisik dan Keuangan Program Revitalisasi Sekolah Dasar. Silakan klik tombol "Masuk ke Sistem" di sudut kanan atas untuk melakukan pengelolaan data Sekolah Dasar yang didampingi.'}
          </p>
        </div>
      </div>

      {/* Active Obstacles & Comments Warning/Notifications */}
      {activeUser && (() => {
        const activeWarnings = (warnings || []).filter(w => w.userId === activeUser.id && !w.dismissed);
        if (activeWarnings.length === 0) return null;

        return (
          <div className="bg-slate-900/45 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Notifikasi Kendala & Komentar Baru ({activeWarnings.length})
                </h3>
              </div>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Peringatan Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {activeWarnings.map((w) => (
                <div key={w.id} className="bg-slate-50 border border-slate-200 hover:border-slate-350 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm transition-all duration-300 relative group overflow-hidden">
                  <div className="relative z-10 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-750 font-semibold leading-relaxed">
                          {w.message}
                        </p>
                        <span className="block text-[9px] text-slate-500 mt-1">
                          Waktu: {new Date(w.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200 select-none">
                      <button
                        onClick={() => onDismissWarning(w.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-200 border border-slate-300 hover:bg-slate-300 text-slate-650 transition-all cursor-pointer border-0"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => onSelectSchool(w.schoolId, 'kendala')}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer border-0"
                      >
                        Buka Laporan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-1">
              {(() => {
                const groupedTrips = {};
                pendingTrips.forEach(t => {
                  const key = `${t.userId}-${t.tanggalMulai}-${t.tanggalSelesai}-${t.kunjunganKe}`;
                  if (!groupedTrips[key]) groupedTrips[key] = [];
                  groupedTrips[key].push(t);
                });
                const pendingBatches = Object.values(groupedTrips).sort((a, b) => new Date(a[0].tanggalMulai) - new Date(b[0].tanggalMulai));

                const formatDateShort = (dateStr) => {
                  if (!dateStr) return '-';
                  try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    const dd = String(d.getDate()).padStart(2, '0');
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const yyyy = d.getFullYear();
                    return `${dd}-${mm}-${yyyy}`;
                  } catch (e) {
                    return dateStr;
                  }
                };

                return pendingBatches.map((batchTrips, batchIdx) => {
                  const firstTrip = batchTrips[0];
                  const applicant = users.find(u => u.id === firstTrip.userId);
                  
                  const schoolsArr = batchTrips.map(t => {
                    const s = schools.find(school => String(school.npsn) === String(t.sekolahId));
                    return s ? s.nama_sekolah : `NPSN ${t.sekolahId}`;
                  });

                  const romanVisit = firstTrip.kunjunganKe === 1 ? 'I' : firstTrip.kunjunganKe === 2 ? 'II' : firstTrip.kunjunganKe;
                  const title = `Perjalanan Dinas ${romanVisit}`;

                  const badgeColors = [
                    'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    'bg-amber-500/10 text-amber-400 border-amber-500/30',
                    'bg-rose-500/10 text-rose-400 border-rose-500/30',
                    'bg-blue-500/10 text-blue-400 border-blue-500/30',
                    'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  ];
                  
                  return (
                    <div key={`pending-batch-${batchIdx}`} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-lg shadow-black/20 relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
                      {/* Decorative glow */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-all duration-500 group-hover:bg-indigo-500/10"></div>
                      
                      <div className="relative z-10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/5 px-2.5 py-1 rounded-lg border border-indigo-500/10">
                            {firstTrip.userRoleTim}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                            <MapPin className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-100 via-white to-purple-100 text-base tracking-tight drop-shadow-sm">
                              {title}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Oleh: <strong className="text-slate-300">{applicant ? applicant.nama : 'Anggota Tim'}</strong>
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium bg-slate-900/50 p-2 rounded-xl border border-slate-800/50">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> {formatDateShort(firstTrip.tanggalMulai)} s/d {formatDateShort(firstTrip.tanggalSelesai)}</span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-400" /> {firstTrip.durasiHari} Hari</span>
                        </div>
                        
                        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            Lokasi Kunjungan ({batchTrips.length} Sekolah)
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {schoolsArr.map((schoolName, i) => {
                              const colorClass = badgeColors[i % badgeColors.length];
                              return (
                                <span key={i} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${colorClass} shadow-sm backdrop-blur-sm transition-transform hover:scale-105 cursor-default`}>
                                  {schoolName}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-800/60 select-none relative z-10">
                        <button
                          onClick={() => {
                            if (onViewChange) onViewChange('dinas');
                          }}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-lg shadow-indigo-600/20"
                        >
                          <Plane className="w-4 h-4" /> Kelola Perjalanan Dinas
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        );
      })()}

      {/* Coordinator Report Approval Warning/Notification */}
      {activeUser?.jabatanTim === 'Koordinator' && (() => {
        const supervisedUserIds = users
          .filter(u => u.jabatanTim === 'Fasilitator' && u.coordinatorId === activeUser.id)
          .map(u => u.id);
          
        const pendingReports = reports.filter(r => 
          supervisedUserIds.includes(r.userId) && 
          (r.status === 'pending' || !r.status)
        );

        if (pendingReports.length === 0) return null;

        return (
          <div className="bg-slate-900/40 border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Laporan Bulanan Perlu Direviu ({pendingReports.length})
                </h3>
              </div>
              <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Peringatan Koordinator
              </span>
            </div>

            <p className="text-slate-300 text-xs font-medium leading-relaxed">
              Ada <strong className="text-amber-400">{pendingReports.length} laporan bulanan</strong> dari fasilitator di bawah supervisi Anda yang berstatus <strong className="text-amber-400">Pending</strong> dan memerlukan peninjauan serta persetujuan Anda agar payroll honorarium mereka dapat diproses.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {pendingReports.map((rep) => {
                const sender = users.find(u => u.id === rep.userId);
                return (
                  <div key={rep.id} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/85 hover:border-slate-700 p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-md transition-all duration-300 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-all duration-500 group-hover:bg-amber-500/10"></div>
                    
                    <div className="relative z-10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/10">
                          Bulan Ke-{rep.bulanKe}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={rep.fileName}>
                          {rep.fileName}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-200 text-sm tracking-tight">
                            {sender ? sender.nama : 'Fasilitator'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {sender ? sender.jabatanTim : 'Fasilitator'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-450 flex items-center gap-1.5 pt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Dikirim: {new Date(rep.submittedAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  if (onViewChange) onViewChange('pantau-laporan-tim');
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-550 hover:to-amber-450 text-slate-950 font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/25 active:scale-95"
              >
                <FileText className="w-4 h-4" /> Reviu Laporan Bulanan Tim <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Facilitator/User Report Revision Warning/Notification */}
      {activeUser && (() => {
        const reportsWithNotes = reports.filter(r => 
          r.userId === activeUser.id && 
          r.note && 
          r.note.trim() !== ''
        );

        if (reportsWithNotes.length === 0) return null;

        const hasRejected = reportsWithNotes.some(r => r.status === 'rejected');
        const cardTitle = hasRejected ? 'Umpan Balik Laporan Bulanan (Perlu Perbaikan)' : 'Catatan Peninjauan Laporan Bulanan';
        const cardHeaderBorder = hasRejected ? 'border-rose-500/20' : 'border-slate-800';

        return (
          <div className={`bg-slate-900/40 border ${cardHeaderBorder} rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in`}>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasRejected ? 'bg-rose-400' : 'bg-indigo-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${hasRejected ? 'bg-rose-500' : 'bg-indigo-500'}`}></span>
                </span>
                <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                  <AlertCircle className={`w-4 h-4 ${hasRejected ? 'text-rose-450' : 'text-indigo-400'}`} />
                  {cardTitle} ({reportsWithNotes.length})
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${hasRejected ? 'text-rose-300 bg-rose-500/10 border-rose-500/20' : 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20'}`}>
                {hasRejected ? 'Peringatan Revisi' : 'Informasi Peninjau'}
              </span>
            </div>

            <p className="text-slate-300 text-xs font-medium leading-relaxed">
              {hasRejected 
                ? 'Laporan bulanan Anda dikembalikan oleh peninjau untuk dilakukan perbaikan. Silakan periksa catatan di bawah ini dan unggah kembali laporan yang telah diperbaiki.'
                : 'Umpan balik atau catatan dari peninjau/koordinator mengenai laporan bulanan yang telah disetujui.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
              {reportsWithNotes.map((rep) => {
                const reviewer = users.find(u => u.id === rep.reviewedBy);
                const isRejected = rep.status === 'rejected';
                
                const cardBorder = isRejected ? 'border-rose-500/20 hover:border-rose-500/40' : 'border-emerald-500/20 hover:border-emerald-500/40';
                const badgeColor = isRejected ? 'text-rose-400 bg-rose-500/5 border-rose-500/10' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
                const quoteBg = isRejected ? 'bg-rose-950/15 border-rose-500/10' : 'bg-emerald-950/15 border-emerald-500/10';
                const quoteText = isRejected ? 'text-rose-300' : 'text-emerald-300';
                const headerText = isRejected ? 'Catatan Revisi' : 'Catatan Peninjau';
                const labelStatus = isRejected ? 'Perlu Perbaikan' : 'Disetujui';

                return (
                  <div key={rep.id} className={`bg-gradient-to-br from-slate-900 to-slate-950 border ${cardBorder} p-4 rounded-2xl flex flex-col justify-between space-y-3 shadow-md transition-all duration-300 relative group overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none transition-all duration-500 group-hover:bg-indigo-500/10"></div>
                    
                    <div className="relative z-10 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${badgeColor} px-2.5 py-1 rounded-lg border`}>
                            Bulan Ke-{rep.bulanKe} ({labelStatus})
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]" title={rep.fileName}>
                            {rep.fileName}
                          </span>
                        </div>
                        
                        <div className={`${quoteBg} border rounded-xl p-3 mt-3`}>
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                            {headerText} dari {reviewer ? reviewer.nama : 'Peninjau'}:
                          </span>
                          <p className={`${quoteText} text-xs italic font-medium leading-relaxed`}>
                            "{rep.note}"
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-450 flex items-center gap-1.5 pt-2 mt-auto">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Direviu: {rep.reviewedAt ? new Date(rep.reviewedAt).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  if (onViewChange) onViewChange('laporan-bulanan');
                }}
                className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-lg active:scale-95 ${
                  hasRejected 
                    ? 'bg-gradient-to-r from-rose-600 to-rose-550 hover:from-rose-550 hover:to-rose-500 shadow-rose-500/10 hover:shadow-rose-500/25' 
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-500 shadow-indigo-500/10 hover:shadow-indigo-500/25'
                }`}
              >
                <FileText className="w-4 h-4" /> Kelola Laporan Bulanan Saya <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 3 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
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

        {/* Monthly Reports Card */}
        <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-md hover:border-slate-700/80 transition-all duration-300 min-h-[145px]">
          <div className="flex items-center justify-between w-full">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {isFacilitator ? 'Laporan Bulanan Anda' : 'Laporan Bulanan Ketua Tim'}
              </span>
              {isFacilitator ? (
                <span className={`text-3xl font-extrabold block ${currentMonthPct === 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {currentMonthPct}%
                </span>
              ) : (() => {
                const ktId = ketuaTim?.id || 'etty-rabihati';
                const hasCurrentKtReport = reports.some(r => r.userId === ktId && Number(r.bulanKe) === currentMonthIdx);
                return (
                  <span className={`text-3xl font-extrabold block ${hasCurrentKtReport ? 'text-emerald-400' : 'text-slate-450'}`}>
                    {hasCurrentKtReport ? 'Sudah' : 'Belum'}
                  </span>
                );
              })()}
              <span className="text-xs text-slate-400 font-medium">
                {isFacilitator 
                  ? `Bulan Berjalan (Bulan ${currentMonthIdx}) • ${reports.filter(r => r.userId === activeUser?.id).length}/6 Terkirim`
                  : (() => {
                      const ktId = ketuaTim?.id || 'etty-rabihati';
                      const ktReportsCount = reports.filter(r => r.userId === ktId).length;
                      return `Bulan Berjalan (Bulan ${currentMonthIdx}) • ${ktReportsCount}/6 Terkirim`;
                    })()}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-6 gap-1 text-center text-[9px] font-semibold text-slate-400">
            {Array.from({ length: 6 }).map((_, idx) => {
              const m = idx + 1;
              const isElapsed = m < currentMonthIdx;
              
              if (isFacilitator) {
                const r = reports.find(rep => rep.userId === activeUser?.id && Number(rep.bulanKe) === m);
                let text = 'Belum';
                let colorClass = isElapsed 
                  ? 'text-rose-400 bg-rose-500/10 border border-rose-500/25 animate-pulse' 
                  : 'text-slate-500 bg-slate-900 border border-slate-800/60';
                if (r) {
                  if (r.status === 'approved') {
                    text = 'Setuju';
                    colorClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25';
                  } else if (r.status === 'rejected') {
                    text = 'Ditolak';
                    colorClass = 'text-rose-450 bg-rose-500/10 border border-rose-500/25';
                  } else {
                    text = 'Review';
                    colorClass = 'text-amber-400 bg-amber-500/10 border border-amber-500/25';
                  }
                }
                return (
                  <div key={idx} className="space-y-1">
                    <span className={`block text-[8px] font-bold uppercase ${isElapsed && (!r || r.status !== 'approved') ? 'text-rose-400 font-extrabold' : 'text-slate-500'}`}>B{m}</span>
                    <span 
                      className={`block font-extrabold text-[7.5px] tracking-tight leading-normal py-0.5 rounded truncate ${colorClass}`}
                      title={r ? `File: ${r.fileName}${r.status ? ` (Status: ${r.status})` : ''}` : (isElapsed ? 'Terlewat / Belum diunggah!' : 'Belum diunggah')}
                    >
                      {text}
                    </span>
                  </div>
                );
              } else {
                const ktId = ketuaTim?.id || 'etty-rabihati';
                const r = reports.find(rep => rep.userId === ktId && Number(rep.bulanKe) === m);
                
                let text = 'Belum';
                let colorClass = isElapsed 
                  ? 'text-rose-400 bg-rose-500/10 border border-rose-500/25 animate-pulse' 
                  : 'text-slate-500 bg-slate-900 border border-slate-800/60';
                if (r) {
                  text = 'Sudah';
                  colorClass = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/25';
                }
                
                return (
                  <div key={idx} className="space-y-1">
                    <span className={`block text-[8px] font-bold uppercase ${isElapsed && !r ? 'text-rose-400 font-extrabold' : 'text-slate-500'}`}>B{m}</span>
                    <span 
                      className={`block font-extrabold text-[7.5px] tracking-tight leading-normal py-0.5 rounded truncate ${colorClass}`}
                      title={r ? `File: ${r.fileName}` : (isElapsed ? 'Terlewat / Belum diunggah!' : 'Belum diunggah')}
                    >
                      {text}
                    </span>
                  </div>
                );
              }
            })}
          </div>
        </div>

      </div>

      {/* Main Grid: Left (Stats + Regional), Right (Timeline settings / active user info) */}
      <div className={
        isFacilitator 
          ? "grid grid-cols-1 lg:grid-cols-4 gap-6" 
          : showRightColumn 
          ? "grid grid-cols-1 lg:grid-cols-3 gap-6" 
          : "space-y-6"
      }>
        
        {/* Left Column (3/4 width, 2/3 width, or full width) */}
        <div className={
          isFacilitator
            ? "lg:col-span-3 space-y-6"
            : showRightColumn
            ? "lg:col-span-2 space-y-6"
            : "space-y-6"
        }>
          
          {/* Timeline Kegiatan & Aktivitas (Gantt Chart style) */}
          <div className="bg-white border border-slate-800 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Day / Week / Month Switcher */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 select-none">
                  {[
                    { key: 'daily', label: 'Day' },
                    { key: 'weekly', label: 'Week' },
                    { key: 'monthly', label: 'Month' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setViewMode(tab.key)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        viewMode === tab.key
                          ? 'bg-white text-slate-100 shadow-sm border border-slate-800 font-bold'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* View Range Navigator */}
                {viewMode !== 'monthly' && (
                  <div className="flex items-center gap-1.5 select-none">
                    <button 
                      onClick={handleScrollLeft}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs font-semibold cursor-pointer transition-all shadow-sm"
                    >
                      ⟨
                    </button>
                    <span className="text-xs font-bold text-slate-100 px-3 min-w-[150px] text-center">
                      {visibleRangeText}
                    </span>
                    <button 
                      onClick={handleScrollRight}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-800 hover:bg-slate-950 text-slate-400 hover:text-slate-100 flex items-center justify-center text-xs font-semibold cursor-pointer transition-all shadow-sm"
                    >
                      ⟩
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Controls Toolbar */}
              <div className="flex items-center gap-4 flex-wrap justify-end">
                {/* Show Done Toggle Switch */}
                <div className="flex items-center gap-2 select-none">
                  <span className="text-xs font-semibold text-slate-400">Show done</span>
                  <button
                    onClick={() => setShowDone(!showDone)}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer border border-slate-800/80 ${
                      showDone ? 'bg-indigo-400' : 'bg-slate-950'
                    }`}
                  >
                    <div 
                      className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all ${
                        showDone ? 'left-[17px]' : 'left-[2px]'
                      }`}
                    />
                  </button>
                </div>

                {/* Sort Button */}
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-950/40 cursor-pointer select-none transition-all"
                >
                  <span className="capitalize">⟨⟩ Sort</span>
                  <span className="text-[10px] bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded font-bold text-slate-100 uppercase">
                    {sortOrder}
                  </span>
                </button>

                {/* Filter Dropdown */}
                <div className="relative select-none">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none bg-white border border-slate-800 rounded-lg pl-8 pr-8 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-950/40 cursor-pointer focus:outline-none focus:border-indigo-400 transition-all"
                  >
                    <option value="all">Filter: All</option>
                    <option value="rapat">Filter: Rapat</option>
                    <option value="dinas">Filter: Dinas</option>
                  </select>
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[11px]">
                    ▽
                  </div>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[11px]">
                    ▼
                  </div>
                </div>

                {/* Density Switcher */}
                <button
                  onClick={() => setTimelineDensity(timelineDensity === 'relaxed' ? 'compact' : 'relaxed')}
                  className="w-7 h-7 rounded-lg border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-950/40 cursor-pointer transition-all shadow-sm"
                  title="Ubah Kerapatan Linimasa"
                >
                  {timelineDensity === 'relaxed' ? '↕' : '↕↕'}
                </button>
              </div>
            </div>

            {/* Scrollable Timeline Grid Container */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-white">
              <div 
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {/* Board Content */}
                <div 
                  className="relative select-none"
                  style={{ 
                    width: viewMode === 'daily' ? `${daysList.length * 80}px` : viewMode === 'weekly' ? '7800px' : '100%',
                    minWidth: viewMode === 'monthly' ? '100%' : 'none'
                  }}
                >
                  {/* Grid Headers */}
                  {viewMode === 'daily' && (
                    <div className="sticky top-0 bg-white z-30">
                      {/* Months Row */}
                      <div className="flex select-none border-b border-slate-800">
                        {dayMonthsHeader.map((m, idx) => (
                          <div 
                            key={idx} 
                            className="border-r border-slate-800/60 text-[10px] font-extrabold text-slate-100 py-1.5 px-3 sticky left-0 shrink-0 bg-white"
                            style={{ width: `${m.width}px` }}
                          >
                            {m.label}
                          </div>
                        ))}
                      </div>
                      {/* Letters Row */}
                      <div className="flex text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-800">
                        {daysList.map((d, idx) => {
                          const isToday = d.dateStr === todayStr;
                          return (
                            <div 
                              key={idx} 
                              className={`w-[80px] shrink-0 border-r border-slate-800/30 flex flex-col justify-center items-center py-1 ${
                                isToday ? 'bg-indigo-50/60 text-indigo-500 font-extrabold' : d.isWeekend ? 'bg-slate-950/40 text-rose-450' : ''
                              }`}
                            >
                              <span className="text-[8.5px] uppercase">{d.label}</span>
                              <span className={`text-xs mt-0.5 ${isToday ? 'text-indigo-500 font-bold' : 'text-slate-100 font-extrabold'}`}>{d.dayNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {viewMode === 'weekly' && (
                    <div className="sticky top-0 bg-white z-30">
                      {/* Months Row */}
                      <div className="flex select-none border-b border-slate-800">
                        {weekMonthsHeader.map((m, idx) => (
                          <div 
                            key={idx} 
                            className="border-r border-slate-800/60 text-[10px] font-extrabold text-slate-100 py-1.5 px-3 sticky left-0 shrink-0 bg-white"
                            style={{ width: `${m.width}px` }}
                          >
                            {m.label}
                          </div>
                        ))}
                      </div>
                      {/* Weeks Row */}
                      <div className="flex text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-800">
                        {weeksList.map((w, idx) => {
                          const isThisWeek = todayMs >= w.startMs && todayMs <= w.endMs;
                          return (
                            <div 
                              key={idx} 
                              className={`w-[150px] shrink-0 border-r border-slate-800/30 flex flex-col justify-center items-center py-1 ${
                                isThisWeek ? 'bg-indigo-50/60 text-indigo-500 font-extrabold' : ''
                              }`}
                            >
                              <span className="text-[8.5px] uppercase">{w.label}</span>
                              <span className={`text-[9.5px] mt-0.5 ${isThisWeek ? 'text-indigo-500 font-bold' : 'text-slate-100 font-extrabold'}`}>{w.subLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {viewMode === 'monthly' && (
                    <div className="grid grid-cols-12 border-b border-slate-800 text-center text-[10px] font-bold text-slate-400 py-2 select-none bg-slate-950/40">
                      {monthsList.map((m, idx) => (
                        <div key={idx} className="border-r border-slate-800/60 last:border-r-0 text-slate-100 font-extrabold">
                          {m}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline Board Body */}
                  <div 
                    className="relative pb-6"
                    style={{ 
                      minHeight: tracksList.length === 0 ? '120px' : `${Math.max(160, tracksList.length * (viewMode === 'monthly' ? 38 : 65) + 30)}px`
                    }}
                  >
                    {/* Background Grid columns overlay */}
                    <div className="absolute inset-0 flex pointer-events-none z-0">
                      {viewMode === 'daily' && daysList.map((d, idx) => (
                        <div 
                          key={idx} 
                          className={`w-[80px] shrink-0 border-r border-slate-800/10 h-full ${
                            d.isWeekend ? 'weekend-stripes bg-slate-950/10' : ''
                          }`}
                        />
                      ))}
                      {viewMode === 'weekly' && weeksList.map((w, idx) => (
                        <div 
                          key={idx} 
                          className="w-[150px] shrink-0 border-r border-slate-800/10 h-full"
                        />
                      ))}
                      {viewMode === 'monthly' && Array.from({ length: 12 }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className="flex-1 border-r border-slate-800/10 h-full"
                        />
                      ))}
                    </div>

                    {/* Today Line Indicator */}
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div 
                        className="absolute top-0 bottom-0 w-[2.5px] bg-[#6366f1] z-20 pointer-events-none"
                        style={{ left: `${todayPct}%` }}
                      >
                        <div className="absolute -top-1 -left-[5px] w-3.5 h-3.5 rounded-full bg-[#6366f1] border-2 border-white shadow-md"></div>
                      </div>
                    )}

                    {/* Milestone 3rd Month Indicator Line */}
                    {milestonePct >= 0 && milestonePct <= 100 && (
                      <div 
                        className="absolute top-0 bottom-0 w-[1.5px] border-l border-dashed border-amber-500/80 z-20 pointer-events-none"
                        style={{ left: `${milestonePct}%` }}
                      >
                        <div className="absolute -top-1 -left-[5px] w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm flex items-center justify-center text-[7px] text-white font-extrabold font-sans">
                          M
                        </div>
                      </div>
                    )}

                    {/* Tracks List */}
                    {tracksList.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="text-xs text-slate-500 italic">Tidak ada agenda swakelola atau dinas aktif dalam filter ini</span>
                      </div>
                    ) : (
                      <div className="relative z-10 space-y-4 pt-4">
                        {tracksList.map((track, trackIdx) => (
                          <div key={trackIdx} className={`relative ${ts.trackHeight} w-full`}>
                            {track.map(event => {
                              const { left, width } = getTimelinePosition(event.startDateStr, event.endDateStr);
                              const isGradientEvent = event.type === 'rapat' && event.raw.isMultiDay;
                              
                              let colorClass = '';
                              let accentColor = '';
                              let emoji = '📅';

                              if (viewMode === 'monthly') {
                                colorClass = `${getMonthlyCapsuleColor(event, trackIdx)} border shadow-sm rounded-lg`;
                                emoji = event.type === 'rapat' ? '💬' : '🚗';
                              } else {
                                emoji = event.type === 'rapat' ? '💬' : '🚗';
                                if (isGradientEvent) {
                                  colorClass = 'bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 text-white border-0 hover:brightness-105 shadow-sm';
                                } else if (event.type === 'rapat') {
                                  colorClass = 'bg-white border-slate-800 text-slate-100 hover:border-slate-700 shadow-sm';
                                  accentColor = 'bg-emerald-500';
                                } else {
                                  colorClass = 'bg-white border-slate-800 text-slate-100 hover:border-slate-700 shadow-sm';
                                  accentColor = 'bg-indigo-400';
                                }
                              }

                              return (
                                <div
                                  key={event.id}
                                  title={`${event.title}\n(${event.startDateStr} s/d ${event.endDateStr})\n${event.details}`}
                                  className={`absolute ${ts.cardHeight} rounded-xl border px-3 flex items-center justify-between ${ts.fontSize} font-bold cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md group ${colorClass}`}
                                  style={{ left, width }}
                                  onClick={() => {
                                    setSelectedTimelineEvent(event);
                                  }}
                                >
                                  {/* Drag pill handle on hover */}
                                  {viewMode !== 'monthly' && (
                                    <div className="absolute left-[3px] top-1/2 -translate-y-1/2 w-[6px] h-3 flex flex-col gap-[2px] justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className={`w-[2px] h-[3px] rounded-full ${isGradientEvent ? 'bg-white/60' : 'bg-slate-400'}`}></div>
                                      <div className={`w-[2px] h-[3px] rounded-full ${isGradientEvent ? 'bg-white/60' : 'bg-slate-400'}`}></div>
                                    </div>
                                  )}

                                  {/* Left accent bar (for standard cards) */}
                                  {viewMode !== 'monthly' && accentColor && (
                                    <span className={`w-[3px] h-6 rounded-full shrink-0 mr-2 ${accentColor}`} />
                                  )}

                                  {/* Sticky Content Wrapper */}
                                  <div className="sticky left-4 z-10 min-w-0 max-w-full flex items-center gap-1.5">
                                    <span className="shrink-0">{emoji}</span>
                                    <div className="flex flex-col min-w-0 justify-center">
                                      <span className={`font-bold tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-colors ${isGradientEvent ? 'text-white group-hover:text-white' : 'text-slate-100'}`}>
                                        {event.title}
                                      </span>
                                      {timelineDensity === 'relaxed' && (
                                        <span className={`text-[9.5px] font-semibold truncate mt-0.5 ${isGradientEvent ? 'text-indigo-100' : 'text-slate-400'}`}>
                                          {event.details}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Stacked avatars */}
                                  {viewMode !== 'monthly' && (
                                    <div className="flex -space-x-1.5 overflow-hidden select-none shrink-0 ml-auto pl-2">
                                      {event.type === 'rapat' ? (
                                        event.raw.pesertaIds?.slice(0, 3).map(uid => {
                                          const u = users.find(usr => usr.id === uid);
                                          const initials = u ? u.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                                          return (
                                            <div 
                                              key={uid} 
                                              title={u?.nama || 'Peserta'}
                                              className="w-5 h-5 rounded-full bg-slate-800 border border-white flex items-center justify-center text-[8px] font-extrabold text-slate-100 shadow-sm"
                                            >
                                              {initials}
                                            </div>
                                          );
                                        })
                                      ) : (
                                        (() => {
                                          const u = users.find(usr => usr.id === event.raw.userId);
                                          const initials = u ? u.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
                                          return (
                                            <div 
                                              title={u?.nama || 'Petugas'}
                                              className="w-5 h-5 rounded-full bg-slate-800 border border-white flex items-center justify-center text-[8px] font-extrabold text-slate-100 shadow-sm"
                                            >
                                              {initials}
                                            </div>
                                          );
                                        })()
                                      )}
                                      {event.type === 'rapat' && event.raw.pesertaIds?.length > 3 && (
                                        <div className="w-5 h-5 rounded-full bg-slate-100 text-white border border-white flex items-center justify-center text-[7.5px] font-extrabold shadow-sm">
                                          +{event.raw.pesertaIds.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex-wrap select-none font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-white border border-slate-800 shadow-sm"></span>
                <span>Agenda Swakelola</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-3 rounded bg-gradient-to-r from-violet-500 via-pink-500 to-orange-400 opacity-90 shadow-sm"></span>
                <span>Rapat Koordinasi / Rapat Multi-hari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 rounded weekend-stripes border border-slate-800"></div>
                <span>Akhir Pekan (Sabtu & Minggu)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3 bg-[#6366f1] rounded-full"></span>
                <span>Hari Ini</span>
              </div>
            </div>
          </div>

          {/* Average Progress per Facilitator */}
          {!isFacilitator && (
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
                            ? 'bg-slate-950 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
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
                              <span className="text-[10px] text-slate-500 font-medium">{fac.schoolCount} Sekolah Binaan</span>
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
                        {/* School Names Grouped by Kabupaten */}
                        {fac.schools && fac.schools.length > 0 && (
                          <div className="px-3.5 pb-3 space-y-2.5">
                            {Object.entries(
                              fac.schools.reduce((acc, sch) => {
                                const kab = sch.kabupaten || 'Lainnya';
                                if (!acc[kab]) acc[kab] = [];
                                acc[kab].push(sch);
                                return acc;
                              }, {})
                            ).map(([kabName, kabSchools], kIdx) => (
                              <div key={kabName} className="space-y-1">
                                <span className="text-[9px] font-extrabold text-slate-450 uppercase tracking-wider block">
                                  📍 Kabupaten {kabName}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {kabSchools.map((sch, sIdx) => {
                                    const colors = [
                                      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                                      'bg-sky-500/10 border-sky-500/20 text-sky-400',
                                      'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
                                      'bg-amber-500/10 border-amber-500/20 text-amber-400',
                                      'bg-purple-500/10 border-purple-500/20 text-purple-400',
                                      'bg-rose-500/10 border-rose-500/20 text-rose-455',
                                      'bg-teal-500/10 border-teal-500/20 text-teal-400',
                                      'bg-violet-500/10 border-violet-500/20 text-violet-400'
                                    ];
                                    const colorClass = colors[(kIdx + sIdx) % colors.length];
                                    return (
                                      <button
                                        key={sch.npsn}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onSelectSchool && onSelectSchool(sch.npsn); }}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:scale-[1.03] active:scale-[0.97] transition-all text-left ${colorClass}`}
                                        title={`NPSN: ${sch.npsn} • Progres: ${sch.progres}% • Klik untuk detail`}
                                      >
                                        {sch.nama} ({sch.progres}%)
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Detail Button */}
                        {isAdministrasi && (
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
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Conditional Facilitator Section */}
          {isFacilitator && (
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
              <h3 className="font-bold text-slate-200 text-sm mb-4 flex items-center gap-2 border-b border-slate-850 pb-3">
                <School className="w-4 h-4 text-indigo-400" /> Daftar Sekolah Binaan Anda
              </h3>

              {displaySchools.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 italic mb-3">Anda belum mengklaim sekolah binaan.</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Silakan buka menu <strong>"Kelola Sekolah"</strong> untuk memilih dan mengklaim sekolah dasar yang akan Anda dampingi.
                  </p>
                  {onViewChange && (
                    <button
                      onClick={() => onViewChange('sekolah')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/10 cursor-pointer border-0"
                    >
                      Buka Kelola Sekolah
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
                          <span className="font-bold text-slate-200 text-sm">{school.nama_sekolah || `Sekolah NPSN ${school.npsn}`}</span>
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
                      <div className="w-full md:w-48 shrink-0 space-y-1" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-400">Progres Fisik</span>
                          {editingSchoolNpsn === school.npsn ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editingValue}
                                onChange={(e) => {
                                  let val = parseInt(e.target.value, 10);
                                  if (isNaN(val)) val = 0;
                                  val = Math.max(0, Math.min(100, val));
                                  setEditingValue(val);
                                }}
                                className="w-12 bg-slate-950 border border-slate-800 text-slate-100 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:border-indigo-500 font-bold"
                              />
                              <button
                                onClick={() => {
                                  onUpdateSchool && onUpdateSchool({ ...school, progres_fisik: Number(editingValue) });
                                  setEditingSchoolNpsn(null);
                                  window.showAlert('Progres fisik sekolah berhasil diperbarui!');
                                }}
                                className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded cursor-pointer transition-all"
                                title="Simpan"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setEditingSchoolNpsn(null)}
                                className="p-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded cursor-pointer transition-all"
                                title="Batal"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400 font-bold">{school.progres_fisik || 0}%</span>
                              <button
                                onClick={() => {
                                  setEditingSchoolNpsn(school.npsn);
                                  setEditingValue(school.progres_fisik || 0);
                                }}
                                className="p-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 text-indigo-400 rounded-lg cursor-pointer transition-all"
                                title="Edit Progres Fisik"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
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
          
                    {activeUser && activeUser.role === 'admin' && (
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

              {onResetDatabase && (
                <div className="border-t border-slate-850 mt-4 pt-4">
                  <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-4 space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-red-400 block">Reset Database Kontrol</span>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Mengembalikan seluruh database lokal & Google Sheets ke data awal default bawaan (10 pengguna & 41 sekolah binaan). Semua data transaksi & dokumen yang diunggah akan terhapus secara permanen.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onResetDatabase}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-red-650 hover:bg-red-500 text-white transition-all shadow-lg shadow-red-600/10 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reset Database ke Default
                    </button>
                  </div>
                </div>
              )}
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
                      Sekolah binaan <strong>{selectedFacName}</strong>
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
                    {selectedFacilitator ? 'Fasilitator ini belum memiliki sekolah binaan.' : 'Belum ada sekolah terdaftar.'}
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
                            <span className="font-bold text-slate-200 text-xs block truncate" title={school.nama_sekolah || `NPSN ${school.npsn}`}>
                              {school.nama_sekolah || `Sekolah NPSN ${school.npsn}`}
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

        {isFacilitator && (
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" /> Pekerjaan Menunggu
                </h3>
                {facilitatorPendingTasks.length > 0 && (
                  <span className="text-[10px] font-extrabold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full animate-pulse shrink-0">
                    {facilitatorPendingTasks.length}
                  </span>
                )}
              </div>

              {facilitatorPendingTasks.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">Semua Tugas Selesai!</h4>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1">
                      Bagus! Anda telah menyelesaikan seluruh kewajiban pelaporan dan melengkapi data sekolah binaan Anda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
                  {facilitatorPendingTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={task.action}
                      className="bg-slate-950/40 border border-slate-850/60 hover:border-indigo-500/40 hover:bg-indigo-950/5 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md group flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8.5px] font-bold uppercase px-2 py-0.5 rounded border ${
                            task.category === 'report'
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : task.category === 'school_doc'
                              ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {task.category === 'report' ? 'Laporan Diri' : task.category === 'school_doc' ? 'Dokumen Sekolah' : 'Profil Sekolah'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-200 text-xs leading-snug group-hover:text-indigo-400 transition-colors">
                          {task.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-normal font-normal">
                          {task.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors mt-1 select-none">
                        <span>{task.actionLabel}</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )}

      {/* ===== FACILITATOR DETAIL MODAL ===== */}
      {facModalId && (() => {
        const modalFac = users.find(u => u.id === facModalId);
        const modalFacName = modalFac?.nama || 'Fasilitator';
        const modalFacSchools = schools.filter(s => s.fasilitatorId === facModalId);
        const modalReports = reports.filter(r => r.userId === facModalId);
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
                        {modalFac?.jabatanTim} • {modalFacSchools.length} Sekolah Binaan
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
                                  <span className="text-slate-400">Laporan Bulanan</span> — <span className="text-slate-500">Bulan Ke-{report.bulanKe}</span>
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
                        const getTripDisplayStatus = (t) => {
                          if (t.isPaid || t.status === 'paid') return 'paid';
                          if (t.statusPersetujuan === 'approved') {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const today = new Date(todayStr);
                            const start = new Date(t.tanggalMulai || t.date);
                            const end = new Date(t.tanggalSelesai || t.tanggalMulai || t.date);
                            if (today < start) return 'planned';
                            else if (today >= start && today <= end) return 'active';
                            else return 'completed';
                          }
                          return 'planned';
                        };

                        const statusConfig = {
                          planned: { label: 'Akan dikunjungi', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                          active: { label: 'Sedang Berjalan', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20 animate-pulse' },
                          completed: { label: 'Selesai', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                          paid: { label: 'Dibayar', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                        };
                        const approvalConfig = {
                          pending: { label: 'Menunggu Persetujuan', color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/15' },
                          approved: { label: 'Disetujui', color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/15' },
                          rejected: { label: 'Ditolak', color: 'text-rose-400', bg: 'bg-rose-500/5 border-rose-500/15' },
                        };
                        const st = statusConfig[getTripDisplayStatus(trip)] || statusConfig.planned;
                        const ap = trip.statusPersetujuan ? (approvalConfig[trip.statusPersetujuan] || null) : null;
                        const tripSchool = schools.find(s => s.npsn === trip.sekolahId);
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
                            {trip.catatanPersetujuan && (
                              <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 border border-slate-850 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span className="leading-relaxed text-slate-350">
                                  <strong className="text-amber-500 font-bold">Catatan Reviewer:</strong> {trip.catatanPersetujuan}
                                </span>
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
                      Pajak {details.taxPct}% • Lembaga {settings.deductionLembagaPct || 10}%
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
                                {(user.jabatanTim === 'Ketua Tim' || user.jabatanTim === 'Koordinator') 
                                  ? 'Laporan bulanan PDF diunggah' 
                                  : 'Laporan bulanan PDF disetujui'}
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
                {hasUnpaidReady && activeUser?.jabatanTim === 'Super Admin' && (
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

      {/* Selected Timeline Event Detail Modal */}
      {selectedTimelineEvent && (() => {
        const event = selectedTimelineEvent;
        const isRapat = event.type === 'rapat';
        const isDinas = event.type === 'dinas';
        
        return createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
            <div className="bg-slate-905 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTimelineEvent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-950 text-slate-400 hover:text-white transition-colors border border-slate-805 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title Header */}
              <div className="border-b border-slate-800 pb-4 mb-4">
                <span className={`text-[10px] ${isRapat ? 'text-emerald-450 bg-emerald-500/10 border-emerald-500/20' : 'text-sky-400 bg-sky-500/10 border-sky-500/20'} border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
                  {isRapat ? 'Detail Rapat Koordinasi' : 'Detail Perjalanan Dinas'}
                </span>
                <h3 className="text-lg font-extrabold text-white mt-2">{event.title}</h3>
                <div className="flex gap-2.5 items-center mt-1 text-[11px] text-slate-400 font-medium">
                  <span>Mulai: <strong>{formatLogDate(event.startDateStr)}</strong></span>
                  <span>•</span>
                  <span>Selesai: <strong>{formatLogDate(event.endDateStr)}</strong></span>
                </div>
              </div>

              {/* Detail Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1 text-slate-300">
                {isRapat && (() => {
                  const meet = event.raw;
                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl space-y-2">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Lokasi Rapat</span>
                          <span className="text-xs font-bold text-white block mt-0.5">{meet.lokasi || '-'}</span>
                        </div>
                        {meet.jam && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Waktu / Jam</span>
                            <span className="text-xs font-bold text-white block mt-0.5">{meet.jam}</span>
                          </div>
                        )}
                      </div>

                      {meet.keterangan && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Catatan / Notulen Rapat</span>
                          <p className="text-xs text-slate-450 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 leading-relaxed">
                            {meet.keterangan}
                          </p>
                        </div>
                      )}

                      {/* Participants */}
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-2">Daftar Peserta Rapat</span>
                        {(!meet.pesertaIds || meet.pesertaIds.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">Tidak ada peserta terdaftar.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {meet.pesertaIds.map(uid => {
                              const u = users.find(usr => usr.id === uid);
                              if (!u) return null;
                              return (
                                <span key={uid} className="text-[10px] font-bold px-2.5 py-1 rounded-lg border bg-slate-950/60 border-slate-800 text-slate-300">
                                  {u.nama} ({u.jabatanTim})
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {meet.fotoKegiatan && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-2">Dokumentasi Rapat</span>
                          <img 
                            src={typeof getDirectImageUrl === 'function' ? getDirectImageUrl(meet.fotoKegiatan) : meet.fotoKegiatan} 
                            alt="Dokumentasi Rapat" 
                            className="w-full max-h-48 object-cover rounded-xl border border-slate-800 cursor-pointer"
                            onClick={() => window.open(meet.fotoKegiatan, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {isDinas && (() => {
                  const trip = event.raw;
                  const batchList = event.batch || [trip];
                  const docs = tripDocs.filter(d => d.tripId === trip.id);
                  
                  const getDurationFriendly = (startDateStr, endDateStr) => {
                    if (!startDateStr || !endDateStr) return '-';
                    try {
                      const start = new Date(startDateStr);
                      const end = new Date(endDateStr);
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
                      
                      let years = end.getFullYear() - start.getFullYear();
                      let months = end.getMonth() - start.getMonth();
                      let days = end.getDate() - start.getDate();
                      
                      if (days < 0) {
                        months -= 1;
                        const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
                        days += prevMonth.getDate();
                      }
                      
                      if (months < 0) {
                        years -= 1;
                        months += 12;
                      }
                      
                      const totalMonths = (years * 12) + months;
                      
                      const parts = [];
                      if (totalMonths > 0) parts.push(`${totalMonths} Bulan`);
                      if (days > 0 || parts.length === 0) parts.push(`${days} Hari`);
                      
                      return parts.join(' ');
                    } catch {
                      return '-';
                    }
                  };

                  const getTripDisplayStatus = (t) => {
                    if (t.isPaid || t.status === 'paid') return 'paid';
                    if (t.statusPersetujuan === 'approved') {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const today = new Date(todayStr);
                      const start = new Date(t.tanggalMulai || t.date);
                      const end = new Date(t.tanggalSelesai || t.tanggalMulai || t.date);
                      if (today < start) {
                        return 'planned';
                      } else if (today >= start && today <= end) {
                        return 'active';
                      } else {
                        return 'completed';
                      }
                    }
                    return 'planned';
                  };

                  const statusConfig = {
                    planned: { label: 'Akan dikunjungi', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    active: { label: 'Sedang Berjalan', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20 animate-pulse' },
                    completed: { label: 'Selesai', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                    paid: { label: 'Dibayar', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                  };
                  const approvalConfig = {
                    pending: { label: 'Menunggu Persetujuan', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    approved: { label: 'Disetujui', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                    rejected: { label: 'Ditolak', color: 'text-rose-450 bg-rose-500/10 border-rose-500/20' },
                  };

                  const st = statusConfig[getTripDisplayStatus(trip)] || statusConfig.planned;
                  const ap = trip.statusPersetujuan ? (approvalConfig[trip.statusPersetujuan] || null) : null;

                  return (
                    <div className="space-y-4">
                      <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Petugas Dinas</span>
                          <span className="text-xs font-bold text-white block mt-0.5">{event.userName} ({event.userRole})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Kunjungan Ke</span>
                          <span className="text-xs font-bold text-white block mt-0.5">Ke-{trip.kunjunganKe || '?'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Status Perjalanan</span>
                          <span className={`inline-block text-[9.5px] font-extrabold px-2 py-0.5 rounded border mt-0.5 ${st.color}`}>{st.label}</span>
                        </div>
                        {ap && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Status Persetujuan</span>
                            <span className={`inline-block text-[9.5px] font-extrabold px-2 py-0.5 rounded border mt-0.5 ${ap.color}`}>
                              {ap.label}{trip.approvedBy ? ` (${trip.approvedBy})` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {trip.catatanPersetujuan && (
                        <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-2xl flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-[10px] leading-relaxed text-slate-350">
                            <strong className="text-amber-500 font-bold">Catatan Reviewer:</strong> {trip.catatanPersetujuan}
                          </span>
                        </div>
                      )}

                      {/* Schools List */}
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-2.5">Daftar Sekolah Binaan yang Dikunjungi ({batchList.length} Sekolah)</span>
                        <div className="space-y-2">
                          {batchList.map(t => {
                            const school = schools.find(s => s.npsn === t.sekolahId);
                            const schoolName = school ? school.nama_sekolah : `NPSN ${t.sekolahId}`;
                            const progValue = school ? (school.progres_fisik || 0) : 0;
                            
                            const schoolStart = school?.tanggal_mulai_sekolah || settings.projectStartDate;
                            const visitDate = t.tanggalMulai || t.date || trip.tanggalMulai || trip.date;
                            
                            // Calculate months elapsed at visit
                            const d1 = new Date(schoolStart);
                            const d2 = new Date(visitDate);
                            const monthsElapsedAtVisit = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
                            
                            const isProgOk = trip.kunjunganKe === 1 ? progValue >= 50 : progValue >= 100;
                            const isTimeOk = trip.kunjunganKe === 1 ? monthsElapsedAtVisit >= 3 : monthsElapsedAtVisit >= 6;
                            const isEligible = isProgOk || isTimeOk;
                            
                            const durationStr = getDurationFriendly(schoolStart, visitDate);
                            const doc50 = (schoolDocs || []).find(d => String(d.sekolahId) === String(t.sekolahId) && d.category === 'lap_progres_50');

                            return (
                              <div 
                                key={t.id} 
                                className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all duration-300 gap-3"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isEligible ? 'bg-emerald-400' : 'bg-rose-550 animate-pulse'}`}></div>
                                    <span 
                                      onClick={() => {
                                        setSelectedTimelineEvent(null);
                                        onSelectSchool && onSelectSchool(t.sekolahId);
                                      }}
                                      className="font-extrabold text-xs text-slate-100 truncate hover:text-indigo-400 hover:underline cursor-pointer transition-colors"
                                      title={schoolName}
                                    >
                                      {schoolName}
                                    </span>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                      isProgOk 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                      Progres: <strong className="font-extrabold">{progValue}%</strong>
                                    </span>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                      isTimeOk 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    }`}>
                                      Mulai Dikunjungi: <strong className="font-extrabold">{durationStr}</strong>
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center shrink-0">
                                  {doc50 ? (
                                    <a 
                                      href={doc50.fileData} 
                                      download={doc50.fileName}
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[9.5px] font-extrabold px-3 py-1.5 rounded-full border transition-all cursor-pointer text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/25 border-emerald-500/20"
                                      title="Unduh Laporan 50%"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Lap 50%
                                    </a>
                                  ) : (
                                    <span className="text-[9.5px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-full border border-rose-500/20 select-none">
                                      Lap 50% Belum Ada
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Attached Documents (Surat Tugas & SPPD) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Surat Tugas Section */}
                        <div className="bg-slate-950/30 border border-slate-850 rounded-xl p-3.5 flex flex-col">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="w-5 h-5 rounded bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                              <FileText className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] text-slate-300 uppercase tracking-wider font-extrabold">Surat Tugas Resmi</span>
                          </div>
                          {docs.filter(d => d.category === 'surat_tugas' || !d.category).length === 0 ? (
                            <p className="text-[10.5px] text-slate-500 italic py-3 text-center bg-slate-950/20 rounded-lg border border-dashed border-slate-850/80">
                              Belum ada Surat Tugas terlampir.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {docs.filter(d => d.category === 'surat_tugas' || !d.category).map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-850/60 rounded-lg">
                                  <div className="min-w-0 flex-1 mr-2">
                                    <p className="text-[11px] font-bold text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                                    <p className="text-[9px] text-slate-500">Diunggah: {formatLogDate(doc.uploadedAt)}</p>
                                  </div>
                                  <a
                                    href={doc.fileData}
                                    download={doc.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded transition-colors shrink-0 border border-indigo-500/20 font-bold text-[9.5px]"
                                    title="Unduh / Lihat Dokumen"
                                  >
                                    Unduh
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* SPPD Section */}
                        <div className="bg-slate-950/30 border border-slate-850 rounded-xl p-3.5 flex flex-col">
                          <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="w-5 h-5 rounded bg-violet-500/20 flex items-center justify-center text-violet-400">
                              <FileText className="w-3 h-3" />
                            </div>
                            <span className="text-[10px] text-slate-300 uppercase tracking-wider font-extrabold">SPPD Resmi</span>
                          </div>
                          {docs.filter(d => d.category === 'sppd').length === 0 ? (
                            <p className="text-[10.5px] text-slate-500 italic py-3 text-center bg-slate-950/20 rounded-lg border border-dashed border-slate-850/80">
                              Belum ada SPPD terlampir.
                            </p>
                          ) : (
                            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                              {docs.filter(d => d.category === 'sppd').map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-950/40 border border-slate-850/60 rounded-lg">
                                  <div className="min-w-0 flex-1 mr-2">
                                    <p className="text-[11px] font-bold text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                                    <p className="text-[9px] text-slate-500">Diunggah: {formatLogDate(doc.uploadedAt)}</p>
                                  </div>
                                  <a
                                    href={doc.fileData}
                                    download={doc.name}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2 py-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded transition-colors shrink-0 border border-violet-500/20 font-bold text-[9.5px]"
                                    title="Unduh / Lihat Dokumen"
                                  >
                                    Unduh
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Map Lokasi Sekolah */}
                      <div className="space-y-3 mt-4 pt-4 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Peta Lokasi Kunjungan Sekolah</span>
                        </div>
                        <TripMultiMap schools={schools} batchList={batchList} />
                      </div>

                      {trip.laporanHasil && (
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block mb-1">Laporan Hasil / Keterangan</span>
                          <p className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 leading-relaxed">
                            {trip.laporanHasil}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer Actions */}
              <div className="border-t border-slate-800 pt-4 mt-4 flex gap-3">
                <button
                  onClick={() => setSelectedTimelineEvent(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border-0"
                >
                  Tutup
                </button>
                {(() => {
                  const hasDinasAccess = activeUser && ['Fasilitator', 'Koordinator', 'Super Admin'].includes(activeUser.jabatanTim);
                  const hasRapatAccess = activeUser !== null;
                  
                  if (isDinas && hasDinasAccess) {
                    return (
                      <button
                        onClick={() => {
                          setSelectedTimelineEvent(null);
                          onViewChange('dinas');
                        }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-650/10 flex items-center justify-center gap-1.5 cursor-pointer border-0"
                      >
                        <span>Kelola Perjalanan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }
                  
                  if (isRapat && hasRapatAccess) {
                    return (
                      <button
                        onClick={() => {
                          setSelectedTimelineEvent(null);
                          onViewChange('rapat');
                        }}
                        className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-650/10 flex items-center justify-center gap-1.5 cursor-pointer border-0"
                      >
                        <span>Buka Halaman Rapat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  }
                  
                  return null;
                })()}
              </div>

            </div>
          </div>,
          document.body
        );
      })()}

    </div>
  );
}
