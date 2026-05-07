import React, { useState } from 'react';
import { ArrowRight, Lock, ShieldCheck, Sparkles } from 'lucide-react';

function PinLock({ onUnlock, onLogout }) {
  const [pin, setPin] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isValid = pin.length === 4;

  const submit = (e) => {
    e.preventDefault();
    if (isValid) onUnlock(pin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-gradient-to-br from-slate-900/10 via-orange-200/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[470px] h-[470px] bg-gradient-to-tr from-violet-200/20 via-sky-100/10 to-transparent rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(2,6,23,0.8) 1px, transparent 1px)`,
            backgroundSize: '70px 70px',
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-orange-400/40 to-transparent rounded-full" />

        <div className="relative wr-card p-8 sm:p-10">
          <div className="relative text-center space-y-5 mb-8">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl blur-md opacity-30 scale-110" />
              <div className="relative inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg shadow-slate-900/15 border border-white/40">
                <Lock className="h-7 w-7 text-orange-400" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">App Locked</h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 rounded-full border border-orange-100">
                <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                <p className="text-xs font-semibold text-orange-700 tracking-wide uppercase">Enter PIN</p>
              </div>
              <p className="text-sm text-slate-500 mt-1">This CRM always asks for your 4‑digit PIN after reopening.</p>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/70" />
            </div>
            <div className="relative flex justify-center">
              <div className="bg-white/70 backdrop-blur-sm px-3 rounded-full border border-white/50">
                <Sparkles className="h-4 w-4 text-orange-300" />
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">4‑Digit PIN</label>
              <div
                className={`
                  relative group rounded-xl transition-all duration-300
                  ${isFocused ? 'ring-1 ring-orange-300 shadow-lg shadow-orange-100/50' : 'ring-1 ring-slate-200 hover:ring-slate-300 shadow-sm hover:shadow-md'}
                `}
              >
                {isFocused && (
                  <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-orange-400/60 via-orange-500/40 to-violet-400/50 opacity-70 blur-[2px]" />
                )}

                <div className="relative flex items-center bg-white rounded-xl overflow-hidden">
                  <div className={`pl-4 pr-3 py-3 transition-colors duration-200 ${isFocused ? 'text-orange-500' : 'text-slate-400'}`}>
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="••••"
                    className="w-full py-3 pr-4 bg-transparent text-slate-900 placeholder-slate-300 text-sm tracking-[0.35em] rounded-xl focus:outline-none"
                    aria-label="PIN"
                    required
                  />
                  <div className="flex gap-1.5 pr-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-orange-500 shadow-sm shadow-orange-200' : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-1 space-y-3">
              <button
                type="submit"
                disabled={!isValid}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`
                  relative group w-full py-3.5 px-4 rounded-xl font-semibold text-sm
                  transition-all duration-500 ease-out
                  flex items-center justify-center gap-2 overflow-hidden
                  ${isValid ? 'text-white cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}
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
                  <span>{isValid ? 'Unlock' : 'Enter PIN'}</span>
                  {isValid && <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />}
                </span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white/60 border border-white/60 hover:bg-white/80 transition"
              >
                Sign out
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">© 2026 WebReich. All rights reserved.</p>
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

export default PinLock;
