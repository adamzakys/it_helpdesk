import React, { useState } from 'react';
import { 
  X, 
  User, 
  HardDrive, 
  AlertCircle, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';

/**
 * Modal detail tiket yang komprehensif.
 * Menerima props:
 * - 'ticket' (objek detail tiket dengan logs)
 * - 'onClose' (fungsi callback tutup modal)
 * - 'onUpdateSuccess' (fungsi callback menyegarkan data setelah status diupdate)
 */
export default function TicketDetailModal({ ticket, onClose, onUpdateSuccess }) {
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [logNote, setLogNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeUser = JSON.parse(localStorage.getItem('user')) || {};
  const isHandler = activeUser.role === 'IT Support' || activeUser.role === 'Admin';

  // 1. Fungsi Mengubah Status Tiket (Menggunakan PUT backend terproteksi JWT)
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          changed_by: activeUser.id,
          log_note: logNote || `Mengubah status menjadi ${newStatus}`,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setLogNote('');
        if (onUpdateSuccess) {
          // Panggil callback untuk menyegarkan dashboard dan modal detail
          onUpdateSuccess();
        }
      } else {
        throw new Error(result.message || 'Gagal merubah status tiket.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message || 'Kesalahan jaringan terjadi.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'OPEN':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'ASSIGNED':
        return 'bg-berlian-500/10 text-berlian-400 border-berlian-500/20';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PENDING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'text-red-400';
      case 'HIGH': return 'text-orange-400';
      case 'MEDIUM': return 'text-amber-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
      {/* Modal Container */}
      <div className="w-full max-w-4xl glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Detail Tiket {ticket.ticket_number}
            </h2>
            <p className="text-[10px] text-berlian-400 font-mono mt-0.5">ID: {ticket.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Modal (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1 & 2: Informasi Detail */}
          <div className="md:col-span-2 space-y-6">
            {/* Rincian Masalah */}
            <div className="glass-card rounded-xl p-5 border border-slate-850">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-berlian-500/10 text-berlian-400 border border-berlian-500/20 uppercase tracking-wider">
                  {ticket.category}
                </span>
                <span className={`text-xs px-3 py-0.5 rounded-full font-bold border tracking-wide ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs mt-4">
                <div>
                  <span className="text-slate-500 block font-semibold uppercase tracking-wider text-[10px] mb-1">Skala Prioritas</span>
                  <span className={`font-bold ${getPriorityStyle(ticket.priority)}`}>{ticket.priority}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold uppercase tracking-wider text-[10px] mb-1">Tanggal Dilaporkan</span>
                  <span className="text-slate-350">
                    {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Timline Log / Audit Trail */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={14} className="text-berlian-400" />
                Riwayat Log Status & Audit Trail
              </h3>

              <div className="relative border-l border-berlian-500/30 pl-5 ml-2.5 space-y-5">
                {/* Log Pembuatan Pertama */}
                <div className="relative">
                  <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-berlian-500 border border-slate-950 shadow-md"></span>
                  <div className="text-xs">
                    <p className="text-slate-400 font-semibold">
                      Tiket Dibuat oleh <strong className="text-slate-200">{ticket.reporter ? ticket.reporter.full_name : `${ticket.guest_name} (Tamu)`}</strong>
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ticket.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </span>
                    <p className="text-slate-400 bg-slate-900/30 border border-slate-850 p-2.5 rounded-lg mt-1 text-[11px] leading-relaxed">
                      Laporan kendala baru dengan kategori {ticket.category} dikirimkan ke IT Support.
                    </p>
                  </div>
                </div>

                {/* Log Riwayat Transaksi Perubahan Status / Worklogs */}
                {ticket.worklogs && ticket.worklogs.length > 0 ? (
                  ticket.worklogs.map((worklog) => (
                    <div key={worklog.id} className="relative">
                      <span className="absolute -left-[27px] top-0.5 w-3 h-3 rounded-full bg-berlian-400 border border-slate-950 shadow-md"></span>
                      <div className="text-xs">
                        <p className="text-slate-400 font-semibold">
                          Penanganan oleh <strong className="text-slate-200">{worklog.technician?.full_name || 'Teknisi'}</strong>
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(worklog.logged_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </span>
                        <p className="text-slate-450 bg-berlian-950/5 border border-berlian-900/10 p-2.5 rounded-lg mt-1 text-[11px] leading-relaxed italic">
                          "{worklog.log_note}"
                        </p>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          </div>

          {/* Col 3: Side Panel (Pelapor, Aset, Update Status IT) */}
          <div className="space-y-6 border-l border-slate-850/60 pl-2 md:pl-6">
            {/* Info Pelapor */}
            <div className="space-y-2">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">Pelapor</span>
              <div className="flex items-center gap-2.5 bg-slate-900/30 p-3 rounded-lg border border-slate-850">
                {ticket.reporter ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-berlian-500/10 flex items-center justify-center text-berlian-400 font-bold uppercase text-xs">
                      {(ticket.reporter.full_name || '').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{ticket.reporter.full_name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">{ticket.reporter.email}</p>
                      <p className="text-[9px] text-slate-400 font-mono">NIP: {ticket.reporter.nip}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold uppercase text-xs">
                      {(ticket.guest_name || 'G').substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{ticket.guest_name} <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.5 rounded font-normal ml-1">Tamu</span></h4>
                      <p className="text-[10px] text-slate-500 font-mono">{ticket.guest_email || 'Tanpa Email'}</p>
                      <p className="text-[9px] text-slate-400 font-mono">Divisi: {ticket.guest_division || '-'} {ticket.guest_nip ? `| NIP: ${ticket.guest_nip}` : ''}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Aset */}
            <div className="space-y-2">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] block">Aset Terkait</span>
              {ticket.asset ? (
                <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-850 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200">
                    <HardDrive size={14} className="text-berlian-400" />
                    <span>{ticket.asset.asset_name}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Kategori: {ticket.asset.category}</p>
                  <p className="text-slate-400 text-[11px]">Lokasi: {ticket.asset.location}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Tidak ada aset dikaitkan.</p>
              )}
            </div>

            {/* Panel Manajemen Status IT (Hanya Tampil Jika User = HANDLER) */}
            {isHandler ? (
              <div className="pt-6 border-t border-slate-850">
                <h4 className="text-xs font-bold uppercase tracking-wider text-berlian-400 mb-4">Pembaruan Status (IT Support)</h4>
                
                {error && (
                  <div className="mb-4 p-2.5 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  {/* Select Status */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Baru</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-250 focus:outline-none focus:border-berlian-500 disabled:opacity-50"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="PENDING">PENDING</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  {/* Catatan Log */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Catatan Pembaruan</label>
                    <textarea
                      rows={3}
                      placeholder="Jelaskan progres penanganan saat ini..."
                      value={logNote}
                      onChange={(e) => setLogNote(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-250 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650 disabled:opacity-50"
                    ></textarea>
                  </div>

                  {/* Submit Update */}
                  <button
                    type="submit"
                    disabled={loading || newStatus === ticket.status}
                    className="w-full py-2 bg-berlian-600 hover:bg-berlian-500 disabled:bg-slate-900 disabled:text-slate-600 disabled:border-slate-850/60 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              // Tampilan non-IT (Reporter)
              <div className="pt-6 border-t border-slate-850/65 text-[10px] text-slate-500">
                ⚠️ Hanya Tim IT Support (Handler) yang memiliki hak akses untuk mengubah status tiket kendala.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
