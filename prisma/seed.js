const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses pembersihan database skema baru...');
  
  // Hapus data lama dengan urutan terbalik relasi
  await prisma.maintenanceLog.deleteMany({});
  await prisma.maintenanceSchedule.deleteMany({});
  await prisma.ticketWorklog.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.assetRelationship.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  
  console.log('Database berhasil dibersihkan.');
  console.log('Memulai seeding data master skema baru...');

  // Enkripsi password uji coba
  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Buat Departemen (Departments)
  const deptTimbangan = await prisma.department.create({
    data: { name: 'Operasional', location_name: 'Pos Timbangan JT01' },
  });

  const deptTik = await prisma.department.create({
    data: { name: 'TIK', location_name: 'Kantor Utama Lt.2' },
  });

  const deptFinance = await prisma.department.create({
    data: { name: 'Keuangan & SDM', location_name: 'Kantor Utama Lt.3' },
  });

  console.log('Data Departments berhasil dibuat.');

  // 2. Buat Pengguna (Users)
  const budi = await prisma.user.create({
    data: {
      nip: 'BMS10023',
      full_name: 'Budi Santoso',
      email: 'budi@helpdesk.com',
      password: hashedPassword,
      role: 'User',
      department_id: deptTimbangan.id,
    },
  });

  const siti = await prisma.user.create({
    data: {
      nip: 'BMS10024',
      full_name: 'Siti Rahma',
      email: 'siti@helpdesk.com',
      password: hashedPassword,
      role: 'User',
      department_id: deptFinance.id,
    },
  });

  const adi = await prisma.user.create({
    data: {
      nip: 'BMS20001',
      full_name: 'Adi Wijaya (IT Support)',
      email: 'adi@helpdesk.com',
      password: hashedPassword,
      role: 'IT Support', // Handler role
      department_id: deptTik.id,
    },
  });

  const mega = await prisma.user.create({
    data: {
      nip: 'BMS20002',
      full_name: 'Mega Lestari (IT Support)',
      email: 'mega@helpdesk.com',
      password: hashedPassword,
      role: 'IT Support',
      department_id: deptTik.id,
    },
  });

  console.log('Data Users berhasil dibuat.');

  // 3. Buat Kategori Aset (AssetCategories)
  const catPC = await prisma.assetCategory.create({
    data: { category_name: 'PC', description: 'Personal Computer & Timbangan Workstation' },
  });

  const catUPS = await prisma.assetCategory.create({
    data: { category_name: 'UPS', description: 'Uninterruptible Power Supply backup listrik' },
  });

  const catCCTV = await prisma.assetCategory.create({
    data: { category_name: 'CCTV', description: 'Kamera Pengawas Keamanan' },
  });

  console.log('Data Kategori Aset berhasil dibuat.');

  // 4. Buat Aset (Assets) dengan KUNCI DINAMIS (Attributes JSON)
  const assetPC = await prisma.asset.create({
    data: {
      asset_code: '2PC25',
      category_id: catPC.id,
      user_id: budi.id,
      department_id: deptTimbangan.id,
      status: 'Active',
      attributes: {
        os: 'Windows 10 IoT',
        ram: '8GB DDR4',
        storage: '256GB SSD',
        ip_address: '192.168.10.25',
        monitor: 'ASUS 19 Inch',
      },
      purchase_date: new Date('2024-02-15'),
      warranty_expiry: new Date('2026-02-15'),
    },
  });

  const assetUPS = await prisma.asset.create({
    data: {
      asset_code: '3UP56',
      category_id: catUPS.id,
      user_id: null,
      department_id: deptTimbangan.id,
      status: 'Active',
      attributes: {
        brand: 'APC Smart-UPS',
        capacity: '1000VA / 700 Watts',
        battery_status: 'Healthy',
        last_replaced: '2025-01-10',
      },
      purchase_date: new Date('2023-08-20'),
      warranty_expiry: new Date('2025-08-20'),
    },
  });

  const assetCCTV = await prisma.asset.create({
    data: {
      asset_code: '5CC01',
      category_id: catCCTV.id,
      user_id: null,
      department_id: deptTimbangan.id,
      status: 'Active',
      attributes: {
        resolution: '4MP (2560x1440)',
        lens: '4mm fixed',
        ip_address: '192.168.10.88',
        poe_powered: true,
      },
      purchase_date: new Date('2025-05-12'),
    },
  });

  console.log('Data Assets dengan Attributes JSON dinamis berhasil dibuat.');

  // 5. Buat Relasi Topologi Dependensi Aset (Asset Relationship)
  // cth: UPS memback-up listrik PC Timbangan
  await prisma.assetRelationship.create({
    data: {
      parent_asset_id: assetUPS.id,
      child_asset_id: assetPC.id,
      relationship_type: 'Powers',
    },
  });

  console.log('Data Asset Relationships berhasil dibuat.');

  // 6. Buat Tiket (Tickets)
  // Tiket 1: Dilaporkan oleh user resmi terdaftar
  const ticketRegistered = await prisma.ticket.create({
    data: {
      ticket_number: 'HD-202606-001',
      ticket_type: 'Incident',
      priority: 'High',
      reporter_id: budi.id,
      asset_id: assetPC.id,
      assignee_id: adi.id,
      issue_description: 'PC Timbangan mati mendadak saat listrik berkedip, kemungkinan backup battery UPS tidak mengangkat beban.',
      status: 'IN_PROGRESS',
      reported_at: new Date('2026-06-17T09:00:00Z'),
      started_at: new Date('2026-06-17T09:30:00Z'),
    },
  });

  // Tiket 2: Dilaporkan oleh Guest (tanpa login akun)
  const ticketGuest = await prisma.ticket.create({
    data: {
      ticket_number: 'HD-202606-002',
      ticket_type: 'Incident',
      priority: 'Critical',
      reporter_id: null, // Null menunjukkan Guest pelapor
      guest_name: 'Joko Susilo (Driver)',
      guest_email: 'jokosusilo@gmail.com',
      guest_nip: 'GUEST-099',
      asset_id: null,
      issue_description: 'Tiang CCTV Utama di gerbang masuk tersenggol truk trailer, CCTV mati total dan tiang miring membahayakan lalu lintas timbangan.',
      status: 'OPEN',
      reported_at: new Date('2026-06-17T11:45:00Z'),
    },
  });

  console.log('Data Tickets (Registered & Guest) berhasil dibuat.');

  // 7. Buat Worklog Tiket (TicketWorklogs) sebagai audit trail/timesheet
  await prisma.ticketWorklog.create({
    data: {
      ticket_id: ticketRegistered.id,
      technician_id: adi.id,
      log_note: 'Melakukan pembersihan debu internal unit UPS dan melakukan uji baterai (load test). Baterai drop di bawah 10.5V.',
      logged_at: new Date('2026-06-17T10:00:00Z'),
    },
  });

  console.log('Data Ticket Worklogs berhasil dibuat.');

  // 8. Buat Preventive Maintenance Schedule & Logs
  const schedule = await prisma.maintenanceSchedule.create({
    data: {
      asset_id: assetCCTV.id,
      scheduled_date: new Date('2026-06-20'),
      checklist_template: {
        physical_cleaning: 'Clean dust and dirt from camera casing and lens',
        connection_check: 'Verify RJ45 connector and POE switch port integrity',
        focus_check: 'Verify camera image focus and angle visibility',
      },
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      schedule_id: schedule.id,
      executed_by: mega.id,
      verified_by: adi.id,
      checklist_results: {
        physical_cleaning: 'Done - cleaned with microfiber and air blower',
        connection_check: 'Done - cable OK, POE port stable',
        focus_check: 'Done - angle slightly adjusted to capture truck license plates clearer',
      },
      overall_condition: 'OK',
      notes: 'Pemeliharaan bulanan CCTV Gate Masuk selesai dilaksanakan. Gambar kembali jernih.',
      executed_at: new Date('2026-06-17T11:00:00Z'),
    },
  });

  console.log('Data Preventive Maintenance Schedule & Logs berhasil dibuat.');

  // 9. Buat Histori Aset (AssetHistory)
  await prisma.assetHistory.create({
    data: {
      asset_id: assetPC.id,
      action: 'PROCUREMENT',
      to_dept_id: deptTimbangan.id,
      to_user_id: budi.id,
      notes: 'Registrasi pengadaan awal PC Workstation Timbangan dari vendor PT Computindo Jaya.',
      performed_by_id: adi.id,
      timestamp: new Date('2024-02-15T08:00:00Z'),
    },
  });

  await prisma.assetHistory.create({
    data: {
      asset_id: assetUPS.id,
      action: 'PROCUREMENT',
      to_dept_id: deptTimbangan.id,
      notes: 'Registrasi pengadaan awal unit UPS APC Smart-UPS dari vendor CV Sinar Listrik.',
      performed_by_id: adi.id,
      timestamp: new Date('2023-08-20T09:00:00Z'),
    },
  });

  await prisma.assetHistory.create({
    data: {
      asset_id: assetCCTV.id,
      action: 'PROCUREMENT',
      to_dept_id: deptTimbangan.id,
      notes: 'Pengadaan CCTV 4MP dari vendor Hikvision Security Center.',
      performed_by_id: mega.id,
      timestamp: new Date('2025-05-12T10:00:00Z'),
    },
  });

  console.log('Data Asset Histories berhasil dibuat.');
  console.log('Seeding skema baru PT BMS sukses total! Database siap digunakan.');
}

main()
  .catch((e) => {
    console.error('Terjadi error saat seeding skema baru:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
