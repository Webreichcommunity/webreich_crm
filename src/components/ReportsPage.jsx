import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';

export default function ReportsPage(){
  const [projects,setProjects]=useState([]); const [month,setMonth]=useState('all');
  useEffect(()=>onValue(ref(database,'projects'),s=>setProjects(Object.values(s.val()||{}))),[]);
  const rows = useMemo(()=>projects.map(p=>{const paid=(p.payments||[]).reduce((a,x)=>a+Number(x.amount||0),0); return {clientName:p.clientName,date:p.createdAt,month:getMonthKey(p.createdAt),product:p.product,businessName:p.projectName,earning:paid,note:p.note};}),[projects]);
  const filtered = month==='all'?rows:rows.filter(r=>r.month===month);
  return <div className='p-4 min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100'><h1 className='text-2xl font-bold text-orange-700 mb-3'>Reports</h1>
  <select className='border p-2 rounded mb-3' value={month} onChange={e=>setMonth(e.target.value)}><option value='all'>All months</option>{Array.from(new Set(rows.map(r=>r.month))).map(m=><option key={m}>{m}</option>)}</select>
  <table className='w-full bg-white rounded-xl border text-sm'><thead><tr><th>Client Name</th><th>Date</th><th>Months</th><th>Products</th><th>Business Name</th><th>Earning</th><th>Note</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={i} className='border-t'><td>{r.clientName}</td><td>{new Date(r.date).toLocaleDateString('en-IN')}</td><td>{r.month}</td><td>{r.product}</td><td>{r.businessName}</td><td>{formatINR(r.earning)}</td><td>{r.note}</td></tr>)}</tbody></table></div>
}
