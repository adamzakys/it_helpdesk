const EventEmitter = require('events');
const nodemailer = require('nodemailer');

class NotificationEmitter extends EventEmitter {}
const notificationEmitter = new NotificationEmitter();

// Nodemailer Transporter Configuration
// Using generic environment variables, with clean fallback to mock development settings
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.MAIL_PORT || '2525', 10),
  auth: {
    user: process.env.MAIL_USER || 'dummy_user',
    pass: process.env.MAIL_PASS || 'dummy_pass'
  }
});

// Event Listener 'ticketCreated'
notificationEmitter.on('ticketCreated', (ticket) => {
  console.log(`[Notification Service] Triggered 'ticketCreated' for Ticket: ${ticket.ticket_number}`);
  const priority = ticket.priority ? ticket.priority.toUpperCase() : 'MEDIUM';

  if (priority === 'CRITICAL' || priority === 'HIGH') {
    // Flash escalation for urgent incidents to the IT Coordinator
    const itCoordinatorPhone = process.env.IT_COORDINATOR_PHONE || '+628123456789';
    console.log(`\n======================================================================`);
    console.log(`[FLASH ESCALATION] [API SIMULATION - WhatsApp/Telegram]`);
    console.log(`To: ${itCoordinatorPhone} (Koordinator IT PT BMS)`);
    console.log(`Message: "🚨 ESKALASI DARURAT! Tiket baru #${ticket.ticket_number} dibuat dengan prioritas ${priority}.`);
    console.log(`Kategori: ${ticket.category}`);
    console.log(`Deskripsi: ${ticket.issue_description}`);
    console.log(`Pelapor: ${ticket.reporter ? ticket.reporter.full_name : ticket.guest_name + ' (Tamu)'}"`);
    console.log(`======================================================================\n`);
  } else {
    // Broadcast normal queue announcement
    console.log(`\n======================================================================`);
    console.log(`[QUEUE BROADCAST] [System Broadcast]`);
    console.log(`Message: "Tiket Baru #${ticket.ticket_number} (Prioritas: ${priority}) telah didaftarkan ke antrean IT Support.`);
    console.log(`Kategori: ${ticket.category}`);
    console.log(`Deskripsi: ${ticket.issue_description}"`);
    console.log(`======================================================================\n`);
  }
});

// Event Listener 'statusChanged'
notificationEmitter.on('statusChanged', async ({ ticket, oldStatus, newStatus, changedBy, logNote }) => {
  console.log(`[Notification Service] Triggered 'statusChanged' for Ticket: ${ticket.ticket_number} (${oldStatus} ➔ ${newStatus})`);

  // Check if reporter is a Guest (guest_name is present and reporter_id is null/undefined)
  if (ticket.guest_name && !ticket.reporter_id) {
    if (ticket.guest_email) {
      const resolutionNotes = logNote || ticket.resolution_notes || 'Tidak ada catatan penanganan tambahan.';
      console.log(`[Notification Service] Guest reporter detected: ${ticket.guest_name} (${ticket.guest_email}). Sending resolution email...`);

      const mailOptions = {
        from: '"BMS IT Support" <noreply@bms.co.id>',
        to: ticket.guest_email,
        subject: `[BMS IT Helpdesk] Update Status Tiket #${ticket.ticket_number}: ${newStatus}`,
        text: `Halo ${ticket.guest_name},

Status tiket kendala Anda #${ticket.ticket_number} telah diperbarui dari "${oldStatus}" menjadi "${newStatus}".

Catatan Resolusi / Pengerjaan IT Support:
"${resolutionNotes}"

Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim IT Support di Gedung Utama BMS.

Terima kasih,
IT Support Team PT Berlian Manyar Sejahtera.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
            <h2 style="color: #1d7fa2; border-bottom: 2px solid #2596be; padding-bottom: 10px; margin-top: 0;">Update Penanganan Kendala IT</h2>
            <p>Halo <strong>${ticket.guest_name}</strong>,</p>
            <p>Status laporan kendala Anda dengan nomor tiket <strong>${ticket.ticket_number}</strong> telah diperbarui:</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2596be;">
              <p style="margin: 0; font-size: 14px;">Status Sebelumnya: <span style="text-decoration: line-through; color: #64748b;">${oldStatus}</span></p>
              <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; color: #1d7fa2;">Status Baru: ${newStatus}</p>
            </div>
            <p><strong>Catatan Resolusi / Penanganan IT Support:</strong></p>
            <blockquote style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin: 10px 0; font-style: italic; color: #334155; border-radius: 4px;">
              "${resolutionNotes}"
            </blockquote>
            <p style="font-size: 12px; color: #64748b; margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 15px;">
              Ini adalah email otomatis dari Sistem IT Helpdesk PT Berlian Manyar Sejahtera. Harap tidak membalas email ini secara langsung.
            </p>
          </div>
        `
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT SUCCESS] Email notification successfully sent to ${ticket.guest_email}`);
      } catch (error) {
        console.error(`[EMAIL SENT FAILURE] Failed to send email to ${ticket.guest_email}:`, error.message);
        // Print email contents as simulation fallback
        console.log(`[EMAIL SIMULATION FALLBACK]`);
        console.log(`======================================================================`);
        console.log(`TO: ${ticket.guest_email}`);
        console.log(`SUBJECT: ${mailOptions.subject}`);
        console.log(`CONTENT: ${mailOptions.text}`);
        console.log(`======================================================================`);
      }
    } else {
      console.warn(`[Notification Service] Guest reporter email is not provided. Skipping email send.`);
    }
  }
});

module.exports = notificationEmitter;
