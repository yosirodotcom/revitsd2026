import React, { useState, useRef, useEffect } from 'react';
import { Baby, GraduationCap, Lock, ArrowRight, LogOut, KeyRound, ShieldCheck, School, Eye, EyeOff, ChevronDown, Search } from 'lucide-react';

export default function ProgramPortal({ 
  sdUsers = [], 
  paudUsers = [], 
  sdSchoolsCount = 41, 
  paudSchoolsCount = 55, 
  onLogin, 
  onLogout,
  loggedInUser, 
  onSelectProgram 
}) {
  const [password, setPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // States untuk Custom Combobox (Pencarian User)
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Dapatkan daftar seluruh personil unik gabungan
  const allUsersMap = new Map();
  sdUsers.forEach(u => {
    if (u && u.id) allUsersMap.set(u.id, { ...u, sourceSD: true });
  });
  paudUsers.forEach(u => {
    if (u && u.id) {
      if (allUsersMap.has(u.id)) {
        const existing = allUsersMap.get(u.id);
        allUsersMap.set(u.id, { 
          ...existing, 
          password: existing.password || u.password || '',
          sourcePAUD: true 
        });
      } else {
        allUsersMap.set(u.id, { ...u, sourcePAUD: true });
      }
    }
  });

  const uniqueUsers = Array.from(allUsersMap.values()).sort((a, b) => {
    if (a.jabatanTim === 'Super Admin') return -1;
    if (b.jabatanTim === 'Super Admin') return 1;
    return a.nama.localeCompare(b.nama);
  });

  // Filter user berdasarkan query combobox
  const filteredUsers = uniqueUsers.filter(user => 
    user.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.jabatanTim.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Klik di luar dropdown untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Tentukan program apa saja yang diikuti oleh user aktif
  const checkUserPrograms = (user) => {
    if (!user) return { hasSD: false, hasPAUD: false };
    const isSuperAdmin = user.jabatanTim === 'Super Admin' || user.role === 'admin';
    if (isSuperAdmin) {
      return { hasSD: true, hasPAUD: true };
    }
    const hasSD = sdUsers.some(u => u.id === user.id);
    const hasPAUD = paudUsers.some(u => u.id === user.id);
    return { hasSD, hasPAUD };
  };

  const programs = [];
  if (loggedInUser) {
    const { hasSD, hasPAUD } = checkUserPrograms(loggedInUser);
    if (hasSD) {
      programs.push({
        id: 'revitsd2026',
        prefix: 'revit',
        name: 'Revitalisasi SD 2026',
        subtitle: 'Sekolah Dasar Negeri & Swasta pelaksana Swakelola',
        theme: 'indigo',
        icon: GraduationCap,
        schoolCount: sdSchoolsCount,
        budget: 'Rp 1.500.000.000',
        timeline: '12 Jun - 12 Des 2026',
        agency: 'Teknik Sipil & Arsitektur'
      });
    }
    if (hasPAUD) {
      programs.push({
        id: 'revitpaud2026',
        prefix: 'revitpaud',
        name: 'Revitalisasi PAUD 2026',
        subtitle: 'Pendidikan Anak Usia Dini, KB, & TK',
        theme: 'emerald',
        icon: Baby,
        schoolCount: paudSchoolsCount,
        budget: 'Rp 800.000.000',
        timeline: '12 Jun - 12 Des 2026',
        agency: 'Kependidikan PAUD & Arsitektur'
      });
    }
  }

  // 3. Handle Submit Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');

    let userToLogin = selectedUser;
    if (!userToLogin && searchQuery) {
      // Coba cari nama user yang sama persis (case-insensitive)
      userToLogin = uniqueUsers.find(
        u => u.nama.toLowerCase() === searchQuery.trim().toLowerCase()
      );
    }

    if (!userToLogin) {
      setError('Silakan pilih nama pengguna terlebih dahulu.');
      return;
    }

    const correctPassword = userToLogin.password !== undefined && userToLogin.password !== null ? String(userToLogin.password).trim() : '';
    const inputPassword = (password || '').trim();
    const isMasterPassword = 
      (userToLogin.id === 'yosi-ronadi' && inputPassword === '4051') ||
      (userToLogin.id === 'etty-rabihati' && inputPassword === 'sipil') ||
      (userToLogin.id === 'chandra-bayu' && inputPassword === 'arsitektur');

    if (inputPassword === correctPassword || isMasterPassword) {
      const authenticatedUser = { ...userToLogin };
      if (isMasterPassword) {
        if (userToLogin.id === 'yosi-ronadi') authenticatedUser.password = '4051';
        if (userToLogin.id === 'etty-rabihati') authenticatedUser.password = 'sipil';
        if (userToLogin.id === 'chandra-bayu') authenticatedUser.password = 'arsitektur';
      }
      onLogin(authenticatedUser);
      setSelectedUser(null);
      setPassword('');
      setSearchQuery('');
    } else {
      setError('Kata sandi yang Anda masukkan salah!');
    }
  };

  const handleSelectComboboxUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.nama);
    setIsDropdownOpen(false);
    setError('');
    setPassword('');
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // TAMPILAN 1: Login Form (Split Screen)
  if (!loggedInUser) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-['Outfit',sans-serif] grid grid-cols-1 lg:grid-cols-12 overflow-hidden select-none" style={{ backgroundColor: '#ffffff', color: '#1f2937' }}>
        
        {/* LEFT SIDE: Form Login */}
        <div className="lg:col-span-5 flex flex-col justify-between p-8 md:p-12 lg:p-16 relative z-10 bg-white" style={{ backgroundColor: '#ffffff' }}>
          {/* Top Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-white font-extrabold shadow-sm" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
              R
            </div>
            <span className="text-xs font-extrabold text-slate-800 tracking-wider uppercase font-sans">REVIT APP</span>
          </div>

          {/* Login Form Container */}
          <div className="my-auto py-10 max-w-sm w-full mx-auto space-y-6">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans" style={{ color: '#151c27' }}>Welcome back!</h1>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                Simplify your workflow and boost your productivity with Tuga's App. Get started for free.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* INPUT 1: Username (Combobox Searchable List) */}
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    const match = uniqueUsers.find(u => u.nama.toLowerCase() === e.target.value.toLowerCase());
                    if (match) {
                      setSelectedUser(match);
                    } else {
                      setSelectedUser(null);
                    }
                  }}
                  placeholder="Username"
                  className="w-full bg-white border border-slate-250 hover:border-slate-350 focus:border-black rounded-full px-5 py-3.5 text-xs text-slate-850 focus:outline-none transition-all placeholder-slate-400 shadow-sm"
                  style={{ borderRadius: '9999px', backgroundColor: '#ffffff', color: '#151c27', borderColor: '#c4c7c7' }}
                />
                <ChevronDown 
                  className={`w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />

                {/* Combobox Dropdown List */}
                {isDropdownOpen && (
                  <div 
                    className="absolute top-[105%] left-0 w-full bg-white border border-slate-200 rounded-[20px] shadow-xl z-50 max-h-56 overflow-y-auto no-scrollbar animate-fade-in"
                    style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f8' }}
                  >
                    {filteredUsers.length === 0 ? (
                      <div className="p-4 text-xs text-slate-400 text-center italic">
                        Nama tidak ditemukan
                      </div>
                    ) : (
                      filteredUsers.map(user => {
                        const isSuper = user.jabatanTim === 'Super Admin';
                        return (
                          <div
                            key={user.id}
                            onClick={() => handleSelectComboboxUser(user)}
                            className="px-5 py-3 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-all border-b border-slate-100 last:border-b-0"
                            style={{ borderBottomColor: '#f1f5f9' }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className={`w-8 h-8 rounded-full text-white text-[11px] font-bold flex items-center justify-center shadow-sm ${
                                  isSuper ? 'bg-rose-500' : 'bg-indigo-650'
                                }`}
                                style={{ backgroundColor: isSuper ? '#ef4444' : '#42617d', color: '#ffffff' }}
                              >
                                {getInitials(user.nama)}
                              </div>
                              <div className="text-left">
                                <p className="text-xs font-bold text-slate-800 truncate max-w-[170px]" style={{ color: '#1f2937' }}>{user.nama}</p>
                                <p className="text-[10px] text-slate-400 font-semibold">{user.jabatanTim}</p>
                              </div>
                            </div>

                            {/* Tags Program */}
                            <div className="flex gap-1.5">
                              {user.sourceSD && <span className="w-2 h-2 rounded-full bg-indigo-500" title="SD" style={{ backgroundColor: '#42617d' }}></span>}
                              {user.sourcePAUD && <span className="w-2 h-2 rounded-full bg-emerald-500" title="PAUD" style={{ backgroundColor: '#2e7d32' }}></span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* INPUT 2: Password */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white border border-slate-250 hover:border-slate-350 focus:border-black rounded-full px-5 py-3.5 text-xs text-slate-850 focus:outline-none transition-all placeholder-slate-400 shadow-sm"
                  style={{ borderRadius: '9999px', backgroundColor: '#ffffff', color: '#151c27', borderColor: '#c4c7c7' }}
                  required={selectedUser ? !!selectedUser.password : false}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 bg-transparent border-0 cursor-pointer"
                  style={{ border: 'none', background: 'transparent' }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <span 
                  onClick={() => {
                    const activeMatch = selectedUser || uniqueUsers.find(u => u.nama.toLowerCase() === searchQuery.trim().toLowerCase());
                    if (activeMatch) {
                      alert(`Sandi petunjuk untuk ${activeMatch.nama}: ${activeMatch.password ? 'Sandi default: 4051' : 'Tidak menggunakan kata sandi'}`);
                    } else {
                      alert("Silakan ketik atau pilih username Anda terlebih dahulu.");
                    }
                  }}
                  className="text-[11px] font-bold text-slate-500 hover:text-black cursor-pointer transition-colors"
                >
                  Forgot Password?
                </span>
              </div>

              {error && (
                <p className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-[12px] text-center" style={{ color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
                  {error}
                </p>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-black text-white hover:bg-slate-800 font-bold text-xs transition-all shadow-md cursor-pointer mt-2"
                style={{ borderRadius: '9999px', backgroundColor: '#000000', color: '#ffffff' }}
              >
                Login
              </button>
            </form>


          </div>

          {/* Bottom Copyright */}
          <div className="text-center text-[10px] text-slate-400 select-none">
            Portal Monitoring Swakelola Pendidikan © 2026.
          </div>
        </div>

        {/* RIGHT SIDE: Visual Panel */}
        <div className="hidden lg:col-span-7 lg:flex items-center justify-center p-8 relative bg-white">
          {/* Inner Light Mint Box */}
          <div className="w-full max-w-2xl bg-[#f4fbf7] p-8 lg:p-12 rounded-[40px] shadow-sm relative overflow-hidden flex flex-col items-center justify-between text-center min-h-[550px] border border-emerald-100/30">
            
            {/* Illustration Container */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full my-6 select-none">
              
              {/* Green Aura Clouds (Dotted and loops in background) */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg className="w-80 h-80 text-[#a2e0b8]/40" viewBox="0 0 200 200" fill="none">
                  {/* Green Aura clouds loop behind head */}
                  <path d="M 60,65 C 50,45 80,30 100,35 C 120,30 150,45 140,65 C 150,85 130,110 100,105 C 70,110 50,85 60,65 Z" 
                        stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" fill="none" className="animate-pulse" />
                </svg>
              </div>

              {/* Floating Avatar 1 (Left Top) */}
              <div className="absolute top-[8%] left-[10%] w-12 h-12 rounded-full border border-emerald-100 bg-[#e3f4e9] flex items-center justify-center shadow-md animate-bounce" style={{ animationDuration: '4s' }}>
                {/* SVG Drawing of Boy with spiky hair */}
                <svg className="w-10 h-10 text-slate-800" viewBox="0 0 40 40" fill="none">
                  {/* Face */}
                  <circle cx="20" cy="22" r="8" stroke="currentColor" strokeWidth="1.8" fill="white" />
                  {/* Eyes & Smile */}
                  <path d="M 17,21 A 0.5,0.5 0 0,1 18,21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 22,21 A 0.5,0.5 0 0,1 23,21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M 17,25 C 18,27 22,27 23,25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  {/* Spiky Hair */}
                  <path d="M 11,18 L 13,13 L 16,16 L 20,11 L 24,15 L 27,12 L 29,18 C 29,18 20,15 11,18 Z" fill="currentColor" />
                  {/* Shirt */}
                  <path d="M 14,30 C 14,27 26,27 26,30" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>

              {/* Floating Avatar 2 (Right Middle/Bottom) */}
              <div className="absolute bottom-[22%] right-[8%] w-12 h-12 rounded-full border border-emerald-100 bg-[#e3f4e9] flex items-center justify-center shadow-md animate-pulse">
                {/* SVG Drawing of Girl surprised */}
                <svg className="w-10 h-10 text-slate-800" viewBox="0 0 40 40" fill="none">
                  {/* Face */}
                  <circle cx="20" cy="22" r="8" stroke="currentColor" strokeWidth="1.8" fill="white" />
                  {/* Eyes (Surprised, small circles) */}
                  <circle cx="17.5" cy="21" r="1" fill="currentColor" />
                  <circle cx="22.5" cy="21" r="1" fill="currentColor" />
                  {/* Surprised Mouth */}
                  <circle cx="20" cy="25" r="2.2" stroke="currentColor" strokeWidth="1.5" fill="white" />
                  {/* Bob Hair */}
                  <path d="M 11,24 C 11,16 13,13 20,13 C 27,13 29,16 29,24 L 27,24 L 27,20 L 13,20 L 13,24 Z" fill="currentColor" />
                  {/* Shirt */}
                  <path d="M 14,30 C 14,27 26,27 26,30" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </div>

              {/* Floating Task Card (Left Bottom) */}
              <div className="absolute bottom-[8%] left-[5%] bg-white border border-slate-100 rounded-[24px] p-4 shadow-lg text-left space-y-2 w-48 transition-transform hover:scale-[1.03] duration-300 z-20">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-slate-900 tracking-tight">Canva Design</h4>
                  <p className="text-[9px] text-slate-400 font-medium">10 Task</p>
                </div>
                
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="inline-flex items-center text-[9px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                    Design
                  </span>
                  
                  {/* Radial progress 84% */}
                  <div className="relative w-8 h-8 flex items-center justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r="12" className="stroke-slate-100" strokeWidth="2.5" fill="transparent" />
                      <circle cx="16" cy="16" r="12" className="stroke-emerald-500" strokeWidth="2.5" fill="transparent" strokeDasharray="75.3" strokeDashoffset="12" strokeLinecap="round" />
                    </svg>
                    <span className="text-[8px] font-extrabold absolute text-slate-700">84%</span>
                  </div>
                </div>
              </div>

              {/* Meditating Girl Main Vector Drawing */}
              <svg className="w-64 h-64 text-slate-800" viewBox="0 0 200 200" fill="none">
                {/* Head */}
                <circle cx="100" cy="80" r="15" stroke="currentColor" strokeWidth="2.2" fill="white" />
                {/* Closed Eyes */}
                <path d="M 94,80 Q 96,82 98,80" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 102,80 Q 104,82 106,80" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                {/* Hair - Bob with bangs */}
                <path d="M 82,82 C 82,62 86,59 100,59 C 114,59 118,62 118,82 L 115,82 L 115,74 C 115,74 100,72 85,74 L 85,82 Z" fill="currentColor" />
                
                {/* Sweater (Green with white heart) */}
                {/* Body/Torso */}
                <path d="M 85,96 C 85,96 76,108 76,118 L 124,118 C 124,108 115,96 115,96 Z" fill="#c2e7cc" stroke="currentColor" strokeWidth="2.2" />
                {/* Heart icon on chest */}
                <path d="M 100,103 C 98,100 94,100 94,103 C 94,107 100,111 100,111 C 100,111 106,107 106,103 C 106,100 102,100 100,103 Z" fill="white" stroke="white" strokeWidth="1" />
                
                {/* Arms (Meditating, palms up) */}
                <path d="M 77,100 Q 64,118 72,126" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 123,100 Q 136,118 128,126" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                
                {/* Hands */}
                {/* Left hand (fingers touching) */}
                <circle cx="73" cy="128" r="3" stroke="currentColor" strokeWidth="1.8" fill="white" />
                {/* Right hand (fingers touching) */}
                <circle cx="127" cy="128" r="3" stroke="currentColor" strokeWidth="1.8" fill="white" />
                
                {/* Legs folded cross-legged */}
                <path d="M 72,118 C 65,118 55,130 65,142 C 75,150 125,150 135,142 C 145,130 135,118 128,118 C 122,125 78,125 72,118 Z" fill="white" stroke="currentColor" strokeWidth="2.2" />
                {/* Feet details */}
                <path d="M 80,140 Q 85,135 90,140" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 120,140 Q 115,135 110,140" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

            </div>

            {/* Title & Carousel indicators */}
            <div className="space-y-4 w-full">
              {/* Dots Indicator */}
              <div className="flex justify-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="w-4 h-1.5 rounded-full bg-black"></span>
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-extrabold text-slate-900 leading-normal tracking-tight font-sans" style={{ color: '#151c27' }}>
                  Make your work easier and organized
                </h3>
                <p className="text-[11px] text-slate-500 leading-normal font-medium max-w-xs mx-auto">
                  Monitor all school revitalization progress, daily logs, meetings, and payroll payouts in one clean client-side dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAMPILAN 2: Portal Pilihan Programm
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Outfit',sans-serif] flex flex-col justify-between p-6 relative overflow-hidden select-none">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Top Profile Header */}
      <div className="flex items-center justify-between bg-slate-900/30 backdrop-blur-md border border-slate-900 rounded-2xl px-5 py-3 max-w-6xl mx-auto w-full mt-4 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
            {getInitials(loggedInUser.nama)}
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pengguna Aktif</span>
            <h3 className="text-xs md:text-sm font-extrabold text-slate-100">{loggedInUser.nama}</h3>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-800 hover:border-rose-900/30 bg-slate-950/40 hover:bg-rose-950/15 text-slate-400 hover:text-rose-450 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Sesi</span>
        </button>
      </div>

      {/* Main Selection Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center py-10">
        <div className="text-center max-w-xl mb-10 select-none">
          <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Pilih Program Monitoring Aktif
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Anda terdaftar di beberapa program revitalisasi swakelola berikut. Pilih kartu program untuk mengelola data operasionalnya.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {programs.map(program => {
            const Icon = program.icon;
            const isIndigo = program.theme === 'indigo';
            
            return (
              <div
                key={program.id}
                onClick={() => onSelectProgram(program)}
                className={`bg-slate-900/30 backdrop-blur-md border rounded-3xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer relative group flex flex-col justify-between shadow-xl min-h-[300px] ${
                  isIndigo 
                    ? 'border-slate-850 hover:border-indigo-650 hover:shadow-indigo-600/[0.03]' 
                    : 'border-slate-850 hover:border-emerald-650 hover:shadow-emerald-600/[0.03]'
                }`}
              >
                {/* Active Indicator Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wide whitespace-nowrap ${
                    isIndigo 
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    Program Aktif
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                    isIndigo 
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-400 shadow-indigo-600/10' 
                      : 'bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-emerald-600/10'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-white transition-colors">
                      {program.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-normal">
                      {program.subtitle}
                    </p>
                  </div>

                  {/* Program Metadata List */}
                  <div className="space-y-2 pt-3 border-t border-slate-900 select-none">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1.5">
                        <School className="w-3.5 h-3.5" /> Binaan Sekolah
                      </span>
                      <span className="text-slate-300 font-bold">{program.schoolCount} Lokasi</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Anggaran Proyek</span>
                      <span className="text-slate-300 font-bold">{program.budget}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-medium">Linimasa Waktu</span>
                      <span className="text-slate-300 font-bold">{program.timeline}</span>
                    </div>
                  </div>
                </div>

                {/* Enter Button */}
                <div className="pt-5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProgram(program);
                    }}
                    className={`w-full py-3 rounded-2xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all border-0 shadow-md ${
                      isIndigo 
                        ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/15' 
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/15'
                    }`}
                  >
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-650 py-4 select-none">
        Portal Sistem Monitoring Swakelola Pendidikan © 2026. Dikembangkan untuk efisiensi monitoring progres fisik & payroll keuangan.
      </div>
    </div>
  );
}
