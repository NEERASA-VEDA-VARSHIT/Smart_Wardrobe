# API Organization

This directory contains all API calls organized by functionality for better maintainability and reusability.

## 📁 Structure

```
src/api/
├── index.js                 # Main exports
├── config.js               # API configuration and utilities
├── auth/
│   └── authAPI.js          # Authentication API calls
├── clothing/
│   └── clothingAPI.js      # Clothing items API calls
├── collections/
│   └── collectionsAPI.js   # Collections API calls
├── laundry/
│   └── laundryAPI.js       # Laundry management API calls
├── recommendations/
│   └── recommendationsAPI.js # AI recommendations API calls
├── suggestions/
│   └── suggestionsAPI.js   # Collaborative suggestions API calls
├── weather/
│   └── weatherAPI.js       # Weather-based recommendations API calls
├── user/
│   └── userAPI.js          # User profile and preferences API calls
```

## 🚀 Usage

### Import All APIs
```javascript
import { 
  authAPI, 
  clothingAPI, 
  collectionsAPI, 
  laundryAPI, 
  recommendationsAPI, 
  suggestionsAPI, 
  weatherAPI, 
  userAPI 
} from '../api';
```

### Import Specific API
```javascript
import { clothingAPI } from '../api/clothing/clothingAPI';
```

### Import Configuration
```javascript
import { API_BASE_URL, getAuthHeaders, handleApiResponse } from '../api/config';
```

## 📋 API Categories

### 🔐 Authentication (`authAPI`)
- `signIn(email, password)`
- `signUp(userData)`
- `getCurrentUser(token)`
- `signOut(token)`
- `forgotPassword(email)`
- `resetPassword(token, password)`

### 👕 Clothing (`clothingAPI`)
- `getClothingItems(userId, token)`
- `getClothingItem(itemId, token)`
- `createClothingItem(formData, token)`
- `updateClothingItem(itemId, updateData, token)`
- `deleteClothingItem(itemId, token)`
- `markAsWorn(itemId, token)`
- `toggleFavorite(itemId, token)`
- `getClothingStats(userId, token)`

### 📁 Collections (`collectionsAPI`)
- `getCollections(token)`
- `getCollection(collectionId, token)`
- `createCollection(collectionData, token)`
- `updateCollection(collectionId, updateData, token)`
- `deleteCollection(collectionId, token)`
- `getCollectionItems(collectionId, token)`
- `addItemToCollection(collectionId, itemId, token)`
- `removeItemFromCollection(collectionId, itemId, token)`
- `shareCollection(collectionId, shareData, token)`

### 🧺 Laundry (`laundryAPI`)
- `getLaundryItems(userId, token)`
- `addToLaundry(clothingId, laundryData, token)`
- `markAsWashed(clothingId, token)`
- `removeFromLaundry(clothingId, token)`
- `updateLaundryItem(laundryId, updateData, token)`
- `getLaundryStats(userId, token)`
- `getLaundrySuggestions(userId, token)`
- `dismissLaundrySuggestion(clothingId, token)`

### 🧠 Recommendations (`recommendationsAPI`)
- `getOutfitRecommendations(recommendationData, token)`
- `getSimilarItems(itemId, limit, token)`
- `getComplementaryItems(itemId, context, token)`
- `getRecommendationHistory(userId, token)`
- `addRecommendationFeedback(recommendationId, feedback, token)`
- `markRecommendationAsWorn(recommendationId, userId, token)`

### 💡 Suggestions (`suggestionsAPI`)
- `submitSuggestion(collectionId, suggestionData, token)`
- `getCollectionSuggestions(collectionId, status, token)`
- `getUserSuggestions(userId, status, token)`
- `acceptSuggestion(suggestionId, acceptData, token)`
- `markSuggestionAsWorn(suggestionId, token)`
- `ignoreSuggestion(suggestionId, feedback, token)`
- `enhanceSuggestion(suggestionId, token)`
- `getSuggestionStats(userId, token)`

### 🌤️ Weather (`weatherAPI`)
- `getWeatherRecommendations(userId, lat, lon, token)`
- `getWeatherForecastRecommendations(userId, lat, lon, days, token)`
- `updateWeatherSuitability(clothingId, suitabilityData, token)`
- `getWeatherCacheStats(token)`
- `clearWeatherCache(token)`
- `clearExpiredWeatherCache(token)`
- `getWeatherCacheEntries(token)`

### 👤 User (`userAPI`)
- `getUserProfile(userId, token)`
- `updateUserProfile(userId, updateData, token)`
- `updateUserPreferences(userId, preferences, token)`
- `getUserStats(userId, token)`
- `getUserActivity(userId, token)`
- `deleteUserAccount(userId, token)`

## 🔧 Configuration

### API Base URL
```javascript
export const API_BASE_URL = '/api';
```

### Authentication Headers
```javascript
export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});
```

### Response Handler
```javascript
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};
```

## 💡 Best Practices

1. **Always handle errors** in your components
2. **Use try-catch blocks** for API calls
3. **Pass authentication tokens** to all API calls
4. **Use the response handler** for consistent error handling
5. **Organize imports** by functionality
6. **Create custom hooks** for complex API interactions

## 🔄 Migration from Old API Calls

### Before (scattered API calls)
```javascript
// Old way - scattered throughout components
const response = await fetch('/api/clothing-items/user/123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### After (organized API calls)
```javascript
// New way - organized and reusable
import { clothingAPI } from '../api';

const response = await clothingAPI.getClothingItems(userId, token);
```

## 📝 Examples

See the individual API files for usage examples and patterns.
