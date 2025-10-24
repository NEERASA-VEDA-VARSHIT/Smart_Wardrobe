import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../redux/userSlice";
import { motion, AnimatePresence } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import AnimatedCard from "./AnimatedCard";
import FeedbackButtons from "./FeedbackButtons";
import WeatherWidget from "./WeatherWidget";

export default function RecommendationEngine() {
  const user = useSelector(selectUser);
  const [query, setQuery] = useState("");
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [season, setSeason] = useState("");
  const [formality, setFormality] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [weatherData, setWeatherData] = useState(null);

  const runRecommendation = async () => {
    if (!user?._id) {
      setError("Please log in to get recommendations");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')}/recommendations/outfit/${user._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          query: query || `${occasion || "any"} outfit`,
          occasion: occasion || "casual",
          weather: weather || "normal",
          season: season || "all-season",
          formality: formality || "casual",
          notes: `Generated on ${new Date().toLocaleDateString()}`,
          ...(weatherData && {
            latitude: weatherData.latitude,
            longitude: weatherData.longitude
          })
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || "Failed to get recommendation");
      }

      setResult(data.data);
    } catch (err) {
      console.error("Recommendation error:", err);
      setError(err.message || "Failed to get recommendation");
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = async (recommendationId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')}/recommendations/${recommendationId}/worn`, {
        method: "POST",
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Failed to accept suggestion");
      }

      alert("✅ Outfit marked as worn! Great choice!");
    } catch (e) {
      console.error("Accept error:", e);
      alert("❌ Failed to mark as worn");
    }
  };

  const provideFeedback = async (recommendationId, rating, comment) => {
    setIsSubmittingFeedback(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api')}/recommendations/${recommendationId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ rating, comment }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      setFeedback(prev => ({ ...prev, [recommendationId]: { rating, comment, submitted: true } }));
    } catch (e) {
      console.error("Feedback error:", e);
      alert("❌ Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleQuickFeedback = (recommendationId, isPositive) => {
    const rating = isPositive ? 5 : 1;
    const comment = isPositive ? "Great suggestion!" : "Not quite right for me";
    provideFeedback(recommendationId, rating, comment);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    hover: { 
      scale: 1.05, 
      y: -5,
      transition: { duration: 0.2 }
    }
  };

  const loadingVariants = {
    animate: {
      rotate: 360,
      transition: { duration: 1, repeat: Infinity, ease: "linear" }
    }
  };

  return (
    <motion.div 
      className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        className="text-2xl font-bold text-white mb-6"
        variants={itemVariants}
      >
        🧠 AI Outfit Recommendations
      </motion.h3>

      {/* Weather Widget */}
      <motion.div 
        className="mb-6 flex justify-center"
        variants={itemVariants}
      >
        <WeatherWidget 
          onWeatherUpdate={setWeatherData}
          className="max-w-sm"
        />
      </motion.div>

      {/* Input Form */}
      <motion.div 
        className="space-y-4 mb-6"
        variants={itemVariants}
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            What kind of outfit are you looking for?
          </label>
          <motion.input
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="e.g., 'summer party outfit' or 'work meeting attire'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            whileFocus={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'occasion', label: 'Occasion', options: ['work', 'party', 'casual', 'formal', 'date', 'gym'] },
            { key: 'weather', label: 'Weather', options: ['hot', 'warm', 'cool', 'cold', 'rainy'] },
            { key: 'season', label: 'Season', options: ['spring', 'summer', 'fall', 'winter'] },
            { key: 'formality', label: 'Formality', options: ['casual', 'business-casual', 'business', 'formal'] }
          ].map(({ key, label, options }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
              <motion.select
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={eval(key)}
                onChange={(e) => eval(`set${key.charAt(0).toUpperCase() + key.slice(1)}(e.target.value)`)}
                whileFocus={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <option value="">Any</option>
                {options.map(option => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </motion.select>
            </div>
          ))}
        </div>

        <motion.button
          className="w-full bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          onClick={runRecommendation}
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <LoadingSpinner size="small" text="AI is thinking..." />
          ) : (
            <>
              <span>✨</span>
              <span>Get AI Recommendation</span>
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            ❌ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {result && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Weather Information */}
            {result.weather && (
              <AnimatedCard 
                className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500 p-6 mb-6"
                delay={0.1}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{result.weather.condition.emoji}</div>
                  <div>
                    <h4 className="text-lg font-semibold text-cyan-300">
                      {result.weather.summary}
                    </h4>
                    <p className="text-cyan-100 text-sm">
                      Recommendations: {result.weather.recommendations.join(', ')}
                    </p>
                  </div>
                </div>
              </AnimatedCard>
            )}

            {/* AI Suggestion with Reasoning */}
            {result.aiSuggestion && (
              <AnimatedCard 
                className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500 p-6"
                delay={0.2}
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse-glow"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🤖
                  </motion.div>
                  <h4 className="text-lg font-semibold text-blue-300 ai-reasoning">AI Stylist Reasoning</h4>
                </div>
                <motion.p 
                  className="text-blue-100 whitespace-pre-line leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {result.aiSuggestion}
                </motion.p>
              </AnimatedCard>
            )}

            {/* Recommended Items with Animations */}
            <div>
              <motion.h4 
                className="text-lg font-semibold text-white mb-4"
                variants={itemVariants}
              >
                👕 Recommended Items ({result.totalItems} found)
              </motion.h4>
              
              {/* Items by Category */}
              {Object.entries(result.itemsByCategory || {}).map(([category, items], categoryIndex) => (
                <motion.div 
                  key={category} 
                  className="mb-8"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: categoryIndex * 0.2 }}
                >
                  <h5 className="text-md font-medium text-gray-300 mb-4 capitalize flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    {category} ({items.length} items)
                  </h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {items.slice(0, 6).map((item, index) => (
                      <AnimatedCard 
                        key={item._id} 
                        className="overflow-hidden cursor-pointer group"
                        delay={index * 0.1}
                        hover={true}
                      >
                        <div className="relative overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.metadata?.description || 'Clothing item'} 
                            className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/200x200/374151/9CA3AF?text=No+Image';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black/50 rounded-full px-2 py-1">
                            <span className="text-xs text-yellow-400 font-medium">
                              {(item.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-gray-300 mb-1 font-medium">
                            {item.metadata?.category || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-400 mb-2 line-clamp-2">
                            {item.metadata?.description?.slice(0, 40) || 'No description'}...
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-yellow-400 font-medium">
                              Match: {(item.similarity * 100).toFixed(0)}%
                            </span>
                            <motion.button
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              View Details
                            </motion.button>
                          </div>
                        </div>
                      </AnimatedCard>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Action Buttons */}
            <motion.div 
              className="space-y-4 pt-6 border-t border-gray-600"
              variants={itemVariants}
            >
              {/* Accept Button */}
              <motion.button 
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
                onClick={() => acceptSuggestion(result.recommendation?._id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>✅</span>
                <span>Accept & Mark as Worn</span>
              </motion.button>

              {/* Feedback Section */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-300 text-center">How was this recommendation?</h5>
                <FeedbackButtons
                  recommendationId={result.recommendation?._id}
                  onSubmitFeedback={provideFeedback}
                  isSubmitting={isSubmittingFeedback}
                  hasSubmitted={feedback[result.recommendation?._id]?.submitted}
                />
              </div>

              {/* Close Button */}
              <motion.button 
                className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                onClick={() => setResult(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>❌</span>
                <span>Close</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
