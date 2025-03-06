import React, { useState, useEffect } from 'react';
import { database } from '../db/firebase.js';
import { onValue, ref, push, set, remove, update } from 'firebase/database';
import {
    FaPlus,
    FaBuilding,
    FaPhone,
    FaEnvelope,
    FaSave,
    FaTimes,
    FaEdit,
    FaTrashAlt,
    FaChevronDown,
    FaChevronUp,
    FaSearch,
    FaCopy,
    FaLanguage,
    FaGlobe
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

function ScriptPage() {
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentScriptId, setCurrentScriptId] = useState(null);
    const [formData, setFormData] = useState({
        businessType: '',
        coldCallScript: '',
        messageScript: '',
        language: 'english' // Default language
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedScripts, setExpandedScripts] = useState({});
    const [selectedScriptType, setSelectedScriptType] = useState('both'); // 'call', 'message', or 'both'
    const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, id: null });

    // Languages available
    const languages = [
        { id: 'english', name: 'English' },
        { id: 'hindi', name: 'Hindi' },
        { id: 'marathi', name: 'Marathi' }
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
            businessType: '',
            coldCallScript: '',
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
        if (!formData.businessType.trim() || !formData.coldCallScript.trim() || !formData.messageScript.trim()) {
            alert('Please fill in all fields');
            return;
        }

        if (isEditing && currentScriptId) {
            // Update existing script
            const scriptRef = ref(database, `scripts/${currentScriptId}`);

            update(scriptRef, {
                businessType: formData.businessType,
                coldCallScript: formData.coldCallScript,
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
                businessType: formData.businessType,
                coldCallScript: formData.coldCallScript,
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
            businessType: script.businessType,
            coldCallScript: script.coldCallScript,
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
                // If deleted script was selected, clear selection
                const deletedScript = scripts.find(s => s.id === deleteConfirmation.id);
                if (deletedScript && deletedScript.businessType === selectedBusiness) {
                    setSelectedBusiness('');
                }
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

    // Filter scripts based on search term and language
    const filteredScripts = scripts.filter(script =>
        script.businessType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Handle business type selection
    const handleBusinessSelect = (businessType) => {
        setSelectedBusiness(businessType === selectedBusiness ? '' : businessType);
    };

    // Toggle script expansion
    const toggleExpand = (id, e) => {
        e.stopPropagation();
        setExpandedScripts(prev => ({
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

    // Toggle script type display
    const toggleScriptType = (type) => {
        setSelectedScriptType(type);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4 md:p-6">
            <div className="container mx-auto">
                <Link
                    to="/"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition shadow-md mb-6 group"
                >
                    <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span>Back to Dashboard</span>
                </Link>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                    <h1 className="text-3xl font-bold text-orange-700 mb-4 md:mb-0">Script Management</h1>
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
                            } text-white px-4 py-2 rounded-lg transition shadow-md flex items-center`}
                    >
                        {showForm ? (
                            <>
                                <FaTimes className="mr-2" /> Cancel
                            </>
                        ) : (
                            <>
                                <FaPlus className="mr-2" /> Add New Script
                            </>
                        )}
                    </button>
                </div>

                {/* Add/Edit Script Form (Conditionally Rendered) */}
                {showForm && (
                    <div className="bg-white rounded-xl shadow-xl mb-8 p-6 border border-orange-200 animate-fadeIn">
                        <h2 className="text-xl font-semibold text-orange-600 mb-4 flex items-center">
                            {isEditing ? (
                                <>
                                    <FaEdit className="mr-2" /> Edit Business Script
                                </>
                            ) : (
                                <>
                                    <FaPlus className="mr-2" /> Add New Business Script
                                </>
                            )}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                        <FaBuilding className="mr-2 text-orange-500" /> Business Type
                                    </label>
                                    <input
                                        type="text"
                                        name="businessType"
                                        value={formData.businessType}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Real Estate, Insurance, E-commerce..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                        <FaLanguage className="mr-2 text-orange-500" /> Language
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="language"
                                            value={formData.language}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50 appearance-none"
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
                                    <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                        <FaPhone className="mr-2 text-orange-500" /> Cold Call Script
                                    </label>
                                    <textarea
                                        name="coldCallScript"
                                        value={formData.coldCallScript}
                                        onChange={handleInputChange}
                                        placeholder="Enter the cold calling script here..."
                                        rows="4"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                                        required
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-gray-700 font-medium mb-2 flex items-center">
                                        <FaEnvelope className="mr-2 text-orange-500" /> Message Script
                                    </label>
                                    <textarea
                                        name="messageScript"
                                        value={formData.messageScript}
                                        onChange={handleInputChange}
                                        placeholder="Enter the message script here..."
                                        rows="4"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-50"
                                        required
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-amber-700 transition shadow-md flex items-center"
                                    >
                                        <FaSave className="mr-2" /> {isEditing ? 'Update Script' : 'Save Script'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative col-span-2">
                            <input
                                type="text"
                                placeholder="Search business types..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" />
                            {searchTerm && (
                                <FaTimes
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-400 cursor-pointer"
                                    onClick={() => setSearchTerm('')}
                                />
                            )}
                        </div>

                        {/* Language Filter */}
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                <FaGlobe className="text-orange-400" />
                            </div>
                            <select
                                onChange={(e) => toggleScriptType(e.target.value)}
                                value={selectedScriptType}
                                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 appearance-none"
                            >
                                <option value="both">All Scripts</option>
                                <option value="call">Cold Call Scripts</option>
                                <option value="message">Message Scripts</option>
                            </select>
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <FaChevronDown className="text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Types Grid */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
                    </div>
                ) : filteredScripts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-md">
                        <FaBuilding className="w-16 h-16 mx-auto text-orange-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Scripts Found</h3>
                        <p className="text-gray-500 mb-6">
                            {searchTerm
                                ? `No business scripts matching "${searchTerm}"`
                                : "You haven't added any business scripts yet."}
                        </p>
                        <button
                            onClick={() => {
                                setShowForm(true);
                                setSearchTerm('');
                            }}
                            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition inline-flex items-center"
                        >
                            <FaPlus className="mr-2" /> Add Your First Script
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 mb-6">
                        {filteredScripts.map((script) => (
                            <div
                                key={script.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden border border-orange-100 hover:shadow-lg transition"
                            >
                                {/* Business Type Header */}
                                <div
                                    className={`p-4 cursor-pointer flex justify-between items-center ${selectedBusiness === script.businessType
                                        ? 'bg-gradient-to-r from-orange-600 to-amber-700 text-white'
                                        : 'bg-gradient-to-r from-orange-50 to-amber-100 text-orange-700'
                                        }`}
                                    onClick={() => handleBusinessSelect(script.businessType)}
                                >
                                    <div className="flex items-center">
                                        <FaBuilding className="mr-2" />
                                        <h3 className="text-lg font-semibold">{script.businessType}</h3>
                                        <span className={`ml-3 px-2 py-1 text-xs rounded-full ${selectedBusiness === script.businessType
                                            ? 'bg-white text-orange-700'
                                            : 'bg-orange-200 text-orange-800'
                                            }`}>
                                            {languages.find(l => l.id === script.language)?.name || 'English'}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center space-x-2">
                                        {/* Edit button */}
                                        <button
                                            className={`p-2 rounded-full ${selectedBusiness === script.businessType
                                                ? 'text-white hover:bg-orange-500'
                                                : 'text-orange-600 hover:bg-orange-200'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditScript(script);
                                            }}
                                            title="Edit Script"
                                        >
                                            <FaEdit />
                                        </button>

                                        {/* Delete button */}
                                        <button
                                            className={`p-2 rounded-full ${selectedBusiness === script.businessType
                                                ? 'text-white hover:bg-orange-500'
                                                : 'text-orange-600 hover:bg-orange-200'
                                                }`}
                                            onClick={(e) => showDeleteConfirmation(script.id, e)}
                                            title="Delete Script"
                                        >
                                            <FaTrashAlt />
                                        </button>

                                        {/* Expand/Collapse button */}
                                        <button
                                            className={`p-2 rounded-full ${selectedBusiness === script.businessType
                                                ? 'text-white hover:bg-orange-500'
                                                : 'text-orange-600 hover:bg-orange-200'
                                                }`}
                                            onClick={(e) => toggleExpand(script.id, e)}
                                            title={expandedScripts[script.id] ? "Show Less" : "Show More"}
                                        >
                                            {expandedScripts[script.id] ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                    </div>
                                </div>

                                {/* Scripts Content - Shown when business type is selected */}
                                {selectedBusiness === script.businessType && (
                                    <div className="p-5 border-t border-orange-100 animate-fadeIn">
                                        {/* Script Type Selector */}
                                        <div className="flex mb-4 bg-orange-50 rounded-lg overflow-hidden border border-orange-200">
                                            <button
                                                className={`flex-1 py-2 px-4 flex justify-center items-center ${selectedScriptType === 'both' || selectedScriptType === 'call'
                                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                                                    : 'text-orange-700 hover:bg-orange-100'
                                                    }`}
                                                onClick={() => toggleScriptType('call')}
                                            >
                                                <FaPhone className="mr-2" /> Cold Call Scripts
                                            </button>
                                            <button
                                                className={`flex-1 py-2 px-4 flex justify-center items-center ${selectedScriptType === 'both' || selectedScriptType === 'message'
                                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                                                    : 'text-orange-700 hover:bg-orange-100'
                                                    }`}
                                                onClick={() => toggleScriptType('message')}
                                            >
                                                <FaEnvelope className="mr-2" /> Message Scripts
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Cold Call Script */}
                                            {(selectedScriptType === 'both' || selectedScriptType === 'call') && (
                                                <div className={`bg-orange-50 rounded-lg p-4 border border-orange-100 ${expandedScripts[script.id] ? '' : 'max-h-40 overflow-hidden'}`}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-medium text-orange-700 flex items-center">
                                                            <FaPhone className="mr-2" /> Cold Call Script
                                                        </h4>
                                                        <button
                                                            onClick={(e) => copyToClipboard(script.coldCallScript, e)}
                                                            className="text-orange-500 hover:text-orange-700 p-1"
                                                            title="Copy to clipboard"
                                                        >
                                                            <FaCopy />
                                                        </button>
                                                    </div>
                                                    <div className="text-gray-700 whitespace-pre-line">
                                                        {script.coldCallScript}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Message Script */}
                                            {(selectedScriptType === 'both' || selectedScriptType === 'message') && (
                                                <div className={`bg-amber-50 rounded-lg p-4 border border-amber-100 ${expandedScripts[script.id] ? '' : 'max-h-40 overflow-hidden'}`}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="font-medium text-amber-700 flex items-center">
                                                            <FaEnvelope className="mr-2" /> Message Script
                                                        </h4>
                                                        <button
                                                            onClick={(e) => copyToClipboard(script.messageScript, e)}
                                                            className="text-amber-500 hover:text-amber-700 p-1"
                                                            title="Copy to clipboard"
                                                        >
                                                            <FaCopy />
                                                        </button>
                                                    </div>
                                                    <div className="text-gray-700 whitespace-pre-line">
                                                        {script.messageScript}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Show More/Less Button */}
                                        {!expandedScripts[script.id] && (
                                            <button
                                                onClick={(e) => toggleExpand(script.id, e)}
                                                className="mt-4 text-orange-600 hover:text-orange-800 flex items-center mx-auto"
                                            >
                                                Show More <FaChevronDown className="ml-1" />
                                            </button>
                                        )}
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
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-fadeIn">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Delete Script?</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this script? This action cannot be undone.</p>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirmation({ show: false, id: null })}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteScript}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add CSS for animations */}
            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.3s ease-out forwards;
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}

export default ScriptPage;