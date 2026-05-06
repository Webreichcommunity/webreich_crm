import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';

export default function ReportsPage(){
  const [projects,setProjects]=useState([]); const [month,setMonth]=useState('all');
  useEffect(()=>onValue(ref(database,'projects'),s=>setProjects(Object.values(s.val()||{}))),[]);
  const rows = useMemo(()=>projects.map(p=>{const paid=(p.payments||[]).reduce((a,x)=>a+Number(x.amount||0),0); return {clientName:p.clientName,date:p.createdAt,month:getMonthKey(p.createdAt),product:p.product,businessName:p.projectName,earning:paid,budget:Number(p.budget||0),highPay:paid>100000};}),[projects]);
  const filtered = month==='all'?rows:rows.filter(r=>r.month===month);
  const byProduct = filtered.reduce((a,r)=>({...a,[r.product]:(a[r.product]||0)+r.earning}),{});
  const top = [...filtered].sort((a,b)=>b.earning-a.earning)[0];
  return <div className='p-4 min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 text-white'><h1 className='text-2xl font-bold mb-3'>Reports & Analysis</h1>
  <select className='border p-2 rounded mb-3 bg-white/10' value={month} onChange={e=>setMonth(e.target.value)}><option value='all'>All months</option>{Array.from(new Set(rows.map(r=>r.month))).map(m=><option key={m}>{m}</option>)}</select>
  <div className='grid md:grid-cols-3 gap-3 mb-3'><div className='bg-white/10 rounded-xl p-3'>Top Product: {Object.entries(byProduct).sort((a,b)=>b[1]-a[1])[0]?.[0]||'N/A'}</div><div className='bg-white/10 rounded-xl p-3'>Top Project: {top?.businessName||'N/A'}</div><div className='bg-white/10 rounded-xl p-3'>Highest Earning: {formatINR(top?.earning||0)}</div></div>
  <div className='bg-white/10 rounded-xl p-3 mb-4'>
    <h3 className='font-semibold'>Product Performance</h3>
    {Object.entries(byProduct).map(([k,v])=><div key={k} className='py-1'>{k}<div className='h-2 rounded bg-indigo-300/30'><div style={{width:`${Math.min(100,v/10000)}%`}} className='h-2 bg-indigo-400 rounded'/></div><span className='text-xs'>{formatINR(v)}</span></div>)}
  </div>
  <table className='w-full bg-white/10 rounded-xl border text-sm'><thead><tr><th>Client</th><th>Date</th><th>Month</th><th>Product</th><th>Project</th><th>Earning</th><th>Status</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={i} className='border-t border-white/10'><td>{r.clientName}</td><td>{new Date(r.date).toLocaleDateString('en-IN')}</td><td>{r.month}</td><td>{r.product}</td><td>{r.businessName}</td><td>{formatINR(r.earning)}</td><td>{r.highPay?'High Paying':'Normal'}</td></tr>)}</tbody></table></div>
}
