// Redux exports
export { default as store, persistor } from './store';

// User slice
export {
  setUser,
  clearUser,
  selectUser,
  selectIsRehydrated
} from './userSlice';

// Gemini slice
export {
  trackAPICall,
  resetUsage,
  updateRateLimits,
  clearHistory,
  selectGeminiUsage,
  selectCurrentUsage,
  selectRateLimits,
  selectDailyUsage,
  selectUsageStats
} from './geminiSlice';

// UI slice
export {
  setLoading as setUILoading,
  setError as setUIError,
  clearError as clearUIError,
  addNotification,
  removeNotification,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  closeAllModals,
  selectLoading as selectUILoading,
  selectError as selectUIError,
  selectNotifications,
  selectTheme,
  selectSidebarOpen,
  selectModals,
  selectModal
} from './uiSlice';

// Data slice
export {
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
  setLoading as setDataLoading,
  setError as setDataError,
  clearError as clearDataError,
  clearAllData,
  selectClothingItems,
  selectCollections,
  selectRecommendations,
  selectSuggestions,
  selectWeather,
  selectLaundry,
  selectLoading as selectDataLoading,
  selectError as selectDataError,
  selectLastFetched
} from './dataSlice';
