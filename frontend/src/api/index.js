// Main API exports - centralized API access
export { default as authAPI } from './auth/authAPI';
export { default as clothingAPI } from './clothing/clothingAPI';
export { default as collectionsAPI } from './collections/collectionsAPI';
export { default as laundryAPI } from './laundry/laundryAPI';
export { default as recommendationsAPI } from './recommendations/recommendationsAPI';
export { default as suggestionsAPI } from './suggestions/suggestionsAPI';
export { default as weatherAPI } from './weather/weatherAPI';
export { default as userAPI } from './user/userAPI';

// Redux-integrated API
export { reduxIntegratedAPI } from './redux-integrated-api';

// API configuration
export { API_BASE_URL, getAuthHeaders } from './config';