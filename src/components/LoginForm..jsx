import React, { useState } from 'react';

function LoginForm({ onLogin, pin, setPin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full text-white">
        <img src="/logo.png" alt="Webreich" className="h-14 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-center mb-6">Webreich CRM Lock</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Username" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30" required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30" required />
          <input type="password" placeholder="4-digit app PIN" value={pin} onChange={(e) => setPin(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30" maxLength={4} required />
          <button type="submit" className="w-full bg-orange-500 py-3 rounded-xl font-semibold">Unlock CRM</button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
