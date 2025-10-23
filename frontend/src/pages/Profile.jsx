import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { selectUser, setUser, clearUser } from '../redux/userSlice';
import { userAPI, authAPI } from '../api';

const Profile = () => {
  const { username } = useParams();
  
  // Extract username from URL parameter (format: profile/username)
  const actualUsername = username;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferences: {
      favoriteColors: [],
      style: 'casual',
      weatherPreference: 'moderate'
    }
  });

  // Generate username for comparison if currentUser doesn't have one
  const getCurrentUsername = () => {
    if (currentUser?.username) return currentUser.username;
    if (currentUser?.email) {
      return currentUser.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    }
    return null;
  };

  // Determine if this is the current user's own profile
  // Check if the username in URL matches current user's username or email (for backward compatibility)
  const isOwnProfile = !actualUsername || 
    actualUsername === 'undefined' || 
    actualUsername === undefined || 
    (currentUser && (
      currentUser.username === actualUsername || 
      getCurrentUsername() === actualUsername ||
      currentUser.email === actualUsername  // Handle email-based URLs
    ));
  const displayUser = isOwnProfile ? currentUser : profileData?.user;
  
  // Debug logging
  console.log('Profile Debug:', {
    username,
    actualUsername,
    currentUser,
    currentUserUsername: currentUser?.username,
    currentUserEmail: currentUser?.email,
    isOwnProfile,
    displayUser,
    profileData,
    loading
  });

  // Refresh current user data to get username if missing
  useEffect(() => {
    const refreshCurrentUser = async () => {
      if (isOwnProfile && (!currentUser?.username)) {
        try {
          console.log('Refreshing current user data to get username...');
          const response = await getCurrentUser();
          console.log('Refreshed user data:', response);
          
          // Update Redux state with the new user data that includes username
          dispatch(setUser(response));
          
          // Redirect to the new username-based URL
          if (response.username) {
            navigate(`/profile/${response.username}`, { replace: true });
          }
        } catch (err) {
          console.error('Error refreshing current user:', err);
        }
      }
    };

    refreshCurrentUser();
  }, [isOwnProfile, currentUser?.username, dispatch, navigate]);

  // If we're on our own profile but currentUser is null, wait for it to load
  if (isOwnProfile && !currentUser && !loading) {
    console.log('Waiting for currentUser to load...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  // If no user is logged in and we're trying to view a profile, redirect to sign in
  if (!currentUser && actualUsername) {
    console.log('No user logged in, redirecting to sign in...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">Please sign in to view profiles.</p>
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
  
  // Fetch user data when component mounts or username changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (isOwnProfile) {
        // Use current user data
        setProfileData(null);
        setLoading(false);
        return;
      }

      if (actualUsername && actualUsername !== 'undefined') {
        // Check if the username is actually an email (current user's profile)
        if (actualUsername.includes('@')) {
          console.log('Username is an email, treating as own profile');
          setProfileData(null);
          setLoading(false);
          return;
        }
        
        try {
          setLoading(true);
          const response = await userAPI.getUserByUsername(actualUsername);
          setProfileData(response.data);
          setError(null);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('User not found');
        } finally {
          setLoading(false);
        }
      } else {
        // If no valid username, treat as own profile
        setProfileData(null);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [actualUsername, isOwnProfile, currentUser]);

  // Update form data when user data changes
  useEffect(() => {
    if (displayUser) {
      setFormData({
        name: displayUser.name || '',
        email: displayUser.email || '',
        preferences: {
          favoriteColors: displayUser.preferences?.favoriteColors || [],
          style: displayUser.preferences?.style || 'casual',
          weatherPreference: displayUser.preferences?.weatherPreference || 'moderate'
        }
      });
    }
  }, [displayUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await userAPI.updateUserProfile(user._id, formData);
      console.log('Profile updated successfully:', data);
      setIsEditing(false);
      // Optionally refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: displayUser?.name || '',
      email: displayUser?.email || '',
      preferences: {
        favoriteColors: displayUser?.preferences?.favoriteColors || [],
        style: displayUser?.preferences?.style || 'casual',
        weatherPreference: displayUser?.preferences?.weatherPreference || 'moderate'
      }
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setIsUploadingImage(true);
    try {
      const data = await userAPI.uploadProfilePicture(selectedImage);
      console.log('Profile picture updated:', data);
      setImagePreview(null);
      setSelectedImage(null);
      // Refresh user data or update Redux store
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChangeImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear server-side session and cookies
      await authAPI.signOut();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear Redux state
      dispatch(clearUser());
      // Navigate to sign in page
      navigate('/signin');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">User Not Found</h1>
          <p className="text-gray-400 mb-6">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Show loading while data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // No user data - only show sign in if we're not logged in at all
  if (!displayUser && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Profile Not Available</h1>
          <p className="text-gray-400 mb-6">Please sign in to view your profile.</p>
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

  // Debug: Always show something
  console.log('Profile component rendering with:', { actualUsername, currentUser, isOwnProfile, displayUser, loading });

  // Simple fallback - if we get here, show something
  if (!displayUser && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Profile</h1>
          <p className="text-gray-400">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isOwnProfile ? 'My Profile' : `${displayUser?.name || 'User'}'s Profile`}
          </h1>
          <p className="text-gray-400 mb-4">
            {isOwnProfile ? 'Manage your account and preferences' : `@${displayUser?.username || actualUsername}`}
          </p>
          
          {/* Profile URL */}
          {displayUser?.username && (
            <div className="bg-gray-700/30 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">Profile URL</p>
                  <p className="text-sm text-white font-mono break-all">
                    {window.location.origin}/profile/{displayUser.username}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/profile/${displayUser.username}`);
                    // You could add a toast notification here
                  }}
                  className="ml-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8">
          {/* Profile Picture Section */}
          <div className="text-center mb-8">
            <div className="w-32 h-32 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center relative">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Profile Preview" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : displayUser?.profilePic ? (
                <img 
                  src={displayUser.profilePic} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="text-4xl text-gray-400">
                  {displayUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            
            {isOwnProfile && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button 
                  onClick={handleChangeImageClick}
                  className="text-yellow-400 hover:text-yellow-300 transition-colors mr-4"
                >
                  Change Profile Picture
                </button>
                {selectedImage && (
                  <div className="space-x-2">
                    <button
                      onClick={handleImageUpload}
                      disabled={isUploadingImage}
                      className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      {isUploadingImage ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="px-4 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing || !isOwnProfile}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing || !isOwnProfile}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Preferences Section */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Style Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Style
                  </label>
                  <select
                    name="preferences.style"
                    value={formData.preferences.style}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    <option value="casual">Casual</option>
                    <option value="business">Business</option>
                    <option value="formal">Formal</option>
                    <option value="sporty">Sporty</option>
                    <option value="vintage">Vintage</option>
                  </select>
                </div>

                {/* Weather Preference */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weather Preference
                  </label>
                  <select
                    name="preferences.weatherPreference"
                    value={formData.preferences.weatherPreference}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    <option value="cold">Cold</option>
                    <option value="moderate">Moderate</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>
              </div>

              {/* Favorite Colors */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Favorite Colors
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange', 'Brown', 'Gray'].map(color => (
                    <label key={color} className="flex items-center space-x-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={formData.preferences.favoriteColors.includes(color.toLowerCase())}
                        onChange={(e) => {
                          const colorLower = color.toLowerCase();
                          setFormData(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              favoriteColors: e.target.checked
                                ? [...prev.preferences.favoriteColors, colorLower]
                                : prev.preferences.favoriteColors.filter(c => c !== colorLower)
                            }
                          }));
                        }}
                        disabled={!isEditing}
                        className="rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 disabled:opacity-50"
                      />
                      <span>{color}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons - Only show for own profile */}
            {isOwnProfile && (
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-400 transition-colors font-medium"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {isOwnProfile ? (currentUser?.totalItems || 0) : (profileData?.statistics?.clothingItems || 0)}
            </div>
            <div className="text-gray-400">Clothing Items</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {isOwnProfile ? (currentUser?.totalCollections || 0) : (profileData?.statistics?.collections || 0)}
            </div>
            <div className="text-gray-400">Collections</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {isOwnProfile ? (currentUser?.totalOutfits || 0) : (profileData?.statistics?.outfits || 0)}
            </div>
            <div className="text-gray-400">Outfit Recommendations</div>
          </div>
        </div>

        {/* Recent Items Section (for other users' profiles) */}
        {!isOwnProfile && profileData?.recentItems && profileData.recentItems.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Items</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {profileData.recentItems.map((item, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 text-center">
                  <img 
                    src={item.imageUrl} 
                    alt={item.metadata?.category || 'Clothing item'}
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                  <p className="text-sm text-gray-400 capitalize">
                    {item.metadata?.category || 'Item'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Collections Section (for other users' profiles) */}
        {!isOwnProfile && profileData?.recentCollections && profileData.recentCollections.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-white mb-6">Public Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profileData.recentCollections.map((collection, index) => (
                <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
                  <h4 className="text-lg font-semibold text-white mb-2">{collection.name}</h4>
                  {collection.description && (
                    <p className="text-gray-400 text-sm mb-4">{collection.description}</p>
                  )}
                  <div className="flex space-x-2">
                    {collection.itemIds.slice(0, 3).map((item, itemIndex) => (
                      <img 
                        key={itemIndex}
                        src={item.imageUrl} 
                        alt="Collection item"
                        className="w-12 h-12 object-cover rounded"
                      />
                    ))}
                    {collection.itemIds.length > 3 && (
                      <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">+{collection.itemIds.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
