import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref, runTransaction } from 'firebase/database';
import { database } from '../db/firebase';
import { buildSerial, DEFAULT_PRODUCTS, DEFAULT_PROJECT_TYPES, formatINR, getMonthKey } from './projectUtils';
import * as XLSX from 'xlsx';

const initialForm = { serial:'', createdAt:'', projectType:'', projectName:'', clientName:'', phone:'', address:'', budget:'', note:'', link:'', product:'', amc:'no', amcAmount:'', amcYears:'1' };

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [activeCard, setActiveCard] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [options, setOptions] = useState({ projectTypes: DEFAULT_PROJECT_TYPES, products: DEFAULT_PRODUCTS });
  const [form, setForm] = useState(initialForm);

  useEffect(() => onValue(ref(database, 'projects'), (s) => {
    const val = s.val() || {};
    setProjects(Object.entries(val).map(([id, p]) => ({ id, ...p })));
  }), []);

  useEffect(()=> onValue(ref(database,'options'), s=>setOptions({ ...{projectTypes:DEFAULT_PROJECT_TYPES,products:DEFAULT_PRODUCTS}, ...(s.val()||{}) })),[]);

  useEffect(() => {
    const now = new Date().toISOString().slice(0,16);
    setForm((p) => ({ ...p, createdAt: now, serial: `WR-${new Date().getFullYear()}-0069` }));
  }, [showNewModal]);

  const summary = useMemo(() => {
    const totalBudget = projects.reduce((a, p) => a + Number(p.budget || 0), 0);
    const totalPaid = projects.reduce((a, p) => a + (p.payments || []).reduce((x, y) => x + Number(y.amount || 0), 0), 0);
    const byProduct = projects.reduce((acc, p) => ({...acc, [p.product]: (acc[p.product]||0)+1}), {});
    return { totalBudget, totalPaid, byProduct };
  }, [projects]);

  const exportRows = (rows, fileName) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const createProject = async (e) => {
    e.preventDefault();
    const isGold = form.product.toLowerCase().includes('gold rate board');
    const key = isGold ? 'gold' : 'normal';
    const tx = await runTransaction(ref(database,`counters/${key}`), (v)=> (v || (key==='normal'?68:0))+1);
    const serial = form.serial || buildSerial({ product:form.product, date:form.createdAt, normalCounter:key==='normal'?tx.snapshot.val():0, goldCounter:key==='gold'?tx.snapshot.val():0 });
    await push(ref(database,'projects'), { ...form, serial, createdAt:new Date(form.createdAt).toISOString(), payments:[], meetings:[] });
    setShowNewModal(false);
  };

  const cardData = [
    { key:'projects', title:'Total Projects', value:projects.length },
    { key:'budget', title:'Total Budget', value:formatINR(summary.totalBudget) },
    { key:'earning', title:'Total Received', value:formatINR(summary.totalPaid) },
    { key:'product', title:'Product Wise Projects', value:Object.keys(summary.byProduct).length }
  ];

  return <div className='p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950 text-white'>
    <div className='flex justify-between items-center mb-5'>
      <div><h1 className='text-3xl font-black'>Professional Dashboard</h1><p className='text-orange-200'>WebReich Growth Center</p></div>
      <button className='px-4 py-2 rounded-xl bg-orange-500 hover:scale-105 transition' onClick={()=>setShowNewModal(true)}>+ Add New Project</button>
    </div>
    <div className='grid md:grid-cols-4 gap-4 mb-6'>
      {cardData.map(c => <button key={c.key} onClick={()=>setActiveCard(c.key)} className='text-left bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-lg hover:-translate-y-1 transition'>
        <p className='text-orange-100 text-sm'>{c.title}</p><p className='text-2xl font-bold'>{c.value}</p></button>)}
    </div>

    <div className='bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 mt-4'>
      <h2 className='font-semibold mb-2'>Projects</h2>
      <div className='overflow-auto'><table className='w-full text-sm'><thead><tr><th>Serial</th><th>Project</th><th>Client</th><th>Product</th><th>Date</th><th></th></tr></thead><tbody>{projects.map(p=><tr key={p.id} className='border-t border-white/10'><td>{p.serial}</td><td>{p.projectName}</td><td>{p.clientName}</td><td>{p.product}</td><td>{new Date(p.createdAt).toLocaleDateString()}</td><td><a className='text-orange-300' href={`/projects/${p.id}`}>Open</a></td></tr>)}</tbody></table></div>
    </div>

    {activeCard && <Modal title='Summary Details' close={()=>setActiveCard('')}>
      <button className='mb-3 px-3 py-1 rounded bg-emerald-500' onClick={()=>exportRows(projects,`dashboard-${activeCard}`)}>Export Excel</button>
      {activeCard==='product' ? Object.entries(summary.byProduct).map(([k,v])=><div key={k} className='py-1 border-b'>{k}: {v}</div>) : projects.map(p=><div key={p.id} className='py-1 border-b'>{p.serial} - {p.projectName} - {formatINR(p.budget||0)} - {formatINR((p.payments||[]).reduce((a,b)=>a+Number(b.amount||0),0))}</div>)}
    </Modal>}

    {showNewModal && <Modal title='Add New Project' close={()=>setShowNewModal(false)} full>
      <form onSubmit={createProject} className='grid md:grid-cols-2 gap-3'>
        {['serial','projectName','clientName','phone','address','budget','link'].map(k => <input key={k} required={k!=='link'} placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className='p-2 rounded border bg-white/10'/>) }
        <input type='datetime-local' value={form.createdAt} onChange={e=>setForm({...form,createdAt:e.target.value})} className='p-2 rounded border bg-white/10'/>
        <select required value={form.projectType} onChange={e=>setForm({...form,projectType:e.target.value})} className='p-2 rounded border bg-slate-800'><option value=''>Project type</option>{options.projectTypes.map(v=><option key={v}>{v}</option>)}</select>
        <select required value={form.product} onChange={e=>setForm({...form,product:e.target.value})} className='p-2 rounded border bg-slate-800'><option value=''>Product</option>{options.products.map(v=><option key={v}>{v}</option>)}</select>
        <textarea placeholder='note' value={form.note} onChange={e=>setForm({...form,note:e.target.value})} className='md:col-span-2 w-full p-2 rounded border bg-white/10'/>
        <button className='px-4 py-2 bg-orange-500 text-white rounded-xl md:col-span-2'>Create Project ({formatINR(form.budget)})</button>
      </form>
    </Modal>}
  </div>;
}

const Modal = ({ title, children, close, full=false }) => <div className='fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3'>
  <div className={`${full?'w-full max-w-5xl':'w-full max-w-3xl'} max-h-[92vh] overflow-auto bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-5`}><div className='flex justify-between items-center mb-3'><h3 className='font-bold text-xl'>{title}</h3><button onClick={close}>✕</button></div>{children}</div>
</div>;
