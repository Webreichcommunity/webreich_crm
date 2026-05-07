import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Ambient background accents */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-44 -right-44 w-[520px] h-[520px] bg-gradient-to-br from-orange-200/40 via-orange-100/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-44 -left-44 w-[520px] h-[520px] bg-gradient-to-tr from-violet-200/30 via-sky-100/10 to-transparent rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(2,6,23,0.8) 1px, transparent 1px)`,
            backgroundSize: '70px 70px',
          }}
        />
      </div>
      <Header onLogout={onLogout} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
