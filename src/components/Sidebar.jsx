import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  Contact, 
  FileCheck, 
  FileText, 
  CalendarClock, 
  Calendar,
  CircleDollarSign, 
  LogOut, 
  UserCog,
  ShieldAlert,
  Settings,
  BadgeCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activeUser, activeView, onViewChange, onEditProfile, onManageDocuments, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const cached = localStorage.getItem('revit_sidebar_collapsed');
    return cached === null ? true : cached === 'true';
  });

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('revit_sidebar_collapsed', String(nextState));
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
    { id: 'sekolah', name: 'Kelola Sekolah', icon: School, roles: ['*'] },
    { id: 'tanggung-jawab', name: 'Tanggung Jawab Saya', icon: FileCheck, roles: ['Ketua Tim', 'Koordinator', 'Fasilitator', 'Tenaga Administrasi'] },
    { id: 'laporan-bulanan', name: 'Laporan Bulanan', icon: FileText, roles: ['Ketua Tim', 'Koordinator', 'Fasilitator'] },
    { id: 'dinas', name: 'Jadwal Perjalanan Dinas', icon: CalendarClock, roles: ['Fasilitator', 'Koordinator', 'Super Admin'] },
    { id: 'rapat', name: activeUser.jabatanTim === 'Super Admin' ? 'Kelola Rapat' : 'Agenda Rapat', icon: Calendar, roles: ['*'] },
    { id: 'logs-harian', name: 'Log Harian Lapangan', icon: FileText, roles: ['*'] },
    
    // Keuangan & Pemantauan (Administrasi / Admin)
    { id: 'settings-anggaran', name: 'Pengaturan Anggaran', icon: Settings, roles: ['Tenaga Administrasi', 'Super Admin'] },
    { id: 'bayar-honor', name: 'Bayar Honor', icon: CircleDollarSign, roles: ['Tenaga Administrasi', 'Super Admin'] },
    { id: 'batch-honor', name: 'Batch Lunas Honor', icon: BadgeCheck, roles: ['Tenaga Administrasi', 'Super Admin'] },
    
    // Super Admin Only
    { id: 'pantau-tanggung-jawab', name: 'Pantau Tugas Tim', icon: ShieldAlert, roles: ['Super Admin'] },
    { id: 'kelola-tim', name: 'Kelola Anggota Tim', icon: Users, roles: ['Super Admin'] },
    { id: 'kelola-fasilitator', name: 'Kelola Fasilitator', icon: UserCog, roles: ['Super Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (activeUser?.jabatanTim === 'Tenaga Administrasi') {
      return ['dashboard', 'logs-harian', 'settings-anggaran', 'batch-honor'].includes(item.id);
    }
    if (item.roles.includes('*')) return true;
    if (activeUser.role === 'admin' && (item.roles.includes('Super Admin') || item.id === 'pantau-honor' || item.id === 'pantau-tanggung-jawab' || item.id === 'batch-honor')) return true;
    if (item.id === 'tanggung-jawab' && ['Fasilitator', 'Ketua Tim', 'Koordinator'].includes(activeUser.jabatanTim)) return false;
    return item.roles.includes(activeUser.jabatanTim);
  });

  return (
    <div className={`sidebar-container ${isCollapsed ? 'w-20' : 'w-72'} bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 text-slate-300 select-none transition-all duration-300 relative`}>
      
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute top-1/2 -translate-y-1/2 -right-3 w-6 h-6 rounded-full bg-white border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-400 flex items-center justify-center shadow-md transition-all duration-200 hover:bg-indigo-50 z-50 cursor-pointer"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Profile Section */}
      <div className={`p-6 border-b border-slate-800/80 flex flex-col ${isCollapsed ? 'items-center px-2' : ''}`}>
        <div className="flex items-center gap-3 group relative w-full justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10 shrink-0">
            {getInitials(activeUser.nama)}
          </div>
          {!isCollapsed ? (
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-100 text-sm truncate leading-tight">
                {activeUser.nama}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {activeUser.jabatanTim}
              </p>
            </div>
          ) : (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              <div className="font-semibold">{activeUser.nama}</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {activeUser.jabatanTim}
              </div>
            </div>
          )}
        </div>

        {!isCollapsed ? (
          <>
            {/* Edit Profile Button */}
            <button
              onClick={onEditProfile}
              className="mt-4 w-full px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <UserCog className="w-3.5 h-3.5" /> Ubah Profil
            </button>

            {/* Personnel Documents Button */}
            <button
              onClick={onManageDocuments}
              className="mt-2 w-full px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Dokumen Personil
            </button>
          </>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={onEditProfile}
              className="w-10 h-10 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 group relative cursor-pointer"
            >
              <UserCog className="w-4 h-4" />
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                Ubah Profil
              </div>
            </button>

            <button
              onClick={onManageDocuments}
              className="w-10 h-10 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200 group relative cursor-pointer"
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                Dokumen Personil
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className={`flex-1 py-4 overflow-y-auto space-y-1 no-scrollbar flex flex-col justify-between ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Menu Navigasi
            </div>
          )}
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center rounded-xl text-xs font-medium transition-all duration-200 group relative cursor-pointer ${
                  isCollapsed ? 'justify-center h-10 w-10 mx-auto' : 'w-full gap-3 px-3 py-2'
                } ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-650/10' 
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
                
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                    {item.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {['Fasilitator', 'Ketua Tim', 'Koordinator'].includes(activeUser.jabatanTim) && (
          !isCollapsed ? (
            <div className="mt-6 p-4 rounded-2xl bg-slate-950/40 border border-slate-850 text-[11px] space-y-2.5">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-xs select-none">
                <FileCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Catatan Tanggung Jawab</span>
              </div>
              <p className="leading-relaxed text-[10px] text-slate-400 select-none">
                Harap pantau dan laporkan progres kewajiban peran bulanan Anda secara berkala.
              </p>
              <button
                onClick={() => onViewChange('tanggung-jawab')}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer border-0 ${
                  activeView === 'tanggung-jawab'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                Pelaporan Tanggung Jawab Saya
              </button>
            </div>
          ) : (
            <button
              onClick={() => onViewChange('tanggung-jawab')}
              className={`w-10 h-10 mx-auto mt-4 flex items-center justify-center rounded-xl transition-all duration-200 group relative cursor-pointer border-0 ${
                activeView === 'tanggung-jawab'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-850'
              }`}
            >
              <FileCheck className="w-4 h-4 shrink-0" />
              <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                Tanggung Jawab Saya
              </div>
            </button>
          )
        )}
      </div>

      {/* Footer / Logout */}
      <div className={`p-4 border-t border-slate-800/80 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
        <button
          onClick={onLogout}
          className={`transition-all duration-200 cursor-pointer ${
            isCollapsed 
              ? 'w-10 h-10 flex items-center justify-center rounded-xl border border-slate-800 hover:border-rose-900/30 bg-slate-950/20 hover:bg-rose-950/10 text-slate-400 hover:text-rose-450 group relative' 
              : 'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-800 hover:border-rose-900/30 bg-slate-950/20 hover:bg-rose-950/10 text-slate-400 hover:text-rose-400'
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Keluar Sesi</span>}
          {isCollapsed && (
            <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-slate-100 text-xs rounded-lg shadow-lg border border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              Keluar Sesi
            </div>
          )}
        </button>
        {!isCollapsed && (
          <div className="text-center text-[9px] text-slate-600 mt-3">
            Revitalisasi Sekolah Dasar © 2026
          </div>
        )}
      </div>

    </div>
  );
}
