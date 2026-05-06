import React, { useEffect, useState } from 'react';
import { push, ref, onValue, runTransaction } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase';
import { buildSerial, DEFAULT_PRODUCTS, DEFAULT_PROJECT_TYPES, formatINR } from './projectUtils';

export default function ProjectForm() {
  const navigate = useNavigate();
  const [options, setOptions] = useState({ projectTypes: DEFAULT_PROJECT_TYPES, products: DEFAULT_PRODUCTS });
  const [newProjectType, setNewProjectType] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [data, setData] = useState({ projectType:'', projectName:'', clientName:'', phone:'', address:'', budget:'', note:'', link:'', product:'', amc:'no', amcAmount:'', amcYears:'1' });
  useEffect(()=> onValue(ref(database,'options'), s=>setOptions({ ...{projectTypes:DEFAULT_PROJECT_TYPES,products:DEFAULT_PRODUCTS}, ...(s.val()||{}) })),[]);
  const saveOption = async (k,v)=>{ if(!v.trim()) return; await runTransaction(ref(database,`options/${k}`),(arr)=> Array.from(new Set([...(arr||[]),v.trim()])));};
  const submit = async (e)=>{e.preventDefault();
    const createdAt = new Date().toISOString();
    const cRef = ref(database,'counters');
    const isGold = data.product.toLowerCase().includes('gold rate board');
    const key = isGold ? 'gold' : 'normal';
    const tx = await runTransaction(ref(database,`counters/${key}`), (v)=> (v||0)+1);
    const serial = buildSerial({ product:data.product, date:createdAt, normalCounter:key==='normal'?tx.snapshot.val():0, goldCounter:key==='gold'?tx.snapshot.val():0 });
    await push(ref(database,'projects'), { ...data, serial, createdAt, payments:[], meetings:[] });
    navigate('/');
  };
  return <form onSubmit={submit} className='p-4 md:p-6 space-y-4 min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100'>
    <h1 className='text-2xl font-bold text-orange-700'>Create Project</h1>
    <div className='grid md:grid-cols-2 gap-3'>
      {['projectName','clientName','phone','address','budget','link'].map(k => <input key={k} required={k!=='link'} placeholder={k} value={data[k]} onChange={e=>setData({...data,[k]:e.target.value})} className='p-2 rounded border'/>) }
      <select required value={data.projectType} onChange={e=>setData({...data,projectType:e.target.value})} className='p-2 rounded border'><option value=''>Project type</option>{options.projectTypes.map(v=><option key={v}>{v}</option>)}</select>
      <select required value={data.product} onChange={e=>setData({...data,product:e.target.value})} className='p-2 rounded border'><option value=''>Product</option>{options.products.map(v=><option key={v}>{v}</option>)}</select>
    </div>
    <textarea placeholder='note' value={data.note} onChange={e=>setData({...data,note:e.target.value})} className='w-full p-2 rounded border'/>
    <div className='flex gap-2'><input value={newProjectType} onChange={e=>setNewProjectType(e.target.value)} placeholder='Add project type' className='p-2 border rounded'/><button type='button' onClick={()=>saveOption('projectTypes',newProjectType)} className='px-3 rounded bg-violet-500 text-white'>Save type</button></div>
    <div className='flex gap-2'><input value={newProduct} onChange={e=>setNewProduct(e.target.value)} placeholder='Add product option' className='p-2 border rounded'/><button type='button' onClick={()=>saveOption('products',newProduct)} className='px-3 rounded bg-pink-500 text-white'>Save product</button></div>
    <button className='px-4 py-2 bg-orange-500 text-white rounded-xl'>Create Project ({formatINR(data.budget)})</button>
  </form>;
}
