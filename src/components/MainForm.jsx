import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWhatsapp, FaDatabase, FaQuestionCircle, FaUser, 
         FaPhone, FaShoppingCart, FaMoneyBillWave, FaPaperPlane } from 'react-icons/fa';

const productCategories = [
  { 
    name: 'Direct Connect',
    basePrice: 1499,
    description: 'CRM Model for efficient customer management'
  },
  { 
    name: 'Digital Menu Card',
    basePrice: 2000,
    description: 'Digital menu solution for restaurants'
  },
  { 
    name: 'Web Services',
    basePrice: 15000,
    description: 'Custom web development solutions'
  }
];

function MainForm() {
  const [formData, setFormData] = useState({
    id: Date.now(),
    name: '',
    mobile: '',
    product: '',
    totalAmount: '',
    date: new Date().toISOString(),
    payments: [],
    notes: ''
  });

  const [allUsers, setAllUsers] = useState(() => JSON.parse(localStorage.getItem('users')) || []);
  const [showProductInfo, setShowProductInfo] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(allUsers));
  }, [allUsers]);

  const handleProductSelect = (product) => {
    setFormData({
      ...formData,
      product: product.name,
      totalAmount: product.basePrice.toString()
    });
    setSelectedProduct(product);
    setShowProductInfo(true);
  };

  const generateMessage = (data) => {
    const product = productCategories.find(p => p.name === data.product);
    
    return `🌟 Welcome to Webreich! 
    
Hi ${data.name},

Thank you for choosing our ${data.product}!

💼 Project Details:
• Service: ${data.product}
• Total Amount: ₹${data.totalAmount}

✨ Key Features:
${product.name === 'Direct Connect' ? 
  '• Advanced CRM functionality\n• Customer analytics\n• Automated workflows' :
  product.name === 'Digital Menu Card' ? 
  '• QR code integration\n• Real-time menu updates\n• Order tracking' :
  '• Responsive design\n• SEO optimization\n• Performance monitoring'}

🔥 Next Steps:
1. Our team will contact you shortly
2. Project timeline will be shared
3. Regular updates will be provided

🌐 Stay Connected:
Website: https://webreich.vercel.app
Instagram: https://www.instagram.com/webreich/
Contact: +91 8668722207, +91 9834153020

Thank you for trusting Webreich! We're excited to work with you! 🚀`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newUser = {
      ...formData,
      payments: [{
        amount: 0,
        date: new Date().toISOString(),
        note: 'Initial registration'
      }]
    };

    setAllUsers(prev => [...prev, newUser]);
    
    const message = generateMessage(newUser);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${newUser.mobile}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Reset form
    setFormData({
      id: Date.now(),
      name: '',
      mobile: '',
      product: '',
      totalAmount: '',
      date: new Date().toISOString(),
      payments: [],
      notes: ''
    });
    setShowProductInfo(false);
  };

  return (
    <div className="min-h-screen bg-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
            <h1 className="text-3xl font-bold text-center">Webreich CRM</h1>
            <p className="text-center mt-2 text-orange-100">Create new client profile</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FaUser className="inline mr-2" />Client Name
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
                  <FaPhone className="inline mr-2" />Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                <FaShoppingCart className="inline mr-2" />Select Product
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {productCategories.map((product) => (
                  <div
                    key={product.name}
                    onClick={() => handleProductSelect(product)}
                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                      formData.product === product.name
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    <p className="text-orange-600 font-semibold mt-2">₹{product.basePrice}</p>
                  </div>
                ))}
              </div>
            </div>

            {showProductInfo && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <FaMoneyBillWave className="inline mr-2" />Total Amount
                  </label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                    className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                    required
                  />
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

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
              >
                <FaWhatsapp className="mr-2" /> Send Welcome Message
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/data-saved')}
                className="flex-1 bg-orange-100 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center"
              >
                <FaDatabase className="mr-2" /> View All Clients
              </button>
            </div>
          </form>
        </div>

        {allUsers.length > 0 && (
          <div className="mt-6 text-center text-gray-600">
            <p>Total clients: {allUsers.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainForm;