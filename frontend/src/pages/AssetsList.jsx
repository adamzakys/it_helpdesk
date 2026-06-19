import React, { useState, useEffect, useMemo } from 'react';
import { 
  HardDrive, 
  MapPin, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  History, 
  Move, 
  Cpu, 
  Trash2, 
  CheckCircle, 
  FileText, 
  DollarSign, 
  ShieldCheck, 
  Calendar, 
  Truck, 
  ArrowLeftRight, 
  Boxes,
  User
} from 'lucide-react';

export default function AssetsList() {
  const [assets, setAssets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Navigation tabs: 'list' | 'spare_pool' | 'topology'
  const [activeTab, setActiveTab] = useState('list');

  // Modal states
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showMutateModal, setShowMutateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const activeUser = JSON.parse(localStorage.getItem('user')) || {};

  // 1. Procurement Form
  const [newAssetCode, setNewAssetCode] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newStatus, setNewStatus] = useState('Spare');
  const [newVendor, setNewVendor] = useState('');
  const [newPurchaseDate, setNewPurchaseDate] = useState('');
  const [newWarrantyMonths, setNewWarrantyMonths] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newAttributes, setNewAttributes] = useState({
    ram: '', storage: '', os: '', ip_address: '', brand: '', capacity: '', resolution: ''
  });

  // 2. Mutation Form
  const [mutateDeptId, setMutateDeptId] = useState('');
  const [mutateUserId, setMutateUserId] = useState('');
  const [mutateStatus, setMutateStatus] = useState('Active');
  const [mutateNotes, setMutateNotes] = useState('');

  // 3. Cannibal / Part Transfer Form
  const [transferComponentId, setTransferComponentId] = useState('');
  const [transferTargetParentId, setTransferTargetParentId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  // 4. Scrap/Retire Form
  const [retireNotes, setRetireNotes] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Fetch all basic data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch Assets
      const assetsRes = await fetch('/api/assets', { headers });
      const assetsResult = await assetsRes.json();
      if (assetsRes.ok && assetsResult.success) {
        setAssets(assetsResult.data);
      } else {
        throw new Error(assetsResult.message || 'Gagal mengambil data aset.');
      }

      // Fetch Metrics
      const metricsRes = await fetch('/api/assets/dashboard/metrics', { headers });
      const metricsResult = await metricsRes.json();
      if (metricsRes.ok && metricsResult.success) {
        setMetrics(metricsResult.data);
      }

      // Fetch Departments
      const deptsRes = await fetch('/api/departments', { headers });
      const deptsResult = await deptsRes.json();
      if (deptsRes.ok && deptsResult.success) {
        setDepartments(deptsResult.data);
      }

      // Fetch Users
      const usersRes = await fetch('/api/users', { headers });
      const usersResult = await usersRes.json();
      if (usersRes.ok && usersResult.success) {
        setUsers(usersResult.data);
      }

      // Fetch Categories
      const catsRes = await fetch('/api/categories', { headers });
      const catsResult = await catsRes.json();
      if (catsRes.ok && catsResult.success) {
        setCategories(catsResult.data);
      }

    } catch (err) {
      console.error('Error fetching inventory details:', err);
      setError(err.message || 'Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch specific asset history logs
  const handleOpenHistory = async (asset) => {
    setSelectedAsset(asset);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryLogs([]);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assets/${asset.id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setHistoryLogs(result.data);
      } else {
        alert(result.message || 'Gagal memuat riwayat aset.');
      }
    } catch (err) {
      console.error(err);
      alert('Koneksi gagal.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Submit Procurement (New Stock/Asset)
  const handleProcureSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assets/procure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_code: newAssetCode,
          category_id: newCategoryId,
          status: newStatus,
          purchase_date: newPurchaseDate || null,
          warranty_months: newWarrantyMonths || null,
          vendor: newVendor,
          purchase_price: newPurchasePrice || null,
          attributes: newAttributes,
          performed_by_id: activeUser.id,
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setActionSuccess(true);
        // Reset form
        setNewAssetCode('');
        setNewCategoryId('');
        setNewVendor('');
        setNewPurchaseDate('');
        setNewWarrantyMonths('');
        setNewPurchasePrice('');
        setNewAttributes({ ram: '', storage: '', os: '', ip_address: '', brand: '', capacity: '', resolution: '' });
        
        await fetchData();
        setTimeout(() => {
          setShowProcureModal(false);
          setActionSuccess(false);
        }, 1200);
      } else {
        throw new Error(result.message || 'Gagal membuat pengadaan baru.');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Asset Mutation
  const handleMutateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assets/${selectedAsset.id}/mutate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department_id: mutateDeptId || null,
          user_id: mutateUserId || null,
          status: mutateStatus,
          notes: mutateNotes,
          performed_by_id: activeUser.id,
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setActionSuccess(true);
        setMutateDeptId('');
        setMutateUserId('');
        setMutateNotes('');
        
        await fetchData();
        setTimeout(() => {
          setShowMutateModal(false);
          setActionSuccess(false);
        }, 1200);
      } else {
        throw new Error(result.message || 'Gagal menyimpan mutasi.');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Part Transfer (Cannibalism)
  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/assets/components/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          component_asset_id: transferComponentId,
          new_parent_asset_id: transferTargetParentId || null,
          notes: transferNotes,
          performed_by_id: activeUser.id,
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setActionSuccess(true);
        setTransferComponentId('');
        setTransferTargetParentId('');
        setTransferNotes('');
        
        await fetchData();
        setTimeout(() => {
          setShowTransferModal(false);
          setActionSuccess(false);
        }, 1200);
      } else {
        throw new Error(result.message || 'Gagal memproses kanibalisasi.');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Retirement (Scrap)
  const handleRetireSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);
    setActionSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/assets/${selectedAsset.id}/retire`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: retireNotes,
          performed_by_id: activeUser.id,
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setActionSuccess(true);
        setRetireNotes('');
        
        await fetchData();
        setTimeout(() => {
          setShowRetireModal(false);
          setActionSuccess(false);
        }, 1200);
      } else {
        throw new Error(result.message || 'Gagal melakukan pemusnahan aset.');
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter dynamic memo
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = 
        (asset.asset_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.status || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.user?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'ALL' || asset.category === filterCategory;
      const matchesStatus = filterStatus === 'ALL' || asset.status === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchTerm, filterCategory, filterStatus]);

  // Extract unique category names
  const categoryNames = useMemo(() => {
    const names = new Set(assets.map(a => a.category).filter(Boolean));
    return ['ALL', ...Array.from(names)];
  }, [assets]);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>;
      case 'SPARE':
      case 'IN STOCK':
      case 'IN_STOCK':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">SPARE POOL</span>;
      case 'MAINTENANCE':
      case 'UNDER_MAINTENANCE':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">MAINTENANCE</span>;
      case 'BROKEN':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">BROKEN</span>;
      case 'SCRAPPED':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">SCRAPPED</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardDrive className="text-berlian-500" /> Lifecycle & Manajemen Aset IT
          </h1>
          <p className="text-slate-400 text-sm mt-1">Siklus pengadaan, perputaran mutasi, audit trail history, spare pool, & pemusnahan barang PT BMS</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowProcureModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-berlian-600 hover:bg-berlian-500 text-white font-semibold shadow-lg shadow-berlian-500/10 transition-all active:scale-95 text-xs"
          >
            <Plus size={14} />
            <span>Pengadaan Aset</span>
          </button>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-semibold transition-all active:scale-95 text-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'list' 
              ? 'border-berlian-500 text-white bg-berlian-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <HardDrive size={14} />
          <span>Inventoris Aset</span>
        </button>
        <button
          onClick={() => setActiveTab('spare_pool')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'spare_pool' 
              ? 'border-berlian-500 text-white bg-berlian-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Boxes size={14} />
          <span>Dashboard Spare Pool</span>
        </button>
        <button
          onClick={() => setActiveTab('topology')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'topology' 
              ? 'border-berlian-500 text-white bg-berlian-500/5' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <ArrowLeftRight size={14} />
          <span>Kanibalisasi Komponen</span>
        </button>
      </div>

      {/* TAB CONTENT: LIST INVENTORIS */}
      {activeTab === 'list' && (
        <>
          {/* Controls Panel */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Cari berdasarkan kode, lokasi, penanggung jawab..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-655"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-berlian-500"
              >
                <option value="ALL">Semua Kategori</option>
                {categoryNames.filter(c => c !== 'ALL').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-berlian-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="Active">Active</option>
                <option value="Spare">Spare</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Broken">Broken</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>
          </div>

          {/* Asset Grid List */}
          {loading ? (
            <div className="glass-panel rounded-xl border border-slate-800 p-20 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-berlian-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 text-sm">Menarik daftar inventoris aset...</p>
            </div>
          ) : error ? (
            <div className="glass-panel rounded-xl border border-red-900/30 bg-red-950/10 p-12 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="text-red-500 mb-3" size={36} />
              <h3 className="text-base font-bold text-red-200 mb-1">Gagal Memuat Aset</h3>
              <p className="text-slate-400 text-xs max-w-sm mb-4">{error}</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="glass-panel rounded-xl border border-slate-800 p-20 text-center">
              <p className="text-slate-500 text-sm">Tidak ada data aset IT yang sesuai dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <div key={asset.id} className="glass-card rounded-xl p-5 border relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-berlian-500/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="font-bold text-slate-200 text-sm truncate" title={asset.asset_name}>
                        {asset.asset_name}
                      </h3>
                      {getStatusBadge(asset.status)}
                    </div>
                    
                    {/* Detail Informasi */}
                    <div className="text-[11px] text-slate-400 space-y-1.5 mt-4">
                      <div className="flex justify-between">
                        <span>Kode Aset:</span>
                        <strong className="text-slate-300 font-mono select-all">{asset.asset_code}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Penanggung Jawab:</span>
                        <strong className="text-slate-300 truncate max-w-[150px]">{asset.user?.full_name || 'Gudang IT (Spare)'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Lokasi Fisik:</span>
                        <strong className="text-slate-300 truncate max-w-[150px]">{asset.location || 'Gudang IT'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Garansi Hingga:</span>
                        <strong className="text-slate-300">
                          {asset.warranty_expiry 
                            ? new Date(asset.warranty_expiry).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' }) 
                            : 'Tanpa Garansi'}
                        </strong>
                      </div>
                    </div>

                    {/* Attributes JSON values */}
                    {asset.attributes && Object.keys(asset.attributes).length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-850/60 text-[10px] space-y-1">
                        <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[9px] mb-1">Spesifikasi Detail</span>
                        {Object.entries(asset.attributes).map(([key, val]) => {
                          if (!val || typeof val === 'object') return null;
                          return (
                            <div key={key} className="flex justify-between font-mono">
                              <span className="text-slate-500 capitalize">{key.replace('_', ' ')}:</span>
                              <span className="text-slate-400 truncate max-w-[170px]">{String(val)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions bar */}
                  <div className="pt-4 border-t border-slate-850 mt-5 flex items-center justify-between text-xs">
                    {/* View history */}
                    <button
                      onClick={() => handleOpenHistory(asset)}
                      className="flex items-center gap-1 text-slate-400 hover:text-berlian-400 transition-colors"
                      title="Riwayat Audit Pergerakan"
                    >
                      <History size={14} />
                      <span>Riwayat</span>
                    </button>

                    {/* Mutasi / Scrap if not scrapped */}
                    {asset.status !== 'Scrapped' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedAsset(asset); setShowMutateModal(true); }}
                          className="flex items-center gap-1 bg-berlian-600/10 border border-berlian-500/20 text-berlian-400 hover:bg-berlian-600/25 px-2.5 py-1 rounded transition-colors"
                          title="Mutasi Lokasi & Custodian"
                        >
                          <Move size={12} />
                          <span>Mutasi</span>
                        </button>
                        <button
                          onClick={() => { setSelectedAsset(asset); setShowRetireModal(true); }}
                          className="flex items-center gap-1 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/20 px-2.5 py-1 rounded transition-colors"
                          title="Musnahkan Aset (Scrap)"
                        >
                          <Trash2 size={12} />
                          <span>Scrap</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[10px]">Aset Telah Dimusnahkan</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: SPARE POOL DASHBOARD */}
      {activeTab === 'spare_pool' && (
        <div className="space-y-8">
          {/* Main stats widgets */}
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="glass-panel rounded-xl p-5 border border-slate-800">
                <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">Total Aset IT</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{metrics.stats.total}</h2>
                <p className="text-[10px] text-slate-500 mt-1">Registrasi inventaris</p>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-slate-800">
                <span className="text-emerald-500 block uppercase tracking-wider text-[10px] font-bold">Aset Aktif</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{metrics.stats.active}</h2>
                <p className="text-[10px] text-slate-500 mt-1">Digunakan custodian</p>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-slate-800">
                <span className="text-blue-400 block uppercase tracking-wider text-[10px] font-bold">Cadangan (Spare Pool)</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{metrics.stats.spare}</h2>
                <p className="text-[10px] text-slate-500 mt-1">Gudang IT (Ready to deploy)</p>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-slate-800">
                <span className="text-amber-500 block uppercase tracking-wider text-[10px] font-bold">Perbaikan/Maintenance</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{metrics.stats.maintenance + metrics.stats.broken}</h2>
                <p className="text-[10px] text-slate-500 mt-1">Broken atau maintenance</p>
              </div>
              <div className="glass-panel rounded-xl p-5 border border-slate-800">
                <span className="text-slate-500 block uppercase tracking-wider text-[10px] font-bold">Dimusnahkan (Scrapped)</span>
                <h2 className="text-3xl font-extrabold text-white mt-1">{metrics.stats.scrapped}</h2>
                <p className="text-[10px] text-slate-500 mt-1">Scrapped (Audit abadi)</p>
              </div>
            </div>
          )}

          {/* Spare Pool Stocks Gauges */}
          <div className="glass-panel rounded-xl border border-slate-800 p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-350 mb-6 flex items-center gap-1.5">
              <Boxes className="text-berlian-400" size={16} /> Status Cadangan Gudang IT (Spare Pool)
            </h3>
            
            {metrics?.sparePool && metrics.sparePool.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.sparePool.map(pool => (
                  <div key={pool.id} className="bg-slate-900/30 p-5 border border-slate-850 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-200 text-xs uppercase">{pool.category_name}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${pool.spare_count > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                        {pool.spare_count} Ready
                      </span>
                    </div>
                    {/* Progress Bar visual indicator */}
                    <div className="space-y-1">
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-berlian-500 transition-all duration-500" 
                          style={{ width: `${Math.min((pool.spare_count / 5) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                        <span>0 Unit</span>
                        <span>Target Operasional Cadangan: 5 Unit</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Data metrik cadangan tidak ditemukan.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TOPOLOGI & KANIBALISASI KOMPONEN */}
      {activeTab === 'topology' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Kanibalisasi */}
          <div className="glass-panel rounded-xl border border-slate-800 p-6 h-fit lg:col-span-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-berlian-400 mb-4 flex items-center gap-1.5">
              <Cpu size={16} /> Portal Kanibalisasi Perangkat
            </h3>
            
            <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
              Gunakan formulir ini jika Anda mencopot komponen (child asset) dari suatu unit hardware di lapangan (misal RAM, Motherboard, UPS) untuk dipasang ke hardware operasional lainnya. Sistem akan otomatis memutuskan relasi lama, membuat relasi baru, dan mencatat log history di ketiga aset.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              {/* Select Component */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Komponen Child Yang Dicopot *</label>
                <select
                  required
                  value={transferComponentId}
                  onChange={(e) => setTransferComponentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                >
                  <option value="">-- Pilih Komponen / Aset Child --</option>
                  {assets.filter(a => a.status !== 'Scrapped').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.asset_code} - {a.asset_name} ({a.location || 'Gudang'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Parent Target */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dipasang Ke Induk (Parent) *</label>
                <select
                  required
                  value={transferTargetParentId}
                  onChange={(e) => setTransferTargetParentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                >
                  <option value="">-- Pilih Perangkat Induk Baru (Target PC/Hardware) --</option>
                  {assets.filter(a => a.id !== transferComponentId && a.status !== 'Scrapped').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.asset_code} - {a.asset_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transfer Notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Catatan Alasan Kanibal / Transfer</label>
                <textarea
                  rows={3}
                  placeholder="Sebutkan alasan kanibalisasi unit (misal: Motherboard PC Timbangan A rusak, RAM dicopot untuk mengupgrade kapasitas PC Timbangan B)..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650"
                ></textarea>
              </div>

              {/* Action response */}
              {actionError && <p className="text-[10px] text-red-400">{actionError}</p>}
              {actionSuccess && <p className="text-[10px] text-emerald-400">Komponen berhasil dipindahkan!</p>}

              <button
                type="submit"
                disabled={actionLoading || actionSuccess}
                className="w-full py-2 bg-berlian-600 hover:bg-berlian-500 text-white font-semibold rounded-lg text-xs shadow-md transition-all active:scale-95 disabled:opacity-55 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? 'Memproses...' : (
                  <>
                    <ArrowLeftRight size={14} />
                    <span>Proses Kanibalisasi</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List Topology Dependencies */}
          <div className="glass-panel rounded-xl border border-slate-800 p-6 lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5">
              <Cpu size={16} className="text-berlian-400" /> Relasi Topologi Struktur Perangkat Komponen
            </h3>
            
            <p className="text-[11px] text-slate-500 mb-6">
              Daftar relasi dependensi topologi perangkat IT operasional PT BMS saat ini yang mendeteksi relasi child-parent (perangkat di dalam perangkat).
            </p>

            <div className="divide-y divide-slate-850 space-y-3">
              {assets.filter(a => a.childRelationships && a.childRelationships.length > 0).map(parent => (
                <div key={parent.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-200">
                    <HardDrive size={14} className="text-berlian-400" />
                    <span>{parent.asset_code} ({parent.category})</span>
                    <span className="text-[10px] text-slate-500 font-normal">berisi komponen:</span>
                  </div>
                  
                  {/* Children mapping */}
                  <div className="pl-6 space-y-1.5 border-l border-slate-800/80 ml-2">
                    {parent.childRelationships.map(rel => (
                      <div key={rel.id} className="flex justify-between items-center text-xs text-slate-400 bg-slate-900/20 p-2 border border-slate-850/60 rounded">
                        <span className="font-medium text-slate-300">
                          ⚙️ {rel.childAsset?.asset_code} ({rel.childAsset?.attributes?.brand || 'RAM/Komponen'})
                        </span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-500 font-mono">
                          Relasi: {rel.relationship_type || 'Contains'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {assets.filter(a => a.childRelationships && a.childRelationships.length > 0).length === 0 && (
                <p className="text-xs text-slate-500 italic py-6 text-center">Belum ada topologi component child yang terjalin saat ini.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 1: PENGADAAN BARANG BARU (PROCUREMENT)                           */}
      {/* ====================================================================== */}
      {showProcureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-850 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Registrasi Pengadaan Aset Baru</h3>
              <button onClick={() => setShowProcureModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">Tutup</button>
            </div>
            
            <form onSubmit={handleProcureSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kode Aset */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kode Aset * (Unik)</label>
                  <input
                    type="text"
                    required
                    placeholder="cth: 3UP57, 5CC02"
                    value={newAssetCode}
                    onChange={(e) => setNewAssetCode(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Kategori Aset *</label>
                  <select
                    required
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.category_name} ({c.description || ''})</option>
                    ))}
                  </select>
                </div>

                {/* Vendor */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Vendor Penyuplai</label>
                  <input
                    type="text"
                    placeholder="cth: PT Computindo Jaya"
                    value={newVendor}
                    onChange={(e) => setNewVendor(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                {/* Harga Pengadaan */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Harga Pengadaan (Rupiah)</label>
                  <input
                    type="number"
                    placeholder="cth: 12000000"
                    value={newPurchasePrice}
                    onChange={(e) => setNewPurchasePrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                {/* Tanggal Beli */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tanggal Pembelian</label>
                  <input
                    type="date"
                    value={newPurchaseDate}
                    onChange={(e) => setNewPurchaseDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                {/* Masa Garansi */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Durasi Garansi (Bulan)</label>
                  <input
                    type="number"
                    placeholder="cth: 12, 24"
                    value={newWarrantyMonths}
                    onChange={(e) => setNewWarrantyMonths(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>

                {/* Status Awal */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Awal Stok</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                  >
                    <option value="Spare">Spare (Cadangan Gudang)</option>
                    <option value="In Stock">In Stock (Tersedia)</option>
                    <option value="Active">Active (Langsung Deploy)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Technical Specs (Attributes) */}
              <div className="border-t border-slate-850 pt-4 space-y-3">
                <span className="text-[10px] font-bold text-berlian-400 uppercase tracking-wider">Atribut / Spesifikasi Aset Tambahan</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="RAM (cth: 8GB DDR4)"
                    value={newAttributes.ram}
                    onChange={(e) => setNewAttributes({ ...newAttributes, ram: e.target.value })}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                  <input
                    type="text"
                    placeholder="Penyimpanan (cth: 256GB SSD)"
                    value={newAttributes.storage}
                    onChange={(e) => setNewAttributes({ ...newAttributes, storage: e.target.value })}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                  <input
                    type="text"
                    placeholder="OS (cth: Windows 11)"
                    value={newAttributes.os}
                    onChange={(e) => setNewAttributes({ ...newAttributes, os: e.target.value })}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                  <input
                    type="text"
                    placeholder="IP Address"
                    value={newAttributes.ip_address}
                    onChange={(e) => setNewAttributes({ ...newAttributes, ip_address: e.target.value })}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                  <input
                    type="text"
                    placeholder="Brand (cth: APC Smart)"
                    value={newAttributes.brand}
                    onChange={(e) => setNewAttributes({ ...newAttributes, brand: e.target.value })}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                  <input
                    type="text"
                    placeholder="Kapasitas (cth: 1000VA)"
                    value={newAttributes.capacity}
                    onChange={(e) => setNewAttributes({ ...newAttributes, capacity: e.target.value })}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-berlian-500"
                  />
                </div>
              </div>

              {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              {actionSuccess && <p className="text-xs text-emerald-400">Pengadaan aset baru berhasil disimpan!</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowProcureModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading || actionSuccess}
                  className="px-4 py-2 bg-berlian-600 hover:bg-berlian-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? 'Mendaftarkan...' : 'Simpan Pengadaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: MUTASI ASET (ROTASI PERANGKAT)                                */}
      {/* ====================================================================== */}
      {showMutateModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-850 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Mutasi Aset: {selectedAsset.asset_code}</h3>
              <button onClick={() => setShowMutateModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">Tutup</button>
            </div>
            
            <form onSubmit={handleMutateSubmit} className="p-6 space-y-4">
              {/* Lokasi Baru */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lokasi Fisik (Departemen Baru)</label>
                <select
                  value={mutateDeptId}
                  onChange={(e) => setMutateDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                >
                  <option value="">-- Lepaskan / Tarik Ke Gudang IT --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.location_name || ''})</option>
                  ))}
                </select>
              </div>

              {/* Custodian Baru */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Penanggung Jawab (Custodian Baru)</label>
                <select
                  value={mutateUserId}
                  onChange={(e) => setMutateUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                >
                  <option value="">-- Lepaskan Penanggung Jawab --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.nip})</option>
                  ))}
                </select>
              </div>

              {/* Status Baru */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status Operasional Aset</label>
                <select
                  value={mutateStatus}
                  onChange={(e) => setMutateStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500"
                >
                  <option value="Active">Active (Beroperasi)</option>
                  <option value="Spare">Spare (Cadangan Gudang)</option>
                  <option value="Maintenance">Maintenance (Dalam Perbaikan)</option>
                  <option value="Broken">Broken (Rusak)</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Catatan Detail Alasan Mutasi</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Sebutkan alasan pergeseran fisik perangkat (contoh: PC Timbangan A rusak, diganti PC unit cadangan ini)..."
                  value={mutateNotes}
                  onChange={(e) => setMutateNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-650"
                ></textarea>
              </div>

              {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              {actionSuccess && <p className="text-xs text-emerald-400">Mutasi berhasil diproses!</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowMutateModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading || actionSuccess}
                  className="px-4 py-2 bg-berlian-600 hover:bg-berlian-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Menyimpan...' : 'Proses Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: RETIREMENT / SCRAP (PEMUSNAHAN)                               */}
      {/* ====================================================================== */}
      {showRetireModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-850 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-bold text-red-400 text-sm">Pemusnahan Aset (Scrap): {selectedAsset.asset_code}</h3>
              <button onClick={() => setShowRetireModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">Tutup</button>
            </div>
            
            <form onSubmit={handleRetireSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Tindakan ini akan memusnahkan unit aset ini dari sistem pemeliharaan rutin, melepas custodian, dan mengubah statusnya secara permanen menjadi <strong className="text-red-400">Scrapped (Dimusnahkan)</strong>. Riwayat audit / histori kerusakan unit tetap tersimpan abadi untuk kebutuhan audit internal.
              </p>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Catatan Kerusakan Akhir / Alasan Pemusnahan *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Sebutkan penyebab pemusnahan unit (contoh: Motherboard mati total, port RJ45 hangus akibat petir, unit terbakar, dll)..."
                  value={retireNotes}
                  onChange={(e) => setRetireNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-berlian-500 placeholder:text-slate-655"
                ></textarea>
              </div>

              {actionError && <p className="text-xs text-red-400">{actionError}</p>}
              {actionSuccess && <p className="text-xs text-emerald-400">Aset berhasil dimusnahkan!</p>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
                <button 
                  type="button" 
                  onClick={() => setShowRetireModal(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs"
                >
                  Batalkan
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading || actionSuccess}
                  className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Memproses...' : 'Musnahkan Aset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 4: LOG RIWAYAT HISTORI AUDIT (AUDIT TRAIL)                       */}
      {/* ====================================================================== */}
      {showHistoryModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-xl glass-panel border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-850 bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">Riwayat Histori Audit Aset</h3>
                <p className="text-[10px] text-berlian-400 font-mono mt-0.5">{selectedAsset.asset_name} ({selectedAsset.asset_code})</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-200 text-xs">Tutup</button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-berlian-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs text-slate-500">Memuat log history...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-12">Belum ada riwayat tercatat untuk unit ini.</p>
              ) : (
                <div className="relative border-l border-slate-800 pl-4 space-y-5 ml-2">
                  {historyLogs.map((log) => {
                    let badgeColor = 'bg-slate-550';
                    if (log.action === 'PROCUREMENT') badgeColor = 'bg-blue-600/20 text-blue-400 border border-blue-500/20';
                    if (log.action === 'MUTATION') badgeColor = 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20';
                    if (log.action === 'PART_TRANSFER') badgeColor = 'bg-purple-600/20 text-purple-400 border border-purple-500/20';
                    if (log.action === 'RETIREMENT') badgeColor = 'bg-red-600/20 text-red-400 border border-red-500/20';

                    return (
                      <div key={log.id} className="relative text-xs">
                        {/* Dot indicator */}
                        <span className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-950"></span>
                        
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${badgeColor}`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed bg-slate-900/30 p-2.5 rounded-lg border border-slate-850/80">
                          {log.notes}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pl-1">
                          {log.action === 'MUTATION' && (
                            <span>
                              Mutasi: {log.from_dept?.name || 'Gudang'} ➔ {log.to_dept?.name || 'Gudang'} 
                              ({log.from_user?.full_name || 'N/A'} ➔ {log.to_user?.full_name || 'N/A'})
                            </span>
                          )}
                          <span className="ml-auto">IT Operator: <strong>{log.performed_by?.full_name}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-900/20 border-t border-slate-850 flex justify-end">
              <button onClick={() => setShowHistoryModal(false)} className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 rounded-lg text-xs">
                Tutup Log Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
