import React, { useState, useEffect } from 'react';
import ITDashboard from './pages/ITDashboard';
import Login from './pages/Login';
import ReportTicket from './pages/ReportTicket';
import AssetsList from './pages/AssetsList';
import UserProfile from './pages/UserProfile';
import UserManagement from './pages/UserManagement';
import logoImg from './assets/Logo-Berlian-Manyar-Sejahtera.png';
import { 
  Settings, 
  LogOut, 
  Bell, 
  LayoutDashboard, 
  PlusCircle, 
  HardDrive, 
  User, 
  Users,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Navigation Tabs State: 'dashboard' | 'report' | 'assets' | 'profile'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Dropdown UI Panels State
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mobile Sidebar Responsive State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Guest Reporting State
  const [isGuestReporting, setIsGuestReporting] = useState(false);

  // Theme Toggle State
  const [isLightMode, setIsLightMode] = useState(localStorage.getItem('theme') === 'light');

  // Modal State
  const [showAllNotificationsModal, setShowAllNotificationsModal] = useState(false);

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // Daftar Mock Notifikasi Sistem untuk presentasi skripsi
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Budi Santoso membuat tiket baru (#Network)", time: "5 menit lalu", read: false },
    { id: 2, text: "Status tiket #Asset01 diubah oleh Adi Wijaya ke IN PROGRESS", time: "1 jam lalu", read: false },
    { id: 3, text: "Siti Rahma melaporkan kendala Printer Epson (#Hardware)", time: "2 jam lalu", read: true },
  ]);

  // Cek sesi login saat aplikasi dimuat pertama kali
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    const path = window.location.pathname;
    if (path === '/report' || path === '/public-report') {
      setIsGuestReporting(true);
    }

    setCheckingAuth(false);

    // Sinkronisasi tombol back/forward browser
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/report' || currentPath === '/public-report') {
        setIsGuestReporting(true);
      } else {
        setIsGuestReporting(false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLoginSuccess = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    window.history.pushState({}, '', '/');
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-berlian-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Jika user belum login, tampilkan halaman Login atau Laporan Tamu
  if (!token || !user) {
    if (isGuestReporting) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4">
          <ReportTicket 
            onReportSuccess={() => {
              window.history.pushState({}, '', '/');
              setIsGuestReporting(false);
            }} 
            isGuestMode={true} 
          />
        </div>
      );
    }
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        onGuestReportClick={() => {
          window.history.pushState({}, '', '/report');
          setIsGuestReporting(true);
        }} 
      />
    );
  }

  // Fungsi Render Halaman Sesuai Tab Aktif
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ITDashboard />;
      case 'report':
        return <ReportTicket onReportSuccess={() => setActiveTab('dashboard')} />;
      case 'assets':
        return <AssetsList />;
      case 'profile':
        return <UserProfile />;
      case 'users':
        return <UserManagement />;
      default:
        return <ITDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans relative">
      
      {/* ===================================================== */}
      {/* 1. SIDEBAR NAVIGASI (DESKTOP)                         */}
      {/* ===================================================== */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-slate-950 border-r border-slate-900 shrink-0">
        <div>
          {/* Logo Brand Perusahaan (Berlian Manyar Sejahtera) */}
          <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-900 bg-slate-950/20">
            <img src={logoImg} className="h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(37,150,190,0.15)]" alt="Logo BMS" />
            <div className="min-w-0">
              <span className="font-bold text-xs tracking-tight text-white block uppercase">BMS IT Support</span>
              <span className="text-[9px] block text-berlian-400 font-bold tracking-wider -mt-0.5 font-mono">HELPDESK PORTAL</span>
            </div>
          </div>

          {/* List Menu Item */}
          <nav className="p-4 space-y-1.5 mt-4">
            {/* Dashboard Antrean */}
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-berlian-600 text-white shadow-lg shadow-berlian-600/15' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard size={16} />
                <span>Antrean Tiket</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'dashboard' ? 'opacity-100' : 'opacity-0'} />
            </button>

            {/* Buat Laporan */}
            <button
              onClick={() => { setActiveTab('report'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'report' 
                  ? 'bg-berlian-600 text-white shadow-lg shadow-berlian-600/15' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle size={16} />
                <span>Buat Laporan</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'report' ? 'opacity-100' : 'opacity-0'} />
            </button>

            {/* Daftar Aset */}
            <button
              onClick={() => { setActiveTab('assets'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'assets' 
                  ? 'bg-berlian-600 text-white shadow-lg shadow-berlian-600/15' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardDrive size={16} />
                <span>Manajemen Aset</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'assets' ? 'opacity-100' : 'opacity-0'} />
            </button>

            {/* Profil User */}
            <button
              onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'profile' 
                  ? 'bg-berlian-600 text-white shadow-lg shadow-berlian-600/15' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User size={16} />
                <span>Profil Saya</span>
              </div>
              <ChevronRight size={14} className={activeTab === 'profile' ? 'opacity-100' : 'opacity-0'} />
            </button>

            {/* Manajemen Pengguna (Admin Only) */}
            {user && user.role === 'Admin' && (
              <button
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === 'users' 
                    ? 'bg-berlian-600 text-white shadow-lg shadow-berlian-600/15' 
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={16} />
                  <span>Manajemen Pengguna</span>
                </div>
                <ChevronRight size={14} className={activeTab === 'users' ? 'opacity-100' : 'opacity-0'} />
              </button>
            )}
          </nav>
        </div>

        {/* Footer Sidebar (Logout) */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut size={16} />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* ===================================================== */}
      {/* 2. SIDEBAR NAVIGASI (MOBILE DRAWERS)                   */}
      {/* ===================================================== */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside 
            className="w-64 h-full bg-slate-950 border-r border-slate-900 flex flex-col justify-between p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
                <div className="flex items-center gap-2">
                  <img src={logoImg} className="h-7 w-auto object-contain" alt="Logo BMS" />
                  <span className="font-bold text-xs tracking-tight text-white uppercase">BMS IT Support</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-2">
                <button
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold ${activeTab === 'dashboard' ? 'bg-berlian-600 text-white' : 'text-slate-400'}`}
                >
                  <LayoutDashboard size={16} />
                  <span>Antrean Tiket</span>
                </button>
                <button
                  onClick={() => { setActiveTab('report'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold ${activeTab === 'report' ? 'bg-berlian-600 text-white' : 'text-slate-400'}`}
                >
                  <PlusCircle size={16} />
                  <span>Buat Laporan</span>
                </button>
                <button
                  onClick={() => { setActiveTab('assets'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold ${activeTab === 'assets' ? 'bg-berlian-600 text-white' : 'text-slate-400'}`}
                >
                  <HardDrive size={16} />
                  <span>Manajemen Aset</span>
                </button>
                <button
                  onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold ${activeTab === 'profile' ? 'bg-berlian-600 text-white' : 'text-slate-400'}`}
                >
                  <User size={16} />
                  <span>Profil Saya</span>
                </button>

                {user && user.role === 'Admin' && (
                  <button
                    onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-xs font-semibold ${activeTab === 'users' ? 'bg-berlian-600 text-white' : 'text-slate-400'}`}
                  >
                    <Users size={16} />
                    <span>Manajemen Pengguna</span>
                  </button>
                )}
              </nav>
            </div>
            <div className="pt-4 border-t border-slate-900">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-red-400 hover:text-red-300 transition-all text-xs font-semibold"
              >
                <LogOut size={16} />
                <span>Keluar Portal</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ===================================================== */}
      {/* 3. AREA KONTEN UTAMA (RIGHT CONTENT)                  */}
      {/* ===================================================== */}
      <div className="flex-grow flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Sleek Modern Header (Navbar) */}
        <header className="sticky top-0 z-40 w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
          <div className="h-16 flex items-center justify-between px-6">
            
            {/* Burger Menu Button (Mobile Only) */}
            <div className="flex items-center gap-3 lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg"
              >
                <Menu size={20} />
              </button>
              <span className="font-bold text-xs tracking-wider uppercase text-slate-400">{activeTab}</span>
            </div>

            {/* Page Title (Desktop Only) */}
            <span className="hidden lg:block font-semibold text-xs tracking-wider uppercase text-slate-500">
              Menu Aktif: <strong className="text-berlian-400 font-bold">{activeTab.replace('_', ' ')}</strong>
            </span>

            {/* Controls */}
            <div className="flex items-center gap-3 relative">
              
              {/* Notification Button */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors relative ${showNotifications ? 'bg-slate-900 text-slate-200' : ''}`}
                title="Pemberitahuan Sistem"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-berlian-500 animate-ping"></span>
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-berlian-500"></span>
                  </>
                )}
              </button>

              {/* Notification Dropdown Panel (Glassmorphic) */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] glass-panel border border-slate-800 rounded-xl shadow-2xl z-50 p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                    <h4 className="text-xs font-bold text-slate-200">Notifikasi Sistem</h4>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-berlian-400 hover:text-berlian-300 font-semibold"
                      >
                        Tandai sudah baca
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`p-2 rounded-lg text-xs leading-relaxed transition-all ${notif.read ? 'bg-transparent text-slate-450' : 'bg-berlian-950/20 text-slate-200 border border-berlian-900/10'}`}
                      >
                        <p>{notif.text}</p>
                        <span className="text-[9px] text-slate-500 block mt-1">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-2 border-t border-slate-850">
                    <span 
                      onClick={() => { setShowAllNotificationsModal(true); setShowNotifications(false); }}
                      className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-400"
                    >
                      Tampilkan Semua Notifikasi
                    </span>
                  </div>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button 
                onClick={() => setIsLightMode(!isLightMode)}
                className="p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors animate-pulse-once"
                title={isLightMode ? "Ubah ke Mode Gelap" : "Ubah ke Mode Terang"}
              >
                {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {/* Quick Settings Mockup -> Navigasi ke Profil */}
              <button 
                onClick={() => { setActiveTab('profile'); setShowNotifications(false); }}
                className="hidden sm:block p-2 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors"
                title="Pengaturan Profil Akun"
              >
                <Settings size={18} />
              </button>

              {/* User Profile Badge */}
              <div 
                onClick={() => { setActiveTab('profile'); setShowNotifications(false); }}
                className="flex items-center gap-2 pl-2 border-l border-slate-900 cursor-pointer group hover:opacity-90"
              >
                <div className="w-8 h-8 rounded-full bg-berlian-500/10 border border-berlian-500/30 flex items-center justify-center text-berlian-400 font-bold text-xs uppercase group-hover:border-berlian-400 transition-all">
                  {user.name.substring(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-all max-w-[90px] truncate">{user.name}</p>
                  <p className="text-[9px] text-slate-500 -mt-0.5 tracking-wider uppercase font-bold">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <div className="flex-grow overflow-x-hidden">
          {renderActiveContent()}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 max-w-7xl">
            <p>© {new Date().getFullYear()} IT Helpdesk System. PT Berlian Manyar Sejahtera.</p>
            <div className="flex gap-4">
              <span className="hover:text-slate-400 cursor-pointer">Panduan</span>
              <span className="hover:text-slate-400 cursor-pointer">Kebijakan Privasi</span>
              <span className="hover:text-slate-400 cursor-pointer">Hubungi Kami</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal Tampilkan Semua Notifikasi */}
      {showAllNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-sm font-bold text-white">Semua Notifikasi Sistem</h2>
              <button 
                onClick={() => setShowAllNotificationsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3 flex-grow">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 rounded-lg text-xs leading-relaxed border transition-all ${notif.read ? 'bg-transparent text-slate-400 border-slate-850' : 'bg-berlian-950/20 text-slate-200 border-berlian-900/20'}`}
                >
                  <p className="font-semibold">{notif.text}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">{notif.time}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-850 bg-slate-900/20 text-center">
              <button 
                onClick={() => { markAllNotificationsRead(); setShowAllNotificationsModal(false); }}
                className="text-xs text-berlian-400 hover:text-berlian-300 font-semibold"
              >
                Tandai Semua sebagai Dibaca & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
