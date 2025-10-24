import React, { useState, useEffect } from 'react';
import { useUser, useData, useUI, useGeminiAPI } from '../hooks';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '../components/AnimatedCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { reduxIntegratedAPI } from '../api/redux-integrated-api';

const Dashboard = () => {
  // Redux hooks for clean state management
  const { user, isAuthenticated } = useUser();
  const { 
    clothingItems, 
    recommendations, 
    weather, 
    laundry, 
    loading: dataLoading, 
    errors: dataErrors 
  } = useData();
  const { loading: uiLoading, error: uiError, addNotification } = useUI();
  const { apiUsage, getUsageStats } = useGeminiAPI();
  
  const navigate = useNavigate();
  
  // Local state for UI-specific data
  const [todaysOutfit, setTodaysOutfit] = useState(null);

  // Fetch dashboard data using Redux-integrated API
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) {
        console.log('No user ID available');
        return;
      }

      console.log('Fetching dashboard data for user:', user._id);

      try {
        // Get user's location or use default (New York)
        let lat = 40.7128, lon = -74.0060; // Default to New York
        
        // Try to get user's location from browser
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false
              });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
            console.log('Using user location:', lat, lon);
          } catch (error) {
            console.log('Using default location (New York)');
          }
        }

        // Fetch all data in parallel using Redux-integrated API
        const promises = [
          reduxIntegratedAPI.weather.getWeatherRecommendations(user._id, lat, lon),
          reduxIntegratedAPI.recommendations.getOutfitRecommendations({
            userId: user._id,
            query: "today's outfit",
            occasion: "general",
            timeOfDay: "day"
          }),
          reduxIntegratedAPI.clothing.getClothingItems(user._id),
          reduxIntegratedAPI.laundry.getLaundryStats(user._id)
        ];

        const [weatherData, outfitData, clothingData, laundryData] = await Promise.allSettled(promises);

        // Process weather data
        if (weatherData.status === 'fulfilled') {
          // Weather data is already set in Redux by the API call
          console.log('Weather data loaded:', weatherData.value.data);
        }

        // Process outfit recommendation
        if (outfitData.status === 'fulfilled') {
          setTodaysOutfit(outfitData.value.data);
        }

        // Process clothing data for stats
        if (clothingData.status === 'fulfilled') {
          // Clothing data is already set in Redux by the API call
          console.log('Clothing data loaded:', clothingData.value.data);
        }

        // Process laundry data
        if (laundryData.status === 'fulfilled') {
          // Laundry data is already set in Redux by the API call
          console.log('Laundry data loaded:', laundryData.value.data);
        }

        // Dashboard data loaded successfully (no notification needed)

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        addNotification({
          type: 'error',
          message: 'Failed to load dashboard data',
          duration: 5000
        });
      }
    };

    fetchDashboardData();
  }, [user?._id, addNotification]);

  const handleAcceptOutfit = async () => {
    if (!todaysOutfit?.outfitSuggestion?.id) return;

    try {
      const response = await reduxIntegratedAPI.recommendations.markRecommendationAsWorn(
        todaysOutfit.outfitSuggestion.id, 
        user._id
      );
      
      addNotification({
        type: 'success',
        message: 'Outfit marked as worn! Check your laundry for items that may need washing.',
        duration: 5000
      });
      
      // Refresh dashboard data
      window.location.reload();
    } catch (err) {
      console.error('Error accepting outfit:', err);
      addNotification({
        type: 'error',
        message: 'Failed to mark outfit as worn',
        duration: 5000
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getWeatherIcon = (weatherType) => {
    if (!weatherType) return '🌤️';
    
    const type = weatherType.toLowerCase();
    if (type.includes('sunny') || type.includes('clear')) return '☀️';
    if (type.includes('cloudy') || type.includes('overcast')) return '☁️';
    if (type.includes('rain') || type.includes('drizzle')) return '🌧️';
    if (type.includes('snow') || type.includes('blizzard')) return '❄️';
    if (type.includes('storm') || type.includes('thunder')) return '⛈️';
    if (type.includes('fog') || type.includes('mist')) return '🌫️';
    if (type.includes('hot')) return '🔥';
    if (type.includes('cold')) return '🧊';
    if (type.includes('wind')) return '💨';
    return '🌤️';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Use Redux loading states
  const isLoading = dataLoading.clothingItems || dataLoading.recommendations || dataLoading.weather || dataLoading.laundry || uiLoading;
  const hasError = dataErrors.clothingItems || dataErrors.recommendations || dataErrors.weather || dataErrors.laundry || uiError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <LoadingSpinner text="Loading your dashboard..." />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-red-400 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-300 mb-6">{hasError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Welcome Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              {getGreeting()}, {user?.name || 'there'}! 👋
            </h1>
            <p className="text-gray-400 text-lg">
              Here's your personalized wardrobe overview
            </p>
          </motion.div>

          {/* Weather & Quick Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Weather Card */}
            <AnimatedCard className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Today's Weather</h3>
                  {weather ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-3xl">{getWeatherIcon(weather.weatherType)}</span>
                        <span className="text-2xl font-bold">{weather.temperature}°C</span>
                      </div>
                      <p className="text-blue-200 capitalize">{weather.weatherType}</p>
                      <p className="text-blue-300 text-sm">{weather.description}</p>
                      <div className="flex justify-between text-xs text-blue-400 mt-2">
                        <span>💧 {weather.humidity}%</span>
                        <span>💨 {weather.windSpeed} km/h</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-blue-200">Weather data unavailable</p>
                  )}
                </div>
              </div>
            </AnimatedCard>

            {/* Wardrobe Stats */}
            <AnimatedCard className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl">
              <div>
                <h3 className="text-lg font-semibold mb-2">Wardrobe</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{clothingItems?.length || 0}</p>
                  <p className="text-purple-200 text-sm">Total Items</p>
                </div>
                <div className="mt-3 text-sm text-purple-300">
                  {[...new Set(clothingItems?.map(item => item.metadata?.category).filter(Boolean))].length || 0} categories
                </div>
              </div>
            </AnimatedCard>

            {/* Laundry Stats */}
            <AnimatedCard className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl">
              <div>
                <h3 className="text-lg font-semibold mb-2">Laundry</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{laundry?.in_laundry || 0}</p>
                  <p className="text-orange-200 text-sm">Items Pending</p>
                </div>
                <div className="mt-3 text-sm text-orange-300">
                  {laundry?.ready_to_wear || 0} ready to wear
                </div>
              </div>
            </AnimatedCard>

            {/* Gemini API Usage */}
            <AnimatedCard className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl">
              <div>
                <h3 className="text-lg font-semibold mb-2">AI Usage</h3>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{apiUsage?.requestsToday || 0}</p>
                  <p className="text-green-200 text-sm">API Calls Today</p>
                </div>
                <div className="mt-3 text-sm text-green-300">
                  {apiUsage?.tokensToday || 0} tokens used
                </div>
                <div className="mt-2 text-xs text-green-400">
                  Rate: {apiUsage?.requestsThisMinute || 0}/min
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Today's Outfit Suggestion */}
          {todaysOutfit && (
            <motion.div variants={itemVariants} className="mb-8">
              <AnimatedCard className="bg-gradient-to-r from-gray-800 to-gray-700 p-8 rounded-xl border border-gray-600">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    ✨ Today's AI Outfit Suggestion
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    >
                      🔄 Regenerate
                    </button>
                    <button
                      onClick={handleAcceptOutfit}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                    >
                      ✅ Accept Outfit
                    </button>
                  </div>
                </div>

                {todaysOutfit.outfitSuggestion?.items && todaysOutfit.outfitSuggestion.items.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {todaysOutfit.outfitSuggestion.items.map((item, index) => (
                      <div key={item._id} className="text-center">
                        <img
                          src={item.imageUrl || 'https://via.placeholder.com/200x200/374151/9CA3AF?text=No+Image'}
                          alt={item.name}
                          className="w-32 h-32 object-cover rounded-lg mx-auto mb-3"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x200/374151/9CA3AF?text=No+Image';
                          }}
                        />
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.metadata?.category}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No outfit suggestion available</p>
                  </div>
                )}

                {todaysOutfit.outfitSuggestion?.text && (
                  <div className="bg-black/30 rounded-lg p-4">
                    <p className="text-gray-200 italic">"{todaysOutfit.outfitSuggestion.text}"</p>
                  </div>
                )}
              </AnimatedCard>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.button
                onClick={() => navigate('/add-clothing')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 p-6 rounded-xl text-center transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-3xl mb-2">➕</div>
                <p className="font-medium">Add Clothing</p>
              </motion.button>

              <motion.button
                onClick={() => navigate('/laundry')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 p-6 rounded-xl text-center transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-3xl mb-2">🧺</div>
                <p className="font-medium">Laundry Bag</p>
              </motion.button>

              <motion.button
                onClick={() => navigate('/stylist')}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 p-6 rounded-xl text-center transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-3xl mb-2">👥</div>
                <p className="font-medium">Stylist Mode</p>
              </motion.button>

              <motion.button
                onClick={() => navigate('/recommendations')}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 p-6 rounded-xl text-center transition-all duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="text-3xl mb-2">🧠</div>
                <p className="font-medium">AI Recommendations</p>
              </motion.button>
            </div>
          </motion.div>

          {/* Recent Items */}
          {clothingItems && clothingItems.length > 0 && (
            <motion.div variants={itemVariants} className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Recently Added</h2>
                <button
                  onClick={() => navigate('/wardrobe')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {clothingItems
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .slice(0, 6)
                  .map((item) => (
                  <motion.div
                    key={item._id}
                    className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-700 transition-colors"
                    onClick={() => navigate(`/wardrobe?item=${item._id}`)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/150x150/374151/9CA3AF?text=No+Image'}
                      alt={item.name}
                      className="w-full h-24 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150x150/374151/9CA3AF?text=No+Image';
                      }}
                    />
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.metadata?.category}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Insights */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold mb-6">Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatedCard className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Most Worn Color</h3>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3"></div>
                  <p className="text-2xl font-bold">Blue</p>
                  <p className="text-gray-400 text-sm">12 items</p>
                </div>
              </AnimatedCard>

              <AnimatedCard className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-lg font-semibold mb-4">Favorite Category</h3>
                <div className="text-center">
                  <div className="text-4xl mb-3">👕</div>
                  <p className="text-2xl font-bold">Tops</p>
                  <p className="text-gray-400 text-sm">Most used category</p>
                </div>
              </AnimatedCard>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
