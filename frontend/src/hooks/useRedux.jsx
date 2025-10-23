import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { setUser, clearUser } from '../redux/userSlice';
import { 
  setLoading as setUILoading, 
  setError as setUIError, 
  clearError as clearUIError,
  addNotification,
  removeNotification,
  setTheme,
  toggleSidebar,
  openModal,
  closeModal
} from '../redux/uiSlice';
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
  setLoading as setDataLoading,
  setError as setDataError,
  clearError as clearDataError
} from '../redux/dataSlice';
import { trackAPICall } from '../redux/geminiSlice';

// Custom hook for clean Redux integration
export const useRedux = () => {
  const dispatch = useDispatch();
  
  return {
    dispatch,
    // Helper function to create action dispatchers
    createAction: useCallback((actionCreator) => {
      return (...args) => dispatch(actionCreator(...args));
    }, [dispatch])
  };
};

// Custom hook for user state
export const useUser = () => {
  const user = useSelector(state => state.user.user);
  const isRehydrated = useSelector(state => state.user.isRehydrated);
  const dispatch = useDispatch();
  
  return {
    user,
    isRehydrated,
    isAuthenticated: !!user,
    // User actions
    setUser: useCallback((userData) => dispatch(setUser(userData)), [dispatch]),
    clearUser: useCallback(() => dispatch(clearUser()), [dispatch])
  };
};

// Custom hook for UI state
export const useUI = () => {
  const loading = useSelector(state => state.ui.loading);
  const error = useSelector(state => state.ui.error);
  const notifications = useSelector(state => state.ui.notifications);
  const theme = useSelector(state => state.ui.theme);
  const sidebarOpen = useSelector(state => state.ui.sidebarOpen);
  const modals = useSelector(state => state.ui.modals);
  const dispatch = useDispatch();
  
  return {
    // State
    loading,
    error,
    notifications,
    theme,
    sidebarOpen,
    modals,
    // Actions
    setLoading: useCallback((loading) => dispatch(setUILoading(loading)), [dispatch]),
    setError: useCallback((error) => dispatch(setUIError(error)), [dispatch]),
    clearError: useCallback(() => dispatch(clearUIError()), [dispatch]),
    addNotification: useCallback((notification) => dispatch(addNotification(notification)), [dispatch]),
    removeNotification: useCallback((id) => dispatch(removeNotification(id)), [dispatch]),
    setTheme: useCallback((theme) => dispatch(setTheme(theme)), [dispatch]),
    toggleSidebar: useCallback(() => dispatch(toggleSidebar()), [dispatch]),
    openModal: useCallback((modalName) => dispatch(openModal(modalName)), [dispatch]),
    closeModal: useCallback((modalName) => dispatch(closeModal(modalName)), [dispatch])
  };
};

// Custom hook for data state
export const useData = () => {
  const clothingItems = useSelector(state => state.data.clothingItems);
  const collections = useSelector(state => state.data.collections);
  const recommendations = useSelector(state => state.data.recommendations);
  const suggestions = useSelector(state => state.data.suggestions);
  const weather = useSelector(state => state.data.weather);
  const laundry = useSelector(state => state.data.laundry);
  const loading = useSelector(state => state.data.loading);
  const errors = useSelector(state => state.data.errors);
  const lastFetched = useSelector(state => state.data.lastFetched);
  const dispatch = useDispatch();
  
  return {
    // State
    clothingItems,
    collections,
    recommendations,
    suggestions,
    weather,
    laundry,
    loading,
    errors,
    lastFetched,
    // Actions
    setClothingItems: useCallback((items) => dispatch(setClothingItems(items)), [dispatch]),
    addClothingItem: useCallback((item) => dispatch(addClothingItem(item)), [dispatch]),
    updateClothingItem: useCallback((item) => dispatch(updateClothingItem(item)), [dispatch]),
    removeClothingItem: useCallback((itemId) => dispatch(removeClothingItem(itemId)), [dispatch]),
    setCollections: useCallback((collections) => dispatch(setCollections(collections)), [dispatch]),
    addCollection: useCallback((collection) => dispatch(addCollection(collection)), [dispatch]),
    setRecommendations: useCallback((recommendations) => dispatch(setRecommendations(recommendations)), [dispatch]),
    setSuggestions: useCallback((suggestions) => dispatch(setSuggestions(suggestions)), [dispatch]),
    setWeather: useCallback((weather) => dispatch(setWeather(weather)), [dispatch]),
    setLaundry: useCallback((laundry) => dispatch(setLaundry(laundry)), [dispatch]),
    setLoading: useCallback((key, loading) => dispatch(setDataLoading({ key, loading })), [dispatch]),
    setError: useCallback((key, error) => dispatch(setDataError({ key, error })), [dispatch]),
    clearError: useCallback((key) => dispatch(clearDataError(key)), [dispatch])
  };
};

// Custom hook for Gemini API tracking
export const useGeminiAPI = () => {
  const apiUsage = useSelector(state => state.gemini?.apiUsage || {});
  const dispatch = useDispatch();
  
  return {
    apiUsage,
    trackAPICall: useCallback((endpoint, tokens, responseTime) => {
      dispatch(trackAPICall({ endpoint, tokens, responseTime, timestamp: Date.now() }));
    }, [dispatch]),
    getUsageStats: useCallback(() => {
      return {
        totalCalls: Object.values(apiUsage).reduce((sum, usage) => sum + usage.calls, 0),
        totalTokens: Object.values(apiUsage).reduce((sum, usage) => sum + usage.tokens, 0),
        averageResponseTime: Object.values(apiUsage).reduce((sum, usage) => sum + usage.responseTime, 0) / Object.keys(apiUsage).length
      };
    }, [apiUsage])
  };
};
