import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import {
  getWeatherBasedRecommendations,
  getWeatherForecastRecommendations,
  updateWeatherSuitability,
  getWeatherCacheStats,
  clearWeatherCache,
  clearExpiredWeatherCache,
  getWeatherCacheEntries
} from '../controllers/weatherRecommendation.controllers.js';

const weatherRecommendationRouter = express.Router();

// All routes require authentication
weatherRecommendationRouter.use(isAuth);

/**
 * GET /api/weather-recommendations/:userId
 * Get weather-based outfit recommendations
 * Query params: lat, lon, includeForecast
 */
weatherRecommendationRouter.get('/:userId', getWeatherBasedRecommendations);

/**
 * GET /api/weather-recommendations/forecast/:userId
 * Get weather forecast recommendations for planning
 * Query params: lat, lon, days
 */
weatherRecommendationRouter.get('/forecast/:userId', getWeatherForecastRecommendations);

/**
 * PUT /api/weather-recommendations/update-suitability/:clothingId
 * Update clothing item weather suitability
 */
weatherRecommendationRouter.put('/update-suitability/:clothingId', updateWeatherSuitability);

/**
 * GET /api/weather-recommendations/cache/stats
 * Get weather cache statistics
 */
weatherRecommendationRouter.get('/cache/stats', getWeatherCacheStats);

/**
 * DELETE /api/weather-recommendations/cache
 * Clear all weather cache
 */
weatherRecommendationRouter.delete('/cache', clearWeatherCache);

/**
 * DELETE /api/weather-recommendations/cache/expired
 * Clear expired weather cache entries
 */
weatherRecommendationRouter.delete('/cache/expired', clearExpiredWeatherCache);

/**
 * GET /api/weather-recommendations/cache/entries
 * Get weather cache entries (for debugging)
 */
weatherRecommendationRouter.get('/cache/entries', getWeatherCacheEntries);

export default weatherRecommendationRouter;
