import React, { useState, useEffect } from 'react';
import { Ticket, Send, AlertCircle, CheckCircle, ArrowLeft, Calendar, User, Mail, Shield, ShieldAlert, Sun, Moon } from 'lucide-react';
import logoImg from '../assets/Logo-Berlian-Manyar-Sejahtera.png';

/**
 * Halaman ReportTicket untuk mengirimkan laporan kendala/tiket baru.
 */
export default function ReportTicket({ onReportSuccess, isGuestMode = false }) {
  // Ambil data user aktif jika ada
  const activeUser = JSON.parse(localStorage.getItem('user')) || null;

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

  // 1. Tanggal (Wajib diisi, default hari ini)
  const [reportedAt, setReportedAt] = useState(new Date().toISOString().substring(0, 10));
  
  // 2. Nama (Wajib diisi)
  const [guestName, setGuestName] = useState(isGuestMode ? '' : (activeUser?.name || ''));
  
  // 3. Email (Wajib diisi)
  const [guestEmail, setGuestEmail] = useState(isGuestMode ? '' : (activeUser?.email || ''));
  
  // 4. Divisi (Wajib diisi)
  const [guestDivision, setGuestDivision] = useState(isGuestMode ? '' : (activeUser?.department || ''));
  
  // 5. Kebutuhan dukungan (Wajib diisi)
  const [ticketType, setTicketType] = useState('Incident');
  
  // 6. Deskripsi kendala/kebutuhan (Wajib diisi)
  const [description, setDescription] = useState('');
  
  // 7. Konfirmasi laporan (Wajib diisi)
  const [confirmReport, setConfirmReport] = useState(false);

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch daftar aset (hanya jika user terautentikasi / opsional fallback)
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return; // Lewati jika guest murni tanpa token

        const response = await fetch('/api/assets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setAssets(result.data);
        }
      } catch (err) {
        console.error('Error fetching assets for dropdown:', err);
      }
    };

    fetchAssets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi 7 Field Wajib
    if (!reportedAt) return setError('Tanggal wajib diisi.');
    if (!guestName) return setError('Nama wajib diisi.');
    if (!guestEmail) return setError('Email wajib diisi.');
    if (!guestDivision) return setError('Divisi wajib diisi.');
    if (!ticketType) return setError('Kebutuhan dukungan wajib diisi.');
    if (!description) return setError('Deskripsi kendala/kebutuhan wajib diisi.');
    if (!confirmReport) return setError('Konfirmasi laporan wajib dicentang.');

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Kumpulkan payload data
    let payload = {
      reported_at: reportedAt,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_division: guestDivision,
      ticket_type: ticketType,
      issue_description: description,
      priority: 'MEDIUM', // Default priority
      asset_id: assetId ? assetId : null,
    };

    if (isGuestMode) {
      payload.reporter_id = null;
    } else {
      if (!activeUser || !activeUser.id) {
        setError('Sesi pengguna tidak valid. Silakan login kembali.');
        setLoading(false);
        return;
      }
      payload.reporter_id = activeUser.id;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(true);
        setDescription('');
        setConfirmReport(false);
        if (isGuestMode) {
          setGuestName('');
          setGuestEmail('');
          setGuestDivision('');
        }
        
        // Delay 1.5 detik lalu panggil success callback
        setTimeout(() => {
          if (onReportSuccess) onReportSuccess();
        }, 1500);
      } else {
        throw new Error(result.message || 'Gagal mengirimkan laporan tiket.');
      }
    } catch (err) {
      console.error('Submit ticket error:', err);
      setError(err.message || 'Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl relative">
      {/* Theme Toggle Button for Guest Mode */}
      {isGuestMode && (
        <button 
          type="button"
          onClick={toggleTheme}
          className="absolute top-8 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-lg bg-slate-900 border border-slate-800 transition-colors z-20"
          title={isLightMode ? "Ubah ke Mode Gelap" : "Ubah ke Mode Terang"}
        >
          {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      )}

      {/* Tombol Kembali khusus Guest Mode */}
      {isGuestMode && (
        <button 
          onClick={onReportSuccess}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Halaman Login</span>
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <img src={logoImg} className="h-14 w-auto object-contain drop-shadow-[0_0_10px_rgba(37,150,190,0.2)]" alt="Logo BMS" />
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{isGuestMode ? 'Laporan Kendala Lapangan (Tamu)' : 'Buat Laporan Tiket Baru'}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Formulir pengaduan kendala IT & operasional PT Berlian Manyar Sejahtera
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 border border-slate-800 relative">
        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-sm text-emerald-400">
            <CheckCircle size={20} className="shrink-0 animate-bounce" />
            <span>Laporan tiket berhasil dikirim! Mengalihkan halaman...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-sm text-red-400">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Tanggal Laporan */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={14} className="text-berlian-400" /> Tanggal Kejadian / Laporan *
              </label>
              <input
                type="date"
                required
                value={reportedAt}
                onChange={(e) => setReportedAt(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 disabled:opacity-50"
              />
            </div>

            {/* 2. Nama Lengkap */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-berlian-400" /> Nama Pelapor *
              </label>
              <input
                type="text"
                required
                placeholder="Nama lengkap Anda"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 disabled:opacity-50"
              />
            </div>

            {/* 3. Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={14} className="text-berlian-400" /> Alamat Email *
              </label>
              <input
                type="email"
                required
                placeholder="email@bms.co.id / email pribadi"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 disabled:opacity-50"
              />
            </div>

            {/* 4. Divisi */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={14} className="text-berlian-400" /> Divisi / Departemen Kerja *
              </label>
              <input
                type="text"
                required
                placeholder="cth: Operasional Timbangan, Keuangan, Logistik"
                value={guestDivision}
                onChange={(e) => setGuestDivision(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 5. Kebutuhan Dukungan */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-berlian-400" /> Kebutuhan Dukungan *
              </label>
              <select
                required
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 disabled:opacity-50"
              >
                <option value="Incident">Incident (Kendala Kerusakan / Mati)</option>
                <option value="Request">Request (Permintaan Layanan / Install)</option>
                <option value="Problem">Problem (Kendala Berulang / Sistem Lambat)</option>
              </select>
            </div>

            {/* Aset Terkait (Opsional jika user memiliki token) */}
            {assets.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Aset Terkait (Opsional)
                </label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 disabled:opacity-50"
                >
                  <option value="">-- Tidak mengaitkan aset --</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.asset_name} ({asset.location})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 6. Deskripsi Kendala / Kebutuhan */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Deskripsi Kendala / Kebutuhan Dukungan *
            </label>
            <textarea
              required
              rows={5}
              placeholder="Jelaskan secara rinci kendala yang Anda hadapi agar tim IT Support BMS dapat merespon cepat (cth: Monitor Timbangan JT01 mati total, PC Keuangan tidak terhubung LAN, dll.)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-205 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 disabled:opacity-50"
            ></textarea>
          </div>

          {/* 7. Konfirmasi Laporan */}
          <div className="flex items-start gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-850">
            <input
              type="checkbox"
              id="confirmReport"
              required
              checked={confirmReport}
              onChange={(e) => setConfirmReport(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4.5 w-4.5 rounded border-slate-800 bg-slate-900 text-berlian-600 focus:ring-berlian-500 accent-berlian-500"
            />
            <label htmlFor="confirmReport" className="text-xs text-slate-400 leading-relaxed cursor-pointer select-none">
              Saya mengonfirmasi bahwa seluruh informasi laporan kendala di atas diisi dengan **benar** dan bersedia dihubungi oleh Tim IT Support PT Berlian Manyar Sejahtera untuk proses verifikasi lapangan. *
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success || !confirmReport}
            className="w-full py-3 bg-berlian-600 hover:bg-berlian-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850/60 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xs transition-all active:scale-98 shadow-lg shadow-berlian-500/15 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mengirim Laporan...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Kirim Laporan Tiket</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
