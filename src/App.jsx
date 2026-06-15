import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, RefreshCw, LogIn, Activity } from 'lucide-react';
import { initialUsers } from './data/initialData';
import { initialSchools } from './data/initialSchools';
import UserSelect from './components/UserSelect';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TeamManagement from './components/TeamManagement';
import ProfileModal from './components/ProfileModal';
import SchoolList from './components/SchoolList';
import SchoolDetail from './components/SchoolDetail';
import ContactManagement from './components/ContactManagement';
import TravelSchedule from './components/TravelSchedule';
import DailyLogs from './components/DailyLogs';
import MonthlyPdfReports from './components/MonthlyPdfReports';
import DutyReports from './components/DutyReports';
import FinancialDashboard from './components/FinancialDashboard';
import FacilitatorManagement from './components/FacilitatorManagement';
import PersonnelDocumentsModal from './components/PersonnelDocumentsModal';
import MemberReportsModal from './components/MemberReportsModal';
import MemberLogsModal from './components/MemberLogsModal';
import MeetingManagement from './components/MeetingManagement';
import RightActivitySidebar from './components/RightActivitySidebar';
import HonorBatchSettings from './components/HonorBatchSettings';
import { syncService } from './services/api';

const isValidId = (val) => val !== undefined && val !== null && String(val).trim() !== '';

const isInvalidSchoolName = (name, npsn) => {
  if (!name) return true;
  const cleaned = String(name).trim().toUpperCase();
  return cleaned === '' || cleaned === 'NPSN' || cleaned.startsWith('NPSN ') || cleaned === String(npsn).trim().toUpperCase() || cleaned === `NPSN${String(npsn).trim().toUpperCase()}`;
};

const parseSettings = (rawSettings) => {
  if (!rawSettings) return null;
  const numFields = [
    'totalProjectContract',
    'honorKetuaTim',
    'honorKoordinator',
    'honorFasilitator',
    'honorAdministrasi',
    'deductionTaxPct',
    'deductionLembagaPct',
    'biayaOperasional'
  ];
  const parsed = { ...rawSettings };
  numFields.forEach(field => {
    if (parsed[field] !== undefined && parsed[field] !== null && parsed[field] !== '') {
      parsed[field] = Number(parsed[field]);
    }
  });
  return parsed;
};

export default function App() {
  // 1. Core State
  const [users, setUsers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [trips, setTrips] = useState([]);
  
  // Phase 4 States
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [dutyReports, setDutyReports] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [schoolDocs, setSchoolDocs] = useState([]);
  const [personnelDocs, setPersonnelDocs] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingDocs, setMeetingDocs] = useState([]);
  const [tripDocs, setTripDocs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(false);

  // Session & Nav States
  const [activeUser, setActiveUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedSchoolNpsn, setSelectedSchoolNpsn] = useState(null);
  const [schoolDetailReferrer, setSchoolDetailReferrer] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [personnelDocsUser, setPersonnelDocsUser] = useState(null);
  const [memberReportsUser, setMemberReportsUser] = useState(null);
  const [memberLogsUser, setMemberLogsUser] = useState(null);
  const [dialog, setDialog] = useState(null);
  
  // Sync state
  const [syncStatus, setSyncStatus] = useState('offline'); // 'offline' | 'connecting' | 'success' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [isBlockingSync, setIsBlockingSync] = useState(false);
  const [isDirty, setIsDirty] = useState(() => {
    return localStorage.getItem('revit_is_dirty') === 'true';
  });
  const pendingSyncUpdatesRef = useRef({});

  const [settings, setSettings] = useState({
    projectStartDate: '2026-06-12',
    projectEndDate: '2026-12-12',
    googleAppsScriptUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '',
    googleAppsScriptToken: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'REVITSD2026_SECURE_TOKEN',
    totalProjectContract: 1500000000,
    honorKetuaTim: 7000000,
    honorKoordinator: 6000000,
    honorFasilitator: 5000000,
    honorAdministrasi: 5000000,
    deductionTaxPct: 15,
    deductionLembagaPct: 10,
    biayaOperasional: 0
  });

  const syncMeetingLogs = (updatedMeetings, currentLogs) => {
    let newLogs = currentLogs.filter(l => !l.id.startsWith('log-meeting-'));

    updatedMeetings.forEach(meet => {
      if (meet.pesertaIds && Array.isArray(meet.pesertaIds)) {
        meet.pesertaIds.forEach(userId => {
          let formattedJam = meet.jam;
          if (formattedJam && typeof formattedJam === 'string' && formattedJam.startsWith('1899-12-30')) {
            const d = new Date(formattedJam);
            formattedJam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          }

          const description = `Mengikuti rapat "${meet.judul}" di ${meet.lokasi}.${formattedJam ? ` Pukul ${formattedJam}.` : ''}${meet.keterangan ? ` Catatan/Notulen: ${meet.keterangan}` : ''}`;
          
          newLogs.push({
            id: `log-meeting-${meet.id}-${userId}`,
            userId: userId,
            tanggal: meet.tanggal,
            aktivitas: description,
            foto: meet.fotoKegiatan || '',
            createdAt: meet.createdAt || new Date().toISOString()
          });
        });
      }
    });

    return newLogs;
  };

  const syncMeetingActivityLogs = (updatedMeetings, currentActivityLogs) => {
    let nextActivityLogs = (currentActivityLogs || []).filter(l => l && !l.id.startsWith('act-meeting-'));

    updatedMeetings.forEach(meet => {
      if (meet.pesertaIds && Array.isArray(meet.pesertaIds)) {
        meet.pesertaIds.forEach(userId => {
          const userObj = initialUsers.find(u => u.id === userId);
          const userName = userObj ? userObj.nama : userId;
          
          let formattedJam = meet.jam;
          if (formattedJam && typeof formattedJam === 'string' && formattedJam.startsWith('1899-12-30')) {
            const d = new Date(formattedJam);
            formattedJam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
          }
          const description = `${userName} mengikuti rapat "${meet.judul}" di ${meet.lokasi}.${formattedJam ? ` Pukul ${formattedJam}.` : ''}${meet.keterangan ? ` Catatan/Notulen: ${meet.keterangan}` : ''}`;
          
          nextActivityLogs.push({
            id: `act-meeting-${meet.id}-${userId}`,
            userId: userId,
            timestamp: meet.createdAt || (meet.tanggal ? `${meet.tanggal}T09:00:00.000Z` : new Date().toISOString()),
            actionType: 'join_meeting',
            description: description,
            fileRef: meet.fotoKegiatan ? { fileName: 'Foto Kegiatan Rapat', fileData: meet.fotoKegiatan } : null
          });
        });
      }
    });

    return nextActivityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100);
  };

  const latestStateRef = React.useRef();
  const isSyncingRef = React.useRef(false);

  // Track latest state to avoid closure staleness in timers
  useEffect(() => {
    latestStateRef.current = {
      users,
      schools,
      contacts,
      tasks,
      trips,
      logs,
      reports,
      dutyReports,
      expenses,
      payments,
      schoolDocs,
      personnelDocs,
      meetings,
      meetingDocs,
      tripDocs,
      activityLogs,
      settings
    };
  }, [users, schools, contacts, tasks, trips, logs, reports, dutyReports, expenses, payments, schoolDocs, personnelDocs, meetings, meetingDocs, tripDocs, activityLogs, settings]);

  // NOTE: useEffect sinkronisasi manual_log → daily logs telah DIHAPUS.
  // useEffect tersebut menyebabkan bug di mana log harian yang dihapus langsung dibuat ulang
  // karena ia mendeteksi entry 'manual_log' di activityLogs tanpa log harian yang cocok,
  // lalu membuatnya kembali. Fungsi handleAddManualActivityLog sudah membuat kedua entri
  // (activity log + daily log) secara bersamaan, sehingga useEffect tersebut tidak diperlukan.

  useEffect(() => {
    // Users
    const storedUsers = localStorage.getItem('revit_users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      const cleanUsers = parsedUsers.filter(u => u && isValidId(u.id));
      if (cleanUsers.length === 0) {
        setUsers(initialUsers);
        localStorage.setItem('revit_users', JSON.stringify(initialUsers));
      } else {
        let migrated = false;
        const updatedUsers = cleanUsers.map(u => {
          let updated = { ...u };
          if (updated.id === 'yosi-ronadi' && updated.password === undefined) {
            updated.password = '4051';
            migrated = true;
          }
          if (updated.id === 'etty-rabihati' && updated.password === undefined) {
            updated.password = 'sipil';
            migrated = true;
          }
          if (updated.id === 'chandra-bayu' && updated.password === undefined) {
            updated.password = 'arsitektur';
            migrated = true;
          }
          if (updated.password === undefined) {
            updated.password = '';
            migrated = true;
          }
          // Normalisasi taxPct
          if (updated.taxPct === undefined || updated.taxPct === null || String(updated.taxPct).trim() === '') {
            if (updated.taxPct !== null) {
              updated.taxPct = null;
              migrated = true;
            }
          } else {
            const parsedTax = Number(updated.taxPct);
            if (updated.taxPct !== parsedTax) {
              updated.taxPct = parsedTax;
              migrated = true;
            }
          }
          return updated;
        });
        if (migrated) {
          localStorage.setItem('revit_users', JSON.stringify(updatedUsers));
          setUsers(updatedUsers);
        } else {
          setUsers(cleanUsers);
        }
      }
    } else {
      setUsers(initialUsers);
      localStorage.setItem('revit_users', JSON.stringify(initialUsers));
    }

    // Schools
    const storedSchools = localStorage.getItem('revit_schools');
    if (storedSchools) {
      const parsed = JSON.parse(storedSchools);
      const cleanSchools = parsed.filter(s => s && isValidId(s.npsn)).map(s => ({ ...s, npsn: String(s.npsn).trim() }));
      if (cleanSchools.length === 0) {
        setSchools(initialSchools);
        localStorage.setItem('revit_schools', JSON.stringify(initialSchools));
      } else {
        let isUpdated = false;
        const migrated = cleanSchools.map((s) => {
          const init = initialSchools.find((x) => String(x.npsn) === s.npsn);
          let updated = { ...s };
          
          if (updated.nama && isInvalidSchoolName(updated.nama_sekolah, s.npsn) && !isInvalidSchoolName(updated.nama, s.npsn)) {
            updated.nama_sekolah = updated.nama;
            isUpdated = true;
          }
          if (updated.kepalaSekolah && (!updated.kepala_sekolah || updated.kepala_sekolah.trim() === '')) {
            updated.kepala_sekolah = updated.kepalaSekolah;
            isUpdated = true;
          }
          
          if (init) {
            if (isInvalidSchoolName(updated.nama_sekolah, s.npsn)) {
              updated.nama_sekolah = init.nama_sekolah;
              isUpdated = true;
            }
            if (init.kepala_sekolah && (!updated.kepala_sekolah || updated.kepala_sekolah.trim() === '')) {
              updated.kepala_sekolah = init.kepala_sekolah;
              isUpdated = true;
            }
            if (init.koordinat && !s.koordinat) {
              updated.koordinat = init.koordinat;
              isUpdated = true;
            }
            if (init.fasilitatorId !== s.fasilitatorId) {
              updated.fasilitatorId = init.fasilitatorId;
              isUpdated = true;
            }
          }
          return updated;
        });
        if (isUpdated) {
          localStorage.setItem('revit_schools', JSON.stringify(migrated));
          setSchools(migrated);
        } else {
          setSchools(cleanSchools);
        }
      }
    } else {
      setSchools(initialSchools);
      localStorage.setItem('revit_schools', JSON.stringify(initialSchools));
    }

    // Contacts
    const storedContacts = localStorage.getItem('revit_contacts');
    if (storedContacts) {
      try {
        setContacts(JSON.parse(storedContacts).filter(Boolean));
      } catch {
        setContacts([]);
      }
    } else {
      setContacts([]);
      localStorage.setItem('revit_contacts', JSON.stringify([]));
    }

    // Tasks
    const storedTasks = localStorage.getItem('revit_tasks');
    if (storedTasks) {
      try {
        setTasks(JSON.parse(storedTasks).filter(Boolean));
      } catch {
        setTasks([]);
      }
    } else {
      setTasks([]);
      localStorage.setItem('revit_tasks', JSON.stringify([]));
    }

    // Trips
    const storedTrips = localStorage.getItem('revit_trips');
    if (storedTrips) {
      try {
        setTrips(JSON.parse(storedTrips).filter(Boolean));
      } catch {
        setTrips([]);
      }
    } else {
      setTrips([]);
      localStorage.setItem('revit_trips', JSON.stringify([]));
    }

    // Daily Logs & Meetings Startup Sync
    let initialLogs = [];
    const storedLogs = localStorage.getItem('revit_logs');
    if (storedLogs) {
      try {
        initialLogs = JSON.parse(storedLogs).filter(Boolean);
      } catch {
        initialLogs = [];
      }
    }

    let initialMeetings = [];
    const storedMeetings = localStorage.getItem('revit_meetings');
    if (storedMeetings) {
      try {
        const parsed = JSON.parse(storedMeetings);
        initialMeetings = parsed.map(m => {
          if (m && typeof m.pesertaIds === 'string') {
            m.pesertaIds = m.pesertaIds ? m.pesertaIds.split(',') : [];
          }
          return m;
        });
      } catch {
        initialMeetings = [];
      }
    }
    setMeetings(initialMeetings);

    // Meeting Docs
    const storedMeetingDocs = localStorage.getItem('revit_meeting_docs');
    if (storedMeetingDocs) {
      try {
        setMeetingDocs(JSON.parse(storedMeetingDocs).filter(Boolean));
      } catch {
        setMeetingDocs([]);
      }
    } else {
      setMeetingDocs([]);
      localStorage.setItem('revit_meeting_docs', JSON.stringify([]));
    }

    // Synchronize daily logs with the loaded meetings
    const syncedLogs = syncMeetingLogs(initialMeetings, initialLogs);
    setLogs(syncedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(syncedLogs));

    // Load and Synchronize activity logs with the loaded meetings
    let initialActivityLogs = [];
    const storedActivityLogs = localStorage.getItem('revit_activity_logs');
    if (storedActivityLogs) {
      try {
        initialActivityLogs = JSON.parse(storedActivityLogs).filter(Boolean);
      } catch {
        initialActivityLogs = [];
      }
    }
    const syncedActivityLogs = syncMeetingActivityLogs(initialMeetings, initialActivityLogs);
    setActivityLogs(syncedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(syncedActivityLogs));

    // Monthly PDF Reports
    const storedReports = localStorage.getItem('revit_reports');
    if (storedReports) {
      try {
        setReports(JSON.parse(storedReports).filter(Boolean));
      } catch {
        setReports([]);
      }
    } else {
      setReports([]);
      localStorage.setItem('revit_reports', JSON.stringify([]));
    }

    // Duty Reports
    const storedDutyReports = localStorage.getItem('revit_duty_reports');
    if (storedDutyReports) {
      try {
        setDutyReports(JSON.parse(storedDutyReports).filter(Boolean));
      } catch {
        setDutyReports([]);
      }
    } else {
      setDutyReports([]);
      localStorage.setItem('revit_duty_reports', JSON.stringify([]));
    }

    // Expenses
    const storedExpenses = localStorage.getItem('revit_expenses');
    if (storedExpenses) {
      try {
        setExpenses(JSON.parse(storedExpenses).filter(Boolean));
      } catch {
        setExpenses([]);
      }
    } else {
      setExpenses([]);
      localStorage.setItem('revit_expenses', JSON.stringify([]));
    }

    // Payments
    const storedPayments = localStorage.getItem('revit_payments');
    if (storedPayments) {
      try {
        setPayments(JSON.parse(storedPayments).filter(Boolean));
      } catch {
        setPayments([]);
      }
    } else {
      setPayments([]);
      localStorage.setItem('revit_payments', JSON.stringify([]));
    }

    // School Docs
    const storedSchoolDocs = localStorage.getItem('revit_school_docs');
    if (storedSchoolDocs) {
      try {
        setSchoolDocs(JSON.parse(storedSchoolDocs).filter(Boolean));
      } catch {
        setSchoolDocs([]);
      }
    } else {
      setSchoolDocs([]);
      localStorage.setItem('revit_school_docs', JSON.stringify([]));
    }

    // Personnel Docs
    const storedPersonnelDocs = localStorage.getItem('revit_personnel_docs');
    if (storedPersonnelDocs) {
      try {
        setPersonnelDocs(JSON.parse(storedPersonnelDocs).filter(Boolean));
      } catch {
        setPersonnelDocs([]);
      }
    } else {
      setPersonnelDocs([]);
      localStorage.setItem('revit_personnel_docs', JSON.stringify([]));
    }

    // Trip Docs
    const storedTripDocs = localStorage.getItem('revit_trip_docs');
    if (storedTripDocs) {
      try {
        setTripDocs(JSON.parse(storedTripDocs).filter(Boolean));
      } catch {
        setTripDocs([]);
      }
    } else {
      setTripDocs([]);
      localStorage.setItem('revit_trip_docs', JSON.stringify([]));
    }

    // Diagnostics
    console.log("=== SINKRONISASI DIAGNOSTIC ===");
    console.log("1. .env URL:", import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL);
    console.log("2. .env Token:", import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN);
    console.log("3. localStorage revit_last_env_url:", localStorage.getItem('revit_last_env_url'));
    console.log("4. localStorage revit_settings:", localStorage.getItem('revit_settings'));

    // Settings
    const storedSettings = localStorage.getItem('revit_settings');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed.projectStartDate === '2027-06-12') parsed.projectStartDate = '2026-06-12';
      if (parsed.projectEndDate === '2027-12-12') parsed.projectEndDate = '2026-12-12';
      // Hapus simulatedToday dari settings ter-parse jika ada
      delete parsed.simulatedToday;

      // Deteksi jika VITE_GOOGLE_APPS_SCRIPT_URL/Token di .env berubah, kita timpa data di localStorage
      // agar developer tidak terjebak dengan cache URL/token lama di localStorage saat memodifikasi file .env.
      const envUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';
      const envToken = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'REVITSD2026_SECURE_TOKEN';

      let finalUrl = parsed.googleAppsScriptUrl || envUrl;
      let finalToken = parsed.googleAppsScriptToken || envToken;

      let hasEnvChanged = false;

      const lastEnvUrl = localStorage.getItem('revit_last_env_url');
      if (envUrl && (lastEnvUrl !== envUrl || parsed.googleAppsScriptUrl !== envUrl)) {
        finalUrl = envUrl;
        localStorage.setItem('revit_last_env_url', envUrl);
        parsed.googleAppsScriptUrl = envUrl;
        hasEnvChanged = true;
      } else if (!lastEnvUrl && envUrl) {
        localStorage.setItem('revit_last_env_url', envUrl);
      }

      const lastEnvToken = localStorage.getItem('revit_last_env_token');
      if (envToken && (lastEnvToken !== envToken || parsed.googleAppsScriptToken !== envToken)) {
        finalToken = envToken;
        localStorage.setItem('revit_last_env_token', envToken);
        parsed.googleAppsScriptToken = envToken;
        hasEnvChanged = true;
      } else if (!lastEnvToken && envToken) {
        localStorage.setItem('revit_last_env_token', envToken);
      }

      // Jika URL atau Token ter-update, simpan kembali ke localStorage
      if (hasEnvChanged || parsed.googleAppsScriptUrl !== finalUrl || parsed.googleAppsScriptToken !== finalToken) {
        parsed.googleAppsScriptUrl = finalUrl;
        parsed.googleAppsScriptToken = finalToken;
        localStorage.setItem('revit_settings', JSON.stringify(parsed));
      }

      setSettings(prev => ({ 
        projectStartDate: '2026-06-12',
        projectEndDate: '2026-12-12',
        googleAppsScriptUrl: finalUrl,
        googleAppsScriptToken: finalToken,
        totalProjectContract: 1500000000,
        honorKetuaTim: 7000000,
        honorKoordinator: 6000000,
        honorFasilitator: 5000000,
        honorAdministrasi: 5000000,
        deductionTaxPct: 15,
        deductionLembagaPct: 10,
        biayaOperasional: 0,
        ...parsed 
      }));
    } else {
      const envUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';
      const envToken = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'REVITSD2026_SECURE_TOKEN';
      localStorage.setItem('revit_last_env_url', envUrl);
      localStorage.setItem('revit_last_env_token', envToken);
      localStorage.setItem('revit_settings', JSON.stringify({
        projectStartDate: '2026-06-12',
        projectEndDate: '2026-12-12',
        googleAppsScriptUrl: envUrl,
        googleAppsScriptToken: envToken,
        totalProjectContract: 1500000000,
        honorKetuaTim: 7000000,
        honorKoordinator: 6000000,
        honorFasilitator: 5000000,
        honorAdministrasi: 5000000,
        deductionTaxPct: 15,
        deductionLembagaPct: 10,
        biayaOperasional: 0
      }));
    }

    // Initial fetch from Google Sheets if configured
    const checkAndFetchInitialData = async () => {
      if (syncService.isConfigured()) {
        setSyncStatus('connecting');
        setIsBlockingSync(true);
        try {
          const remoteData = await syncService.fetchData();
          
          if (remoteData.users) {
            const clean = remoteData.users.filter(u => u && isValidId(u.id)).map(u => ({
              ...u,
              taxPct: (u.taxPct === undefined || u.taxPct === null || String(u.taxPct).trim() === '') ? null : Number(u.taxPct)
            }));
            if (clean.length > 0) {
              setUsers(clean);
              localStorage.setItem('revit_users', JSON.stringify(clean));
            }
          }
          if (remoteData.schools) {
            const clean = remoteData.schools.filter(s => s && isValidId(s.npsn)).map(s => {
              let updated = { 
                ...s,
                npsn: String(s.npsn).trim()
              };
              if (updated.nama && isInvalidSchoolName(updated.nama_sekolah, updated.npsn) && !isInvalidSchoolName(updated.nama, updated.npsn)) {
                updated.nama_sekolah = updated.nama;
              }
              if (updated.kepalaSekolah && (!updated.kepala_sekolah || updated.kepala_sekolah.trim() === '')) {
                updated.kepala_sekolah = updated.kepalaSekolah;
              }
              
              const init = initialSchools.find(x => String(x.npsn) === updated.npsn);
              if (init) {
                if (isInvalidSchoolName(updated.nama_sekolah, updated.npsn)) {
                  updated.nama_sekolah = init.nama_sekolah;
                }
                if (init.kepala_sekolah && (!updated.kepala_sekolah || updated.kepala_sekolah.trim() === '')) {
                  updated.kepala_sekolah = init.kepala_sekolah;
                }
                if (init.koordinat && !s.koordinat) {
                  updated.koordinat = init.koordinat;
                }
                if (init.fasilitatorId && !s.fasilitatorId) {
                  updated.fasilitatorId = init.fasilitatorId;
                }
              }
              return updated;
            });
            if (clean.length > 0) {
              setSchools(clean);
              localStorage.setItem('revit_schools', JSON.stringify(clean));
            }
          }
          if (remoteData.contacts) {
            const clean = remoteData.contacts.filter(c => c && isValidId(c.id));
            setContacts(clean);
            localStorage.setItem('revit_contacts', JSON.stringify(clean));
          }
          if (remoteData.tasks) {
            const clean = remoteData.tasks.filter(t => t && isValidId(t.id));
            setTasks(clean);
            localStorage.setItem('revit_tasks', JSON.stringify(clean));
          }
          if (remoteData.trips) {
            const clean = remoteData.trips.filter(t => t && isValidId(t.id)).map(t => {
              const normalized = { ...t };
              if (normalized.schoolId && !normalized.sekolahId) normalized.sekolahId = normalized.schoolId;
              if (normalized.date && !normalized.tanggalMulai) normalized.tanggalMulai = normalized.date;
              if (normalized.duration && !normalized.durasiHari) normalized.durasiHari = normalized.duration;
              if (normalized.status && !normalized.statusPersetujuan) {
                normalized.statusPersetujuan = normalized.status === 'planned' ? 'pending' : 'approved';
              }
              if (!normalized.kunjunganKe) normalized.kunjunganKe = 1;
              if (!normalized.userRoleTim) normalized.userRoleTim = 'Fasilitator';
              if (!normalized.tanggalSelesai) normalized.tanggalSelesai = normalized.tanggalMulai;
              return normalized;
            });
            setTrips(clean);
            localStorage.setItem('revit_trips', JSON.stringify(clean));
          }
          if (remoteData.logs) {
            const clean = remoteData.logs.filter(l => l && isValidId(l.id));
            setLogs(clean);
            localStorage.setItem('revit_logs', JSON.stringify(clean));
          }
          if (remoteData.reports) {
            const clean = remoteData.reports.filter(r => r && isValidId(r.id));
            setReports(clean);
            localStorage.setItem('revit_reports', JSON.stringify(clean));
          }
          if (remoteData.duty_reports) {
            const clean = remoteData.duty_reports.filter(dr => dr && isValidId(dr.userId));
            setDutyReports(clean);
            localStorage.setItem('revit_duty_reports', JSON.stringify(clean));
          }
          if (remoteData.expenses) {
            const clean = remoteData.expenses.filter(e => e && isValidId(e.id));
            setExpenses(clean);
            localStorage.setItem('revit_expenses', JSON.stringify(clean));
          }
          if (remoteData.payments) {
            const clean = remoteData.payments.filter(p => p && isValidId(p.id));
            setPayments(clean);
            localStorage.setItem('revit_payments', JSON.stringify(clean));
          }
          if (remoteData.school_docs) {
            const clean = remoteData.school_docs.filter(d => d && isValidId(d.id));
            setSchoolDocs(clean);
            localStorage.setItem('revit_school_docs', JSON.stringify(clean));
          }
          if (remoteData.personnel_docs) {
            const clean = remoteData.personnel_docs.filter(d => d && isValidId(d.id));
            setPersonnelDocs(clean);
            localStorage.setItem('revit_personnel_docs', JSON.stringify(clean));
          }
          let cleanMeetings = meetings;
          if (remoteData.meetings) {
            cleanMeetings = remoteData.meetings.filter(m => m && isValidId(m.id)).map(m => {
              if (m && typeof m.pesertaIds === 'string') {
                m.pesertaIds = m.pesertaIds ? m.pesertaIds.split(',') : [];
              }
              return m;
            });
            setMeetings(cleanMeetings);
            localStorage.setItem('revit_meetings', JSON.stringify(cleanMeetings));

            if (remoteData.meeting_docs) {
              const cleanDocs = remoteData.meeting_docs.filter(d => d && isValidId(d.id));
              setMeetingDocs(cleanDocs);
              localStorage.setItem('revit_meeting_docs', JSON.stringify(cleanDocs));
            }
          }
          if (remoteData.trip_docs) {
            const clean = remoteData.trip_docs.filter(d => d && isValidId(d.id));
            setTripDocs(clean);
            localStorage.setItem('revit_trip_docs', JSON.stringify(clean));
          }

            // Sync meeting logs when meetings are loaded
            const currentLogs = remoteData.logs ? remoteData.logs.filter(l => l && isValidId(l.id)) : logs;
            const updatedLogs = syncMeetingLogs(cleanMeetings, currentLogs);
            setLogs(updatedLogs);
            localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

          let cleanActivityLogs = activityLogs;
          if (remoteData.activity_logs) {
            cleanActivityLogs = remoteData.activity_logs.filter(l => l && isValidId(l.id)).map(l => {
              if (l.fileRef_fileData) {
                l.fileRef = {
                  id: l.fileRef_id || '',
                  type: l.fileRef_type || '',
                  fileName: l.fileRef_fileName || '',
                  fileData: l.fileRef_fileData
                };
              } else {
                l.fileRef = null;
              }
              delete l.fileRef_id;
              delete l.fileRef_type;
              delete l.fileRef_fileName;
              delete l.fileRef_fileData;
              return l;
            });
          }
          const finalActivityLogs = syncMeetingActivityLogs(cleanMeetings, cleanActivityLogs);
          setActivityLogs(finalActivityLogs);
          localStorage.setItem('revit_activity_logs', JSON.stringify(finalActivityLogs));
          if (remoteData.settings) {
            const parsedSettings = parseSettings(remoteData.settings);
            // Cegah URL/Token remote menimpa URL/Token lokal kita
            delete parsedSettings.googleAppsScriptUrl;
            delete parsedSettings.googleAppsScriptToken;
            setSettings(prev => {
              const next = { ...prev, ...parsedSettings };
              localStorage.setItem('revit_settings', JSON.stringify(next));
              return next;
            });
          }
          setSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
          setIsBlockingSync(false);
        } catch (err) {
          console.error("Initial load from Sheets failed, using localStorage fallback:", err);
          setSyncStatus('error');
          setIsBlockingSync(false);
        }
      } else {
        setSyncStatus('offline');
      }
    };

    checkAndFetchInitialData();

    // Active User session if exists
    const storedActiveUser = localStorage.getItem('revit_active_user');
    if (storedActiveUser) setActiveUser(JSON.parse(storedActiveUser));

    // Activity logs are already loaded and synced with meetings above

    // Global Dialog Registration
    window.showAlert = (message) => {
      return new Promise((resolve) => {
        setDialog({
          type: 'alert',
          message,
          resolve
        });
      });
    };

    window.showConfirm = (message) => {
      return new Promise((resolve) => {
        setDialog({
          type: 'confirm',
          message,
          resolve
        });
      });
    };
  }, []);

  // Periodic background sync every 60 seconds (only if configured)
  useEffect(() => {
    if (!syncService.isConfigured()) return;

    const interval = setInterval(() => {
      // Auto-sync in background silently
      triggerSync();
    }, 60000); // 60 detik sekali

    return () => clearInterval(interval);
  }, [settings.googleAppsScriptUrl]);

  const handleViewChange = (viewId) => {
    setActiveView(viewId);
    setSelectedSchoolNpsn(null); // Reset detail page when switching tabs
    setSchoolDetailReferrer(null);
  };

  // 3. User Select & Session Handlers
  const handleSelectUser = (user) => {
    setActiveUser(user);
    handleViewChange('dashboard');
    localStorage.setItem('revit_active_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.clear();
    window.location.reload();
  };

  // 3b. Synchronization Core Functions
  const triggerSync = async (currentState = null, isManual = false) => {
    if (!syncService.isConfigured()) {
      setSyncStatus('offline');
      return;
    }

    if (isSyncingRef.current) {
      console.log('[Sync] Sinkronisasi sedang berjalan. Mengabaikan trigger baru...');
      // State was already marked as dirty by syncWithNewState, so it will be pushed on the next sync interval or manual sync.
      return;
    }

    isSyncingRef.current = true;
    setSyncStatus('connecting');
    if (isManual) {
      setIsBlockingSync(true);
    }
    try {
      const localDirty = localStorage.getItem('revit_is_dirty') === 'true';
      const stateToPush = currentState || latestStateRef.current || {
        users,
        schools,
        contacts,
        tasks,
        trips,
        logs,
        reports,
        dutyReports,
        expenses,
        payments,
        schoolDocs,
        personnelDocs,
        meetings,
        meetingDocs,
        tripDocs,
        activityLogs,
        settings,
        ...pendingSyncUpdatesRef.current
      };

      // Hanya pushData jika ada state baru (currentState) atau data lokal ditandai kotor (localDirty)
      if (currentState || localDirty) {
        console.log('[Sync] Terdapat perubahan lokal. Mengirim data ke Google Sheets...');
        // PROTEKSI RACE CONDITION PART 2:
        // Set flag menjadi false *SEBELUM* pushData dimulai. 
        // Jika ada perubahan state baru (dari interaksi user) saat pushData sedang berjalan (berlangsung ~2 detik),
        // maka aksi user akan men-set flag menjadi true kembali.
        localStorage.setItem('revit_is_dirty', 'false');
        setIsDirty(false);

        try {
          await syncService.pushData(stateToPush);
        } catch (e) {
          // Jika push gagal, kembalikan status dirty agar dipush ulang di kesempatan berikutnya
          localStorage.setItem('revit_is_dirty', 'true');
          setIsDirty(true);
          throw e;
        }
        
        // PENTING: Setelah push berhasil, JANGAN langsung fetch dari server.
        // Google Sheets memiliki delay pemrosesan, sehingga fetch segera setelah push
        // akan mengembalikan data LAMA (sebelum push diproses), yang menimpa perubahan lokal.
        // Data lokal kita adalah sumber kebenaran setelah push berhasil.
        // Pull data dari server hanya dilakukan saat background sync berkala (setiap 60 detik)
        // di mana tidak ada perubahan lokal yang tertunda.
        console.log('[Sync] Push berhasil. Melewati fetch untuk menghindari data lama dari server.');
        pendingSyncUpdatesRef.current = {};
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        setIsBlockingSync(false);
        isSyncingRef.current = false;
        return;
      } else {
        console.log('[Sync] Tidak ada perubahan lokal. Hanya mengambil data dari Google Sheets...');
      }
      const remoteData = await syncService.fetchData();

      // PROTEKSI RACE CONDITION KRUSIAL:
      // Jika user melakukan aksi (misal: save trip) saat fetchData sedang berjalan,
      // flag revit_is_dirty akan menjadi true. Jika kita timpa state sekarang, data baru user akan lenyap!
      if (localStorage.getItem('revit_is_dirty') === 'true') {
        console.warn('[Sync] Peringatan: State lokal berubah saat mengambil data dari server. Membatalkan update state untuk mencegah hilangnya data (data akan di-push di siklus berikutnya).');
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        setIsBlockingSync(false);
        isSyncingRef.current = false;
        
        // Panggil triggerSync lagi secara rekursif agar perubahan yang tertunda segera dipush
        setTimeout(() => triggerSync(latestStateRef.current, false), 1000);
        return;
      }

      if (remoteData.users) {
        const clean = remoteData.users.filter(u => u && isValidId(u.id)).map(u => ({
          ...u,
          taxPct: (u.taxPct === undefined || u.taxPct === null || String(u.taxPct).trim() === '') ? null : Number(u.taxPct)
        }));
        if (clean.length > 0) {
          setUsers(clean);
          localStorage.setItem('revit_users', JSON.stringify(clean));
        }
      }
      if (remoteData.schools) {
        const clean = remoteData.schools.filter(s => s && isValidId(s.npsn)).map(s => {
          let updated = { 
            ...s,
            npsn: String(s.npsn).trim()
          };
          if (updated.nama && isInvalidSchoolName(updated.nama_sekolah, updated.npsn) && !isInvalidSchoolName(updated.nama, updated.npsn)) {
            updated.nama_sekolah = updated.nama;
          }
          if (updated.kepalaSekolah && (!updated.kepala_sekolah || updated.kepala_sekolah.trim() === '')) {
            updated.kepala_sekolah = updated.kepalaSekolah;
          }
          
          const init = initialSchools.find(x => String(x.npsn) === updated.npsn);
          if (init) {
            if (isInvalidSchoolName(updated.nama_sekolah, updated.npsn)) {
              updated.nama_sekolah = init.nama_sekolah;
            }
            if (init.kepala_sekolah && (!updated.kepala_sekolah || updated.kepala_sekolah.trim() === '')) {
              updated.kepala_sekolah = init.kepala_sekolah;
            }
            if (init.koordinat && !s.koordinat) {
              updated.koordinat = init.koordinat;
            }
            if (init.fasilitatorId && !s.fasilitatorId) {
              updated.fasilitatorId = init.fasilitatorId;
            }
          }
          return updated;
        });
        if (clean.length > 0) {
          setSchools(clean);
          localStorage.setItem('revit_schools', JSON.stringify(clean));
        }
      }
      if (remoteData.contacts) {
        const clean = remoteData.contacts.filter(c => c && isValidId(c.id));
        setContacts(clean);
        localStorage.setItem('revit_contacts', JSON.stringify(clean));
      }
      if (remoteData.tasks) {
        const clean = remoteData.tasks.filter(t => t && isValidId(t.id));
        setTasks(clean);
        localStorage.setItem('revit_tasks', JSON.stringify(clean));
      }
      if (remoteData.trips) {
        console.log('[DEBUG] Raw remoteData.trips:', remoteData.trips);
        const clean = remoteData.trips.filter(t => t && isValidId(t.id)).map(t => {
          // Normalize old schema to new schema to prevent data loss if Code.gs is outdated
          const normalized = { ...t };
          if (normalized.schoolId && !normalized.sekolahId) normalized.sekolahId = normalized.schoolId;
          if (normalized.date && !normalized.tanggalMulai) normalized.tanggalMulai = normalized.date;
          if (normalized.duration && !normalized.durasiHari) normalized.durasiHari = normalized.duration;
          if (normalized.status && !normalized.statusPersetujuan) {
            normalized.statusPersetujuan = normalized.status === 'planned' ? 'pending' : 'approved';
          }
          if (!normalized.kunjunganKe) normalized.kunjunganKe = 1;
          if (!normalized.userRoleTim) normalized.userRoleTim = 'Fasilitator';
          if (!normalized.tanggalSelesai) normalized.tanggalSelesai = normalized.tanggalMulai;
          return normalized;
        });
        console.log('[DEBUG] Cleaned trips after filter and mapping:', clean);
        setTrips(clean);
        localStorage.setItem('revit_trips', JSON.stringify(clean));
      }
      if (remoteData.logs) {
        const clean = remoteData.logs.filter(l => l && isValidId(l.id));
        setLogs(clean);
        localStorage.setItem('revit_logs', JSON.stringify(clean));
      }
      if (remoteData.reports) {
        const clean = remoteData.reports.filter(r => r && isValidId(r.id));
        setReports(clean);
        localStorage.setItem('revit_reports', JSON.stringify(clean));
      }
      if (remoteData.duty_reports) {
        const clean = remoteData.duty_reports.filter(dr => dr && isValidId(dr.userId));
        setDutyReports(clean);
        localStorage.setItem('revit_duty_reports', JSON.stringify(clean));
      }
      if (remoteData.expenses) {
        const clean = remoteData.expenses.filter(e => e && isValidId(e.id));
        setExpenses(clean);
        localStorage.setItem('revit_expenses', JSON.stringify(clean));
      }
      if (remoteData.payments) {
        const clean = remoteData.payments.filter(p => p && isValidId(p.id));
        setPayments(clean);
        localStorage.setItem('revit_payments', JSON.stringify(clean));
      }
      if (remoteData.school_docs) {
        const clean = remoteData.school_docs.filter(d => d && isValidId(d.id));
        setSchoolDocs(clean);
        localStorage.setItem('revit_school_docs', JSON.stringify(clean));
      }
      if (remoteData.personnel_docs) {
        const clean = remoteData.personnel_docs.filter(d => d && isValidId(d.id));
        setPersonnelDocs(clean);
        localStorage.setItem('revit_personnel_docs', JSON.stringify(clean));
      }
      let cleanMeetings = meetings;
      if (remoteData.meetings) {
        cleanMeetings = remoteData.meetings.filter(m => m && isValidId(m.id)).map(m => {
          if (m && typeof m.pesertaIds === 'string') {
            m.pesertaIds = m.pesertaIds ? m.pesertaIds.split(',') : [];
          }
          return m;
        });
        setMeetings(cleanMeetings);
        localStorage.setItem('revit_meetings', JSON.stringify(cleanMeetings));

        if (remoteData.meeting_docs) {
          const cleanDocs = remoteData.meeting_docs.filter(d => d && isValidId(d.id));
          setMeetingDocs(cleanDocs);
          localStorage.setItem('revit_meeting_docs', JSON.stringify(cleanDocs));
        }

        // Sync meeting logs when meetings are loaded
        const currentLogs = remoteData.logs ? remoteData.logs.filter(l => l && isValidId(l.id)) : logs;
        const updatedLogs = syncMeetingLogs(cleanMeetings, currentLogs);
        setLogs(updatedLogs);
        localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));
      }
      if (remoteData.trip_docs) {
        const clean = remoteData.trip_docs.filter(d => d && isValidId(d.id));
        setTripDocs(clean);
        localStorage.setItem('revit_trip_docs', JSON.stringify(clean));
      }

      let cleanActivityLogs = activityLogs;
      if (remoteData.activity_logs) {
        cleanActivityLogs = remoteData.activity_logs.filter(l => l && isValidId(l.id)).map(l => {
          if (l.fileRef_fileData) {
            l.fileRef = {
              id: l.fileRef_id || '',
              type: l.fileRef_type || '',
              fileName: l.fileRef_fileName || '',
              fileData: l.fileRef_fileData
            };
          } else {
            l.fileRef = null;
          }
          delete l.fileRef_id;
          delete l.fileRef_type;
          delete l.fileRef_fileName;
          delete l.fileRef_fileData;
          return l;
        });
      }
      const finalActivityLogs = syncMeetingActivityLogs(cleanMeetings, cleanActivityLogs);
      setActivityLogs(finalActivityLogs);
      localStorage.setItem('revit_activity_logs', JSON.stringify(finalActivityLogs));
      if (remoteData.settings) {
        const parsedSettings = parseSettings(remoteData.settings);
        // Cegah URL/Token remote menimpa URL/Token lokal kita
        delete parsedSettings.googleAppsScriptUrl;
        delete parsedSettings.googleAppsScriptToken;
        setSettings(prev => {
          const next = { ...prev, ...parsedSettings };
          localStorage.setItem('revit_settings', JSON.stringify(next));
          return next;
        });
      }

      // Bersihkan pending updates setelah berhasil fetch data server tanpa gangguan
      pendingSyncUpdatesRef.current = {};
      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
      setIsBlockingSync(false);
    } catch (error) {
      console.error('Sync Error:', error);
      setSyncStatus('error');
      setIsBlockingSync(false);
      // Tampilkan error detail ke user agar bisa di-diagnosa
      const errMsg = error?.message || String(error);
      console.error('[Sync] Detail error sinkronisasi:', errMsg, 'URL aktif:', syncService.getApiConfig().url);
      // Simpan error terakhir untuk UI
      setLastSyncTime(`Error: ${errMsg.substring(0, 100)}`);
    } finally {
      isSyncingRef.current = false;
      setIsBlockingSync(false);
    }
  };


  const syncWithNewState = (updatedStateKeys, isManual = false) => {
    localStorage.setItem('revit_is_dirty', 'true');
    setIsDirty(true);
    
    pendingSyncUpdatesRef.current = { ...pendingSyncUpdatesRef.current, ...updatedStateKeys };
    
    const nextState = {
      users,
      schools,
      contacts,
      tasks,
      trips,
      logs,
      reports,
      dutyReports,
      expenses,
      payments,
      schoolDocs,
      personnelDocs,
      meetings,
      meetingDocs,
      tripDocs,
      activityLogs,
      settings,
      ...pendingSyncUpdatesRef.current
    };
    triggerSync(nextState, isManual);
  };

  // Auto-seed welcome log on Facilitator login
  useEffect(() => {
    if (activeUser && activeUser.jabatanTim === 'Fasilitator') {
      const stored = localStorage.getItem('revit_activity_logs');
      let currentLogs = [];
      if (stored) {
        try {
          currentLogs = JSON.parse(stored).filter(Boolean);
        } catch (e) {
          currentLogs = [];
        }
      }
      const userLogs = currentLogs.filter(l => l.userId === activeUser.id);
      if (userLogs.length === 0) {
        const welcomeLog = {
          id: `act-welcome-${activeUser.id}-${Date.now()}`,
          userId: activeUser.id,
          timestamp: new Date().toISOString(),
          actionType: 'system',
          description: `Masuk ke dalam Sistem Informasi Revitalisasi SD 2026 sebagai ${activeUser.nama}`,
          fileRef: null
        };
        const updated = [welcomeLog, ...currentLogs];
        setActivityLogs(updated);
        localStorage.setItem('revit_activity_logs', JSON.stringify(updated));
        syncWithNewState({ activityLogs: updated });
      }
    }
  }, [activeUser]);

  // 4. Update Settings (Super Admin)
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('revit_settings', JSON.stringify(newSettings));
    syncWithNewState({ settings: newSettings }, true);
  };

  // 5. CRUD Team Members (Super Admin)
  const handleAddUser = (newUser) => {
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('revit_users', JSON.stringify(updated));
    syncWithNewState({ users: updated });
  };

  const handleUpdateUser = (updatedUser) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    localStorage.setItem('revit_users', JSON.stringify(updated));
    let nextActiveUser = activeUser;
    if (activeUser && activeUser.id === updatedUser.id) {
      nextActiveUser = updatedUser;
      setActiveUser(updatedUser);
      localStorage.setItem('revit_active_user', JSON.stringify(updatedUser));
    }
    syncWithNewState({ users: updated });
  };

  const handleUpdateUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('revit_users', JSON.stringify(updatedUsers));
    syncWithNewState({ users: updatedUsers });
  };

  const handleUpdateSettingsAndUsers = (newSettings, updatedUsers) => {
    setSettings(newSettings);
    localStorage.setItem('revit_settings', JSON.stringify(newSettings));
    setUsers(updatedUsers);
    localStorage.setItem('revit_users', JSON.stringify(updatedUsers));
    syncWithNewState({ settings: newSettings, users: updatedUsers }, true);
  };

  const handleDeleteUser = (userId) => {
    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);
    localStorage.setItem('revit_users', JSON.stringify(updatedUsers));
    // Reset assigned schools for this user to ensure data consistency
    const updatedSchools = schools.map((s) => s.fasilitatorId === userId ? { ...s, fasilitatorId: null } : s);
    setSchools(updatedSchools);
    localStorage.setItem('revit_schools', JSON.stringify(updatedSchools));
    syncWithNewState({ users: updatedUsers, schools: updatedSchools });
  };

  // 6. Edit Profile Modal (Self Profile Edit)
  const handleSaveProfile = (updatedProfile) => {
    handleUpdateUser(updatedProfile);
    setIsEditingProfile(false);
  };

  const handleDialogConfirm = () => {
    if (dialog && dialog.resolve) {
      dialog.resolve(true);
    }
    setDialog(null);
  };

  const handleDialogCancel = () => {
    if (dialog && dialog.resolve) {
      dialog.resolve(false);
    }
    setDialog(null);
  };

  // 7. School Actions (Fase 2)
  const handleAddSchool = (newSchool) => {
    const updated = [...schools, newSchool];
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
    syncWithNewState({ schools: updated });
  };

  const handleUpdateSchool = (updatedSchool) => {
    const oldSchool = schools.find((s) => s.npsn === updatedSchool.npsn);
    if (oldSchool && oldSchool.progres_fisik !== updatedSchool.progres_fisik) {
      addActivityLog('update_progress', `Update progress sekolah ${updatedSchool.nama_sekolah} ke ${updatedSchool.progres_fisik}%`);
    }
    const updated = schools.map((s) => (s.npsn === updatedSchool.npsn ? updatedSchool : s));
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
    syncWithNewState({ schools: updated });
  };

  const handleClaimSchool = (npsn, fasilitatorId) => {
    const schoolObj = schools.find((s) => s.npsn === npsn);
    if (schoolObj) {
      addActivityLog('claim_school', `Mengklaim sekolah ${schoolObj.nama_sekolah}`);
    }
    const updated = schools.map((s) => (s.npsn === npsn ? { ...s, fasilitatorId } : s));
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
    syncWithNewState({ schools: updated });
  };

  // 8. Contact Actions (Fase 3)
  const handleAddContact = (newContact) => {
    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
    syncWithNewState({ contacts: updated });
  };

  const handleUpdateContact = (updatedContact) => {
    const updated = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c));
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
    syncWithNewState({ contacts: updated });
  };

  const handleDeleteContact = (contactId) => {
    const updatedContacts = contacts.filter((c) => c.id !== contactId);
    setContacts(updatedContacts);
    localStorage.setItem('revit_contacts', JSON.stringify(updatedContacts));
    // also remove references
    const updatedSchools = schools.map((s) => {
      let isChanged = false;
      const updatedS = { ...s };
      if (s.perencanaId === contactId) { updatedS.perencanaId = null; isChanged = true; }
      if (s.pengawasId === contactId) { updatedS.pengawasId = null; isChanged = true; }
      return isChanged ? updatedS : s;
    });
    setSchools(updatedSchools);
    localStorage.setItem('revit_schools', JSON.stringify(updatedSchools));
    syncWithNewState({ contacts: updatedContacts, schools: updatedSchools });
  };

  // 9. Task Actions (Fase 3)
  const handleAddTask = (newTask) => {
    const targetSchool = schools.find((s) => s.npsn === newTask.sekolahId);
    const schoolName = targetSchool ? targetSchool.nama_sekolah : newTask.sekolahId;
    addActivityLog('add_task', `Menambahkan tugas '${newTask.title}' di sekolah ${schoolName}`);
    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
    syncWithNewState({ tasks: updated });
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const targetSchool = schools.find((s) => s.npsn === task.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : task.sekolahId;
      const statusMap = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
      const statusIndo = statusMap[status] || status;
      addActivityLog('update_task', `Mengubah status tugas '${task.title}' menjadi '${statusIndo}' di sekolah ${schoolName}`);
    }
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
    syncWithNewState({ tasks: updated });
  };

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const targetSchool = schools.find((s) => s.npsn === task.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : task.sekolahId;
      addActivityLog('delete_task', `Menghapus tugas '${task.title}' di sekolah ${schoolName}`);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
    syncWithNewState({ tasks: updated });
  };

  // 10. Trip Actions (Fase 3 & 4)
  const handleAddTrip = (newTrip) => {
    const tripsArr = Array.isArray(newTrip) ? newTrip : [newTrip];
    tripsArr.forEach(t => {
      const targetSchool = schools.find(s => s.npsn === t.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : t.sekolahId;
      addActivityLog('add_trip', `Merencanakan perjalanan dinas ke ${schoolName} tanggal ${t.tanggal}`);
    });
    const updated = Array.isArray(newTrip) ? [...trips, ...newTrip] : [...trips, newTrip];
    setTrips(updated);
    localStorage.setItem('revit_trips', JSON.stringify(updated));
    syncWithNewState({ trips: updated });
  };

  const handlePayTrip = (tripId, newExpense) => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { ...t, isPaid: true } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('revit_expenses', JSON.stringify(updatedExpenses));
    syncWithNewState({ trips: updatedTrips, expenses: updatedExpenses });
  };

  const handleApproveTrip = (tripId, adminName) => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { 
      ...t, 
      statusPersetujuan: 'approved',
      approvedBySuperAdmin: true,
      approvedAt: new Date().toISOString(),
      approvedBy: adminName
    } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
  };

  const handleRejectTrip = (tripId) => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { 
      ...t, 
      statusPersetujuan: 'rejected',
      approvedBySuperAdmin: false
    } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
  };

  // Batch approve/reject untuk Super Admin (menyetujui/menolak sekaligus dalam satu batch)
  const handleApproveTripsBatch = (tripIds, approverName) => {
    const updatedTrips = trips.map((t) =>
      tripIds.includes(t.id) ? {
        ...t,
        statusPersetujuan: 'approved',
        approvedBySuperAdmin: true,
        approvedAt: new Date().toISOString(),
        approvedBy: approverName
      } : t
    );
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
  };

  const handleRejectTripsBatch = (tripIds) => {
    const updatedTrips = trips.map((t) =>
      tripIds.includes(t.id) ? {
        ...t,
        statusPersetujuan: 'rejected',
        approvedBySuperAdmin: false
      } : t
    );
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
  };

  const handleUpdateTrip = (updatedTrip) => {
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
    addActivityLog('update_trip', `Mengubah ajuan perjalanan dinas untuk ${updatedTrip.sekolahId}`);
  };

  const handleUpdateTripsBatch = (updatedTripsList) => {
    const updatedTripsMap = new Map(updatedTripsList.map(t => [t.id, t]));
    const newTrips = trips.map(t => updatedTripsMap.has(t.id) ? updatedTripsMap.get(t.id) : t);
    setTrips(newTrips);
    localStorage.setItem('revit_trips', JSON.stringify(newTrips));
    syncWithNewState({ trips: newTrips });
    addActivityLog('update_trip_batch', `Mengubah ajuan perjalanan dinas kolektif.`);
  };

  const handleDeleteTrip = (tripId) => {
    const updatedTrips = trips.filter((t) => t.id !== tripId);
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
    addActivityLog('delete_trip', `Membatalkan ajuan perjalanan dinas.`);
  };

  const handleDeleteTripsBatch = (tripIds) => {
    const updatedTrips = trips.filter((t) => !tripIds.includes(t.id));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips });
    addActivityLog('delete_trip_batch', `Membatalkan ajuan perjalanan dinas kolektif.`);
  };

  const handleAddTripDoc = (doc) => {
    const newDoc = { ...doc, id: `trip-doc-${Date.now()}` };
    const updated = [...tripDocs, newDoc];
    setTripDocs(updated);
    localStorage.setItem('revit_trip_docs', JSON.stringify(updated));
    syncWithNewState({ tripDocs: updated });
  };

  const handleDeleteTripDoc = (docId) => {
    const updated = tripDocs.filter(d => d.id !== docId);
    setTripDocs(updated);
    localStorage.setItem('revit_trip_docs', JSON.stringify(updated));
    syncWithNewState({ tripDocs: updated });
  };

  // 11. Daily Logs Actions (Fase 4)
  // PENTING: Semua handler log harian WAJIB menggabungkan perubahan logs + activityLogs
  // dalam SATU panggilan syncWithNewState agar tidak terjadi race condition.
  // Jangan gunakan addActivityLog() terpisah karena ia memicu sync sendiri dengan data logs lama (stale closure).

  const _createActivityEntry = (actionType, description, fileRef = null) => {
    if (!activeUser) return null;
    return {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: activeUser.id,
      timestamp: new Date().toISOString(),
      actionType,
      description,
      fileRef
    };
  };

  const handleAddLog = (newLog) => {
    const updatedLogs = [...logs, newLog];
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const actEntry = _createActivityEntry('add_daily_log', `Menambahkan log harian tanggal ${newLog.tanggal}: ${newLog.aktivitas}`, newLog.foto ? {
      id: newLog.id,
      type: 'daily_log_photo',
      fileName: `Foto_Log_${newLog.tanggal}.jpg`,
      fileData: newLog.foto
    } : null);
    const updatedActivityLogs = actEntry ? [actEntry, ...activityLogs].slice(0, 50) : activityLogs;
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ logs: updatedLogs, activityLogs: updatedActivityLogs });
  };

  const handleDeleteLog = (logId) => {
    const updatedLogs = logs.filter(l => l.id !== logId);
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const actEntry = _createActivityEntry('delete_daily_log', `Menghapus log harian`);
    const updatedActivityLogs = actEntry ? [actEntry, ...activityLogs].slice(0, 50) : activityLogs;
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ logs: updatedLogs, activityLogs: updatedActivityLogs });
  };

  const handleEditLog = (logId, newText) => {
    const updatedLogs = logs.map(l => l.id === logId ? { ...l, aktivitas: newText } : l);
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const actEntry = _createActivityEntry('edit_daily_log', `Mengedit log harian`);
    const updatedActivityLogs = actEntry ? [actEntry, ...activityLogs].slice(0, 50) : activityLogs;
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ logs: updatedLogs, activityLogs: updatedActivityLogs });
  };

  // 12. Monthly Reports PDF Actions (Fase 4)
  const handleAddReport = (newReport) => {
    addActivityLog('upload_monthly_report', `Mengunggah laporan bulanan ke-${newReport.bulanKe}: ${newReport.fileName}`, {
      id: newReport.id,
      type: 'report',
      fileName: newReport.fileName,
      fileData: newReport.fileData
    });
    // Overwrite if same month exists
    const updated = reports.filter(r => !(r.userId === newReport.userId && r.bulanKe === newReport.bulanKe));
    updated.push(newReport);
    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
    syncWithNewState({ reports: updated });
  };

  const handleDeleteReport = (reportId) => {
    const rep = reports.find(r => r.id === reportId);
    if (rep) {
      addActivityLog('delete_monthly_report', `Menghapus laporan bulanan ke-${rep.bulanKe}: ${rep.fileName}`);
    }
    const updated = reports.filter(r => r.id !== reportId);
    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
    syncWithNewState({ reports: updated });
  };

  // 13. Duty Reports Actions (Fase 4)
  const handleSaveDutyReport = (newReport) => {
    const updated = dutyReports.filter(r => !(r.userId === newReport.userId && r.dutyIndex === newReport.dutyIndex));
    updated.push(newReport);
    setDutyReports(updated);
    localStorage.setItem('revit_duty_reports', JSON.stringify(updated));
    syncWithNewState({ dutyReports: updated });
  };

  // 14. Expense Actions (Fase 4)
  const handleAddExpense = (newExpense) => {
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('revit_expenses', JSON.stringify(updated));
    syncWithNewState({ expenses: updated });
  };

  const handleDeleteExpense = (expenseId) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    setExpenses(updated);
    localStorage.setItem('revit_expenses', JSON.stringify(updated));
    syncWithNewState({ expenses: updated });
  };

  const handleAddPayment = (newPayment, newExpense) => {
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    localStorage.setItem('revit_payments', JSON.stringify(updatedPayments));

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('revit_expenses', JSON.stringify(updatedExpenses));
    syncWithNewState({ payments: updatedPayments, expenses: updatedExpenses });
  };

  const handleSetPaymentsStatus = (paymentUpdates, expenseAdditions = [], paymentIdsToRemove = []) => {
    let updatedPayments = [...payments];
    if (paymentIdsToRemove.length > 0) {
      updatedPayments = updatedPayments.filter(p => !paymentIdsToRemove.includes(p.id));
    }
    if (paymentUpdates.length > 0) {
      const updatedIds = paymentUpdates.map(p => p.id);
      updatedPayments = updatedPayments.filter(p => !updatedIds.includes(p.id));
      updatedPayments = [...updatedPayments, ...paymentUpdates];
    }
    setPayments(updatedPayments);
    localStorage.setItem('revit_payments', JSON.stringify(updatedPayments));

    let updatedExpenses = [...expenses];
    if (expenseAdditions.length > 0) {
      updatedExpenses = [...updatedExpenses, ...expenseAdditions];
      setExpenses(updatedExpenses);
      localStorage.setItem('revit_expenses', JSON.stringify(updatedExpenses));
    }
    syncWithNewState({ payments: updatedPayments, expenses: updatedExpenses });
  };

  const handleAddSchoolDoc = (newDoc) => {
    const targetSchool = schools.find(s => s.npsn === newDoc.sekolahId);
    const schoolName = targetSchool ? targetSchool.nama_sekolah : newDoc.sekolahId;
    addActivityLog('upload_school_doc', `Mengunggah dokumen sekolah ${schoolName}: ${newDoc.fileName}`, {
      id: newDoc.id,
      type: 'school_doc',
      fileName: newDoc.fileName,
      fileData: newDoc.fileData
    });
    const updated = [...schoolDocs, newDoc];
    setSchoolDocs(updated);
    localStorage.setItem('revit_school_docs', JSON.stringify(updated));
    syncWithNewState({ schoolDocs: updated });
  };

  const handleDeleteSchoolDoc = (docId) => {
    const doc = schoolDocs.find(d => d.id === docId);
    if (doc) {
      const targetSchool = schools.find(s => s.npsn === doc.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : doc.sekolahId;
      addActivityLog('delete_school_doc', `Menghapus dokumen sekolah ${schoolName}: ${doc.fileName}`);
    }
    const updated = schoolDocs.filter(d => d.id !== docId);
    setSchoolDocs(updated);
    localStorage.setItem('revit_school_docs', JSON.stringify(updated));
    syncWithNewState({ schoolDocs: updated });
  };

  const handleAddPersonnelDoc = (newDoc) => {
    addActivityLog('upload_personnel_doc', `Mengunggah dokumen personil: dokumen ${newDoc.type} ${newDoc.fileName}`, {
      id: newDoc.id,
      type: 'personnel',
      fileName: newDoc.fileName,
      fileData: newDoc.fileData
    });
    const updated = [...personnelDocs, newDoc];
    setPersonnelDocs(updated);
    localStorage.setItem('revit_personnel_docs', JSON.stringify(updated));
    syncWithNewState({ personnelDocs: updated });
  };

  const handleDeletePersonnelDoc = (docId) => {
    const doc = personnelDocs.find(d => d.id === docId);
    if (doc) {
      addActivityLog('delete_personnel_doc', `Menghapus dokumen personil: dokumen ${doc.type} ${doc.fileName}`);
    }
    const updated = personnelDocs.filter(d => d.id !== docId);
    setPersonnelDocs(updated);
    localStorage.setItem('revit_personnel_docs', JSON.stringify(updated));
    syncWithNewState({ personnelDocs: updated });
  };

  const handleAddMeeting = (newMeeting, documents = []) => {
    const schedLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: activeUser.id,
      timestamp: new Date().toISOString(),
      actionType: 'add_meeting',
      description: `Menjadwalkan rapat: "${newMeeting.judul}" pada ${newMeeting.tanggal}`,
      fileRef: null
    };

    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    localStorage.setItem('revit_meetings', JSON.stringify(updatedMeetings));

    let updatedDocs = [...meetingDocs];
    if (documents && documents.length > 0) {
      const docsWithId = documents.map(d => ({ ...d, meetingId: newMeeting.id }));
      updatedDocs = [...updatedDocs, ...docsWithId];
      setMeetingDocs(updatedDocs);
      localStorage.setItem('revit_meeting_docs', JSON.stringify(updatedDocs));
    }

    const updatedLogs = syncMeetingLogs(updatedMeetings, logs);
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const nextActivityLogsWithSched = [schedLog, ...activityLogs];
    const updatedActivityLogs = syncMeetingActivityLogs(updatedMeetings, nextActivityLogsWithSched);
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ 
      meetings: updatedMeetings, 
      meetingDocs: updatedDocs,
      logs: updatedLogs, 
      activityLogs: updatedActivityLogs 
    });
  };

  const handleUpdateMeeting = (updatedMeeting, documents = []) => {
    const oldMeeting = meetings.find(m => m.id === updatedMeeting.id);
    const hasNotulenChanged = oldMeeting && oldMeeting.keterangan !== updatedMeeting.keterangan;
    
    const schedLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: activeUser.id,
      timestamp: new Date().toISOString(),
      actionType: hasNotulenChanged ? 'update_meeting_notulen' : 'update_meeting',
      description: hasNotulenChanged 
        ? `Mengisi/memperbarui notulen rapat: "${updatedMeeting.judul}"`
        : `Memperbarui agenda rapat: "${updatedMeeting.judul}"`,
      fileRef: null
    };

    const updatedMeetings = meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m));
    setMeetings(updatedMeetings);
    localStorage.setItem('revit_meetings', JSON.stringify(updatedMeetings));

    let updatedDocs = meetingDocs.filter(d => d.meetingId !== updatedMeeting.id);
    if (documents && documents.length > 0) {
      const docsWithId = documents.map(d => ({ ...d, meetingId: updatedMeeting.id }));
      updatedDocs = [...updatedDocs, ...docsWithId];
    }
    setMeetingDocs(updatedDocs);
    localStorage.setItem('revit_meeting_docs', JSON.stringify(updatedDocs));

    const updatedLogs = syncMeetingLogs(updatedMeetings, logs);
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const nextActivityLogsWithSched = [schedLog, ...activityLogs];
    const updatedActivityLogs = syncMeetingActivityLogs(updatedMeetings, nextActivityLogsWithSched);
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ 
      meetings: updatedMeetings, 
      meetingDocs: updatedDocs,
      logs: updatedLogs, 
      activityLogs: updatedActivityLogs 
    });
  };

  const handleDeleteMeeting = (meetingId) => {
    const oldMeeting = meetings.find(m => m.id === meetingId);
    let schedLog = null;
    if (oldMeeting) {
      schedLog = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: activeUser.id,
        timestamp: new Date().toISOString(),
        actionType: 'delete_meeting',
        description: `Menghapus agenda rapat: "${oldMeeting.judul}"`,
        fileRef: null
      };
    }

    const updatedMeetings = meetings.filter((m) => m.id !== meetingId);
    setMeetings(updatedMeetings);
    localStorage.setItem('revit_meetings', JSON.stringify(updatedMeetings));

    const updatedDocs = meetingDocs.filter(d => d.meetingId !== meetingId);
    setMeetingDocs(updatedDocs);
    localStorage.setItem('revit_meeting_docs', JSON.stringify(updatedDocs));

    const updatedLogs = syncMeetingLogs(updatedMeetings, logs);
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const nextActivityLogsWithSched = schedLog ? [schedLog, ...activityLogs] : activityLogs;
    const updatedActivityLogs = syncMeetingActivityLogs(updatedMeetings, nextActivityLogsWithSched);
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ 
      meetings: updatedMeetings, 
      meetingDocs: updatedDocs,
      logs: updatedLogs, 
      activityLogs: updatedActivityLogs 
    });
  };

  const addActivityLog = (actionType, description, fileRef = null) => {
    if (!activeUser) return;

    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: activeUser.id,
      timestamp: new Date().toISOString(),
      actionType,
      description,
      fileRef
    };

    setActivityLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem('revit_activity_logs', JSON.stringify(updated));
      syncWithNewState({ activityLogs: updated });
      return updated;
    });
  };

  const handleAddManualActivityLog = (description, fileRef = null) => {
    addActivityLog('manual_log', description, fileRef);
    
    // Also save to daily logs so it appears in Jurnal Aktivitas Lapangan
    const newLog = {
      id: `log-${activeUser.id}-${Date.now()}`,
      userId: activeUser.id,
      tanggal: new Date().toISOString().split('T')[0],
      aktivitas: description,
      foto: fileRef && fileRef.fileData ? fileRef.fileData : '',
      createdAt: new Date().toISOString()
    };
    const updated = [...logs, newLog];
    setLogs(updated);
    localStorage.setItem('revit_logs', JSON.stringify(updated));
    syncWithNewState({ logs: updated });
  };

  const handleOpenActivityFile = (fileRef) => {
    if (!fileRef || !fileRef.fileData) return;
    try {
      if (fileRef.fileData.startsWith('http')) {
        window.open(fileRef.fileData, '_blank');
        return;
      }
      
      const parts = fileRef.fileData.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      
      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error(err);
      window.showAlert('Gagal membuka file.');
    }
  };

  const getFilteredActivityLogs = () => {
    if (!activeUser) return [];
    const role = activeUser.jabatanTim;
    
    // Fasilitator and Tenaga Administrasi can only see their own logs
    if (role === 'Fasilitator' || role === 'Tenaga Administrasi') {
      return activityLogs.filter((l) => l && l.userId === activeUser.id);
    }
    
    return activityLogs.filter((log) => {
      if (!log) return false;
      // Active user can always see their own logs
      if (log.userId === activeUser.id) return true;
      
      // Find log author's role
      const author = users.find((u) => u.id === log.userId) || initialUsers.find((u) => u.id === log.userId);
      const authorRole = author ? author.jabatanTim : '';
      
      if (role === 'Super Admin') {
        return true;
      }
      if (role === 'Ketua Tim') {
        // Ketua Tim sees other Ketua Tim, Koordinator, Fasilitator, Tenaga Administrasi (no Super Admin)
        return authorRole !== 'Super Admin';
      }
      if (role === 'Koordinator') {
        // Koordinator sees other Koordinator, Fasilitator, Tenaga Administrasi (no Super Admin, no Ketua Tim)
        return authorRole !== 'Super Admin' && authorRole !== 'Ketua Tim';
      }
      return false;
    });
  };

  // RENDER: Main Dashboard Layout
  return (
    <>
      <div className="flex bg-slate-950 min-h-screen text-slate-100 font-['Outfit',sans-serif]">
        {/* Sidebar Navigation */}
        {activeUser && (
          <Sidebar
            activeUser={activeUser}
            activeView={activeView}
            onViewChange={handleViewChange}
            onEditProfile={() => setIsEditingProfile(true)}
            onManageDocuments={() => setPersonnelDocsUser(activeUser)}
            onLogout={handleLogout}
          />
        )}

        {/* Main View Area */}
        <main className={`${activeUser ? 'flex-1' : 'w-full'} min-h-screen overflow-y-auto bg-slate-950/20`}>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-900 pb-5 select-none">
            <div>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-400">
                Sistem Informasi Revitalisasi SD 2026
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                {activeView === 'dashboard' && 'Dashboard Utama'}
                {activeView === 'kelola-tim' && 'Manajemen Anggota Tim'}
                {activeView === 'sekolah' && 'Kelola Sekolah'}
                {activeView === 'kontak' && 'Manajemen Kontak Mitra Lapangan'}
                {activeView === 'dinas' && 'Jadwal Perjalanan Dinas'}
                {activeView === 'tanggung-jawab' && 'Pelaporan Tanggung Jawab Saya'}
                {activeView === 'laporan-bulanan' && 'Laporan Bulanan PDF'}
                {activeView === 'rapat' && (activeUser?.jabatanTim === 'Super Admin' ? 'Kelola Rapat Swakelola' : 'Agenda Rapat Swakelola')}
                {activeView === 'pantau-tanggung-jawab' && 'Pantau Tugas Tim'}
                {activeView === 'pantau-honor' && 'Pantau & Bayar Honorarium'}
                {activeView === 'bayar-honor' && 'Bayar Honorarium Tim'}
                {activeView === 'settings-anggaran' && 'Pengaturan Anggaran & Honorarium'}
                {activeView === 'keuangan' && 'Rekapitulasi Keuangan Proyek'}
                {activeView === 'kelola-fasilitator' && 'Kelola Tugas Fasilitator'}
                {activeView === 'batch-honor' && 'Pelunasan Batch Honorarium'}
                {activeView === 'logs-harian' && 'Log Harian Lapangan'}
              </h1>
            </div>
            
            {activeUser ? (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Indikator Sinkronisasi Google Sheets */}
                <button
                  onClick={() => triggerSync(null, true)}
                  disabled={syncStatus === 'connecting'}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                    syncStatus === 'connecting'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-wait'
                      : syncStatus === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      : syncStatus === 'error'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 hover:bg-rose-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                  }`}
                  title={
                    `URL Aktif: ${settings.googleAppsScriptUrl || 'Belum diatur'}\n` +
                    (syncStatus === 'error' && lastSyncTime 
                      ? `${lastSyncTime}. Klik untuk coba ulang.` 
                      : lastSyncTime 
                      ? `Terakhir sinkronisasi: ${lastSyncTime}. Klik untuk sinkronisasi ulang.` 
                      : 'Klik untuk sinkronisasi dengan Google Sheets')
                  }
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'connecting' ? 'animate-spin' : ''}`} />
                  <span>
                    {syncStatus === 'connecting' && 'Sinkronisasi...'}
                    {syncStatus === 'success' && `Tersambung (${lastSyncTime})`}
                    {syncStatus === 'error' && (lastSyncTime?.startsWith('Error:') ? lastSyncTime.substring(0, 60) : 'Gagal Sinkronisasi')}
                    {syncStatus === 'offline' && 'Mode Lokal'}
                  </span>
                </button>

                {activeUser && ['Fasilitator', 'Tenaga Administrasi', 'Koordinator', 'Ketua Tim', 'Super Admin'].includes(activeUser.jabatanTim) && (
                  <button
                    onClick={() => setIsActivitySidebarOpen(!isActivitySidebarOpen)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                      isActivitySidebarOpen
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-650/10'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750'
                    }`}
                    title="Buka/Tutup Log Aktivitas Kerja"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Log Aktivitas</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Sesi Aktif:</span>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {activeUser.nama}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSelectingUser(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold btn-enter-system text-white-keep flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-white-keep" />
                <span>Masuk ke Sistem</span>
              </button>
            )}
          </div>

          {/* Dynamic Component Rendering */}
          {activeView === 'dashboard' && (
            <Dashboard
              activeUser={activeUser}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              schools={schools}
              tasks={tasks}
              reports={reports}
              logs={logs}
              users={users}
              trips={trips}
              meetings={meetings}
              onApproveTrip={handleApproveTrip}
              onRejectTrip={handleRejectTrip}
              onApproveTripsBatch={handleApproveTripsBatch}
              onRejectTripsBatch={handleRejectTripsBatch}
              onSelectSchool={(npsn) => {
                setSelectedSchoolNpsn(npsn);
                setSchoolDetailReferrer('dashboard');
                setActiveView('sekolah');
              }}
              onViewChange={handleViewChange}
              onUpdateSchool={handleUpdateSchool}
              expenses={expenses}
              payments={payments}
              onDeleteLog={handleDeleteLog}
              onEditLog={handleEditLog}
            />
          )}

          {activeView === 'sekolah' && (
            selectedSchoolNpsn ? (
              <SchoolDetail
                school={schools.find((s) => s.npsn === selectedSchoolNpsn)}
                users={users}
                contacts={contacts}
                tasks={tasks}
                activeUser={activeUser}
                onBack={() => {
                  setSelectedSchoolNpsn(null);
                  if (schoolDetailReferrer === 'dashboard') {
                    setActiveView('dashboard');
                  }
                }}
                onUpdateSchool={handleUpdateSchool}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onDeleteTask={handleDeleteTask}
                onAddContact={handleAddContact}
                schoolDocs={schoolDocs}
                onAddSchoolDoc={handleAddSchoolDoc}
                onDeleteSchoolDoc={handleDeleteSchoolDoc}
              />
            ) : (
              <SchoolList
                schools={schools}
                users={users}
                activeUser={activeUser}
                onClaimSchool={handleClaimSchool}
                onAddSchool={handleAddSchool}
                onSelectSchool={(npsn) => {
                  setSelectedSchoolNpsn(npsn);
                  setSchoolDetailReferrer('sekolah');
                }}
                onUpdateSchool={handleUpdateSchool}
                tasks={tasks}
                schoolDocs={schoolDocs}
              />
            )
          )}

          {activeUser && (
            <>
              {activeView === 'kelola-tim' && (
                <TeamManagement
                  users={users}
                  activeUser={activeUser}
                  onAddUser={handleAddUser}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onManageDocuments={(user) => setPersonnelDocsUser(user)}
                  onManageReports={(user) => setMemberReportsUser(user)}
                  onManageLogs={(user) => setMemberLogsUser(user)}
                />
              )}

              {activeView === 'kelola-fasilitator' && (
                <FacilitatorManagement
                  users={users}
                  schools={schools}
                  onClaimSchool={handleClaimSchool}
                />
              )}

              {activeView === 'kontak' && (
                <ContactManagement
                  contacts={contacts}
                  onAddContact={handleAddContact}
                  onUpdateContact={handleUpdateContact}
                  onDeleteContact={handleDeleteContact}
                />
              )}

              {activeView === 'dinas' && (
                <TravelSchedule
                  schools={schools}
                  users={users}
                  activeUser={activeUser}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onUpdateUser={handleUpdateUser}
                  trips={trips}
                  tripDocs={tripDocs}
                  onAddTrip={handleAddTrip}
                  onApproveTrip={handleApproveTrip}
                  onRejectTrip={handleRejectTrip}
                  onApproveTripsBatch={handleApproveTripsBatch}
                  onRejectTripsBatch={handleRejectTripsBatch}
                  onUpdateTripsBatch={handleUpdateTripsBatch}
                  onDeleteTripsBatch={handleDeleteTripsBatch}
                  onUpdateTrip={handleUpdateTrip}
                  onDeleteTrip={handleDeleteTrip}
                  onAddTripDoc={handleAddTripDoc}
                  onDeleteTripDoc={handleDeleteTripDoc}
                />
              )}

              {activeView === 'laporan-bulanan' && (
                <MonthlyPdfReports
                  reports={reports}
                  users={users}
                  activeUser={activeUser}
                  onAddReport={handleAddReport}
                  onDeleteReport={handleDeleteReport}
                />
              )}

              {(activeView === 'tanggung-jawab' || activeView === 'pantau-tanggung-jawab') && (
                <DutyReports
                  users={users}
                  activeUser={activeUser}
                  dutyReports={dutyReports}
                  onSaveReport={handleSaveDutyReport}
                />
              )}

              {(activeView === 'pantau-honor' || activeView === 'keuangan' || activeView === 'bayar-honor' || activeView === 'settings-anggaran') && (
                <FinancialDashboard
                  users={users}
                  schools={schools}
                  reports={reports}
                  trips={trips}
                  expenses={expenses}
                  payments={payments}
                  activeUser={activeUser}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onAddPayment={handleAddPayment}
                  onPayTrip={handlePayTrip}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onUpdateUsers={handleUpdateUsers}
                  onUpdateSettingsAndUsers={handleUpdateSettingsAndUsers}
                  activeView={activeView}
                />
              )}

              {activeView === 'rapat' && (
                <MeetingManagement
                  meetings={meetings}
                  meetingDocs={meetingDocs}
                  users={users}
                  activeUser={activeUser}
                  onAddMeeting={handleAddMeeting}
                  onUpdateMeeting={handleUpdateMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                />
              )}

              {activeView === 'batch-honor' && (
                <HonorBatchSettings
                  users={users}
                  schools={schools}
                  reports={reports}
                  payments={payments}
                  settings={settings}
                  onSetPaymentsStatus={handleSetPaymentsStatus}
                />
              )}

              {activeView === 'logs-harian' && (
                <DailyLogs
                  logs={logs}
                  users={users}
                  activeUser={activeUser}
                  onAddLog={handleAddLog}
                  onDeleteLog={handleDeleteLog}
                  onEditLog={handleEditLog}
                />
              )}
            </>
          )}

        </div>
      </main>

      {/* User Selection Modal (Popup) */}
      {isSelectingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl relative">
            <UserSelect 
              users={users} 
              onSelectUser={(user) => {
                handleSelectUser(user);
                setIsSelectingUser(false);
              }} 
              onClose={() => setIsSelectingUser(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <ProfileModal
          user={activeUser}
          onClose={() => setIsEditingProfile(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Personnel Documents Modal */}
      {personnelDocsUser && (
        <PersonnelDocumentsModal
          user={personnelDocsUser}
          activeUser={activeUser}
          documents={personnelDocs.filter((d) => d.userId === personnelDocsUser.id)}
          onClose={() => setPersonnelDocsUser(null)}
          onAddDoc={handleAddPersonnelDoc}
          onDeleteDoc={handleDeletePersonnelDoc}
        />
      )}

      {/* Member Reports Modal */}
      {memberReportsUser && (
        <MemberReportsModal
          user={memberReportsUser}
          reports={reports.filter((r) => r.userId === memberReportsUser.id)}
          onClose={() => setMemberReportsUser(null)}
          onAddReport={handleAddReport}
          onDeleteReport={handleDeleteReport}
        />
      )}

      {/* Member Logs Modal */}
      {memberLogsUser && (
        <MemberLogsModal
          user={memberLogsUser}
          logs={logs.filter((l) => l.userId === memberLogsUser.id)}
          onClose={() => setMemberLogsUser(null)}
          onAddLog={handleAddLog}
          onDeleteLog={(logId) => {
            const updated = logs.filter(l => l.id !== logId);
            setLogs(updated);
            localStorage.setItem('revit_logs', JSON.stringify(updated));
            syncWithNewState({ logs: updated });
          }}
        />
      )}

      {/* Custom Global Dialog Modal */}
      {dialog && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="absolute inset-0" onClick={() => dialog.type === 'alert' && handleDialogConfirm()} />
          <div className="relative w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center items-center backdrop-blur-md">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              dialog.type === 'confirm' 
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
            }`}>
              {dialog.type === 'confirm' ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-base">
                {dialog.type === 'confirm' ? 'Konfirmasi Tindakan' : 'Informasi'}
              </h3>
              <p className="text-slate-305 text-xs leading-relaxed">
                {dialog.message}
              </p>
            </div>
            <div className="flex gap-2.5 w-full mt-2">
              {dialog.type === 'confirm' && (
                <button
                  onClick={handleDialogCancel}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border-0"
                >
                  Batal
                </button>
              )}
              <button
                onClick={handleDialogConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-650/10 border-0"
              >
                {dialog.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Syncing Overlay */}
      {isBlockingSync && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="relative w-full max-w-sm bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6 text-center items-center backdrop-blur-lg">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 relative">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-base uppercase tracking-wider">
                Sinkronisasi Data
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                Sedang menyelaraskan data dengan Google Sheets & Drive...
              </p>
              <p className="text-rose-450 text-[10px] font-bold mt-2 animate-pulse">
                Mohon jangan menutup atau merefresh browser sampai proses selesai.
              </p>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Right Activity Sidebar (For Facilitator, Tenaga Administrasi, Koordinator, Ketua Tim, Super Admin) */}
      {activeUser && ['Fasilitator', 'Tenaga Administrasi', 'Koordinator', 'Ketua Tim', 'Super Admin'].includes(activeUser.jabatanTim) && (
        <RightActivitySidebar
          isOpen={isActivitySidebarOpen}
          onClose={() => setIsActivitySidebarOpen(false)}
          logs={getFilteredActivityLogs()}
          onOpenFile={handleOpenActivityFile}
          onAddManualLog={handleAddManualActivityLog}
        />
      )}
    </>
  );
}
