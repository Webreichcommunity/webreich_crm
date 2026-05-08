import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, set, remove } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';
import * as XLSX from 'xlsx';
import { 
  FiDollarSign, FiTrendingUp, FiDownload, FiPlus, FiCalendar,
  FiFilter, FiX, FiChevronDown, FiChevronUp, FiPieChart,
  FiBarChart2, FiActivity, FiPackage, FiUser, FiCreditCard,
  FiLayers, FiGrid, FiSearch, FiShield, FiArrowUp, FiArrowDown,
  FiClock, FiCheckCircle, FiAlertCircle, FiTrash2, FiEdit3
} from 'react-icons/fi';

export default function FinancePage() {
  const [projects, setProjects] = useState([]);
  const [manual, setManual] = useState([]);
  const [month, setMonth] = useState('all');
  const [product, setProduct] = useState('all');
  const [projectType, setProjectType] = useState('all');
  const [amcFilter, setAmcFilter] = useState('all');
  const [source, setSource] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [activeView, setActiveView] = useState('table');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const FILTERS_KEY = 'wrcrm_finance_filters_v1';
  const [entry, setEntry] = useState({
    projectName: '', businessName: '', clientName: '', product: '',
    date: new Date().toISOString().slice(0, 10), mode: 'Cash', earning: ''
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || 'null');
      if (saved) {
        if (typeof saved.month === 'string') setMonth(saved.month);
        if (typeof saved.product === 'string') setProduct(saved.product);
        if (typeof saved.projectType === 'string') setProjectType(saved.projectType);
        if (typeof saved.amcFilter === 'string') setAmcFilter(saved.amcFilter);
        if (typeof saved.source === 'string') setSource(saved.source);
        if (typeof saved.sortField === 'string') setSortField(saved.sortField);
        if (typeof saved.sortDirection === 'string') setSortDirection(saved.sortDirection);
        if (typeof saved.activeView === 'string') setActiveView(saved.activeView);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const payload = { month, product, projectType, amcFilter, source, sortField, sortDirection, activeView };
    localStorage.setItem(FILTERS_KEY, JSON.stringify(payload));
  }, [month, product, projectType, amcFilter, source, sortField, sortDirection, activeView]);

  useEffect(() => {
    setIsLoading(true);
    const unsub1 = onValue(ref(database, 'projects'), (s) => {
      const val = s.val() || {};
      const projectsWithIds = Object.entries(val).map(([id, data]) => ({
        id,
        ...data
      }));
      setProjects(projectsWithIds);
      setIsLoading(false);
    });
    return () => unsub1();
  }, []);

  useEffect(() => {
    const unsub2 = onValue(ref(database, 'manualFinance'), (s) => {
      const val = s.val() || {};
      const manualWithIds = Object.entries(val).map(([id, data]) => ({
        id,
        ...data
      }));
      setManual(manualWithIds);
    });
    return () => unsub2();
  }, []);

  const products = useMemo(() => 
    Array.from(new Set([
      ...projects.map(p => p.product),
      ...manual.map(m => m.product)
    ].filter(Boolean))).sort(),
    [projects, manual]
  );

  const projectTypes = useMemo(() => 
    Array.from(new Set(projects.map(p => p.projectType).filter(Boolean))).sort(),
    [projects]
  );

  const rows = useMemo(() => [
    ...projects.flatMap(p => (p.payments || []).map((pay, idx) => ({
      id: `${p.id}_${idx}`,
      projectId: p.id,
      paymentIndex: idx,
      projectName: p.projectName,
      businessName: p.projectName,
      clientName: p.clientName,
      product: p.product,
      projectType: p.projectType || 'N/A',
      amc: p.amc === true || p.amc === 'yes',
      date: pay.date,
      mode: pay.mode || 'NA',
      amount: Number(pay.amount || 0),
      source: 'project'
    }))),
    ...manual.map(m => ({
      id: m.id,
      projectName: m.projectName,
      businessName: m.businessName,
      clientName: m.clientName,
      product: m.product,
      projectType: 'Manual',
      amc: false,
      date: m.date,
      mode: m.mode,
      amount: Number(m.earning || 0),
      source: 'manual'
    }))
  ], [projects, manual]);

  const months = useMemo(() => 
    Array.from(new Set(rows.map(r => getMonthKey(r.date)))).sort().reverse(),
    [rows]
  );

  const filtered = useMemo(() => {
    let result = rows;
    
    if (month !== 'all') {
      result = result.filter(r => getMonthKey(r.date) === month);
    }
    if (product !== 'all') {
      result = result.filter(r => r.product === product);
    }
    if (projectType !== 'all') {
      result = result.filter(r => r.projectType === projectType);
    }
    if (amcFilter === 'yes') {
      result = result.filter(r => r.amc === true);
    } else if (amcFilter === 'no') {
      result = result.filter(r => r.amc === false);
    }
    if (source !== 'all') {
      result = result.filter(r => r.source === source);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.projectName?.toLowerCase().includes(term) ||
        r.clientName?.toLowerCase().includes(term) ||
        r.product?.toLowerCase().includes(term) ||
        r.mode?.toLowerCase().includes(term)
      );
    }
    
    return result.sort((a, b) => {
      const aVal = sortField === 'date' ? new Date(a.date).getTime() : (sortField === 'amount' ? a.amount : a[sortField] || '');
      const bVal = sortField === 'date' ? new Date(b.date).getTime() : (sortField === 'amount' ? b.amount : b[sortField] || '');
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [rows, month, product, projectType, amcFilter, source, searchTerm, sortField, sortDirection]);

  const total = useMemo(() => filtered.reduce((a, r) => a + r.amount, 0), [filtered]);
  const totalFromProjects = useMemo(() => filtered.filter(r => r.source === 'project').reduce((a, r) => a + r.amount, 0), [filtered]);
  const totalFromManual = useMemo(() => filtered.filter(r => r.source === 'manual').reduce((a, r) => a + r.amount, 0), [filtered]);

  const currentMonthKey = useMemo(() => getMonthKey(new Date().toISOString().slice(0, 10)), []);
  const prevMonthKey = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return getMonthKey(d.toISOString().slice(0, 10));
  }, []);

  const totalsByMonthAll = useMemo(() => {
    const data = rows.reduce((a, r) => {
      const key = getMonthKey(r.date);
      return { ...a, [key]: (a[key] || 0) + r.amount };
    }, {});
    return data;
  }, [rows]);

  const thisMonthTotalAll = totalsByMonthAll[currentMonthKey] || 0;
  const prevMonthTotalAll = totalsByMonthAll[prevMonthKey] || 0;
  const monthDelta = thisMonthTotalAll - prevMonthTotalAll;

  const monthlyData = useMemo(() => {
    const data = filtered.reduce((a, r) => {
      const key = getMonthKey(r.date);
      return { ...a, [key]: (a[key] || 0) + r.amount };
    }, {});
    return Object.entries(data).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const productWiseData = useMemo(() => {
    const data = filtered.reduce((a, r) => ({
      ...a,
      [r.product]: (a[r.product] || 0) + r.amount
    }), {});
    return Object.entries(data).sort(([, a], [, b]) => b - a);
  }, [filtered]);

  const modeWiseData = useMemo(() => {
    const data = filtered.reduce((a, r) => ({
      ...a,
      [r.mode]: (a[r.mode] || 0) + r.amount
    }), {});
    return Object.entries(data).sort(([, a], [, b]) => b - a);
  }, [filtered]);

  const topClients = useMemo(() => {
    const data = filtered.reduce((a, r) => ({
      ...a,
      [r.clientName]: (a[r.clientName] || 0) + r.amount
    }), {});
    return Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [filtered]);

  const amcTotal = useMemo(() => 
    filtered.filter(r => r.amc === true).reduce((a, r) => a + r.amount, 0),
    [filtered]
  );

  const maxMonthlyValue = Math.max(...monthlyData.map(([, v]) => v), 1);
  const maxProductValue = Math.max(...productWiseData.map(([, v]) => v), 1);

  const addManual = async (e) => {
    e.preventDefault();
    if (!entry.earning || Number(entry.earning) <= 0) return;
    await push(ref(database, 'manualFinance'), entry);
    setEntry({ ...entry, earning: '', projectName: '', businessName: '', clientName: '', product: '' });
    setShowAddForm(false);
  };

  const deleteEntry = async (row) => {
    try {
      if (row.source === 'manual') {
        // Delete manual entry
        await remove(ref(database, `manualFinance/${row.id}`));
      } else if (row.source === 'project') {
        // Delete project payment
        const project = projects.find(p => p.id === row.projectId);
        if (project) {
          const updatedPayments = (project.payments || []).filter((_, idx) => idx !== row.paymentIndex);
          await set(ref(database, `projects/${row.projectId}/payments`), updatedPayments);
        }
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const exportExcel = () => {
    const exportData = filtered.map(r => ({
      'Project': r.projectName,
      'Business': r.businessName,
      'Client': r.clientName,
      'Product': r.product,
      'Project Type': r.projectType,
      'AMC': r.amc ? 'Yes' : 'No',
      'Date': new Date(r.date).toLocaleDateString('en-IN'),
      'Mode': r.mode,
      'Amount (₹)': r.amount,
      'Source': r.source === 'project' ? 'Project Payment' : 'Manual Entry'
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Finance');
    XLSX.writeFile(wb, `finance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FiChevronDown className="h-3 w-3 text-gray-300 group-hover:text-gray-400" />;
    return sortDirection === 'asc' ? 
      <FiChevronUp className="h-3 w-3 text-orange-500" /> : 
      <FiChevronDown className="h-3 w-3 text-orange-500" />;
  };

  const clearFilters = () => {
    setMonth('all');
    setProduct('all');
    setProjectType('all');
    setAmcFilter('all');
    setSource('all');
    setSearchTerm('');
  };

  const hasActiveFilters = month !== 'all' || product !== 'all' || projectType !== 'all' || amcFilter !== 'all' || source !== 'all' || searchTerm;

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-emerald-50/40 via-transparent to-orange-50/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-50/30 via-transparent to-emerald-50/20 rounded-full blur-3xl" />
      </div>

      <div className="relative wr-container py-4 md:py-6 lg:py-8">
        {/* Header */}
        <div className="wr-page-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-0.5">
            <h1 className="wr-title">
              Finance
            </h1>
            <div className="flex items-center gap-2 text-gray-400 text-xs flex-wrap">
              <FiActivity className="h-3.5 w-3.5" />
              <span>Revenue tracking & analytics</span>
              <span className="text-gray-300">•</span>
              <span>{filtered.length} transactions</span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-500">This month: {formatINR(thisMonthTotalAll)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm rounded-xl
                shadow-md shadow-orange-200/50 hover:shadow-lg hover:shadow-orange-200/70 transition-all duration-300 active:scale-[0.98]
                flex-1 sm:flex-none justify-center"
            >
              <FiPlus className="h-4 w-4" />
              Add Entry
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl
                hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            >
              <FiDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {(() => {
            const colorMap = {
              emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', meta: 'border-emerald-100 bg-emerald-50 text-emerald-700' },
              sky: { iconBg: 'bg-sky-50', iconText: 'text-sky-600', meta: 'border-sky-100 bg-sky-50 text-sky-700' },
              violet: { iconBg: 'bg-violet-50', iconText: 'text-violet-600', meta: 'border-violet-100 bg-violet-50 text-violet-700' },
              orange: { iconBg: 'bg-orange-50', iconText: 'text-orange-600', meta: 'border-orange-100 bg-orange-50 text-orange-700' },
              slate: { iconBg: 'bg-slate-50', iconText: 'text-slate-600', meta: 'border-slate-200 bg-slate-50 text-slate-700' },
            };

            const stats = [
              { label: 'Total Revenue', value: formatINR(total), icon: FiDollarSign, color: 'emerald' },
              { label: 'From Projects', value: formatINR(totalFromProjects), icon: FiLayers, color: 'sky' },
              { label: 'Manual Entries', value: formatINR(totalFromManual), icon: FiCreditCard, color: 'violet' },
              { label: 'AMC Revenue', value: formatINR(amcTotal), icon: FiShield, color: 'orange' },
              {
                label: 'MoM Change',
                value: `${monthDelta >= 0 ? '+' : ''}${formatINR(monthDelta)}`,
                icon: monthDelta >= 0 ? FiArrowUp : FiArrowDown,
                color: 'slate',
                meta: `vs ${prevMonthKey}`,
              },
            ];

            return stats.map((stat, i) => (
              <div key={i} className="wr-card p-3 sm:p-4 border border-white/60">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${colorMap[stat.color].iconBg}`}>
                    <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colorMap[stat.color].iconText}`} />
                  </div>
                  {stat.meta && (
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${colorMap[stat.color].meta}`}>
                      {stat.meta}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs font-medium text-slate-400 mb-0.5">{stat.label}</p>
                <p className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
              </div>
            ));
          })()}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Monthly Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiBarChart2 className="h-4 w-4 text-emerald-500" />
              Monthly Revenue
            </h3>
            <div className="space-y-3">
              {monthlyData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data available</p>
              ) : (
                monthlyData.slice(0, 12).map(([m, v]) => (
                  <div key={m} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">{m}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                        style={{ width: `${(v / maxMonthlyValue) * 100}%` }}
                      >
                        {v > maxMonthlyValue * 0.15 && (
                          <span className="text-[10px] font-bold text-white">{formatINR(v)}</span>
                        )}
                      </div>
                    </div>
                    {v <= maxMonthlyValue * 0.15 && (
                      <span className="text-[10px] font-medium text-gray-500 w-16 text-right">{formatINR(v)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Product-wise Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiPieChart className="h-4 w-4 text-orange-500" />
              Revenue by Product
            </h3>
            <div className="space-y-3">
              {productWiseData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No data available</p>
              ) : (
                productWiseData.map(([p, v]) => (
                  <div key={p} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 truncate">{p}</span>
                    <div className="flex-1 h-6 bg-gray-50 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                        style={{ width: `${(v / maxProductValue) * 100}%` }}
                      >
                        {v > maxProductValue * 0.15 && (
                          <span className="text-[10px] font-bold text-white">{formatINR(v)}</span>
                        )}
                      </div>
                    </div>
                    {v <= maxProductValue * 0.15 && (
                      <span className="text-[10px] font-medium text-gray-500 w-16 text-right">{formatINR(v)}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              {/* Search and Filter Toggle */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by project, client, product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300
                      placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all
                    ${showFilters || hasActiveFilters ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <FiFilter className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                </button>
                <div className="flex bg-gray-100 rounded-xl p-0.5">
                  {['table', 'clients'].map(view => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${
                        activeView === view ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter Options */}
              {(showFilters || hasActiveFilters) && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="all">All Months</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  
                  <select
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="all">All Products</option>
                    {products.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>

                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="all">All Types</option>
                    {projectTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>

                  <select
                    value={amcFilter}
                    onChange={(e) => setAmcFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="all">All AMC</option>
                    <option value="yes">With AMC</option>
                    <option value="no">Without AMC</option>
                  </select>

                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="all">All Sources</option>
                    <option value="project">Project Payments</option>
                    <option value="manual">Manual Entries</option>
                  </select>
                  
                  <button
                    onClick={clearFilters}
                    className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear all
                  </button>
                  
                  <span className="text-xs text-gray-400 ml-auto">
                    {filtered.length} results • {formatINR(total)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table / Client View */}
        {activeView === 'table' ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gray-50 mb-4">
                  <FiDollarSign className="h-7 w-7 text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No transactions found</h3>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'No financial data available yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30">
                      {[
                        { label: 'Date', field: 'date' },
                        { label: 'Project', field: 'projectName' },
                        { label: 'Client', field: 'clientName' },
                        { label: 'Product', field: 'product' },
                        { label: 'Mode', field: 'mode' },
                        { label: 'Amount', field: 'amount' },
                      ].map(({ label, field }) => (
                        <th key={field} className="px-3 py-3 text-left">
                          <button
                            onClick={() => handleSort(field)}
                            className="group flex items-center gap-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider
                              hover:text-gray-600 transition-colors"
                          >
                            {label}
                            <SortIcon field={field} />
                          </button>
                        </th>
                      ))}
                      <th className="px-3 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((r, i) => (
                      <tr key={r.id || i} className="group hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FiCalendar className="h-3 w-3" />
                            {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="max-w-[180px]">
                            <span className="text-sm font-medium text-gray-900 truncate block">{r.projectName}</span>
                            {r.amc && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-medium mt-0.5">
                                <FiShield className="h-2.5 w-2.5" />
                                AMC
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <FiUser className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{r.clientName}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                            {r.product}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-gray-500">{r.mode}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm font-bold text-emerald-600">{formatINR(r.amount)}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              r.source === 'manual' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {r.source === 'manual' ? 'Manual' : 'Project'}
                            </span>
                            <button
                              onClick={() => setDeleteConfirm(r)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              title="Delete entry"
                            >
                              <FiTrash2 className="h-3.5 w-3.5" />
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
        ) : (
          /* Top Clients View */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Top Clients by Revenue</h3>
            </div>
            {topClients.length === 0 ? (
              <div className="py-12 text-center">
                <FiUser className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No client data available</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {topClients.map(([client, value], i) => (
                  <div key={client} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">{formatINR(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Mode Distribution */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {modeWiseData.map(([mode, value]) => (
            <div key={mode} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <span className="text-[11px] text-gray-400 font-medium uppercase">{mode}</span>
              <p className="text-lg font-bold text-gray-900 mt-0.5">{formatINR(value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Manual Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-[94vh] overflow-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-xl border-b border-gray-100 rounded-t-2xl">
              <h3 className="text-base font-bold text-gray-900">Add Manual Entry</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={addManual} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField icon={FiLayers} label="Project Name" value={entry.projectName} onChange={e => setEntry({...entry, projectName: e.target.value})} placeholder="e.g. Website Project" required />
                <InputField icon={FiGrid} label="Business Name" value={entry.businessName} onChange={e => setEntry({...entry, businessName: e.target.value})} placeholder="e.g. AVG Consultancy" required />
                <InputField icon={FiUser} label="Client Name" value={entry.clientName} onChange={e => setEntry({...entry, clientName: e.target.value})} placeholder="e.g. John Doe" required />
                <InputField icon={FiPackage} label="Product" value={entry.product} onChange={e => setEntry({...entry, product: e.target.value})} placeholder="e.g. Website" required />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Mode</label>
                  <select
                    value={entry.mode}
                    onChange={e => setEntry({...entry, mode: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                      focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                  >
                    {['Cash', 'UPI', 'Bank Transfer', 'Cheque'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <InputField icon={FiCalendar} label="Date" type="date" value={entry.date} onChange={e => setEntry({...entry, date: e.target.value})} required />
              </div>
              <InputField icon={FiDollarSign} label="Amount (₹)" type="number" value={entry.earning} onChange={e => setEntry({...entry, earning: e.target.value})} placeholder="50000" required />
              
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl
                  hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200/50 transition-all duration-300"
              >
                <FiPlus className="h-4 w-4" />
                Add Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-red-50 mb-4">
                <FiAlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Payment Entry?</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this payment entry? This action cannot be undone.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Project:</span>
                    <span className="font-medium text-gray-900">{deleteConfirm.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client:</span>
                    <span className="font-medium text-gray-900">{deleteConfirm.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-red-600">{formatINR(deleteConfirm.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(deleteConfirm.date).toLocaleDateString('en-IN', { 
                        day: 'numeric', month: 'long', year: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl
                  hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEntry(deleteConfirm)}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl
                  hover:from-red-600 hover:to-red-700 shadow-md shadow-red-200/50 transition-all duration-300
                  flex items-center justify-center gap-2"
              >
                <FiTrash2 className="h-4 w-4" />
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Input Field
const InputField = ({ icon: Icon, label, ...props }) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <input
        {...props}
        className={`w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
          placeholder-gray-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
          outline-none transition-all duration-200
          ${Icon ? 'pl-10' : ''} hover:border-gray-300 hover:bg-white`}
      />
    </div>
  </div>
);