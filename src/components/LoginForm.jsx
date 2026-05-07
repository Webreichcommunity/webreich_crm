import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocused, setIsFocused] = useState({ email: false, password: false });
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim() && password.trim()) onLogin(email.trim(), password);
  };

  const isValid = email.trim().length > 0 && password.trim().length > 0;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-gradient-to-br from-orange-100/60 via-orange-50/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[470px] h-[470px] bg-gradient-to-tr from-violet-100/40 via-pink-50/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[760px] bg-gradient-to-br from-orange-50/25 via-white to-violet-50/25 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle, #000 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-orange-400/60 to-transparent rounded-full" />

        <div
          className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-gray-200/60 border border-gray-100/80 p-8 sm:p-10 transition-all duration-500 hover:shadow-orange-100/30"
          style={{
            boxShadow:
              '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.02), 0 12px 24px rgba(0,0,0,0.04), 0 32px 64px rgba(0,0,0,0.06)',
          }}
        >
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/10 via-transparent to-violet-400/10" />
          </div>

          <div className="relative text-center space-y-5 mb-8">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl blur-md opacity-40 scale-110" />
              <div className="relative inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-200/50">
                <img
                  src="/logo.png"
                  alt="WebReich"
                  className="h-8 w-8 object-contain brightness-0 invert"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">WebReich CRM</h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                <p className="text-xs font-semibold text-orange-600 tracking-wide uppercase">Secure Login</p>
              </div>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-white/80 backdrop-blur-sm px-3">
                <Sparkles className="h-4 w-4 text-orange-300" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Email</label>
              <div
                className={`
                  relative group rounded-xl transition-all duration-300
                  ${isFocused.email ? 'ring-1 ring-orange-300 shadow-lg shadow-orange-100/50' : 'ring-1 ring-gray-200 hover:ring-gray-300 shadow-sm hover:shadow-md'}
                `}
              >
                {isFocused.email && (
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-orange-400/60 via-orange-500/40 to-violet-400/60 opacity-75 blur-[2px]" />
                )}
                <div className="relative flex items-center bg-white rounded-xl overflow-hidden">
                  <div className={`pl-4 pr-3 py-3 transition-colors duration-200 ${isFocused.email ? 'text-orange-500' : 'text-gray-400'}`}>
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused((prev) => ({ ...prev, email: true }))}
                    onBlur={() => setIsFocused((prev) => ({ ...prev, email: false }))}
                    placeholder="webreichcommunity@gmail.com"
                    className="w-full py-3 pr-4 bg-transparent text-gray-900 placeholder-gray-400 text-sm rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 ml-1">Password</label>
              <div
                className={`
                  relative group rounded-xl transition-all duration-300
                  ${isFocused.password ? 'ring-1 ring-orange-300 shadow-lg shadow-orange-100/50' : 'ring-1 ring-gray-200 hover:ring-gray-300 shadow-sm hover:shadow-md'}
                `}
              >
                {isFocused.password && (
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-orange-400/60 via-orange-500/40 to-violet-400/60 opacity-75 blur-[2px]" />
                )}
                <div className="relative flex items-center bg-white rounded-xl overflow-hidden">
                  <div
                    className={`pl-4 pr-3 py-3 transition-colors duration-200 ${isFocused.password ? 'text-orange-500' : 'text-gray-400'}`}
                  >
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsFocused((prev) => ({ ...prev, password: true }))}
                    onBlur={() => setIsFocused((prev) => ({ ...prev, password: false }))}
                    placeholder="webreich@123"
                    className="w-full py-3 pr-4 bg-transparent text-gray-900 placeholder-gray-400 text-sm rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!isValid}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                  relative group w-full py-3.5 px-4 rounded-xl font-semibold text-sm
                  transition-all duration-500 ease-out
                  flex items-center justify-center gap-2 overflow-hidden
                  ${isValid ? 'text-white cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                `}
              >
                {isValid && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 bg-[length:200%_100%] animate-gradient-x" />
                    <div className={`absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 transition-opacity duration-300 ${isHovered ? 'opacity-100' : ''}`} />
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 ease-in-out ${isHovered ? 'translate-x-full' : ''}`}
                    />
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-400/30 to-violet-400/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </>
                )}

                <span className="relative flex items-center gap-2">
                  <Lock className={`h-4 w-4 ${isValid ? '' : 'opacity-50'}`} />
                  <span>{isValid ? 'Sign In' : 'Enter credentials'}</span>
                  {isValid && <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-3 w-3" />
            <span>Login keeps you signed in</span>
            <span className="text-gray-300">•</span>
            <span>PIN lock opens every time</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 WebReich. All rights reserved.</p>
      </div>

      <style>{`
        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default LoginForm;
