import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { ref, onValue, remove, update } from 'firebase/database';
import { 
  FaArrowLeft, FaWhatsapp, FaInstagram, FaEnvelope, FaEdit, 
  FaTrash, FaUserPlus, FaCheck, FaSearch, FaFilter, FaTimes 
} from 'react-icons/fa';

function ClientDataView() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'approach', 'confirmed'
  const [selectedClient, setSelectedClient] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const clientsRef = ref(database, 'clients');
    
    // Fetch data from Firebase
    const unsubscribe = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientsList = Object.entries(data).map(([id, values]) => ({
          id,
          ...values
        }));
        
        // Sort by date (newest first)
        clientsList.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setClients(clientsList);
        setFilteredClients(clientsList);
      } else {
        setClients([]);
        setFilteredClients([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching clients:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Apply filtering and searching
    let result = [...clients];
    
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(client => client.status === filter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(client => 
        client.name?.toLowerCase().includes(term) ||
        client.mobile?.includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.instagram?.toLowerCase().includes(term) ||
        client.product?.toLowerCase().includes(term)
      );
    }
    
    setFilteredClients(result);
  }, [clients, searchTerm, filter]);

  const handleDeleteClient = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        const clientRef = ref(database, `clients/${id}`);
        await remove(clientRef);
      } catch (error) {
        console.error("Error deleting client:", error);
        alert("Error deleting client");
      }
    }
  };

  const handleUpdateStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      const clientRef = ref(database, `clients/${id}`);
      await update(clientRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating client status:", error);
      alert("Error updating client status");
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const handleSendMessage = (client, type) => {
    let url = '';
    const isApproach = client.status === 'approach';
    
    // Generate message based on client status
    const message = isApproach 
      ? `🌟 Hello from Webreich!\n\nHi ${client.name},\n\nI noticed your business could benefit from our ${client.product} solution.\n\n💼 Service Overview:\n• ${client.product}: ₹${client.totalAmount}\n• Custom tailored to your business needs\n\nWould you be interested in discussing how this solution can help grow your business?\n\n🌐 Learn more about us:\nWebsite: https://webreich.vercel.app\nInstagram: https://www.instagram.com/webreich/\n\nLooking forward to connecting!\n\nRegards,\nTeam Webreich`
      : `🚀 Welcome to Webreich!\n\nDear ${client.name},\n\nThank you for choosing our ${client.product}!\n\n💼 Project Details:\n• Service: ${client.product}\n• Total Amount: ₹${client.totalAmount}\n\n🔥 Next Steps:\n1. Our team will contact you within 24 hours\n2. Project timeline will be shared\n3. Regular updates will be provided\n\n🌐 Stay Connected:\nWebsite: https://webreich.vercel.app\nInstagram: https://www.instagram.com/webreich/\n\nThank you for trusting Webreich! We're excited to work with you!\n\nBest regards,\nTeam Webreich`;
    
    // Create appropriate URL based on message type
    if (type === 'whatsapp' && client.mobile) {
      url = `https://api.whatsapp.com/send?phone=91${client.mobile}&text=${encodeURIComponent(message)}`;
    } else if (type === 'email' && client.email) {
      url = `mailto:${client.email}?subject=Webreich - ${client.product} Services&body=${encodeURIComponent(message)}`;
    } else if (type === 'instagram' && client.instagram) {
      url = `https://www.instagram.com/${client.instagram.replace('@', '')}`;
      // Note: Direct messaging isn't supported via URL in Instagram
    }
    
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`No ${type === 'whatsapp' ? 'phone number' : type === 'email' ? 'email address' : 'Instagram username'} available`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => navigate('/')}
                className="bg-white text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors flex items-center"
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              <h1 className="text-3xl font-bold text-center">Client Database</h1>
              <div className="w-24"></div> {/* Empty div for alignment */}
            </div>
          </div>
          
          <div className="p-6">
            {/* Search and Filter */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                />
                {searchTerm && (
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchTerm('')}
                  >
                    <FaTimes className="text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <FaFilter className="text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                >
                  <option value="all">All Clients</option>
                  <option value="approach">Approach Clients</option>
                  <option value="confirmed">Confirmed Clients</option>
                </select>
              </div>
            </div>
            
            {/* Clients List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="bg-orange-50 rounded-lg p-8 text-center">
                <p className="text-lg text-gray-600">No clients found</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add New Client
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-orange-200">
                  <thead className="bg-orange-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-orange-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-orange-100">
                    {filteredClients.map((client) => (
                      <tr 
                        key={client.id} 
                        className="hover:bg-orange-50 cursor-pointer transition-colors"
                        onClick={() => handleClientSelect(client)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.mobile}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{client.product}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{client.totalAmount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(client.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            client.status === 'approach' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {client.status === 'approach' ? 'Approach' : 'Confirmed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex space-x-2">
                            {client.status === 'approach' ? (
                              <button
                                onClick={(e) => handleUpdateStatus(client.id, 'confirmed', e)}
                                className="text-green-600 hover:text-green-800"
                                title="Mark as Confirmed"
                              >
                                <FaCheck />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleUpdateStatus(client.id, 'approach', e)}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Mark as Approach"
                              >
                                <FaUserPlus />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteClient(client.id, e)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Client"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Client Details Modal */}
            {selectedClient && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">Client Details</h2>
                    <button 
                      onClick={closeClientDetails}
                      className="text-white hover:text-orange-200"
                    >
                      <FaTimes />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Client Name</h3>
                        <p className="text-lg font-semibold text-gray-800">{selectedClient.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                        <p className="text-lg font-semibold text-gray-800">{selectedClient.mobile}</p>
                      </div>
                      
                      {selectedClient.email && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="text-lg font-semibold text-gray-800">{selectedClient.email}</p>
                        </div>
                      )}
                      
                      {selectedClient.instagram && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Instagram</h3>
                          <p className="text-lg font-semibold text-gray-800">{selectedClient.instagram}</p>
                        </div>
                      )}
                      
                      {selectedClient.location && (
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-500">Location</h3>
                          <p className="text-lg font-semibold text-gray-800">{selectedClient.location}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t border-orange-100 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Product</h3>
                          <p className="text-lg font-semibold text-gray-800">{selectedClient.product}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                          <p className="text-lg font-semibold text-gray-800">₹{selectedClient.totalAmount}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Registration Date</h3>
                          <p className="text-lg font-semibold text-gray-800">{formatDate(selectedClient.date)}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Status</h3>
                          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                            selectedClient.status === 'approach' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {selectedClient.status === 'approach' ? 'Approach' : 'Confirmed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedClient.notes && (
                      <div className="border-t border-orange-100 pt-4">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Notes</h3>
                        <p className="text-gray-800 bg-orange-50 p-4 rounded-lg">{selectedClient.notes}</p>
                      </div>
                    )}
                    
                    <div className="border-t border-orange-100 pt-4">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Client</h3>
                      <div className="flex space-x-3">
                        {selectedClient.mobile && (
                          <button
                            onClick={() => handleSendMessage(selectedClient, 'whatsapp')}
                            className="flex items-center bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <FaWhatsapp className="mr-2" /> WhatsApp
                          </button>
                        )}
                        
                        {selectedClient.email && (
                          <button
                            onClick={() => handleSendMessage(selectedClient, 'email')}
                            className="flex items-center bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <FaEnvelope className="mr-2" /> Email
                          </button>
                        )}
                        
                        {selectedClient.instagram && (
                          <button
                            onClick={() => handleSendMessage(selectedClient, 'instagram')}
                            className="flex items-center bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600 transition-colors"
                          >
                            <FaInstagram className="mr-2" /> Instagram
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t border-orange-100 pt-4 flex justify-between">
                      <button
                        onClick={() => handleUpdateStatus(
                          selectedClient.id, 
                          selectedClient.status === 'approach' ? 'confirmed' : 'approach',
                          { stopPropagation: () => {} }
                        )}
                        className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                          selectedClient.status === 'approach'
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {selectedClient.status === 'approach' ? (
                          <>
                            <FaCheck className="mr-2" /> Mark as Confirmed
                          </>
                        ) : (
                          <>
                            <FaUserPlus className="mr-2" /> Mark as Approach
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          closeClientDetails();
                          handleDeleteClient(selectedClient.id, { stopPropagation: () => {} });
                        }}
                        className="flex items-center bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <FaTrash className="mr-2" /> Delete Client
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDataView;