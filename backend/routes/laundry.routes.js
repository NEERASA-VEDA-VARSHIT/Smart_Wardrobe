import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import {
  addToLaundry,
  markAsWashed,
  getLaundryItems,
  removeFromLaundry,
  updateLaundryItem,
  getLaundryStats
} from '../controllers/laundry.controllers.js';

const laundryRouter = express.Router();

// All laundry routes require authentication
laundryRouter.use(isAuth);

/**
 * POST /api/laundry/add/:clothingId
 * Add clothing item to laundry
 */
laundryRouter.post('/add/:clothingId', addToLaundry);

/**
 * POST /api/laundry/return/:clothingId
 * Mark item as washed/ready to wear
 */
laundryRouter.post('/return/:clothingId', markAsWashed);

/**
 * GET /api/laundry/:userId
 * Get all laundry items for a user
 */
laundryRouter.get('/:userId', getLaundryItems);

/**
 * DELETE /api/laundry/remove/:clothingId
 * Remove item from laundry
 */
laundryRouter.delete('/remove/:clothingId', removeFromLaundry);

/**
 * PUT /api/laundry/update/:laundryId
 * Update laundry item details
 */
laundryRouter.put('/update/:laundryId', updateLaundryItem);

/**
 * GET /api/laundry/stats/:userId
 * Get laundry statistics
 */
laundryRouter.get('/stats/:userId', getLaundryStats);

export default laundryRouter;
