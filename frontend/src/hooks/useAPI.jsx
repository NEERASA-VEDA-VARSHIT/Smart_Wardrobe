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

// Custom hook for API calls
export const useAPI = () => {
  return {
    auth: authAPI,
    clothing: clothingAPI,
    collections: collectionsAPI,
    laundry: laundryAPI,
    recommendations: recommendationsAPI,
    suggestions: suggestionsAPI,
    weather: weatherAPI,
    user: userAPI
  };
};

export default useAPI;
