import React from 'react';
import { User, Shield, Briefcase, Award, X } from 'lucide-react';

export default function UserSelect({ users, onSelectUser, onClose }) {
  // Helper to get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper to get role/status badge color classes
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PNS':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PPPK':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Alumni':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Ketua Tim':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Koordinator':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Fasilitator':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'Tenaga Administrasi':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const isPopup = typeof onClose === 'function';

  return (
    <div className={isPopup 
      ? "bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-h-[85vh] overflow-y-auto w-full select-none animate-fade-in shadow-2xl relative text-slate-100"
      : "min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none animate-fade-in"
    }>
      {/* Close Button for popup mode */}
      {isPopup && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="max-w-5xl w-full text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-2">
          Pilih Akun Simulasi
        </h1>
        <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto">
          Silakan pilih profil di bawah ini untuk mensimulasikan hak akses dan fitur sesuai peran masing-masing anggota.
        </p>
      </div>

      <div className={isPopup 
        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl w-full"
        : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl w-full"
      }>
        {users.map((user) => (
          <div
            key={user.id}
            onClick={() => onSelectUser(user)}
            className="group relative bg-slate-900/40 backdrop-blur-md border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col justify-between"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:to-pink-500/5 rounded-2xl transition-all duration-500 ease-in-out -z-10" />

            <div>
              {/* Header: Avatar / Initials */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700/50 flex items-center justify-center font-bold text-lg text-indigo-400 group-hover:from-indigo-600 group-hover:to-indigo-400 group-hover:text-white transition-all duration-300 border border-slate-700/30">
                  {getInitials(user.nama)}
                </div>
                {user.role === 'admin' ? (
                  <Shield className="w-5 h-5 text-rose-400/80 group-hover:text-rose-400 transition-colors" />
                ) : (
                  <User className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                )}
              </div>

              {/* Body: Name & Kepegawaian */}
              <h3 className="font-semibold text-slate-200 group-hover:text-white text-base leading-tight mb-1 transition-colors">
                {user.nama}
              </h3>
              <p className="text-xs text-slate-500 group-hover:text-slate-400 line-clamp-2 mb-3 h-8 transition-colors">
                {user.jabatanKepegawaian !== '-' ? user.jabatanKepegawaian : 'Personil Lapangan'}
              </p>
            </div>

            {/* Footer: Badges */}
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-1.5">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.jabatanTim)}`}>
                {user.jabatanTim}
              </span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getStatusBadgeColor(user.statusPegawai)}`}>
                {user.statusPegawai}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-[11px] text-slate-600">
        Monitoring System v1.0.0 • Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi
      </div>
    </div>
  );
}
