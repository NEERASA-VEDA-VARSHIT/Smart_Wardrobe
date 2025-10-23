import { apiRequest, getAuthHeaders } from '../config';

const suggestionsAPI = {
  // Submit outfit suggestion
  submitSuggestion: async (collectionId, suggestionData) => {
    return apiRequest(`/outfit-suggestions/${collectionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(suggestionData)
    });
  },

  // Get collection suggestions
  getCollectionSuggestions: async (collectionId, status) => {
    const queryParams = status ? `?status=${status}` : '';
    return apiRequest(`/outfit-suggestions/${collectionId}${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get user suggestions
  getUserSuggestions: async (userId, status) => {
    const queryParams = status ? `?status=${status}` : '';
    return apiRequest(`/outfit-suggestions/user/${userId}${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Accept suggestion
  acceptSuggestion: async (suggestionId, acceptData) => {
    return apiRequest(`/outfit-suggestions/${suggestionId}/accept`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(acceptData)
    });
  },

  // Mark suggestion as worn
  markSuggestionAsWorn: async (suggestionId) => {
    return apiRequest(`/outfit-suggestions/${suggestionId}/worn`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  // Ignore suggestion
  ignoreSuggestion: async (suggestionId, feedback) => {
    return apiRequest(`/outfit-suggestions/${suggestionId}/ignore`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ feedback })
    });
  },

  // Enhance suggestion with AI
  enhanceSuggestion: async (suggestionId) => {
    return apiRequest(`/outfit-suggestions/${suggestionId}/enhance`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
  },

  // Get suggestion statistics
  getSuggestionStats: async (userId) => {
    return apiRequest(`/outfit-suggestions/stats/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  }
};

export default suggestionsAPI;
