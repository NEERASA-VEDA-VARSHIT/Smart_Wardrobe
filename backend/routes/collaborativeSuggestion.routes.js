import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import {
  createSuggestion,
  getSuggestions,
  getUserSuggestions,
  acceptSuggestion,
  markSuggestionAsWorn,
  rejectSuggestion,
  voteOnSuggestion,
  addCommentToSuggestion,
  getAIEnhancement
} from '../controllers/collaborativeSuggestion.controllers.js';

const collaborativeSuggestionRouter = express.Router();

// All routes require authentication
collaborativeSuggestionRouter.use(isAuth);

/**
 * POST /api/suggestions/:collectionId
 * Create a new outfit suggestion
 */
collaborativeSuggestionRouter.post('/:collectionId', createSuggestion);

/**
 * GET /api/suggestions/:collectionId
 * Get all suggestions for a collection
 */
collaborativeSuggestionRouter.get('/:collectionId', getSuggestions);

/**
 * GET /api/suggestions/user/:userId
 * Get suggestions for a specific user (owner view)
 */
collaborativeSuggestionRouter.get('/user/:userId', getUserSuggestions);

/**
 * POST /api/suggestions/:suggestionId/accept
 * Accept a suggestion
 */
collaborativeSuggestionRouter.post('/:suggestionId/accept', acceptSuggestion);

/**
 * POST /api/suggestions/:suggestionId/worn
 * Mark suggestion as worn
 */
collaborativeSuggestionRouter.post('/:suggestionId/worn', markSuggestionAsWorn);

/**
 * POST /api/suggestions/:suggestionId/reject
 * Reject a suggestion
 */
collaborativeSuggestionRouter.post('/:suggestionId/reject', rejectSuggestion);

/**
 * POST /api/suggestions/:suggestionId/vote
 * Vote on a suggestion (like/dislike)
 */
collaborativeSuggestionRouter.post('/:suggestionId/vote', voteOnSuggestion);

/**
 * POST /api/suggestions/:suggestionId/comment
 * Add comment to suggestion
 */
collaborativeSuggestionRouter.post('/:suggestionId/comment', addCommentToSuggestion);

/**
 * POST /api/suggestions/:suggestionId/ai-enhance
 * Get AI enhancement for a suggestion
 */
collaborativeSuggestionRouter.post('/:suggestionId/ai-enhance', getAIEnhancement);

export default collaborativeSuggestionRouter;
