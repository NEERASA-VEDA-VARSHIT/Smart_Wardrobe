import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import {
  markAsWorn,
  getLaundrySuggestions,
  updateWashPreference,
  learnFromUserDecision
} from '../controllers/laundrySuggestion.controllers.js';

const laundrySuggestionRouter = express.Router();

// All routes require authentication
laundrySuggestionRouter.use(isAuth);

/**
 * POST /api/laundry-suggestions/mark-worn/:clothingId
 * Mark clothing item as worn and check for laundry suggestions
 */
laundrySuggestionRouter.post('/mark-worn/:clothingId', markAsWorn);

/**
 * GET /api/laundry-suggestions/:userId
 * Get laundry suggestions for a user
 */
laundrySuggestionRouter.get('/:userId', getLaundrySuggestions);

/**
 * PUT /api/laundry-suggestions/wash-preference/:clothingId
 * Update user's wash preference for a clothing item
 */
laundrySuggestionRouter.put('/wash-preference/:clothingId', updateWashPreference);

/**
 * POST /api/laundry-suggestions/learn
 * Learn from user's laundry decisions
 */
laundrySuggestionRouter.post('/learn', learnFromUserDecision);

export default laundrySuggestionRouter;
