import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { selectUser, setUser, clearUser } from '../redux/userSlice';
import { userAPI, authAPI } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('account');
  const [isValidating, setIsValidating] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      favoriteColors: [],
      style: 'casual',
      weatherPreference: 'moderate',
      brands: [],
      occasions: []
    }
  });

  const tabs = [
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'preferences', name: 'Preferences', icon: '🎨' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' }
  ];

  useEffect(() => {
    // Debug logging for Settings page
    console.log('Settings Debug:', {
      user,
      hasUserId: !!user?._id,
      hasEmail: !!user?.email,
      hasName: !!user?.name
    });

    // Validate user data
    if (user && user._id && user.email) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        preferences: {
          favoriteColors: user.preferences?.favoriteColors || [],
          style: user.preferences?.style || 'casual',
          weatherPreference: user.preferences?.weatherPreference || 'moderate',
          brands: user.preferences?.brands || [],
          occasions: user.preferences?.occasions || []
        }
      });
      setIsValidating(false);
    } else if (user === null) {
      // User is explicitly null (not logged in)
      setIsValidating(false);
    }
    // If user exists but missing required fields, keep validating
  }, [user]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!user?._id) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await userAPI.updateUserProfile(user._id, formData);
      dispatch(setUser(response.data));
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authAPI.signOut();
      dispatch(clearUser());
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Show loading while validating user data
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <LoadingSpinner text="Validating user data..." />
      </div>
    );
  }

  // Enhanced user validation with fallbacks
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to access settings.</p>
          <button
            onClick={() => navigate('/signin')}
            className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Additional validation for user data integrity
  if (!user._id || !user.email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Invalid User Data</h1>
          <p className="text-gray-400 mb-6">Your user data appears to be incomplete. Please sign in again.</p>
          <button
            onClick={() => {
              dispatch(clearUser());
              navigate('/signin');
            }}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-400 transition-colors font-medium"
          >
            Sign In Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6 pt-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-8"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-gray-400 mt-2">Manage your account and preferences</p>
          </div>
        </motion.div>

        {/* Error/Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-600 p-4 rounded-lg text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              className="bg-green-600 p-4 rounded-lg text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1"
            variants={itemVariants}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-xl">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3"
            variants={itemVariants}
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              {/* Account Settings */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Account Information</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="pt-4 border-t border-gray-700">
                      <button
                        onClick={handleSignOut}
                        className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Settings */}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Style Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Style</label>
                      <select
                        value={formData.preferences.style}
                        onChange={(e) => handleInputChange('preferences.style', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="casual">Casual</option>
                        <option value="formal">Formal</option>
                        <option value="sporty">Sporty</option>
                        <option value="vintage">Vintage</option>
                        <option value="minimalist">Minimalist</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Weather Preference</label>
                      <select
                        value={formData.preferences.weatherPreference}
                        onChange={(e) => handleInputChange('preferences.weatherPreference', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="cold">Cold</option>
                        <option value="moderate">Moderate</option>
                        <option value="warm">Warm</option>
                        <option value="hot">Hot</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Profile Visibility</h3>
                        <p className="text-gray-400 text-sm">Make your profile visible to other users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Collection Sharing</h3>
                        <p className="text-gray-400 text-sm">Allow others to view your collections</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Notifications</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Email Notifications</h3>
                        <p className="text-gray-400 text-sm">Receive updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Outfit Suggestions</h3>
                        <p className="text-gray-400 text-sm">Get notified about new outfit recommendations</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-700">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-all duration-200"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
