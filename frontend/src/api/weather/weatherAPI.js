import { apiRequest, getAuthHeaders } from '../config';

const weatherAPI = {
  // Get weather-based recommendations
  getWeatherRecommendations: async (userId, lat, lon) => {
    return apiRequest(`/weather-recommendations/${userId}?lat=${lat}&lon=${lon}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get weather forecast recommendations
  getWeatherForecastRecommendations: async (userId, lat, lon, days = 7) => {
    return apiRequest(`/weather-recommendations/forecast/${userId}?lat=${lat}&lon=${lon}&days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Update clothing weather suitability
  updateWeatherSuitability: async (clothingId, suitabilityData) => {
    return apiRequest(`/weather-recommendations/update-suitability/${clothingId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(suitabilityData)
    });
  },

  // Get weather cache statistics
  getWeatherCacheStats: async () => {
    return apiRequest('/weather-recommendations/cache/stats', {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Clear weather cache
  clearWeatherCache: async () => {
    return apiRequest('/weather-recommendations/cache', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Clear expired weather cache
  clearExpiredWeatherCache: async () => {
    return apiRequest('/weather-recommendations/cache/expired', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Get weather cache entries
  getWeatherCacheEntries: async () => {
    return apiRequest('/weather-recommendations/cache/entries', {
      method: 'GET',
      headers: getAuthHeaders()
    });
  }
};

export default weatherAPI;
