import { apiRequest, getAuthHeaders, getAuthHeadersForUpload } from '../config';

const clothingAPI = {
  // Get all clothing items for a user
  getClothingItems: async (userId) => {
    return apiRequest(`/clothing-items/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get single clothing item
  getClothingItem: async (itemId) => {
    return apiRequest(`/clothing-items/${itemId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Create new clothing item
  createClothingItem: async (formData) => {
    return apiRequest('/clothing-items', {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData
    });
  },

  // Update clothing item
  updateClothingItem: async (itemId, updateData) => {
    return apiRequest(`/clothing-items/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
  },

  // Delete clothing item
  deleteClothingItem: async (itemId) => {
    return apiRequest(`/clothing-items/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Mark item as worn
  markAsWorn: async (itemId) => {
    return apiRequest(`/clothing-items/${itemId}/worn`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
  },

  // Toggle favorite status
  toggleFavorite: async (itemId) => {
    return apiRequest(`/clothing-items/${itemId}/favorite`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
  },

  // Get clothing statistics
  getClothingStats: async (userId) => {
    return apiRequest(`/clothing-items/stats/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Generate metadata from image using Gemini
  generateMetadata: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    return apiRequest('/metadata/generate', {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData
    });
  },

  // Generate embedding from metadata using Gemini
  generateEmbedding: async (metadata) => {
    return apiRequest('/metadata/embedding', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ metadata })
    });
  },

  // Delete image from Cloudinary
  deleteImage: async (publicId) => {
    return apiRequest('/metadata/delete-image', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ publicId })
    });
  },

  // Generate metadata for multiple images in batch
  generateBatchMetadata: async (formData) => {
    return apiRequest('/batch-metadata/generate', {
      method: 'POST',
      headers: getAuthHeadersForUpload(),
      body: formData
    });
  }
};

export default clothingAPI;
