import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { ref, push } from 'firebase/database';
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaInstagram,
  FaBriefcase,
  FaSave,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaSmile,
  FaFrown,
  FaPhoneSlash,
  FaClock,
} from 'react-icons/fa';

const AddClient = () => {
  const navigate = useNavigate();
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);
  const [clientData, setClientData] = useState({
    name: '',
    mobile: '',
    email: '',
    instagramId: '',
    location: '',
    businessType: '',
    firstTimeApproach: [],
    findClientSource: '',
    paymentOption: '',
    product: '',
    status: 'approach',
    date: new Date().toISOString(),
    notes: '',
    clientResponse: '', // New field for client response
  });

  // Product options
  const PRODUCT_OPTIONS = [
    { value: 'orderqr', label: 'OrderQR for Hotels' },
    { value: 'crm-normal', label: 'CRM Normal' },
    { value: 'civil-crm', label: 'Civil CRM' },
    { value: 'web-services', label: 'Web Services' },
    { value: 'web-apps', label: 'Web Apps' },
  ];

  // First time approach options
  const APPROACH_OPTIONS = [
    'Call',
    'Message',
    'WhatsApp',
    'Instagram',
    'Facebook',
    'Email',
    'Other',
  ];

  // Find client source options
  const FIND_CLIENT_SOURCE_OPTIONS = [
    'Instagram',
    'WhatsApp',
    'Local Market',
    'Referral',
    'Social Media',
    'Other',
  ];

  // Client response options
  const CLIENT_RESPONSE_OPTIONS = [
    { value: 'positive', label: 'Happy', icon: <FaSmile className="text-green-500" /> },
    { value: 'negative', label: 'Sad', icon: <FaFrown className="text-red-500" /> },
    { value: 'callback-later', label: 'CBL', icon: <FaClock className="text-yellow-500" /> },
    { value: 'not-received-call', label: 'CNR', icon: <FaPhoneSlash className="text-gray-500" /> },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle checkbox group for first time approach
    if (name === 'firstTimeApproach') {
      setClientData((prev) => {
        const currentApproaches = prev.firstTimeApproach || [];
        if (checked) {
          return { ...prev, firstTimeApproach: [...currentApproaches, value] };
        } else {
          return {
            ...prev,
            firstTimeApproach: currentApproaches.filter((approach) => approach !== value),
          };
        }
      });
    } else {
      setClientData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const clientsRef = ref(database, 'clients');
      await push(clientsRef, clientData);

      alert('Client added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding client:', error);
      alert('Failed to add client. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 flex justify-center items-center">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-xl p-6 border border-orange-100">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600">Add New Client</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-gray-700 flex items-center">
                <FaUser className="mr-2 text-orange-500" />
                Client Name
              </label>
              <input
                type="text"
                name="name"
                value={clientData.name}
                onChange={handleInputChange}
                placeholder="Enter client name"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-700 flex items-center">
                <FaPhoneAlt className="mr-2 text-orange-500" />
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile"
                value={clientData.mobile}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label className="block mb-2 text-gray-700">Product</label>
            <select
              name="product"
              value={clientData.product}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">Select Product</option>
              {PRODUCT_OPTIONS.map((product) => (
                <option key={product.value} value={product.value}>
                  {product.label}
                </option>
              ))}
            </select>
          </div>

          {/* Client Response */}
          <div>
            <label className="block mb-2 text-gray-700">Client Response</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CLIENT_RESPONSE_OPTIONS.map((response) => (
                <label
                  key={response.value}
                  className="flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-orange-50 transition"
                >
                  <input
                    type="radio"
                    name="clientResponse"
                    value={response.value}
                    checked={clientData.clientResponse === response.value}
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <div
                    className={`flex flex-col items-center ${
                      clientData.clientResponse === response.value ? 'text-orange-500' : 'text-gray-500'
                    }`}
                  >
                    {response.icon}
                    <span className="mt-1 text-sm">{response.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <div
            onClick={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
            className="flex items-center justify-between cursor-pointer bg-orange-50 p-3 rounded-lg"
          >
            <span className="font-semibold text-orange-600">Advanced Options</span>
            {isAdvancedOptionsOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>

          {/* Advanced Options */}
          {isAdvancedOptionsOpen && (
            <div className="space-y-4 bg-orange-50 p-4 rounded-lg">
              {/* Email */}
              <div>
                <label className="block mb-2 text-gray-700 flex items-center">
                  <FaEnvelope className="mr-2 text-orange-500" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={clientData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Instagram ID */}
              <div>
                <label className="block mb-2 text-gray-700 flex items-center">
                  <FaInstagram className="mr-2 text-orange-500" />
                  Instagram ID
                </label>
                <input
                  type="text"
                  name="instagramId"
                  value={clientData.instagramId}
                  onChange={handleInputChange}
                  placeholder="Enter Instagram handle"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block mb-2 text-gray-700 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-orange-500" />
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={clientData.location}
                  onChange={handleInputChange}
                  placeholder="Enter client location"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block mb-2 text-gray-700 flex items-center">
                  <FaBriefcase className="mr-2 text-orange-500" />
                  Business Type
                </label>
                <input
                  type="text"
                  name="businessType"
                  value={clientData.businessType}
                  onChange={handleInputChange}
                  placeholder="Enter business type"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* First Time Approach */}
              <div>
                <label className="block mb-2 text-gray-700">First Time Approach</label>
                <div className="grid grid-cols-3 gap-2">
                  {APPROACH_OPTIONS.map((approach) => (
                    <label key={approach} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name="firstTimeApproach"
                        value={approach}
                        checked={clientData.firstTimeApproach.includes(approach)}
                        onChange={handleInputChange}
                        className="form-checkbox text-orange-500"
                      />
                      <span className="ml-2">{approach}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Find Client Source */}
              <div>
                <label className="block mb-2 text-gray-700">Find Client Source</label>
                <select
                  name="findClientSource"
                  value={clientData.findClientSource}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Source</option>
                  {FIND_CLIENT_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Option */}
              <div>
                <label className="block mb-2 text-gray-700">Payment Option</label>
                <select
                  name="paymentOption"
                  value={clientData.paymentOption}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select Payment Option</option>
                  <option value="full-payment">Full Payment</option>
                  <option value="partial-payment">Partial Payment</option>
                  <option value="installment">Installment</option>
                  <option value="free">Free</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block mb-2 text-gray-700">Additional Notes</label>
                <textarea
                  name="notes"
                  value={clientData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center"
            >
              <FaTimes className="mr-2" /> Cancel
            </button>
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center"
            >
              <FaSave className="mr-2" /> Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClient;