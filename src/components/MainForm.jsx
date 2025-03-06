import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { ref, push, set } from 'firebase/database';
import { 
  FaUser, FaPhone, FaShoppingCart, 
  FaEnvelope, FaDatabase, FaChevronDown, FaChevronUp 
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';

const productCategories = [
  { 
    name: 'Direct Connect',
    description: 'CRM Model for efficient customer management',
    features: [
      'Advanced CRM functionality',
      'Customer analytics',
      'Automated workflows',
      'Client management',
      'Payment tracking'
    ]
  },
  { 
    name: 'Digital Menu Card',
    description: 'Digital menu solution for restaurants',
    features: [
      'QR code integration',
      'Real-time menu updates',
      'Order tracking',
      'Digital payments',
      'Customer feedback'
    ]
  },
  { 
    name: 'Web Services',
    description: 'Custom web development solutions',
    features: [
      'Responsive design',
      'SEO optimization',
      'Performance monitoring',
      'Content management system',
      'E-commerce integration'
    ]
  },
  { 
    name: 'Civil CRM',
    description: 'Comprehensive CRM solution for civil engineering firms',
    features: [
      'Project management',
      'Client communication tracking',
      'Proposal generation',
      'Resource allocation',
      'Financial reporting'
    ]
  }
];

function MainForm() {
  const [formData, setFormData] = useState({
    id: Date.now(),
    name: '',
    mobile: '',
    email: '',
    instagram: '',
    location: '',
    product: '',
    date: new Date().toISOString(),
    status: 'approach',
    notes: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const navigate = useNavigate();

  const handleProductSelect = (product) => {
    setFormData({
      ...formData,
      product: product.name
    });
    setSelectedProduct(product);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number is required
    if (!formData.mobile) {
      alert("Mobile number is required!");
      return;
    }

    setLoading(true);
    
    try {
      // Prepare data for Firebase
      const newClient = {
        ...formData
      };
      
      // Save to Firebase
      const clientsRef = ref(database, 'clients');
      const newClientRef = push(clientsRef);
      await set(newClientRef, newClient);
      
      // Reset form
      setFormData({
        id: Date.now(),
        name: '',
        mobile: '',
        email: '',
        instagram: '',
        location: '',
        product: '',
        date: new Date().toISOString(),
        status: 'approach',
        notes: ''
      });
      
      // Show success message
      alert("Client details saved successfully!");
      
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error saving client: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-100 cursor-pointer"
              onClick={() => toggleSection('clientInfo')}
            >
              <h2 className="font-semibold text-gray-800 flex items-center">
                <FaUser className="mr-2" /> Client Information
              </h2>
              {expandedSection === 'clientInfo' ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {(expandedSection === 'clientInfo' || expandedSection === null) && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <FaUser className="inline mr-2" />Client Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <FaPhone className="inline mr-2" />Mobile Number*
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <FaEnvelope className="inline mr-2" />Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <MdLocationOn className="inline mr-2" />Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                    placeholder="City, State"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Product Selection Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-100 cursor-pointer"
              onClick={() => toggleSection('productInfo')}
            >
              <h2 className="font-semibold text-gray-800 flex items-center">
                <FaShoppingCart className="mr-2" /> Product Selection
              </h2>
              {expandedSection === 'productInfo' ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {(expandedSection === 'productInfo' || expandedSection === null) && (
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {productCategories.map((product) => (
                    <div
                      key={product.name}
                      onClick={() => handleProductSelect(product)}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                        formData.product === product.name
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      
                      {formData.product === product.name && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Features:</p>
                          <ul className="text-xs text-gray-600">
                            {product.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-start mb-1">
                                <span className="inline-block text-blue-500 mr-1">•</span> {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Notes Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-100 cursor-pointer"
              onClick={() => toggleSection('additionalInfo')}
            >
              <h2 className="font-semibold text-gray-800 flex items-center">
                Additional Notes
              </h2>
              {expandedSection === 'additionalInfo' ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {(expandedSection === 'additionalInfo' || expandedSection === null) && (
              <div className="p-4">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  rows="3"
                  placeholder="Add any additional notes..."
                />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={loading || !formData.mobile}
              className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Client Details'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/data-saved')}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <FaDatabase className="mr-2" /> View All Clients
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainForm;