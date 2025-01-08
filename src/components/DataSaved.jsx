import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FaSearch, FaDownload, FaTrashAlt, FaWhatsapp, FaEdit, 
         FaMoneyBillWave, FaFileInvoice, FaUserEdit, FaTimes, 
         FaCheckCircle, FaHistory } from 'react-icons/fa';

const UserCard = ({ user, onEdit, onDelete, onSendMessage }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const calculateRemainingAmount = () => {
    const totalPaid = user.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    return user.totalAmount - totalPaid;
  };

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-orange-200 hover:border-orange-300 transition-all">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer p-4 bg-gradient-to-r from-orange-50 to-orange-100"
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{user.name}</h3>
            <p className="text-sm text-gray-600">{user.mobile}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-orange-600">
              ₹{calculateRemainingAmount()} remaining
            </p>
            <p className="text-xs text-gray-500">of ₹{user.totalAmount}</p>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-orange-200">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm"><span className="font-semibold">Product:</span> {user.product}</p>
              <p className="text-sm"><span className="font-semibold">Start Date:</span> {formatDate(user.date)}</p>
            </div>
            <div>
              <p className="text-sm"><span className="font-semibold">Total Amount:</span> ₹{user.totalAmount}</p>
              <p className="text-sm"><span className="font-semibold">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  calculateRemainingAmount() === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                  {calculateRemainingAmount() === 0 ? 'Paid' : 'Pending'}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Payment History</h4>
            <div className="max-h-40 overflow-y-auto">
              {user.payments?.map((payment, index) => (
                <div key={index} className="text-sm bg-orange-50 p-2 mb-2 rounded">
                  <p>₹{payment.amount} paid on {formatDate(payment.date)}</p>
                  <p className="text-xs text-gray-600">{payment.note}</p>
                </div>
              )) || <p className="text-sm text-gray-500">No payment history available</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSendMessage(user, 'bill')}
              className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              <FaFileInvoice className="mr-1" /> Send Bill
            </button>
            <button
              onClick={() => onSendMessage(user, 'work')}
              className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              <FaCheckCircle className="mr-1" /> Work Update
            </button>
            <button
              onClick={() => onSendMessage(user, 'payment')}
              className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              <FaMoneyBillWave className="mr-1" /> Payment Reminder
            </button>
            <button
              onClick={() => onEdit(user)}
              className="flex items-center px-3 py-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              <FaEdit className="mr-1" /> Edit Details
            </button>
            <button
              onClick={() => onDelete(user.id)}
              className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              <FaTrashAlt className="mr-1" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const EditUserModal = ({ user, onSave, onClose }) => {
  const [editedUser, setEditedUser] = useState(user);
  const [newPayment, setNewPayment] = useState({ amount: '', date: '', note: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedUser);
  };

  const addPayment = () => {
    if (!newPayment.amount || !newPayment.date) return;
    
    setEditedUser(prev => ({
      ...prev,
      payments: [...(prev.payments || []), newPayment]
    }));
    
    setNewPayment({ amount: '', date: '', note: '' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Edit User Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={e => setEditedUser({...editedUser, name: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={editedUser.mobile}
                  onChange={e => setEditedUser({...editedUser, mobile: e.target.value})}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-300"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Add New Payment</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={newPayment.amount}
                  onChange={e => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                  className="p-2 border rounded"
                />
                <input
                  type="date"
                  value={newPayment.date}
                  onChange={e => setNewPayment({...newPayment, date: e.target.value})}
                  className="p-2 border rounded"
                />
                <button
                  type="button"
                  onClick={addPayment}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Add Payment
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function DataSaved() {
  const [allUsers, setAllUsers] = useState(() => JSON.parse(localStorage.getItem('users')) || []);
  const [filteredUsers, setFilteredUsers] = useState(allUsers);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const filtered = allUsers.filter(user => {
      const userDate = user.date ? new Date(user.date).toLocaleDateString() : '';
      const filterDate = selectedDate ? new Date(selectedDate).toLocaleDateString() : '';
      const matchesDate = filterDate ? userDate === filterDate : true;
      const searchLower = search.toLowerCase();
      
      return matchesDate && (
        user.name?.toLowerCase().includes(searchLower) ||
        user.mobile?.includes(search) ||
        user.product?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredUsers(filtered);
  }, [selectedDate, search, allUsers]);

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleSaveEdit = (editedUser) => {
    const updatedUsers = allUsers.map(u => 
      u.id === editedUser.id ? editedUser : u
    );
    setAllUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setEditingUser(null);
  };

  const handleDelete = (userId) => {
    const updatedUsers = allUsers.filter(user => user.id !== userId);
    setAllUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const generateMessage = (user, type) => {
    const remainingAmount = user.totalAmount - (user.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
    
    const messages = {
      bill: `Dear ${user.name},\n\nThank you for choosing Webreich! Here's your bill details:\nProduct: ${user.product}\nTotal Amount: ₹${user.totalAmount}\nPaid: ₹${user.totalAmount - remainingAmount}\nRemaining: ₹${remainingAmount}\n\nFor any queries, feel free to contact us.\n\nBest regards,\nWebreich Team`,
      
      work: `Dear ${user.name},\n\nWe're pleased to inform you that we've made significant progress on your ${user.product}. We'd love to share the updates with you and get your feedback.\n\nBest regards,\nWebreich Team`,
      
      payment: `Dear ${user.name},\n\nThis is a gentle reminder regarding the pending payment of ₹${remainingAmount} for ${user.product}.\n\nPaid amount: ₹${user.totalAmount - remainingAmount}\nTotal amount: ₹${user.totalAmount}\n\nKindly process the payment at your earliest convenience.\n\nBest regards,\nWebreich Team`
    };

    return messages[type];
  };

  const handleSendMessage = (user, messageType) => {
    const message = generateMessage(user, messageType);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=91${user.mobile}&text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-center text-orange-800 mb-8">Webreich CRM Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                placeholder="Search by name, mobile or product..."
              />
            </div>
            
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {filteredUsers.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSendMessage={handleSendMessage}
            />
          ))}
        </div>

        {editingUser && (
          <EditUserModal
            user={editingUser}
            onSave={handleSaveEdit}
            onClose={() => setEditingUser(null)}
          />
        )}
      </div>
    </div>
  );
}

export default DataSaved;