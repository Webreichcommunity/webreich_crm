import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import jsPDF from 'jspdf';
import { database } from '../db/firebase';
import { DEFAULT_MEETING_TYPES, DEFAULT_PAYMENT_MODES, formatINR } from './projectUtils';

export default function ProjectDetails(){
  const { id } = useParams();
  const [project,setProject]=useState(null); const [amount,setAmount]=useState(''); const [mode,setMode]=useState('Cash'); const [cheque,setCheque]=useState(''); const [meeting,setMeeting]=useState({date:new Date().toISOString().slice(0,16),type:'Call',notes:''});
  useEffect(()=>{(async()=>{const s=await get(ref(database,`projects/${id}`)); setProject(s.val());})();},[id]);
  const received = useMemo(()=> (project?.payments||[]).reduce((a,p)=>a+Number(p.amount||0),0),[project]);
  if(!project) return <div className='p-6'>Loading...</div>;
  const addPayment = async()=>{ const payment={amount:Number(amount||0),mode,cheque,date:new Date().toISOString()}; const next=[...(project.payments||[]),payment]; await update(ref(database,`projects/${id}`),{payments:next}); setProject({...project,payments:next}); setAmount(''); setCheque(''); };
  const addMeeting = async()=>{const next=[...(project.meetings||[]),meeting]; await update(ref(database,`projects/${id}`),{meetings:next}); setProject({...project,meetings:next});};
  const downloadInvoice=()=>{const doc=new jsPDF(); doc.text('WebReich Invoice',20,20); doc.text(`Serial: ${project.serial}`,20,32); doc.text(`Client: ${project.clientName}`,20,42); doc.text(`Product: ${project.product}`,20,52); doc.text(`Budget: ${formatINR(project.budget)}`,20,62); doc.text(`Received: ${formatINR(received)}`,20,72); doc.save(`${project.serial}.pdf`);};
  return <div className='p-4 md:p-6 min-h-screen bg-gradient-to-br from-orange-50 to-white'>
    <h1 className='text-2xl font-bold text-orange-700'>{project.serial} - {project.projectName}</h1>
    <p>{project.clientName} • {project.phone}</p>
    <div className='grid md:grid-cols-2 gap-4 mt-4'>
      <section className='bg-white rounded-xl p-4 border'><h3 className='font-semibold'>Payment Management</h3>
        <div className='flex flex-wrap gap-2 my-2'><input type='number' placeholder='amount' value={amount} onChange={e=>setAmount(e.target.value)} className='border p-2 rounded'/><select value={mode} onChange={e=>setMode(e.target.value)} className='border p-2 rounded'>{DEFAULT_PAYMENT_MODES.map(m=><option key={m}>{m}</option>)}</select>{mode==='Cheque' && <input placeholder='Cheque no' value={cheque} onChange={e=>setCheque(e.target.value)} className='border p-2 rounded'/>}<button onClick={addPayment} className='bg-orange-500 text-white px-3 rounded'>Add</button></div>
        {(project.payments||[]).map((p,i)=><div key={i} className='text-sm border-t py-1'>{new Date(p.date).toLocaleString()} - {formatINR(p.amount)} ({p.mode})</div>)}
      </section>
      <section className='bg-white rounded-xl p-4 border'><h3 className='font-semibold'>Meeting Tracker</h3>
        <div className='flex flex-wrap gap-2 my-2'><input type='datetime-local' value={meeting.date} onChange={e=>setMeeting({...meeting,date:e.target.value})} className='border p-2 rounded'/><select value={meeting.type} onChange={e=>setMeeting({...meeting,type:e.target.value})} className='border p-2 rounded'>{DEFAULT_MEETING_TYPES.map(m=><option key={m}>{m}</option>)}</select><input placeholder='notes' value={meeting.notes} onChange={e=>setMeeting({...meeting,notes:e.target.value})} className='border p-2 rounded'/><button onClick={addMeeting} className='bg-violet-500 text-white px-3 rounded'>Add</button></div>
        {(project.meetings||[]).map((m,i)=><div key={i} className='text-sm border-t py-1'>{m.date} - {m.type} ({m.notes})</div>)}
      </section>
    </div>
    <div className='mt-4 bg-white rounded-xl border p-4'><p>Budget: {formatINR(project.budget)} | Received: {formatINR(received)} | Pending: {formatINR(Number(project.budget||0)-received)}</p><button onClick={downloadInvoice} className='mt-2 px-3 py-2 rounded bg-pink-500 text-white'>Download Invoice PDF</button></div>
  </div>;
}
