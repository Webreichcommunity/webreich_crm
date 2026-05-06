import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);

  useEffect(() => onValue(ref(database, 'projects'), (s) => {
    const val = s.val() || {};
    setProjects(Object.entries(val).map(([id, p]) => ({ id, ...p })));
  }), []);

  const summary = useMemo(() => {
    const totalBudget = projects.reduce((a, p) => a + Number(p.budget || 0), 0);
    const totalPaid = projects.reduce((a, p) => a + (p.payments || []).reduce((x, y) => x + Number(y.amount || 0), 0), 0);
    const monthly = {};
    projects.forEach((p) => {
      const key = getMonthKey(p.createdAt || new Date().toISOString());
      monthly[key] = monthly[key] || { budget: 0, earned: 0, count: 0 };
      monthly[key].budget += Number(p.budget || 0);
      monthly[key].earned += (p.payments || []).reduce((x, y) => x + Number(y.amount || 0), 0);
      monthly[key].count += 1;
    });
    return { totalBudget, totalPaid, monthly };
  }, [projects]);

  return <div className='p-4 md:p-6 min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100'>
    <div className='flex justify-between items-center mb-5'>
      <h1 className='text-2xl font-bold text-orange-700'>Dashboard</h1>
      <Link className='px-4 py-2 rounded-xl bg-orange-500 text-white' to='/projects/new'>+ Create Project</Link>
    </div>
    <div className='grid md:grid-cols-3 gap-4 mb-6'>
      <Card title='Total Projects' value={projects.length} />
      <Card title='Total Budget' value={formatINR(summary.totalBudget)} />
      <Card title='Total Received' value={formatINR(summary.totalPaid)} />
    </div>
    <div className='bg-white/70 backdrop-blur-md border rounded-2xl p-4'>
      <h2 className='font-semibold mb-2'>Monthly Summary</h2>
      <div className='overflow-auto'>
      <table className='w-full text-sm'>
        <thead><tr className='text-left'><th>Month</th><th>Projects</th><th>Budget</th><th>Received</th></tr></thead>
        <tbody>{Object.entries(summary.monthly).sort().reverse().map(([k,v]) => <tr key={k} className='border-t'><td>{k}</td><td>{v.count}</td><td>{formatINR(v.budget)}</td><td>{formatINR(v.earned)}</td></tr>)}</tbody>
      </table></div>
    </div>

    <div className='bg-white/70 backdrop-blur-md border rounded-2xl p-4 mt-4'>
      <h2 className='font-semibold mb-2'>Projects</h2>
      <table className='w-full text-sm'><thead><tr><th>Serial</th><th>Project</th><th>Client</th><th>Product</th><th></th></tr></thead><tbody>{projects.map(p=><tr key={p.id} className='border-t'><td>{p.serial}</td><td>{p.projectName}</td><td>{p.clientName}</td><td>{p.product}</td><td><Link className='text-orange-600' to={`/projects/${p.id}`}>Open</Link></td></tr>)}</tbody></table>
    </div>

  </div>;
}

const Card = ({ title, value }) => <div className='bg-white/80 border border-orange-100 rounded-2xl p-4 shadow'>
  <p className='text-gray-500 text-sm'>{title}</p><p className='text-xl font-bold text-orange-600'>{value}</p></div>;
