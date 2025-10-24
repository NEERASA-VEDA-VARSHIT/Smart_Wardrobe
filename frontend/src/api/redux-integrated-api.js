// Redux-integrated API functions that automatically update the store
import { store } from '../redux';
import { 
  setClothingItems, 
  addClothingItem, 
  updateClothingItem, 
  removeClothingItem,
  setCollections,
  addCollection,
  updateCollection,
  removeCollection,
  setRecommendations,
  setSuggestions,
  setWeather,
  setLaundry,
  setLoading,
  setError,
  clearError
} from '../redux/dataSlice';
import { trackAPICall } from '../redux/geminiSlice';
import { clothingAPI, collectionsAPI, recommendationsAPI, suggestionsAPI, weatherAPI, laundryAPI } from './index';

// Enhanced API functions that integrate with Redux
export const reduxIntegratedAPI = {
  // Clothing API with Redux integration
  clothing: {
    async getClothingItems(userId) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'clothingItems', loading: true }));
      store.dispatch(clearError('clothingItems'));
      
      try {
        const response = await clothingAPI.getClothingItems(userId);
        store.dispatch(setClothingItems(response.data.data || response.data));
        
        // Track API usage
        store.dispatch(trackAPICall({
          endpoint: 'clothing/getItems',
          tokens: 0,
          responseTime: Date.now() - startTime,
          timestamp: Date.now()
        }));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'clothingItems', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'clothingItems', loading: false }));
      }
    },

    async createClothingItem(formData) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'clothingItems', loading: true }));
      
      try {
        const response = await clothingAPI.createClothingItem(formData);
        store.dispatch(addClothingItem(response.data));
        
        // Track API usage
        store.dispatch(trackAPICall({
          endpoint: 'clothing/create',
          tokens: response.data?.tokens || 0,
          responseTime: Date.now() - startTime,
          timestamp: Date.now()
        }));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'clothingItems', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'clothingItems', loading: false }));
      }
    },

    async updateClothingItem(itemId, updateData) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'clothingItems', loading: true }));
      
      try {
        const response = await clothingAPI.updateClothingItem(itemId, updateData);
        store.dispatch(updateClothingItem(response.data));
        
        // Track API usage
        store.dispatch(trackAPICall({
          endpoint: 'clothing/update',
          tokens: 0,
          responseTime: Date.now() - startTime,
          timestamp: Date.now()
        }));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'clothingItems', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'clothingItems', loading: false }));
      }
    },

    async deleteClothingItem(itemId) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'clothingItems', loading: true }));
      
      try {
        await clothingAPI.deleteClothingItem(itemId);
        store.dispatch(removeClothingItem(itemId));
        
        // Track API usage
        store.dispatch(trackAPICall({
          endpoint: 'clothing/delete',
          tokens: 0,
          responseTime: Date.now() - startTime,
          timestamp: Date.now()
        }));
      } catch (error) {
        store.dispatch(setError({ key: 'clothingItems', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'clothingItems', loading: false }));
      }
    }
  },

  // Collections API with Redux integration
  collections: {
    async getCollections() {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'collections', loading: true }));
      store.dispatch(clearError('collections'));
      
      try {
        const response = await collectionsAPI.getCollections();
        store.dispatch(setCollections(response.data.data || response.data));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'collections', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'collections', loading: false }));
      }
    },

    async createCollection(collectionData) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'collections', loading: true }));
      
      try {
        const response = await collectionsAPI.createCollection(collectionData);
        store.dispatch(addCollection(response.data));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'collections', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'collections', loading: false }));
      }
    }
  },

  // Recommendations API with Redux integration
  recommendations: {
    async getOutfitRecommendations(recommendationData) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'recommendations', loading: true }));
      store.dispatch(clearError('recommendations'));
      
      try {
        const response = await recommendationsAPI.getOutfitRecommendations(recommendationData);
        store.dispatch(setRecommendations(response.data));
        
        // Track Gemini API usage
        store.dispatch(trackAPICall({
          endpoint: 'recommendations/outfit',
          tokens: response.data?.tokens || 0,
          responseTime: Date.now() - startTime,
          timestamp: Date.now()
        }));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'recommendations', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'recommendations', loading: false }));
      }
    }
  },

  // Weather API with Redux integration
  weather: {
    async getWeatherRecommendations(userId, lat, lon) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'weather', loading: true }));
      store.dispatch(clearError('weather'));
      
      try {
        const response = await weatherAPI.getWeatherRecommendations(userId, lat, lon);
        // Extract the weather object from the nested response
        store.dispatch(setWeather(response.data.weather));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'weather', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'weather', loading: false }));
      }
    }
  },

  // Laundry API with Redux integration
  laundry: {
    async getLaundryStats(userId) {
      const startTime = Date.now();
      store.dispatch(setLoading({ key: 'laundry', loading: true }));
      store.dispatch(clearError('laundry'));
      
      try {
        const response = await laundryAPI.getLaundryStats(userId);
        store.dispatch(setLaundry(response.data.data || response.data));
        
        return response;
      } catch (error) {
        store.dispatch(setError({ key: 'laundry', error: error.message }));
        throw error;
      } finally {
        store.dispatch(setLoading({ key: 'laundry', loading: false }));
      }
    }
  }
};
