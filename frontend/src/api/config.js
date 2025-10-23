// API Configuration
export const API_BASE_URL = '/api';

// Get authentication headers (cookie-based auth, no token needed)
export const getAuthHeaders = () => ({
  'Content-Type': 'application/json'
});

// Get auth headers for file uploads (cookie-based auth, no token needed)
export const getAuthHeadersForUpload = () => ({
  // No Authorization header needed for cookie-based auth
});

// Common API response handler
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Common API request wrapper
export const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      credentials: 'include'
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};