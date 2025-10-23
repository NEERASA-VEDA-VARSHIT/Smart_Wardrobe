import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { recommendationLimiter } from '../middlewares/rateLimiter.js';
import {
  recommendOutfits,
  findSimilarItems,
  getComplementaryItems,
  getRecommendationHistory,
  provideFeedback,
  markAsWorn
} from '../controllers/recommendation.controllers.js';

const recommendationRouter = express.Router();

// All routes require authentication
recommendationRouter.use(isAuth);

/**
 * POST /api/recommendations/outfit/:userId
 * Generate AI-powered outfit recommendations
 */
recommendationRouter.post('/outfit/:userId', recommendationLimiter, recommendOutfits);

/**
 * GET /api/recommendations/weather/:userId
 * Get weather-based outfit recommendations
 */
recommendationRouter.get('/weather/:userId', recommendOutfits);

/**
 * GET /api/recommendations/similar/:itemId
 * Find similar items to a specific clothing item
 */
recommendationRouter.get('/similar/:itemId', findSimilarItems);

/**
 * GET /api/recommendations/complementary/:itemId
 * Get complementary items for an outfit
 */
recommendationRouter.get('/complementary/:itemId', getComplementaryItems);

/**
 * GET /api/recommendations/history/:userId
 * Get user's outfit recommendation history
 */
recommendationRouter.get('/history/:userId', getRecommendationHistory);

/**
 * POST /api/recommendations/:recommendationId/feedback
 * Provide feedback on an outfit recommendation
 */
recommendationRouter.post('/:recommendationId/feedback', provideFeedback);

/**
 * POST /api/recommendations/:recommendationId/worn
 * Mark a recommendation as worn
 */
recommendationRouter.post('/:recommendationId/worn', markAsWorn);

export default recommendationRouter;
