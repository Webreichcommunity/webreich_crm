import React, { useState } from 'react';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, pin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-orange-950 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 max-w-md w-full text-white">
        <div className="text-center mb-6">
          <img src='/logo.png' alt='logo' className='h-14 w-14 mx-auto rounded-full mb-2'/>
          <h1 className="text-3xl font-bold text-orange-300">WebReich CRM</h1>
          <p className='text-sm text-orange-100'>App Lock Enabled</p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Username (webreich)' className="w-full px-4 py-2 border border-white/30 bg-black/20 rounded-md" required />
          <input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value)} placeholder='4-digit PIN' className="w-full px-4 py-2 border border-white/30 bg-black/20 rounded-md" required />
          <button type="submit" className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition-colors">Unlock App</button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
