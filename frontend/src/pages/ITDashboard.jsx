import React, { useState, useEffect, useMemo } from 'react';
import TicketCard from '../components/TicketCard';
import TicketDetailModal from '../components/TicketDetailModal';
import { 
  ListFilter, 
  RefreshCw, 
  Database, 
  LayoutGrid, 
  Table as TableIcon,
  Ticket as TicketIcon,
  AlertTriangle,
  Clock,
  CheckCircle,
  HelpCircle,
  Search
} from 'lucide-react';

/**
 * Halaman Utama ITDashboard.
 * Mengambil data tiket dari API backend, menyediakan analitik sederhana (metrics),
 * serta menyediakan filter status dan toggle visualisasi (Tabel vs Grid).
 */
export default function ITDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  
  // State untuk Date Filter (Asia/Jakarta timezone on query)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State untuk Detail Modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fungsi untuk menarik daftar tiket dari API backend
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Susun query parameter dinamis untuk rentang tanggal
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      // Endpoint ter-proxy otomatis melalui vite.config.js ke http://localhost:3000
      const response = await fetch(`/api/tickets${queryStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      
      if (response.ok && result.success) {
        setTickets(result.data);
      } else if (response.status === 401 || response.status === 403) {
        // Jika token tidak valid / kedaluwarsa, paksa logout dan muat ulang halaman
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      } else {
        throw new Error(result.message || 'Gagal mengambil data tiket');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err.message || 'Koneksi ke server backend terputus atau backend belum berjalan.');
    } finally {
      setLoading(false);
    }
  };

  // Panggil fetchTickets saat komponen pertama kali dirender atau filter tanggal berubah
  useEffect(() => {
    fetchTickets();
  }, [startDate, endDate]);

  // Ambil detail lengkap tiket (termasuk logs) untuk dibuka di modal
  const handleOpenTicket = async (ticketId) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setSelectedTicket(result.data);
      } else {
        alert(result.message || 'Gagal memuat detail tiket.');
      }
    } catch (err) {
      console.error('Error fetching ticket detail:', err);
      alert('Koneksi gagal saat memuat detail tiket.');
    } finally {
      setModalLoading(false);
    }
  };

  // Fungsi callback untuk menyegarkan data tiket setelah status diubah di modal
  const handleUpdateSuccess = async () => {
    // 1. Refresh list dashboard utama
    await fetchTickets();
    // 2. Refresh detail tiket di modal agar timeline log diperbarui
    if (selectedTicket) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        const result = await response.json();
        if (response.ok && result.success) {
          setSelectedTicket(result.data);
        }
      } catch (err) {
        console.error('Error refreshing modal ticket detail:', err);
      }
    }
  };

  // 1. Hitung Metrics Dashboard menggunakan useMemo demi optimasi performa
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'OPEN').length;
    const active = tickets.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'PENDING'].includes(t.status)).length;
    const completed = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

    return { total, open, active, completed };
  }, [tickets]);

  // 2. Filter & Pencarian Tiket Dinamis menggunakan useMemo
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      // Filter status
      const matchesStatus = filterStatus === 'ALL' || ticket.status === filterStatus;
      
      // Pencarian berdasarkan Category, Priority, Pelapor, atau ID Aset
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (ticket.category || '').toLowerCase().includes(searchLower) ||
        (ticket.priority || '').toLowerCase().includes(searchLower) ||
        (ticket.reporter?.full_name || '').toLowerCase().includes(searchLower) ||
        (ticket.guest_name || '').toLowerCase().includes(searchLower) ||
        (ticket.asset && (
          (ticket.asset.asset_name || '').toLowerCase().includes(searchLower) ||
          (ticket.asset.asset_code || '').toLowerCase().includes(searchLower) ||
          (ticket.asset.location || '').toLowerCase().includes(searchLower)
        )) ||
        ticket.id.toLowerCase().includes(searchLower) ||
        (ticket.ticket_number || '').toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, filterStatus, searchTerm]);

  // Handler warna untuk status di tabel
  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-500/10 text-red-400 border border-red-500/20">OPEN</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-berlian-500/10 text-berlian-400 border border-berlian-500/20">ASSIGNED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">IN PROGRESS</span>;
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">PENDING</span>;
      case 'RESOLVED':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">CLOSED</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return <span className="text-red-400 font-bold">🔴 {priority}</span>;
      case 'HIGH':
        return <span className="text-orange-400 font-semibold">🟠 {priority}</span>;
      case 'MEDIUM':
        return <span className="text-amber-400">🟡 {priority}</span>;
      case 'LOW':
        return <span className="text-slate-400">🟢 {priority}</span>;
      default:
        return <span className="text-slate-400">{priority}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">
      {/* Loading Overlay untuk pembukaan modal */}
      {modalLoading && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-berlian-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <TicketIcon className="text-berlian-500" /> Antrean Tiket IT Support
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Dashboard antrean tiket dan manajemen aset operasional lapangan PT BMS
          </p>
        </div>
        <button 
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-berlian-600 hover:bg-berlian-500 text-white font-semibold shadow-lg shadow-berlian-500/15 transition-all active:scale-95 text-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Tiket */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-berlian-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tiket</span>
            <Database size={20} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">{metrics.total}</h2>
          <p className="text-[11px] text-slate-500 mt-1">Seluruh tiket masuk</p>
        </div>

        {/* Antrean Baru / OPEN */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Antrean Baru (Open)</span>
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">{metrics.open}</h2>
          <p className="text-[11px] text-slate-500 mt-1">Butuh respon segera</p>
        </div>

        {/* Sedang Ditangani (Active) */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Dalam Penanganan</span>
            <Clock size={20} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">{metrics.active}</h2>
          <p className="text-[11px] text-slate-500 mt-1">Assigned, In Progress, Pending</p>
        </div>

        {/* Tiket Selesai / Resolved */}
        <div className="glass-panel rounded-xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiket Selesai</span>
            <CheckCircle size={20} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">{metrics.completed}</h2>
          <p className="text-[11px] text-slate-500 mt-1">Resolved & Closed</p>
        </div>
      </div>

      {/* Control Panel: Filters, Search, and Toggle View */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
        {/* Filter Status */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase pr-2 border-r border-slate-850 shrink-0">
            <ListFilter size={14} />
            <span>Filter Status:</span>
          </div>
          <div className="flex gap-1">
            {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterStatus === status 
                    ? 'bg-berlian-600 text-white shadow-md shadow-berlian-600/10' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase pr-2 border-r border-slate-850 shrink-0">
            <Clock size={14} className="text-berlian-500" />
            <span>Filter Tanggal:</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
            />
            <span className="text-xs text-slate-500 font-medium">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold ml-1 shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto shrink-0">
          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Cari kategori, pelapor, aset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-655"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-850">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-berlian-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-berlian-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              title="Grid/Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="glass-panel rounded-xl border border-slate-800 p-20 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-berlian-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 text-sm animate-pulse">Menarik data dari database IT Helpdesk...</p>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-xl border border-red-900/30 bg-red-950/10 p-12 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="text-red-500 mb-4" size={48} />
          <h3 className="text-lg font-bold text-red-200 mb-2">Terjadi Kesalahan Koneksi</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">{error}</p>
          <button 
            onClick={fetchTickets}
            className="px-5 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg text-xs font-semibold border border-red-900/50 transition-all active:scale-95"
          >
            Coba Hubungkan Ulang
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="glass-panel rounded-xl border border-slate-800 p-20 text-center flex flex-col items-center justify-center">
          <HelpCircle className="text-slate-600 mb-4" size={48} />
          <h3 className="text-base font-semibold text-slate-300">Tidak Ada Tiket Ditemukan</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            {searchTerm || filterStatus !== 'ALL' 
              ? 'Coba ubah kata kunci pencarian atau bersihkan filter status Anda.' 
              : 'Belum ada tiket insiden yang dibuat oleh Reporter saat ini.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">ID Tiket</th>
                  <th className="py-4 px-4">Kategori</th>
                  <th className="py-4 px-4">Prioritas</th>
                  <th className="py-4 px-4">Pelapor (Reporter)</th>
                  <th className="py-4 px-4">Aset Dilaporkan</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Dibuat Pada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-xs">
                {filteredTickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => handleOpenTicket(ticket.id)}
                    className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-mono text-[11px] font-bold text-berlian-400 select-all" title={ticket.id}>
                      {ticket.ticket_number}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-200">{ticket.category}</td>
                    <td className="py-4 px-4">{getPriorityBadge(ticket.priority)}</td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-slate-300">
                          {ticket.reporter ? ticket.reporter.full_name : ticket.guest_name || 'Tamu'}
                        </div>
                        <div className="text-[10px] text-slate-500 italic">
                          {ticket.reporter ? ticket.reporter.role : `Tamu (${ticket.guest_division || 'Tanpa Divisi'})`}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {ticket.asset ? (
                        <div>
                          <div className="font-medium text-slate-300">{ticket.asset.asset_name}</div>
                          <div className="text-[10px] text-slate-500">{ticket.asset.location}</div>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Tanpa Aset</span>
                      )}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(ticket.status)}</td>
                    <td className="py-4 px-6 text-right text-slate-500 font-mono">
                      {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-900/40 px-6 py-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan <strong>{filteredTickets.length}</strong> dari <strong>{tickets.length}</strong> total tiket</span>
            <span>IT Support System v1.0</span>
          </div>
        </div>
      ) : (
        /* GRID VIEW (TICKET CARD) */
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard 
                key={ticket.id} 
                ticket={ticket} 
                onViewDetails={(t) => handleOpenTicket(t.id)}
              />
            ))}
          </div>
          <div className="mt-6 text-center text-xs text-slate-500">
            Menampilkan <strong>{filteredTickets.length}</strong> tiket dari total <strong>{tickets.length}</strong> tiket.
          </div>
        </div>
      )}

      {/* Render Modal Detail Tiket secara Pop-Up */}
      {selectedTicket && (
        <TicketDetailModal 
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
