const prisma = require('../config/database');
const notificationEmitter = require('../services/notificationService');

// Helper to map DB model Ticket to frontend-expected Ticket structure (with category & asset fields)
const mapTicket = (ticket) => {
  if (!ticket) return null;
  const mappedTicket = {
    ...ticket,
    category: ticket.ticket_type || 'Incident', // Frontend expects 'category'
    createdAt: ticket.reported_at, // Map reported_at to createdAt for compatibility
  };

  if (mappedTicket.asset) {
    mappedTicket.asset = {
      ...mappedTicket.asset,
      asset_name: `${mappedTicket.asset.category?.category_name || 'Aset'} (${mappedTicket.asset.asset_code})`,
      category: mappedTicket.asset.category?.category_name || 'Umum',
      location: mappedTicket.asset.department 
        ? `${mappedTicket.asset.department.name} (${mappedTicket.asset.department.location_name || ''})` 
        : 'Tidak Ada Lokasi',
    };
  }

  return mappedTicket;
};

/**
 * Controller untuk mengelola tiket helpdesk (Incident/Request/Problem) PT BMS.
 */

// 1. CREATE Ticket (Mendukung Reporter Resmi & Reporter Tamu/Guest)
const createTicket = async (req, res) => {
  const { 
    reporter_id, 
    guest_name, 
    guest_email, 
    guest_nip, 
    guest_division,
    asset_id, 
    category, // Kategori teks bebas / dari dropdown
    priority, 
    ticket_type,
    issue_description,
    reported_at
  } = req.body;

  // Validasi Input Wajib
  if (!issue_description) {
    return res.status(400).json({
      success: false,
      message: 'Deskripsi kendala (issue_description) wajib diisi.',
    });
  }

  // Jika bukan Guest, reporter_id wajib ada
  if (!reporter_id && !guest_name) {
    return res.status(400).json({
      success: false,
      message: 'Laporan harus menyertakan reporter_id (jika login) atau guest_name (jika pelapor tamu).',
    });
  }

  try {
    // a. Validasi User Resmi jika diberikan
    let final_reporter_id = reporter_id;
    if (reporter_id) {
      const userExists = await prisma.user.findUnique({
        where: { id: reporter_id },
      });
      if (!userExists) {
        console.warn(`Warning: User dengan ID ${reporter_id} tidak ditemukan di DB. Fallback ke guest.`);
        final_reporter_id = null;
      }
    }

    // b. Validasi Aset jika diberikan
    if (asset_id) {
      const assetExists = await prisma.asset.findUnique({
        where: { id: asset_id },
      });
      if (!assetExists) {
        return res.status(404).json({
          success: false,
          message: `Aset dengan ID ${asset_id} tidak ditemukan.`,
        });
      }
    }

    // c. Generator Nomor Tiket Otomatis: HD-YYYYMM-XXX
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `HD-${year}${month}-`;

    // Cari tiket terakhir dengan prefix bulan ini untuk menghitung counter +1
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        ticket_number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        ticket_number: 'desc',
      },
    });

    let nextNum = 1;
    if (lastTicket) {
      const lastNumStr = lastTicket.ticket_number.replace(prefix, '');
      const lastNum = parseInt(lastNumStr, 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const ticket_number = `${prefix}${String(nextNum).padStart(3, '0')}`;

    // d. Buat Tiket Baru di Database
    const ticket = await prisma.ticket.create({
      data: {
        ticket_number,
        ticket_type: ticket_type || category || 'Incident',
        priority: priority || 'Medium',
        reporter_id: final_reporter_id || null,
        guest_name: guest_name || (final_reporter_id ? null : 'Pengguna BMS'),
        guest_email: guest_email || null,
        guest_nip: guest_nip || null,
        guest_division: guest_division || null,
        asset_id: asset_id || null,
        issue_description,
        status: 'OPEN', // Tiket baru selalu diawali status Open
        reported_at: reported_at ? new Date(reported_at) : new Date(),
      },
      include: {
        reporter: {
          select: { id: true, full_name: true, nip: true, role: true, email: true }
        },
        asset: true,
      }
    });

    // Emit event ticketCreated
    notificationEmitter.emit('ticketCreated', mapTicket(ticket));

    return res.status(201).json({
      success: true,
      message: `Tiket berhasil dibuat dengan Nomor Antrean: ${ticket_number}`,
      data: mapTicket(ticket),
    });

  } catch (error) {
    console.error('Error saat membuat ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat membuat tiket.',
      error: error.message,
    });
  }
};

// 2. READ All Tickets (Mendukung pemuatan relasi relasional skema baru)
const getAllTickets = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const where = {};

    if (startDate || endDate) {
      where.reported_at = {};
      if (startDate) {
        where.reported_at.gte = new Date(`${startDate}T00:00:00+07:00`);
      }
      if (endDate) {
        where.reported_at.lte = new Date(`${endDate}T23:59:59.999+07:00`);
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        reporter: {
          select: { id: true, full_name: true, nip: true, role: true, email: true }
        },
        asset: {
          include: {
            category: true,
            department: true,
          }
        },
        assignee: {
          select: { id: true, full_name: true, role: true }
        }
      },
      orderBy: {
        reported_at: 'desc',
      },
    });

    const mappedTickets = tickets.map(mapTicket);
    return res.status(200).json({
      success: true,
      count: mappedTickets.length,
      data: mappedTickets,
    });
  } catch (error) {
    console.error('Error saat mengambil semua tiket:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil tiket.',
      error: error.message,
    });
  }
};

// 3. READ Ticket by ID (Detail Lengkap beserta Worklogs / Timesheet Pengerjaan)
const getTicketById = async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, full_name: true, nip: true, role: true, email: true }
        },
        asset: {
          include: {
            category: true,
            department: true,
          }
        },
        assignee: {
          select: { id: true, full_name: true, role: true }
        },
        worklogs: {
          include: {
            technician: {
              select: { id: true, full_name: true, role: true }
            }
          },
          orderBy: {
            logged_at: 'asc', // Kronologis pengerjaan
          }
        }
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Tiket dengan ID ${id} tidak ditemukan.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: mapTicket(ticket),
    });
  } catch (error) {
    console.error('Error saat mengambil detail tiket:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat mengambil detail tiket.',
      error: error.message,
    });
  }
};

// 4. UPDATE Ticket & Timesheet Log (Prisma Transaction)
// Menggantikan TicketLog dengan tabel baru TicketWorklog
const updateTicket = async (req, res) => {
  const { id } = req.params;
  const { 
    status, 
    assignee_id, 
    root_cause_analysis, 
    resolution_notes, 
    changed_by, // ID Teknisi yang sedang login dan melakukan update
    log_note // Catatan Timesheet/Pengerjaan teknisi
  } = req.body;

  try {
    // Ambil data tiket saat ini
    const existingTicket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: `Tiket dengan ID ${id} tidak ditemukan.`,
      });
    }

    const isStatusChanged = status && status !== existingTicket.status;

    // Jika terjadi update status atau penginputan catatan penanganan, changed_by wajib diisi
    if ((isStatusChanged || log_note) && !changed_by) {
      return res.status(400).json({
        success: false,
        message: 'Field "changed_by" (ID Teknisi) wajib disertakan untuk mencatat riwayat log penanganan (TicketWorklog).',
      });
    }

    // Validasi Teknisi
    if (changed_by) {
      const techExists = await prisma.user.findUnique({
        where: { id: changed_by },
      });
      if (!techExists) {
        return res.status(404).json({
          success: false,
          message: `Teknisi dengan ID ${changed_by} tidak terdaftar di database.`,
        });
      }
    }

    // Menentukan penyesuaian tanggal pengerjaan tiket
    let started_at = undefined;
    let resolved_at = undefined;

    if (isStatusChanged) {
      if (status === 'In Progress' && !existingTicket.started_at) {
        started_at = new Date();
      } else if ((status === 'Resolved' || status === 'Closed') && !existingTicket.resolved_at) {
        resolved_at = new Date();
      }
    }

    // Lakukan update tiket dan pembuatan worklog dalam satu transaksi atomik
    const updatedTicketResult = await prisma.$transaction(async (tx) => {
      // a. Update tiket
      const updatedTicket = await tx.ticket.update({
        where: { id },
        data: {
          status: status || undefined,
          assignee_id: assignee_id || undefined,
          root_cause_analysis: root_cause_analysis || undefined,
          resolution_notes: resolution_notes || undefined,
          started_at,
          resolved_at,
        },
      });

      // b. Buat baris log baru di TicketWorklog jika ada status baru atau catatan baru
      if (isStatusChanged || log_note) {
        const finalLogNote = log_note || `Mengubah status dari ${existingTicket.status} menjadi ${status}`;
        
        await tx.ticketWorklog.create({
          data: {
            ticket_id: id,
            technician_id: changed_by,
            log_note: isStatusChanged 
              ? `[Status Update: ${existingTicket.status} ➔ ${status}] ${finalLogNote}`
              : log_note,
          },
        });
      }

      return updatedTicket;
    });

    // Fetch full updated ticket with relations to return complete data
    const fullUpdatedTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, full_name: true, nip: true, role: true, email: true }
        },
        asset: {
          include: {
            category: true,
            department: true,
          }
        },
        assignee: {
          select: { id: true, full_name: true, role: true }
        },
        worklogs: {
          include: {
            technician: {
              select: { id: true, full_name: true, role: true }
            }
          },
          orderBy: {
            logged_at: 'asc',
          }
        }
      }
    });

    // Emit event statusChanged if status changed
    if (isStatusChanged) {
      notificationEmitter.emit('statusChanged', {
        ticket: mapTicket(fullUpdatedTicket),
        oldStatus: existingTicket.status,
        newStatus: status,
        changedBy,
        logNote: log_note
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tiket berhasil diperbarui dan riwayat pengerjaan tercatat di worklog.',
      data: mapTicket(fullUpdatedTicket),
    });

  } catch (error) {
    console.error('Error saat memperbarui tiket:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat memperbarui tiket.',
      error: error.message,
    });
  }
};

// 5. DELETE Ticket
const deleteTicket = async (req, res) => {
  const { id } = req.params;

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Tiket dengan ID ${id} tidak ditemukan.`,
      });
    }

    // Hapus tiket. Worklog otomatis terhapus berantai (Cascade)
    await prisma.ticket.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: `Tiket dengan ID ${id} beserta seluruh log pengerjaan teknisinya berhasil dihapus.`,
    });
  } catch (error) {
    console.error('Error saat menghapus tiket:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server saat menghapus tiket.',
      error: error.message,
    });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
};
