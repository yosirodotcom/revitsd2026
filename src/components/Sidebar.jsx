import React from 'react';
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
  ShieldAlert
} from 'lucide-react';

export default function Sidebar({ activeUser, activeView, onViewChange, onEditProfile, onManageDocuments, onLogout }) {
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
    { id: 'sekolah', name: 'Daftar Sekolah', icon: School, roles: ['*'] },
    { id: 'tanggung-jawab', name: 'Tanggung Jawab Saya', icon: FileCheck, roles: ['Ketua Tim', 'Koordinator', 'Fasilitator', 'Tenaga Administrasi'] },
    { id: 'laporan-bulanan', name: 'Laporan Bulanan', icon: FileText, roles: ['Ketua Tim', 'Koordinator', 'Fasilitator'] },
    { id: 'dinas', name: 'Jadwal Perjalanan Dinas', icon: CalendarClock, roles: ['Fasilitator', 'Koordinator', 'Super Admin'] },
    { id: 'rapat', name: activeUser.jabatanTim === 'Super Admin' ? 'Kelola Rapat' : 'Agenda Rapat', icon: Calendar, roles: ['*'] },
    
    // Keuangan & Pemantauan (Administrasi / Admin)
    { id: 'pantau-honor', name: 'Pantau & Bayar Honor', icon: CircleDollarSign, roles: ['Tenaga Administrasi', 'Super Admin'] },
    { id: 'keuangan', name: 'Rekapitulasi Keuangan', icon: CircleDollarSign, roles: ['Tenaga Administrasi', 'Super Admin'] },
    
    // Super Admin Only
    { id: 'pantau-tanggung-jawab', name: 'Pantau Tugas Tim', icon: ShieldAlert, roles: ['Super Admin'] },
    { id: 'kelola-tim', name: 'Kelola Anggota Tim', icon: Users, roles: ['Super Admin'] },
    { id: 'kelola-fasilitator', name: 'Kelola Fasilitator', icon: UserCog, roles: ['Super Admin'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (item.roles.includes('*')) return true;
    if (activeUser.role === 'admin' && (item.roles.includes('Super Admin') || item.id === 'pantau-honor' || item.id === 'keuangan' || item.id === 'pantau-tanggung-jawab')) return true;
    if (item.id === 'tanggung-jawab' && ['Fasilitator', 'Ketua Tim', 'Koordinator'].includes(activeUser.jabatanTim)) return false;
    return item.roles.includes(activeUser.jabatanTim);
  });

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 text-slate-300 select-none">
      
      {/* Profile Section */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            {getInitials(activeUser.nama)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-100 text-sm truncate leading-tight">
              {activeUser.nama}
            </h4>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {activeUser.jabatanTim}
            </p>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={onEditProfile}
          className="mt-4 w-full px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          <UserCog className="w-3.5 h-3.5" /> Ubah Profil
        </button>

        {/* Personnel Documents Button */}
        <button
          onClick={onManageDocuments}
          className="mt-2 w-full px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80 text-[11px] font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" /> Dokumen Personil
        </button>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 overflow-y-auto px-4 space-y-1 no-scrollbar flex flex-col justify-between">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Menu Navigasi
          </div>
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-indigo-650 text-white shadow-lg shadow-indigo-650/10' 
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </div>

        {['Fasilitator', 'Ketua Tim', 'Koordinator'].includes(activeUser.jabatanTim) && (
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
                  ? 'bg-indigo-650 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Pelaporan Tanggung Jawab Saya
            </button>
          </div>
        )}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border border-slate-800 hover:border-rose-900/30 bg-slate-950/20 hover:bg-rose-950/10 text-slate-400 hover:text-rose-400 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Keluar Sesi
        </button>
        <div className="text-center text-[9px] text-slate-600 mt-3">
          Revitalisasi Sekolah Dasar © 2026
        </div>
      </div>

    </div>
  );
}
