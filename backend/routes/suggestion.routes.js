import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import {
  submitSuggestion,
  getCollectionSuggestions,
  getUserSuggestions,
  acceptSuggestion,
  markSuggestionAsWorn,
  ignoreSuggestion,
  enhanceSuggestionWithAI,
  getSuggestionStats
} from '../controllers/suggestion.controllers.js';

const suggestionRouter = express.Router();

// All routes require authentication
suggestionRouter.use(isAuth);

/**
 * POST /api/suggestions/:collectionId
 * Submit a new outfit suggestion for a collection
 */
suggestionRouter.post('/:collectionId', submitSuggestion);

/**
 * GET /api/suggestions/:collectionId
 * Get all suggestions for a collection (owner only)
 * Query params: status (pending, accepted, ignored, worn)
 */
suggestionRouter.get('/:collectionId', getCollectionSuggestions);

/**
 * GET /api/suggestions/user/:userId
 * Get user's own suggestions
 * Query params: status (pending, accepted, ignored, worn)
 */
suggestionRouter.get('/user/:userId', getUserSuggestions);

/**
 * POST /api/suggestions/:suggestionId/accept
 * Accept a suggestion (owner only)
 * Body: { wornItems: [itemIds] }
 */
suggestionRouter.post('/:suggestionId/accept', acceptSuggestion);

/**
 * POST /api/suggestions/:suggestionId/worn
 * Mark accepted suggestion as worn (owner only)
 */
suggestionRouter.post('/:suggestionId/worn', markSuggestionAsWorn);

/**
 * POST /api/suggestions/:suggestionId/ignore
 * Ignore a suggestion (owner only)
 * Body: { feedback: "optional feedback" }
 */
suggestionRouter.post('/:suggestionId/ignore', ignoreSuggestion);

/**
 * POST /api/suggestions/:suggestionId/enhance
 * Enhance suggestion with AI (owner only)
 */
suggestionRouter.post('/:suggestionId/enhance', enhanceSuggestionWithAI);

/**
 * GET /api/suggestions/stats/:userId
 * Get suggestion statistics for a user
 */
suggestionRouter.get('/stats/:userId', getSuggestionStats);

export default suggestionRouter;