import React, { useEffect, useState } from 'react';
import { push, ref, onValue, runTransaction } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase';
import { buildSerial, DEFAULT_PRODUCTS, DEFAULT_PROJECT_TYPES, formatINR } from './projectUtils';

export default function ProjectForm({ modalMode = false, onCreated, onCancel }) {
  const navigate = useNavigate();
  const [options, setOptions] = useState({ projectTypes: DEFAULT_PROJECT_TYPES, products: DEFAULT_PRODUCTS });
  const [data, setData] = useState({ projectType:'', projectName:'', clientName:'', phone:'', address:'', budget:'', note:'', link:'', product:'', amc:'no', amcAmount:'', amcYears:'1', createdAt:new Date().toISOString().slice(0,16), serial:'' });
  useEffect(()=> onValue(ref(database,'options'), s=>setOptions({ ...{projectTypes:DEFAULT_PROJECT_TYPES,products:DEFAULT_PRODUCTS}, ...(s.val()||{}) })),[]);

  useEffect(() => {
    const isGold = data.product.toLowerCase().includes('gold rate board');
    runTransaction(ref(database, `counters/${isGold ? 'gold' : 'normal'}`), (v) => v || (isGold ? 0 : 68), { applyLocally: false }).then((tx) => {
      const raw = tx.snapshot.val() || (isGold ? 0 : 68);
      const next = raw + 1;
      const serial = buildSerial({ product:data.product, date:new Date(data.createdAt || new Date()).toISOString(), normalCounter:isGold?0:next, goldCounter:isGold?next:0 });
      setData((prev) => ({ ...prev, serial }));
    });
  }, [data.product, data.createdAt]);

  const submit = async (e)=>{e.preventDefault();
    const createdAt = new Date(data.createdAt).toISOString();
    await push(ref(database,'projects'), { ...data, createdAt, payments:[], meetings:[] });
    if (modalMode) onCreated?.();
    else navigate('/');
  };

  return <form onSubmit={submit} className='p-4 md:p-6 space-y-4 min-h-screen bg-transparent'>
    <h1 className='text-2xl font-bold text-orange-700'>Create Project</h1>
    <div className='grid md:grid-cols-2 gap-3'>
      <input required placeholder='Serial number' value={data.serial} onChange={e=>setData({...data,serial:e.target.value})} className='p-2 rounded border' />
      <input required type='datetime-local' value={data.createdAt} onChange={e=>setData({...data,createdAt:e.target.value})} className='p-2 rounded border'/>
      {['projectName','clientName','phone','address','budget','link'].map(k => <input key={k} required={k!=='link'} placeholder={k} value={data[k]} onChange={e=>setData({...data,[k]:e.target.value})} className='p-2 rounded border'/>) }
      <select required value={data.projectType} onChange={e=>setData({...data,projectType:e.target.value})} className='p-2 rounded border'><option value=''>Project type</option>{options.projectTypes.map(v=><option key={v}>{v}</option>)}</select>
      <select required value={data.product} onChange={e=>setData({...data,product:e.target.value})} className='p-2 rounded border'><option value=''>Product</option>{options.products.map(v=><option key={v}>{v}</option>)}</select>
    </div>
    <textarea placeholder='note' value={data.note} onChange={e=>setData({...data,note:e.target.value})} className='w-full p-2 rounded border'/>
    <div className='flex gap-3'>
      <button className='px-4 py-2 bg-orange-500 text-white rounded-xl'>Create Project ({formatINR(data.budget)})</button>
      {modalMode && <button type='button' onClick={onCancel} className='px-4 py-2 bg-slate-200 rounded-xl'>Cancel</button>}
    </div>
  </form>;
}
