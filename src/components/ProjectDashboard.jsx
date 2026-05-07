import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, set } from 'firebase/database';
import { database } from '../db/firebase';
import { DEFAULT_PRODUCTS, DEFAULT_PROJECT_TYPES, formatINR } from './projectUtils';
import * as XLSX from 'xlsx';
import { 
  FiPlus, FiFolder, FiDollarSign, FiTrendingUp, FiPackage, 
  FiX, FiDownload, FiCalendar, FiUser, FiPhone, FiMapPin, 
  FiFileText, FiLink, FiChevronRight, FiGrid,
  FiSearch, FiChevronDown, FiExternalLink, FiFilter, FiChevronUp,
  FiSettings, FiList, FiCheck, FiClock, FiAlertCircle, FiShield,
  FiEdit3, FiTrash2, FiMoreHorizontal, FiEye, FiCopy
} from 'react-icons/fi';

const initialForm = { 
  serial:'', createdAt:'', projectType:'', projectName:'', 
  clientName:'', phone:'', address:'', budget:'', note:'', 
  link:'', product:'', amc: false, amcAmount:'', amcYears:'1',
  amcStartDate: '', amcEndDate: ''
};

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [activeCard, setActiveCard] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showProjectDetail, setShowProjectDetail] = useState(null);
  const [options, setOptions] = useState({ projectTypes: DEFAULT_PROJECT_TYPES, products: DEFAULT_PRODUCTS });
  const [form, setForm] = useState(initialForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ product: '', projectType: '', amc: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showManageOptions, setShowManageOptions] = useState(false);
  const [newOption, setNewOption] = useState({ type: '', value: '' });
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onValue(ref(database, 'projects'), (s) => {
      const val = s.val() || {};
      const projectsList = Object.entries(val).map(([id, p]) => ({ 
        id, 
        ...p,
        amc: p.amc === true || p.amc === 'yes',
        payments: p.payments || [],
        meetings: p.meetings || []
      }));
      projectsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setProjects(projectsList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onValue(ref(database,'options'), s => {
      setOptions({ 
        ...{ projectTypes: DEFAULT_PROJECT_TYPES, products: DEFAULT_PRODUCTS }, 
        ...(s.val() || {}) 
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (showNewModal && !editingProject) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 16);
      const serial = generateSerialNumber(now);
      setForm({ ...initialForm, createdAt: dateStr, serial });
    }
  }, [showNewModal, editingProject]);

  // Generate serial number in format: WR-DDMMYY-XX
  const generateSerialNumber = (date = new Date()) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const datePrefix = `${day}${month}${year}`;
    
    const todayProjects = projects.filter(p => {
      const pDate = new Date(p.createdAt);
      return pDate.toDateString() === date.toDateString();
    });
    
    const sequence = String(todayProjects.length + 1).padStart(2, '0');
    return `WR-${datePrefix}-${sequence}`;
  };

  // Calculate AMC end date
  const calculateAmcEndDate = (startDate, years) => {
    if (!startDate || !years) return '';
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + parseInt(years));
    return end.toISOString().slice(0, 10);
  };

  const summary = useMemo(() => {
    const totalBudget = projects.reduce((a, p) => a + Number(p.budget || 0), 0);
    const totalPaid = projects.reduce((a, p) => a + (p.payments || []).reduce((x, y) => x + Number(y.amount || 0), 0), 0);
    const byProduct = projects.reduce((acc, p) => ({...acc, [p.product]: (acc[p.product]||0)+1}), {});
    const pendingAmount = totalBudget - totalPaid;
    const thisMonthProjects = projects.filter(p => {
      const pDate = new Date(p.createdAt);
      const now = new Date();
      return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
    });
    const amcProjects = projects.filter(p => p.amc === true);
    const activeAmcProjects = amcProjects.filter(p => {
      if (!p.amcEndDate) return false;
      return new Date(p.amcEndDate) > new Date();
    });
    const expiringAmcProjects = amcProjects.filter(p => {
      if (!p.amcEndDate) return false;
      const endDate = new Date(p.amcEndDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate <= thirtyDaysFromNow && endDate > new Date();
    });
    return { 
      totalBudget, totalPaid, byProduct, pendingAmount, 
      thisMonthProjects: thisMonthProjects.length, 
      amcProjects: amcProjects.length,
      activeAmcProjects: activeAmcProjects.length,
      expiringAmcProjects: expiringAmcProjects.length,
      totalAmcAmount: amcProjects.reduce((a, p) => a + Number(p.amcAmount || 0), 0)
    };
  }, [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.projectName?.toLowerCase().includes(term) ||
        p.clientName?.toLowerCase().includes(term) ||
        p.serial?.toLowerCase().includes(term) ||
        p.product?.toLowerCase().includes(term) ||
        p.note?.toLowerCase().includes(term)
      );
    }
    
    if (filters.product) {
      filtered = filtered.filter(p => p.product === filters.product);
    }
    if (filters.projectType) {
      filtered = filtered.filter(p => p.projectType === filters.projectType);
    }
    if (filters.amc) {
      if (filters.amc === 'active') {
        filtered = filtered.filter(p => p.amc && p.amcEndDate && new Date(p.amcEndDate) > new Date());
      } else if (filters.amc === 'expiring') {
        filtered = filtered.filter(p => {
          if (!p.amc || !p.amcEndDate) return false;
          const endDate = new Date(p.amcEndDate);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return endDate <= thirtyDaysFromNow && endDate > new Date();
        });
      } else if (filters.amc === 'expired') {
        filtered = filtered.filter(p => p.amc && p.amcEndDate && new Date(p.amcEndDate) < new Date());
      } else if (filters.amc === 'yes') {
        filtered = filtered.filter(p => p.amc === true);
      } else if (filters.amc === 'no') {
        filtered = filtered.filter(p => !p.amc);
      }
    }
    
    return filtered.sort((a, b) => {
      let aVal, bVal;
      switch(sortField) {
        case 'createdAt':
          aVal = new Date(a.createdAt || 0).getTime();
          bVal = new Date(b.createdAt || 0).getTime();
          break;
        case 'budget':
          aVal = Number(a.budget || 0);
          bVal = Number(b.budget || 0);
          break;
        case 'projectName':
          aVal = (a.projectName || '').toLowerCase();
          bVal = (b.projectName || '').toLowerCase();
          break;
        case 'clientName':
          aVal = (a.clientName || '').toLowerCase();
          bVal = (b.clientName || '').toLowerCase();
          break;
        case 'amcEndDate':
          aVal = a.amcEndDate ? new Date(a.amcEndDate).getTime() : 0;
          bVal = b.amcEndDate ? new Date(b.amcEndDate).getTime() : 0;
          break;
        default:
          aVal = a[sortField] || '';
          bVal = b[sortField] || '';
      }
      return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });
  }, [projects, searchTerm, sortField, sortDirection, filters]);

  const exportRows = (rows, fileName) => {
    const exportData = rows.map(p => ({
      'Serial': p.serial || '',
      'Project Name': p.projectName || '',
      'Client Name': p.clientName || '',
      'Product': p.product || '',
      'Project Type': p.projectType || '',
      'Budget': p.budget || 0,
      'Total Received': (p.payments || []).reduce((a, b) => a + Number(b.amount || 0), 0),
      'AMC': p.amc ? 'Yes' : 'No',
      'AMC Amount': p.amcAmount || '-',
      'AMC End Date': p.amcEndDate || '-',
      'Date': new Date(p.createdAt).toLocaleDateString(),
      'Phone': p.phone || '',
      'Note': p.note || ''
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Projects');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const createProject = async (e) => {
    e.preventDefault();
    const projectData = { 
      ...form, 
      amc: form.amc === true || form.amc === 'yes',
      createdAt: new Date(form.createdAt).toISOString(), 
      payments: [], 
      meetings: [] 
    };
    await push(ref(database,'projects'), projectData);
    setShowNewModal(false);
    setForm(initialForm);
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;
    const projectData = { 
      ...form, 
      amc: form.amc === true || form.amc === 'yes',
      createdAt: new Date(form.createdAt).toISOString(),
    };
    await set(ref(database, `projects/${editingProject.id}`), {
      ...editingProject,
      ...projectData
    });
    setEditingProject(null);
    setShowNewModal(false);
    setForm(initialForm);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setForm({
      serial: project.serial || '',
      createdAt: new Date(project.createdAt).toISOString().slice(0, 16),
      projectType: project.projectType || '',
      projectName: project.projectName || '',
      clientName: project.clientName || '',
      phone: project.phone || '',
      address: project.address || '',
      budget: project.budget || '',
      note: project.note || '',
      link: project.link || '',
      product: project.product || '',
      amc: project.amc || false,
      amcAmount: project.amcAmount || '',
      amcYears: project.amcYears || '1',
      amcStartDate: project.amcStartDate || '',
      amcEndDate: project.amcEndDate || ''
    });
    setShowNewModal(true);
  };

  const addNewOption = async () => {
    if (!newOption.type || !newOption.value.trim()) return;
    const updatedOptions = { ...options };
    if (newOption.type === 'projectType') {
      if (!updatedOptions.projectTypes.includes(newOption.value.trim())) {
        updatedOptions.projectTypes = [...updatedOptions.projectTypes, newOption.value.trim()];
      }
    } else if (newOption.type === 'product') {
      if (!updatedOptions.products.includes(newOption.value.trim())) {
        updatedOptions.products = [...updatedOptions.products, newOption.value.trim()];
      }
    }
    await set(ref(database, 'options'), updatedOptions);
    setOptions(updatedOptions);
    setNewOption({ type: '', value: '' });
  };

  const deleteOption = async (type, value) => {
    const updatedOptions = { ...options };
    if (type === 'projectType') {
      updatedOptions.projectTypes = updatedOptions.projectTypes.filter(v => v !== value);
    } else if (type === 'product') {
      updatedOptions.products = updatedOptions.products.filter(v => v !== value);
    }
    await set(ref(database, 'options'), updatedOptions);
    setOptions(updatedOptions);
  };

  const getAmcStatus = (project) => {
    if (!project.amc) return null;
    if (!project.amcEndDate) return { label: 'Active', color: 'bg-blue-100 text-blue-700', icon: FiShield };
    const endDate = new Date(project.amcEndDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (endDate < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-700', icon: FiAlertCircle };
    } else if (endDate <= thirtyDaysFromNow) {
      return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-700', icon: FiClock };
    } else {
      return { label: 'Active', color: 'bg-green-100 text-green-700', icon: FiCheck };
    }
  };

  const cardData = [
    { 
      key: 'projects', 
      title: 'Total Projects', 
      value: projects.length, 
      icon: FiFolder,
      color: 'blue'
    },
    { 
      key: 'budget', 
      title: 'Total Budget', 
      value: formatINR(summary.totalBudget), 
      icon: FiDollarSign,
      color: 'violet'
    },
    { 
      key: 'earning', 
      title: 'Total Received', 
      value: formatINR(summary.totalPaid), 
      icon: FiTrendingUp,
      color: 'emerald'
    },
    { 
      key: 'amc', 
      title: 'AMC Projects', 
      value: summary.amcProjects, 
      icon: FiShield,
      color: 'orange'
    },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FiChevronDown className="h-3 w-3 text-gray-300 group-hover:text-gray-400 transition-colors" />;
    return sortDirection === 'asc' ? 
      <FiChevronUp className="h-3 w-3 text-orange-500" /> : 
      <FiChevronDown className="h-3 w-3 text-orange-500" />;
  };

  const clearFilters = () => {
    setFilters({ product: '', projectType: '', amc: '' });
    setSearchTerm('');
  };

  const hasActiveFilters = filters.product || filters.projectType || filters.amc || searchTerm;

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600', gradient: 'from-violet-500 to-purple-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', gradient: 'from-emerald-500 to-green-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', gradient: 'from-orange-500 to-orange-600' },
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-50/60 via-transparent to-rose-50/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-50/40 via-transparent to-orange-50/20 rounded-full blur-3xl" />
      </div>

      <div className="relative wr-container py-4 md:py-6 lg:py-8">
        {/* Header Section */}
        <div className="wr-page-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-0.5">
            <h1 className="wr-title">
              Projects
            </h1>
            <div className="flex items-center gap-2 text-gray-400 flex-wrap">
              <FiGrid className="h-3.5 w-3.5" />
              <p className="text-xs font-medium">WebReich CRM</p>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">{projects.length} projects</span>
              {summary.expiringAmcProjects > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                    <FiAlertCircle className="h-3 w-3" />
                    {summary.expiringAmcProjects} AMC expiring
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setShowManageOptions(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl
                hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              <FiSettings className="h-4 w-4" />
              <span className="hidden sm:inline">Manage</span>
            </button>
            <button 
              onClick={() => {
                setEditingProject(null);
                setShowNewModal(true);
              }}
              className="group flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm rounded-xl
                shadow-md shadow-orange-200/50 hover:shadow-lg hover:shadow-orange-200/70 
                transition-all duration-300 active:scale-[0.98] flex-1 sm:flex-none justify-center"
            >
              <FiPlus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
              New Project
            </button>
          </div>
        </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {cardData.map((card) => (
            <button
              key={card.key}
              onClick={() => setActiveCard(card.key)}
              className="group relative text-left wr-card p-3 sm:p-4 border border-white/60
                shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5
                hover:border-gray-200 active:scale-[0.98]"
            >
              <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-orange-50/60 via-white/40 to-transparent" />
              <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 sm:p-2 rounded-lg ${colorMap[card.color].bg}`}>
                  <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colorMap[card.color].text}`} />
                </div>
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-gray-400 mb-0.5">{card.title}</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{card.value}</p>
              <div className={`mt-2 h-0.5 rounded-full bg-gradient-to-r ${colorMap[card.color].gradient} w-0 group-hover:w-full transition-all duration-500`} />
            </button>
          ))}
        </div>

        {/* AMC Alert Banner */}
        {summary.expiringAmcProjects > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-2">
            <FiAlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              <span className="font-semibold">{summary.expiringAmcProjects} AMC contracts</span> expiring within 30 days. 
              <button 
                onClick={() => {
                  setFilters({ product: '', projectType: '', amc: 'expiring' });
                  setShowFilters(true);
                }}
                className="ml-1 text-yellow-800 font-medium underline"
              >
                View projects
              </button>
            </p>
          </div>
        )}

        {/* Projects Table Section */}
        <div className="wr-card border border-white/60 overflow-hidden">
          {/* Table Header */}
          <div className="p-3 sm:p-4 md:p-5 border-b border-gray-50">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects, clients, notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300
                      placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200
                      ${showFilters || hasActiveFilters ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <FiFilter className="h-4 w-4" />
                    Filter
                    {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                  </button>
                  <button
                    onClick={() => exportRows(filteredAndSortedProjects, 'projects-export')}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl
                      text-gray-600 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FiDownload className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Filter Row */}
              {(showFilters || hasActiveFilters) && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                  <select
                    value={filters.product}
                    onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="">All Products</option>
                    {options.products.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  
                  <select
                    value={filters.projectType}
                    onChange={(e) => setFilters(prev => ({ ...prev, projectType: e.target.value }))}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="">All Types</option>
                    {options.projectTypes.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>

                  <select
                    value={filters.amc}
                    onChange={(e) => setFilters(prev => ({ ...prev, amc: e.target.value }))}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  >
                    <option value="">All AMC Status</option>
                    <option value="yes">With AMC</option>
                    <option value="no">Without AMC</option>
                    <option value="active">Active AMC</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired AMC</option>
                  </select>
                  
                  <button
                    onClick={clearFilters}
                    className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Clear all
                  </button>
                  
                  <span className="text-xs text-gray-400 ml-auto">
                    {filteredAndSortedProjects.length} results
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-3.5 bg-gray-100 rounded w-20" />
                  <div className="h-3.5 bg-gray-100 rounded w-28 flex-1" />
                  <div className="h-3.5 bg-gray-100 rounded w-24" />
                  <div className="h-3.5 bg-gray-100 rounded w-20" />
                  <div className="h-3.5 bg-gray-100 rounded w-16" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gray-50 mb-4">
                <FiFolder className="h-7 w-7 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No projects found</h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Create your first project to get started'}
              </p>
              {!hasActiveFilters && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl
                    hover:bg-orange-600 transition-colors shadow-md shadow-orange-200/30"
                >
                  <FiPlus className="h-4 w-4" />
                  Create First Project
                </button>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 font-medium hover:text-orange-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden divide-y divide-gray-50">
                {filteredAndSortedProjects.map((p) => {
                  const amcStatus = getAmcStatus(p);
                  return (
                    <div
                      key={p.id}
                      className="p-4 hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-mono font-semibold text-gray-500">
                            {p.serial}
                          </span>
                          {p.amc && amcStatus && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${amcStatus.color}`}>
                              <amcStatus.icon className="h-2.5 w-2.5" />
                              {amcStatus.label}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-medium">
                          {p.product}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">{p.projectName}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <FiUser className="h-3 w-3" />
                          {p.clientName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCalendar className="h-3 w-3" />
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {p.note && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2 italic">"{p.note}"</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-700">{formatINR(p.budget || 0)}</span>
                          {p.amc && (
                            <span className="text-[10px] text-gray-500">
                              AMC: {formatINR(p.amcAmount || 0)}/yr
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditProject(p)}
                            className="p-1.5 rounded-lg text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                          >
                            <FiEdit3 className="h-3.5 w-3.5" />
                          </button>
                          <a
                            href={`/projects/${p.id}`}
                            className="p-1.5 rounded-lg text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                          >
                            <FiExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/30">
                      {[
                        { label: 'Serial', field: 'serial' },
                        { label: 'Project', field: 'projectName' },
                        { label: 'Client', field: 'clientName' },
                        { label: 'Product', field: 'product' },
                        { label: 'Type', field: 'projectType' },
                        { label: 'Date', field: 'createdAt' },
                        { label: 'Budget', field: 'budget' },
                        { label: 'AMC', field: 'amcEndDate' },
                        
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
                      <th className="px-3 py-3 w-[100px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAndSortedProjects.map((p) => {
                      const amcStatus = getAmcStatus(p);
                      return (
                        <tr 
                          key={p.id} 
                          className="group hover:bg-orange-50/10 transition-colors duration-150"
                        >
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-50 text-[11px] font-mono font-semibold text-gray-500">
                              {p.serial}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-[200px]">
                              <div className="flex items-center gap-2">
                                <FiFolder className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 truncate">{p.projectName}</span>
                              </div>
                              {p.note && (
                                <p className="text-[11px] text-gray-400 truncate mt-0.5 ml-6 italic">"{p.note}"</p>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <FiUser className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{p.clientName}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[11px] font-medium whitespace-nowrap">
                              {p.product}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-gray-500">{p.projectType}</span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 whitespace-nowrap">
                              <FiCalendar className="h-3 w-3" />
                              {new Date(p.createdAt).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short',
                                year: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm font-semibold text-gray-700">{formatINR(p.budget || 0)}</span>
                          </td>
                          <td className="px-3 py-3">
                            {p.amc ? (
                              <div className="flex flex-col gap-0.5">
                                {amcStatus && (
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${amcStatus.color}`}>
                                    <amcStatus.icon className="h-2.5 w-2.5" />
                                    {amcStatus.label}
                                  </span>
                                )}
                                {p.amcAmount && (
                                  <span className="text-[10px] text-gray-400">{formatINR(p.amcAmount)}/yr</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1  transition-opacity duration-200">
                              <button
                                onClick={() => handleEditProject(p)}
                                className="p-1.5 rounded-lg text-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                                title="Edit"
                              >
                                <FiEdit3 className="h-3.5 w-3.5" />
                              </button>
                              <a
                                href={`/projects/${p.id}`}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                title="Open"
                              >
                                <FiExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Summary Modal */}
      {activeCard && (
        <Modal title="Summary Details" close={() => setActiveCard('')}>
          <div className="space-y-4">
            <button 
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl
                hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50 transition-all duration-300"
              onClick={() => exportRows(projects, `dashboard-${activeCard}`)}
            >
              <FiDownload className="h-4 w-4" />
              Export Excel
            </button>
            
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {activeCard === 'product' ? (
                Object.entries(summary.byProduct).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{k}</span>
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
                      {v}
                    </span>
                  </div>
                ))
              ) : activeCard === 'earning' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="text-sm font-bold text-gray-900">{formatINR(summary.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total Received</span>
                    <span className="text-sm font-bold text-emerald-600">{formatINR(summary.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Pending Amount</span>
                    <span className="text-sm font-bold text-orange-600">{formatINR(summary.pendingAmount)}</span>
                  </div>
                </div>
              ) : activeCard === 'amc' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total AMC Projects</span>
                    <span className="text-sm font-bold text-gray-900">{summary.amcProjects}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Active AMC</span>
                    <span className="text-sm font-bold text-green-600">{summary.activeAmcProjects}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Expiring Soon</span>
                    <span className="text-sm font-bold text-yellow-600">{summary.expiringAmcProjects}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total AMC Amount</span>
                    <span className="text-sm font-bold text-orange-600">{formatINR(summary.totalAmcAmount)}</span>
                  </div>
                </div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 px-3 bg-white rounded-lg border border-gray-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{p.serial} - {p.projectName}</span>
                      <span className="text-xs text-gray-400">{p.clientName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{formatINR(p.budget || 0)}</span>
                      <span className="text-xs font-semibold text-emerald-600">
                        {formatINR((p.payments || []).reduce((a, b) => a + Number(b.amount || 0), 0))}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* New/Edit Project Modal */}
      {showNewModal && (
        <Modal 
          title={editingProject ? "Edit Project" : "New Project"} 
          close={() => {
            setShowNewModal(false);
            setEditingProject(null);
            setForm(initialForm);
          }} 
          full
        >
          <form onSubmit={editingProject ? updateProject : createProject} className="space-y-5">
            {/* Serial Number Display */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-500 font-medium mb-0.5">SERIAL NUMBER</p>
                  <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">{form.serial}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <FiFileText className="h-5 w-5 text-orange-500" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Auto-generated • Format: WR-DDMMYY-XX</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                icon={FiCalendar}
                label="Date & Time"
                type="datetime-local"
                value={form.createdAt}
                onChange={(e) => setForm({...form, createdAt: e.target.value})}
                required
              />
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Type</label>
                <select 
                  required 
                  value={form.projectType} 
                  onChange={(e) => setForm({...form, projectType: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all duration-200
                    appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 hover:bg-white"
                >
                  <option value="">Select project type</option>
                  {options.projectTypes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</label>
                <select 
                  required 
                  value={form.product} 
                  onChange={(e) => setForm({...form, product: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all duration-200
                    appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2F%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 hover:bg-white"
                >
                  <option value="">Select product</option>
                  {options.products.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              
              <InputField
                icon={FiFolder}
                label="Project Name"
                value={form.projectName}
                onChange={(e) => setForm({...form, projectName: e.target.value})}
                placeholder="e.g. Website Redesign"
                required
              />
              
              <InputField
                icon={FiUser}
                label="Client Name"
                value={form.clientName}
                onChange={(e) => setForm({...form, clientName: e.target.value})}
                placeholder="e.g. John Doe"
                required
              />
              
              <InputField
                icon={FiPhone}
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                placeholder="+91 98765 43210"
                required
              />
              
              <InputField
                icon={FiMapPin}
                label="Address"
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                placeholder="Full address"
                required
              />
              
              <InputField
                icon={FiDollarSign}
                label="Budget (₹)"
                type="number"
                value={form.budget}
                onChange={(e) => setForm({...form, budget: e.target.value})}
                placeholder="50000"
                required
              />
              
              <InputField
                icon={FiLink}
                label="Reference Link"
                value={form.link}
                onChange={(e) => setForm({...form, link: e.target.value})}
                placeholder="https://... (optional)"
              />
            </div>

            {/* AMC Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                    <FiShield className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">AMC (Annual Maintenance Contract)</h4>
                    <p className="text-[11px] text-gray-500">Enable if this project includes maintenance</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.amc === true || form.amc === 'yes'}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setForm(prev => ({
                        ...prev,
                        amc: isChecked,
                        amcStartDate: isChecked ? (prev.amcStartDate || new Date().toISOString().slice(0, 10)) : '',
                        amcEndDate: isChecked ? calculateAmcEndDate(prev.amcStartDate || new Date().toISOString().slice(0, 10), prev.amcYears) : ''
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-100 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                    after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                    peer-checked:bg-orange-500"
                  />
                </label>
              </div>
              
              {(form.amc === true || form.amc === 'yes') && (
                <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-gray-200">
                  <InputField
                    label="AMC Amount (₹/yr)"
                    type="number"
                    value={form.amcAmount}
                    onChange={(e) => setForm({...form, amcAmount: e.target.value})}
                    placeholder="10000"
                  />
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">AMC Duration</label>
                    <select
                      value={form.amcYears}
                      onChange={(e) => {
                        const years = e.target.value;
                        setForm(prev => ({
                          ...prev,
                          amcYears: years,
                          amcEndDate: calculateAmcEndDate(prev.amcStartDate, years)
                        }));
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900
                        focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all duration-200"
                    >
                      {[1,2,3,4,5].map(y => (
                        <option key={y} value={y}>{y} Year{y > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <InputField
                    icon={FiCalendar}
                    label="AMC Start Date"
                    type="date"
                    value={form.amcStartDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      setForm(prev => ({
                        ...prev,
                        amcStartDate: startDate,
                        amcEndDate: calculateAmcEndDate(startDate, prev.amcYears)
                      }));
                    }}
                  />
                  
                  <div className="sm:col-span-3 bg-white rounded-lg p-3 flex items-center gap-3">
                    <FiCalendar className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-xs text-gray-500">AMC Expiry Date (Auto-calculated)</p>
                      <p className="text-sm font-bold text-gray-900">
                        {form.amcEndDate 
                          ? new Date(form.amcEndDate).toLocaleDateString('en-IN', { 
                              day: 'numeric', month: 'long', year: 'numeric' 
                            })
                          : 'Select start date and duration'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</label>
              <textarea 
                placeholder="Project details, requirements, special instructions..." 
                value={form.note} 
                onChange={(e) => setForm({...form, note: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                  placeholder-gray-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
                  outline-none transition-all duration-200 resize-none min-h-[100px]"
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-gray-400">Budget: </span>
                  <span className="font-bold text-gray-900">{formatINR(form.budget || 0)}</span>
                </div>
                {(form.amc === true || form.amc === 'yes') && form.amcAmount && (
                  <div className="text-sm">
                    <span className="text-gray-400">AMC: </span>
                    <span className="font-bold text-orange-600">{formatINR(form.amcAmount)}/yr</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    setEditingProject(null);
                    setForm(initialForm);
                  }}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl
                    hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl
                    hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200/50 
                    transition-all duration-300 active:scale-[0.98]"
                >
                  {editingProject ? (
                    <>
                      <FiEdit3 className="h-4 w-4" />
                      Update Project
                    </>
                  ) : (
                    <>
                      <FiPlus className="h-4 w-4" />
                      Create Project
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Manage Options Modal */}
      {showManageOptions && (
        <Modal title="Manage Options" close={() => setShowManageOptions(false)}>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Add New Option</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newOption.type}
                  onChange={(e) => setNewOption(prev => ({ ...prev, type: e.target.value }))}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700
                    focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                >
                  <option value="">Select type</option>
                  <option value="product">Product</option>
                  <option value="projectType">Project Type</option>
                </select>
                <input
                  type="text"
                  placeholder="New option name"
                  value={newOption.value}
                  onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm
                    focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addNewOption()}
                />
                <button
                  onClick={addNewOption}
                  disabled={!newOption.type || !newOption.value.trim()}
                  className="px-4 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-xl
                    hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Products ({options.products.length})</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {options.products.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <FiPackage className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                      <button
                        onClick={() => deleteOption('product', item)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Project Types ({options.projectTypes.length})</h4>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {options.projectTypes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2">
                        <FiList className="h-3.5 w-3.5 text-blue-400" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                      <button
                        onClick={() => deleteOption('projectType', item)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Reusable Input Field Component
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
          ${Icon ? 'pl-10' : ''} ${props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 hover:bg-white'}`}
      />
    </div>
  </div>
);

// Modal Component
const Modal = ({ title, children, close, full = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
    <div 
      className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
      onClick={close}
    />
    
    <div className={`
      relative w-full bg-white rounded-2xl shadow-2xl border border-gray-100
      max-h-[94vh] overflow-auto
      ${full ? 'max-w-4xl' : 'max-w-lg'}
      animate-in fade-in zoom-in-95 duration-200
    `}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 bg-white/90 backdrop-blur-xl border-b border-gray-100 rounded-t-2xl">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <button 
          onClick={close}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600 
            hover:bg-gray-100 transition-all duration-200"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-5">
        {children}
      </div>
    </div>
  </div>
);
