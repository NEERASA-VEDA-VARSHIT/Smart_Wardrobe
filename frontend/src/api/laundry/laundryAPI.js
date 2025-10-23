import { apiRequest, getAuthHeaders } from '../config';

const laundryAPI = {
  // Get all laundry items for a user
  getLaundryItems: async (userId) => {
    return apiRequest(`/laundry/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Add item to laundry
  addToLaundry: async (clothingId, laundryData) => {
    return apiRequest(`/laundry/add/${clothingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(laundryData)
    });
  },

  // Mark item as washed
  markAsWashed: async (clothingId) => {
    return apiRequest(`/laundry/return/${clothingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: 'ready_to_wear' })
    });
  },

  // Remove item from laundry
  removeFromLaundry: async (clothingId) => {
    return apiRequest(`/laundry/remove/${clothingId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Update laundry item
  updateLaundryItem: async (laundryId, updateData) => {
    return apiRequest(`/laundry/update/${laundryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
  },

  // Get laundry statistics
  getLaundryStats: async (userId) => {
    return apiRequest(`/laundry/stats/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get laundry suggestions
  getLaundrySuggestions: async (userId) => {
    return apiRequest(`/laundry-suggestions/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Dismiss laundry suggestion
  dismissLaundrySuggestion: async (clothingId) => {
    return apiRequest(`/laundry-suggestions/dismiss/${clothingId}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  }
};

export default laundryAPI;
