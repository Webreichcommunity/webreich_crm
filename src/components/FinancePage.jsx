import React, { useEffect, useMemo, useState } from 'react';
import { onValue, push, ref } from 'firebase/database';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';

export default function FinancePage(){
  const [projects,setProjects]=useState([]); const [manual,setManual]=useState([]); const [month,setMonth]=useState('all'); const [product,setProduct]=useState('all');
  const [form,setForm]=useState({project:'',businessName:'',client:'',product:'',date:new Date().toISOString().slice(0,10),mode:'UPI',earning:''});
  useEffect(()=>onValue(ref(database,'projects'),s=>setProjects(Object.values(s.val()||{}))),[]);
  useEffect(()=>onValue(ref(database,'manualFinance'),s=>setManual(Object.values(s.val()||{}))),[]);
  const rows = useMemo(()=>[
    ...projects.flatMap(p=>(p.payments||[]).map(pay=>({project:p.projectName,businessName:p.projectName,client:p.clientName,product:p.product,date:pay.date,mode:pay.mode,earning:Number(pay.amount||0)}))),
    ...manual.map(m=>({...m,earning:Number(m.earning||0)}))
  ],[projects,manual]);
  const months = Array.from(new Set(rows.map(r=>getMonthKey(r.date)))); const products=Array.from(new Set(rows.map(r=>r.product)));
  const filtered = rows.filter(r=>(month==='all'||getMonthKey(r.date)===month)&&(product==='all'||r.product===product));
  const total = filtered.reduce((a,r)=>a+r.earning,0);
  const monthly = filtered.reduce((a,r)=>{const m=getMonthKey(r.date); a[m]=(a[m]||0)+r.earning; return a;},{});
  const addManual = async(e)=>{e.preventDefault(); await push(ref(database,'manualFinance'),form); setForm({project:'',businessName:'',client:'',product:'',date:new Date().toISOString().slice(0,10),mode:'UPI',earning:''});};
  const exportData = ()=>{const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(filtered),'Finance'); saveAs(new Blob([XLSX.write(wb,{bookType:'xlsx',type:'array'})]),'finance-report.xlsx');};
  return <div className='p-4 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-900 text-white'><h1 className='text-2xl font-bold mb-3'>Finance Analytics</h1>
  <div className='flex flex-wrap gap-2 mb-3'><select className='text-black border p-2 rounded' value={month} onChange={e=>setMonth(e.target.value)}><option value='all'>All months</option>{months.map(m=><option key={m}>{m}</option>)}</select><select className='text-black border p-2 rounded' value={product} onChange={e=>setProduct(e.target.value)}><option value='all'>All products</option>{products.map(p=><option key={p}>{p}</option>)}</select><button onClick={exportData} className='px-3 rounded bg-emerald-500'>Export Excel</button></div>
  <div className='bg-white/10 rounded-xl border p-3 mb-3'>Total Earning: <b>{formatINR(total)}</b></div>
  <div className='bg-white/10 rounded-xl border p-3 mb-3'><h2>Monthly Growth</h2>{Object.entries(monthly).map(([m,v])=><div key={m} className='my-2'><div className='text-xs'>{m} - {formatINR(v)}</div><div className='h-2 bg-white/20 rounded'><div className='h-2 bg-orange-500 rounded' style={{width:`${Math.min(100,v/1000)}%`}} /></div></div>)}</div>
  <form onSubmit={addManual} className='grid md:grid-cols-4 gap-2 bg-white/10 p-3 rounded-xl border mb-3'>{Object.keys(form).map(k=><input key={k} type={k==='date'?'date':k==='earning'?'number':'text'} placeholder={k} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className='p-2 rounded text-black' required />)}<button className='bg-orange-500 rounded p-2'>Add Manual Entry</button></form>
  <table className='w-full bg-white/10 rounded-xl border text-sm'><thead><tr><th>Project</th><th>Business</th><th>Client</th><th>Product</th><th>Date</th><th>Mode</th><th>Earning</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={i} className='border-t border-white/10'><td>{r.project}</td><td>{r.businessName}</td><td>{r.client}</td><td>{r.product}</td><td>{new Date(r.date).toLocaleDateString('en-IN')}</td><td>{r.mode}</td><td>{formatINR(r.earning)}</td></tr>)}</tbody></table></div>
}
