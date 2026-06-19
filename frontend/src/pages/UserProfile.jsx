import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Clock, Ticket, KeyRound, Lock } from 'lucide-react';

/**
 * Halaman UserProfile untuk menampilkan informasi akun pengguna yang aktif.
 */
export default function UserProfile() {
  const user = JSON.parse(localStorage.getItem('user')) || {
    name: 'Tamu',
    email: 'guest@helpdesk.com',
    role: 'REPORTER',
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMsg('Sesi telah berakhir. Silakan login kembali.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message);
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setErrorMsg(data.message || 'Gagal mengubah kata sandi.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menghubungkan ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <User className="text-berlian-500" /> Profil Pengguna
        </h1>
        <p className="text-slate-400 text-sm mt-1">Detail informasi akun Anda yang terdaftar di portal IT Helpdesk PT BMS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center md:col-span-1 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-berlian-600 to-berlian-400 flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-berlian-500/15 mb-4 uppercase">
            {user.name.substring(0, 2)}
          </div>
          <h2 className="text-xl font-bold text-white truncate max-w-full">{user.name}</h2>
          <span className="text-[10px] mt-1.5 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider bg-berlian-500/10 text-berlian-400 border border-berlian-500/20">
            {user.role}
          </span>
          <p className="text-slate-500 text-xs mt-4">Anggota Portal IT sejak Juni 2026</p>
        </div>

        {/* Profile Info Fields */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 md:col-span-2 space-y-6">
          <h3 className="text-base font-semibold text-slate-200 border-b border-slate-850 pb-3">Informasi Akun</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nama Lengkap */}
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Nama Lengkap</span>
              <div className="flex items-center gap-2 text-slate-200 text-sm">
                <User size={16} className="text-berlian-400" />
                <span>{user.name}</span>
              </div>
            </div>

            {/* Alamat Email */}
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Alamat Email</span>
              <div className="flex items-center gap-2 text-slate-200 text-sm">
                <Mail size={16} className="text-berlian-400" />
                <span>{user.email}</span>
              </div>
            </div>

            {/* Peran Sistem */}
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Hak Akses Sistem</span>
              <div className="flex items-center gap-2 text-slate-200 text-sm">
                <Shield size={16} className="text-berlian-400" />
                <span>{user.role === 'IT Support' ? 'IT Support (Handler)' : user.role === 'Admin' ? 'Administrator' : 'Karyawan (Reporter)'}</span>
              </div>
            </div>

            {/* Waktu Registrasi */}
            <div className="space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Tanggal Bergabung</span>
              <div className="flex items-center gap-2 text-slate-200 text-sm">
                <Calendar size={16} className="text-berlian-400" />
                <span>17 Juni 2026</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-850 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Statistik Aktivitas Kerja</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 border border-slate-850/60 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-berlian-500/10 border border-berlian-500/25 flex items-center justify-center text-berlian-400">
                  <Ticket size={18} />
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Laporan Dikirim</div>
                  <div className="text-lg font-bold text-slate-200">12 Tiket</div>
                </div>
              </div>
              <div className="bg-slate-900/40 border border-slate-850/60 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-slate-500 text-[10px] uppercase font-bold">Rata-rata Respon</div>
                  <div className="text-lg font-bold text-slate-200">24 Menit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ubah Kata Sandi Section */}
          <div className="pt-6 border-t border-slate-850 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <KeyRound size={14} className="text-berlian-500" /> Ubah Kata Sandi Akun
            </h4>

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-medium">
                ✓ {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 disabled:opacity-55 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Kata Sandi Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-slate-500" size={14} />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 disabled:opacity-55 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-berlian-600 hover:bg-berlian-500 disabled:bg-berlian-850 text-white font-semibold rounded-lg text-xs transition-all active:scale-98 flex items-center gap-2 shadow-lg shadow-berlian-600/10"
              >
                {loading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Perbarui Kata Sandi</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
