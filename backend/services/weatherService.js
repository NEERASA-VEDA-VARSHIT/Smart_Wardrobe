import axios from "axios";

// In-memory cache for weather data
const weatherCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const FORECAST_CACHE_DURATION = 60 * 60 * 1000; // 1 hour for forecasts

/**
 * Generate cache key for weather data
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} type - 'current' or 'forecast'
 * @returns {string} - Cache key
 */
const generateCacheKey = (lat, lon, type = 'current') => {
  // Round coordinates to 2 decimal places for cache efficiency
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLon = Math.round(lon * 100) / 100;
  return `${type}_${roundedLat}_${roundedLon}`;
};

/**
 * Get cached weather data
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} - Cached data or null
 */
const getCachedWeather = (cacheKey) => {
  const cached = weatherCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_DURATION) {
    weatherCache.delete(cacheKey);
    return null;
  }
  
  console.log(`🌤️ Using cached weather data for ${cacheKey}`);
  return cached.data;
};

/**
 * Set cached weather data
 * @param {string} cacheKey - Cache key
 * @param {Object} data - Weather data to cache
 */
const setCachedWeather = (cacheKey, data) => {
  weatherCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`🌤️ Cached weather data for ${cacheKey}`);
};

/**
 * Get cached forecast data
 * @param {string} cacheKey - Cache key
 * @returns {Object|null} - Cached data or null
 */
const getCachedForecast = (cacheKey) => {
  const cached = weatherCache.get(cacheKey);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > FORECAST_CACHE_DURATION) {
    weatherCache.delete(cacheKey);
    return null;
  }
  
  console.log(`📅 Using cached forecast data for ${cacheKey}`);
  return cached.data;
};

/**
 * Set cached forecast data
 * @param {string} cacheKey - Cache key
 * @param {Object} data - Forecast data to cache
 */
const setCachedForecast = (cacheKey, data) => {
  weatherCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
  console.log(`📅 Cached forecast data for ${cacheKey}`);
};

// Clear expired cache every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    const isExpired = (key.startsWith('current_') && now - value.timestamp > CACHE_DURATION) ||
                     (key.startsWith('forecast_') && now - value.timestamp > FORECAST_CACHE_DURATION);
    
    if (isExpired) {
      weatherCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get current weather data from Open-Meteo API with caching
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Object|null} - Weather data or null if error
 */
export const getWeatherData = async (lat, lon) => {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(lat, lon, 'current');
    const cachedData = getCachedWeather(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    console.log(`🌤️ Fetching fresh weather data for ${lat}, ${lon}`);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,weathercode`;
    
    const { data } = await axios.get(url);
    
    if (!data.current_weather) {
      throw new Error('No weather data received');
    }

    // Map weather codes to human-readable descriptions
    const weatherCodeMap = {
      0: 'clear_sky',
      1: 'mainly_clear',
      2: 'partly_cloudy',
      3: 'overcast',
      45: 'foggy',
      48: 'depositing_rime_fog',
      51: 'light_drizzle',
      53: 'moderate_drizzle',
      55: 'dense_drizzle',
      56: 'light_freezing_drizzle',
      57: 'dense_freezing_drizzle',
      61: 'slight_rain',
      63: 'moderate_rain',
      65: 'heavy_rain',
      66: 'light_freezing_rain',
      67: 'heavy_freezing_rain',
      71: 'slight_snow_fall',
      73: 'moderate_snow_fall',
      75: 'heavy_snow_fall',
      77: 'snow_grains',
      80: 'slight_rain_showers',
      81: 'moderate_rain_showers',
      82: 'violent_rain_showers',
      85: 'slight_snow_showers',
      86: 'heavy_snow_showers',
      95: 'thunderstorm',
      96: 'thunderstorm_with_slight_hail',
      99: 'thunderstorm_with_heavy_hail'
    };

    const weatherCode = data.current_weather.weathercode;
    const weatherDescription = weatherCodeMap[weatherCode] || 'unknown';

    // Determine weather type for clothing recommendations
    let weatherType = 'normal';
    const temp = data.current_weather.temperature;
    const humidity = data.hourly?.relativehumidity_2m?.[0] || 50;

    if (temp > 30) {
      weatherType = 'hot';
    } else if (temp < 10) {
      weatherType = 'cold';
    } else if (temp < 18) {
      weatherType = 'cool';
    }

    // Add weather condition modifiers
    if (['slight_rain', 'moderate_rain', 'heavy_rain', 'slight_rain_showers', 'moderate_rain_showers', 'violent_rain_showers'].includes(weatherDescription)) {
      weatherType += '_rainy';
    } else if (['thunderstorm', 'thunderstorm_with_slight_hail', 'thunderstorm_with_heavy_hail'].includes(weatherDescription)) {
      weatherType += '_stormy';
    } else if (['slight_snow_fall', 'moderate_snow_fall', 'heavy_snow_fall'].includes(weatherDescription)) {
      weatherType += '_snowy';
    } else if (['foggy', 'depositing_rime_fog'].includes(weatherDescription)) {
      weatherType += '_foggy';
    }

    // Add humidity consideration
    if (humidity > 80) {
      weatherType += '_humid';
    }

    const weatherData = {
      temperature: temp,
      weatherCode: weatherCode,
      weatherDescription: weatherDescription,
      weatherType: weatherType,
      humidity: humidity,
      windSpeed: data.current_weather.windspeed,
      time: data.current_weather.time,
      timezone: data.timezone,
      location: {
        latitude: data.latitude,
        longitude: data.longitude
      }
    };

    // Cache the result using the new caching system
    setCachedWeather(cacheKey, weatherData);
    
    return weatherData;

  } catch (error) {
    console.error("Weather API error:", error.message);
    return null;
  }
};

/**
 * Get weather-based clothing recommendations
 * @param {Object} weather - Weather data object
 * @returns {Object} - Clothing recommendations based on weather
 */
export const getWeatherBasedClothingAdvice = (weather) => {
  if (!weather) {
    return {
      advice: "Weather data unavailable",
      recommendedCategories: [],
      avoidCategories: [],
      materials: [],
      colors: []
    };
  }

  const { temperature, weatherType, humidity } = weather;
  let advice = "";
  let recommendedCategories = [];
  let avoidCategories = [];
  let materials = [];
  let colors = [];

  // Temperature-based recommendations
  if (temperature > 30) {
    advice += "It's hot! Choose lightweight, breathable fabrics. ";
    recommendedCategories = ['shorts', 'tank_tops', 'light_dresses', 'sandals'];
    avoidCategories = ['heavy_jackets', 'thick_sweaters', 'boots'];
    materials = ['cotton', 'linen', 'bamboo', 'lightweight_synthetic'];
    colors = ['light_colors', 'white', 'pastels'];
  } else if (temperature < 10) {
    advice += "It's cold! Layer up with warm clothing. ";
    recommendedCategories = ['coats', 'sweaters', 'long_pants', 'boots', 'gloves'];
    avoidCategories = ['shorts', 'tank_tops', 'sandals'];
    materials = ['wool', 'cashmere', 'down', 'fleece', 'thick_cotton'];
    colors = ['dark_colors', 'earth_tones'];
  } else if (temperature < 18) {
    advice += "Cool weather - perfect for layering. ";
    recommendedCategories = ['light_jackets', 'long_sleeves', 'jeans', 'sneakers'];
    avoidCategories = ['shorts', 'tank_tops'];
    materials = ['cotton', 'denim', 'light_wool'];
    colors = ['neutral_colors', 'autumn_tones'];
  } else {
    advice += "Mild weather - versatile clothing options. ";
    recommendedCategories = ['t_shirts', 'light_sweaters', 'jeans', 'sneakers'];
    materials = ['cotton', 'linen', 'light_synthetic'];
    colors = ['any_colors'];
  }

  // Weather condition recommendations
  if (weatherType.includes('rainy')) {
    advice += "Rain expected - choose water-resistant options. ";
    recommendedCategories.push('rain_jackets', 'waterproof_shoes', 'umbrellas');
    avoidCategories.push('suede', 'leather_shoes', 'delicate_fabrics');
    materials.push('waterproof', 'gore_tex', 'rubber');
  }

  if (weatherType.includes('stormy')) {
    advice += "Stormy weather - avoid loose items and choose secure clothing. ";
    avoidCategories.push('loose_hats', 'flowing_dresses', 'delicate_accessories');
  }

  if (weatherType.includes('humid')) {
    advice += "High humidity - choose breathable fabrics. ";
    materials = materials.filter(m => ['cotton', 'linen', 'bamboo'].includes(m));
    avoidCategories.push('synthetic_fabrics', 'tight_clothing');
  }

  return {
    advice: advice.trim(),
    recommendedCategories,
    avoidCategories,
    materials,
    colors,
    weatherType,
    temperature
  };
};

/**
 * Get weather forecast for the next few days with caching
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} days - Number of days to forecast (default: 3)
 * @returns {Array} - Array of weather forecasts
 */
export const getWeatherForecast = async (lat, lon, days = 3) => {
  try {
    // Check cache first
    const cacheKey = generateCacheKey(lat, lon, 'forecast');
    const cachedData = getCachedForecast(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    console.log(`📅 Fetching fresh weather forecast for ${lat}, ${lon} (${days} days)`);
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=${days}`;
    
    const { data } = await axios.get(url);
    
    if (!data.daily) {
      throw new Error('No forecast data received');
    }

    const forecasts = [];
    for (let i = 0; i < days; i++) {
      forecasts.push({
        date: data.daily.time[i],
        maxTemp: data.daily.temperature_2m_max[i],
        minTemp: data.daily.temperature_2m_min[i],
        weatherCode: data.daily.weathercode[i],
        dayOfWeek: new Date(data.daily.time[i]).toLocaleDateString('en-US', { weekday: 'long' })
      });
    }

    // Cache the forecast (shorter cache duration for forecasts)
    // Cache the result using the new caching system
    setCachedForecast(cacheKey, forecasts);
    
    return forecasts;

  } catch (error) {
    console.error("Weather forecast error:", error.message);
    return [];
  }
};

/**
 * Get cache statistics
 * @returns {Object} - Cache statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let currentEntries = 0;
  let forecastEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, value] of weatherCache.entries()) {
    const isExpired = (key.startsWith('current_') && now - value.timestamp > CACHE_DURATION) ||
                     (key.startsWith('forecast_') && now - value.timestamp > FORECAST_CACHE_DURATION);
    
    if (isExpired) {
      expiredEntries++;
    } else if (key.startsWith('current_')) {
      currentEntries++;
    } else if (key.startsWith('forecast_')) {
      forecastEntries++;
    }
  }

  return {
    totalEntries: weatherCache.size,
    currentWeatherEntries: currentEntries,
    forecastEntries,
    expiredEntries,
    cacheDuration: CACHE_DURATION / 1000 / 60, // in minutes
    forecastCacheDuration: FORECAST_CACHE_DURATION / 1000 / 60, // in minutes
    hitRate: ((currentEntries + forecastEntries) / weatherCache.size * 100).toFixed(2) + '%'
  };
};

/**
 * Clear all cache entries
 */
export const clearCache = () => {
  weatherCache.clear();
  console.log('🧹 Weather cache cleared');
};

/**
 * Clear expired cache entries only (exported version)
 */
export const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of weatherCache.entries()) {
    const isExpired = (key.startsWith('current_') && now - value.timestamp > CACHE_DURATION) ||
                     (key.startsWith('forecast_') && now - value.timestamp > FORECAST_CACHE_DURATION);
    
    if (isExpired) {
      weatherCache.delete(key);
    }
  }
  console.log('🧹 Expired weather cache entries cleared');
};

/**
 * Get cache entries for debugging
 * @returns {Array} - Array of cache entries
 */
export const getCacheEntries = () => {
  const entries = [];
  const now = Date.now();
  
  for (const [key, value] of weatherCache.entries()) {
    const isExpired = (key.startsWith('current_') && now - value.timestamp > CACHE_DURATION) ||
                     (key.startsWith('forecast_') && now - value.timestamp > FORECAST_CACHE_DURATION);
    
    entries.push({
      key,
      timestamp: value.timestamp,
      age: now - value.timestamp,
      isValid: !isExpired,
      dataKeys: Object.keys(value.data || {})
    });
  }
  return entries;
};