import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { database } from '../db/firebase.js';
import { ref, push, set } from 'firebase/database';
import { 
  FaWhatsapp, FaDatabase, FaUser, FaPhone, FaShoppingCart, 
  FaMoneyBillWave, FaPaperPlane, FaInstagram, FaEnvelope, 
  FaCheck, FaUserPlus, FaChevronDown, FaChevronUp
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';

const productCategories = [
  { 
    name: 'Direct Connect',
    basePrice: 1499,
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
    basePrice: 2000,
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
    basePrice: 15000,
    description: 'Custom web development solutions',
    features: [
      'Responsive design',
      'SEO optimization',
      'Performance monitoring',
      'Content management system',
      'E-commerce integration'
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
    totalAmount: '',
    date: new Date().toISOString(),
    status: 'approach', // Default status
    payments: [],
    notes: ''
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [messageType, setMessageType] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const navigate = useNavigate();

  const handleProductSelect = (product) => {
    setFormData({
      ...formData,
      product: product.name,
      totalAmount: product.basePrice.toString()
    });
    setSelectedProduct(product);
    setShowProductInfo(true);
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const generateApproachMessage = (data) => {
    const product = productCategories.find(p => p.name === data.product);
    
    return `🌟 Hello from Webreich! 
    
Hi ${data.name},

I noticed your business could benefit from our ${data.product} solution.

💼 Service Overview:
• ${data.product}: ₹${data.totalAmount}
• Custom tailored to your business needs

✨ Key Benefits:
${product?.features.map(feature => `• ${feature}`).join('\n')}

Would you be interested in discussing how this solution can help grow your business?

🌐 Learn more about us:
Website: https://webreich.vercel.app
Instagram: https://www.instagram.com/webreich/
Contact: +91 8668722207, +91 9834153020

Looking forward to connecting!

Regards,
Team Webreich`;
  };

  const generateConfirmMessage = (data) => {
    const product = productCategories.find(p => p.name === data.product);
    
    return `🚀 Welcome to Webreich! 
    
Dear ${data.name},

Thank you for choosing our ${data.product}!

💼 Project Details:
• Service: ${data.product}
• Total Amount: ₹${data.totalAmount}

✨ What's Included:
${product?.features.map(feature => `• ${feature}`).join('\n')}

🔥 Next Steps:
1. Our team will contact you within 24 hours
2. Project timeline will be shared
3. Regular updates will be provided

🌐 Stay Connected:
Website: https://webreich.vercel.app
Instagram: https://www.instagram.com/webreich/
Contact: +91 8668722207, +91 9834153020

Thank you for trusting Webreich! We're excited to work with you!

Best regards,
Team Webreich`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data for Firebase
      const newClient = {
        ...formData,
        payments: [{
          amount: 0,
          date: new Date().toISOString(),
          note: formData.status === 'approach' ? 'Initial approach' : 'Confirmed client'
        }]
      };
      
      // Save to Firebase
      const clientsRef = ref(database, 'clients');
      const newClientRef = push(clientsRef);
      await set(newClientRef, newClient);
      
      // Generate appropriate message based on status
      const message = formData.status === 'approach' 
        ? generateApproachMessage(newClient) 
        : generateConfirmMessage(newClient);
      
      // Open appropriate communication channel
      if (messageType === 'whatsapp' && formData.mobile) {
        window.open(`https://api.whatsapp.com/send?phone=91${formData.mobile}&text=${encodeURIComponent(message)}`, '_blank');
      } else if (messageType === 'email' && formData.email) {
        window.open(`mailto:${formData.email}?subject=Webreich - ${formData.product} Services&body=${encodeURIComponent(message)}`, '_blank');
      } else if (messageType === 'instagram' && formData.instagram) {
        window.open(`https://www.instagram.com/${formData.instagram.replace('@', '')}`, '_blank');
        // Note: Direct messaging isn't supported via URL in Instagram, so we just open their profile
      }
      
      // Reset form
      setFormData({
        id: Date.now(),
        name: '',
        mobile: '',
        email: '',
        instagram: '',
        location: '',
        product: '',
        totalAmount: '',
        date: new Date().toISOString(),
        status: 'approach',
        payments: [],
        notes: ''
      });
      setShowProductInfo(false);
      setSelectedProduct(null);
      
      // Show success message
      alert("Client saved successfully!");
      
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error saving client: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white">
            <h1 className="text-3xl font-bold text-center">Webreich CRM</h1>
            <p className="text-center mt-2 text-orange-100">Client Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Client Information Section */}
            <div className="border border-orange-200 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-orange-100 cursor-pointer"
                onClick={() => toggleSection('clientInfo')}
              >
                <h2 className="font-semibold text-orange-800 flex items-center">
                  <FaUser className="mr-2" /> Client Information
                </h2>
                {expandedSection === 'clientInfo' ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {(expandedSection === 'clientInfo' || expandedSection === null) && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FaUser className="inline mr-2" />Client Name*
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                      required
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
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
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
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FaInstagram className="inline mr-2" />Instagram
                    </label>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                      placeholder="@username"
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
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                      placeholder="City, State"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Product Selection Section */}
            <div className="border border-orange-200 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-orange-100 cursor-pointer"
                onClick={() => toggleSection('productInfo')}
              >
                <h2 className="font-semibold text-orange-800 flex items-center">
                  <FaShoppingCart className="mr-2" /> Product Selection
                </h2>
                {expandedSection === 'productInfo' ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {(expandedSection === 'productInfo' || expandedSection === null) && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {productCategories.map((product) => (
                      <div
                        key={product.name}
                        onClick={() => handleProductSelect(product)}
                        className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                          formData.product === product.name
                            ? 'border-orange-500 bg-orange-50 shadow-md'
                            : 'border-gray-200 hover:border-orange-300 hover:shadow'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        <p className="text-orange-600 font-semibold mt-2">₹{product.basePrice}</p>
                        
                        {formData.product === product.name && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Features:</p>
                            <ul className="text-xs text-gray-600">
                              {product.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-start mb-1">
                                  <span className="inline-block text-orange-500 mr-1">•</span> {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {showProductInfo && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <FaMoneyBillWave className="inline mr-2" />Total Amount*
                        </label>
                        <input
                          type="number"
                          value={formData.totalAmount}
                          onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                          className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Additional Information Section */}
            <div className="border border-orange-200 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-orange-100 cursor-pointer"
                onClick={() => toggleSection('additionalInfo')}
              >
                <h2 className="font-semibold text-orange-800 flex items-center">
                  <FaPaperPlane className="mr-2" /> Additional Information
                </h2>
                {expandedSection === 'additionalInfo' ? <FaChevronUp /> : <FaChevronDown />}
              </div>
              
              {(expandedSection === 'additionalInfo' || expandedSection === null) && (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Status
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                          formData.status === 'approach'
                            ? 'border-orange-500 bg-orange-50 shadow'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => setFormData({...formData, status: 'approach'})}
                      >
                        <FaUserPlus className="inline mr-2" />
                        <span>Approach Client</span>
                      </div>
                      
                      <div
                        className={`cursor-pointer p-3 rounded-lg border-2 text-center transition-all ${
                          formData.status === 'confirmed'
                            ? 'border-orange-500 bg-orange-50 shadow'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => setFormData({...formData, status: 'confirmed'})}
                      >
                        <FaCheck className="inline mr-2" />
                        <span>Confirmed Client</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Message Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        className={`cursor-pointer p-2 rounded-lg border-2 text-center transition-all ${
                          messageType === 'whatsapp'
                            ? 'border-orange-500 bg-orange-50 shadow'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => setMessageType('whatsapp')}
                      >
                        <FaWhatsapp className="text-green-500 inline mr-1" />
                        <span>WhatsApp</span>
                      </div>
                      
                      <div
                        className={`cursor-pointer p-2 rounded-lg border-2 text-center transition-all ${
                          messageType === 'email'
                            ? 'border-orange-500 bg-orange-50 shadow'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => setMessageType('email')}
                      >
                        <FaEnvelope className="text-blue-500 inline mr-1" />
                        <span>Email</span>
                      </div>
                      
                      <div
                        className={`cursor-pointer p-2 rounded-lg border-2 text-center transition-all ${
                          messageType === 'instagram'
                            ? 'border-orange-500 bg-orange-50 shadow'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => setMessageType('instagram')}
                      >
                        <FaInstagram className="text-pink-500 inline mr-1" />
                        <span>Instagram</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <FaPaperPlane className="inline mr-2" />Additional Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                      rows="3"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={loading || !formData.name || !formData.mobile || !formData.product || !formData.totalAmount}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    {formData.status === 'approach' ? (
                      <>
                        <FaUserPlus className="mr-2" /> Approach Client
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" /> Confirm Client
                      </>
                    )}
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/data-saved')}
                className="flex-1 bg-orange-100 text-orange-700 py-3 px-4 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center"
              >
                <FaDatabase className="mr-2" /> View All Clients
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MainForm;