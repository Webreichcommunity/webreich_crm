import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaEnvelope, FaGithub, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaPhone, FaTwitter } from 'react-icons/fa';

const Footer = () => {
  const year = new Date().getFullYear();
  const location = useLocation();

  const nav = [
    { name: 'Dashboard', to: '/' },
    { name: 'Finance', to: '/finance' },
    { name: 'Reports', to: '/reports' },
    { name: 'Scripts', to: '/scripts' },
  ];

  const socials = [
    { icon: <FaTwitter />, href: 'https://twitter.com/webreich', label: 'Twitter' },
    { icon: <FaGithub />, href: 'https://github.com/webreich', label: 'GitHub' },
    { icon: <FaLinkedin />, href: 'https://linkedin.com/company/webreich', label: 'LinkedIn' },
    { icon: <FaInstagram />, href: 'https://instagram.com/webreich', label: 'Instagram' },
  ];

  return (
    <footer className=" bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.06]">
    

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.08] flex items-center justify-center shadow-lg shadow-black/20">
                <img
                  src="/logo.png"
                  alt="WebReich"
                  className="h-6 w-6 object-contain brightness-0 invert opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-none">WebReich CRM</h2>
                <p className="text-[11px] text-orange-400/80 font-semibold tracking-wider uppercase mt-0.5">
                  Operations • Finance • Reports
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mt-5 max-w-md">
              A focused CRM workspace for managing projects, tracking payments, generating reports, and using ready-to-send client scripts.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <FaMapMarkerAlt className="text-orange-400 text-sm" />
                </span>
                <span>Akola, Maharashtra, India</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <FaPhone className="text-orange-400 text-sm" />
                </span>
                <span>+91-8668722207 / +91-9834153020</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <FaEnvelope className="text-orange-400 text-sm" />
                </span>
                <span>webreichcommunity@gmail.com</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-4">
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              {nav.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-xl border text-sm transition ${
                      active
                        ? 'bg-white/[0.06] border-orange-500/20 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl p-4 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
              <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Security</p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                You stay signed in until logout. The app lock PIN is required after reopening the app.
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-4">Social</h3>
            <div className="flex items-center gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-orange-300 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition"
                >
                  <span className="relative z-10 transform group-hover:scale-110 transition-transform">{s.icon}</span>
                </a>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06]">
              <p className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Tip</p>
              <p className="text-sm text-slate-400 mt-2">
                Use Finance filters + export, then validate in Reports for month-wise performance.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">© {year} WebReich CRM. All rights reserved.</p>
          <p className="text-xs text-slate-500">Designed for fast, mobile-friendly workflows.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

