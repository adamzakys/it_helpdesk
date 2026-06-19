import React from 'react';
import { 
  User, 
  HardDrive, 
  MapPin, 
  Clock, 
  Tag, 
  ArrowRight
} from 'lucide-react';

/**
 * Komponen TicketCard untuk menampilkan ringkasan tiket IT Helpdesk.
 * Menerima props 'ticket' (objek tiket) dan 'onViewDetails' (fungsi callback opsional).
 */
export default function TicketCard({ ticket, onViewDetails }) {
  const {
    id,
    category,
    priority,
    status,
    reporter,
    asset,
    createdAt
  } = ticket;

  // 1. Mapping warna dinamis untuk Status Badge (Tailwind v3)
  const getStatusStyles = (statusVal) => {
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

  // 2. Mapping warna dinamis untuk Priority Tag
  const getPriorityStyles = (priorityVal) => {
    switch (priorityVal?.toUpperCase()) {
      case 'CRITICAL':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'MEDIUM':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'LOW':
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  // Format tanggal ke format lokal Indonesia
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass-card rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-berlian-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div>
        {/* Header: Category & Priority */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-berlian-400 font-semibold text-sm tracking-wide uppercase">
            <Tag size={14} />
            <span>{category}</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border ${getPriorityStyles(priority)}`}>
            {priority}
          </span>
        </div>

        {/* Ticket ID & Status */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-mono text-xs font-bold text-berlian-400 truncate w-32" title={id}>
            {ticket.ticket_number || `#${id.substring(0, 8)}`}
          </h3>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border tracking-wide ${getStatusStyles(status)}`}>
            {status}
          </span>
        </div>

        {/* Reporter Info */}
        <div className="flex items-center gap-3 bg-slate-900/40 p-3 rounded-lg border border-slate-800/50 mb-4">
          <div className="w-8 h-8 rounded-full bg-berlian-500/10 flex items-center justify-center text-berlian-400 border border-berlian-500/25 shrink-0">
            <User size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium">Pelapor</p>
            <p className="text-sm font-semibold text-slate-200 truncate">
              {reporter ? reporter.full_name : ticket.guest_name || 'Tamu / Guest'}
            </p>
          </div>
        </div>

        {/* Asset Details */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <HardDrive size={14} className="text-slate-500 shrink-0" />
            <span className="truncate">
              Aset: <strong className="text-slate-350 font-medium">{asset ? asset.asset_name : 'Tidak Ada Aset'}</strong>
            </span>
          </div>
          {asset && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-5">
              <MapPin size={12} className="text-slate-600 shrink-0" />
              <span className="truncate text-[11px] text-slate-500">{asset.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Date & Details Button */}
      <div className="pt-4 border-t border-slate-850 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={12} />
          <span>{formatDate(createdAt)}</span>
        </div>
        
        {onViewDetails && (
          <button 
            onClick={() => onViewDetails(ticket)}
            className="flex items-center gap-1 text-xs text-berlian-400 hover:text-berlian-300 font-medium group transition-colors duration-200"
          >
            <span>Detail</span>
            <ArrowRight size={14} className="transform group-hover:translate-x-0.5 transition-transform duration-250" />
          </button>
        )}
      </div>
    </div>
  );
}
