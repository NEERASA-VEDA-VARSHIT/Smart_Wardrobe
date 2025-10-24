import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from './AnimatedCard';
import LoadingSpinner from './LoadingSpinner';
import StatusIndicator from './StatusIndicator';

const WeatherRecommendation = ({ onLocationUpdate }) => {
  const user = useSelector(selectUser);
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [showForecast, setShowForecast] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        fetchWeatherRecommendations(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to get your location. Please enable location access.');
        setLoading(false);
      }
    );
  };

  // Fetch weather-based recommendations
  const fetchWeatherRecommendations = async (lat, lon) => {
    if (!user?._id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')}/weather-recommendations/${user._id}?lat=${lat}&lon=${lon}&includeForecast=true`,
        {
          credentials: 'include'
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setWeatherData(data.data.weather);
        setRecommendations(data.data);
        setForecast(data.data.forecast);
        
        // Notify parent component about location
        if (onLocationUpdate) {
          onLocationUpdate({ lat, lon });
        }
      } else {
        setError(data.message || 'Failed to get weather recommendations');
      }
    } catch (err) {
      console.error('Error fetching weather recommendations:', err);
      setError('Failed to get weather recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Get weather emoji based on weather code
  const getWeatherEmoji = (weatherCode) => {
    const emojiMap = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
      45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌦️', 55: '🌦️',
      61: '🌧️', 63: '🌧️', 65: '🌧️',
      71: '❄️', 73: '❄️', 75: '❄️',
      80: '🌦️', 81: '🌧️', 82: '⛈️',
      95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return emojiMap[weatherCode] || '🌤️';
  };

  // Get temperature color
  const getTemperatureColor = (temp) => {
    if (temp > 30) return 'text-red-400';
    if (temp > 20) return 'text-yellow-400';
    if (temp > 10) return 'text-blue-400';
    return 'text-blue-600';
  };

  useEffect(() => {
    getCurrentLocation();
  }, [user?._id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="large" text="Getting weather data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🌍</div>
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button
          onClick={getCurrentLocation}
          className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!weatherData || !recommendations) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Weather Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <AnimatedCard className="p-6 text-center" delay={0.1}>
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-6xl">
              {getWeatherEmoji(weatherData.weatherCode)}
            </span>
            <div>
              <div className={`text-4xl font-bold ${getTemperatureColor(weatherData.temperature)}`}>
                {Math.round(weatherData.temperature)}°C
              </div>
              <div className="text-gray-400 capitalize">
                {weatherData.description.replace(/_/g, ' ')}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <div className="font-semibold">Humidity</div>
              <div>{weatherData.humidity}%</div>
            </div>
            <div>
              <div className="font-semibold">Wind</div>
              <div>{weatherData.windSpeed} km/h</div>
            </div>
            <div>
              <div className="font-semibold">Type</div>
              <div className="capitalize">{weatherData.weatherType}</div>
            </div>
          </div>
        </AnimatedCard>
      </motion.div>

      {/* AI Suggestion */}
      {recommendations.aiSuggestion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AnimatedCard className="p-6" delay={0.2}>
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl">🤖</div>
              <h3 className="text-xl font-semibold text-white">AI Weather Stylist</h3>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-lg mb-4">
              <p className="text-white font-medium mb-2">
                {recommendations.aiSuggestion.outfitSuggestion}
              </p>
              <p className="text-gray-300 text-sm">
                {recommendations.aiSuggestion.reasoning}
              </p>
            </div>

            {recommendations.aiSuggestion.items && recommendations.aiSuggestion.items.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-white mb-2">Suggested Items:</h4>
                {recommendations.aiSuggestion.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                    <span className="text-sm font-medium text-yellow-400 capitalize">
                      {item.category}:
                    </span>
                    <span className="text-gray-300">{item.description}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {item.reasoning}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {recommendations.aiSuggestion.weatherTips && (
              <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  💡 {recommendations.aiSuggestion.weatherTips}
                </p>
              </div>
            )}
          </AnimatedCard>
        </motion.div>
      )}

      {/* Weather Advice */}
      {recommendations.weatherAdvice && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <AnimatedCard className="p-6" delay={0.3}>
            <h3 className="text-lg font-semibold text-white mb-4">🌦️ Weather Advice</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-400 mb-2">✅ Recommended</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendations.weatherAdvice.recommendedCategories.map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm">
                      {category.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-400 mb-2">❌ Avoid</h4>
                <div className="flex flex-wrap gap-2">
                  {recommendations.weatherAdvice.avoidCategories.map((category, index) => (
                    <span key={index} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-sm">
                      {category.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="font-medium text-blue-400 mb-2">🧵 Best Materials</h4>
              <div className="flex flex-wrap gap-2">
                {recommendations.weatherAdvice.materials.map((material, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm">
                    {material.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedCard>
        </motion.div>
      )}

      {/* Forecast Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-center"
      >
        <button
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            showForecast
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
          onClick={() => setShowForecast(!showForecast)}
        >
          {showForecast ? '📅 Hide 3-Day Forecast' : '📅 Show 3-Day Forecast'}
        </button>
      </motion.div>

      {/* Weather Forecast */}
      {showForecast && forecast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <AnimatedCard className="p-6" delay={0.5}>
            <h3 className="text-lg font-semibold text-white mb-4">📅 3-Day Weather Forecast</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecast.map((day, index) => (
                <div key={index} className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="font-semibold text-white mb-2">{day.dayOfWeek}</div>
                    <div className="text-2xl mb-2">{getWeatherEmoji(day.weatherCode)}</div>
                    <div className="text-sm text-gray-400 mb-2">
                      {day.maxTemp}°C / {day.minTemp}°C
                    </div>
                    <div className="text-xs text-gray-300">
                      {day.outfitSuggestion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </motion.div>
      )}
    </div>
  );
};

export default WeatherRecommendation;
