import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../redux/userSlice';
import { motion } from 'framer-motion';
import WeatherRecommendation from '../components/WeatherRecommendation';
import LoadingSpinner from '../components/LoadingSpinner';

const Weather = () => {
  const user = useSelector(selectUser);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLocationUpdate = (newLocation) => {
    setLocation(newLocation);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl">Please sign in to view weather recommendations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">🌦️ Weather Stylist</h1>
          <p className="text-gray-400 text-lg">
            Get AI-powered outfit recommendations based on real-time weather
          </p>
        </motion.div>

        {/* Weather Recommendation Component */}
        <WeatherRecommendation onLocationUpdate={handleLocationUpdate} />

        {/* Location Info */}
        {location && (
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <p className="text-gray-500 text-sm">
              📍 Location: {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Weather;
