import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { recommendationLimiter } from '../middlewares/rateLimiter.js';
import {
  recommendOutfits,
  findSimilarItems,
  getComplementaryItems,
  getRecommendationHistory,
  provideFeedback,
  markAsWorn,
  recommendOutfitSets,
  recommendAISuggestions,
  acceptOutfitItems,
  recommendHybrid
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
 * POST /api/recommendations/outfits/:userId
 * Generate 2-5 visual outfit sets (RAG over wardrobe)
 */
recommendationRouter.post('/outfits/:userId', recommendationLimiter, recommendOutfitSets);
recommendationRouter.post('/outfits/:userId/accept', recommendationLimiter, acceptOutfitItems);
recommendationRouter.post('/hybrid/:userId', recommendationLimiter, recommendHybrid);

/**
 * POST /api/recommendations/ai-suggestions
 * Generate 2–3 AI outfits with image_prompt + curated_links
 */
recommendationRouter.post('/ai-suggestions', recommendationLimiter, recommendAISuggestions);

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
