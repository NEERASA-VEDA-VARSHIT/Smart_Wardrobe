import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WeatherWidget = ({ onWeatherUpdate, className = "" }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  // Get user's location
  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError(null);
      },
      (err) => {
        setError('Unable to retrieve your location');
        setLoading(false);
      }
    );
  };

  // Fetch weather data
  const fetchWeather = async (lat, lon) => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability&daily=weathercode,temperature_2m_max,temperature_2m_min`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      const weatherData = {
        temperature: data.current_weather.temperature,
        weathercode: data.current_weather.weathercode,
        windspeed: data.current_weather.windspeed,
        time: data.current_weather.time,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone
        }
      };

      setWeather(weatherData);
      
      // Notify parent component
      if (onWeatherUpdate) {
        onWeatherUpdate({
          latitude: lat,
          longitude: lon,
          weather: weatherData
        });
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  // Get weather condition details
  const getWeatherCondition = (weathercode) => {
    const conditions = {
      0: { condition: "clear", description: "Clear sky", emoji: "☀️" },
      1: { condition: "mostly_clear", description: "Mainly clear", emoji: "🌤️" },
      2: { condition: "partly_cloudy", description: "Partly cloudy", emoji: "⛅" },
      3: { condition: "overcast", description: "Overcast", emoji: "☁️" },
      45: { condition: "foggy", description: "Foggy", emoji: "🌫️" },
      48: { condition: "foggy", description: "Depositing rime fog", emoji: "🌫️" },
      51: { condition: "light_rain", description: "Light drizzle", emoji: "🌦️" },
      53: { condition: "moderate_rain", description: "Moderate drizzle", emoji: "🌦️" },
      55: { condition: "heavy_rain", description: "Heavy drizzle", emoji: "🌧️" },
      61: { condition: "light_rain", description: "Slight rain", emoji: "🌦️" },
      63: { condition: "moderate_rain", description: "Moderate rain", emoji: "🌧️" },
      65: { condition: "heavy_rain", description: "Heavy rain", emoji: "🌧️" },
      71: { condition: "light_snow", description: "Slight snow", emoji: "🌨️" },
      73: { condition: "moderate_snow", description: "Moderate snow", emoji: "❄️" },
      75: { condition: "heavy_snow", description: "Heavy snow", emoji: "❄️" },
      77: { condition: "snow_grains", description: "Snow grains", emoji: "🌨️" },
      80: { condition: "light_rain", description: "Slight rain showers", emoji: "🌦️" },
      81: { condition: "moderate_rain", description: "Moderate rain showers", emoji: "🌧️" },
      82: { condition: "heavy_rain", description: "Heavy rain showers", emoji: "🌧️" },
      85: { condition: "light_snow", description: "Slight snow showers", emoji: "🌨️" },
      86: { condition: "heavy_snow", description: "Heavy snow showers", emoji: "❄️" },
      95: { condition: "thunderstorm", description: "Thunderstorm", emoji: "⛈️" },
      96: { condition: "thunderstorm", description: "Thunderstorm with slight hail", emoji: "⛈️" },
      99: { condition: "thunderstorm", description: "Thunderstorm with heavy hail", emoji: "⛈️" }
    };

    return conditions[weathercode] || { condition: "unknown", description: "Unknown", emoji: "❓" };
  };

  // Get temperature color
  const getTemperatureColor = (temp) => {
    if (temp >= 30) return 'text-red-400';
    if (temp >= 25) return 'text-orange-400';
    if (temp >= 20) return 'text-yellow-400';
    if (temp >= 15) return 'text-green-400';
    if (temp >= 10) return 'text-blue-400';
    return 'text-blue-600';
  };

  // Get weather recommendations
  const getWeatherRecommendations = (temp, condition) => {
    const recommendations = [];
    
    if (temp >= 30) {
      recommendations.push('Light fabrics', 'Short sleeves', 'Sun protection');
    } else if (temp >= 25) {
      recommendations.push('Light layers', 'Cotton materials');
    } else if (temp >= 18) {
      recommendations.push('Versatile layers');
    } else if (temp >= 10) {
      recommendations.push('Long sleeves', 'Light jacket');
    } else {
      recommendations.push('Warm layers', 'Heavy jacket');
    }

    if (condition.includes('rain')) {
      recommendations.push('Waterproof items', 'Avoid suede');
    } else if (condition.includes('snow')) {
      recommendations.push('Warm clothing', 'Good traction shoes');
    } else if (condition.includes('sun')) {
      recommendations.push('Sun protection', 'Light colors');
    }

    return recommendations;
  };

  useEffect(() => {
    if (location) {
      fetchWeather(location.latitude, location.longitude);
    }
  }, [location]);

  if (loading) {
    return (
      <motion.div 
        className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
          <span className="text-gray-300 text-sm">Getting weather...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className={`bg-red-900/20 backdrop-blur-sm rounded-lg p-4 ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <p className="text-red-400 text-sm mb-2">{error}</p>
          <button
            onClick={getLocation}
            className="px-3 py-1 bg-yellow-500 text-black rounded text-xs hover:bg-yellow-400 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (!weather) {
    return (
      <motion.div 
        className={`bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <p className="text-gray-300 text-sm mb-2">Get weather-based recommendations</p>
          <button
            onClick={getLocation}
            className="px-4 py-2 bg-yellow-500 text-black rounded text-sm hover:bg-yellow-400 transition-colors font-medium"
          >
            🌤️ Get Weather
          </button>
        </div>
      </motion.div>
    );
  }

  const condition = getWeatherCondition(weather.weathercode);
  const recommendations = getWeatherRecommendations(weather.temperature, condition.condition);

  return (
    <motion.div 
      className={`bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold text-sm">Current Weather</h3>
        <button
          onClick={() => fetchWeather(location.latitude, location.longitude)}
          className="text-gray-400 hover:text-white transition-colors"
          title="Refresh weather"
        >
          🔄
        </button>
      </div>

      <div className="flex items-center space-x-3 mb-3">
        <div className="text-3xl">{condition.emoji}</div>
        <div>
          <div className={`text-2xl font-bold ${getTemperatureColor(weather.temperature)}`}>
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-gray-300 text-sm">{condition.description}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-400">
          Wind: {weather.windspeed} km/h
        </div>
        
        <div className="text-xs text-gray-300">
          <strong>Recommendations:</strong>
        </div>
        <div className="flex flex-wrap gap-1">
          {recommendations.slice(0, 3).map((rec, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
            >
              {rec}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;
