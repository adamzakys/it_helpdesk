const prisma = require('../src/config/database');
const bcrypt = require('bcryptjs');
const notificationEmitter = require('../src/services/notificationService');

// Stub controllers to test functions directly
const userController = require('../src/controllers/userController');
const assetController = require('../src/controllers/assetController');
const ticketController = require('../src/controllers/ticketController');

async function testAll() {
  console.log('=== STARTING AUTOMATED VALIDATION TEST ===\n');

  // We fetch a custodian/reporter Budi who has active assets and ticket.
  const budi = await prisma.user.findFirst({
    where: { nip: 'BMS10023' }
  });

  const adi = await prisma.user.findFirst({
    where: { nip: 'BMS20001' }
  });

  if (!budi || !adi) {
    console.error('Seed data not found. Please seed the database first.');
    return;
  }

  // ==========================================
  // TEST 1: User Delete Validations
  // ==========================================
  console.log('--- 1. Testing User Hard Delete Validations ---');
  
  // Mock express response objects
  const mockRes = {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };

  // Try to delete Budi who is custodian of active asset 2PC25
  const req1 = { params: { id: budi.id } };
  const res1 = { ...mockRes };
  await userController.deleteUser(req1, res1);
  console.log(`Delete Custodian Budi result (Expected status 400):`, res1.statusCode, res1.data.message);

  // Try to delete Adi who is assignee on open ticket HD-202606-001
  const req2 = { params: { id: adi.id } };
  const res2 = { ...mockRes };
  await userController.deleteUser(req2, res2);
  console.log(`Delete Assignee Adi result (Expected status 400):`, res2.statusCode, res2.data.message);

  // Create a clean dummy user and verify they can be deleted
  console.log('\nCreating clean dummy user...');
  const reqCreate = {
    body: {
      nip: 'BMS_TEST_99',
      full_name: 'Test Dummy User',
      email: 'testdummy@bms.co.id',
      password: 'password123',
      role: 'User'
    }
  };
  const resCreate = { ...mockRes };
  await userController.createUser(reqCreate, resCreate);
  const createdUser = resCreate.data.data;
  console.log(`Create User result (Expected status 201):`, resCreate.statusCode, `User ID: ${createdUser.id}`);

  // Now delete this clean user
  const reqDeleteClean = { params: { id: createdUser.id } };
  const resDeleteClean = { ...mockRes };
  await userController.deleteUser(reqDeleteClean, resDeleteClean);
  console.log(`Delete Clean User result (Expected status 200):`, resDeleteClean.statusCode, resDeleteClean.data.message);

  // ==========================================
  // TEST 2: Ticket Date Filtering
  // ==========================================
  console.log('\n--- 2. Testing Ticket Date Range Filters ---');
  // Call getAllTickets with query date parameters matching ticketRegistered (2026-06-17)
  const reqFilter = {
    query: {
      startDate: '2026-06-16',
      endDate: '2026-06-18'
    }
  };
  const resFilter = { ...mockRes };
  await ticketController.getAllTickets(reqFilter, resFilter);
  console.log(`Get tickets on 2026-06-16 -> 2026-06-18 count:`, resFilter.data.count);

  // Outside date range filter
  const reqFilterOut = {
    query: {
      startDate: '2026-06-01',
      endDate: '2026-06-05'
    }
  };
  const resFilterOut = { ...mockRes };
  await ticketController.getAllTickets(reqFilterOut, resFilterOut);
  console.log(`Get tickets on 2026-06-01 -> 2026-06-05 count:`, resFilterOut.data.count);


  // ==========================================
  // TEST 3: Smart Asset Cannibalization
  // ==========================================
  console.log('\n--- 3. Testing Smart Asset Cannibalization ---');
  
  // Find category PC or create one to use as child component
  const catCategory = await prisma.assetCategory.findFirst();
  
  // Create child component asset
  const childComponent = await prisma.asset.create({
    data: {
      asset_code: 'COMP-TEST-01',
      category_id: catCategory.id,
      status: 'Spare'
    }
  });

  const parentPC = await prisma.asset.findFirst({
    where: { asset_code: '2PC25' }
  });

  console.log(`Created Component component ID: ${childComponent.id}, status: ${childComponent.status}`);
  console.log(`Target Parent PC ID: ${parentPC.id}`);

  // Test transferComponent (assembling component to parent)
  const reqTransfer = {
    body: {
      component_asset_id: childComponent.id,
      new_parent_asset_id: parentPC.id,
      notes: 'Memasang RAM test ke PC timbangan',
      performed_by_id: adi.id
    }
  };
  const resTransfer = { ...mockRes };
  await assetController.transferComponent(reqTransfer, resTransfer);
  
  // Reload and check status of component
  const componentAfterAttach = await prisma.asset.findUnique({
    where: { id: childComponent.id }
  });
  console.log(`Status child after attach to parent (Expected Active):`, componentAfterAttach.status);

  // Test transferComponent (disconnecting component back to spare)
  const reqDisconnect = {
    body: {
      component_asset_id: childComponent.id,
      new_parent_asset_id: null,
      notes: 'Mencopot RAM test kembali ke spare pool',
      performed_by_id: adi.id
    }
  };
  const resDisconnect = { ...mockRes };
  await assetController.transferComponent(reqDisconnect, resDisconnect);

  const componentAfterDisconnect = await prisma.asset.findUnique({
    where: { id: childComponent.id }
  });
  console.log(`Status child after disconnect (Expected Spare):`, componentAfterDisconnect.status);

  // Now, test retireAsset:
  // Re-attach child to parent
  await assetController.transferComponent(reqTransfer, resTransfer);
  
  // Scrappe/retire the parent PC
  console.log(`Retiring parent PC ${parentPC.asset_code}...`);
  const reqRetire = {
    params: { id: parentPC.id },
    body: {
      notes: 'Pemusnahan PC Timbangan utama',
      performed_by_id: adi.id
    }
  };
  const resRetire = { ...mockRes };
  await assetController.retireAsset(reqRetire, resRetire);

  // Check parent status
  const parentPCUpdated = await prisma.asset.findUnique({
    where: { id: parentPC.id }
  });
  console.log(`Parent PC status (Expected Scrapped):`, parentPCUpdated.status);

  // Check child status (should be auto-disconnected and returned to Spare)
  const childComponentUpdated = await prisma.asset.findUnique({
    where: { id: childComponent.id }
  });
  console.log(`Child component status after parent retirement (Expected Spare):`, childComponentUpdated.status);

  // Verify relationship is deleted
  const relationshipsCount = await prisma.assetRelationship.count({
    where: { parent_asset_id: parentPC.id }
  });
  console.log(`Remaining relationships for parent (Expected 0):`, relationshipsCount);

  // Restore parent status to Active for dev database compatibility
  await prisma.asset.update({
    where: { id: parentPC.id },
    data: { status: 'Active' }
  });

  // Clean up test child component and relationships
  await prisma.assetRelationship.deleteMany({
    where: { child_asset_id: childComponent.id }
  });
  await prisma.assetHistory.deleteMany({
    where: { asset_id: childComponent.id }
  });
  await prisma.asset.delete({
    where: { id: childComponent.id }
  });


  // ==========================================
  // TEST 4: Event-Driven Notifications
  // ==========================================
  console.log('\n--- 4. Testing Event-Driven Notification System ---');
  
  // Test Event ticketCreated with High priority
  console.log('Emitting high priority ticketCreated event...');
  const dummyCriticalTicket = {
    ticket_number: 'HD-TEST-CRITICAL-99',
    category: 'Network',
    priority: 'Critical',
    issue_description: 'Switch TIK Lt.2 rusak total, koneksi internet dan lokal terputus.',
    guest_name: null,
    reporter: { full_name: 'Budi Santoso' }
  };
  notificationEmitter.emit('ticketCreated', dummyCriticalTicket);

  // Test Event ticketCreated with Low priority
  console.log('Emitting low priority ticketCreated event...');
  const dummyLowTicket = {
    ticket_number: 'HD-TEST-LOW-01',
    category: 'Hardware',
    priority: 'Low',
    issue_description: 'Keyboard pecah di pos security gerbang 2.',
    guest_name: null,
    reporter: { full_name: 'Security Staff' }
  };
  notificationEmitter.emit('ticketCreated', dummyLowTicket);

  // Test Event statusChanged with Guest reporter
  console.log('Emitting statusChanged event for a guest reporter...');
  const guestTicket = {
    ticket_number: 'HD-TEST-GUEST-88',
    guest_name: 'Joko Susilo (Tamu)',
    guest_email: 'jokosusilotest@example.com',
    reporter_id: null,
    resolution_notes: 'Kamera CCTV diganti baru dan tiang dirapikan kembali.'
  };
  
  await notificationEmitter.emit('statusChanged', {
    ticket: guestTicket,
    oldStatus: 'OPEN',
    newStatus: 'RESOLVED',
    changedBy: adi.id,
    logNote: 'CCTV diganti dengan unit spare baru Hikvision 4MP.'
  });

  console.log('\n=== ALL AUTOMATED TESTS COMPLETED ===');
}

testAll().catch(err => {
  console.error('Test error:', err);
});
