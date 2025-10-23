import { apiRequest, getAuthHeaders } from '../config';

const recommendationsAPI = {
  // Get outfit recommendations
  getOutfitRecommendations: async (recommendationData) => {
    const { userId, ...bodyData } = recommendationData;
    return apiRequest(`/recommendations/outfit/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyData)
    });
  },

  // Get similar items
  getSimilarItems: async (itemId, limit = 5) => {
    return apiRequest(`/recommendations/similar/${itemId}?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get complementary items
  getComplementaryItems: async (itemId, context) => {
    const queryParams = new URLSearchParams(context).toString();
    return apiRequest(`/recommendations/complementary/${itemId}?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get recommendation history
  getRecommendationHistory: async (userId) => {
    return apiRequest(`/recommendations/history/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Add feedback to recommendation
  addRecommendationFeedback: async (recommendationId, feedback) => {
    return apiRequest(`/recommendations/${recommendationId}/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(feedback)
    });
  },

  // Mark recommendation as worn
  markRecommendationAsWorn: async (recommendationId, userId) => {
    return apiRequest(`/recommendations/${recommendationId}/worn`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
  }
};

export default recommendationsAPI;
