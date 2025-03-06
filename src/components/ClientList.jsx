import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { onValue, ref } from 'firebase/database';
import * as XLSX from 'xlsx';
import {
  FaUserPlus,
  FaSearch,
  FaTimes,
  FaDownload,
  FaEye,
  FaCalendarAlt,
  FaFilter,
  FaChartLine
} from 'react-icons/fa';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [responseFilter, setResponseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    approach: 0,
    confirmed: 0,
    responded: 0
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch clients data
  useEffect(() => {
    const clientsRef = ref(database, 'clients');

    const unsubscribe = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientsList = Object.entries(data).map(([id, values]) => ({
          id,
          ...values,
          // Ensure response field exists
          response: values.response || 'No response yet'
        }));

        clientsList.sort((a, b) => new Date(b.date) - new Date(a.date));

        setClients(clientsList);
        setFilteredClients(clientsList);
        calculateStats(clientsList);
      } else {
        setClients([]);
        setFilteredClients([]);
        setStats({
          total: 0,
          today: 0,
          approach: 0,
          confirmed: 0,
          responded: 0
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Calculate statistics
  const calculateStats = (clientsList) => {
    const today = new Date().toISOString().split('T')[0];
    
    const todayClients = clientsList.filter(client => 
      client.date && client.date.startsWith(today)
    );
    
    const approachClients = clientsList.filter(client => 
      client.status === 'approach'
    );
    
    const confirmedClients = clientsList.filter(client => 
      client.status === 'confirmed'
    );
    
    const respondedClients = clientsList.filter(client => 
      client.response && client.response !== 'No response yet'
    );

    setStats({
      total: clientsList.length,
      today: todayClients.length,
      approach: approachClients.length,
      confirmed: confirmedClients.length,
      responded: respondedClients.length
    });
  };

  // Apply filters to client data
  useEffect(() => {
    let result = [...clients];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter);
    }

    // Response filter
    if (responseFilter === 'responded') {
      result = result.filter(client => 
        client.response && client.response !== 'No response yet'
      );
    } else if (responseFilter === 'not-responded') {
      result = result.filter(client => 
        !client.response || client.response === 'No response yet'
      );
    }

    // Date filter
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    
    if (dateFilter === 'today') {
      result = result.filter(client => client.date && client.date.startsWith(today));
    } else if (dateFilter === 'yesterday') {
      result = result.filter(client => client.date && client.date.startsWith(yesterday));
    } else if (dateFilter === 'week') {
      result = result.filter(client => client.date && client.date >= lastWeek);
    }

    // Search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(client =>
        client.name?.toLowerCase().includes(term) ||
        client.mobile?.includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.product?.toLowerCase().includes(term) ||
        client.response?.toLowerCase().includes(term)
      );
    }

    setFilteredClients(result);
  }, [clients, searchTerm, statusFilter, responseFilter, dateFilter]);

  const exportToExcel = () => {
    // Create a clean version of the data for export
    const exportData = filteredClients.map(client => ({
      Name: client.name || '',
      Mobile: client.mobile || '',
      Email: client.email || '',
      Product: client.product || '',
      Status: client.status || '',
      Response: client.response || 'No response yet',
      Date: formatDate(client.date) || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "clients_export.xlsx");
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to truncate long text with ellipsis
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 md:p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold text-orange-700 mb-4 md:mb-0">Client Management</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/add-client')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition shadow-md flex items-center"
            >
              <FaUserPlus className="mr-2" /> Add Client
            </button>
            <button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition shadow-md flex items-center"
            >
              <FaDownload className="mr-2" /> Export
            </button>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition shadow-md flex items-center"
            >
              <FaFilter className="mr-2" /> Filters
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FaChartLine className="text-blue-500 w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today's Clients</p>
                <p className="text-2xl font-bold text-green-600">{stats.today}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FaCalendarAlt className="text-green-500 w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approach</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.approach}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FaUserPlus className="text-yellow-500 w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-purple-600">{stats.confirmed}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FaUserPlus className="text-purple-500 w-5 h-5" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-pink-500 hover:shadow-lg transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Responded</p>
                <p className="text-2xl font-bold text-pink-600">{stats.responded}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-full">
                <FaUserPlus className="text-pink-500 w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Section - Conditionally rendered */}
        {isFilterOpen && (
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6 border border-orange-200 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Status Filter</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50"
                >
                  <option value="all">All Status</option>
                  <option value="approach">Approach</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Response Filter</label>
                <select
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50"
                >
                  <option value="all">All Responses</option>
                  <option value="responded">Responded</option>
                  <option value="not-responded">Not Responded</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Date Filter</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-orange-200">
          {/* Search Bar */}
          <div className="p-4 border-b bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, mobile, email, product or response..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
              />
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" />
              {searchTerm && (
                <FaTimes
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 cursor-pointer"
                  onClick={() => setSearchTerm('')}
                />
              )}
            </div>
          </div>

          {/* Client List Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4 text-orange-400">
                <FaSearch className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 text-lg">No clients found with the current filters</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setResponseFilter('all');
                  setDateFilter('all');
                }}
                className="mt-4 text-orange-500 hover:text-orange-700 underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-100 to-orange-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-orange-800 font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-orange-800 font-semibold">Product</th>
                    <th className="px-4 py-3 text-left text-orange-800 font-semibold">Mobile</th>
                    <th className="px-4 py-3 text-left text-orange-800 font-semibold">Response</th>
                    <th className="px-4 py-3 text-left text-orange-800 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-orange-800 font-semibold">Date</th>
                    <th className="px-4 py-3 text-center text-orange-800 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client, index) => (
                    <tr 
                      key={client.id} 
                      className={`border-b hover:bg-orange-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-orange-50/30'}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-3 text-white shadow-md">
                            {client.name ? client.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span 
                            className="font-medium text-gray-800 hover:text-orange-600 transition cursor-pointer"
                            onClick={() => navigate(`/client/${client.id}`)}
                          >
                            {client.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{client.product}</td>
                      <td className="px-4 py-4 text-gray-700">{client.mobile}</td>
                      <td className="px-4 py-4 text-gray-700">
                        <div className="max-w-xs">
                          {truncateText(client.response || 'No response yet')}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            client.status === 'approach'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-green-100 text-green-800 border border-green-300'
                          }`}
                        >
                          {client.status === 'approach' ? 'Approach' : 'Confirmed'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{formatDate(client.date)}</td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => navigate(`/client/${client.id}`)}
                          className="bg-orange-100 p-2 rounded-full text-orange-600 hover:bg-orange-200 hover:text-orange-700 transition"
                          title="View Details"
                        >
                          <FaEye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination or Results Summary */}
          <div className="p-4 border-t bg-orange-50 text-sm text-gray-600">
            Showing {filteredClients.length} of {clients.length} clients
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientList;