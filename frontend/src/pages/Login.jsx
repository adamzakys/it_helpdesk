import React, { useState } from 'react';
import { KeyRound, Mail, AlertCircle, Sun, Moon } from 'lucide-react';
import logoImg from '../assets/Logo-Berlian-Manyar-Sejahtera.png';

/**
 * Halaman Login React.
 * Menghubungkan ke API /api/auth/login dan menyimpan token ke localStorage.
 * Menerima callback 'onLoginSuccess' untuk memperbarui state auth di App.jsx.
 */
export default function Login({ onLoginSuccess, onGuestReportClick }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lupa Password States
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [forgotError, setForgotError] = useState(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [debugPassword, setDebugPassword] = useState(null);

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);
    setDebugPassword(null);
    setForgotLoading(true);

    if (!forgotEmail) {
      setForgotError('Alamat email wajib diisi.');
      setForgotLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setForgotSuccess(result.message);
        if (result.debugTempPassword) {
          setDebugPassword(result.debugTempPassword);
        }
      } else {
        throw new Error(result.message || 'Gagal mereset kata sandi.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setForgotError(err.message || 'Koneksi ke server gagal.');
    } finally {
      setForgotLoading(false);
    }
  };

  const [isLightMode, setIsLightMode] = useState(document.body.classList.contains('light-mode'));

  const toggleTheme = () => {
    const nextTheme = !isLightMode;
    setIsLightMode(nextTheme);
    if (nextTheme) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validasi Sederhana
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Simpan token JWT dan informasi profil user ke localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Panggil callback untuk memicu pergantian tampilan halaman ke Dashboard
        onLoginSuccess(result.user, result.token);
      } else {
        throw new Error(result.message || 'Kredensial login tidak valid.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Gagal terhubung ke server. Pastikan backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden select-none">
      {/* Theme Toggle Button */}
      <button 
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-900 border border-slate-800 transition-colors z-20"
        title={isLightMode ? "Ubah ke Mode Gelap" : "Ubah ke Mode Terang"}
      >
        {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      {/* Background Glows (Corporate Cyan Tones) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-berlian-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-berlian-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <img 
            src={logoImg} 
            className="mx-auto h-20 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(37,150,190,0.25)]" 
            alt="Logo Berlian Manyar Sejahtera" 
          />
          <h2 className="text-xl font-bold text-white tracking-tight">IT Support Portal</h2>
          <p className="text-slate-450 text-[11px] mt-0.5 font-medium tracking-wide">PT BERLIAN MANYAR SEJAHTERA</p>
        </div>

        {/* Login Card (Glassmorphic) */}
        <div className="glass-panel rounded-2xl p-7 border border-slate-900 shadow-2xl">
          {showForgot ? (
            // ==========================================
            // VIEW: LUPA PASSWORD (FORGOT PASSWORD)
            // ==========================================
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-5 border-b border-slate-850 pb-2">Atur Ulang Kata Sandi</h3>

              {forgotError && (
                <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-450">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1.5 text-xs text-emerald-400">
                  <span className="font-semibold">{forgotSuccess}</span>
                  {debugPassword && (
                    <div className="mt-2 p-2.5 bg-slate-950 border border-emerald-500/20 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Kata Sandi Sementara (Demo):</p>
                      <p className="text-base font-mono font-extrabold text-white tracking-widest mt-1 select-all">{debugPassword}</p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4">
                {/* Input Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Alamat Email Terdaftar
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="budi@helpdesk.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      disabled={forgotLoading}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 disabled:opacity-55 transition-all"
                    />
                  </div>
                </div>

                {/* Submit Reset */}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2 bg-berlian-600 hover:bg-berlian-500 disabled:bg-berlian-800 text-white font-semibold rounded-lg text-xs transition-all active:scale-98 shadow-lg shadow-berlian-600/10 flex items-center justify-center gap-2 mt-2"
                >
                  {forgotLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Kirim Sandi Sementara</span>
                  )}
                </button>

                {/* Return Link */}
                <div className="text-center mt-3 pt-3 border-t border-slate-850/60">
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotError(null); setForgotSuccess(null); setDebugPassword(null); }}
                    className="text-[11px] text-slate-300 hover:text-berlian-400 font-semibold transition-colors"
                  >
                    ➔ Kembali ke Halaman Login
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // ==========================================
            // VIEW: LOGIN PENGGUNA (DEFAULT VIEW)
            // ==========================================
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-5 border-b border-slate-850 pb-2">Login Pengguna</h3>

              {error && (
                <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="budi@helpdesk.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 disabled:opacity-55 transition-all"
                    />
                  </div>
                </div>

                {/* Input Password */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Kata Sandi
                    </label>
                    <span 
                      onClick={() => setShowForgot(true)}
                      className="text-[10px] text-berlian-400 hover:text-berlian-300 cursor-pointer"
                    >
                      Lupa Password?
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 disabled:opacity-55 transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-berlian-600 hover:bg-berlian-500 disabled:bg-berlian-800 text-white font-semibold rounded-lg text-xs transition-all active:scale-98 shadow-lg shadow-berlian-600/10 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk Sekarang</span>
                  )}
                </button>

                {/* Guest Reporting Button Link */}
                <div className="text-center mt-3 pt-3 border-t border-slate-850/60">
                  <button
                    type="button"
                    onClick={onGuestReportClick}
                    className="text-[11px] text-slate-300 hover:text-berlian-400 font-semibold transition-colors"
                  >
                    Melaporkan Kendala Tanpa Login (Tamu / Guest) ➔
                  </button>
                </div>
              </form>

              {/* Account Guidelines helper */}
              <div className="mt-6 pt-4 border-t border-slate-850 text-[10px] text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-400 mb-1">💡 Petunjuk Login:</p>
                <p>Masukkan akun demo untuk evaluasi sistem:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  <li>Reporter: <code className="text-berlian-400">budi@helpdesk.com</code></li>
                  <li>IT Support: <code className="text-berlian-400">adi@helpdesk.com</code></li>
                  <li>Password: <code className="text-berlian-400">password123</code></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
