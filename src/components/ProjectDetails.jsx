import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get, ref, remove, update } from 'firebase/database';
import { database } from '../db/firebase';
import { DEFAULT_MEETING_TYPES, DEFAULT_PAYMENT_MODES, formatINR } from './projectUtils';

const msg=(p,amt,received)=>`Hello ${p.clientName}, we received ${formatINR(amt)} for ${p.projectName}. Total received: ${formatINR(received)}. Remaining: ${formatINR(Number(p.budget)-received)}.`;

export default function ProjectDetails(){
  const { id } = useParams();
  const [project,setProject]=useState(null); const [amount,setAmount]=useState(''); const [mode,setMode]=useState('Cash'); const [meeting,setMeeting]=useState({date:new Date().toISOString().slice(0,16),type:'Call',notes:''});
  useEffect(()=>{(async()=>{const s=await get(ref(database,`projects/${id}`)); setProject(s.val());})();},[id]);
  const received = useMemo(()=> (project?.payments||[]).reduce((a,p)=>a+Number(p.amount||0),0),[project]);
  if(!project) return <div className='p-6'>Loading...</div>;
  const addPayment = async()=>{ const payment={amount:Number(amount||0),mode,date:new Date().toISOString()}; const next=[...(project.payments||[]),payment]; await update(ref(database,`projects/${id}`),{payments:next}); const rec=next.reduce((a,p)=>a+Number(p.amount||0),0); window.open(`https://wa.me/${project.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(msg(project,amount,rec))}`,'_blank'); setProject({...project,payments:next}); setAmount(''); };
  const addMeeting = async()=>{const next=[...(project.meetings||[]),meeting]; await update(ref(database,`projects/${id}`),{meetings:next}); window.open(`https://wa.me/${project.phone?.replace(/\D/g,'')}?text=${encodeURIComponent(`Meeting scheduled on ${meeting.date} for ${project.projectName}`)}`,'_blank'); setProject({...project,meetings:next});};
  const saveProject = async()=>{await update(ref(database,`projects/${id}`),project);};
  const deleteProject = async()=>{await remove(ref(database,`projects/${id}`)); window.location.href='/';};
  return <div className='p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-950 to-orange-950 text-white'>
    <div className='bg-white/10 rounded-2xl p-4 border border-white/20'>
    <h1 className='text-2xl font-bold'>{project.serial} - {project.projectName}</h1>
    <div className='grid md:grid-cols-3 gap-2 mt-2'>{['projectName','clientName','phone','budget','product','address'].map(k=><input key={k} value={project[k]||''} onChange={e=>setProject({...project,[k]:e.target.value})} className='p-2 rounded bg-black/20 border'/>)}</div>
    <div className='mt-2 flex gap-2'><button onClick={saveProject} className='px-3 py-1 rounded bg-emerald-500'>Save</button><button onClick={deleteProject} className='px-3 py-1 rounded bg-red-500'>Delete</button></div></div>
    <div className='grid md:grid-cols-2 gap-4 mt-4'>
      <section className='bg-white/10 rounded-xl p-4 border'><h3 className='font-semibold'>Payment Management</h3>
        <div className='flex flex-wrap gap-2 my-2'><input type='number' placeholder='amount' value={amount} onChange={e=>setAmount(e.target.value)} className='border p-2 rounded bg-black/20'/><select value={mode} onChange={e=>setMode(e.target.value)} className='border p-2 rounded bg-black/20'>{DEFAULT_PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}</select><button onClick={addPayment} className='bg-orange-500 text-white px-3 rounded'>Add & WhatsApp</button></div>
        {(project.payments||[]).map((p,i)=><div key={i} className='text-sm border-t border-white/10 py-1'>{new Date(p.date).toLocaleString()} - {formatINR(p.amount)} ({p.mode})</div>)}
      </section>
      <section className='bg-white/10 rounded-xl p-4 border'><h3 className='font-semibold'>Meeting Tracker</h3>
        <div className='flex flex-wrap gap-2 my-2'><input type='datetime-local' value={meeting.date} onChange={e=>setMeeting({...meeting,date:e.target.value})} className='border p-2 rounded bg-black/20'/><select value={meeting.type} onChange={e=>setMeeting({...meeting,type:e.target.value})} className='border p-2 rounded bg-black/20'>{DEFAULT_MEETING_TYPES.map(m=><option key={m}>{m}</option>)}</select><input placeholder='notes' value={meeting.notes} onChange={e=>setMeeting({...meeting,notes:e.target.value})} className='border p-2 rounded bg-black/20'/><button onClick={addMeeting} className='bg-violet-500 text-white px-3 rounded'>Schedule & WhatsApp</button></div>
      </section>
    </div>
    <div className='mt-4 bg-white/10 rounded-xl border p-4'>Budget: {formatINR(project.budget)} | Received: {formatINR(received)} | Remaining: {formatINR(Number(project.budget||0)-received)}</div>
  </div>;
}
