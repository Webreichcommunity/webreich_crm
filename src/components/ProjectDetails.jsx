import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, ref, remove, update } from 'firebase/database';
import { database } from '../db/firebase';
import { DEFAULT_MEETING_TYPES, DEFAULT_PAYMENT_MODES, formatINR } from './projectUtils';
import { 
  FiArrowLeft, FiSave, FiTrash2, FiDollarSign, FiCalendar, FiUser, 
  FiPhone, FiMapPin, FiPackage, FiLink, FiFileText, FiClock,
  FiPlus, FiExternalLink, FiMessageCircle, FiCheckCircle, FiAlertCircle,
  FiShield, FiEdit3, FiChevronRight, FiPhoneCall, FiMail
} from 'react-icons/fi';

const msg = (p, amt, received) => 
  `Hello ${p.clientName}, we received ${formatINR(amt)} for ${p.projectName}. Total received: ${formatINR(received)}. Remaining: ${formatINR(Number(p.budget) - received)}.`;

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [meeting, setMeeting] = useState({
    date: new Date().toISOString().slice(0, 16),
    type: 'Call',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentFormExpanded, setPaymentFormExpanded] = useState(false);
  const [meetingFormExpanded, setMeetingFormExpanded] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      const s = await get(ref(database, `projects/${id}`));
      const data = s.val();
      setProject(data);
      setEditedProject(data);
      setIsLoading(false);
    })();
  }, [id]);

  const received = useMemo(
    () => (project?.payments || []).reduce((a, p) => a + Number(p.amount || 0), 0),
    [project]
  );

  const remaining = useMemo(
    () => Number(project?.budget || 0) - received,
    [project, received]
  );

  const progressPercent = useMemo(
    () => project?.budget ? Math.round((received / Number(project.budget)) * 100) : 0,
    [project, received]
  );

  const getAmcStatus = () => {
    if (!project?.amc || project.amc === 'no') return null;
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
      return { label: 'Active', color: 'bg-green-100 text-green-700', icon: FiCheckCircle };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-10 w-10 border-4 border-orange-200 border-t-orange-500 rounded-full mx-auto" />
          <p className="text-sm text-gray-400 font-medium">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gray-100">
            <FiFileText className="h-8 w-8 text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Project Not Found</h2>
          <p className="text-sm text-gray-500">This project may have been deleted or the link is incorrect.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl
              hover:bg-orange-600 transition-colors shadow-md shadow-orange-200/30"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const addPayment = async () => {
    if (!amount || Number(amount) <= 0) return;
    const payment = { amount: Number(amount || 0), mode, date: new Date().toISOString() };
    const next = [...(project.payments || []), payment];
    await update(ref(database, `projects/${id}`), { payments: next });
    const rec = next.reduce((a, p) => a + Number(p.amount || 0), 0);
    window.open(
      `https://wa.me/${project.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg(project, amount, rec))}`,
      '_blank'
    );
    setProject({ ...project, payments: next });
    setAmount('');
    setPaymentFormExpanded(false);
  };

  const addMeeting = async () => {
    if (!meeting.date || !meeting.type) return;
    const next = [...(project.meetings || []), meeting];
    await update(ref(database, `projects/${id}`), { meetings: next });
    window.open(
      `https://wa.me/${project.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Meeting scheduled on ${new Date(meeting.date).toLocaleString('en-IN')} for ${project.projectName}\nType: ${meeting.type}\nNotes: ${meeting.notes || 'N/A'}`
      )}`,
      '_blank'
    );
    setProject({ ...project, meetings: next });
    setMeeting({ date: new Date().toISOString().slice(0, 16), type: 'Call', notes: '' });
    setMeetingFormExpanded(false);
  };

  const saveProject = async () => {
    await update(ref(database, `projects/${id}`), editedProject);
    setProject(editedProject);
    setIsEditing(false);
  };

  const deleteProject = async () => {
    await remove(ref(database, `projects/${id}`));
    window.location.href = '/';
  };

  const amcStatus = getAmcStatus();
  const tabs = ['overview', 'payments', 'meetings', 'notes'];

  return (
    <div className="min-h-screen bg-transparent relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-orange-50/50 via-transparent to-rose-50/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-sky-50/30 via-transparent to-orange-50/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl
              hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 shadow-sm"
          >
            <FiArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedProject(project);
                    setIsEditing(false);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProject}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl
                    hover:from-emerald-600 hover:to-emerald-700 shadow-md shadow-emerald-200/30 transition-all"
                >
                  <FiSave className="h-4 w-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl
                    hover:bg-gray-50 transition-all duration-200"
                >
                  <FiEdit3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-500 bg-white border border-red-200 rounded-xl
                    hover:bg-red-50 transition-all duration-200"
                >
                  <FiTrash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Project Header Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-mono font-bold text-gray-600">
                    {project.serial}
                  </span>
                  {amcStatus && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${amcStatus.color}`}>
                      <amcStatus.icon className="h-3 w-3" />
                      AMC {amcStatus.label}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-medium">
                    <FiPackage className="h-3 w-3" />
                    {project.product}
                  </span>
                </div>
                {isEditing ? (
                  <input
                    value={editedProject?.projectName || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, projectName: e.target.value })}
                    className="text-2xl sm:text-3xl font-bold text-gray-900 w-full bg-transparent border-b-2 border-orange-200 focus:border-orange-500 outline-none pb-1"
                  />
                ) : (
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                    {project.projectName}
                  </h1>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <a
                  href={`tel:${project.phone}`}
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition-all"
                  title="Call"
                >
                  <FiPhoneCall className="h-4 w-4" />
                </a>
                <a
                  href={`https://wa.me/${project.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                  title="WhatsApp"
                >
                  <FiMessageCircle className="h-4 w-4" />
                </a>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                    title="Open Link"
                  >
                    <FiExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Client Info Badges */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1.5">
                <FiUser className="h-3.5 w-3.5 text-gray-400" />
                {isEditing ? (
                  <input
                    value={editedProject?.clientName || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, clientName: e.target.value })}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  />
                ) : (
                  <span className="font-medium text-gray-700">{project.clientName}</span>
                )}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5">
                <FiPhone className="h-3.5 w-3.5 text-gray-400" />
                {isEditing ? (
                  <input
                    value={editedProject?.phone || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, phone: e.target.value })}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none"
                  />
                ) : (
                  <span>{project.phone}</span>
                )}
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5">
                <FiCalendar className="h-3.5 w-3.5 text-gray-400" />
                <span>{new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </span>
            </div>

            {/* Address */}
            <div className="flex items-start gap-1.5 text-sm text-gray-500 mb-4">
              <FiMapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              {isEditing ? (
                <textarea
                  value={editedProject?.address || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, address: e.target.value })}
                  className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm w-full focus:ring-1 focus:ring-orange-200 focus:border-orange-300 outline-none resize-none"
                  rows={1}
                />
              ) : (
                <span>{project.address || 'No address provided'}</span>
              )}
            </div>

            {/* Budget Progress Bar */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Budget Progress</span>
                <span className="text-xs font-bold text-gray-700">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    progressPercent >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                      : progressPercent >= 75
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">Budget: </span>
                  <span className="font-bold text-gray-900">{formatINR(project.budget || 0)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Received: </span>
                  <span className="font-bold text-emerald-600">{formatINR(received)}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">Remaining: </span>
                  <span className={`font-bold ${remaining > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    {formatINR(Math.abs(remaining))}
                    {remaining < 0 && ' (Over)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-50 px-4 sm:px-6 flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'overview' && (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Project Info Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-orange-500" />
                  Project Information
                </h3>
                <div className="space-y-3">
                  <InfoRow icon={FiPackage} label="Product" value={project.product} isEditing={isEditing} editedValue={editedProject?.product} onChange={(v) => setEditedProject({ ...editedProject, product: v })} />
                  <InfoRow icon={FiFileText} label="Project Type" value={project.projectType} isEditing={isEditing} editedValue={editedProject?.projectType} onChange={(v) => setEditedProject({ ...editedProject, projectType: v })} />
                  <InfoRow icon={FiCalendar} label="Created" value={new Date(project.createdAt).toLocaleString('en-IN')} />
                  <InfoRow icon={FiLink} label="Link" value={project.link} isEditing={isEditing} editedValue={editedProject?.link} onChange={(v) => setEditedProject({ ...editedProject, link: v })} isLink />
                </div>
              </div>

              {/* AMC Info Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FiShield className="h-4 w-4 text-orange-500" />
                  AMC Details
                </h3>
                {project.amc && project.amc !== 'no' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Status</span>
                      {amcStatus && (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${amcStatus.color}`}>
                          <amcStatus.icon className="h-3 w-3" />
                          {amcStatus.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-sm text-gray-500">Amount</span>
                      <span className="text-sm font-bold text-gray-900">{formatINR(project.amcAmount || 0)}/year</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-gray-50">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="text-sm font-medium text-gray-700">{project.amcYears || 1} Year{project.amcYears > 1 ? 's' : ''}</span>
                    </div>
                    {project.amcStartDate && (
                      <div className="flex items-center justify-between py-2 border-t border-gray-50">
                        <span className="text-sm text-gray-500">Start Date</span>
                        <span className="text-sm text-gray-700">{new Date(project.amcStartDate).toLocaleDateString('en-IN')}</span>
                      </div>
                    )}
                    {project.amcEndDate && (
                      <div className="flex items-center justify-between py-2 border-t border-gray-50">
                        <span className="text-sm text-gray-500">Expiry Date</span>
                        <span className="text-sm font-semibold text-gray-900">{new Date(project.amcEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                      <FiShield className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No AMC for this project</p>
                  </div>
                )}
              </div>

              {/* Note Card */}
              <div className="sm:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiFileText className="h-4 w-4 text-orange-500" />
                  Notes
                </h3>
                {isEditing ? (
                  <textarea
                    value={editedProject?.note || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, note: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                      focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
                      outline-none transition-all duration-200 resize-none min-h-[120px]"
                    placeholder="Add project notes..."
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {project.note || 'No notes added yet.'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Add Payment */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setPaymentFormExpanded(!paymentFormExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <FiPlus className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">Add Payment</h3>
                      <p className="text-xs text-gray-400">Record a new payment receipt</p>
                    </div>
                  </div>
                  <FiChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${paymentFormExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {paymentFormExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[120px]">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                        <input
                          type="number"
                          placeholder="5000"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm
                            focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all"
                        />
                      </div>
                      <div className="min-w-[120px]">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Mode</label>
                        <select
                          value={mode}
                          onChange={(e) => setMode(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm
                            focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                        >
                          {DEFAULT_PAYMENT_MODES.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={addPayment}
                          disabled={!amount || Number(amount) <= 0}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-xl
                            hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200/30 transition-all
                            disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                        >
                          <FiDollarSign className="h-4 w-4" />
                          Add & WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment List */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Payment History ({(project.payments || []).length})</h3>
                </div>
                {(project.payments || []).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                      <FiDollarSign className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {[...(project.payments || [])].reverse().map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <FiDollarSign className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{formatINR(p.amount)}</p>
                            <p className="text-xs text-gray-400">{new Date(p.date).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-medium">
                          {p.mode}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'meetings' && (
            <div className="space-y-4">
              {/* Add Meeting */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setMeetingFormExpanded(!meetingFormExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                      <FiCalendar className="h-5 w-5 text-violet-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-semibold text-gray-900">Schedule Meeting</h3>
                      <p className="text-xs text-gray-400">Track client meetings and follow-ups</p>
                    </div>
                  </div>
                  <FiChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${meetingFormExpanded ? 'rotate-90' : ''}`} />
                </button>
                
                {meetingFormExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Date & Time</label>
                        <input
                          type="datetime-local"
                          value={meeting.date}
                          onChange={(e) => setMeeting({ ...meeting, date: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm
                            focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all"
                        />
                      </div>
                      <div className="min-w-[100px]">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
                        <select
                          value={meeting.type}
                          onChange={(e) => setMeeting({ ...meeting, type: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm
                            focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none"
                        >
                          {DEFAULT_MEETING_TYPES.map((m) => (
                            <option key={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</label>
                        <input
                          placeholder="Meeting notes..."
                          value={meeting.notes}
                          onChange={(e) => setMeeting({ ...meeting, notes: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm
                            focus:ring-2 focus:ring-orange-100 focus:border-orange-300 outline-none transition-all"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={addMeeting}
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold rounded-xl
                            hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-200/30 transition-all"
                        >
                          <FiCalendar className="h-4 w-4" />
                          Schedule & WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting List */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Meeting History ({(project.meetings || []).length})</h3>
                </div>
                {(project.meetings || []).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                      <FiCalendar className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No meetings recorded yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {[...(project.meetings || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map((m, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                        <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FiCalendar className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-gray-900">{m.type}</p>
                            <span className="text-xs text-gray-400">
                              {new Date(m.date).toLocaleString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {m.notes && (
                            <p className="text-xs text-gray-500 mt-0.5">{m.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiFileText className="h-4 w-4 text-orange-500" />
                Project Notes              </h3>
              {isEditing ? (
                <textarea
                  value={editedProject?.note || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, note: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900
                    focus:ring-2 focus:ring-orange-100 focus:border-orange-300 focus:bg-white
                    outline-none transition-all duration-200 resize-none min-h-[200px]"
                  placeholder="Add detailed project notes, requirements, special instructions..."
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {project.note ? (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{project.note}</p>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                        <FiFileText className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500">No notes added yet</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="mt-3 text-sm text-orange-600 font-medium hover:text-orange-700"
                      >
                        Add notes
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-red-50 mb-3">
                <FiAlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Project?</h3>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently delete <span className="font-semibold text-gray-700">{project.serial} - {project.projectName}</span> and all its data.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={deleteProject}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl
                  hover:from-red-600 hover:to-red-700 shadow-md shadow-red-200/30 transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable Info Row Component
const InfoRow = ({ icon: Icon, label, value, isEditing, editedValue, onChange, isLink }) => (
  <div className="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <span className="text-xs text-gray-500">{label}</span>
    </div>
    <div className="ml-4 text-right min-w-0 flex-1">
      {isEditing ? (
        <input
          value={editedValue || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-right text-sm font-medium text-gray-900 bg-transparent border-b border-orange-200 focus:border-orange-500 outline-none"
        />
      ) : isLink && value ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-orange-600 hover:text-orange-700 font-medium truncate block">
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium text-gray-900 truncate block">{value || '—'}</span>
      )}
    </div>
  </div>
);
