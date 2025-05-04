import React, { useState, useEffect } from 'react';
import { database } from '../db/firebase.js';
import { onValue, ref, push, set, remove, update } from 'firebase/database';
import {
    FaPlus,
    FaBuilding,
    FaPhone,
    FaWhatsapp,
    FaSave,
    FaTimes,
    FaEdit,
    FaTrashAlt,
    FaChevronDown,
    FaChevronUp,
    FaSearch,
    FaCopy,
    FaLanguage,
    FaUserAlt,
    FaSms
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function ScriptPage() {
    const [scripts, setScripts] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientLoading, setClientLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentScriptId, setCurrentScriptId] = useState(null);
    const [formData, setFormData] = useState({
        serviceName: '',
        messageScript: '',
        language: 'english' // Default language
    });
    const [scriptSearchTerm, setScriptSearchTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [expandedScripts, setExpandedScripts] = useState({});
    const [expandedClients, setExpandedClients] = useState({});
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null });
    const [selectedScriptForClient, setSelectedScriptForClient] = useState({});
    const [sendingMessage, setSendingMessage] = useState(false);
    const [messageSent, setMessageSent] = useState({});

    // Languages available
    const languages = [
        { id: 'english', name: 'English' },
        { id: 'hindi', name: 'Hindi' }
    ];

    // Fetch scripts from Firebase
    useEffect(() => {
        const scriptsRef = ref(database, 'scripts');

        const unsubscribe = onValue(scriptsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const scriptsList = Object.entries(data).map(([id, values]) => ({
                    id,
                    ...values,
                    language: values.language || 'english' // Ensure language property exists
                }));
                setScripts(scriptsList);
            } else {
                setScripts([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching scripts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Fetch clients from Firebase
    useEffect(() => {
        const clientsRef = ref(database, 'clients');

        const unsubscribe = onValue(clientsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const clientsList = Object.entries(data)
                    .map(([id, values]) => ({
                        id,
                        ...values
                    }))
                    .reverse(); // Reverse the order to show new clients on top
                setClients(clientsList);
            } else {
                setClients([]);
            }
            setClientLoading(false);
        }, (error) => {
            console.error("Error fetching clients:", error);
            setClientLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Reset form to default values
    const resetForm = () => {
        setFormData({
            serviceName: '',
            messageScript: '',
            language: 'english'
        });
        setIsEditing(false);
        setCurrentScriptId(null);
        setShowForm(false);
    };

    // Handle form submission (for both add and edit)
    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.serviceName.trim() || !formData.messageScript.trim()) {
            alert('Please fill in all fields');
            return;
        }

        if (isEditing && currentScriptId) {
            // Update existing script
            const scriptRef = ref(database, `scripts/${currentScriptId}`);

            update(scriptRef, {
                serviceName: formData.serviceName,
                messageScript: formData.messageScript,
                language: formData.language,
                updatedAt: new Date().toISOString()
            })
                .then(() => {
                    resetForm();
                    // Show success notification
                    showNotification('Script updated successfully!');
                })
                .catch((error) => {
                    console.error("Error updating script:", error);
                    alert('Failed to update script. Please try again.');
                });
        } else {
            // Save new script to Firebase
            const scriptsRef = ref(database, 'scripts');
            const newScriptRef = push(scriptsRef);

            set(newScriptRef, {
                serviceName: formData.serviceName,
                messageScript: formData.messageScript,
                language: formData.language,
                createdAt: new Date().toISOString()
            })
                .then(() => {
                    resetForm();
                    // Show success notification
                    showNotification('Script saved successfully!');
                })
                .catch((error) => {
                    console.error("Error saving script:", error);
                    alert('Failed to save script. Please try again.');
                });
        }
    };

    // Edit script
    const handleEditScript = (script) => {
        setFormData({
            serviceName: script.serviceName || script.businessType, // For backward compatibility
            messageScript: script.messageScript,
            language: script.language || 'english'
        });
        setIsEditing(true);
        setCurrentScriptId(script.id);
        setShowForm(true);

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Show delete confirmation
    const showDeleteConfirmation = (id, e) => {
        e.stopPropagation();
        setDeleteConfirmation({ show: true, id });
    };

    // Delete script
    const handleDeleteScript = () => {
        if (!deleteConfirmation.id) return;

        const scriptRef = ref(database, `scripts/${deleteConfirmation.id}`);

        remove(scriptRef)
            .then(() => {
                setDeleteConfirmation({ show: false, id: null });
                showNotification('Script deleted successfully!');
            })
            .catch((error) => {
                console.error("Error deleting script:", error);
                alert('Failed to delete script. Please try again.');
            });
    };

    // Temporary notification system
    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
        notification.innerText = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('animate-fadeOut');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    };

    // Filter scripts based on search term
    const filteredScripts = scripts.filter(script => {
        const searchField = script.serviceName || script.businessType; // For backward compatibility
        return searchField.toLowerCase().includes(scriptSearchTerm.toLowerCase());
    });

    // Filter clients based on search term
    const filteredClients = clients.filter(client => {
        const nameMatch = client.name?.toLowerCase().includes(clientSearchTerm.toLowerCase());
        const mobileMatch = client.mobile?.toLowerCase().includes(clientSearchTerm.toLowerCase());
        return nameMatch || mobileMatch;
    });

    // Toggle script expansion
    const toggleExpandScript = (id, e) => {
        e.stopPropagation();
        setExpandedScripts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Toggle client expansion
    const toggleExpandClient = (id) => {
        setExpandedClients(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Copy script to clipboard
    const copyToClipboard = (text, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    // Handle script selection for a client
    const handleScriptSelect = (clientId, scriptId) => {
        setSelectedScriptForClient(prev => ({
            ...prev,
            [clientId]: scriptId
        }));
    };

    // Send WhatsApp message
    const sendWhatsAppMessage = (clientId, phone) => {
        const scriptId = selectedScriptForClient[clientId];
        if (!scriptId) {
            showNotification('Please select a script first!');
            return;
        }

        const script = scripts.find(s => s.id === scriptId);
        if (!script) {
            showNotification('Selected script not found!');
            return;
        }

        // Format phone number (remove any non-digit characters)
        const formattedPhone = phone.replace(/\D/g, '');

        // Check if the phone number is valid
        if (!formattedPhone || formattedPhone.length < 10) {
            showNotification('Invalid phone number!');
            return;
        }

        // Set message sending state
        setSendingMessage(true);

        // Mark as sent for UI feedback
        setMessageSent(prev => ({
            ...prev,
            [clientId]: true
        }));

        // Use WhatsApp API to send message
        const message = encodeURIComponent(script.messageScript);
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;

        // Open WhatsApp in a new tab
        window.open(whatsappUrl, '_blank');

        // Reset sending state
        setTimeout(() => {
            setSendingMessage(false);

            // Reset sent state after 5 seconds
            setTimeout(() => {
                setMessageSent(prev => ({
                    ...prev,
                    [clientId]: false
                }));
            }, 5000);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-3 md:p-5">
            <div className="container mx-auto max-w-4xl">
                <Link
                    to="/"
                    className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition shadow-md mb-4 text-sm"
                >
                    <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span>Back</span>
                </Link>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <h1 className="text-2xl font-bold text-orange-700 mb-3 md:mb-0">Message Scripts</h1>
                    <button
                        onClick={() => {
                            if (showForm && isEditing) {
                                resetForm();
                            } else {
                                setShowForm(!showForm);
                            }
                        }}
                        className={`${showForm
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700'
                            } text-white px-3 py-2 rounded-lg transition shadow-md flex items-center text-sm`}
                    >
                        {showForm ? (
                            <>
                                <FaTimes className="mr-1" /> Cancel
                            </>
                        ) : (
                            <>
                                <FaPlus className="mr-1" /> Add New Script
                            </>
                        )}
                    </button>
                </div>

                {/* Add/Edit Script Form */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-lg mb-6 p-4 border border-orange-200 animate-fadeIn">
                        <h2 className="text-lg font-semibold text-orange-600 mb-3 flex items-center">
                            {isEditing ? (
                                <>
                                    <FaEdit className="mr-2" /> Edit Script
                                </>
                            ) : (
                                <>
                                    <FaPlus className="mr-2" /> Add New Script
                                </>
                            )}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 flex items-center text-sm">
                                        <FaBuilding className="mr-2 text-orange-500" /> Service Name*
                                    </label>
                                    <input
                                        type="text"
                                        name="serviceName"
                                        value={formData.serviceName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Salon Services, Car Repair..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 flex items-center text-sm">
                                        <FaLanguage className="mr-2 text-orange-500" /> Language*
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="language"
                                            value={formData.language}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 appearance-none text-sm"
                                            required
                                        >
                                            {languages.map(lang => (
                                                <option key={lang.id} value={lang.id}>
                                                    {lang.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <FaChevronDown className="text-gray-500" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-1 flex items-center text-sm">
                                        <FaSms className="mr-2 text-orange-500" /> Message Script*
                                    </label>
                                    <textarea
                                        name="messageScript"
                                        value={formData.messageScript}
                                        onChange={handleInputChange}
                                        placeholder="Enter your message script here..."
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 text-sm"
                                        required
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition shadow-md flex items-center text-sm"
                                    >
                                        <FaSave className="mr-2" /> {isEditing ? 'Update Script' : 'Save Script'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Scripts and Clients Tabs */}
                <div className="mb-5">
                    <ul className="flex bg-white rounded-lg p-1 shadow-md">
                        <li className="flex-1">
                            <button
                                className="w-full py-2 px-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg font-medium"
                                onClick={() => document.getElementById('scriptsSection').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Message Scripts
                            </button>
                        </li>
                        <li className="flex-1">
                            <button
                                className="w-full py-2 px-4 text-orange-700 hover:bg-orange-50 rounded-lg font-medium"
                                onClick={() => document.getElementById('clientsSection').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Client Messages
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Scripts Section */}
                <div id="scriptsSection" className="mb-8">
                    <div className="bg-white rounded-lg shadow-md p-3 mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search scripts by service name..."
                                value={scriptSearchTerm}
                                onChange={(e) => setScriptSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-sm"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" />
                            {scriptSearchTerm && (
                                <FaTimes
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 cursor-pointer"
                                    onClick={() => setScriptSearchTerm('')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Script List */}
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500"></div>
                        </div>
                    ) : filteredScripts.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl shadow-md">
                            <FaSms className="w-12 h-12 mx-auto text-orange-300 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Scripts Found</h3>
                            <p className="text-gray-500 mb-4 text-sm">
                                {scriptSearchTerm
                                    ? `No scripts matching "${scriptSearchTerm}"`
                                    : "You haven't added any scripts yet."}
                            </p>
                            <button
                                onClick={() => {
                                    setShowForm(true);
                                    setScriptSearchTerm('');
                                }}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition inline-flex items-center text-sm"
                            >
                                <FaPlus className="mr-2" /> Add Your First Script
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 mb-6">
                            {filteredScripts.map((script) => {
                                const serviceName = script.serviceName || script.businessType;
                                return (
                                    <div
                                        key={script.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden border border-orange-100 hover:shadow-lg transition"
                                    >
                                        <div className="p-3 cursor-pointer flex justify-between items-center bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700"
                                            onClick={(e) => toggleExpandScript(script.id, e)}>
                                            <div className="flex items-center">
                                                <FaBuilding className="mr-2 text-orange-500" />
                                                <h3 className="font-semibold">{serviceName}</h3>
                                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-orange-200 text-orange-800">
                                                    {languages.find(l => l.id === script.language)?.name || 'English'}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <button
                                                    className="p-1.5 rounded-full text-orange-600 hover:bg-orange-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditScript(script);
                                                    }}
                                                    title="Edit Script"
                                                >
                                                    <FaEdit className="text-sm" />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-full text-orange-600 hover:bg-orange-200"
                                                    onClick={(e) => showDeleteConfirmation(script.id, e)}
                                                    title="Delete Script"
                                                >
                                                    <FaTrashAlt className="text-sm" />
                                                </button>
                                                <button
                                                    className="p-1.5 rounded-full text-orange-600 hover:bg-orange-200"
                                                    onClick={(e) => toggleExpandScript(script.id, e)}
                                                    title={expandedScripts[script.id] ? "Show Less" : "Show More"}
                                                >
                                                    {expandedScripts[script.id] ?
                                                        <FaChevronUp className="text-sm" /> :
                                                        <FaChevronDown className="text-sm" />}
                                                </button>
                                            </div>
                                        </div>

                                        {expandedScripts[script.id] && (
                                            <div className="p-3 border-t border-orange-100 animate-fadeIn">
                                                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium text-amber-700 flex items-center text-sm">
                                                            <FaSms className="mr-2" /> Message Script
                                                        </h4>
                                                        <button
                                                            onClick={(e) => copyToClipboard(script.messageScript, e)}
                                                            className="text-amber-500 hover:text-amber-700 p-1"
                                                            title="Copy to clipboard"
                                                        >
                                                            <FaCopy className="text-sm" />
                                                        </button>
                                                    </div>
                                                    <div className="text-gray-700 whitespace-pre-line text-sm">
                                                        {script.messageScript}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Clients Section */}
                <div id="clientsSection" className="mb-8">
                    <h2 className="text-xl font-bold text-orange-700 mb-3">Client Messages</h2>

                    <div className="bg-white rounded-lg shadow-md p-3 mb-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search clients by name or mobile..."
                                value={clientSearchTerm}
                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 text-sm"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" />
                            {clientSearchTerm && (
                                <FaTimes
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 cursor-pointer"
                                    onClick={() => setClientSearchTerm('')}
                                />
                            )}
                        </div>
                    </div>

                    {/* Client List */}
                    {clientLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-orange-500"></div>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl shadow-md">
                            <FaUserAlt className="w-12 h-12 mx-auto text-orange-300 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Clients Found</h3>
                            <p className="text-gray-500 text-sm">
                                {clientSearchTerm
                                    ? `No clients matching "${clientSearchTerm}"`
                                    : "No clients in your database."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="bg-white rounded-lg shadow-md overflow-hidden border border-orange-100 hover:shadow-lg transition"
                                >
                                    <div
                                        className="p-3 cursor-pointer flex justify-between items-center"
                                        onClick={() => toggleExpandClient(client.id)}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center">
                                            <div className="flex items-center">
                                                <FaUserAlt className="mr-2 text-orange-500" />
                                                <h3 className="font-semibold">{client.name}</h3>
                                            </div>
                                            <div className="flex items-center mt-1 md:mt-0 md:ml-4">
                                                <FaPhone className="mr-2 text-orange-500" />
                                                <span className="text-sm text-gray-600">{client.mobile}</span>
                                            </div>
                                        </div>

                                        <button
                                            className="p-1.5 rounded-full text-orange-600 hover:bg-orange-200"
                                            onClick={() => toggleExpandClient(client.id)}
                                            title={expandedClients[client.id] ? "Hide Message Options" : "Show Message Options"}
                                        >
                                            {expandedClients[client.id] ?
                                                <FaChevronUp className="text-sm" /> :
                                                <FaChevronDown className="text-sm" />}
                                        </button>
                                    </div>

                                    {expandedClients[client.id] && (
                                        <div className="p-3 border-t border-orange-100 animate-fadeIn">
                                            <div className="flex flex-col space-y-3">
                                                <div className="relative">
                                                    <label className="block text-gray-700 font-medium mb-1 text-sm">Select Script</label>
                                                    <select
                                                        value={selectedScriptForClient[client.id] || ""}
                                                        onChange={(e) => handleScriptSelect(client.id, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 appearance-none text-sm"
                                                    >
                                                        <option value="">-- Select a script --</option>
                                                        {scripts.map(script => (
                                                            <option key={script.id} value={script.id}>
                                                                {script.serviceName || script.businessType} ({languages.find(l => l.id === script.language)?.name})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none mt-6">
                                                        <FaChevronDown className="text-gray-500" />
                                                    </div>
                                                </div>

                                                {selectedScriptForClient[client.id] && (
                                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                        <h4 className="font-medium text-sm mb-2">Preview:</h4>
                                                        <p className="text-sm text-gray-600 whitespace-pre-line">
                                                            {scripts.find(s => s.id === selectedScriptForClient[client.id])?.messageScript}
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => sendWhatsAppMessage(client.id, client.mobile)}
                                                        disabled={!selectedScriptForClient[client.id] || sendingMessage}
                                                        className={`${selectedScriptForClient[client.id]
                                                            ? 'bg-green-500 hover:bg-green-600'
                                                            : 'bg-gray-300 cursor-not-allowed'
                                                            } text-white px-3 py-2 rounded-lg transition flex items-center text-sm`}
                                                    >
                                                        <FaWhatsapp className="mr-2" />
                                                        {messageSent[client.id] ? 'Message Sent!' : 'Send WhatsApp'}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            if (!selectedScriptForClient[client.id]) {
                                                                showNotification('Please select a script first!');
                                                                return;
                                                            }
                                                            const script = scripts.find(s => s.id === selectedScriptForClient[client.id]);
                                                            if (script) {
                                                                copyToClipboard(script.messageScript, new Event('click'));
                                                            }
                                                        }}
                                                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition flex items-center text-sm"
                                                    >
                                                        <FaCopy className="mr-2" /> Copy Script
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deleteConfirmation.show && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-lg p-5 max-w-md w-full animate-scaleIn">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirm Deletion</h3>
                            <p className="text-gray-600 mb-5">
                                Are you sure you want to delete this script? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setDeleteConfirmation({ show: false, id: null })}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteScript}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ScriptPage;