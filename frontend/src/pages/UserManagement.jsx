import React, { useState, useEffect } from 'react';
import { User, UserPlus, Search, Edit2, Trash2, X, Shield, Mail, CreditCard, HelpCircle, Loader2 } from 'lucide-react';

/**
 * Halaman Manajemen Pengguna (CRUD) untuk Administrator PT BMS.
 */
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states (Add/Edit)
  const [nip, setNip] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Hanya untuk tambah / opsional edit
  const [role, setRole] = useState('User');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const token = localStorage.getItem('token');

  // Fetch users & departments
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch Users
      const usersRes = await fetch('/api/users-management', { headers });
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.success) {
        setUsers(usersData.data);
      } else {
        throw new Error(usersData.message || 'Gagal memuat daftar pengguna.');
      }

      // 2. Fetch Departments
      const deptRes = await fetch('/api/departments', { headers });
      const deptData = await deptRes.json();
      if (deptRes.ok && deptData.success) {
        setDepartments(deptData.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter users based on query
  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset form states
  const resetForm = () => {
    setNip('');
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('User');
    setDepartmentId(departments[0]?.id || '');
    setIsActive(true);
    setFormError(null);
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setCurrentUser(user);
    setNip(user.nip || '');
    setFullName(user.full_name || '');
    setEmail(user.email || '');
    setPassword(''); // Kosongkan password
    setRole(user.role || 'User');
    setDepartmentId(user.department_id || '');
    setIsActive(user.is_active ?? true);
    setFormError(null);
    setShowEditModal(true);
  };

  // Handle Add User Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch('/api/users-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nip,
          full_name: fullName,
          email,
          password,
          role,
          department_id: departmentId || null,
          is_active: isActive
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSuccess('Pengguna baru berhasil didaftarkan.');
        setShowAddModal(false);
        resetForm();
        fetchData();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        throw new Error(result.message || 'Gagal menambahkan pengguna baru.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Edit User Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const payload = {
        nip,
        full_name: fullName,
        email,
        role,
        department_id: departmentId || null,
        is_active: isActive
      };

      if (password) {
        payload.password = password; // Hanya kirim password jika diisi
      }

      const response = await fetch(`/api/users-management/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSuccess(`Profil pengguna ${fullName} berhasil diperbarui.`);
        setShowEditModal(false);
        resetForm();
        fetchData();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        throw new Error(result.message || 'Gagal memperbarui pengguna.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Hard Delete User
  const handleDeleteUser = async (userToDelete) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun ${userToDelete.full_name} secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users-management/${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setSuccess(result.message || 'Pengguna berhasil dihapus secara permanen.');
        fetchData();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        throw new Error(result.message || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <User className="text-berlian-500" /> Manajemen Pengguna
          </h1>
          <p className="text-slate-400 text-sm mt-1">Daftarkan, ubah peran, dan kelola akun karyawan PT Berlian Manyar Sejahtera</p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-berlian-600 hover:bg-berlian-500 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-berlian-600/10 self-start"
        >
          <UserPlus size={16} />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Notifikasi Global */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-semibold">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-450 text-xs flex flex-col gap-1.5">
          <span className="font-bold flex items-center gap-1.5">⚠️ Penolakan Aksi / Error:</span>
          <p className="font-medium text-slate-300">{error}</p>
        </div>
      )}

      {/* Control Panel: Pencarian */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-900 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Cari nama, NIP, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 focus:ring-1 focus:ring-berlian-500 placeholder:text-slate-650 transition-all"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          Total: {filteredUsers.length} Karyawan
        </div>
      </div>

      {/* User Table Card */}
      <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-berlian-500" size={32} />
            <span className="text-slate-400 text-xs font-semibold">Memuat data pengguna...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-xs font-semibold">
            Tidak ada pengguna yang cocok dengan kriteria pencarian Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/80 bg-slate-950/20 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <th className="px-6 py-3.5">Karyawan</th>
                  <th className="px-6 py-3.5">NIP & Email</th>
                  <th className="px-6 py-3.5">Hak Akses / Role</th>
                  <th className="px-6 py-3.5">Departemen</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-xs">
                {filteredUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/10 transition-colors text-slate-300">
                    {/* Kolom Karyawan */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-berlian-400">
                          {item.full_name ? item.full_name.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.full_name}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">ID: {item.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Kolom NIP & Email */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="font-mono text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded text-[10px] border border-slate-850">
                          {item.nip || '-'}
                        </span>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-1">
                          <Mail size={12} className="text-slate-650" /> {item.email}
                        </div>
                      </div>
                    </td>

                    {/* Kolom Hak Akses */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.role === 'Admin' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : item.role === 'IT Support' 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                          : 'bg-berlian-500/10 text-berlian-400 border border-berlian-500/20'
                      }`}>
                        <Shield size={10} />
                        {item.role}
                      </span>
                    </td>

                    {/* Kolom Departemen */}
                    <td className="px-6 py-4">
                      <span className="text-slate-300 font-medium">
                        {item.department ? item.department.name : '-'}
                      </span>
                    </td>

                    {/* Kolom Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.is_active 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-slate-800 text-slate-500 border border-slate-750'
                      }`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    {/* Kolom Aksi */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-berlian-500/50 rounded-lg text-slate-400 hover:text-berlian-400 transition-all"
                          title="Ubah Profil / Reset Sandi"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(item)}
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-lg text-slate-450 hover:text-red-400 transition-all"
                          title="Hapus Pengguna Permanen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: TAMBAH USER BARU                    */}
      {/* ========================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel border border-slate-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-900 bg-slate-950/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <UserPlus size={16} className="text-berlian-500" /> Registrasi Pengguna Baru
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Induk Pegawai (NIP)</label>
                  <input
                    type="text"
                    required
                    placeholder="BMS100XX"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Karyawan</label>
                  <input
                    type="email"
                    required
                    placeholder="budi@helpdesk.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi Default</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  >
                    <option value="User">Karyawan (User)</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departemen / Divisi</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  >
                    <option value="">-- Tanpa Departemen --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-800 text-berlian-600 focus:ring-berlian-500 bg-slate-900"
                />
                <label htmlFor="isActive" className="text-xs text-slate-400 font-bold select-none cursor-pointer">
                  Aktifkan akun ini sekarang (Karyawan Aktif)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-250 text-xs font-semibold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-berlian-600 hover:bg-berlian-500 disabled:bg-berlian-850 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-berlian-600/10"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Daftarkan Pengguna</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: UBAH USER & RESET PASSWORD          */}
      {/* ========================================== */}
      {showEditModal && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel border border-slate-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-900 bg-slate-950/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <Edit2 size={16} className="text-berlian-500" /> Ubah Data Pengguna: {currentUser.full_name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Induk Pegawai (NIP)</label>
                  <input
                    type="text"
                    required
                    placeholder="BMS100XX"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Budi Santoso"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Karyawan</label>
                  <input
                    type="email"
                    required
                    placeholder="budi@helpdesk.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kata Sandi Baru (Opsional)</label>
                  <input
                    type="password"
                    placeholder="Isi hanya jika ingin diganti"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peran (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  >
                    <option value="User">Karyawan (User)</option>
                    <option value="IT Support">IT Support</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departemen / Divisi</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  >
                    <option value="">-- Tanpa Departemen --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-800 text-berlian-600 focus:ring-berlian-500 bg-slate-900"
                />
                <label htmlFor="editIsActive" className="text-xs text-slate-400 font-bold select-none cursor-pointer">
                  Aktifkan akun ini (Karyawan Aktif)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-250 text-xs font-semibold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-berlian-600 hover:bg-berlian-500 disabled:bg-berlian-850 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-berlian-600/10"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
