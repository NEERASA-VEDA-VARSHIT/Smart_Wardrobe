import mongoose from "mongoose";
import LaundryItem from "../models/laundryItem.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import User from "../models/user.model.js";

/**
 * Add clothing item to laundry (user-initiated)
 * POST /api/laundry/add/:clothingId
 */
export const addToLaundry = async (req, res) => {
  try {
    const { clothingId } = req.params;
    const { userId } = req.body;
    const { expectedReturn, notes, priority = 'medium' } = req.body;

    // Validate required fields
    if (!userId || !clothingId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Clothing ID are required'
      });
    }

    // Check if clothing item exists and belongs to user
    const clothingItem = await ClothingItem.findOne({ 
      _id: clothingId, 
      userId: userId 
    });

    if (!clothingItem) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found or does not belong to user'
      });
    }

    // Check if item is already in laundry
    const existingLaundryItem = await LaundryItem.findOne({
      userId,
      clothingId,
      status: { $in: ['in_laundry', 'washed'] }
    });

    if (existingLaundryItem) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in laundry'
      });
    }

    // Create laundry item
    const laundryItem = await LaundryItem.create({
      userId,
      clothingId,
      expectedReturn: expectedReturn ? new Date(expectedReturn) : undefined,
      notes,
      priority
    });

    // Update clothing item to mark as in laundry
    await ClothingItem.findByIdAndUpdate(clothingId, {
      cleanlinessStatus: 'in_laundry'
    });

    // Populate clothing details
    await laundryItem.populate('clothingId', 'imageUrl metadata fileName');

    res.status(201).json({
      success: true,
      message: 'Item added to laundry successfully',
      data: laundryItem
    });

  } catch (error) {
    console.error('Error adding item to laundry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark item as washed/ready to wear
 * POST /api/laundry/return/:clothingId
 */
export const markAsWashed = async (req, res) => {
  try {
    const { clothingId } = req.params;
    const { userId } = req.body;
    const { status = 'ready_to_wear' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const laundryItem = await LaundryItem.findOneAndUpdate(
      { 
        clothingId, 
        userId,
        status: { $in: ['in_laundry', 'washed'] }
      },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('clothingId', 'imageUrl metadata fileName');

    if (!laundryItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in laundry'
      });
    }

    // If marked as ready to wear, reset to fresh status
    if (status === 'ready_to_wear') {
      await ClothingItem.findByIdAndUpdate(clothingId, {
        cleanlinessStatus: 'fresh',
        wearCount: 0, // Reset wear count after washing
        lastWorn: null,
        freshnessScore: 100 // Reset freshness score
      });
    }

    res.status(200).json({
      success: true,
      message: `Item marked as ${status.replace('_', ' ')}`,
      data: laundryItem
    });

  } catch (error) {
    console.error('Error marking item as washed:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all laundry items for a user
 * GET /api/laundry/:userId
 */
export const getLaundryItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, sortBy = 'addedAt', sortOrder = 'desc' } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Build filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const laundryItems = await LaundryItem.find(filter)
      .populate('clothingId', 'imageUrl metadata fileName publicId')
      .sort(sort);

    // Group by status
    const groupedItems = {
      in_laundry: [],
      washed: [],
      ready_to_wear: []
    };

    laundryItems.forEach(item => {
      groupedItems[item.status].push(item);
    });

    // Calculate statistics
    const stats = {
      total: laundryItems.length,
      in_laundry: groupedItems.in_laundry.length,
      washed: groupedItems.washed.length,
      ready_to_wear: groupedItems.ready_to_wear.length,
      overdue: laundryItems.filter(item => item.isOverdue).length
    };

    res.status(200).json({
      success: true,
      data: {
        items: laundryItems,
        grouped: groupedItems,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching laundry items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Remove item from laundry
 * DELETE /api/laundry/remove/:clothingId
 */
export const removeFromLaundry = async (req, res) => {
  try {
    const { clothingId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const laundryItem = await LaundryItem.findOneAndDelete({
      clothingId,
      userId
    });

    if (!laundryItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in laundry'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Item removed from laundry successfully',
      data: laundryItem
    });

  } catch (error) {
    console.error('Error removing item from laundry:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update laundry item
 * PUT /api/laundry/update/:laundryId
 */
export const updateLaundryItem = async (req, res) => {
  try {
    const { laundryId } = req.params;
    const { expectedReturn, notes, priority, status } = req.body;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const updateData = {};
    if (expectedReturn) updateData.expectedReturn = new Date(expectedReturn);
    if (notes !== undefined) updateData.notes = notes;
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;

    const laundryItem = await LaundryItem.findOneAndUpdate(
      { _id: laundryId, userId },
      updateData,
      { new: true }
    ).populate('clothingId', 'imageUrl metadata fileName');

    if (!laundryItem) {
      return res.status(404).json({
        success: false,
        message: 'Laundry item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Laundry item updated successfully',
      data: laundryItem
    });

  } catch (error) {
    console.error('Error updating laundry item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get laundry statistics
 * GET /api/laundry/stats/:userId
 */
export const getLaundryStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const stats = await LaundryItem.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDays: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$addedAt'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    ]);

    const totalItems = await LaundryItem.countDocuments({ userId });
    const overdueItems = await LaundryItem.countDocuments({
      userId,
      status: 'in_laundry',
      expectedReturn: { $lt: new Date() }
    });

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        overdueItems,
        byStatus: stats,
        summary: {
          total: totalItems,
          overdue: overdueItems,
          readyToWear: stats.find(s => s._id === 'ready_to_wear')?.count || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching laundry stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
