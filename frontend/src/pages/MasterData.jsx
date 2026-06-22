import React, { useState, useEffect } from 'react';
import { Settings, PlusCircle, Search, Edit2, Trash2, X, Shield, FolderPlus, MapPin, AlignLeft, Loader2 } from 'lucide-react';

/**
 * Halaman Manajemen Data Master (Departemen & Kategori Aset) khusus Admin PT BMS.
 */
export default function MasterData() {
  const [activeSubTab, setActiveSubTab] = useState('departments'); // 'departments' | 'categories'
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Pagination states
  const [deptPage, setDeptPage] = useState(1);
  const [catPage, setCatPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [currentDept, setCurrentDept] = useState(null);
  const [currentCat, setCurrentCat] = useState(null);

  // Form states
  const [deptName, setDeptName] = useState('');
  const [deptLocation, setDeptLocation] = useState('');
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/master/departments', { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartments(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/master/categories', { headers });
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchDepartments(), fetchCategories()]);
    } catch (err) {
      setError('Gagal memuat data master dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filter & Pagination for Departments
  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.location_name && d.location_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const deptTotalPages = Math.ceil(filteredDepts.length / itemsPerPage);
  const paginatedDepts = filteredDepts.slice((deptPage - 1) * itemsPerPage, deptPage * itemsPerPage);

  // Filter & Pagination for Categories
  const filteredCats = categories.filter(c =>
    c.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const catTotalPages = Math.ceil(filteredCats.length / itemsPerPage);
  const paginatedCats = filteredCats.slice((catPage - 1) * itemsPerPage, catPage * itemsPerPage);

  // Handle Form Submissions
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const isEdit = !!currentDept;
    const url = isEdit ? `/api/master/departments/${currentDept.id}` : '/api/master/departments';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: deptName,
          location_name: deptLocation
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(result.message || 'Departemen berhasil disimpan.');
        setShowDeptModal(false);
        fetchDepartments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Gagal menyimpan departemen.');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    const isEdit = !!currentCat;
    const url = isEdit ? `/api/master/categories/${currentCat.id}` : '/api/master/categories';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category_name: catName,
          description: catDesc
        })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(result.message || 'Kategori aset berhasil disimpan.');
        setShowCatModal(false);
        fetchCategories();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Gagal menyimpan kategori.');
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Deletion
  const handleDeleteDept = async (dept) => {
    if (!window.confirm(`Hapus departemen "${dept.name}" secara permanen? Data user atau aset yang terhubung akan memblokir aksi ini.`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/master/departments/${dept.id}`, {
        method: 'DELETE',
        headers
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(result.message || 'Departemen berhasil dihapus.');
        fetchDepartments();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Gagal menghapus departemen.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCat = async (cat) => {
    if (!window.confirm(`Hapus kategori "${cat.category_name}" secara permanen? Aset yang menggunakan kategori ini akan memblokir aksi ini.`)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/master/categories/${cat.id}`, {
        method: 'DELETE',
        headers
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(result.message || 'Kategori berhasil dihapus.');
        fetchCategories();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Gagal menghapus kategori.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddDept = () => {
    setCurrentDept(null);
    setDeptName('');
    setDeptLocation('');
    setFormError(null);
    setShowDeptModal(true);
  };

  const openEditDept = (dept) => {
    setCurrentDept(dept);
    setDeptName(dept.name);
    setDeptLocation(dept.location_name || '');
    setFormError(null);
    setShowDeptModal(true);
  };

  const openAddCat = () => {
    setCurrentCat(null);
    setCatName('');
    setCatDesc('');
    setFormError(null);
    setShowCatModal(true);
  };

  const openEditCat = (cat) => {
    setCurrentCat(cat);
    setCatName(cat.category_name);
    setCatDesc(cat.description || '');
    setFormError(null);
    setShowCatModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="text-[#2596be]" /> Manajemen Data Master
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kelola data dasar organisasi departemen dan klasifikasi kategori aset PT BMS</p>
        </div>

        <button
          onClick={activeSubTab === 'departments' ? openAddDept : openAddCat}
          className="flex items-center gap-2 px-4 py-2 bg-[#2596be] hover:bg-[#1d7fa2] text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-[#2596be]/10 self-start"
        >
          <PlusCircle size={16} />
          <span>Tambah {activeSubTab === 'departments' ? 'Departemen' : 'Kategori'}</span>
        </button>
      </div>

      {/* Notifikasi */}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex flex-col gap-1">
          <span className="font-bold">⚠️ Gagal / Ditolak Sistem:</span>
          <p className="text-slate-350">{error}</p>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-900 mb-6 gap-2">
        <button
          onClick={() => { setActiveSubTab('departments'); setSearchQuery(''); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'departments' 
              ? 'border-[#2596be] text-[#2596be] font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Departemen & Divisi
        </button>
        <button
          onClick={() => { setActiveSubTab('categories'); setSearchQuery(''); }}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[2px] ${
            activeSubTab === 'categories' 
              ? 'border-[#2596be] text-[#2596be] font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          Kategori Aset
        </button>
      </div>

      {/* Control Panel: Pencarian */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-900 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder={`Cari ${activeSubTab === 'departments' ? 'nama departemen, lokasi...' : 'kategori, deskripsi...'}`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDeptPage(1);
              setCatPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#2596be] focus:ring-1 focus:ring-[#2596be] placeholder:text-slate-600 transition-all"
          />
        </div>
        <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          Total: {activeSubTab === 'departments' ? filteredDepts.length : filteredCats.length} Data
        </div>
      </div>

      {/* ==================================================== */}
      {/* PANEL 1: TAB DEPARTEMEN                              */}
      {/* ==================================================== */}
      {activeSubTab === 'departments' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 border-b border-slate-900 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Nama Departemen</th>
                    <th className="px-6 py-3.5">Lokasi Kantor</th>
                    <th className="px-6 py-3.5 text-center">Jumlah Anggota</th>
                    <th className="px-6 py-3.5 text-center">Aset Terhubung</th>
                    <th className="px-6 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs">
                  {loading && departments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-[#2596be]" size={24} />
                          <span className="text-slate-500">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedDepts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center text-slate-500 font-semibold">
                        Tidak ada data departemen ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedDepts.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/10 transition-colors text-slate-350">
                        <td className="px-6 py-4 font-bold text-white text-sm">{item.name}</td>
                        <td className="px-6 py-4 flex items-center gap-1.5 mt-2">
                          <MapPin size={12} className="text-slate-550" />
                          <span>{item.location_name || '-'}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">
                          {item._count?.users ?? 0} Karyawan
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">
                          {item._count?.assets ?? 0} Aset
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditDept(item)}
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-[#2596be]/50 rounded-lg text-slate-400 hover:text-[#2596be] transition-all"
                              title="Ubah Nama/Lokasi"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteDept(item)}
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-lg text-slate-550 hover:text-red-400 transition-all"
                              title="Hapus Departemen"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginasi Departemen */}
          {deptTotalPages > 1 && (
            <div className="flex justify-between items-center bg-slate-950/20 p-4 border border-slate-900 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">
                Halaman {deptPage} dari {deptTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={deptPage === 1}
                  onClick={() => setDeptPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-[#2596be]/45 disabled:opacity-40 text-slate-350 hover:text-white rounded-lg text-[11px] font-bold transition-all"
                >
                  ◀ Sebelumnya
                </button>
                <button
                  disabled={deptPage === deptTotalPages}
                  onClick={() => setDeptPage(p => Math.min(p + 1, deptTotalPages))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-[#2596be]/45 disabled:opacity-40 text-slate-350 hover:text-white rounded-lg text-[11px] font-bold transition-all"
                >
                  Berikutnya ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* PANEL 2: TAB KATEGORI                                */}
      {/* ==================================================== */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-950/90 backdrop-blur-md z-10 border-b border-slate-900 text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Nama Kategori</th>
                    <th className="px-6 py-3.5">Deskripsi / Peruntukan</th>
                    <th className="px-6 py-3.5 text-center">Jumlah Aset</th>
                    <th className="px-6 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40 text-xs">
                  {loading && categories.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="animate-spin text-[#2596be]" size={24} />
                          <span className="text-slate-500">Memuat data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCats.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-20 text-center text-slate-500 font-semibold">
                        Tidak ada kategori aset ditemukan.
                      </td>
                    </tr>
                  ) : (
                    paginatedCats.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/10 transition-colors text-slate-350">
                        <td className="px-6 py-4 font-bold text-white text-sm">
                          <span className="bg-[#2596be]/10 border border-[#2596be]/20 text-[#2596be] px-2.5 py-0.5 rounded font-mono text-xs font-extrabold uppercase">
                            {item.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{item.description || '-'}</td>
                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">
                          {item._count?.assets ?? 0} Perangkat
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openEditCat(item)}
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-[#2596be]/50 rounded-lg text-slate-400 hover:text-[#2596be] transition-all"
                              title="Ubah Detail Kategori"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteCat(item)}
                              className="p-1.5 bg-slate-900 border border-slate-800 hover:border-red-500/50 rounded-lg text-slate-550 hover:text-red-400 transition-all"
                              title="Hapus Kategori"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginasi Kategori */}
          {catTotalPages > 1 && (
            <div className="flex justify-between items-center bg-slate-950/20 p-4 border border-slate-900 rounded-xl">
              <span className="text-[11px] text-slate-500 font-semibold uppercase">
                Halaman {catPage} dari {catTotalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={catPage === 1}
                  onClick={() => setCatPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-[#2596be]/45 disabled:opacity-40 text-slate-350 hover:text-white rounded-lg text-[11px] font-bold transition-all"
                >
                  ◀ Sebelumnya
                </button>
                <button
                  disabled={catPage === catTotalPages}
                  onClick={() => setCatPage(p => Math.min(p + 1, catTotalPages))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-850 hover:border-[#2596be]/45 disabled:opacity-40 text-slate-350 hover:text-white rounded-lg text-[11px] font-bold transition-all"
                >
                  Berikutnya ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}


      {/* ========================================== */}
      {/* MODAL: TAMBAH / EDIT DEPARTEMEN            */}
      {/* ========================================== */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel border border-slate-850 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-900 bg-slate-950/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <FolderPlus size={16} className="text-[#2596be]" />
                {currentDept ? 'Ubah Data Departemen' : 'Registrasi Departemen Baru'}
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Departemen / Divisi</label>
                <input
                  type="text"
                  required
                  placeholder="cth: Keuangan, Operasional, HSSE"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#2596be]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin size={10} /> Lokasi Gedung / Pos
                </label>
                <input
                  type="text"
                  placeholder="cth: Kantor Utama Lt.3, Pos Checker Dermaga"
                  value={deptLocation}
                  onChange={(e) => setDeptLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#2596be]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-250 text-xs font-semibold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-[#2596be] hover:bg-[#1d7fa2] disabled:bg-berlian-850 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#2596be]/10"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{currentDept ? 'Simpan Perubahan' : 'Daftarkan Departemen'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: TAMBAH / EDIT KATEGORI              */}
      {/* ========================================== */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel border border-slate-850 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-900 bg-slate-950/20">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 flex items-center gap-2">
                <FolderPlus size={16} className="text-[#2596be]" />
                {currentCat ? 'Ubah Data Kategori' : 'Registrasi Kategori Aset Baru'}
              </h3>
              <button onClick={() => setShowCatModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCatSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Kategori Aset</label>
                <input
                  type="text"
                  required
                  placeholder="cth: PC, UPS, Printer, CCTV"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#2596be]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <AlignLeft size={10} /> Deskripsi Kategori
                </label>
                <textarea
                  placeholder="Masukkan kegunaan atau penggolongan detail aset kategori..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-slate-850 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-[#2596be] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-250 text-xs font-semibold rounded-lg transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-[#2596be] hover:bg-[#1d7fa2] disabled:bg-berlian-850 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-[#2596be]/10"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{currentCat ? 'Simpan Perubahan' : 'Daftarkan Kategori'}</span>
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
