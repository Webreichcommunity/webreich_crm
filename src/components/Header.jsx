import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

const Header = ({ onLogout }) => {
  const location = useLocation();
  const links = [
    ['/', 'Dashboard'],
    ['/projects/new', 'New Project'],
    ['/finance', 'Finance'],
    ['/reports', 'Reports'],
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 border-b border-orange-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <div className="font-bold text-orange-600">WebReich CRM</div>
        <div className="flex items-center gap-2 flex-wrap">
          {links.map(([to, name]) => (
            <Link key={to} to={to} className={`px-3 py-1 rounded-full text-sm ${location.pathname===to?'bg-orange-500 text-white':'bg-orange-100 text-orange-700'}`}>{name}</Link>
          ))}
          <button onClick={onLogout} className='w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center'><FiLogOut /></button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
