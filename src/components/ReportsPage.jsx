import { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';
import * as XLSX from 'xlsx';
import { FiDownload } from 'react-icons/fi';

export default function ReportsPage() {
  const [projects, setProjects] = useState([]);
  const [month, setMonth] = useState('all');
  const [product, setProduct] = useState('all');
  const [loading, setLoading] = useState(true);
  const FILTERS_KEY = 'wrcrm_reports_filters_v1';

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || 'null');
      if (saved) {
        if (typeof saved.month === 'string') setMonth(saved.month);
        if (typeof saved.product === 'string') setProduct(saved.product);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({ month, product }));
  }, [month, product]);

  useEffect(() => {
    const unsubscribe = onValue(ref(database, 'projects'), (snapshot) => {
      setProjects(Object.values(snapshot.val() || {}));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const rows = useMemo(
    () =>
      projects.map((p) => {
        const paid = (p.payments || []).reduce((a, x) => a + Number(x.amount || 0), 0);
        return {
          serial: p.serial || '',
          clientName: p.clientName,
          date: p.createdAt,
          month: getMonthKey(p.createdAt),
          product: p.product,
          businessName: p.projectName,
          status: p.status || 'ongoing',
          earning: paid,
          budget: Number(p.budget || 0),
          highPay: paid > 100000,
        };
      }),
    [projects]
  );

  const months = useMemo(() => Array.from(new Set(rows.map((r) => r.month))).sort(), [rows]);

  const products = useMemo(() => Array.from(new Set(rows.map((r) => r.product).filter(Boolean))).sort(), [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (month !== 'all') result = result.filter((r) => r.month === month);
    if (product !== 'all') result = result.filter((r) => r.product === product);
    return result;
  }, [rows, month, product]);

  const byProduct = useMemo(
    () => filtered.reduce((a, r) => ({ ...a, [r.product]: (a[r.product] || 0) + r.earning }), {}),
    [filtered]
  );

  const top = useMemo(() => [...filtered].sort((a, b) => b.earning - a.earning)[0], [filtered]);
  const topFive = useMemo(() => [...filtered].sort((a, b) => b.earning - a.earning).slice(0, 5), [filtered]);
  const statusCounts = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => {
          const s = String(r.status || 'ongoing').toLowerCase();
          if (s === 'completed' || s === 'complete' || s === 'done') acc.completed += 1;
          else acc.ongoing += 1;
          return acc;
        },
        { completed: 0, ongoing: 0 }
      ),
    [filtered]
  );

  const exportExcel = () => {
    const exportData = filtered.map((r) => ({
      Serial: r.serial || '',
      Client: r.clientName,
      Date: r.date ? new Date(r.date).toLocaleDateString('en-IN') : '',
      Month: r.month,
      Product: r.product,
      Project: r.businessName,
      Status: r.status || 'ongoing',
      Budget: Number(r.budget || 0),
      Earning: Number(r.earning || 0),
      Pending: Number(r.budget || 0) - Number(r.earning || 0),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportData), 'Reports');
    XLSX.writeFile(wb, `reports-${month === 'all' ? 'all' : month}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const maxProductEarning = Math.max(...Object.values(byProduct), 1);

  const StatCard = ({ label, value, icon, accent }) => (
    <div className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-orange-50 transition-all duration-300">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-orange-500 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
      <div className="space-y-3">
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-6 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="wr-container py-4 md:py-6 lg:py-8">
        <div className="wr-page-header">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="wr-title">Reports</h1>
              <p className="wr-subtitle">Month-wise + product-wise earnings, top projects, and exportable tables.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white/70 text-sm font-semibold text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300
                             hover:border-orange-200 transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Months</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative flex-1 sm:flex-none sm:w-56">
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="appearance-none w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white/70 text-sm font-semibold text-slate-700
                             focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300
                             hover:border-orange-200 transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Products</option>
                  {products.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <button
                onClick={exportExcel}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-md shadow-orange-200/40 hover:from-orange-600 hover:to-orange-700 transition"
              >
                <FiDownload className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="wr-chip">Rows: {filtered.length}</span>
            {top?.businessName && <span className="wr-chip">Top project: {top.businessName}</span>}
            <span className="wr-chip">Ongoing: {statusCounts.ongoing}</span>
            <span className="wr-chip">Completed: {statusCounts.completed}</span>
          </div>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports available</h3>
            <p className="text-sm text-gray-500">Select a different month or add projects to see analytics</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <StatCard
                label="Top Product"
                value={Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
              <StatCard
                label="Top Project"
                value={top?.businessName || 'N/A'}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                }
                accent="text-orange-600"
              />
              <StatCard
                label="Highest Earning"
                value={formatINR(top?.earning || 0)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                accent="text-orange-600"
              />
            </div>

            {/* Top 5 projects */}
            <div className="wr-card p-4 sm:p-5 mb-8 border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">Top 5 Projects (by earnings)</h3>
                <span className="text-xs text-slate-500">{month === 'all' ? 'All months' : month}{product === 'all' ? '' : ` • ${product}`}</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {topFive.map((r, i) => (
                  <div key={`${r.businessName}-${i}`} className="rounded-2xl bg-white/60 border border-white/70 p-3">
                    <p className="text-[11px] font-semibold text-slate-500">#{i + 1}</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 truncate">{r.businessName || 'N/A'}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{r.clientName || ''}</p>
                    <p className="text-sm font-extrabold text-orange-600 mt-2">{formatINR(r.earning || 0)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-gradient-to-b from-orange-500 to-orange-400 rounded-full" />
                <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
              </div>

              <div className="space-y-4">
                {Object.entries(byProduct)
                  .sort((a, b) => b[1] - a[1])
                  .map(([product, earning]) => (
                    <div key={product} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{product}</span>
                        <span className="text-sm font-semibold text-gray-900">{formatINR(earning)}</span>
                      </div>
                      <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-1000 group-hover:from-orange-400 group-hover:to-orange-300"
                          style={{ width: `${(earning / maxProductEarning) * 100}%` }}
                        />
                        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-50">
                      {['Serial', 'Client', 'Date', 'Month', 'Product', 'Project', 'Earning', 'Project Status', 'Payment Band'].map((header) => (
                        <th
                          key={header}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((r, i) => (
                      <tr
                        key={i}
                        className="group hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all duration-200"
                      >
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-mono font-bold text-gray-600 border border-gray-100">
                            {r.serial || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{r.clientName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {new Date(r.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">{r.month}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100">
                            {r.product}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900 font-medium">{r.businessName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{formatINR(r.earning)}</span>
                        </td>
                        <td className="px-6 py-4">
                          {String(r.status || 'ongoing').toLowerCase() === 'completed' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Ongoing
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {r.highPay ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-orange-100 text-xs font-semibold text-orange-700 border border-orange-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              High Paying
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-xs font-medium text-gray-500 border border-gray-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
