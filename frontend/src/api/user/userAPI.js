import { apiRequest, getAuthHeaders, getAuthHeadersForUpload } from '../config';

const userAPI = {
  // Get user profile
  getUserProfile: async (userId) => {
    return apiRequest(`/users/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Update user profile
  updateUserProfile: async (userId, updateData) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
  },

  // Update user preferences
  updateUserPreferences: async (userId, preferences) => {
    return apiRequest(`/users/${userId}/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(preferences)
    });
  },

  // Get user statistics
  getUserStats: async (userId) => {
    return apiRequest(`/users/${userId}/stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get user activity
  getUserActivity: async (userId) => {
    return apiRequest(`/users/${userId}/activity`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Delete user account
  deleteUserAccount: async (userId) => {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Get user by username (public profile)
  getUserByUsername: async (username) => {
    return apiRequest(`/users/username/${username}`, {
      method: 'GET'
    });
  },

  // Upload profile picture
  uploadProfilePicture: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return apiRequest('/users/upload-profile-pic', {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData
    });
  }
};

export default userAPI;
