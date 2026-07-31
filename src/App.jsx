import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, RefreshCw, LogIn, Activity, X, Check } from 'lucide-react';
import { initialUsers, initialPaudUsers } from './data/initialData';
import { initialSchools } from './data/initialSchools';
import { initialPaudSchools } from './data/initialPaudSchools';
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
import MigrationTool from './components/MigrationTool';
import { syncService } from './services/firebaseAdapter';
import ProgramPortal from './components/ProgramPortal';
import { googleSheetsService } from './services/googleSheetsService';

// Shadowing helper to dynamically prefix localStorage operations for multi-program isolation
const storageHelper = {
  getItem: (key) => {
    // List of allowed configuration keys we want to keep in localStorage
    const allowedKeys = [
      'settings', 'active_user', 'last_env_url', 'last_env_token', 'sidebar_collapsed', 'has_cleared_initial_sim'
    ];

    if (key.startsWith('revit_')) {
      const baseKey = key.substring(6);
      if (!allowedKeys.includes(baseKey)) {
        return null; // Bypass reading operational tables from localStorage
      }
      const prefix = window.localStorage.getItem('active_program_prefix') || 'revit';
      return window.localStorage.getItem(`${prefix}_${baseKey}`);
    }
    return window.localStorage.getItem(key);
  },
  setItem: (key, value) => {
    const allowedKeys = [
      'settings', 'active_user', 'last_env_url', 'last_env_token', 'sidebar_collapsed', 'has_cleared_initial_sim'
    ];

    if (key.startsWith('revit_')) {
      const baseKey = key.substring(6);
      if (!allowedKeys.includes(baseKey)) {
        return; // No-op: do not write operational/business data to localStorage
      }
      const prefix = window.localStorage.getItem('active_program_prefix') || 'revit';
      return window.localStorage.setItem(`${prefix}_${baseKey}`, value);
    }
    return window.localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (key.startsWith('revit_')) {
      const baseKey = key.substring(6);
      const prefix = window.localStorage.getItem('active_program_prefix') || 'revit';
      return window.localStorage.removeItem(`${prefix}_${baseKey}`);
    }
    return window.localStorage.removeItem(key);
  },
  key: (index) => window.localStorage.key(index),
  clear: () => window.localStorage.clear()
};
const localStorage = storageHelper;

const isValidId = (val) => val !== undefined && val !== null && String(val).trim() !== '';

const isInvalidSchoolName = (name, npsn) => {
  if (!name) return true;
  const cleaned = String(name).trim().toUpperCase();
  return cleaned === '' || cleaned === 'NPSN' || cleaned.startsWith('NPSN ') || cleaned === String(npsn).trim().toUpperCase() || cleaned === `NPSN${String(npsn).trim().toUpperCase()}`;
};

const parseSettings = (rawSettings) => {
  if (!rawSettings) return null;

  const cleanDateString = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }
    if (str.includes('T')) {
      const part = str.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
        return part;
      }
    }
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${date}`;
    } catch (e) {
      return '';
    }
  };

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
  const dateFields = ['projectStartDate', 'projectEndDate', 'simulatedToday'];
  const parsed = {};
  
  // Only copy keys that have truthy or non-empty string values, ignoring uninitialized cells (except simulatedToday)
  Object.keys(rawSettings).forEach(key => {
    const val = rawSettings[key];
    if (key === 'simulatedToday') {
      parsed[key] = val !== undefined && val !== null ? cleanDateString(val) : '';
    } else if (val !== undefined && val !== null && String(val).trim() !== '') {
      parsed[key] = val;
    }
  });

  // Clean date fields to YYYY-MM-DD
  dateFields.forEach(field => {
    if (parsed[field] !== undefined) {
      parsed[field] = cleanDateString(parsed[field]);
    }
  });

  // Helper to robustly parse currency strings or numbers from spreadsheet cells
  const parseNumber = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    // Remove Currency indicator "Rp", spaces
    let str = val.toString().replace(/[Rp\s]/gi, '');
    // Replace dots with empty if multiple dots (thousands separator)
    if ((str.match(/\./g) || []).length > 1) {
      str = str.replace(/\./g, '');
    } else if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else if (str.includes(',')) {
      if ((str.match(/,/g) || []).length > 1) {
        str = str.replace(/,/g, '');
      } else {
        const parts = str.split(',');
        if (parts[1].length <= 2) {
          str = parts[0] + '.' + parts[1];
        } else {
          str = str.replace(/,/g, '');
        }
      }
    } else if (str.includes('.')) {
      const parts = str.split('.');
      if (parts[1].length === 3) {
        str = str.replace(/\./g, '');
      }
    }
    const num = Number(str);
    return isNaN(num) ? 0 : num;
  };

  numFields.forEach(field => {
    if (parsed[field] !== undefined) {
      parsed[field] = parseNumber(parsed[field]);
    }
  });

  return parsed;
};

const DEFAULT_DIRTY_TABLES = {
  settings: false,
  users: false,
  schools: false,
  contacts: false,
  tasks: false,
  trips: false,
  logs: false,
  reports: false,
  duty_reports: false,
  expenses: false,
  payments: false,
  school_docs: false,
  personnel_docs: false,
  meeting_docs: false,
  trip_docs: false,
  meetings: false,
  activity_logs: false,
  kendala: false,
  kendala_comments: false,
  kendala_docs: false,
  warnings: false
};

const getLocalDirtyTables = (initAllTrue = false) => {
  // PENTING: Gunakan window.localStorage langsung (bukan storageHelper/alias localStorage)
  // karena storageHelper memblokir key 'revit_dirty_tables' (tidak ada di allowedKeys),
  // sehingga dirty table tracking tidak pernah tersimpan → semua tabel selalu dianggap 'bersih' → data tidak di-push ke Firestore.
  const stored = window.localStorage.getItem('revit_dirty_tables');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // Fallback
    }
  }
  const initial = {};
  Object.keys(DEFAULT_DIRTY_TABLES).forEach(key => {
    initial[key] = initAllTrue;
  });
  return initial;
};

const setLocalDirtyTables = (dirty) => {
  // PENTING: Gunakan window.localStorage langsung agar tidak diblokir storageHelper.
  window.localStorage.setItem('revit_dirty_tables', JSON.stringify(dirty));
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
  const [meetingPhotos, setMeetingPhotos] = useState([]);
  const [tripDocs, setTripDocs] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(false);

  // Phase 5 States (Laporkan Kendala)
  const [kendala, setKendala] = useState([]);
  const [kendalaComments, setKendalaComments] = useState([]);
  const [kendalaDocs, setKendalaDocs] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [activeSchoolTab, setActiveSchoolTab] = useState('profile');

  // Session & Nav States
  const [globalActiveUser, setGlobalActiveUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('global_active_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeProgram, setActiveProgram] = useState(() => {
    const programId = window.localStorage.getItem('active_program_id');
    const programPrefix = window.localStorage.getItem('active_program_prefix');
    if (programId && programPrefix) {
      return { 
        id: programId, 
        prefix: programPrefix,
        name: programId === 'revitsd2026' ? 'Revitalisasi Sekolah Dasar 2026' : 'Revitalisasi PAUD 2026'
      };
    }
    return null;
  });

  const [activeUser, setActiveUser] = useState(null);

  const [portalSdUsers, setPortalSdUsers] = useState(() => {
    try {
      const stored = window.localStorage.getItem('revit_users');
      return stored ? JSON.parse(stored) : initialUsers;
    } catch (e) {
      return initialUsers;
    }
  });

  const [portalPaudUsers, setPortalPaudUsers] = useState(() => {
    try {
      const stored = window.localStorage.getItem('revitpaud_users');
      return stored ? JSON.parse(stored) : initialPaudUsers;
    } catch (e) {
      return initialPaudUsers;
    }
  });

  const [portalSdSettings, setPortalSdSettings] = useState(() => {
    try {
      const stored = window.localStorage.getItem('revit_settings');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  const [portalPaudSettings, setPortalPaudSettings] = useState(() => {
    try {
      const stored = window.localStorage.getItem('revitpaud_settings');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (activeProgram) {
      document.title = `Monitoring ${activeProgram.name}`;
    } else {
      document.title = "Portal Monitoring Revitalisasi";
    }
  }, [activeProgram]);

  // Background fetch users on portal login mount — menggunakan Firebase Firestore
  useEffect(() => {
    if (globalActiveUser && activeProgram) return;

    const fetchPortalUsers = async () => {
      // 1. Fetch SD Users dari Firebase
      try {
        const { fetchAllData: fetchFirestore } = await import('./services/firestoreService');
        const sdData = await fetchFirestore('revitsd2026');
        if (sdData.users && sdData.users.length > 0) {
          const clean = sdData.users.filter(u => u && u.id).map(u => ({
            ...u,
            password: u.password !== undefined && u.password !== null ? String(u.password).trim() : '',
            taxPct: (u.taxPct === undefined || u.taxPct === null || String(u.taxPct).trim() === '') ? null : Number(u.taxPct)
          }));
          if (clean.length > 0) {
            window.localStorage.setItem('revit_users', JSON.stringify(clean));
            setPortalSdUsers(clean);
          }
        }
        if (sdData.settings && Object.keys(sdData.settings).length > 0) {
          const currentSettings = window.localStorage.getItem('revit_settings');
          const parsedCurrent = currentSettings ? JSON.parse(currentSettings) : {};
          const merged = { ...parsedCurrent, ...sdData.settings };
          window.localStorage.setItem('revit_settings', JSON.stringify(merged));
          setPortalSdSettings(merged);
        }
      } catch (err) {
        console.warn('[Portal Sync] Gagal memuat user SD dari Firebase:', err);
      }

      // 2. Fetch PAUD Users dari Firebase
      try {
        const { fetchAllData: fetchFirestore } = await import('./services/firestoreService');
        const paudData = await fetchFirestore('revitpaud2026');
        if (paudData.users && paudData.users.length > 0) {
          const clean = paudData.users.filter(u => u && u.id).map(u => ({
            ...u,
            password: u.password !== undefined && u.password !== null ? String(u.password).trim() : '',
            taxPct: (u.taxPct === undefined || u.taxPct === null || String(u.taxPct).trim() === '') ? null : Number(u.taxPct)
          }));
          if (clean.length > 0) {
            window.localStorage.setItem('revitpaud_users', JSON.stringify(clean));
            setPortalPaudUsers(clean);
          }
        }
        if (paudData.settings && Object.keys(paudData.settings).length > 0) {
          const currentSettings = window.localStorage.getItem('revitpaud_settings');
          const parsedCurrent = currentSettings ? JSON.parse(currentSettings) : {};
          const merged = { ...parsedCurrent, ...paudData.settings };
          window.localStorage.setItem('revitpaud_settings', JSON.stringify(merged));
          setPortalPaudSettings(merged);
        }
      } catch (err) {
        console.warn('[Portal Sync] Gagal memuat user PAUD dari Firebase:', err);
      }
    };

    fetchPortalUsers();
  }, [globalActiveUser, activeProgram]);

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
    try {
      // Gunakan window.localStorage langsung — storageHelper memblokir key ini
      return window.localStorage.getItem('revit_is_dirty') === 'true';
    } catch (e) {
      console.warn('Failed to read revit_is_dirty from localStorage:', e);
      return false;
    }
  });
  const pendingSyncUpdatesRef = useRef({});
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (syncStatus === 'connecting') {
      setSyncProgress(0);
      interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 95) return prev;
          if (prev < 40) return prev + 10;
          if (prev < 75) return prev + 5;
          return prev + 1;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [syncStatus]);

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
  const dismissTimeoutRef = React.useRef(null);

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
      meetingPhotos,
      tripDocs,
      activityLogs,
      kendala,
      kendalaComments,
      kendalaDocs,
      warnings,
      settings
    };
  }, [users, schools, contacts, tasks, trips, logs, reports, dutyReports, expenses, payments, schoolDocs, personnelDocs, meetings, meetingDocs, meetingPhotos, tripDocs, activityLogs, kendala, kendalaComments, kendalaDocs, warnings, weeklyProgress, settings]);

  // NOTE: useEffect sinkronisasi manual_log → daily logs telah DIHAPUS.
  // useEffect tersebut menyebabkan bug di mana log harian yang dihapus langsung dibuat ulang
  // karena ia mendeteksi entry 'manual_log' di activityLogs tanpa log harian yang cocok,
  // lalu membuatnya kembali. Fungsi handleAddManualActivityLog sudah membuat kedua entri
  // (activity log + daily log) secara bersamaan, sehingga useEffect tersebut tidak diperlukan.
  useEffect(() => {
    if (!activeProgram) return;
    const activePrefix = window.localStorage.getItem('active_program_prefix') || 'revit';
    const referenceUsers = activePrefix === 'revitpaud' ? initialPaudUsers : initialUsers;
    const referenceSchools = activePrefix === 'revitpaud' ? initialPaudSchools : initialSchools;

    // Initialize all operational states with their default values
    setUsers(referenceUsers);
    setSchools(referenceSchools);
    setContacts([]);
    setTasks([]);
    setTrips([]);
    setLogs([]);
    setReports([]);
    setDutyReports([]);
    setExpenses([]);
    setPayments([]);
    setSchoolDocs([]);
    setPersonnelDocs([]);
    setMeetings([]);
    setMeetingDocs([]);
    setMeetingPhotos([]);
    setTripDocs([]);
    setActivityLogs([]);
    setKendala([]);
    setKendalaComments([]);
    setKendalaDocs([]);
    setWarnings([]);
    setWeeklyProgress([]);

    // Clear operational data from localStorage to free space and prevent local cache reliance
    const keysToClear = [
      'revit_users', 'revit_schools', 'revit_contacts', 'revit_tasks', 'revit_trips',
      'revit_logs', 'revit_reports', 'revit_duty_reports', 'revit_expenses', 'revit_payments',
      'revit_school_docs', 'revit_personnel_docs', 'revit_meetings', 'revit_meeting_docs',
      'revit_meeting_photos', 'revit_trip_docs', 'revit_activity_logs', 'revit_kendala',
      'revit_kendala_comments', 'revit_kendala_docs', 'revit_warnings', 'revit_weekly_progress', 'revit_is_dirty'
    ];
    keysToClear.forEach(key => localStorage.removeItem(key));


    // Diagnostics
    console.log("=== SINKRONISASI DIAGNOSTIC ===");
    console.log("1. .env URL:", import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL);
    console.log("2. .env Token:", import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN);
    console.log("3. localStorage revit_last_env_url:", localStorage.getItem('revit_last_env_url'));
    console.log("4. localStorage revit_settings:", localStorage.getItem('revit_settings'));

    // One-time migration to clear active date simulation and restore real date
    const hasClearedInitialSim = localStorage.getItem('revit_has_cleared_initial_sim');
    if (!hasClearedInitialSim) {
      const storedSettingsRaw = localStorage.getItem('revit_settings');
      if (storedSettingsRaw) {
        try {
          const parsed = JSON.parse(storedSettingsRaw);
          if (parsed && parsed.simulatedToday) {
            parsed.simulatedToday = '';
            localStorage.setItem('revit_settings', JSON.stringify(parsed));
            window.localStorage.setItem('revit_is_dirty', 'true');
          }
        } catch (e) {
          console.error('[Migration] Failed to clear simulatedToday:', e);
        }
      }
      localStorage.setItem('revit_has_cleared_initial_sim', 'true');
    }

    // Settings
    const storedSettings = localStorage.getItem('revit_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed.projectStartDate === '2027-06-12') parsed.projectStartDate = '2026-06-12';
        if (parsed.projectEndDate === '2027-12-12') parsed.projectEndDate = '2026-12-12';
        // Keep simulatedToday from settings ter-parse if exists to allow simulated dates to persist

        // Deteksi jika VITE_GOOGLE_APPS_SCRIPT_URL/Token di .env berubah, kita timpa data di localStorage
        // agar developer tidak terjebak dengan cache URL/token lama di localStorage saat memodifikasi file .env.
        // Pengecualian untuk PAUD yang tidak ditimpa oleh VITE_GOOGLE_APPS_SCRIPT_URL dari SD.
        const envUrl = activePrefix === 'revitpaud' ? '' : (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '');
        const envToken = activePrefix === 'revitpaud' ? 'REVITPAUD2026_SECURE_TOKEN' : (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'REVITSD2026_SECURE_TOKEN');

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

        const defaultContract = activePrefix === 'revitpaud' ? 800000000 : 1500000000;
        const defaultHonorKetuaTim = activePrefix === 'revitpaud' ? 6000000 : 7000000;
        const defaultHonorKoor = activePrefix === 'revitpaud' ? 5000000 : 6000000;
        const defaultHonorFas = activePrefix === 'revitpaud' ? 4000000 : 5000000;
        const defaultHonorAdm = activePrefix === 'revitpaud' ? 4000000 : 5000000;
        const defaultTax = activePrefix === 'revitpaud' ? 10 : 15;
        const defaultLembaga = activePrefix === 'revitpaud' ? 5 : 10;

        setSettings(prev => ({ 
          projectStartDate: '2026-06-12',
          projectEndDate: '2026-12-12',
          googleAppsScriptUrl: finalUrl,
          googleAppsScriptToken: finalToken,
          totalProjectContract: defaultContract,
          honorKetuaTim: defaultHonorKetuaTim,
          honorKoordinator: defaultHonorKoor,
          honorFasilitator: defaultHonorFas,
          honorAdministrasi: defaultHonorAdm,
          deductionTaxPct: defaultTax,
          deductionLembagaPct: defaultLembaga,
          biayaOperasional: 0,
          ...parsed 
        }));
      } catch (e) {
        console.error("Failed to parse settings:", e);
        const envUrl = activePrefix === 'revitpaud' ? '' : (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '');
        const envToken = activePrefix === 'revitpaud' ? 'REVITPAUD2026_SECURE_TOKEN' : (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'REVITSD2026_SECURE_TOKEN');
        localStorage.setItem('revit_last_env_url', envUrl);
        localStorage.setItem('revit_last_env_token', envToken);
        localStorage.setItem('revit_settings', JSON.stringify({
          projectStartDate: '2026-06-12',
          projectEndDate: '2026-12-12',
          googleAppsScriptUrl: envUrl,
          googleAppsScriptToken: envToken,
          totalProjectContract: activePrefix === 'revitpaud' ? 800000000 : 1500000000,
          honorKetuaTim: activePrefix === 'revitpaud' ? 6000000 : 7000000,
          honorKoordinator: activePrefix === 'revitpaud' ? 5000000 : 6000000,
          honorFasilitator: activePrefix === 'revitpaud' ? 4000000 : 5000000,
          honorAdministrasi: activePrefix === 'revitpaud' ? 4000000 : 5000000,
          deductionTaxPct: activePrefix === 'revitpaud' ? 10 : 15,
          deductionLembagaPct: activePrefix === 'revitpaud' ? 5 : 10,
          biayaOperasional: 0
        }));
      }
    } else {
      const envUrl = activePrefix === 'revitpaud' ? '' : (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '');
      const envToken = activePrefix === 'revitpaud' ? 'REVITPAUD2026_SECURE_TOKEN' : (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'REVITSD2026_SECURE_TOKEN');
      localStorage.setItem('revit_last_env_url', envUrl);
      localStorage.setItem('revit_last_env_token', envToken);
      localStorage.setItem('revit_settings', JSON.stringify({
        projectStartDate: '2026-06-12',
        projectEndDate: '2026-12-12',
        googleAppsScriptUrl: envUrl,
        googleAppsScriptToken: envToken,
        totalProjectContract: activePrefix === 'revitpaud' ? 800000000 : 1500000000,
        honorKetuaTim: activePrefix === 'revitpaud' ? 6000000 : 7000000,
        honorKoordinator: activePrefix === 'revitpaud' ? 5000000 : 6000000,
        honorFasilitator: activePrefix === 'revitpaud' ? 4000000 : 5000000,
        honorAdministrasi: activePrefix === 'revitpaud' ? 4000000 : 5000000,
        deductionTaxPct: activePrefix === 'revitpaud' ? 10 : 15,
        deductionLembagaPct: activePrefix === 'revitpaud' ? 5 : 10,
        biayaOperasional: 0
      }));
    }

    const getStateFromLocalStorage = () => {
      const parseOrFallback = (key, fallback) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : fallback;
        } catch (e) {
          console.warn(`Failed to parse ${key} from localStorage:`, e);
          return fallback;
        }
      };

      return {
        users: parseOrFallback('revit_users', []),
        schools: parseOrFallback('revit_schools', []),
        contacts: parseOrFallback('revit_contacts', []),
        tasks: parseOrFallback('revit_tasks', []),
        trips: parseOrFallback('revit_trips', []),
        logs: parseOrFallback('revit_logs', []),
        reports: parseOrFallback('revit_reports', []),
        dutyReports: parseOrFallback('revit_duty_reports', []),
        expenses: parseOrFallback('revit_expenses', []),
        payments: parseOrFallback('revit_payments', []),
        schoolDocs: parseOrFallback('revit_school_docs', []),
        personnelDocs: parseOrFallback('revit_personnel_docs', []),
        meetings: parseOrFallback('revit_meetings', []),
        meetingDocs: parseOrFallback('revit_meeting_docs', []),
        meetingPhotos: parseOrFallback('revit_meeting_photos', []),
        tripDocs: parseOrFallback('revit_trip_docs', []),
        activityLogs: parseOrFallback('revit_activity_logs', []),
        kendala: parseOrFallback('revit_kendala', []),
        kendalaComments: parseOrFallback('revit_kendala_comments', []),
        kendalaDocs: parseOrFallback('revit_kendala_docs', []),
        warnings: parseOrFallback('revit_warnings', []),
        settings: parseOrFallback('revit_settings', {})
      };
    };

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
              password: u.password !== undefined && u.password !== null ? String(u.password).trim() : '',
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
                npsn: String(s.npsn).trim(),
                alamat: s.alamat || '',
                progres_fisik: (s.progres_fisik === undefined || s.progres_fisik === null || String(s.progres_fisik).trim() === '') ? 0 : Number(s.progres_fisik)
              };
              if (updated.nama && isInvalidSchoolName(updated.nama_sekolah, updated.npsn) && !isInvalidSchoolName(updated.nama, updated.npsn)) {
                updated.nama_sekolah = updated.nama;
              }
              if (updated.kepalaSekolah && (!updated.kepala_sekolah || String(updated.kepala_sekolah).trim() === '')) {
                updated.kepala_sekolah = updated.kepalaSekolah;
              }
              
              const init = initialSchools.find(x => String(x.npsn) === updated.npsn);
              if (init) {
                if (isInvalidSchoolName(updated.nama_sekolah, updated.npsn)) {
                  updated.nama_sekolah = init.nama_sekolah;
                }
                if (init.kepala_sekolah && (!updated.kepala_sekolah || String(updated.kepala_sekolah).trim() === '')) {
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
            const clean = remoteData.tasks.filter(t => t && isValidId(t.id)).map(t => {
              const sId = String(t.sekolahId || t.schoolId || '').trim();
              return {
                ...t,
                sekolahId: sId,
                schoolId: sId
              };
            });
            setTasks(clean);
            localStorage.setItem('revit_tasks', JSON.stringify(clean));
          }
          if (remoteData.trips) {
            const clean = remoteData.trips.filter(t => t && isValidId(t.id)).map(t => {
              const normalized = { ...t };
              const sId = String(normalized.sekolahId || normalized.schoolId || '').trim();
              normalized.sekolahId = sId;
              normalized.schoolId = sId;
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
            const clean = remoteData.logs.filter(l => l && isValidId(l.id)).map(l => {
              const sId = String(l.sekolahId || l.schoolId || '').trim();
              return {
                ...l,
                sekolahId: sId,
                schoolId: sId
              };
            });
            setLogs(clean);
            localStorage.setItem('revit_logs', JSON.stringify(clean));
          }
          if (remoteData.reports) {
            const clean = remoteData.reports.filter(r => r && isValidId(r.id)).map(r => {
              const sId = String(r.sekolahId || r.schoolId || '').trim();
              return {
                ...r,
                sekolahId: sId,
                schoolId: sId,
                status: r.status || 'pending',
                note: r.note || ''
              };
            });
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
            const clean = remoteData.school_docs.filter(d => d && isValidId(d.id)).map(d => {
              const sId = String(d.sekolahId || d.schoolNpsn || d.schoolId || '').trim();
              return {
                ...d,
                sekolahId: sId,
                schoolId: sId,
                fileName: d.fileName || d.name || '',
              };
            });
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

          }
          if (remoteData.meeting_docs) {
            const cleanDocs = remoteData.meeting_docs.filter(d => d && isValidId(d.id));
            setMeetingDocs(cleanDocs);
            localStorage.setItem('revit_meeting_docs', JSON.stringify(cleanDocs));
          }
          if (remoteData.meeting_photos) {
            const cleanPhotos = remoteData.meeting_photos.filter(p => p && isValidId(p.id));
            setMeetingPhotos(cleanPhotos);
            localStorage.setItem('revit_meeting_photos', JSON.stringify(cleanPhotos));
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
              if (l.fileRef_id) {
                l.fileRef = {
                  id: l.fileRef_id,
                  type: l.fileRef_type || '',
                  fileName: l.fileRef_fileName || '',
                  fileData: l.fileRef_fileData || ''
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
          
          if (remoteData.kendala) {
            const clean = remoteData.kendala.filter(k => k && isValidId(k.id)).map(k => ({
              ...k,
              schoolId: k.schoolId ? String(k.schoolId).trim() : ''
            }));
            setKendala(clean);
            localStorage.setItem('revit_kendala', JSON.stringify(clean));
          }
          if (remoteData.kendala_comments) {
            const clean = remoteData.kendala_comments.filter(c => c && isValidId(c.id));
            setKendalaComments(clean);
            localStorage.setItem('revit_kendala_comments', JSON.stringify(clean));
          }
          if (remoteData.kendala_docs) {
            const clean = remoteData.kendala_docs.filter(d => d && isValidId(d.id));
            setKendalaDocs(clean);
            localStorage.setItem('revit_kendala_docs', JSON.stringify(clean));
          }
          if (remoteData.warnings) {
            const clean = remoteData.warnings.filter(w => w && isValidId(w.id)).map(w => ({
              ...w,
              schoolId: w.schoolId ? String(w.schoolId).trim() : '',
              dismissed: w.dismissed === true || w.dismissed === 'true'
            }));
            setWarnings(clean);
            localStorage.setItem('revit_warnings', JSON.stringify(clean));
          }
          if (remoteData.weekly_progress) {
            const clean = remoteData.weekly_progress.filter(w => w && isValidId(w.id)).map(w => ({
              ...w,
              schoolId: String(w.schoolId || w.sekolahId || '').trim(),
              minggu: Number(w.minggu || 1),
              bulan: Number(w.bulan || Math.ceil((w.minggu || 1) / 4)),
              realisasi: Number(w.realisasi || 0),
              kumulatif: Number(w.kumulatif || 0),
              rencana: Number(w.rencana || 0),
              deviasi: Number(w.deviasi || 0)
            }));
            setWeeklyProgress(clean);
            localStorage.setItem('revit_weekly_progress', JSON.stringify(clean));
          }

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
          setSyncProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 500));
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
    if (storedActiveUser) {
      try {
        setActiveUser(JSON.parse(storedActiveUser));
      } catch (e) {
        console.error("Failed to parse stored active user:", e);
        setActiveUser(null);
      }
    }

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
  }, [activeProgram]);

  const handleViewChange = (viewId) => {
    if (!activeUser && viewId !== 'dashboard' && viewId !== 'sekolah') {
      if (window.showAlert) {
        window.showAlert('Silakan masuk ke sistem terlebih dahulu untuk mengakses menu atau detail kegiatan ini.');
      } else {
        alert('Silakan masuk ke sistem terlebih dahulu untuk mengakses menu atau detail kegiatan ini.');
      }
      setIsSelectingUser(true);
      return;
    }
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

  const handleSwitchProgram = () => {
    window.localStorage.removeItem('active_program_id');
    window.localStorage.removeItem('active_program_prefix');
    window.location.reload();
  };

  const handleLogout = () => {
    setActiveUser(null);
    setGlobalActiveUser(null);
    const prefix = window.localStorage.getItem('active_program_prefix') || 'revit';
    
    // Hapus hanya key sesi aktif, BUKAN database lokal program
    window.localStorage.removeItem(`${prefix}_active_user`);
    window.localStorage.removeItem('global_active_user');
    window.localStorage.removeItem('active_program_id');
    window.localStorage.removeItem('active_program_prefix');
    
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
      const localDirty = window.localStorage.getItem('revit_is_dirty') === 'true'; // Gunakan window.localStorage — storageHelper memblokir key ini
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
        meetingPhotos,
        tripDocs,
        activityLogs,
        kendala,
        kendalaComments,
        kendalaDocs,
        warnings,
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
        window.localStorage.setItem('revit_is_dirty', 'false');
        setIsDirty(false);

        const dirtyTables = getLocalDirtyTables();

        try {
          await syncService.pushData(stateToPush, dirtyTables);
          setLocalDirtyTables(DEFAULT_DIRTY_TABLES);
        } catch (e) {
          // Jika push gagal, kembalikan status dirty agar dipush ulang di kesempatan berikutnya
          window.localStorage.setItem('revit_is_dirty', 'true');
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
        if (isManual) {
          setSyncProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
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
      if (window.localStorage.getItem('revit_is_dirty') === 'true') {
        console.warn('[Sync] Peringatan: State lokal berubah saat mengambil data dari server. Membatalkan update state untuk mencegah hilangnya data (data akan di-push di siklus berikutnya).');
        setSyncStatus('success');
        setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        if (isManual) {
          setSyncProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        setIsBlockingSync(false);
        isSyncingRef.current = false;
        
        // Panggil triggerSync lagi secara rekursif agar perubahan yang tertunda segera dipush
        setTimeout(() => triggerSync(latestStateRef.current, false), 1000);
        return;
      }

      if (remoteData.users) {
        const clean = remoteData.users.filter(u => u && isValidId(u.id)).map(u => ({
          ...u,
          password: u.password !== undefined && u.password !== null ? String(u.password).trim() : '',
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
            npsn: String(s.npsn).trim(),
            progres_fisik: (s.progres_fisik === undefined || s.progres_fisik === null || String(s.progres_fisik).trim() === '') ? 0 : Number(s.progres_fisik)
          };
          if (updated.nama && isInvalidSchoolName(updated.nama_sekolah, updated.npsn) && !isInvalidSchoolName(updated.nama, updated.npsn)) {
            updated.nama_sekolah = updated.nama;
          }
          if (updated.kepalaSekolah && (!updated.kepala_sekolah || String(updated.kepala_sekolah).trim() === '')) {
            updated.kepala_sekolah = updated.kepalaSekolah;
          }
          
          const init = initialSchools.find(x => String(x.npsn) === updated.npsn);
          if (init) {
            if (isInvalidSchoolName(updated.nama_sekolah, updated.npsn)) {
              updated.nama_sekolah = init.nama_sekolah;
            }
            if (init.kepala_sekolah && (!updated.kepala_sekolah || String(updated.kepala_sekolah).trim() === '')) {
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
        const clean = remoteData.tasks.filter(t => t && isValidId(t.id)).map(t => {
          const sId = String(t.sekolahId || t.schoolId || '').trim();
          return {
            ...t,
            sekolahId: sId,
            schoolId: sId
          };
        });
        setTasks(clean);
        localStorage.setItem('revit_tasks', JSON.stringify(clean));
      }
      if (remoteData.trips) {
        console.log('[DEBUG] Raw remoteData.trips:', remoteData.trips);
        const clean = remoteData.trips.filter(t => t && isValidId(t.id)).map(t => {
          // Normalize old schema to new schema to prevent data loss if Code.gs is outdated
          const normalized = { ...t };
          const sId = String(normalized.sekolahId || normalized.schoolId || '').trim();
          normalized.sekolahId = sId;
          normalized.schoolId = sId;
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
        const clean = remoteData.logs.filter(l => l && isValidId(l.id)).map(l => {
          const sId = String(l.sekolahId || l.schoolId || '').trim();
          return {
            ...l,
            sekolahId: sId,
            schoolId: sId
          };
        });
        setLogs(clean);
        localStorage.setItem('revit_logs', JSON.stringify(clean));
      }
      if (remoteData.reports) {
        const clean = remoteData.reports.filter(r => r && isValidId(r.id)).map(r => {
          const sId = String(r.sekolahId || r.schoolId || '').trim();
          return {
            ...r,
            sekolahId: sId,
            schoolId: sId,
            status: r.status || 'pending',
            note: r.note || ''
          };
        });
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
        const clean = remoteData.school_docs.filter(d => d && isValidId(d.id)).map(d => {
          const sId = String(d.sekolahId || d.schoolNpsn || d.schoolId || '').trim();
          return {
            ...d,
            sekolahId: sId,
            schoolId: sId,
            fileName: d.fileName || d.name || '',
          };
        });
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
      }
      if (remoteData.meeting_docs) {
        const cleanDocs = remoteData.meeting_docs.filter(d => d && isValidId(d.id));
        setMeetingDocs(cleanDocs);
        localStorage.setItem('revit_meeting_docs', JSON.stringify(cleanDocs));
      }
      if (remoteData.meeting_photos) {
        const cleanPhotos = remoteData.meeting_photos.filter(p => p && isValidId(p.id));
        setMeetingPhotos(cleanPhotos);
        localStorage.setItem('revit_meeting_photos', JSON.stringify(cleanPhotos));
      }

        const currentLogs = remoteData.logs ? remoteData.logs.filter(l => l && isValidId(l.id)) : logs;
        const updatedLogs = syncMeetingLogs(cleanMeetings, currentLogs);
        setLogs(updatedLogs);
        localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

      if (remoteData.trip_docs) {
        const clean = remoteData.trip_docs.filter(d => d && isValidId(d.id));
        setTripDocs(clean);
        localStorage.setItem('revit_trip_docs', JSON.stringify(clean));
      }

      let cleanActivityLogs = activityLogs;
      if (remoteData.activity_logs) {
        cleanActivityLogs = remoteData.activity_logs.filter(l => l && isValidId(l.id)).map(l => {
          if (l.fileRef_id) {
            l.fileRef = {
              id: l.fileRef_id,
              type: l.fileRef_type || '',
              fileName: l.fileRef_fileName || '',
              fileData: l.fileRef_fileData || ''
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

      if (remoteData.kendala) {
        const clean = remoteData.kendala.filter(k => k && isValidId(k.id)).map(k => ({
          ...k,
          schoolId: k.schoolId ? String(k.schoolId).trim() : ''
        }));
        setKendala(clean);
        localStorage.setItem('revit_kendala', JSON.stringify(clean));
      }
      if (remoteData.kendala_comments) {
        const clean = remoteData.kendala_comments.filter(c => c && isValidId(c.id));
        setKendalaComments(clean);
        localStorage.setItem('revit_kendala_comments', JSON.stringify(clean));
      }
      if (remoteData.kendala_docs) {
        const clean = remoteData.kendala_docs.filter(d => d && isValidId(d.id));
        setKendalaDocs(clean);
        localStorage.setItem('revit_kendala_docs', JSON.stringify(clean));
      }
      if (remoteData.warnings) {
        const clean = remoteData.warnings.filter(w => w && isValidId(w.id)).map(w => ({
          ...w,
          schoolId: w.schoolId ? String(w.schoolId).trim() : '',
          dismissed: w.dismissed === true || w.dismissed === 'true'
        }));
        setWarnings(clean);
        localStorage.setItem('revit_warnings', JSON.stringify(clean));
      }
      if (remoteData.weekly_progress) {
        const clean = remoteData.weekly_progress.filter(w => w && isValidId(w.id)).map(w => ({
          ...w,
          schoolId: String(w.schoolId || w.sekolahId || '').trim(),
          minggu: Number(w.minggu || 1),
          bulan: Number(w.bulan || Math.ceil((w.minggu || 1) / 4)),
          realisasi: Number(w.realisasi || 0),
          kumulatif: Number(w.kumulatif || 0),
          rencana: Number(w.rencana || 0),
          deviasi: Number(w.deviasi || 0)
        }));
        setWeeklyProgress(clean);
        localStorage.setItem('revit_weekly_progress', JSON.stringify(clean));
      }

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
      if (isManual) {
        setSyncProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
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
      if (window.showAlert) {
        window.showAlert(`Gagal menyimpan data ke Google Sheets: ${errMsg}. Silakan periksa koneksi internet Anda atau konfigurasi API di Pengaturan.`);
      }
    } finally {
      isSyncingRef.current = false;
      setIsBlockingSync(false);
    }
  };


  const syncWithNewState = (updatedStateKeys, isManual = true, shouldSyncNow = true) => {
    window.localStorage.setItem('revit_is_dirty', 'true'); // Gunakan window.localStorage — storageHelper memblokir key ini
    setIsDirty(true);
    
    // Tandai tabel kotor
    const dirty = getLocalDirtyTables();
    Object.keys(updatedStateKeys).forEach(key => {
      let tableName = key;
      if (key === 'dutyReports') tableName = 'duty_reports';
      if (key === 'schoolDocs') tableName = 'school_docs';
      if (key === 'personnelDocs') tableName = 'personnel_docs';
      if (key === 'meetingDocs') tableName = 'meeting_docs';
      if (key === 'meetingPhotos') tableName = 'meeting_photos';
      if (key === 'tripDocs') tableName = 'trip_docs';
      if (key === 'activityLogs') tableName = 'activity_logs';
      if (key === 'kendalaComments') tableName = 'kendala_comments';
      if (key === 'kendalaDocs') tableName = 'kendala_docs';
      
      if (tableName in DEFAULT_DIRTY_TABLES) {
        dirty[tableName] = true;
      }
    });
    setLocalDirtyTables(dirty);
    
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
      meetingPhotos,
      tripDocs,
      activityLogs,
      kendala,
      kendalaComments,
      kendalaDocs,
      warnings,
      settings,
      ...pendingSyncUpdatesRef.current
    };
    if (shouldSyncNow) {
      triggerSync(nextState, true); // Force isManual=true to show blocking overlay
    }
  };
  // Auto-seed welcome log on Facilitator login
  useEffect(() => {
    if (!activeProgram) return;
    if (activeUser && activeUser.jabatanTim === 'Fasilitator') {
      const userLogs = (activityLogs || []).filter(l => l.userId === activeUser.id);
      if (userLogs.length === 0 && syncStatus === 'success') {
        const welcomeLog = {
          id: `act-welcome-${activeUser.id}-${Date.now()}`,
          userId: activeUser.id,
          timestamp: new Date().toISOString(),
          actionType: 'system',
          description: `Masuk ke dalam Sistem Informasi ${activeProgram.name} sebagai ${activeUser.nama}`,
          fileRef: null
        };
        const updated = [welcomeLog, ...(activityLogs || [])];
        setActivityLogs(updated);
        syncWithNewState({ activityLogs: updated });
      }
    }
  }, [activeUser, activityLogs, syncStatus, activeProgram]);

  // 4. Update Settings (Super Admin)
  const handleUpdateSettings = (newSettings) => {
    const prevSettings = settings;
    const urlChanged = newSettings.googleAppsScriptUrl !== prevSettings.googleAppsScriptUrl ||
                       newSettings.googleAppsScriptToken !== prevSettings.googleAppsScriptToken;
    
    setSettings(newSettings);
    localStorage.setItem('revit_settings', JSON.stringify(newSettings));
    
    if (urlChanged) {
      // Tandai semua tabel sebagai kotor untuk full upload ke backend baru
      const allDirty = {};
      Object.keys(DEFAULT_DIRTY_TABLES).forEach(key => {
        allDirty[key] = true;
      });
      setLocalDirtyTables(allDirty);
      window.localStorage.setItem('revit_is_dirty', 'true');
      setIsDirty(true);
    }
    
    syncWithNewState({ settings: newSettings }, true, true);
  };

  const handleResetDatabase = async () => {
    if (!syncService.isConfigured()) {
      window.showAlert('API URL belum dikonfigurasi di Pengaturan. Silakan konfigurasi terlebih dahulu.');
      return;
    }
    const confirm1 = await window.showConfirm(
      'PERINGATAN KRITIS: Apakah Anda yakin ingin MERESET ULANG seluruh database Google Sheets dan Local Storage Anda kembali ke data default bawaan? Semua data transaksi, log harian, pengeluaran, perjalanan dinas, rapat, dan file yang diunggah akan DIHAPUS!'
    );
    if (!confirm1) return;

    const confirm2 = await window.showConfirm(
      'APAKAH ANDA SANGAT YAKIN? Tindakan ini TIDAK DAPAT DIBATALKAN. Data di Google Sheets akan ditulis ulang secara total.'
    );
    if (!confirm2) return;

    const activePrefix = window.localStorage.getItem('active_program_prefix') || 'revit';
    const referenceUsers = activePrefix === 'revitpaud' ? initialPaudUsers : initialUsers;
    const referenceSchools = activePrefix === 'revitpaud' ? initialPaudSchools : initialSchools;

    // Reset settings
    const resetSettings = {
      projectStartDate: '2026-06-12',
      projectEndDate: '2026-12-12',
      googleAppsScriptUrl: settings.googleAppsScriptUrl || '',
      googleAppsScriptToken: settings.googleAppsScriptToken || (activePrefix === 'revitpaud' ? 'REVITPAUD2026_SECURE_TOKEN' : 'REVITSD2026_SECURE_TOKEN'),
      totalProjectContract: activePrefix === 'revitpaud' ? 800000000 : 1500000000,
      honorKetuaTim: activePrefix === 'revitpaud' ? 6000000 : 7000000,
      honorKoordinator: activePrefix === 'revitpaud' ? 5000000 : 6000000,
      honorFasilitator: activePrefix === 'revitpaud' ? 4000000 : 5000000,
      honorAdministrasi: activePrefix === 'revitpaud' ? 4000000 : 5000000,
      deductionTaxPct: activePrefix === 'revitpaud' ? 10 : 15,
      deductionLembagaPct: activePrefix === 'revitpaud' ? 5 : 10,
      biayaOperasional: 0
    };

    // Update React State
    setUsers(referenceUsers);
    setSchools(referenceSchools);
    setContacts([]);
    setTasks([]);
    setTrips([]);
    setLogs([]);
    setReports([]);
    setDutyReports([]);
    setExpenses([]);
    setPayments([]);
    setSchoolDocs([]);
    setPersonnelDocs([]);
    setMeetings([]);
    setMeetingDocs([]);
    setMeetingPhotos([]);
    setTripDocs([]);
    setActivityLogs([]);
    setKendala([]);
    setKendalaComments([]);
    setKendalaDocs([]);
    setWarnings([]);
    setSettings(resetSettings);

    // Save to LocalStorage
    localStorage.setItem('revit_users', JSON.stringify(referenceUsers));
    localStorage.setItem('revit_schools', JSON.stringify(referenceSchools));
    localStorage.setItem('revit_contacts', JSON.stringify([]));
    localStorage.setItem('revit_tasks', JSON.stringify([]));
    localStorage.setItem('revit_trips', JSON.stringify([]));
    localStorage.setItem('revit_logs', JSON.stringify([]));
    localStorage.setItem('revit_reports', JSON.stringify([]));
    localStorage.setItem('revit_duty_reports', JSON.stringify([]));
    localStorage.setItem('revit_expenses', JSON.stringify([]));
    localStorage.setItem('revit_payments', JSON.stringify([]));
    localStorage.setItem('revit_school_docs', JSON.stringify([]));
    localStorage.setItem('revit_personnel_docs', JSON.stringify([]));
    localStorage.setItem('revit_meetings', JSON.stringify([]));
    localStorage.setItem('revit_meeting_docs', JSON.stringify([]));
    localStorage.setItem('revit_meeting_photos', JSON.stringify([]));
    localStorage.setItem('revit_trip_docs', JSON.stringify([]));
    localStorage.setItem('revit_activity_logs', JSON.stringify([]));
    localStorage.setItem('revit_kendala', JSON.stringify([]));
    localStorage.setItem('revit_kendala_comments', JSON.stringify([]));
    localStorage.setItem('revit_kendala_docs', JSON.stringify([]));
    localStorage.setItem('revit_warnings', JSON.stringify([]));
    localStorage.setItem('revit_settings', JSON.stringify(resetSettings));

    // Mark ALL tables as dirty
    const allDirty = {};
    Object.keys(DEFAULT_DIRTY_TABLES).forEach(key => {
      allDirty[key] = true;
    });
    setLocalDirtyTables(allDirty);
    window.localStorage.setItem('revit_is_dirty', 'true');
    setIsDirty(true);

    const nextState = {
      users: referenceUsers,
      schools: referenceSchools,
      contacts: [],
      tasks: [],
      trips: [],
      logs: [],
      reports: [],
      dutyReports: [],
      expenses: [],
      payments: [],
      schoolDocs: [],
      personnelDocs: [],
      meetings: [],
      meetingDocs: [],
      meetingPhotos: [],
      tripDocs: [],
      activityLogs: [],
      kendala: [],
      kendalaComments: [],
      kendalaDocs: [],
      warnings: [],
      settings: resetSettings
    };

    window.showAlert('Data lokal berhasil direset. Memulai pengunggahan perubahan ke Google Sheets...');
    try {
      await triggerSync(nextState, true);
      window.showAlert('Database Google Sheets dan penyimpanan lokal berhasil direset ke data awal default!');
    } catch (e) {
      window.showAlert('Gagal menyelaraskan reset dengan Google Sheets: ' + e.message);
    }
  };

  // 5. CRUD Team Members (Super Admin)
  const handleAddUser = (newUser) => {
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('revit_users', JSON.stringify(updated));
    syncWithNewState({ users: updated }, true, true);
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
    syncWithNewState({ users: updated }, true, true);
  };

  const handleUpdateUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('revit_users', JSON.stringify(updatedUsers));
    syncWithNewState({ users: updatedUsers }, true, true);
  };

  const handleUpdateSettingsAndUsers = (newSettings, updatedUsers) => {
    setSettings(newSettings);
    localStorage.setItem('revit_settings', JSON.stringify(newSettings));
    setUsers(updatedUsers);
    localStorage.setItem('revit_users', JSON.stringify(updatedUsers));
    syncWithNewState({ settings: newSettings, users: updatedUsers }, true, true);
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

  const handleCloseSchoolDetail = () => {
    setSelectedSchoolNpsn(null);
    setActiveSchoolTab('profile');
  };

  // 7. School Actions (Fase 2)
  const handleAddSchool = (newSchool) => {
    const updated = [...schools, newSchool];
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
    syncWithNewState({ schools: updated }, true, true);
  };

  const handleUpdateSchool = (updatedSchool) => {
    let updatedLogs = null;
    const oldSchool = schools.find((s) => s.npsn === updatedSchool.npsn);
    if (oldSchool && oldSchool.progres_fisik !== updatedSchool.progres_fisik) {
      updatedLogs = addActivityLog('update_progress', `Update progress sekolah ${updatedSchool.nama_sekolah} ke ${updatedSchool.progres_fisik}%`, null, false);
    }
    const updated = schools.map((s) => (s.npsn === updatedSchool.npsn ? updatedSchool : s));
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
    
    const syncState = { schools: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState, true, true);
  };

  const handleUpdateWeeklyProgress = (record) => {
    const schoolId = String(record.schoolId || '').trim();
    if (!schoolId) return;

    const existingSchoolRecords = weeklyProgress.filter(w => w.schoolId === schoolId && w.id !== record.id);
    const updatedRecord = {
      ...record,
      id: record.id || `wp-${schoolId}-m${record.minggu}`,
      schoolId: schoolId,
      minggu: Number(record.minggu || 1),
      bulan: Number(record.bulan || Math.ceil((record.minggu || 1) / 4)),
      realisasi: Number(record.realisasi || 0),
      rencana: Number(record.rencana || 0),
      kendala: record.kendala || '',
      rekomendasi: record.rekomendasi || '',
      updatedBy: activeUser?.id || '',
      updatedAt: new Date().toISOString()
    };

    const allSchoolRecords = [...existingSchoolRecords, updatedRecord].sort((a, b) => a.minggu - b.minggu);
    let runningKumulatif = 0;
    const recalculatedSchoolRecords = allSchoolRecords.map(w => {
      runningKumulatif += Number(w.realisasi || 0);
      const rel = Number(w.realisasi || 0);
      const ren = Number(w.rencana || 0);
      return {
        ...w,
        kumulatif: Number(runningKumulatif.toFixed(3)),
        deviasi: Number((rel - ren).toFixed(3))
      };
    });

    const otherRecords = weeklyProgress.filter(w => w.schoolId !== schoolId);
    const finalWeeklyProgress = [...otherRecords, ...recalculatedSchoolRecords];

    setWeeklyProgress(finalWeeklyProgress);
    localStorage.setItem('revit_weekly_progress', JSON.stringify(finalWeeklyProgress));
    
    // Juga update progres_fisik pada objek sekolah jika kumulatif minggu terakhir berubah
    const latestRecord = recalculatedSchoolRecords[recalculatedSchoolRecords.length - 1];
    let updatedSchools = schools;
    if (latestRecord) {
      const targetSch = schools.find(s => s.npsn === schoolId);
      if (targetSch) {
        const newProg = Math.round(latestRecord.kumulatif);
        if (targetSch.progres_fisik !== newProg) {
          updatedSchools = schools.map(s => s.npsn === schoolId ? { ...s, progres_fisik: newProg } : s);
          setSchools(updatedSchools);
          localStorage.setItem('revit_schools', JSON.stringify(updatedSchools));
        }
      }
    }

    syncWithNewState({ weekly_progress: finalWeeklyProgress, schools: updatedSchools }, true, true);
  };

  const handleDeleteWeeklyProgress = (id) => {
    const target = weeklyProgress.find(w => w.id === id);
    if (!target) return;
    const schoolId = target.schoolId;
    const remaining = weeklyProgress.filter(w => w.id !== id);

    const schoolRecords = remaining.filter(w => w.schoolId === schoolId).sort((a, b) => a.minggu - b.minggu);
    let runningKumulatif = 0;
    const recalculatedSchoolRecords = schoolRecords.map(w => {
      runningKumulatif += Number(w.realisasi || 0);
      const rel = Number(w.realisasi || 0);
      const ren = Number(w.rencana || 0);
      return {
        ...w,
        kumulatif: Number(runningKumulatif.toFixed(3)),
        deviasi: Number((rel - ren).toFixed(3))
      };
    });

    const otherRecords = remaining.filter(w => w.schoolId !== schoolId);
    const finalWeeklyProgress = [...otherRecords, ...recalculatedSchoolRecords];

    setWeeklyProgress(finalWeeklyProgress);
    localStorage.setItem('revit_weekly_progress', JSON.stringify(finalWeeklyProgress));
    
    // Update progres_fisik sekolah
    const latestRecord = recalculatedSchoolRecords[recalculatedSchoolRecords.length - 1];
    let updatedSchools = schools;
    const targetSch = schools.find(s => s.npsn === schoolId);
    if (targetSch) {
      const newProg = latestRecord ? Math.round(latestRecord.kumulatif) : 0;
      if (targetSch.progres_fisik !== newProg) {
        updatedSchools = schools.map(s => s.npsn === schoolId ? { ...s, progres_fisik: newProg } : s);
        setSchools(updatedSchools);
        localStorage.setItem('revit_schools', JSON.stringify(updatedSchools));
      }
    }

    syncWithNewState({ weekly_progress: finalWeeklyProgress, schools: updatedSchools }, true, true);
  };

  const handleRefreshGSheetData = async (spreadsheetId) => {
    try {
      const result = await googleSheetsService.fetchMonitoringData(spreadsheetId);
      const { schoolUpdates, weeklyProgressRecords } = result;

      // 1. Merge schoolUpdates: non-destructive merge by NPSN
      let schoolsUpdatedCount = 0;
      const nextSchools = schools.map(sch => {
        const update = schoolUpdates.find(u => u.npsn === sch.npsn);
        if (!update) return sch;

        let hasChanges = false;
        const merged = { ...sch };
        const isEmpty = (val) => val === undefined || val === null || String(val).trim() === '';

        const fieldsToMerge = [
          'kepala_sekolah', 'hp_kepala_sekolah', 'dinas_pendidikan_nama',
          'dinas_pendidikan_hp', 'tanggal_pks', 'tanggal_dana_tahap1',
          'tanggal_mc0', 'kelengkapan_mc0', 'kendala_mc0', 'kendala_pelaksanaan'
        ];

        fieldsToMerge.forEach(f => {
          if (isEmpty(merged[f]) && !isEmpty(update[f])) {
            merged[f] = update[f];
            hasChanges = true;
          }
        });

        if (hasChanges) schoolsUpdatedCount++;
        return merged;
      });

      // 2. Merge contacts (Perencana & Pengawas) conditionally
      let updatedContacts = [...contacts];
      schoolUpdates.forEach(u => {
        const sch = nextSchools.find(s => s.npsn === u.npsn);
        if (!sch) return;

        if (!sch.perencanaId && u.perencanaNama && u.perencanaNama.trim() !== '') {
          let existingContact = updatedContacts.find(c => c.nama.toLowerCase() === u.perencanaNama.trim().toLowerCase());
          if (!existingContact) {
            existingContact = { id: `contact-${Date.now()}-p-${u.npsn}`, nama: u.perencanaNama.trim(), hp: u.perencanaHp || '' };
            updatedContacts.push(existingContact);
          }
          sch.perencanaId = existingContact.id;
        }

        if (!sch.pengawasId && u.pengawasNama && u.pengawasNama.trim() !== '') {
          let existingContact = updatedContacts.find(c => c.nama.toLowerCase() === u.pengawasNama.trim().toLowerCase());
          if (!existingContact) {
            existingContact = { id: `contact-${Date.now()}-w-${u.npsn}`, nama: u.pengawasNama.trim(), hp: u.pengawasHp || '' };
            updatedContacts.push(existingContact);
          }
          sch.pengawasId = existingContact.id;
        }
      });

      // 3. Merge weeklyProgressRecords: update existing records or add new records from GSheet
      let wpAddedCount = 0;
      const nextWp = [...weeklyProgress];

      weeklyProgressRecords.forEach(rec => {
        const idx = nextWp.findIndex(w => w.id === rec.id || (w.schoolId === rec.schoolId && Number(w.minggu) === Number(rec.minggu)));
        if (idx >= 0) {
          nextWp[idx] = { ...nextWp[idx], ...rec };
        } else {
          nextWp.push(rec);
          wpAddedCount++;
        }
      });

      // Recalculate cumulative & deviasi
      const schoolIds = new Set(nextWp.map(w => w.schoolId));
      let finalWp = [];

      schoolIds.forEach(sId => {
        const sRecords = nextWp.filter(w => w.schoolId === sId).sort((a, b) => Number(a.minggu) - Number(b.minggu));
        let runningKumulatif = 0;
        let runningRencana = 0;
        const recalculated = sRecords.map(w => {
          runningKumulatif = w.kumulatif !== undefined && w.kumulatif !== null && Number(w.kumulatif) > 0 ? Number(w.kumulatif) : (runningKumulatif + Number(w.realisasi || 0));
          runningRencana += Number(w.rencana || 0);
          const kum = Number(runningKumulatif.toFixed(3));
          const ren = Number(runningRencana.toFixed(3));
          const dev = Number((kum - ren).toFixed(3));
          return {
            ...w,
            kumulatif: kum,
            deviasi: w.deviasi !== undefined && w.deviasi !== 0 ? Number(w.deviasi) : dev
          };
        });
        finalWp = [...finalWp, ...recalculated];

        const latest = recalculated[recalculated.length - 1];
        if (latest) {
          const targetSch = nextSchools.find(s => s.npsn === sId);
          if (targetSch) {
            targetSch.progres_fisik = Math.round(latest.kumulatif);
          }
        }
      });

      setSchools(nextSchools);
      setContacts(updatedContacts);
      setWeeklyProgress(finalWp);

      localStorage.setItem('revit_schools', JSON.stringify(nextSchools));
      localStorage.setItem('revit_contacts', JSON.stringify(updatedContacts));
      localStorage.setItem('revit_weekly_progress', JSON.stringify(finalWp));

      addActivityLog('gsheet_sync', `Bulk-import data monitoring Google Sheets: ${result.totalSchoolsProcessed} sekolah diproses, ${wpAddedCount} record progres mingguan baru.`, null, false);

      syncWithNewState({ schools: nextSchools, contacts: updatedContacts, weekly_progress: finalWp }, true, true);

      return {
        success: true,
        message: `Sinkronisasi berhasil! ${result.totalSchoolsProcessed} sekolah diproses (${schoolsUpdatedCount} profil diperbarui), ${wpAddedCount} record progres mingguan baru ditambahkan.`
      };
    } catch (err) {
      console.error('[GSheet Sync] Error:', err);
      throw err;
    }
  };

  const handleClaimSchool = (npsn, fasilitatorId) => {
    let updatedLogs = null;
    const schoolObj = schools.find((s) => s.npsn === npsn);
    if (schoolObj) {
      updatedLogs = addActivityLog('claim_school', `Mengklaim sekolah ${schoolObj.nama_sekolah}`, null, false);
    }
    const updated = schools.map((s) => (s.npsn === npsn ? { ...s, fasilitatorId } : s));
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
    
    const syncState = { schools: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState, true, true);
  };

  // 8. Contact Actions (Fase 3)
  const handleAddContact = (newContact) => {
    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
    syncWithNewState({ contacts: updated }, true, true);
  };

  const handleUpdateContact = (updatedContact) => {
    const updated = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c));
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
    syncWithNewState({ contacts: updated }, true, true);
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
    const updatedLogs = addActivityLog('add_task', `Menambahkan tugas '${newTask.title}' di sekolah ${schoolName}`, null, false);
    
    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
    syncWithNewState({ tasks: updated, activityLogs: updatedLogs }, true, true);
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    let updatedLogs = null;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const targetSchool = schools.find((s) => s.npsn === task.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : task.sekolahId;
      const statusMap = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
      const statusIndo = statusMap[status] || status;
      updatedLogs = addActivityLog('update_task', `Mengubah status tugas '${task.title}' menjadi '${statusIndo}' di sekolah ${schoolName}`, null, false);
    }
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
    
    const syncState = { tasks: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState);
  };

  const handleDeleteTask = (taskId) => {
    let updatedLogs = null;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const targetSchool = schools.find((s) => s.npsn === task.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : task.sekolahId;
      updatedLogs = addActivityLog('delete_task', `Menghapus tugas '${task.title}' di sekolah ${schoolName}`, null, false);
    }
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
    
    const syncState = { tasks: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState);
  };

  // Phase 5: Kendala Actions
  const handleAddKendala = (newKendala, files) => {
    const targetSchool = schools.find((s) => s.npsn === newKendala.schoolId);
    const schoolName = targetSchool ? targetSchool.nama_sekolah : newKendala.schoolId;
    const updatedLogs = addActivityLog('add_kendala', `Melaporkan kendala di sekolah ${schoolName}`, null, false);
    
    const updatedKendala = [...kendala, newKendala];
    setKendala(updatedKendala);
    localStorage.setItem('revit_kendala', JSON.stringify(updatedKendala));

    // Handle files upload
    const newDocs = files.map(file => ({
      id: `kdoc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      kendalaId: newKendala.id,
      fileName: file.name,
      fileSize: file.size,
      fileData: file.data, // Base64 data
      uploadedBy: activeUser ? activeUser.nama : 'Guest',
      uploadedAt: new Date().toISOString()
    }));

    const updatedKendalaDocs = [...kendalaDocs, ...newDocs];
    setKendalaDocs(updatedKendalaDocs);
    localStorage.setItem('revit_kendala_docs', JSON.stringify(updatedKendalaDocs));

    // Warning generation
    const targetUsers = users.filter(u => 
      (u.jabatanTim === 'Koordinator' && u.id === activeUser.coordinatorId) ||
      u.jabatanTim === 'Ketua Tim' ||
      u.jabatanTim === 'Super Admin'
    );

    const newWarnings = targetUsers.map(u => ({
      id: `warn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: u.id,
      message: `Fasilitator ${activeUser.nama} melaporkan kendala baru di ${schoolName}: "${newKendala.isi.replace(/<[^>]*>/g, '').substring(0, 50)}..."`,
      schoolId: newKendala.schoolId,
      kendalaId: newKendala.id,
      createdAt: new Date().toISOString(),
      dismissed: false
    }));

    const updatedWarnings = [...warnings, ...newWarnings];
    setWarnings(updatedWarnings);
    localStorage.setItem('revit_warnings', JSON.stringify(updatedWarnings));

    syncWithNewState({ 
      kendala: updatedKendala, 
      kendalaDocs: updatedKendalaDocs, 
      warnings: updatedWarnings,
      activityLogs: updatedLogs
    }, true, true);
  };

  const handleDeleteKendala = (kendalaId) => {
    let updatedLogs = null;
    const item = kendala.find(k => k.id === kendalaId);
    if (item) {
      const targetSchool = schools.find((s) => s.npsn === item.schoolId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : item.schoolId;
      updatedLogs = addActivityLog('delete_kendala', `Menghapus laporan kendala di sekolah ${schoolName}`, null, false);
    }

    const updatedKendala = kendala.filter(k => k.id !== kendalaId);
    const updatedKendalaDocs = kendalaDocs.filter(d => d.kendalaId !== kendalaId);
    const updatedComments = kendalaComments.filter(c => c.kendalaId !== kendalaId);
    const updatedWarnings = warnings.filter(w => w.kendalaId !== kendalaId);

    setKendala(updatedKendala);
    setKendalaDocs(updatedKendalaDocs);
    setKendalaComments(updatedComments);
    setWarnings(updatedWarnings);

    localStorage.setItem('revit_kendala', JSON.stringify(updatedKendala));
    localStorage.setItem('revit_kendala_docs', JSON.stringify(updatedKendalaDocs));
    localStorage.setItem('revit_kendala_comments', JSON.stringify(updatedComments));
    localStorage.setItem('revit_warnings', JSON.stringify(updatedWarnings));

    const syncState = { 
      kendala: updatedKendala, 
      kendalaDocs: updatedKendalaDocs, 
      kendalaComments: updatedComments, 
      warnings: updatedWarnings 
    };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }

    syncWithNewState(syncState, true);
  };

  const handleAddKendalaComment = (newComment) => {
    const targetKendala = kendala.find(k => k.id === newComment.kendalaId);
    if (!targetKendala) return;

    const targetSchool = schools.find((s) => s.npsn === targetKendala.schoolId);
    const schoolName = targetSchool ? targetSchool.nama_sekolah : targetKendala.schoolId;
    const updatedLogs = addActivityLog('add_kendala_comment', `Memberikan komentar balasan kendala di sekolah ${schoolName}`, null, false);

    const updatedComments = [...kendalaComments, newComment];
    setKendalaComments(updatedComments);
    localStorage.setItem('revit_kendala_comments', JSON.stringify(updatedComments));

    // Warn others
    const warningTargets = users.filter(u => {
      // Don't warn the commenter themselves
      if (u.id === activeUser.id) return false;

      // Warn:
      // 1. The reporter (Fasilitator who owns the report)
      if (u.id === targetKendala.userId) return true;
      // 2. The coordinator supervising the reporter
      const reporter = users.find(x => x.id === targetKendala.userId);
      if (u.jabatanTim === 'Koordinator' && reporter && reporter.coordinatorId === u.id) return true;
      // 3. Ketua Tim
      if (u.jabatanTim === 'Ketua Tim') return true;
      // 4. Super Admin
      if (u.jabatanTim === 'Super Admin') return true;

      return false;
    });

    const newWarnings = warningTargets.map(u => ({
      id: `warn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: u.id,
      message: `Komentar baru dari ${activeUser.nama} (${activeUser.jabatanTim}) pada laporan kendala di ${schoolName}: "${newComment.isi.substring(0, 50)}..."`,
      schoolId: targetKendala.schoolId,
      kendalaId: targetKendala.id,
      createdAt: new Date().toISOString(),
      dismissed: false
    }));

    const updatedWarnings = [...warnings, ...newWarnings];
    setWarnings(updatedWarnings);
    localStorage.setItem('revit_warnings', JSON.stringify(updatedWarnings));

    syncWithNewState({ 
      kendalaComments: updatedComments, 
      warnings: updatedWarnings,
      activityLogs: updatedLogs
    }, true, true);
  };

  const handleDeleteKendalaComment = (commentId) => {
    const updatedLogs = addActivityLog('delete_kendala_comment', `Menghapus komentar kendala`, null, false);
    const updatedComments = kendalaComments.filter(c => c.id !== commentId);
    setKendalaComments(updatedComments);
    localStorage.setItem('revit_kendala_comments', JSON.stringify(updatedComments));
    syncWithNewState({ 
      kendalaComments: updatedComments,
      activityLogs: updatedLogs
    }, true);
  };

  const handleDeleteKendalaDoc = (docId) => {
    const updated = kendalaDocs.filter(d => d.id !== docId);
    setKendalaDocs(updated);
    localStorage.setItem('revit_kendala_docs', JSON.stringify(updated));
    syncWithNewState({ kendalaDocs: updated }, true);
  };

  const syncWarningsDebounced = (latestWarnings) => {
    // Mark warnings state and table as dirty immediately to avoid loss of state on reload
    window.localStorage.setItem('revit_is_dirty', 'true');
    setIsDirty(true);
    const dirty = getLocalDirtyTables();
    dirty['warnings'] = true;
    setLocalDirtyTables(dirty);

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }

    dismissTimeoutRef.current = setTimeout(() => {
      const currentLatest = latestStateRef.current ? latestStateRef.current.warnings : latestWarnings;
      syncWithNewState({ warnings: currentLatest });
    }, 10000); // 10 detik
  };

  const handleDismissWarning = (warningId) => {
    const updated = warnings.map(w => w.id === warningId ? { ...w, dismissed: true } : w);
    setWarnings(updated);
    localStorage.setItem('revit_warnings', JSON.stringify(updated));
    syncWarningsDebounced(updated);
  };

  // 9b. Generate warnings for trips missing photo documentation
  const generateTripPhotoWarnings = (currentTrips, currentTripDocs, currentWarnings, currentUsers, currentSettings) => {
    const todayStr = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    })();

    // Find trips where tanggalSelesai has passed and no foto_dokumentasi uploaded
    const tripsNeedingPhotos = (currentTrips || []).filter(trip => {
      if (!trip.tanggalSelesai) return false;
      if (trip.tanggalSelesai >= todayStr) return false; // Not past yet
      if (trip.statusPersetujuan === 'rejected') return false;
      const hasPhoto = (currentTripDocs || []).some(d =>
        d.tripId === trip.id && d.category === 'foto_dokumentasi'
      );
      return !hasPhoto;
    });

    // Deduplicate currentWarnings by type + unique identifiers to clean up database bloating
    const uniqueWarnings = [];
    const seen = new Set();
    
    (currentWarnings || []).forEach(w => {
      if (!w) return;
      let key = w.id;
      
      // Normalize missing fields for old warnings in sheet
      const isTripPhotoWarn = w.type === 'missing_trip_photos' || (w.id && w.id.startsWith('warn-photo-'));
      
      if (isTripPhotoWarn) {
        // Use message + userId as the deduplication key to handle older warnings that lack type/tripId on the sheet
        key = `trip-${w.userId}-${w.message}`;
        if (!w.type) w.type = 'missing_trip_photos';
      } else if (w.kendalaId) {
        key = `kendala-${w.kendalaId}-${w.userId}`;
      }
      
      if (seen.has(key)) {
        // Prefer keeping the dismissed version if we find a duplicate that is dismissed
        const existingIdx = uniqueWarnings.findIndex(x => {
          if (isTripPhotoWarn) {
            const isXTripPhotoWarn = x.type === 'missing_trip_photos' || (x.id && x.id.startsWith('warn-photo-'));
            return isXTripPhotoWarn && x.userId === w.userId && x.message === w.message;
          } else if (w.kendalaId) {
            return x.kendalaId === w.kendalaId && x.userId === w.userId;
          }
          return false;
        });
        if (existingIdx !== -1 && w.dismissed && !uniqueWarnings[existingIdx].dismissed) {
          uniqueWarnings[existingIdx] = { ...uniqueWarnings[existingIdx], ...w, dismissed: true };
        }
        return;
      }
      seen.add(key);
      uniqueWarnings.push(w);
    });

    // Filter out existing missing_trip_photos warnings if their trips no longer need photos (e.g. photo uploaded or trip deleted)
    const cleanedExistingWarnings = uniqueWarnings.filter(w => {
      const isTripPhotoWarn = w.type === 'missing_trip_photos' || (w.id && w.id.startsWith('warn-photo-'));
      if (!isTripPhotoWarn) return true;
      
      return tripsNeedingPhotos.some(trip => {
        if (w.tripId && trip.id === w.tripId) return true;
        // Fallback: match by message
        const fasUser = (currentUsers || []).find(u => u.id === trip.userId);
        if (!fasUser) return false;
        const expectedMessage = `Foto dokumentasi perjalanan dinas Fasilitator ${fasUser.nama} (Kunjungan ke-${trip.kunjunganKe}, selesai ${trip.tanggalSelesai}) belum diupload. Segera lengkapi bukti dokumentasi.`;
        return w.message === expectedMessage;
      });
    });

    const newWarnings = [];

    tripsNeedingPhotos.forEach(trip => {
      const fasUser = (currentUsers || []).find(u => u.id === trip.userId);
      if (!fasUser) return;

      // Determine who to warn: Koordinator supervising this fasilitator, Ketua Tim, Super Admin
      const warningTargetUsers = (currentUsers || []).filter(u => {
        if (u.id === trip.userId) return false; // Don't warn fasilitator themselves here
        if (u.jabatanTim === 'Koordinator' && fasUser.coordinatorId === u.id) return true;
        if (u.jabatanTim === 'Ketua Tim') return true;
        if (u.jabatanTim === 'Super Admin' || u.role === 'admin') return true;
        return false;
      });

      warningTargetUsers.forEach(targetUser => {
        const expectedMessage = `Foto dokumentasi perjalanan dinas Fasilitator ${fasUser.nama} (Kunjungan ke-${trip.kunjunganKe}, selesai ${trip.tanggalSelesai}) belum diupload. Segera lengkapi bukti dokumentasi.`;
        
        // Check if a warning for this trip+user already exists (whether dismissed or active)
        const alreadyWarned = cleanedExistingWarnings.some(w =>
          w.userId === targetUser.id &&
          (w.message === expectedMessage || (w.type === 'missing_trip_photos' && w.tripId === trip.id))
        );
        if (alreadyWarned) return;

        newWarnings.push({
          id: `warn-photo-${trip.id}-${targetUser.id}-${Date.now()}-${Math.random().toString(36).substr(2,6)}`,
          type: 'missing_trip_photos',
          userId: targetUser.id,
          tripId: trip.id,
          facilitatorId: trip.userId,
          facilitatorName: fasUser.nama,
          message: expectedMessage,
          createdAt: new Date().toISOString(),
          dismissed: false
        });
      });
    });

    return [...cleanedExistingWarnings, ...newWarnings];
  };

  // Run trip photo warning generation whenever trips, tripDocs, or warnings change
  useEffect(() => {
    if (!activeProgram) return;
    if (trips.length === 0) return;
    const updatedWarnings = generateTripPhotoWarnings(trips, tripDocs, warnings, users, settings);
    
    // Deep comparison to check if warnings array changed (including dismissed status)
    const hasChanged = updatedWarnings.length !== warnings.length ||
      updatedWarnings.some((w, idx) => 
        w.id !== warnings[idx]?.id || 
        w.dismissed !== warnings[idx]?.dismissed
      );

    if (hasChanged) {
      setWarnings(updatedWarnings);
      localStorage.setItem('revit_warnings', JSON.stringify(updatedWarnings));
      syncWarningsDebounced(updatedWarnings);
    }
  }, [trips, tripDocs, warnings, users, settings]);

  // 10. Trip Actions (Fase 3 & 4)
  const handleAddTrip = (newTrip) => {
    const tripsArr = Array.isArray(newTrip) ? newTrip : [newTrip];
    let updatedLogs = null;
    tripsArr.forEach(t => {
      const targetSchool = schools.find(s => s.npsn === t.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : t.sekolahId;
      updatedLogs = addActivityLog('add_trip', `Merencanakan perjalanan dinas ke ${schoolName} tanggal ${t.tanggalMulai}`, null, false);
    });
    const updated = Array.isArray(newTrip) ? [...trips, ...newTrip] : [...trips, newTrip];
    setTrips(updated);
    localStorage.setItem('revit_trips', JSON.stringify(updated));
    
    const syncState = { trips: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState, true, true);
  };

  const handlePayTrip = (tripId, newExpense) => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { ...t, isPaid: true } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('revit_expenses', JSON.stringify(updatedExpenses));
    syncWithNewState({ trips: updatedTrips, expenses: updatedExpenses }, true, true);
  };

  const handleApproveTrip = (tripId, adminName, note = '') => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { 
      ...t, 
      statusPersetujuan: 'approved',
      approvedBySuperAdmin: true,
      approvedAt: new Date().toISOString(),
      approvedBy: adminName,
      catatanPersetujuan: note
    } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips }, true, true);
  };

  const handleRejectTrip = (tripId, note = '') => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { 
      ...t, 
      statusPersetujuan: 'rejected',
      approvedBySuperAdmin: false,
      catatanPersetujuan: note
    } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips }, true, true);
  };

  // Batch approve/reject untuk Super Admin (menyetujui/menolak sekaligus dalam satu batch)
  const handleApproveTripsBatch = (tripIds, approverName, note = '') => {
    const updatedTrips = trips.map((t) =>
      tripIds.includes(t.id) ? {
        ...t,
        statusPersetujuan: 'approved',
        approvedBySuperAdmin: true,
        approvedAt: new Date().toISOString(),
        approvedBy: approverName,
        catatanPersetujuan: note
      } : t
    );
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips }, true, true);
  };

  const handleRejectTripsBatch = (tripIds, note = '') => {
    const updatedTrips = trips.map((t) =>
      tripIds.includes(t.id) ? {
        ...t,
        statusPersetujuan: 'rejected',
        approvedBySuperAdmin: false,
        catatanPersetujuan: note
      } : t
    );
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips }, true, true);
  };

  const handleUpdateTrip = (updatedTrip) => {
    const updatedLogs = addActivityLog('update_trip', `Mengubah ajuan perjalanan dinas untuk ${updatedTrip.sekolahId}`, null, false);
    const updatedTrips = trips.map((t) => (t.id === updatedTrip.id ? updatedTrip : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips, activityLogs: updatedLogs }, true, true);
  };

  const handleUpdateTripsBatch = (updatedTripsList) => {
    const updatedLogs = addActivityLog('update_trip_batch', `Mengubah ajuan perjalanan dinas kolektif.`, null, false);
    const updatedTripsMap = new Map(updatedTripsList.map(t => [t.id, t]));
    const newTrips = trips.map(t => updatedTripsMap.has(t.id) ? updatedTripsMap.get(t.id) : t);
    setTrips(newTrips);
    localStorage.setItem('revit_trips', JSON.stringify(newTrips));
    syncWithNewState({ trips: newTrips, activityLogs: updatedLogs }, true, true);
  };

  const handleDeleteTrip = (tripId) => {
    const updatedLogs = addActivityLog('delete_trip', `Membatalkan ajuan perjalanan dinas.`, null, false);
    const updatedTrips = trips.filter((t) => t.id !== tripId);
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips, activityLogs: updatedLogs });
  };

  const handleDeleteTripsBatch = (tripIds) => {
    const updatedLogs = addActivityLog('delete_trip_batch', `Membatalkan ajuan perjalanan dinas kolektif.`, null, false);
    const updatedTrips = trips.filter((t) => !tripIds.includes(t.id));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
    syncWithNewState({ trips: updatedTrips, activityLogs: updatedLogs });
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

    syncWithNewState({ logs: updatedLogs, activityLogs: updatedActivityLogs }, true, true);
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

  const handleEditLog = (logId, newText, newFoto) => {
    const originalLog = logs.find(l => l.id === logId);
    const finalFoto = newFoto !== undefined ? newFoto : (originalLog ? originalLog.foto : '');
    const updatedLogs = logs.map(l => l.id === logId ? { ...l, aktivitas: newText, foto: finalFoto } : l);
    setLogs(updatedLogs);
    localStorage.setItem('revit_logs', JSON.stringify(updatedLogs));

    const actEntry = _createActivityEntry(
      'edit_daily_log', 
      `Mengedit log harian`, 
      finalFoto ? {
        id: logId,
        type: 'daily_log_photo',
        fileName: `Foto_Log_${originalLog?.tanggal || 'edited'}.jpg`,
        fileData: finalFoto
      } : null
    );
    const updatedActivityLogs = actEntry ? [actEntry, ...activityLogs].slice(0, 50) : activityLogs;
    setActivityLogs(updatedActivityLogs);
    localStorage.setItem('revit_activity_logs', JSON.stringify(updatedActivityLogs));

    syncWithNewState({ logs: updatedLogs, activityLogs: updatedActivityLogs }, true, true);
  };

  // 12. Monthly Reports PDF Actions (Fase 4)
  const handleAddReport = (newReport, shouldSync = false) => {
    const updatedLogs = addActivityLog('upload_monthly_report', `Mengunggah laporan bulanan ke-${newReport.bulanKe}: ${newReport.fileName}`, {
      id: newReport.id,
      type: 'report',
      fileName: newReport.fileName
    }, false);
    // Overwrite if same month exists
    const updated = reports.filter(r => !(r.userId === newReport.userId && r.bulanKe === newReport.bulanKe));
    updated.push(newReport);
    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
    if (shouldSync) {
      syncWithNewState({ reports: updated, activityLogs: updatedLogs }, true);
    } else {
      window.localStorage.setItem('revit_is_dirty', 'true');
      setIsDirty(true);
      const dirty = getLocalDirtyTables();
      dirty.reports = true;
      setLocalDirtyTables(dirty);
      pendingSyncUpdatesRef.current = { ...pendingSyncUpdatesRef.current, reports: updated };
    }
  };

  const handleDeleteReport = (reportId, shouldSync = false) => {
    let updatedLogs = null;
    const rep = reports.find(r => r.id === reportId);
    if (rep) {
      updatedLogs = addActivityLog('delete_monthly_report', `Menghapus laporan bulanan ke-${rep.bulanKe}: ${rep.fileName}`, null, false);
    }
    const updated = reports.filter(r => r.id !== reportId);
    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
    if (shouldSync) {
      const syncState = { reports: updated };
      if (updatedLogs) syncState.activityLogs = updatedLogs;
      syncWithNewState(syncState, true);
    } else {
      window.localStorage.setItem('revit_is_dirty', 'true');
      setIsDirty(true);
      const dirty = getLocalDirtyTables();
      dirty.reports = true;
      setLocalDirtyTables(dirty);
      pendingSyncUpdatesRef.current = { ...pendingSyncUpdatesRef.current, reports: updated };
    }
  };

  const handleUpdateReportStatus = (reportId, status, note = '', shouldSync = false) => {
    const rep = reports.find(r => r.id === reportId);
    if (!rep) return;

    const actionLabel = status === 'approved' ? 'menyetujui' : 'mengembalikan';
    const reportUser = users.find(u => u.id === rep.userId) || { nama: 'Anggota' };
    const updatedLogs = addActivityLog('review_monthly_report', `${activeUser.nama} (${activeUser.jabatanTim}) ${actionLabel} laporan bulanan ke-${rep.bulanKe} dari ${reportUser.nama}.${note ? ' Catatan: ' + note : ''}`, {
      id: reportId,
      type: 'report',
      fileName: rep.fileName
    }, false);

    const updated = reports.map(r => {
      if (r.id === reportId) {
        return {
          ...r,
          status,
          note,
          reviewedAt: new Date().toISOString(),
          reviewedBy: activeUser.id
        };
      }
      return r;
    });

    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
    if (shouldSync) {
      syncWithNewState({ reports: updated, activityLogs: updatedLogs }, true);
    } else {
      window.localStorage.setItem('revit_is_dirty', 'true');
      setIsDirty(true);
      const dirty = getLocalDirtyTables();
      dirty.reports = true;
      setLocalDirtyTables(dirty);
      pendingSyncUpdatesRef.current = { ...pendingSyncUpdatesRef.current, reports: updated };
    }
  };

  // 13. Duty Reports Actions (Fase 4)
  const handleSaveDutyReport = (newReport) => {
    const updated = dutyReports.filter(r => !(r.userId === newReport.userId && r.dutyIndex === newReport.dutyIndex));
    updated.push(newReport);
    setDutyReports(updated);
    localStorage.setItem('revit_duty_reports', JSON.stringify(updated));
    syncWithNewState({ dutyReports: updated }, true, true);
  };

  // 14. Expense Actions (Fase 4)
  const handleAddExpense = (newExpense) => {
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('revit_expenses', JSON.stringify(updated));
    syncWithNewState({ expenses: updated }, true, true);
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
    syncWithNewState({ payments: updatedPayments, expenses: updatedExpenses }, true, true);
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
    syncWithNewState({ payments: updatedPayments, expenses: updatedExpenses }, true, true);
  };

  const handleAddSchoolDoc = (newDoc) => {
    const targetSchool = schools.find(s => s.npsn === newDoc.sekolahId);
    const schoolName = targetSchool ? targetSchool.nama_sekolah : newDoc.sekolahId;
    const updatedLogs = addActivityLog('upload_school_doc', `Mengunggah dokumen sekolah ${schoolName}: ${newDoc.fileName}`, {
      id: newDoc.id,
      type: 'school_doc',
      fileName: newDoc.fileName
    }, false);
    const updated = [...schoolDocs, newDoc];
    setSchoolDocs(updated);
    localStorage.setItem('revit_school_docs', JSON.stringify(updated));
    syncWithNewState({ schoolDocs: updated, activityLogs: updatedLogs }, true, true);
  };

  const handleDeleteSchoolDoc = (docId) => {
    let updatedLogs = null;
    const doc = schoolDocs.find(d => d.id === docId);
    if (doc) {
      const targetSchool = schools.find(s => s.npsn === doc.sekolahId);
      const schoolName = targetSchool ? targetSchool.nama_sekolah : doc.sekolahId;
      updatedLogs = addActivityLog('delete_school_doc', `Menghapus dokumen sekolah ${schoolName}: ${doc.fileName}`, null, false);
    }
    const updated = schoolDocs.filter(d => d.id !== docId);
    setSchoolDocs(updated);
    localStorage.setItem('revit_school_docs', JSON.stringify(updated));
    
    const syncState = { schoolDocs: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState);
  };

  const handleAddPersonnelDoc = (newDoc) => {
    const updatedLogs = addActivityLog('upload_personnel_doc', `Mengunggah dokumen personil: dokumen ${newDoc.type} ${newDoc.fileName}`, {
      id: newDoc.id,
      type: 'personnel',
      fileName: newDoc.fileName
    }, false);
    const updated = [...personnelDocs, newDoc];
    setPersonnelDocs(updated);
    localStorage.setItem('revit_personnel_docs', JSON.stringify(updated));
    syncWithNewState({ personnelDocs: updated, activityLogs: updatedLogs });
  };

  const handleDeletePersonnelDoc = (docId) => {
    let updatedLogs = null;
    const doc = personnelDocs.find(d => d.id === docId);
    if (doc) {
      updatedLogs = addActivityLog('delete_personnel_doc', `Menghapus dokumen personil: dokumen ${doc.type} ${doc.fileName}`, null, false);
    }
    const updated = personnelDocs.filter(d => d.id !== docId);
    setPersonnelDocs(updated);
    localStorage.setItem('revit_personnel_docs', JSON.stringify(updated));
    
    const syncState = { personnelDocs: updated };
    if (updatedLogs) {
      syncState.activityLogs = updatedLogs;
    }
    syncWithNewState(syncState);
  };

  const handleAddMeeting = (newMeeting, documents = [], photos = []) => {
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

    let updatedPhotos = [...meetingPhotos];
    if (photos && photos.length > 0) {
      const photosWithId = photos.map(p => ({ ...p, meetingId: newMeeting.id }));
      updatedPhotos = [...updatedPhotos, ...photosWithId];
      setMeetingPhotos(updatedPhotos);
      localStorage.setItem('revit_meeting_photos', JSON.stringify(updatedPhotos));
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
      meetingPhotos: updatedPhotos,
      logs: updatedLogs, 
      activityLogs: updatedActivityLogs 
    }, true, true);
  };

  const handleUpdateMeeting = (updatedMeeting, documents = [], newPhotos = []) => {
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

    // Tambahkan foto baru (foto yang sudah ada tidak dihapus lewat handler ini)
    let updatedPhotos = [...meetingPhotos];
    if (newPhotos && newPhotos.length > 0) {
      const photosWithId = newPhotos.map(p => ({ ...p, meetingId: updatedMeeting.id }));
      updatedPhotos = [...updatedPhotos, ...photosWithId];
    }
    setMeetingPhotos(updatedPhotos);
    localStorage.setItem('revit_meeting_photos', JSON.stringify(updatedPhotos));

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
      meetingPhotos: updatedPhotos,
      logs: updatedLogs, 
      activityLogs: updatedActivityLogs 
    }, true, true);
  };

  const handleDeleteMeetingPhoto = (photoId) => {
    const updatedPhotos = meetingPhotos.filter(p => p.id !== photoId);
    setMeetingPhotos(updatedPhotos);
    localStorage.setItem('revit_meeting_photos', JSON.stringify(updatedPhotos));
    syncWithNewState({ meetingPhotos: updatedPhotos }, true, true);
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

    const updatedPhotos = meetingPhotos.filter(p => p.meetingId !== meetingId);
    setMeetingPhotos(updatedPhotos);
    localStorage.setItem('revit_meeting_photos', JSON.stringify(updatedPhotos));

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

  const addActivityLog = (actionType, description, fileRef = null, shouldSync = true) => {
    if (!activeUser) return null;

    const newLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: activeUser.id,
      timestamp: new Date().toISOString(),
      actionType,
      description,
      fileRef
    };

    const currentLogs = activityLogs || [];
    const updated = [newLog, ...currentLogs].slice(0, 50);
    
    setActivityLogs(updated);

    if (shouldSync) {
      setTimeout(() => {
        syncWithNewState({ activityLogs: updated });
      }, 0);
    } else {
      window.localStorage.setItem('revit_is_dirty', 'true');
      setIsDirty(true);
      
      const dirty = getLocalDirtyTables();
      dirty.activity_logs = true;
      setLocalDirtyTables(dirty);
      
      pendingSyncUpdatesRef.current = { ...pendingSyncUpdatesRef.current, activityLogs: updated };
    }

    return updated;
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
    if (!fileRef) return;

    let fileData = fileRef.fileData;
    if (!fileData && fileRef.id) {
      const pDoc = personnelDocs.find(d => d.id === fileRef.id);
      const sDoc = schoolDocs.find(d => d.id === fileRef.id);
      const tDoc = tripDocs.find(d => d.id === fileRef.id);
      const rDoc = reports.find(d => d.id === fileRef.id);
      
      const found = pDoc || sDoc || tDoc || rDoc;
      if (found) {
        fileData = found.fileData;
      }
    }

    if (!fileData) {
      window.showAlert('Dokumen tidak ditemukan atau belum disinkronkan.');
      return;
    }

    try {
      if (fileData.startsWith('http')) {
        window.open(fileData, '_blank');
        return;
      }
      
      const parts = fileData.split(';base64,');
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
        // Koordinator sees their assigned Fasilitator, other Koordinator, Tenaga Administrasi (no Super Admin, no Ketua Tim)
        if (authorRole === 'Fasilitator') {
          return author?.coordinatorId === activeUser.id;
        }
        return authorRole !== 'Super Admin' && authorRole !== 'Ketua Tim';
      }
      return false;
    });
  };

  // RENDER: Main Dashboard Layout
  if (!globalActiveUser || !activeProgram) {
    const sdUsersList = (portalSdUsers || []).map(u => {
      const pwd = u.password !== undefined && u.password !== null ? String(u.password).trim() : '';
      if (u.id === 'yosi-ronadi' && pwd !== '4051') return { ...u, password: '4051' };
      if (u.id === 'etty-rabihati' && pwd !== 'sipil') return { ...u, password: 'sipil' };
      if (u.id === 'chandra-bayu' && pwd !== 'arsitektur') return { ...u, password: 'arsitektur' };
      if (u.id === 'wida-arindya-sari' && (pwd === '' || pwd === '2026')) {
        return { ...u, password: '2026' };
      }
      return { ...u, password: pwd };
    });

    const paudUsersList = (portalPaudUsers || []).map(u => {
      const pwd = u.password !== undefined && u.password !== null ? String(u.password).trim() : '';
      if (u.id === 'yosi-ronadi' && pwd !== '4051') return { ...u, password: '4051' };
      if (u.id === 'qalbi-hafiyyan' && pwd !== 'arsitektur') return { ...u, password: 'arsitektur' };
      if (['faddylah-aldino', 'barra-asy-syawali', 'rizaldi', 'muhammad-faiq-khalilurrahman', 'wida-arindya-sari'].includes(u.id) && (pwd === '' || pwd === '2026')) {
        return { ...u, password: '2026' };
      }
      return { ...u, password: pwd };
    });

    let sdCount = 41;
    try {
      const stored = window.localStorage.getItem('revit_schools');
      if (stored) sdCount = JSON.parse(stored).length;
    } catch (e) {}

    let paudCount = 55;
    try {
      const stored = window.localStorage.getItem('revitpaud_schools');
      if (stored) paudCount = JSON.parse(stored).length;
    } catch (e) {}

    return (
      <ProgramPortal
        sdUsers={sdUsersList}
        paudUsers={paudUsersList}
        sdSchoolsCount={sdCount}
        paudSchoolsCount={paudCount}
        sdSettings={portalSdSettings}
        paudSettings={portalPaudSettings}
        loggedInUser={globalActiveUser}
        onLogin={(user) => {
          window.localStorage.setItem('global_active_user', JSON.stringify(user));
          setGlobalActiveUser(user);
        }}
        onLogout={() => {
          window.localStorage.removeItem('global_active_user');
          window.localStorage.removeItem('active_program_id');
          window.localStorage.removeItem('active_program_prefix');
          setGlobalActiveUser(null);
          setActiveProgram(null);
        }}
        onSelectProgram={(prog) => {
          window.localStorage.setItem('active_program_id', prog.id);
          window.localStorage.setItem('active_program_prefix', prog.prefix);
          
          const prefix = prog.prefix;
          const stored = window.localStorage.getItem(`${prefix}_users`);
          let programUsers = [];
          if (stored) {
            try {
              programUsers = JSON.parse(stored);
            } catch (e) {}
          } else {
            programUsers = prefix === 'revitpaud' ? initialPaudUsers : initialUsers;
          }

          const matchingUser = programUsers.find(u => u.id === globalActiveUser.id) || programUsers.find(u => u.nama === globalActiveUser.nama);
          if (matchingUser) {
            window.localStorage.setItem(`${prefix}_active_user`, JSON.stringify(matchingUser));
          } else if (globalActiveUser.jabatanTim === 'Super Admin' || globalActiveUser.role === 'admin') {
            const adminUser = {
              id: "yosi-ronadi",
              nama: "Yosi Ronadi",
              jabatanKepegawaian: "Super Admin",
              jabatanTim: "Super Admin",
              pendidikan: "Strata 2",
              statusPegawai: "PNS",
              role: "admin",
              password: "4051"
            };
            window.localStorage.setItem(`${prefix}_active_user`, JSON.stringify(adminUser));
          }

          window.location.reload();
        }}
      />
    );
  }

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
            onSwitchProgram={handleSwitchProgram}
            activeProgramName={activeProgram?.name}
          />
        )}

        {/* Main View Area */}
        <main className={`${activeUser ? 'flex-1' : 'w-full'} min-h-screen overflow-y-auto bg-slate-950/20`}>
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          


          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-900 pb-5 select-none">
            <div>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-indigo-400">
                Sistem Informasi {activeProgram?.name || 'Revitalisasi Sekolah Dasar 2026'}
              </span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                {activeView === 'dashboard' && 'Dashboard Utama'}
                {activeView === 'kelola-tim' && 'Manajemen Anggota Tim'}
                {activeView === 'sekolah' && 'Kelola Sekolah'}
                {activeView === 'kontak' && 'Manajemen Kontak Mitra Lapangan'}
                {activeView === 'dinas' && 'Jadwal Perjalanan Dinas'}
                {activeView === 'tanggung-jawab' && 'Pelaporan Tanggung Jawab Saya'}
                {activeView === 'laporan-bulanan' && 'Laporan Bulanan Saya'}
                {activeView === 'pantau-laporan-tim' && 'Pantau Laporan Tim'}
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
                  className={`relative overflow-hidden flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
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
                  {/* Progress indicator bar at the bottom */}
                  {syncStatus === 'connecting' && (
                    <div 
                      className="absolute bottom-0 left-0 h-[2px] bg-amber-500 transition-all duration-150" 
                      style={{ width: `${syncProgress}%` }}
                    />
                  )}
                  {syncStatus === 'connecting' ? (
                    <span className="text-[10px] font-bold text-amber-400 min-w-[24px] text-center">{syncProgress}%</span>
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
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

          {activeView === 'dashboard' && (
            <Dashboard
              activeUser={activeUser}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetDatabase={handleResetDatabase}
              schools={schools}
              tasks={tasks}
              reports={reports}
              logs={logs}
              users={users}
              trips={trips}
              tripDocs={tripDocs}
              schoolDocs={schoolDocs}
              meetings={meetings}
              onApproveTrip={handleApproveTrip}
              onRejectTrip={handleRejectTrip}
              onApproveTripsBatch={handleApproveTripsBatch}
              onRejectTripsBatch={handleRejectTripsBatch}
              onSelectSchool={(npsn, tab = 'profile') => {
                setSelectedSchoolNpsn(npsn ? String(npsn).trim() : null);
                setActiveSchoolTab(tab);
              }}
              onViewChange={handleViewChange}
              onUpdateSchool={handleUpdateSchool}
              onRefreshGSheetData={handleRefreshGSheetData}
              expenses={expenses}
              payments={payments}
              onDeleteLog={handleDeleteLog}
              onEditLog={handleEditLog}
              warnings={warnings}
              onDismissWarning={handleDismissWarning}
            />
          )}

          {activeView === 'sekolah' && (
            <SchoolList
              schools={schools}
              users={users}
              activeUser={activeUser}
              onClaimSchool={handleClaimSchool}
              onAddSchool={handleAddSchool}
              onSelectSchool={(npsn, tab = 'profile') => {
                setSelectedSchoolNpsn(npsn ? String(npsn).trim() : null);
                setActiveSchoolTab(tab);
              }}
              onUpdateSchool={handleUpdateSchool}
              tasks={tasks}
              schoolDocs={schoolDocs}
              weeklyProgress={weeklyProgress}
            />
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
                  schoolDocs={schoolDocs}
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
                  onCloseDocsModal={() => {}}
                  warnings={warnings}
                  onDismissWarning={handleDismissWarning}
                />
              )}


              {activeView === 'laporan-bulanan' && (
                <MonthlyPdfReports
                  reports={reports}
                  users={users}
                  activeUser={activeUser}
                  onAddReport={(newReport) => handleAddReport(newReport, true)}
                  onDeleteReport={(reportId) => handleDeleteReport(reportId, true)}
                  onUpdateReportStatus={(reportId, status, note) => handleUpdateReportStatus(reportId, status, note, true)}
                  onlyMy={true}
                />
              )}

              {activeView === 'pantau-laporan-tim' && (
                <MonthlyPdfReports
                  reports={reports}
                  users={users}
                  activeUser={activeUser}
                  onAddReport={(newReport) => handleAddReport(newReport, true)}
                  onDeleteReport={(reportId) => handleDeleteReport(reportId, true)}
                  onUpdateReportStatus={(reportId, status, note) => handleUpdateReportStatus(reportId, status, note, true)}
                  onlyReview={true}
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
                  meetingPhotos={meetingPhotos}
                  users={users}
                  activeUser={activeUser}
                  settings={settings}
                  onAddMeeting={handleAddMeeting}
                  onUpdateMeeting={handleUpdateMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                  onDeleteMeetingPhoto={handleDeleteMeetingPhoto}
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

              {activeView === 'migration' && (
                <MigrationTool
                  activeUser={activeUser}
                  settings={settings}
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
          onClose={() => {
            setPersonnelDocsUser(null);
          }}
          onAddDoc={handleAddPersonnelDoc}
          onDeleteDoc={handleDeletePersonnelDoc}
          onSave={async () => {
            syncWithNewState({ personnelDocs }, true, true);
            setPersonnelDocsUser(null);
          }}
        />
      )}

      {/* Member Reports Modal */}
      {memberReportsUser && (
        <MemberReportsModal
          user={memberReportsUser}
          reports={reports.filter((r) => r.userId === memberReportsUser.id)}
          onClose={() => {
            setMemberReportsUser(null);
          }}
          onAddReport={handleAddReport}
          onDeleteReport={(reportId) => handleDeleteReport(reportId, true)}
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in select-none">
          <div 
            className="absolute inset-0" 
            onClick={() => {
              if (dialog.type === 'alert') {
                if (dialog.resolve) dialog.resolve(true);
                setDialog(null);
              }
            }} 
          />
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
                  onClick={() => {
                    if (dialog.resolve) dialog.resolve(false);
                    setDialog(null);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800 hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer border-0"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.resolve) dialog.resolve(true);
                  setDialog(null);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-lg shadow-indigo-650/10 border-0"
              >
                {dialog.type === 'confirm' ? 'Ya, Lanjutkan' : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Detail Modal (Pop-up Window) */}
      {selectedSchoolNpsn && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-slate-950">
            <button
              onClick={handleCloseSchoolDetail}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800 border border-slate-800 transition-all z-50 cursor-pointer"
              title="Tutup Detail"
            >
              <X className="w-4 h-4" />
            </button>
            <SchoolDetail
              school={schools.find((s) => s.npsn === selectedSchoolNpsn)}
              users={users}
              contacts={contacts}
              tasks={tasks}
              activeUser={activeUser}
              onBack={handleCloseSchoolDetail}
              onUpdateSchool={handleUpdateSchool}
              onAddTask={handleAddTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onDeleteTask={handleDeleteTask}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              schoolDocs={schoolDocs}
              onAddSchoolDoc={handleAddSchoolDoc}
              onDeleteSchoolDoc={handleDeleteSchoolDoc}
              kendala={kendala}
              kendalaComments={kendalaComments}
              kendalaDocs={kendalaDocs}
              onAddKendala={handleAddKendala}
              onDeleteKendala={handleDeleteKendala}
              onAddKendalaComment={handleAddKendalaComment}
              onDeleteKendalaComment={handleDeleteKendalaComment}
              onDeleteKendalaDoc={handleDeleteKendalaDoc}
              weeklyProgress={weeklyProgress}
              onUpdateWeeklyProgress={handleUpdateWeeklyProgress}
              onDeleteWeeklyProgress={handleDeleteWeeklyProgress}
              initialTab={activeSchoolTab}
            />
          </div>
        </div>
      )}

      {/* Full-Screen Syncing Overlay */}
      {isBlockingSync && (
        <div 
          className="fixed inset-0 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in select-none"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.88)' }}
        >
          <div 
            className="relative w-full max-w-sm rounded-3xl p-8 flex flex-col gap-5 text-center items-center animate-scale-in"
            style={{ 
              backgroundColor: 'rgb(10, 15, 30)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(99,102,241,0.12)'
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{ backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <RefreshCw className={`w-8 h-8 ${syncProgress === 100 ? 'hidden' : 'animate-spin'}`} style={{ animationDuration: '3s', color: '#a78bfa' }} />
              {syncProgress === 100 && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl animate-fade-in" style={{ backgroundColor: 'rgba(52,211,153,0.1)' }}>
                  <Check className="w-8 h-8 animate-bounce" style={{ color: '#34d399' }} />
                </div>
              )}
            </div>
            <div className="space-y-2 w-full">
              <h3 className="font-extrabold text-sm uppercase tracking-wider" style={{ color: '#e2e8f0' }}>
                {syncProgress === 100 ? 'Sinkronisasi Selesai' : 'Sinkronisasi Data'}
              </h3>
              <p className="text-[11px] leading-relaxed" style={{ color: '#94a3b8' }}>
                {syncProgress === 100 ? 'Data berhasil diselaraskan!' : 'Sedang menyelaraskan data dengan Google Sheets & Drive...'}
              </p>
              
              {/* Progress Bar */}
              <div 
                className="w-full rounded-full h-3 overflow-hidden mt-4 relative"
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                  style={{ 
                    width: `${syncProgress}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)'
                  }}
                >
                  {/* Shimmer animation */}
                  <div 
                    className="absolute inset-0 opacity-60"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.2s infinite linear'
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold mt-1.5 px-0.5" style={{ color: '#475569' }}>
                <span>Progres</span>
                <span style={{ color: '#a78bfa' }}>{syncProgress}%</span>
              </div>

              <p className="text-[9px] font-semibold mt-3 animate-pulse" style={{ color: '#f87171' }}>
                Mohon jangan menutup atau merefresh browser.
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
