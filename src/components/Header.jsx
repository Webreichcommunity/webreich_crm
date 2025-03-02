import React, { useState } from 'react';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { FaUserCircle, FaChartLine, FaCalendarAlt } from 'react-icons/fa';

const Navbar = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Section */}
          <div className="flex items-center">

            {/* Brand Text */}
            <div className="ml-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-white">Garud</h1>
                <div className="flex flex-col md:flex-row md:items-center">
                  <span className="text-xs text-orange-100">Powered by Webreich</span>
                  <span className="hidden md:block text-orange-100 mx-2">•</span>
                  <span className="text-xs text-orange-100">v2.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="text-orange-100 hover:text-white transition-colors cursor-pointer flex items-center">
                <FaChartLine className="mr-2" />
                <span>Dashboard</span>
              </div>
              <div className="text-orange-100 hover:text-white transition-colors cursor-pointer flex items-center">
                <FaCalendarAlt className="mr-2" />
                <span>Calendar</span>
              </div>
              <div className="text-orange-100 hover:text-white transition-colors cursor-pointer flex items-center">
                <FaUserCircle className="mr-2" />
                <span>Profile</span>
              </div>
            </div>
            
            <div className="border-l border-orange-400 h-6"></div>
            
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 text-orange-100 hover:text-white transition-colors"
            >
              <FiLogOut className="mr-2" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-orange-100 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-orange-600">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#" className="block px-3 py-2 text-orange-100 hover:text-white transition-colors">
              <FaChartLine className="inline mr-2" />
              Dashboard
            </a>
            <a href="#" className="block px-3 py-2 text-orange-100 hover:text-white transition-colors">
              <FaCalendarAlt className="inline mr-2" />
              Calendar
            </a>
            <a href="#" className="block px-3 py-2 text-orange-100 hover:text-white transition-colors">
              <FaUserCircle className="inline mr-2" />
              Profile
            </a>
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-2 text-orange-100 hover:text-white transition-colors"
            >
              <FiLogOut className="inline mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;