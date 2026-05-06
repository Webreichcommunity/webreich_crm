import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';
import * as XLSX from 'xlsx';

export default function FinancePage(){
  const [projects,setProjects]=useState([]); const [manual,setManual]=useState([]);
  const [month,setMonth]=useState('all'); const [product,setProduct]=useState('all');
  const [entry,setEntry]=useState({projectName:'',businessName:'',clientName:'',product:'',date:new Date().toISOString().slice(0,10),mode:'Cash',earning:''});
  useEffect(()=>onValue(ref(database,'projects'),s=>setProjects(Object.values(s.val()||{}))),[]);
  useEffect(()=>onValue(ref(database,'manualFinance'),s=>setManual(Object.values(s.val()||{}))),[]);
  const rows = useMemo(()=>[
    ...projects.flatMap(p=>(p.payments||[]).map(pay=>({projectName:p.projectName,businessName:p.projectName,clientName:p.clientName,product:p.product,date:pay.date,mode:pay.mode||'NA',amount:Number(pay.amount||0),source:'project'}))),
    ...manual.map(m=>({projectName:m.projectName,businessName:m.businessName,clientName:m.clientName,product:m.product,date:m.date,mode:m.mode,amount:Number(m.earning||0),source:'manual'}))
  ],[projects,manual]);
  const filtered = rows.filter(r=>(month==='all'||getMonthKey(r.date)===month) && (product==='all'||r.product===product));
  const total = filtered.reduce((a,r)=>a+r.amount,0);
  const monthly = filtered.reduce((a,r)=>({...a,[getMonthKey(r.date)]:(a[getMonthKey(r.date)]||0)+r.amount}),{});
  const addManual=async(e)=>{e.preventDefault(); await push(ref(database,'manualFinance'),entry); setEntry({...entry,earning:''});};
  const exportExcel=()=>{const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(filtered),'Finance');XLSX.writeFile(wb,'finance.xlsx');};

  return <div className='p-4 min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white'>
  <h1 className='text-2xl font-bold mb-3'>Finance Insights</h1>
  <div className='grid md:grid-cols-4 gap-2 mb-3'>{[['month',month,setMonth,Array.from(new Set(rows.map(r=>getMonthKey(r.date))))],['product',product,setProduct,Array.from(new Set(rows.map(r=>r.product)))]].map(([k,v,set,arr])=><select key={k} className='border p-2 rounded bg-white/10' value={v} onChange={e=>set(e.target.value)}><option value='all'>All {k}s</option>{arr.filter(Boolean).map(m=><option key={m}>{m}</option>)}</select>)}<div className='bg-white/10 rounded p-2'>Total: {formatINR(total)}</div><button onClick={exportExcel} className='bg-emerald-500 rounded px-3'>Export Excel</button></div>
  <div className='grid lg:grid-cols-2 gap-4'>
    <div className='bg-white/10 rounded-2xl p-3 border border-white/20'><h3 className='font-semibold mb-2'>Manual Entry</h3><form onSubmit={addManual} className='grid grid-cols-2 gap-2'>{['projectName','businessName','clientName','product','mode','earning'].map(f=><input key={f} required placeholder={f} className='p-2 rounded bg-black/20 border' value={entry[f]} onChange={e=>setEntry({...entry,[f]:e.target.value})}/>) }<input type='date' value={entry.date} onChange={e=>setEntry({...entry,date:e.target.value})} className='p-2 rounded bg-black/20 border'/><button className='bg-orange-500 rounded'>Add Entry</button></form></div>
    <div className='bg-white/10 rounded-2xl p-3 border border-white/20'><h3 className='font-semibold mb-2'>Monthly Earning Table</h3>{Object.entries(monthly).sort().reverse().map(([m,v])=><div key={m} className='flex justify-between border-b py-1'>{m}<span>{formatINR(v)}</span></div>)}</div>
  </div>
  <table className='w-full mt-4 bg-white/10 rounded-xl border text-sm'><thead><tr><th>Project</th><th>Business</th><th>Client</th><th>Product</th><th>Date</th><th>Mode</th><th>Earning</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={i} className='border-t border-white/10'><td>{r.projectName}</td><td>{r.businessName}</td><td>{r.clientName}</td><td>{r.product}</td><td>{new Date(r.date).toLocaleDateString('en-IN')}</td><td>{r.mode}</td><td>{formatINR(r.amount)}</td></tr>)}</tbody></table></div>
}
