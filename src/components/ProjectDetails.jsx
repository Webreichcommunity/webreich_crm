import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { database } from '../db/firebase';
import { DEFAULT_MEETING_TYPES, DEFAULT_PAYMENT_MODES, formatINR } from './projectUtils';

export default function ProjectDetails(){
  const { id } = useParams();
  const [project,setProject]=useState(null); const [amount,setAmount]=useState(''); const [mode,setMode]=useState('Cash'); const [cheque,setCheque]=useState(''); const [meeting,setMeeting]=useState({date:new Date().toISOString().slice(0,16),type:'Call',notes:''});
  useEffect(()=>{(async()=>{const s=await get(ref(database,`projects/${id}`)); setProject(s.val());})();},[id]);
  const received = useMemo(()=> (project?.payments||[]).reduce((a,p)=>a+Number(p.amount||0),0),[project]);
  if(!project) return <div className='p-6'>Loading...</div>;
  const pending = Number(project.budget||0)-received;
  const addPayment = async()=>{ const payment={amount:Number(amount||0),mode,cheque,date:new Date().toISOString()}; const next=[...(project.payments||[]),payment]; await update(ref(database,`projects/${id}`),{payments:next}); setProject({...project,payments:next}); const msg=`Hi ${project.clientName}, we received ${formatINR(payment.amount)} for ${project.projectName}. Remaining amount: ${formatINR(pending-payment.amount)}.`; window.open(`https://wa.me/${project.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`,'_blank'); setAmount(''); setCheque(''); };
  const addMeeting = async()=>{const next=[...(project.meetings||[]),meeting]; await update(ref(database,`projects/${id}`),{meetings:next}); setProject({...project,meetings:next}); const msg=`Meeting scheduled for ${project.projectName} on ${meeting.date}. Type: ${meeting.type}.`; window.open(`https://wa.me/${project.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`,'_blank');};
  return <div className='p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-orange-900 text-white'>
    <h1 className='text-2xl font-bold'>{project.serial} - {project.projectName}</h1>
    <p>{project.clientName} • {project.phone}</p>
    <div className='grid md:grid-cols-2 gap-4 mt-4'>
      <section className='bg-white/10 rounded-xl p-4 border'><h3 className='font-semibold'>Payment Management</h3>
        <div className='flex flex-wrap gap-2 my-2'><input type='number' placeholder='amount' value={amount} onChange={e=>setAmount(e.target.value)} className='border p-2 rounded text-black'/><select value={mode} onChange={e=>setMode(e.target.value)} className='border p-2 rounded text-black'>{DEFAULT_PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}</select>{mode==='Cheque' && <input placeholder='Cheque no' value={cheque} onChange={e=>setCheque(e.target.value)} className='border p-2 rounded text-black'/>}<button onClick={addPayment} className='bg-orange-500 text-white px-3 rounded'>Add + WhatsApp</button></div>
        {(project.payments||[]).map((p,i)=><div key={i} className='text-sm border-t py-1'>{new Date(p.date).toLocaleString()} - {formatINR(p.amount)} ({p.mode})</div>)}
      </section>
      <section className='bg-white/10 rounded-xl p-4 border'><h3 className='font-semibold'>Meeting Tracker</h3>
        <div className='flex flex-wrap gap-2 my-2'><input type='datetime-local' value={meeting.date} onChange={e=>setMeeting({...meeting,date:e.target.value})} className='border p-2 rounded text-black'/><select value={meeting.type} onChange={e=>setMeeting({...meeting,type:e.target.value})} className='border p-2 rounded text-black'>{DEFAULT_MEETING_TYPES.map(m=><option key={m}>{m}</option>)}</select><input placeholder='notes' value={meeting.notes} onChange={e=>setMeeting({...meeting,notes:e.target.value})} className='border p-2 rounded text-black'/><button onClick={addMeeting} className='bg-violet-500 text-white px-3 rounded'>Schedule + WhatsApp</button></div>
        {(project.meetings||[]).map((m,i)=><div key={i} className='text-sm border-t py-1'>{m.date} - {m.type} ({m.notes})</div>)}
      </section>
    </div>
    <div className='mt-4 bg-white/10 rounded-xl border p-4'><p>Budget: {formatINR(project.budget)} | Received: {formatINR(received)} | Remaining: {formatINR(pending)}</p></div>
  </div>;
}
