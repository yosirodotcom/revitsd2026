import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
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

  // Session & Nav States
  const [activeUser, setActiveUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedSchoolNpsn, setSelectedSchoolNpsn] = useState(null);
  const [schoolDetailReferrer, setSchoolDetailReferrer] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSelectingUser, setIsSelectingUser] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [settings, setSettings] = useState({
    projectStartDate: '2026-06-12',
    projectEndDate: '2026-12-12',
    simulatedToday: '2026-09-14',
  });

  // 2. Load Initial Data from LocalStorage or seed defaults
  useEffect(() => {
    // Users
    const storedUsers = localStorage.getItem('revit_users');
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      let migrated = false;
      const updatedUsers = parsedUsers.map(u => {
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
        setUsers(parsedUsers);
      }
    } else {
      setUsers(initialUsers);
      localStorage.setItem('revit_users', JSON.stringify(initialUsers));
    }

    // Schools
    const storedSchools = localStorage.getItem('revit_schools');
    if (storedSchools) {
      const parsed = JSON.parse(storedSchools);
      let isUpdated = false;
      const migrated = parsed.map((s) => {
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
        setSchools(parsed);
      }
    } else {
      setSchools(initialSchools);
      localStorage.setItem('revit_schools', JSON.stringify(initialSchools));
    }

    // Contacts
    const storedContacts = localStorage.getItem('revit_contacts');
    if (storedContacts) setContacts(JSON.parse(storedContacts));
    else {
      setContacts([]);
      localStorage.setItem('revit_contacts', JSON.stringify([]));
    }

    // Tasks
    const storedTasks = localStorage.getItem('revit_tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));
    else {
      setTasks([]);
      localStorage.setItem('revit_tasks', JSON.stringify([]));
    }

    // Trips
    const storedTrips = localStorage.getItem('revit_trips');
    if (storedTrips) setTrips(JSON.parse(storedTrips));
    else {
      setTrips([]);
      localStorage.setItem('revit_trips', JSON.stringify([]));
    }

    // Daily Logs
    const storedLogs = localStorage.getItem('revit_logs');
    if (storedLogs) setLogs(JSON.parse(storedLogs));
    else {
      setLogs([]);
      localStorage.setItem('revit_logs', JSON.stringify([]));
    }

    // Monthly PDF Reports
    const storedReports = localStorage.getItem('revit_reports');
    if (storedReports) setReports(JSON.parse(storedReports));
    else {
      setReports([]);
      localStorage.setItem('revit_reports', JSON.stringify([]));
    }

    // Duty Reports
    const storedDutyReports = localStorage.getItem('revit_duty_reports');
    if (storedDutyReports) setDutyReports(JSON.parse(storedDutyReports));
    else {
      setDutyReports([]);
      localStorage.setItem('revit_duty_reports', JSON.stringify([]));
    }

    // Expenses
    const storedExpenses = localStorage.getItem('revit_expenses');
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    else {
      setExpenses([]);
      localStorage.setItem('revit_expenses', JSON.stringify([]));
    }

    // Payments
    const storedPayments = localStorage.getItem('revit_payments');
    if (storedPayments) setPayments(JSON.parse(storedPayments));
    else {
      setPayments([]);
      localStorage.setItem('revit_payments', JSON.stringify([]));
    }

    // School Docs
    const storedSchoolDocs = localStorage.getItem('revit_school_docs');
    if (storedSchoolDocs) setSchoolDocs(JSON.parse(storedSchoolDocs));
    else {
      setSchoolDocs([]);
      localStorage.setItem('revit_school_docs', JSON.stringify([]));
    }

    // Settings
    const storedSettings = localStorage.getItem('revit_settings');
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      if (parsed.projectStartDate === '2027-06-12') parsed.projectStartDate = '2026-06-12';
      if (parsed.projectEndDate === '2027-12-12') parsed.projectEndDate = '2026-12-12';
      if (parsed.simulatedToday === '2027-09-15' || parsed.simulatedToday === '2027-09-14') parsed.simulatedToday = '2026-09-14';
      setSettings(prev => ({ ...prev, ...parsed }));
    } else {
      localStorage.setItem('revit_settings', JSON.stringify({
        projectStartDate: '2026-06-12',
        projectEndDate: '2026-12-12',
        simulatedToday: '2026-09-14',
      }));
    }

    // Active User session if exists
    const storedActiveUser = localStorage.getItem('revit_active_user');
    if (storedActiveUser) setActiveUser(JSON.parse(storedActiveUser));

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

  // 4. Update Settings (Super Admin)
  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('revit_settings', JSON.stringify(newSettings));
  };

  // 5. CRUD Team Members (Super Admin)
  const handleAddUser = (newUser) => {
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('revit_users', JSON.stringify(updated));
  };

  const handleUpdateUser = (updatedUser) => {
    const updated = users.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsers(updated);
    localStorage.setItem('revit_users', JSON.stringify(updated));
    if (activeUser && activeUser.id === updatedUser.id) {
      setActiveUser(updatedUser);
      localStorage.setItem('revit_active_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId) => {
    const updated = users.filter((u) => u.id !== userId);
    setUsers(updated);
    localStorage.setItem('revit_users', JSON.stringify(updated));
    // Reset assigned schools for this user to ensure data consistency
    const updatedSchools = schools.map((s) => s.fasilitatorId === userId ? { ...s, fasilitatorId: null } : s);
    setSchools(updatedSchools);
    localStorage.setItem('revit_schools', JSON.stringify(updatedSchools));
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
  };

  const handleUpdateSchool = (updatedSchool) => {
    const updated = schools.map((s) => (s.npsn === updatedSchool.npsn ? updatedSchool : s));
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
  };

  const handleClaimSchool = (npsn, fasilitatorId) => {
    const updated = schools.map((s) => (s.npsn === npsn ? { ...s, fasilitatorId } : s));
    setSchools(updated);
    localStorage.setItem('revit_schools', JSON.stringify(updated));
  };

  // 8. Contact Actions (Fase 3)
  const handleAddContact = (newContact) => {
    const updated = [...contacts, newContact];
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
  };

  const handleUpdateContact = (updatedContact) => {
    const updated = contacts.map((c) => (c.id === updatedContact.id ? updatedContact : c));
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
  };

  const handleDeleteContact = (contactId) => {
    const updated = contacts.filter((c) => c.id !== contactId);
    setContacts(updated);
    localStorage.setItem('revit_contacts', JSON.stringify(updated));
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
  };

  // 9. Task Actions (Fase 3)
  const handleAddTask = (newTask) => {
    const updated = [...tasks, newTask];
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
  };

  const handleUpdateTaskStatus = (taskId, status) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
  };

  const handleDeleteTask = (taskId) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem('revit_tasks', JSON.stringify(updated));
  };

  // 10. Trip Actions (Fase 3 & 4)
  const handleAddTrip = (newTrip) => {
    const updated = Array.isArray(newTrip) ? [...trips, ...newTrip] : [...trips, newTrip];
    setTrips(updated);
    localStorage.setItem('revit_trips', JSON.stringify(updated));
  };

  const handlePayTrip = (tripId, newExpense) => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { ...t, isPaid: true } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('revit_expenses', JSON.stringify(updatedExpenses));
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
  };

  const handleRejectTrip = (tripId) => {
    const updatedTrips = trips.map((t) => (t.id === tripId ? { 
      ...t, 
      statusPersetujuan: 'rejected',
      approvedBySuperAdmin: false
    } : t));
    setTrips(updatedTrips);
    localStorage.setItem('revit_trips', JSON.stringify(updatedTrips));
  };

  // 11. Daily Logs Actions (Fase 4)
  const handleAddLog = (newLog) => {
    const updated = [...logs, newLog];
    setLogs(updated);
    localStorage.setItem('revit_logs', JSON.stringify(updated));
  };

  // 12. Monthly Reports PDF Actions (Fase 4)
  const handleAddReport = (newReport) => {
    // Overwrite if same month exists
    const updated = reports.filter(r => !(r.userId === newReport.userId && r.bulanKe === newReport.bulanKe));
    updated.push(newReport);
    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
  };

  const handleDeleteReport = (reportId) => {
    const updated = reports.filter(r => r.id !== reportId);
    setReports(updated);
    localStorage.setItem('revit_reports', JSON.stringify(updated));
  };

  // 13. Duty Reports Actions (Fase 4)
  const handleSaveDutyReport = (newReport) => {
    const updated = dutyReports.filter(r => !(r.userId === newReport.userId && r.dutyIndex === newReport.dutyIndex));
    updated.push(newReport);
    setDutyReports(updated);
    localStorage.setItem('revit_duty_reports', JSON.stringify(updated));
  };

  // 14. Expense Actions (Fase 4)
  const handleAddExpense = (newExpense) => {
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    localStorage.setItem('revit_expenses', JSON.stringify(updated));
  };

  const handleDeleteExpense = (expenseId) => {
    const updated = expenses.filter(e => e.id !== expenseId);
    setExpenses(updated);
    localStorage.setItem('revit_expenses', JSON.stringify(updated));
  };

  const handleAddPayment = (newPayment, newExpense) => {
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    localStorage.setItem('revit_payments', JSON.stringify(updatedPayments));

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('revit_expenses', JSON.stringify(updatedExpenses));
  };

  const handleAddSchoolDoc = (newDoc) => {
    const updated = [...schoolDocs, newDoc];
    setSchoolDocs(updated);
    localStorage.setItem('revit_school_docs', JSON.stringify(updated));
  };

  const handleDeleteSchoolDoc = (docId) => {
    const updated = schoolDocs.filter(d => d.id !== docId);
    setSchoolDocs(updated);
    localStorage.setItem('revit_school_docs', JSON.stringify(updated));
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
                {activeView === 'sekolah' && 'Dashboard Pendampingan Sekolah'}
                {activeView === 'kontak' && 'Manajemen Kontak Mitra Lapangan'}
                {activeView === 'dinas' && 'Jadwal Perjalanan Dinas'}
                {activeView === 'tanggung-jawab' && 'Pelaporan Tanggung Jawab Saya'}
                {activeView === 'laporan-bulanan' && 'Laporan Bulanan PDF'}
                 {activeView === 'pantau-tanggung-jawab' && 'Pantau Tugas Tim'}
                {activeView === 'pantau-honor' && 'Pantau & Bayar Honorarium'}
                {activeView === 'keuangan' && 'Rekapitulasi Keuangan Proyek'}
                {activeView === 'kelola-fasilitator' && 'Kelola Tugas Fasilitator'}
              </h1>
            </div>
            
            {activeUser ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Sesi Aktif:</span>
                <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeUser.nama}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsSelectingUser(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                Masuk ke Sistem
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

              {(activeView === 'pantau-honor' || activeView === 'keuangan') && (
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
    </div>
  );
}
