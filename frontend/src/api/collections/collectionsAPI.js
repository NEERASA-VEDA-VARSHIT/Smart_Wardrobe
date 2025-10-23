import { apiRequest, getAuthHeaders } from '../config';

const collectionsAPI = {
  // Get all collections for a user
  getCollections: async (userId) => {
    return apiRequest(`/collections/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get single collection
  getCollection: async (collectionId) => {
    return apiRequest(`/collections/${collectionId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Get shared collection (public access)
  getSharedCollection: async (shareLink) => {
    return apiRequest(`/collections/shared/${shareLink}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' } // No auth headers for public access
    });
  },

  // Create new collection
  createCollection: async (collectionData) => {
    return apiRequest('/collections', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(collectionData)
    });
  },

  // Update collection
  updateCollection: async (collectionId, updateData) => {
    return apiRequest(`/collections/${collectionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData)
    });
  },

  // Delete collection
  deleteCollection: async (collectionId) => {
    return apiRequest(`/collections/${collectionId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
  },

  // Get collection items
  getCollectionItems: async (collectionId) => {
    return apiRequest(`/collections/${collectionId}/items`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  },

  // Add item to collection
  addItemToCollection: async (collectionId, itemId) => {
    return apiRequest(`/collections/${collectionId}/add-item`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId })
    });
  },

  // Remove item from collection
  removeItemFromCollection: async (collectionId, itemId) => {
    return apiRequest(`/collections/${collectionId}/remove-item`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId })
    });
  },

  // Share collection with username
  shareCollectionWithUser: async (collectionId, username, permission = 'view') => {
    return apiRequest(`/collections/${collectionId}/share`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username, permission })
    });
  },

  // Get collections shared with user
  getSharedCollections: async (username) => {
    return apiRequest(`/collections/shared/${username}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
  }

};

export default collectionsAPI;
