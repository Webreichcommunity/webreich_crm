import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../db/firebase';
import { formatINR, getMonthKey } from './projectUtils';

export default function ReportsPage(){
  const [projects,setProjects]=useState([]);
  useEffect(()=>onValue(ref(database,'projects'),s=>setProjects(Object.values(s.val()||{}))),[]);
  const rows = useMemo(()=>projects.map(p=>{const paid=(p.payments||[]).reduce((a,x)=>a+Number(x.amount||0),0); return {clientName:p.clientName,date:p.createdAt,month:getMonthKey(p.createdAt),product:p.product,businessName:p.projectName,earning:paid,budget:Number(p.budget||0)};}),[projects]);
  const byMonth=rows.reduce((a,r)=>{a[r.month]=(a[r.month]||0)+r.earning; return a;},{});
  const byProduct=rows.reduce((a,r)=>{a[r.product]=(a[r.product]||0)+r.earning; return a;},{});
  const topProject=rows.sort((a,b)=>b.earning-a.earning)[0];
  return <div className='p-4 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-900 text-white'><h1 className='text-2xl font-bold mb-3'>Reports & Analysis</h1>
  <div className='grid md:grid-cols-3 gap-3 mb-4'><Card title='Total Earning' value={formatINR(rows.reduce((a,r)=>a+r.earning,0))}/><Card title='Top Product' value={Object.entries(byProduct).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-'}/><Card title='High Paying Project' value={topProject?.businessName || '-'}/></div>
  <div className='grid md:grid-cols-2 gap-4'><section className='bg-white/10 p-4 rounded-xl border'><h3>Month wise growth</h3>{Object.entries(byMonth).map(([m,v])=><div key={m} className='my-2'><div className='text-xs'>{m} {formatINR(v)}</div><div className='h-2 bg-white/20'><div className='h-2 bg-orange-500' style={{width:`${Math.min(100,v/1000)}%`}} /></div></div>)}</section><section className='bg-white/10 p-4 rounded-xl border'><h3>Product performance</h3>{Object.entries(byProduct).map(([m,v])=><div key={m} className='my-2'><div className='text-xs'>{m} {formatINR(v)}</div><div className='h-2 bg-white/20'><div className='h-2 bg-emerald-500' style={{width:`${Math.min(100,v/1000)}%`}} /></div></div>)}</section></div>
  </div>
}
const Card=({title,value})=><div className='p-3 rounded-xl border bg-white/10'><div className='text-xs'>{title}</div><div className='font-bold'>{value}</div></div>;
