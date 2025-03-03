import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { onValue, update, ref, remove } from 'firebase/database';
import {
  FaArrowLeft, FaWhatsapp, FaInstagram, FaEnvelope, FaEdit,
  FaTrash, FaUserPlus, FaCheck, FaSearch, FaFilter, FaTimes,
  FaSave, FaPhoneAlt, FaMapMarkerAlt, FaMoneyBillWave, FaPaperPlane
} from 'react-icons/fa';

function DataSaved() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'approach', 'confirmed'
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(null);
  const [selectedMessageType, setSelectedMessageType] = useState('default');
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

  // const handleDeleteClient = async (id, e) => {
  //   e.stopPropagation();
  //   if (window.confirm("Are you sure you want to delete this client?")) {
  //     try {
  //       const clientRef = ref(database, `clients/${id}`);
  //       await remove(clientRef);
  //       if (selectedClient && selectedClient.id === id) {
  //         closeClientDetails();
  //       }
  //     } catch (error) {
  //       console.error("Error deleting client:", error);
  //       alert("Error deleting client");
  //     }
  //   }
  // };

  const handleDeleteClient = async (id, e) => {
    e.stopPropagation();
    e.preventDefault(); // Adding this to prevent any default behavior
    
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        // Ensure the path is correct - check your Firebase structure
        const clientRef = ref(database, `clients/${id}`);
        await remove(clientRef);
        
        // Check if the deleted client is currently selected
        if (selectedClient && selectedClient.id === id) {
          closeClientDetails();
        }
        
        // Notify parent component (if needed)
        if (typeof onClientDelete === 'function') {
          onClientDelete(id);
        }
        
        console.log("Client successfully deleted!");
      } catch (error) {
        console.error("Error deleting client:", error);
        alert(`Error deleting client: ${error.message}`);
      }
    }
  };

  
  const handleUpdateStatus = async (id, newStatus, e) => {
    e.stopPropagation();
    try {
      const clientRef = ref(database, `clients/${id}`);
      await update(clientRef, { status: newStatus });

      // If we're updating the currently selected client, update local state too
      if (selectedClient && selectedClient.id === id) {
        setSelectedClient({
          ...selectedClient,
          status: newStatus
        });

        if (isEditing) {
          setEditedClient({
            ...editedClient,
            status: newStatus
          });
        }
      }
    } catch (error) {
      console.error("Error updating client status:", error);
      alert("Error updating client status");
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setIsEditing(false);
  };

  const startEditing = () => {
    setEditedClient({ ...selectedClient });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedClient(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedClient({
      ...editedClient,
      [name]: value
    });
  };

  const saveClientChanges = async () => {
    try {
      const clientRef = ref(database, `clients/${editedClient.id}`);
      await update(clientRef, editedClient);
      setSelectedClient(editedClient);
      setIsEditing(false);

      // Show success message
      const successMsg = document.getElementById('success-message');
      if (successMsg) {
        successMsg.classList.remove('hidden');
        setTimeout(() => {
          successMsg.classList.add('hidden');
        }, 3000);
      }
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Error updating client details");
    }
  };

  const closeClientDetails = () => {
    setSelectedClient(null);
    setIsEditing(false);
    setEditedClient(null);
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

    // Get appropriate message template based on client status and selected message type
    const message = getMessageTemplate(client, selectedMessageType);

    // Create appropriate URL based on message type
    if (type === 'whatsapp' && client.mobile) {
      url = `https://api.whatsapp.com/send?phone=91${client.mobile}&text=${encodeURIComponent(message)}`;
    } else if (type === 'email' && client.email) {
      const subject = client.status === 'approach'
        ? `Webreich - ${client.product} Services Proposal`
        : `Welcome to Webreich - Your ${client.product} Project`;
      url = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    } else if (type === 'instagram' && client.instagram) {
      // Clean the Instagram handle to ensure proper linking
      const instagramHandle = client.instagram.replace('@', '').trim();
      url = `https://www.instagram.com/${instagramHandle}`;

      // Also copy the message to clipboard for easy pasting
      navigator.clipboard.writeText(message)
        .then(() => alert("Message copied to clipboard! Paste it in your Instagram DM."))
        .catch(err => console.error('Failed to copy message: ', err));
    }

    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`No ${type === 'whatsapp' ? 'phone number' : type === 'email' ? 'email address' : 'Instagram username'} available`);
    }
  };

  const getMessageTemplate = (client, type) => {
    const isApproach = client.status === 'approach';

    // Default templates
    if (type === 'default') {
      if (isApproach) {
        return `🌟 Hello from Webreich!\n\nHi ${client.name},\n\nI noticed your business could benefit from our ${client.product} solution.\n\n💼 Service Overview:\n• ${client.product}: ₹${client.totalAmount}\n• Custom tailored to your business needs\n\nWould you be interested in discussing how this solution can help grow your business?\n\n🌐 Learn more about us:\nWebsite: https://webreich.vercel.app\nInstagram: https://www.instagram.com/webreich/\n\nLooking forward to connecting!\n\nRegards,\nTeam Webreich`;
      } else {
        return `🚀 Welcome to Webreich!\n\nDear ${client.name},\n\nThank you for choosing our ${client.product}!\n\n💼 Project Details:\n• Service: ${client.product}\n• Total Amount: ₹${client.totalAmount}\n\n🔥 Next Steps:\n1. Our team will contact you within 24 hours\n2. Project timeline will be shared\n3. Regular updates will be provided\n\n🌐 Stay Connected:\nWebsite: https://webreich.vercel.app\nInstagram: https://www.instagram.com/webreich/\n\nThank you for trusting Webreich! We're excited to work with you!\n\nBest regards,\nTeam Webreich`;
      }
    }

    // Cold email template
    if (type === 'cold') {
      return `Subject: Elevate Your Business With Professional ${client.product}\n\nHi ${client.name},\n\nI hope this message finds you well. I'm reaching out because I believe our ${client.product} services could significantly benefit your business.\n\nOur team at Webreich specializes in creating custom ${client.product} solutions that help businesses like yours stand out from the competition.\n\nWould you be open to a quick 15-minute call to discuss how we might be able to help?\n\nBest regards,\nTeam Webreich\nhttps://webreich.vercel.app`;
    }

    // Follow-up template
    if (type === 'followup') {
      if (isApproach) {
        return `Hi ${client.name},\n\nI wanted to follow up on my previous message about our ${client.product} services.\n\nHave you had a chance to consider how our solutions might benefit your business?\n\nI'd be happy to answer any questions you might have or provide more information.\n\nLooking forward to hearing from you!\n\nBest regards,\nTeam Webreich\nhttps://webreich.vercel.app`;
      } else {
        return `Hi ${client.name},\n\nI hope you're doing well! I wanted to check in on your ${client.product} project.\n\nHow are you finding everything so far? Is there anything specific you'd like to discuss or any adjustments you'd like to make?\n\nWe're committed to ensuring you're completely satisfied with our service.\n\nBest regards,\nTeam Webreich\nhttps://webreich.vercel.app`;
      }
    }

    // Promotional offer
    if (type === 'promo') {
      if (isApproach) {
        return `🔥 SPECIAL OFFER | Webreich 🔥\n\nHi ${client.name},\n\nFor a limited time, we're offering a 15% discount on our ${client.product} services for new clients!\n\nOriginal Price: ₹${client.totalAmount}\nDiscounted Price: ₹${Math.round(client.totalAmount * 0.85)}\n\nThis offer is valid for the next 7 days only. Would you like to take advantage of this special rate?\n\nBest regards,\nTeam Webreich\nhttps://webreich.vercel.app`;
      } else {
        return `💫 EXCLUSIVE CLIENT OFFER | Webreich 💫\n\nHi ${client.name},\n\nAs a valued client, we'd like to offer you a special 20% discount on any additional services to complement your current ${client.product} project!\n\nWould you be interested in exploring how our other services could further enhance your business?\n\nThis exclusive offer is valid for 14 days.\n\nBest regards,\nTeam Webreich\nhttps://webreich.vercel.app`;
      }
    }

    return isApproach
      ? `Hello ${client.name}, I'd like to introduce our ${client.product} services to you.`
      : `Hello ${client.name}, thank you for choosing our ${client.product} services!`;
  };

  return (
    <div className="">
      <div className="">
        <div className="bg-white shadow-2xl overflow-hidden">
          <div className=" p-6 text-white">
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/')}
                className="bg-white text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors flex items-center shadow-md"
              >
                <FaArrowLeft className="mr-2" />
              </button>
              <h1 className="text-2xl font-bold text-center text-gray-900">Client Database</h1>
              <button
                onClick={() => navigate('/')}
                className="bg-white text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors flex items-center shadow-md"
              >
                <FaUserPlus className="mr-2" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Success message for edits */}
            <div id="success-message" className="hidden mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md">
              <div className="flex items-center">
                <FaCheck className="mr-2" />
                <span>Client details updated successfully!</span>
              </div>
            </div>

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
                  className="w-full pl-10 pr-4 py-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300 shadow-sm"
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
                  className="px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300 shadow-sm"
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
                  className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-md"
                >
                  Add New Client
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg shadow-md">
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
                            <div className="w-9 h-9 flex-shrink-0 mr-3 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center font-bold">
                              {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{client.name}</div>
                              <div className="text-sm text-gray-500 flex items-center">
                                <FaPhoneAlt className="text-xs text-gray-400 mr-1" />
                                {client.mobile}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{client.product}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">₹{client.totalAmount}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(client.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${client.status === 'approach'
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
                                className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                title="Mark as Confirmed"
                              >
                                <FaCheck />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleUpdateStatus(client.id, 'approach', e)}
                                className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 p-1.5 rounded-lg hover:bg-yellow-100 transition-colors"
                                title="Mark as Approach"
                              >
                                <FaUserPlus />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleClientSelect(client);
                                setTimeout(startEditing, 100);
                              }}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Edit Client"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClient(client.id, e)}
                              className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
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
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-full overflow-y-auto">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 text-white flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                      {isEditing ? "Edit Client Details" : "Client Details"}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {!isEditing && (
                        <button
                          onClick={startEditing}
                          className="bg-white text-orange-600 p-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                          title="Edit Client"
                        >
                          <FaEdit />
                        </button>
                      )}
                      <button
                        onClick={closeClientDetails}
                        className="bg-white text-orange-600 p-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                        title="Close"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {isEditing ? (
                      // Edit Form
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                            <input
                              type="text"
                              name="name"
                              value={editedClient.name || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                            <input
                              type="text"
                              name="mobile"
                              value={editedClient.mobile || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={editedClient.email || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                            <input
                              type="text"
                              name="instagram"
                              value={editedClient.instagram || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                              placeholder="@username"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                              type="text"
                              name="location"
                              value={editedClient.location || ''}
                              onChange={handleEditChange}
                              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                            />
                          </div>
                        </div>

                        <div className="border-t border-orange-100 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                              <input
                                type="text"
                                name="product"
                                value={editedClient.product || ''}
                                onChange={handleEditChange}
                                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500">₹</span>
                                </div>
                                <input
                                  type="number"
                                  name="totalAmount"
                                  value={editedClient.totalAmount || ''}
                                  onChange={handleEditChange}
                                  className="w-full pl-8 px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                              <select
                                name="status"
                                value={editedClient.status || 'approach'}
                                onChange={handleEditChange}
                                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                              >
                                <option value="approach">Approach</option>
                                <option value="confirmed">Confirmed</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-orange-100 pt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            name="notes"
                            value={editedClient.notes || ''}
                            onChange={handleEditChange}
                            rows="4"
                            className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                          ></textarea>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-orange-100">
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveClientChanges}
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                          >
                            <FaSave className="mr-2" /> Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Client Details View
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Client Name</h3>
                            <p className="text-lg font-semibold text-gray-800">{selectedClient.name}</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                            <p className="text-lg font-semibold text-gray-800 flex items-center">
                              {selectedClient.mobile}
                              <button
                                onClick={() => handleSendMessage(selectedClient, 'whatsapp')}
                                className="ml-2 text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-lg hover:bg-green-100 transition-colors"
                                title="Send WhatsApp"
                              >
                                <FaWhatsapp />
                              </button>
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Email</h3>
                            <p className="text-lg font-semibold text-gray-800 flex items-center">
                              {selectedClient.email || 'Not provided'}
                              {selectedClient.email && (
                                <button
                                  onClick={() => handleSendMessage(selectedClient, 'email')}
                                  className="ml-2 text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                  title="Send Email"
                                >
                                  <FaEnvelope />
                                </button>
                              )}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Instagram</h3>
                            <p className="text-lg font-semibold text-gray-800 flex items-center">
                              {selectedClient.instagram || 'Not provided'}
                              {selectedClient.instagram && (
                                <button
                                  onClick={() => handleSendMessage(selectedClient, 'instagram')}
                                  className="ml-2 text-pink-600 hover:text-pink-800 bg-pink-50 p-1.5 rounded-lg hover:bg-pink-100 transition-colors"
                                  title="Open Instagram"
                                >
                                  <FaInstagram />
                                </button>
                              )}
                            </p>
                          </div>

                          {selectedClient.location && (
                            <div className="md:col-span-2">
                              <h3 className="text-sm font-medium text-gray-500">Location</h3>
                              <p className="text-lg font-semibold text-gray-800 flex items-center">
                                <FaMapMarkerAlt className="text-red-500 mr-1" />
                                {selectedClient.location}
                              </p>
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
                              <p className="text-lg font-semibold text-gray-800 flex items-center">
                                <FaMoneyBillWave className="text-green-500 mr-1" />
                                ₹{selectedClient.totalAmount}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Status</h3>
                              <p className="text-lg">
                                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${selectedClient.status === 'approach'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                                  }`}>
                                  {selectedClient.status === 'approach' ? 'Approach' : 'Confirmed'}
                                </span>
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Date Added</h3>
                              <p className="text-lg font-semibold text-gray-800">{formatDate(selectedClient.date)}</p>
                            </div>
                          </div>
                        </div>

                        {selectedClient.notes && (
                          <div className="border-t border-orange-100 pt-4">
                            <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                            <p className="text-gray-800 whitespace-pre-line mt-2">{selectedClient.notes}</p>
                          </div>
                        )}

                        {/* Message Templates Section */}
                        <div className="border-t border-orange-100 pt-4">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Message Templates</h3>
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <select
                              value={selectedMessageType}
                              onChange={(e) => setSelectedMessageType(e.target.value)}
                              className="col-span-2 px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                            >
                              <option value="default">Default Message</option>
                              <option value="cold">Cold Outreach</option>
                              <option value="followup">Follow-up Message</option>
                              <option value="promo">Promotional Offer</option>
                            </select>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-800 whitespace-pre-line mb-3">
                              {getMessageTemplate(selectedClient, selectedMessageType)}
                            </div>

                            <div className="flex space-x-2 justify-end">
                              <button
                                onClick={() => navigator.clipboard.writeText(getMessageTemplate(selectedClient, selectedMessageType))}
                                className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors text-sm flex items-center"
                              >
                                Copy Text
                              </button>

                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSendMessage(selectedClient, 'whatsapp')}
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors text-sm flex items-center"
                                  disabled={!selectedClient.mobile}
                                >
                                  <FaWhatsapp className="mr-1" /> WhatsApp
                                </button>

                                <button
                                  onClick={() => handleSendMessage(selectedClient, 'email')}
                                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm flex items-center"
                                  disabled={!selectedClient.email}
                                >
                                  <FaEnvelope className="mr-1" /> Email
                                </button>

                                <button
                                  onClick={() => handleSendMessage(selectedClient, 'instagram')}
                                  className="bg-pink-500 text-white px-3 py-1 rounded hover:bg-pink-600 transition-colors text-sm flex items-center"
                                  disabled={!selectedClient.instagram}
                                >
                                  <FaInstagram className="mr-1" /> Instagram
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
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

export default DataSaved;