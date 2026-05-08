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
  FiEdit3, FiTrash2, FiMoreHorizontal, FiEye, FiCopy,
  FiBarChart2, FiPieChart, FiActivity, FiTarget, FiZap
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
    if (showNewModal) {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 16);
      
      if (!editingProject) {
        const serial = generateSerialNumber(now);
        setForm({ ...initialForm, createdAt: dateStr, serial });
      }
    }
  }, [showNewModal, editingProject, projects]);

  const generateSerialNumber = (selectedDate = new Date(), excludeProjectId = null) => {
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = String(selectedDate.getFullYear()).slice(-2);
    
    const datePrefix = `${day}${month}${year}`;
    
    // Get ALL projects except the one being edited
    const allOtherProjects = projects.filter(p => {
      if (excludeProjectId && p.id === excludeProjectId) return false;
      return true;
    });
    
    // Extract ALL sequence numbers from all projects across all dates
    const allUsedNumbers = allOtherProjects
      .map(p => {
        const parts = p.serial?.split('-');
        return parts ? parseInt(parts[2], 10) : null;
      })
      .filter(Boolean)
      .sort((a, b) => a - b);
    
    // Find the smallest available number (considering gaps from deleted projects)
    let sequence = 1;
    for (let i = 0; i < allUsedNumbers.length; i++) {
      if (allUsedNumbers[i] !== sequence) {
        break;
      }
      sequence++;
    }
    
    // If we're editing and the project already has a serial number
    if (excludeProjectId) {
      const currentProject = projects.find(p => p.id === excludeProjectId);
      if (currentProject?.serial) {
        const parts = currentProject.serial.split('-');
        const currentNum = parseInt(parts[2], 10);
        
        // Check if the current number is still available (not used by others)
        const isCurrentNumAvailable = !allUsedNumbers.includes(currentNum);
        
        if (isCurrentNumAvailable) {
          // Keep the same number if it's still available
          sequence = currentNum;
        }
        // If current number is taken, sequence will use the next available number found above
      }
    }
    
    const formattedSequence = String(sequence).padStart(2, '0');
    return `WR-${datePrefix}-${formattedSequence}`;
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    const selectedDate = new Date(newDate);
    const excludeId = editingProject?.id || null;
    const newSerial = generateSerialNumber(selectedDate, excludeId);
    
    setForm(prev => ({
      ...prev,
      createdAt: newDate,
      serial: newSerial
    }));
  };

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
    
    const completedProjects = projects.filter(p => {
      const paid = (p.payments || []).reduce((x, y) => x + Number(y.amount || 0), 0);
      return paid >= Number(p.budget || 0) && Number(p.budget || 0) > 0;
    });
    
    return { 
      totalBudget, totalPaid, byProduct, pendingAmount, 
      thisMonthProjects: thisMonthProjects.length, 
      amcProjects: amcProjects.length,
      activeAmcProjects: activeAmcProjects.length,
      expiringAmcProjects: expiringAmcProjects.length,
      totalAmcAmount: amcProjects.reduce((a, p) => a + Number(p.amcAmount || 0), 0),
      completedProjects: completedProjects.length,
      completionRate: projects.length > 0 ? ((completedProjects.length / projects.length) * 100).toFixed(0) : 0
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
    
    if (filters.product) filtered = filtered.filter(p => p.product === filters.product);
    if (filters.projectType) filtered = filtered.filter(p => p.projectType === filters.projectType);
    
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
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    { 
      key: 'budget', 
      title: 'Total Budget', 
      value: formatINR(summary.totalBudget), 
      icon: FiDollarSign,
      color: 'violet',
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50'
    },
    { 
      key: 'earning', 
      title: 'Total Received', 
      value: formatINR(summary.totalPaid), 
      icon: FiTrendingUp,
      color: 'emerald',
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50'
    },
    { 
      key: 'completion', 
      title: 'Completion Rate', 
      value: `${summary.completionRate}%`, 
      icon: FiTarget,
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-50 to-amber-50'
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
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/40 via-transparent to-rose-100/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-sky-100/30 via-transparent to-violet-100/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-50/20 via-transparent to-blue-50/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-200/50">
                  <FiFolder className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                    Project Dashboard
                  </h1>
                  <div className="flex items-center gap-2 text-gray-500 mt-0.5">
                    <FiGrid className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">WebReich CRM</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs">{projects.length} active projects</span>
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
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setShowManageOptions(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl
                  hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
              >
                <FiSettings className="h-4 w-4" />
                Manage Options
              </button>
              <button 
                onClick={() => {
                  setEditingProject(null);
                  setShowNewModal(true);
                }}
                className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm rounded-xl
                  shadow-lg shadow-orange-200/50 hover:shadow-xl hover:shadow-orange-200/70 
                  transition-all duration-300 active:scale-[0.98] flex-1 lg:flex-none justify-center"
              >
                <FiPlus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {cardData.map((card) => (
            <button
              key={card.key}
              onClick={() => setActiveCard(card.key)}
              className="group relative text-left bg-white rounded-2xl p-5 border border-gray-100
                shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                hover:border-orange-200 active:scale-[0.98] overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${colorMap[card.color].bg}`}>
                    <card.icon className={`h-5 w-5 ${colorMap[card.color].text}`} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <FiChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500 mb-1">{card.title}</p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">{card.value}</p>
                <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${card.gradient} w-12 group-hover:w-full transition-all duration-500`} />
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FiActivity className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-sm font-bold text-gray-900">{summary.thisMonthProjects} projects</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <FiCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-sm font-bold text-gray-900">{summary.completedProjects} projects</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <FiDollarSign className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending Amount</p>
              <p className="text-sm font-bold text-gray-900">{formatINR(summary.pendingAmount)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
            <div className="p-2 bg-violet-50 rounded-lg">
              <FiShield className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Active AMC</p>
              <p className="text-sm font-bold text-gray-900">{summary.activeAmcProjects} contracts</p>
            </div>
          </div>
        </div>

        {/* AMC Alert Banner */}
        {summary.expiringAmcProjects > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiAlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {summary.expiringAmcProjects} AMC contracts expiring within 30 days
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">Review and renew contracts to avoid service interruption</p>
            </div>
            <button 
              onClick={() => {
                setFilters({ product: '', projectType: '', amc: 'expiring' });
                setShowFilters(true);
              }}
              className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg
                hover:bg-yellow-700 transition-colors shadow-sm"
            >
              View All
            </button>
          </div>
        )}

        {/* Projects Table Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="p-4 lg:p-6 border-b border-gray-100">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search projects by name, client, serial number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl
                      focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
                      placeholder-gray-400 transition-all duration-200"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border transition-all duration-200
                      ${showFilters || hasActiveFilters 
                        ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <FiFilter className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-orange-500 text-white text-xs font-bold">
                        !
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => exportRows(filteredAndSortedProjects, 'projects-export')}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium bg-white border border-gray-200 rounded-xl
                      text-gray-700 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FiDownload className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>

              {/* Filter Row */}
              {(showFilters || hasActiveFilters) && (
                <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <select
                    value={filters.product}
                    onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
                    className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                  >
                    <option value="">All Products</option>
                    {options.products.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  
                  <select
                    value={filters.projectType}
                    onChange={(e) => setFilters(prev => ({ ...prev, projectType: e.target.value }))}
                    className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                  >
                    <option value="">All Types</option>
                    {options.projectTypes.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>

                  <select
                    value={filters.amc}
                    onChange={(e) => setFilters(prev => ({ ...prev, amc: e.target.value }))}
                    className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700
                      focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
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
                    className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Clear all filters
                  </button>
                  
                  <span className="text-sm text-gray-400 ml-auto font-medium">
                    {filteredAndSortedProjects.length} result{filteredAndSortedProjects.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-48 flex-1" />
                  <div className="h-4 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-24" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedProjects.length === 0 ? (
            <div className="py-20 text-center px-4">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 mb-6">
                <FiFolder className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {hasActiveFilters 
                  ? 'No projects match your current filters. Try adjusting your search criteria.'
                  : 'Get started by creating your first project and track all your work in one place.'}
              </p>
              {!hasActiveFilters ? (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl
                    hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200/50 transition-all duration-300"
                >
                  <FiPlus className="h-5 w-5" />
                  Create First Project
                </button>
              ) : (
                <button
                  onClick={clearFilters}
                  className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                  Clear all filters →
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden divide-y divide-gray-50">
                {filteredAndSortedProjects.map((p) => {
                  const amcStatus = getAmcStatus(p);
                  const paidAmount = (p.payments || []).reduce((a, b) => a + Number(b.amount || 0), 0);
                  const progressPercentage = p.budget > 0 ? ((paidAmount / Number(p.budget)) * 100).toFixed(0) : 0;
                  
                  return (
                    <div
                      key={p.id}
                      className="p-4 hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-mono font-bold text-gray-600">
                            {p.serial}
                          </span>
                          {p.amc && amcStatus && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${amcStatus.color}`}>
                              <amcStatus.icon className="h-3 w-3" />
                              {amcStatus.label}
                            </span>
                          )}
                        </div>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                          {p.product}
                        </span>
                      </div>
                      
                      <h4 className="text-base font-bold text-gray-900 mb-2">{p.projectName}</h4>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1.5">
                          <FiUser className="h-3.5 w-3.5 text-gray-400" />
                          {p.clientName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FiCalendar className="h-3.5 w-3.5 text-gray-400" />
                          {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                      
                      {p.note && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-3 italic bg-gray-50 p-2 rounded-lg">
                          "{p.note}"
                        </p>
                      )}
                      
                      {/* Progress Bar */}
                      {Number(p.budget) > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-semibold text-gray-700">{progressPercentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-orange-500'
                              }`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{formatINR(p.budget || 0)}</span>
                            <span className="text-xs text-gray-400">budget</span>
                          </div>
                          {p.amc && (
                            <span className="text-xs text-gray-500">
                              AMC: {formatINR(p.amcAmount || 0)}/yr
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditProject(p)}
                            className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                            title="Edit project"
                          >
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                          <a
                            href={`/projects/${p.id}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                            title="View details"
                          >
                            <FiExternalLink className="h-4 w-4" />
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
                    <tr className="border-b-2 border-gray-100">
                      {[
                        { label: 'Serial', field: 'serial' },
                        { label: 'Project', field: 'projectName' },
                        { label: 'Client', field: 'clientName' },
                        { label: 'Product', field: 'product' },
                        { label: 'Type', field: 'projectType' },
                        { label: 'Date', field: 'createdAt' },
                        { label: 'Budget', field: 'budget' },
                        { label: 'Progress', field: '' },
                        { label: 'AMC', field: 'amcEndDate' },
                        { label: '', field: '' }
                      ].map(({ label, field }) => (
                        <th key={label} className="px-4 py-4 text-left">
                          {field ? (
                            <button
                              onClick={() => handleSort(field)}
                              className="group flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider
                                hover:text-gray-700 transition-colors"
                            >
                              {label}
                              <SortIcon field={field} />
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {label}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredAndSortedProjects.map((p) => {
                      const amcStatus = getAmcStatus(p);
                      const paidAmount = (p.payments || []).reduce((a, b) => a + Number(b.amount || 0), 0);
                      const progressPercentage = p.budget > 0 ? ((paidAmount / Number(p.budget)) * 100).toFixed(0) : 0;
                      
                      return (
                        <tr 
                          key={p.id} 
                          className="group hover:bg-gradient-to-r hover:from-orange-50/30 hover:to-transparent transition-all duration-200"
                        >
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-mono font-bold text-gray-600 border border-gray-100">
                              {p.serial}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="max-w-[250px]">
                              <div className="flex items-center gap-2">
                                <FiFolder className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-900 truncate">{p.projectName}</span>
                              </div>
                              {p.note && (
                                <p className="text-xs text-gray-400 truncate mt-1 ml-6 italic">"{p.note}"</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center">
                                <FiUser className="h-3.5 w-3.5 text-gray-500" />
                              </div>
                              <span className="text-sm text-gray-700 font-medium">{p.clientName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold border border-orange-100">
                              {p.product}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-600">{p.projectType}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                              <FiCalendar className="h-3.5 w-3.5 text-gray-400" />
                              {new Date(p.createdAt).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short',
                                year: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-bold text-gray-900">{formatINR(p.budget || 0)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-orange-400'
                                  }`}
                                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-600 w-8">{progressPercentage}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {p.amc ? (
                              <div className="space-y-1">
                                {amcStatus && (
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${amcStatus.color}`}>
                                    <amcStatus.icon className="h-3 w-3" />
                                    {amcStatus.label}
                                  </span>
                                )}
                                {p.amcAmount > 0 && (
                                  <p className="text-xs text-gray-400">{formatINR(p.amcAmount)}/yr</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleEditProject(p)}
                                className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                title="Edit project"
                              >
                                <FiEdit3 className="h-4 w-4" />
                              </button>
                              <a
                                href={`/projects/${p.id}`}
                                className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                                title="View details"
                              >
                                <FiExternalLink className="h-4 w-4" />
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
        <Modal title={cardData.find(c => c.key === activeCard)?.title || 'Summary'} close={() => setActiveCard('')}>
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
                  <div key={k} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-700">{k}</span>
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-orange-50 text-orange-600 text-sm font-bold">
                      {v}
                    </span>
                  </div>
                ))
              ) : activeCard === 'earning' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total Budget</span>
                    <span className="text-sm font-bold text-gray-900">{formatINR(summary.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total Received</span>
                    <span className="text-sm font-bold text-emerald-600">{formatINR(summary.totalPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Pending Amount</span>
                    <span className="text-sm font-bold text-orange-600">{formatINR(summary.pendingAmount)}</span>
                  </div>
                </div>
              ) : activeCard === 'completion' ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Completed Projects</span>
                    <span className="text-sm font-bold text-emerald-600">{summary.completedProjects}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Total Projects</span>
                    <span className="text-sm font-bold text-gray-900">{projects.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-600">Completion Rate</span>
                    <span className="text-sm font-bold text-blue-600">{summary.completionRate}%</span>
                  </div>
                </div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100">
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
          title={editingProject ? "Edit Project" : "Create New Project"} 
          close={() => {
            setShowNewModal(false);
            setEditingProject(null);
            setForm(initialForm);
          }} 
          full
        >
          <form onSubmit={editingProject ? updateProject : createProject} className="space-y-6">
            {/* Serial Number Display */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1">Serial Number</p>
                  <p className="text-2xl font-bold text-gray-900 font-mono tracking-wider">{form.serial}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-orange-100 flex items-center justify-center">
                  <FiFileText className="h-7 w-7 text-orange-500" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <FiZap className="h-3 w-3" />
                Auto-generated • Format: WR-DDMMYY-XX • Global sequential numbering
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-5">
              <InputField
                icon={FiCalendar}
                label="Date & Time"
                type="datetime-local"
                value={form.createdAt}
                onChange={handleDateChange}
                required
              />
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Project Type</label>
                <select 
                  required 
                  value={form.projectType} 
                  onChange={(e) => setForm({...form, projectType: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all duration-200
                    appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-12"
                >
                  <option value="">Select project type</option>
                  {options.projectTypes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Product</label>
                <select 
                  required 
                  value={form.product} 
                  onChange={(e) => setForm({...form, product: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all duration-200
                    appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2F%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_16px_center] bg-no-repeat pr-12"
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
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                    <FiShield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">AMC (Annual Maintenance Contract)</h4>
                    <p className="text-sm text-gray-500">Enable if this project includes maintenance services</p>
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-100 rounded-full peer 
                    peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                    after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                    peer-checked:bg-orange-500"
                  />
                </label>
              </div>
              
              {(form.amc === true || form.amc === 'yes') && (
                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                  <InputField
                    label="AMC Amount (₹/yr)"
                    type="number"
                    value={form.amcAmount}
                    onChange={(e) => setForm({...form, amcAmount: e.target.value})}
                    placeholder="10000"
                  />
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">AMC Duration</label>
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
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900
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
                  
                  <div className="sm:col-span-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 flex items-center gap-4 border border-blue-100">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <FiCalendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">AMC Expiry Date</p>
                      <p className="text-base font-bold text-gray-900">
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
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</label>
              <textarea 
                placeholder="Project details, requirements, special instructions..." 
                value={form.note} 
                onChange={(e) => setForm({...form, note: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                  placeholder-gray-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
                  outline-none transition-all duration-200 resize-none min-h-[120px]"
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-500">Budget: </span>
                  <span className="text-sm font-bold text-gray-900">{formatINR(form.budget || 0)}</span>
                </div>
                {(form.amc === true || form.amc === 'yes') && form.amcAmount && (
                  <div>
                    <span className="text-sm text-gray-500">AMC: </span>
                    <span className="text-sm font-bold text-orange-600">{formatINR(form.amcAmount)}/yr</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewModal(false);
                    setEditingProject(null);
                    setForm(initialForm);
                  }}
                  className="px-5 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl
                    hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-xl
                    hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-200/50 
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
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-5 space-y-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FiPlus className="h-5 w-5 text-orange-500" />
                Add New Option
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newOption.type}
                  onChange={(e) => setNewOption(prev => ({ ...prev, type: e.target.value }))}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                >
                  <option value="">Select type</option>
                  <option value="product">Product</option>
                  <option value="projectType">Project Type</option>
                </select>
                <input
                  type="text"
                  placeholder="Enter new option name"
                  value={newOption.value}
                  onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && addNewOption()}
                />
                <button
                  onClick={addNewOption}
                  disabled={!newOption.type || !newOption.value.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-xl
                    hover:from-orange-600 hover:to-orange-700 disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 
                    disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiPackage className="h-4 w-4" />
                  Products ({options.products.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {options.products.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                          <FiPackage className="h-4 w-4 text-orange-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item}</span>
                      </div>
                      <button
                        onClick={() => deleteOption('product', item)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiList className="h-4 w-4" />
                  Project Types ({options.projectTypes.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {options.projectTypes.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <FiList className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{item}</span>
                      </div>
                      <button
                        onClick={() => deleteOption('projectType', item)}
                        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        <FiTrash2 className="h-4 w-4" />
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
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    )}
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      )}
      <input
        {...props}
        className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
          placeholder-gray-400 focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
          outline-none transition-all duration-200
          ${Icon ? 'pl-11' : ''} ${props.disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 hover:bg-white'}`}
      />
    </div>
  </div>
);

// Modal Component
const Modal = ({ title, children, close, full = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div 
      className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      onClick={close}
    />
    
    <div className={`
      relative w-full bg-white rounded-2xl shadow-2xl border border-gray-100
      max-h-[90vh] overflow-auto
      ${full ? 'max-w-5xl' : 'max-w-lg'}
      animate-in fade-in zoom-in-95 duration-200
    `}>
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-xl border-b border-gray-100 rounded-t-2xl">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <button 
          onClick={close}
          className="flex items-center justify-center h-10 w-10 rounded-xl text-gray-400 hover:text-gray-600 
            hover:bg-gray-100 transition-all duration-200"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);