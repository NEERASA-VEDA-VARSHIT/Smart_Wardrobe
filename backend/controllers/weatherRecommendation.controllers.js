import ClothingItem from "../models/clothingItem.model.js";
import { 
  getWeatherData, 
  getWeatherBasedClothingAdvice, 
  getWeatherForecast,
  getCacheStats,
  clearCache,
  clearExpiredCache,
  getCacheEntries
} from "../services/weatherService.js";
import { geminiModel } from "../services/geminiService.js";
import { findSimilarItemsByText } from "../services/vectorSearch.js";

/**
 * Get weather-based outfit recommendations
 * GET /api/weather-recommendations/:userId
 */
export const getWeatherBasedRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { lat, lon, includeForecast = false } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const startTime = Date.now();
    console.log(`🚀 Starting weather recommendations for user ${userId}`);

    // Parallel processing: Get weather data and clothing items simultaneously
    const [weather, weatherSuitableItems] = await Promise.all([
      getWeatherData(parseFloat(lat), parseFloat(lon)),
      // Pre-fetch clothing items without weather filters first
      ClothingItem.find({
        userId,
        isArchived: false,
        cleanlinessStatus: { $in: ["fresh", "worn_wearable"] }
      })
      .select('name imageUrl metadata cleanlinessStatus freshnessScore')
      .sort({ freshnessScore: -1 })
      .limit(20)
      .lean() // Use lean() for faster queries
    ]);
    
    if (!weather) {
      return res.status(400).json({
        success: false,
        message: 'Weather data unavailable'
      });
    }

    // Get weather-based clothing advice
    const weatherAdvice = getWeatherBasedClothingAdvice(weather);

    // Filter items based on weather advice (client-side for speed)
    const filteredItems = weatherSuitableItems.filter(item => {
      if (weatherAdvice.recommendedCategories.length === 0) return true;
      return weatherAdvice.recommendedCategories.includes(item.metadata?.category);
    });

    // Generate AI-powered weather-aware outfit suggestion (optimized for speed)
    const weatherPrompt = `Weather: ${weather.temperature}°C, ${weather.weatherType}. Items: ${filteredItems.slice(0, 5).map(item => item.name).join(', ')}. Suggest outfit.`;

    let aiSuggestion = null;
    
    // Only generate AI suggestion if we have enough items
    if (filteredItems.length >= 2) {
      try {
        const result = await geminiModel.generateContent(weatherPrompt);
        const response = await result.response;
        const text = response.text();
        
        aiSuggestion = {
          outfitSuggestion: text.substring(0, 150) + "...",
          reasoning: `Perfect for ${weather.temperature}°C ${weather.weatherType} weather`,
          items: filteredItems.slice(0, 3).map(item => ({
            name: item.name,
            category: item.metadata?.category || 'clothing',
            reasoning: `Good for ${weather.weatherType} weather`
          })),
          weatherTips: weatherAdvice.advice
        };
      } catch (aiError) {
        console.warn('AI suggestion failed, using fallback');
        aiSuggestion = {
          outfitSuggestion: `Weather-appropriate outfit for ${weather.temperature}°C`,
          reasoning: weatherAdvice.advice,
          items: filteredItems.slice(0, 3).map(item => ({
            name: item.name,
            category: item.metadata?.category || 'clothing',
            reasoning: `Suitable for current weather`
          })),
          weatherTips: "Consider the weather conditions when choosing your outfit"
        };
      }
    } else {
      // Fallback for insufficient items
      aiSuggestion = {
        outfitSuggestion: "Add more clothing items for better recommendations",
        reasoning: "Limited wardrobe items available",
        items: filteredItems.map(item => ({
          name: item.name,
          category: item.metadata?.category || 'clothing',
          reasoning: "Available item"
        })),
        weatherTips: weatherAdvice.advice
      };
    }

    // Get forecast if requested
    let forecast = null;
    if (includeForecast === 'true') {
      forecast = await getWeatherForecast(parseFloat(lat), parseFloat(lon), 3);
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`⚡ Weather recommendations completed in ${processingTime}ms`);
    
    res.status(200).json({
      success: true,
      data: {
        weather: {
          temperature: weather.temperature,
          weatherType: weather.weatherType,
          description: weather.weatherDescription,
          humidity: weather.humidity,
          windSpeed: weather.windSpeed,
          time: weather.time,
          timezone: weather.timezone
        },
        weatherAdvice,
        aiSuggestion,
        suitableItems: filteredItems, // Use filtered items instead of all items
        totalItems: filteredItems.length,
        forecast: forecast,
        performance: {
          processingTime: `${processingTime}ms`,
          cacheHit: weather.cached || false,
          itemsFiltered: weatherSuitableItems.length - filteredItems.length
        }
      }
    });

  } catch (error) {
    console.error('Weather recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather-based recommendations',
      error: error.message
    });
  }
};

/**
 * Get weather forecast for planning outfits
 * GET /api/weather-recommendations/forecast/:userId
 */
export const getWeatherForecastRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { lat, lon, days = 3 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const forecast = await getWeatherForecast(parseFloat(lat), parseFloat(lon), parseInt(days));
    
    if (forecast.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Weather forecast unavailable'
      });
    }

    // Generate outfit suggestions for each day
    const dailyRecommendations = forecast.map(day => {
      const weatherAdvice = getWeatherBasedClothingAdvice({
        temperature: (day.maxTemp + day.minTemp) / 2,
        weatherType: day.weatherCode > 50 ? 'rainy' : 'normal',
        humidity: 50 // Default humidity for forecast
      });

      return {
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        maxTemp: day.maxTemp,
        minTemp: day.minTemp,
        weatherCode: day.weatherCode,
        weatherAdvice,
        outfitSuggestion: `Plan for ${day.maxTemp}°C high, ${day.minTemp}°C low. ${weatherAdvice.advice}`
      };
    });

    res.status(200).json({
      success: true,
      data: {
        forecast: dailyRecommendations,
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        }
      }
    });

  } catch (error) {
    console.error('Weather forecast recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather forecast recommendations',
      error: error.message
    });
  }
};

/**
 * Update clothing item with weather suitability metadata
 * PUT /api/weather-recommendations/update-suitability/:clothingId
 */
export const updateWeatherSuitability = async (req, res) => {
  try {
    const { clothingId } = req.params;
    const { userId, weatherSuitability } = req.body;

    if (!userId || !weatherSuitability) {
      return res.status(400).json({
        success: false,
        message: 'User ID and weather suitability are required'
      });
    }

    const clothingItem = await ClothingItem.findOneAndUpdate(
      { _id: clothingId, userId },
      { 
        $set: { 
          'metadata.weatherSuitability': weatherSuitability 
        } 
      },
      { new: true }
    );

    if (!clothingItem) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Weather suitability updated successfully',
      data: clothingItem
    });

  } catch (error) {
    console.error('Update weather suitability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update weather suitability',
      error: error.message
    });
  }
};

/**
 * Get weather cache statistics
 * GET /api/weather-recommendations/cache/stats
 */
export const getWeatherCacheStats = async (req, res) => {
  try {
    const stats = getCacheStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Clear weather cache
 * DELETE /api/weather-recommendations/cache
 */
export const clearWeatherCache = async (req, res) => {
  try {
    clearCache();
    
    res.status(200).json({
      success: true,
      message: 'Weather cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Clear expired weather cache entries
 * DELETE /api/weather-recommendations/cache/expired
 */
export const clearExpiredWeatherCache = async (req, res) => {
  try {
    clearExpiredCache();
    
    res.status(200).json({
      success: true,
      message: 'Expired weather cache entries cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing expired cache:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get weather cache entries (for debugging)
 * GET /api/weather-recommendations/cache/entries
 */
export const getWeatherCacheEntries = async (req, res) => {
  try {
    const entries = getCacheEntries();
    
    res.status(200).json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error getting cache entries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
