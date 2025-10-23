import { createSlice } from "@reduxjs/toolkit";

const dataSlice = createSlice({
  name: "data",
  initialState: {
    clothingItems: [],
    collections: [],
    recommendations: [],
    suggestions: [],
    weather: null,
    laundry: [],
    loading: {
      clothingItems: false,
      collections: false,
      recommendations: false,
      suggestions: false,
      weather: false,
      laundry: false
    },
    errors: {
      clothingItems: null,
      collections: null,
      recommendations: null,
      suggestions: null,
      weather: null,
      laundry: null
    },
    lastFetched: {
      clothingItems: null,
      collections: null,
      recommendations: null,
      suggestions: null,
      weather: null,
      laundry: null
    }
  },
  reducers: {
    // Clothing Items
    setClothingItems: (state, action) => {
      state.clothingItems = action.payload;
      state.lastFetched.clothingItems = Date.now();
    },
    addClothingItem: (state, action) => {
      state.clothingItems.push(action.payload);
    },
    updateClothingItem: (state, action) => {
      const index = state.clothingItems.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.clothingItems[index] = action.payload;
      }
    },
    removeClothingItem: (state, action) => {
      state.clothingItems = state.clothingItems.filter(item => item._id !== action.payload);
    },
    
    // Collections
    setCollections: (state, action) => {
      state.collections = action.payload;
      state.lastFetched.collections = Date.now();
    },
    addCollection: (state, action) => {
      state.collections.push(action.payload);
    },
    updateCollection: (state, action) => {
      const index = state.collections.findIndex(collection => collection._id === action.payload._id);
      if (index !== -1) {
        state.collections[index] = action.payload;
      }
    },
    removeCollection: (state, action) => {
      state.collections = state.collections.filter(collection => collection._id !== action.payload);
    },
    
    // Recommendations
    setRecommendations: (state, action) => {
      state.recommendations = action.payload;
      state.lastFetched.recommendations = Date.now();
    },
    addRecommendation: (state, action) => {
      state.recommendations.push(action.payload);
    },
    
    // Suggestions
    setSuggestions: (state, action) => {
      state.suggestions = action.payload;
      state.lastFetched.suggestions = Date.now();
    },
    addSuggestion: (state, action) => {
      state.suggestions.push(action.payload);
    },
    updateSuggestion: (state, action) => {
      const index = state.suggestions.findIndex(suggestion => suggestion._id === action.payload._id);
      if (index !== -1) {
        state.suggestions[index] = action.payload;
      }
    },
    
    // Weather
    setWeather: (state, action) => {
      state.weather = action.payload;
      state.lastFetched.weather = Date.now();
    },
    
    // Laundry
    setLaundry: (state, action) => {
      state.laundry = action.payload;
      state.lastFetched.laundry = Date.now();
    },
    addToLaundry: (state, action) => {
      state.laundry.push(action.payload);
    },
    removeFromLaundry: (state, action) => {
      state.laundry = state.laundry.filter(item => item._id !== action.payload);
    },
    
    // Loading states
    setLoading: (state, action) => {
      const { key, loading } = action.payload;
      state.loading[key] = loading;
    },
    
    // Error states
    setError: (state, action) => {
      const { key, error } = action.payload;
      state.errors[key] = error;
    },
    clearError: (state, action) => {
      const key = action.payload;
      state.errors[key] = null;
    },
    
    // Clear all data
    clearAllData: (state) => {
      state.clothingItems = [];
      state.collections = [];
      state.recommendations = [];
      state.suggestions = [];
      state.weather = null;
      state.laundry = [];
      state.errors = {
        clothingItems: null,
        collections: null,
        recommendations: null,
        suggestions: null,
        weather: null,
        laundry: null
      };
    }
  }
});

export const {
  setClothingItems,
  addClothingItem,
  updateClothingItem,
  removeClothingItem,
  setCollections,
  addCollection,
  updateCollection,
  removeCollection,
  setRecommendations,
  addRecommendation,
  setSuggestions,
  addSuggestion,
  updateSuggestion,
  setWeather,
  setLaundry,
  addToLaundry,
  removeFromLaundry,
  setLoading,
  setError,
  clearError,
  clearAllData
} = dataSlice.actions;

export default dataSlice.reducer;

// Selectors
export const selectClothingItems = (state) => state.data.clothingItems;
export const selectCollections = (state) => state.data.collections;
export const selectRecommendations = (state) => state.data.recommendations;
export const selectSuggestions = (state) => state.data.suggestions;
export const selectWeather = (state) => state.data.weather;
export const selectLaundry = (state) => state.data.laundry;

export const selectLoading = (key) => (state) => state.data.loading[key];
export const selectError = (key) => (state) => state.data.errors[key];
export const selectLastFetched = (key) => (state) => state.data.lastFetched[key];
