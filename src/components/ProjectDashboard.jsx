import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { onValue, ref } from 'firebase/database';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';
import ProjectForm from './ProjectForm';

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => onValue(ref(database, 'projects'), (s) => {
    const val = s.val() || {};
    setProjects(Object.entries(val).map(([id, p]) => ({ id, ...p })));
  }), []);

  const summary = useMemo(() => {
    const totalBudget = projects.reduce((a, p) => a + Number(p.budget || 0), 0);
    const totalPaid = projects.reduce((a, p) => a + (p.payments || []).reduce((x, y) => x + Number(y.amount || 0), 0), 0);
    const byProduct = projects.reduce((acc,p)=>({...acc,[p.product]:(acc[p.product]||0)+1}),{});
    return { totalBudget, totalPaid, byProduct };
  }, [projects]);

  const exportSheet = (rows, fileName) => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    const blob = new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]);
    saveAs(blob, fileName);
  };

  const cards = [
    { title:'Total Projects', value:projects.length, rows:projects },
    { title:'Total Budget', value:formatINR(summary.totalBudget), rows:projects.map(p=>({project:p.projectName,budget:p.budget})) },
    { title:'Total Received', value:formatINR(summary.totalPaid), rows:projects.map(p=>({project:p.projectName,received:(p.payments||[]).reduce((a,x)=>a+Number(x.amount||0),0)})) },
  ];

  return <div className='p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-900 text-white'>
    <div className='flex justify-between items-center mb-5'>
      <h1 className='text-3xl font-bold'>Dashboard</h1>
      <button className='px-4 py-2 rounded-xl bg-orange-500 text-white' onClick={()=>setShowCreate(true)}>+ Add New Project</button>
    </div>
    <div className='grid md:grid-cols-3 gap-4 mb-6'>
      {cards.map((c)=><button key={c.title} onClick={()=>setDetail(c)} className='text-left bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow hover:scale-[1.02] transition'><p className='text-orange-200 text-sm'>{c.title}</p><p className='text-2xl font-bold text-white'>{c.value}</p></button>)}
    </div>
    <div className='bg-white/10 backdrop-blur-md border rounded-2xl p-4 mt-4'>
      <h2 className='font-semibold mb-2'>Product wise projects</h2>
      <div className='grid md:grid-cols-4 gap-2'>{Object.entries(summary.byProduct).map(([k,v])=><div key={k} className='p-3 rounded-xl bg-white/10'>{k}: <b>{v}</b></div>)}</div>
    </div>
    <div className='bg-white/10 backdrop-blur-md border rounded-2xl p-4 mt-4'>
      <h2 className='font-semibold mb-2'>Projects</h2>
      <table className='w-full text-sm'><thead><tr><th>Serial</th><th>Project</th><th>Client</th><th>Product</th><th></th></tr></thead><tbody>{projects.map(p=><tr key={p.id} className='border-t border-white/10'><td>{p.serial}</td><td>{p.projectName}</td><td>{p.clientName}</td><td>{p.product}</td><td><Link className='text-orange-300' to={`/projects/${p.id}`}>Open</Link></td></tr>)}</tbody></table>
    </div>

    {showCreate && <Modal title='Create New Project' onClose={()=>setShowCreate(false)}><ProjectForm modalMode onCreated={()=>setShowCreate(false)} onCancel={()=>setShowCreate(false)} /></Modal>}
    {detail && <Modal title={detail.title} onClose={()=>setDetail(null)}><button onClick={()=>exportSheet(detail.rows,`${detail.title}.xlsx`)} className='mb-3 px-3 py-2 bg-emerald-500 rounded'>Export Excel</button><pre className='text-xs max-h-96 overflow-auto'>{JSON.stringify(detail.rows, null, 2)}</pre></Modal>}
  </div>;
}

const Modal = ({ title, children, onClose }) => <div className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'><div className='w-full max-w-5xl max-h-[92vh] overflow-auto bg-white/90 text-slate-900 rounded-3xl p-4 border border-white'><div className='flex justify-between items-center'><h3 className='text-xl font-semibold'>{title}</h3><button onClick={onClose}>✕</button></div>{children}</div></div>;
