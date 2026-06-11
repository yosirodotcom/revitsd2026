import React, { useState, useEffect } from 'react';
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
import { syncService } from './services/api';

const isValidId = (val) => val !== undefined && val !== null && String(val).trim() !== '';

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

  const [settings, setSettings] = useState({
    projectStartDate: '2026-06-12',
    projectEndDate: '2026-12-12',
    googleAppsScriptUrl: '',
    googleAppsScriptToken: 'REVITSD2026_SECURE_TOKEN',
    totalProjectContract: 1500000000,
    honorKetuaTim: 7000000,
    honorKoordinator: 6000000,
    honorFasilitator: 5000000,
    honorAdministrasi: 5000000,
    deductionAdminFlat: 100000,
    deductionAdminKetuaTim: 100000,
    deductionAdminKoordinator: 100000,
    deductionAdminFasilitator: 100000,
    deductionAdminAdministrasi: 100000,
    deductionTaxPct: 15,
    deductionLembagaPct: 10
  });

  const latestStateRef = React.useRef();

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
      activityLogs,
      settings
    };
  }, [users, schools, contacts, tasks, trips, logs, reports, dutyReports, expenses, payments, schoolDocs, personnelDocs, meetings, activityLogs, settings]);

  // 2. Load Initial Data from LocalStorage or seed defaults
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
      const cleanSchools = parsed.filter(s => s && isValidId(s.npsn));
      if (cleanSchools.length === 0) {
        setSchools(initialSchools);
        localStorage.setItem('revit_schools', JSON.stringify(initialSchools));
      } else {
        let isUpdated = false;
        const migrated = cleanSchools.map((s) => {
          const init = initialSchools.find((x) => x.npsn === s.npsn);
          let updated = { ...s };
          if (init) {
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

    // Daily Logs
    const storedLogs = localStorage.getItem('revit_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs).filter(Boolean));
      } catch {
        setLogs([]);
      }
    } else {
      setLogs([]);
      localStorage.setItem('revit_logs', JSON.stringify([]));
    }

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

    // Meetings
    const storedMeetings = localStorage.getItem('revit_meetings');
    if (storedMeetings) {
      const parsed = JSON.parse(storedMeetings);
      const clean = parsed.map(m => {
        if (m && typeof m.pesertaIds === 'string') {
          m.pesertaIds = m.pesertaIds ? m.pesertaIds.split(',') : [];
        }
        return m;
      });
      setMeetings(clean);
    } else {
      setMeetings([]);
      localStorage.setItem('revit_meetings', JSON.stringify([]));
    }

    // Settings
    const storedSettings = localStorage.getItem('revit_settings');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed.projectStartDate === '2027-06-12') parsed.projectStartDate = '2026-06-12';
      if (parsed.projectEndDate === '2027-12-12') parsed.projectEndDate = '2026-12-12';
      // Hapus simulatedToday dari settings ter-parse jika ada
      delete parsed.simulatedToday;
      setSettings(prev => ({ 
        projectStartDate: '2026-06-12',
        projectEndDate: '2026-12-12',
        googleAppsScriptUrl: '',
        googleAppsScriptToken: 'REVITSD2026_SECURE_TOKEN',
        totalProjectContract: 1500000000,
        honorKetuaTim: 7000000,
        honorKoordinator: 6000000,
        honorFasilitator: 5000000,
        honorAdministrasi: 5000000,
        deductionAdminFlat: 100000,
        deductionAdminKetuaTim: 100000,
        deductionAdminKoordinator: 100000,
        deductionAdminFasilitator: 100000,
        deductionAdminAdministrasi: 100000,
        deductionTaxPct: 15,
        deductionLembagaPct: 10,
        ...parsed 
      }));
    } else {
      localStorage.setItem('revit_settings', JSON.stringify({
        projectStartDate: '2026-06-12',
        projectEndDate: '2026-12-12',
        googleAppsScriptUrl: '',
        googleAppsScriptToken: 'REVITSD2026_SECURE_TOKEN',
        totalProjectContract: 1500000000,
        honorKetuaTim: 7000000,
        honorKoordinator: 6000000,
        honorFasilitator: 5000000,
        honorAdministrasi: 5000000,
        deductionAdminFlat: 100000,
        deductionAdminKetuaTim: 100000,
        deductionAdminKoordinator: 100000,
        deductionAdminFasilitator: 100000,
        deductionAdminAdministrasi: 100000,
        deductionTaxPct: 15,
        deductionLembagaPct: 10
      }));
    }

    // Initial fetch from Google Sheets if configured
    const checkAndFetchInitialData = async () => {
      if (syncService.isConfigured()) {
        setSyncStatus('connecting');
        try {
          const remoteData = await syncService.fetchData();
          
          if (remoteData.users) {
            const clean = remoteData.users.filter(u => u && isValidId(u.id));
            if (clean.length > 0) {
              setUsers(clean);
              localStorage.setItem('revit_users', JSON.stringify(clean));
            }
          }
          if (remoteData.schools) {
            const clean = remoteData.schools.filter(s => s && isValidId(s.npsn));
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
            const clean = remoteData.trips.filter(t => t && isValidId(t.id));
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
          if (remoteData.meetings) {
            const clean = remoteData.meetings.filter(m => m && isValidId(m.id)).map(m => {
              if (m && typeof m.pesertaIds === 'string') {
                m.pesertaIds = m.pesertaIds ? m.pesertaIds.split(',') : [];
              }
              return m;
            });
            setMeetings(clean);
            localStorage.setItem('revit_meetings', JSON.stringify(clean));
          }
          if (remoteData.settings) {
            setSettings(prev => ({ ...prev, ...remoteData.settings }));
            localStorage.setItem('revit_settings', JSON.stringify(remoteData.settings));
          }
          setSyncStatus('success');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } catch (err) {
          console.error("Initial load from Sheets failed, using localStorage fallback:", err);
          setSyncStatus('error');
        }
      } else {
        setSyncStatus('offline');
      }
    };

    checkAndFetchInitialData();

    // Active User session if exists
    const storedActiveUser = localStorage.getItem('revit_active_user');
    if (storedActiveUser) setActiveUser(JSON.parse(storedActiveUser));

    // Load Activity Logs
    const storedActivityLogs = localStorage.getItem('revit_activity_logs');
    if (storedActivityLogs) {
      try {
        setActivityLogs(JSON.parse(storedActivityLogs).filter(Boolean));
      } catch {
        setActivityLogs([]);
      }
    } else {
      setActivityLogs([]);
      localStorage.setItem('revit_activity_logs', JSON.stringify([]));
    }

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
    localStorage.removeItem('revit_active_user');
  };

  // 3b. Synchronization Core Functions
  const triggerSync = async (currentState = null) => {
    if (!syncService.isConfigured()) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('connecting');
    try {
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
        activityLogs,
        settings
      };

      await syncService.pushData(stateToPush);
      const remoteData = await syncService.fetchData();

      if (remoteData.users) {
        const clean = remoteData.users.filter(u => u && isValidId(u.id));
        if (clean.length > 0) {
          setUsers(clean);
          localStorage.setItem('revit_users', JSON.stringify(clean));
        }
      }
      if (remoteData.schools) {
        const clean = remoteData.schools.filter(s => s && isValidId(s.npsn));
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
        const clean = remoteData.trips.filter(t => t && isValidId(t.id));
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
      if (remoteData.meetings) {
        const clean = remoteData.meetings.filter(m => m && isValidId(m.id)).map(m => {
          if (m && typeof m.pesertaIds === 'string') {
            m.pesertaIds = m.pesertaIds ? m.pesertaIds.split(',') : [];
          }
          return m;
        });
        setMeetings(clean);
        localStorage.setItem('revit_meetings', JSON.stringify(clean));
      }
      if (remoteData.activity_logs) {
        const clean = remoteData.activity_logs.filter(l => l && isValidId(l.id)).map(l => {
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
        setActivityLogs(clean);
        localStorage.setItem('revit_activity_logs', JSON.stringify(clean));
      }
      if (remoteData.settings) {
        setSettings(prev => ({ ...prev, ...remoteData.settings }));
        localStorage.setItem('revit_settings', JSON.stringify(remoteData.settings));
      }

      setSyncStatus('success');
      setLastSyncTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Sync Error:', error);
      setSyncStatus('error');
    }
  };

  const syncWithNewState = (updatedStateKeys) => {
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
      activityLogs,
      settings,
      ...updatedStateKeys
    };
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
    syncWithNewState({ settings: newSettings });
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

  // 11. Daily Logs Actions (Fase 4)
  const handleAddLog = (newLog) => {
    addActivityLog('add_daily_log', `Menambahkan log harian tanggal ${newLog.tanggal}: ${newLog.aktivitas}`, newLog.foto ? {
      id: newLog.id,
      type: 'daily_log_photo',
      fileName: `Foto_Log_${newLog.tanggal}.jpg`,
      fileData: newLog.foto
    } : null);
    const updated = [...logs, newLog];
    setLogs(updated);
    localStorage.setItem('revit_logs', JSON.stringify(updated));
    syncWithNewState({ logs: updated });
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

  const handleAddMeeting = (newMeeting) => {
    const updated = [...meetings, newMeeting];
    setMeetings(updated);
    localStorage.setItem('revit_meetings', JSON.stringify(updated));
    syncWithNewState({ meetings: updated });
  };

  const handleUpdateMeeting = (updatedMeeting) => {
    const updated = meetings.map((m) => (m.id === updatedMeeting.id ? updatedMeeting : m));
    setMeetings(updated);
    localStorage.setItem('revit_meetings', JSON.stringify(updated));
    syncWithNewState({ meetings: updated });
  };

  const handleDeleteMeeting = (meetingId) => {
    const updated = meetings.filter((m) => m.id !== meetingId);
    setMeetings(updated);
    localStorage.setItem('revit_meetings', JSON.stringify(updated));
    syncWithNewState({ meetings: updated });
  };

  const addActivityLog = (actionType, description, fileRef = null) => {
    if (!activeUser || activeUser.jabatanTim !== 'Fasilitator') return;

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

  // RENDER: Main Dashboard Layout
  return (
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
                {activeView === 'sekolah' && 'Daftar Sekolah'}
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
              </h1>
            </div>
            
            {activeUser ? (
              <div className="flex items-center gap-3 flex-wrap">
                {/* Indikator Sinkronisasi Google Sheets */}
                <button
                  onClick={() => triggerSync()}
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
                  title={lastSyncTime ? `Terakhir sinkronisasi: ${lastSyncTime}. Klik untuk sinkronisasi ulang.` : 'Klik untuk sinkronisasi dengan Google Sheets'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'connecting' ? 'animate-spin' : ''}`} />
                  <span>
                    {syncStatus === 'connecting' && 'Sinkronisasi...'}
                    {syncStatus === 'success' && `Tersambung (${lastSyncTime})`}
                    {syncStatus === 'error' && 'Gagal Sinkronisasi'}
                    {syncStatus === 'offline' && 'Mode Lokal'}
                  </span>
                </button>

                {activeUser && activeUser.jabatanTim === 'Fasilitator' && (
                  <button
                    onClick={() => setIsActivitySidebarOpen(!isActivitySidebarOpen)}
                    className={`flex md:hidden items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
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
              onApproveTrip={handleApproveTrip}
              onRejectTrip={handleRejectTrip}
              onSelectSchool={(npsn) => {
                setSelectedSchoolNpsn(npsn);
                setSchoolDetailReferrer('dashboard');
                setActiveView('sekolah');
              }}
              onViewChange={handleViewChange}
              expenses={expenses}
              payments={payments}
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
                  />
                )
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
                  trips={trips}
                  onAddTrip={handleAddTrip}
                  onApproveTrip={handleApproveTrip}
                  onRejectTrip={handleRejectTrip}
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
                  activeView={activeView}
                />
              )}

              {activeView === 'rapat' && (
                <MeetingManagement
                  meetings={meetings}
                  users={users}
                  activeUser={activeUser}
                  onAddMeeting={handleAddMeeting}
                  onUpdateMeeting={handleUpdateMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
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
      {/* Right Activity Sidebar (Facilitator Only) */}
      {activeUser && activeUser.jabatanTim === 'Fasilitator' && (
        <RightActivitySidebar
          isOpen={isActivitySidebarOpen}
          onClose={() => setIsActivitySidebarOpen(false)}
          logs={activityLogs.filter((l) => l.userId === activeUser.id)}
          onOpenFile={handleOpenActivityFile}
        />
      )}
    </div>
  );
}
