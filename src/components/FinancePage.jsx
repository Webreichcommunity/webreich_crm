import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';

export default function FinancePage(){
  const [projects,setProjects]=useState([]); const [month,setMonth]=useState('all');
  useEffect(()=>onValue(ref(database,'projects'),s=>setProjects(Object.values(s.val()||{}))),[]);
  const rows = useMemo(()=>projects.flatMap(p=>(p.payments||[]).map(pay=>({projectName:p.projectName,clientName:p.clientName,product:p.product,date:pay.date,amount:Number(pay.amount||0)}))),[projects]);
  const filtered = month==='all'?rows:rows.filter(r=>getMonthKey(r.date)===month);
  const total = filtered.reduce((a,r)=>a+r.amount,0);
  const months = Array.from(new Set(rows.map(r=>getMonthKey(r.date))));
  return <div className='p-4 min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100'><h1 className='text-2xl font-bold text-orange-700 mb-3'>Finance</h1>
  <select className='border p-2 rounded mb-3' value={month} onChange={e=>setMonth(e.target.value)}><option value='all'>All months</option>{months.map(m=><option key={m}>{m}</option>)}</select>
  <div className='bg-white rounded-xl border p-3 mb-3'>Total Earning: <b>{formatINR(total)}</b></div>
  <table className='w-full bg-white rounded-xl border text-sm'><thead><tr><th>Project</th><th>Client</th><th>Product</th><th>Date</th><th>Earning</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={i} className='border-t'><td>{r.projectName}</td><td>{r.clientName}</td><td>{r.product}</td><td>{new Date(r.date).toLocaleDateString('en-IN')}</td><td>{formatINR(r.amount)}</td></tr>)}</tbody></table></div>
}
