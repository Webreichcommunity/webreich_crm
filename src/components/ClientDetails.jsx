import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { get, ref, remove, update } from 'firebase/database';
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInstagram,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendar,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaSmile,
  FaFrown,
  FaClock,
  FaPhoneSlash,
  FaArrowLeft,
  FaWhatsapp,
  FaCommentAlt,
  FaSms,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaGlobe,
  FaStore,
  FaHandshake,
  FaHistory,
  FaCreditCard,
  FaMoneyCheck,
  FaPaypal,
  FaGoogle
} from 'react-icons/fa';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState({});
  const [loading, setLoading] = useState(true);
  const [messageType, setMessageType] = useState('');
  const [showMessageTemplates, setShowMessageTemplates] = useState(false);

  useEffect(() => {
    const fetchClientDetails = async () => {
      try {
        const clientRef = ref(database, `clients/${id}`);
        const snapshot = await get(clientRef);

        if (snapshot.exists()) {
          const clientData = snapshot.val();
          setClient({ id, ...clientData });
          setEditedClient({ id, ...clientData });
        } else {
          console.error('No client found');
          navigate('/');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching client details:', error);
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const clientRef = ref(database, `clients/${id}`);
        await remove(clientRef);
        navigate('/');
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const clientRef = ref(database, `clients/${id}`);
      await update(clientRef, editedClient);
      setClient({ ...editedClient });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleCancel = () => {
    setEditedClient(client);
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClient((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayInputChange = (name, value) => {
    setEditedClient((prev) => ({
      ...prev,
      [name]: Array.isArray(prev[name])
        ? prev[name].includes(value)
          ? prev[name].filter(item => item !== value)
          : [...prev[name], value]
        : [value]
    }));
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleCall = () => {
    if (client.mobile) {
      window.location.href = `tel:${client.mobile}`;
    }
  };

  const handleWhatsApp = () => {
    if (client.mobile) {
      window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}`, '_blank');
    }
    setMessageType('whatsapp');
    setShowMessageTemplates(true);
  };

  const handleEmail = () => {
    if (client.email) {
      window.location.href = `mailto:${client.email}`;
    }
    setMessageType('email');
    setShowMessageTemplates(true);
  };

  const handleInstagram = () => {
    if (client.instagramId) {
      window.open(`https://instagram.com/${client.instagramId.replace('@', '')}`, '_blank');
    }
    setMessageType('instagram');
    setShowMessageTemplates(true);
  };

  const handleSMS = () => {
    if (client.mobile) {
      window.location.href = `sms:${client.mobile}`;
    }
    setMessageType('sms');
    setShowMessageTemplates(true);
  };

  const messageTemplates = {
    whatsapp: [
      "Hi ${client.name}, thank you for your interest in our services. How can we help you today?",
      "Hello ${client.name}, following up on our conversation about ${client.product}. Do you have any questions?",
      "Hello ${client.name}, we have a special offer on ${client.product} that might interest you. Would you like to know more?"
    ],
    email: [
      "Subject: Follow-up on Our Conversation\n\nDear ${client.name},\n\nThank you for your interest in ${client.product}. I'd like to provide you with more details...",
      "Subject: Special Offer for You\n\nDear ${client.name},\n\nWe're pleased to offer you a special deal on ${client.product}...",
      "Subject: Thank You for Your Business\n\nDear ${client.name},\n\nWe appreciate your continued support and business..."
    ],
    instagram: [
      "Hi ${client.name}! Thanks for connecting with us on Instagram. We'd love to tell you more about ${client.product}.",
      "Hello there! We noticed you're interested in ${client.product}. Let us know if you'd like more information.",
      "Hi ${client.name}! We have some exciting news about ${client.product} we'd like to share with you."
    ],
    sms: [
      "Hi ${client.name}, thank you for your interest in ${client.product}. Please call us back at your convenience.",
      "Hello ${client.name}, we have a special offer waiting for you! Call us to learn more.",
      "Hi ${client.name}, just following up on our conversation. Let us know when you're available to chat."
    ]
  };

  const sendTemplate = (template) => {
    // Replace template variables with actual client data
    const processedTemplate = template.replace(/\${client\.([^}]+)}/g, (match, prop) => {
      return client[prop] || '';
    });

    // Logic for sending the message based on type
    switch (messageType) {
      case 'whatsapp':
        window.open(`https://wa.me/${client.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(processedTemplate)}`, '_blank');
        break;
      case 'email':
        const subject = processedTemplate.match(/Subject: ([^\n]*)/)?.[1] || 'Follow Up';
        const body = processedTemplate.replace(/Subject: [^\n]*\n\n/, '');
        window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        break;
      case 'sms':
        window.location.href = `sms:${client.mobile}?body=${encodeURIComponent(processedTemplate)}`;
        break;
      case 'instagram':
        // Copy to clipboard for Instagram, since direct messaging isn't easily done via URL
        navigator.clipboard.writeText(processedTemplate);
        alert('Message copied to clipboard. Ready to paste in Instagram.');
        break;
      default:
        console.error('Unknown message type');
    }

    setShowMessageTemplates(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  // Client response icons and labels
  const CLIENT_RESPONSE_OPTIONS = [
    { value: 'positive', label: 'Positive', icon: <FaSmile className="text-green-500" /> },
    { value: 'negative', label: 'Negative', icon: <FaFrown className="text-red-500" /> },
    { value: 'callback-later', label: 'Call Back Later', icon: <FaClock className="text-yellow-500" /> },
    { value: 'not-received-call', label: 'Not Received Call', icon: <FaPhoneSlash className="text-gray-500" /> },
  ];

  // Client source options for finding clients
  const CLIENT_SOURCE_OPTIONS = [
    { value: 'facebook', label: 'Facebook', icon: <FaFacebook className="text-blue-600" /> },
    { value: 'instagram', label: 'Instagram', icon: <FaInstagram className="text-purple-600" /> },
    { value: 'twitter', label: 'Twitter', icon: <FaTwitter className="text-blue-400" /> },
    { value: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin className="text-blue-700" /> },
    { value: 'google', label: 'Google Search', icon: <FaGoogle className="text-red-500" /> },
    { value: 'website', label: 'Website', icon: <FaGlobe className="text-blue-500" /> },
    { value: 'referral', label: 'Referral', icon: <FaHandshake className="text-green-600" /> },
    { value: 'marketplace', label: 'Marketplace', icon: <FaStore className="text-orange-500" /> },
  ];

  // First time approach options
  const APPROACH_OPTIONS = [
    { value: 'call', label: 'Phone Call', icon: <FaPhoneAlt className="text-green-600" /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="text-green-600" /> },
    { value: 'email', label: 'Email', icon: <FaEnvelope className="text-blue-600" /> },
    { value: 'instagram-dm', label: 'Instagram DM', icon: <FaInstagram className="text-purple-600" /> },
    { value: 'facebook-dm', label: 'Facebook DM', icon: <FaFacebook className="text-blue-600" /> },
    { value: 'in-person', label: 'In Person', icon: <FaHandshake className="text-orange-600" /> },
  ];

  // Payment options
  const PAYMENT_OPTIONS = [
    { value: 'cash', label: 'Cash', icon: <FaMoneyBillWave className="text-green-600" /> },
    { value: 'card', label: 'Credit/Debit Card', icon: <FaCreditCard className="text-blue-600" /> },
    { value: 'bank-transfer', label: 'Bank Transfer', icon: <FaMoneyCheck className="text-gray-600" /> },
    { value: 'online', label: 'Online Payment', icon: <FaPaypal className="text-blue-600" /> },
    { value: 'pending', label: 'Pending', icon: <FaClock className="text-yellow-600" /> },
  ];

  // Function to get icon for source
  const getSourceIcon = (source) => {
    const option = CLIENT_SOURCE_OPTIONS.find(opt => opt.value === source);
    return option ? option.icon : <FaGlobe className="text-gray-500" />;
  };

  // Function to get icon for approach method
  const getApproachIcon = (approach) => {
    const option = APPROACH_OPTIONS.find(opt => opt.value === approach);
    return option ? option.icon : null;
  };

  // Function to get icon for payment option
  const getPaymentIcon = (payment) => {
    const option = PAYMENT_OPTIONS.find(opt => opt.value === payment);
    return option ? option.icon : <FaMoneyBillWave className="text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-50 to-orange-100 p-3 md:p-6">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl mx-auto p-4 md:p-6 border border-orange-100">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition flex items-center justify-center"
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-orange-600">Client Details</h1>
          <div className="flex space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition flex items-center justify-center"
                  title="Edit"
                >
                  <FaEdit className="text-lg" />
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition flex items-center justify-center"
                  title="Delete"
                >
                  <FaTrash className="text-lg" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition flex items-center justify-center"
                  title="Save"
                >
                  <FaSave className="text-lg" />
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white p-2 rounded-full hover:bg-gray-600 transition flex items-center justify-center"
                  title="Cancel"
                >
                  <FaTimes className="text-lg" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 p-3 bg-orange-50 rounded-xl">
          <button
            onClick={handleCall}
            className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition flex items-center shadow-md transform hover:scale-105"
            disabled={!client.mobile}
          >
            <FaPhoneAlt className="mr-2" /> Call
          </button>
          <button
            onClick={handleWhatsApp}
            className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition flex items-center shadow-md transform hover:scale-105"
            disabled={!client.mobile}
          >
            <FaWhatsapp className="mr-2" /> WhatsApp
          </button>
          <button
            onClick={handleEmail}
            className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center shadow-md transform hover:scale-105"
            disabled={!client.email}
          >
            <FaEnvelope className="mr-2" /> Email
          </button>
          <button
            onClick={handleInstagram}
            className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition flex items-center shadow-md transform hover:scale-105"
            disabled={!client.instagramId}
          >
            <FaInstagram className="mr-2" /> Instagram
          </button>
          <button
            onClick={handleSMS}
            className="bg-blue-400 text-white px-4 py-2 rounded-full hover:bg-blue-500 transition flex items-center shadow-md transform hover:scale-105"
            disabled={!client.mobile}
          >
            <FaSms className="mr-2" /> SMS
          </button>
        </div>

        {/* Client Info Card */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border-l-4 border-orange-500">
          <div className="flex items-center space-x-3 mb-3">
            <div className="bg-orange-100 p-3 rounded-full">
              <FaUser className="text-orange-500 text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{client.name}</h2>
              <div className="flex items-center flex-wrap gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${client.status === 'approach'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                    }`}
                >
                  {client.status === 'approach' ? 'Approach' : 'Confirmed'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(client.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {client.findClientSource && (
                  <div className="flex items-center">
                    <span className="text-xs text-gray-600">Found via:</span>
                    <div className="ml-1">
                      {getSourceIcon(client.findClientSource)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Message Templates Modal */}
        {showMessageTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  {messageType === 'whatsapp' && "WhatsApp Templates"}
                  {messageType === 'email' && "Email Templates"}
                  {messageType === 'instagram' && "Instagram Templates"}
                  {messageType === 'sms' && "SMS Templates"}
                </h3>
                <button
                  onClick={() => setShowMessageTemplates(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messageTemplates[messageType]?.map((template, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg hover:bg-orange-50 cursor-pointer"
                    onClick={() => sendTemplate(template)}
                  >
                    <p className="text-sm whitespace-pre-line">{template.replace(/\${client\.([^}]+)}/g, (match, prop) => {
                      return client[prop] || '';
                    })}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Client Details Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Information */}
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-md font-bold text-orange-600 mb-3 border-b pb-2">Contact Information</h3>

            {/* Phone Number */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaPhoneAlt className="text-orange-500" />
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  name="mobile"
                  value={editedClient.mobile || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  placeholder="Mobile Number"
                />
              ) : (
                <span className="text-sm text-gray-800">{client.mobile}</span>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaEnvelope className="text-orange-500" />
              </div>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editedClient.email || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  placeholder="Email Address"
                />
              ) : (
                <span className="text-sm text-gray-800 break-all">{client.email}</span>
              )}
            </div>

            {/* Instagram ID */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaInstagram className="text-orange-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="instagramId"
                  value={editedClient.instagramId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  placeholder="Instagram ID"
                />
              ) : (
                <span className="text-sm text-gray-800">{client.instagramId}</span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaMapMarkerAlt className="text-orange-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="location"
                  value={editedClient.location || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  placeholder="Location"
                />
              ) : (
                <span className="text-sm text-gray-800">{client.location}</span>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-md font-bold text-orange-600 mb-3 border-b pb-2">Business Information</h3>

            {/* Business Type */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaBriefcase className="text-orange-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="businessType"
                  value={editedClient.businessType || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  placeholder="Business Type"
                />
              ) : (
                <span className="text-sm text-gray-800">{client.businessType}</span>
              )}
            </div>

            {/* Product */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaMoneyBillWave className="text-orange-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="product"
                  value={editedClient.product || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  placeholder="Product"
                />
              ) : (
                <span className="text-sm text-gray-800">{client.product}</span>
              )}
            </div>

            {/* Payment Option */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaCreditCard className="text-orange-500" />
              </div>
              {isEditing ? (
                <select
                  name="paymentOption"
                  value={editedClient.paymentOption || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                >
                  <option value="">Select Payment Method</option>
                  {PAYMENT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center">
                  {client.paymentOption && getPaymentIcon(client.paymentOption)}
                  <span className="ml-2 text-sm text-gray-800">
                    {PAYMENT_OPTIONS.find(p => p.value === client.paymentOption)?.label || 'Not specified'}
                  </span>
                </div>
              )}
            </div>

            {/* Client Response */}
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-full">
                <FaCommentAlt className="text-orange-500" />
              </div>
              {isEditing ? (
                <select
                  name="clientResponse"
                  value={editedClient.clientResponse || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                >
                  <option value="">Select Response</option>
                  {CLIENT_RESPONSE_OPTIONS.map((response) => (
                    <option key={response.value} value={response.value}>
                      {response.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center">
                  {CLIENT_RESPONSE_OPTIONS.find((r) => r.value === client.clientResponse)?.icon}
                  <span className="ml-2 text-sm text-gray-800">
                    {CLIENT_RESPONSE_OPTIONS.find((r) => r.value === client.clientResponse)?.label || 'Not specified'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Source and First Approach Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Client Source Information */}
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-md font-bold text-orange-600 mb-3 border-b pb-2">
              <div className="flex items-center">
                <FaGlobe className="mr-2 text-orange-500" />
                <span>Client Source</span>
              </div>
            </h3>

            {isEditing ? (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Where did you find this client?</label>
                <select
                  name="findClientSource"
                  value={editedClient.findClientSource || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                >
                  <option value="">Select Source</option>
                  {CLIENT_SOURCE_OPTIONS.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                  {client.findClientSource ?
                    getSourceIcon(client.findClientSource) :
                    <FaGlobe className="text-gray-400" />
                  }
                </div>
                <div className="ml-3">
                  <h4 className="text-xs text-gray-500">Client Found Via:</h4>
                  <p className="text-sm font-medium">
                    {CLIENT_SOURCE_OPTIONS.find(s => s.value === client.findClientSource)?.label || 'Not specified'}
                  </p>
                </div>
              </div>
            )}

            {/* Status & Date Added */}
            <div className="border-t pt-3">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <FaCalendar className="text-orange-500" />
                </div>
                {isEditing ? (
                  <select
                    name="status"
                    value={editedClient.status || 'approach'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                  >
                    <option value="approach">Approach</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                ) : (
                  <span className="text-sm text-gray-800">
                    {client.status === 'approach' ? 'Approach' : 'Confirmed'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* First Approach Information */}
          <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
            <h3 className="text-md font-bold text-orange-600 mb-3 border-b pb-2">
              <div className="flex items-center">
                <FaHandshake className="mr-2 text-orange-500" />
                <span>First Approach</span>
              </div>
            </h3>

            {isEditing ? (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">How did you approach this client?</label>
                <select
                  name="firstApproach"
                  value={editedClient.firstApproach || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
                >
                  <option value="">Select Approach</option>
                  {APPROACH_OPTIONS.map((approach) => (
                    <option key={approach.value} value={approach.value}>
                      {approach.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                  {client.firstApproach ?
                    getApproachIcon(client.firstApproach) :
                    <FaHandshake className="text-gray-400" />
                  }
                </div>
                <div className="ml-3">
                  <h4 className="text-xs text-gray-500">First Approach:</h4>
                  <p className="text-sm font-medium">
                    {APPROACH_OPTIONS.find(a => a.value === client.firstApproach)?.label || 'Not specified'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mt-4">
          <h3 className="text-md font-bold text-orange-600 mb-3 border-b pb-2">
            <div className="flex items-center">
              <FaCommentAlt className="mr-2 text-orange-500" />
              <span>Additional Notes</span>
            </div>
          </h3>

          {isEditing ? (
            <textarea
              name="notes"
              value={editedClient.notes || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm"
              placeholder="Add any additional notes here..."
              rows="4"
            />
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-line">
              {client.notes || 'No additional notes provided.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;