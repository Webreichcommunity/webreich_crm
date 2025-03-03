import React, { useState, useEffect } from 'react';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { FaProjectDiagram, FaFire } from 'react-icons/fa';
import { collection, getCountFromServer, getFirestore } from 'firebase/firestore';
import { database } from '../db/firebase.js';

const Navbar = ({ onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project count from Firebase Firestore
  useEffect(() => {
    const fetchProjectCount = async () => {
      try {
        setIsLoading(true);
        // Get Firestore instance
        const firestore = getFirestore();
        const projectsCollection = collection(firestore, "projects");
        const snapshot = await getCountFromServer(projectsCollection);
        setProjectCount(snapshot.data().count);
      } catch (error) {
        console.error("Error fetching project count:", error);
        // Set a fallback count if fetch fails
        setProjectCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectCount();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            {/* Company Logo */}
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12">
                {/* <FaFire className="text-white text-xl" />
                 */}
                 <img src="https://webreich.vercel.app/logo.png" alt="" />
              </div>
            </div>
          </div>

          {/* Project Counter & Logout (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Project Counter */}
            <div className="flex items-center bg-gray-50 px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:border-orange-300 transition-all duration-300">
              <FaProjectDiagram className="text-orange-500 mr-2" />
              <div className="flex flex-col">
                {/* <span className="text-xs text-gray-500">Projects</span> */}
                {isLoading ? (
                  <div className="h-5 w-8 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  <span className="font-bold text-gray-800">{projectCount}</span>
                )}
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-600 hover:text-orange-500 hover:bg-orange-50 border border-gray-200 hover:border-orange-300 shadow-sm hover:shadow transition-all duration-300 focus:outline-none"
              aria-label="Logout"
            >
              <FiLogOut className="text-lg" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {/* Project Counter (Mobile - Always visible) */}
            <div className="flex items-center bg-gray-50 px-3 py-1 mr-3 rounded-full shadow-sm border border-gray-200">
              <FaProjectDiagram className="text-orange-500 mr-1" />
              {isLoading ? (
                <div className="h-4 w-6 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="font-bold text-gray-800 text-sm">{projectCount}</span>
              )}
            </div>
            
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-50 text-gray-600 hover:text-orange-500 border border-gray-200 hover:border-orange-300 transition-colors focus:outline-none"
            >
              {isMenuOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <FiMenu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <div className={`md:hidden bg-white border-t border-gray-200 shadow-inner transform transition-all duration-300 ${isMenuOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Need help? <a href="mailto:support@webreich.com" className="text-orange-500 hover:underline">Contact support</a>
            </span>
            <button
              onClick={onLogout}
              className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors text-sm"
            >
              <FiLogOut className="mr-2" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;