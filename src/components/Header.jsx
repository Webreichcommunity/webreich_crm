import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiGrid, FiPieChart, FiBarChart2 } from 'react-icons/fi';

const Header = ({ onLogout }) => {
  const location = useLocation();
  
  const links = [
    ['/', 'Dashboard', FiGrid],
    ['/finance', 'Finance', FiPieChart],
    ['/reports', 'Reports', FiBarChart2],
  ];

  return (
    <nav className="sticky top-0 z-40">
      {/* Main header */}
      <div className="bg-slate-950/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="relative">
              {/* Logo glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-orange-600/30 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/[0.08] overflow-hidden flex items-center justify-center
                group-hover:border-orange-500/30 transition-all duration-300 shadow-lg shadow-black/20">
                <img 
                  src="/logo.png" 
                  alt="WebReich" 
                  className="h-6 w-6 object-contain brightness-0 invert opacity-90"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
            
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                WebReich CRM
              </h1>
              <p className="text-[11px] text-orange-400/80 font-semibold tracking-wider uppercase mt-0.5">
                  Operations • Finance • Reports
                </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 p-0.5 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              {links.map(([to, name, Icon]) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`
                      relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-300 ease-out
                      ${isActive 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-gray-200'
                      }
                    `}
                  >
                    {/* Active background with gradient */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20" />
                    )}
                    
                    <span className="relative flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      <span className="hidden sm:inline">{name}</span>
                    </span>

              
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-white/[0.08] mx-1" />

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="relative group flex items-center justify-center h-9 w-9 rounded-xl
                bg-white/[0.04] border border-white/[0.06] 
                hover:bg-white/[0.08] hover:border-white/[0.12]
                transition-all duration-300 ease-out
                hover:shadow-lg hover:shadow-black/20"
              title="Logout"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <FiLogOut className="relative h-4 w-4 text-gray-400 group-hover:text-red-400 transition-colors duration-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Subtle bottom gradient line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
    </nav>
  );
};

export default Header;