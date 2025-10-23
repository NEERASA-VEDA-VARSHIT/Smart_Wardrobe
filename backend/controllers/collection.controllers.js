import Collection from "../models/collection.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import User from "../models/user.model.js";

// Get all collections for a user
export const getCollections = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isArchived = false } = req.query;

    const collections = await Collection.find({ userId, isArchived })
      .populate('itemIds', 'imageUrl fileName metadata')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single collection
export const getCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id)
      .populate('itemIds', 'imageUrl fileName metadata')
      .populate('userId', 'name email');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error fetching collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new collection
export const createCollection = async (req, res) => {
  try {
    const { userId, name, description, itemIds = [], tags = [] } = req.body;

    // Validate required fields
    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, name'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify all items belong to the user
    if (itemIds.length > 0) {
      const items = await ClothingItem.find({ _id: { $in: itemIds }, userId });
      if (items.length !== itemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more items do not belong to the user'
        });
      }
    }

    const collection = await Collection.create({
      userId,
      name,
      description,
      itemIds,
      tags
    });

    // Update user's total collections count
    await User.findByIdAndUpdate(userId, { $inc: { totalCollections: 1 } });

    res.status(201).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update collection
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // If updating itemIds, verify all items belong to the user
    if (updateData.itemIds) {
      const collection = await Collection.findById(id);
      const items = await ClothingItem.find({ 
        _id: { $in: updateData.itemIds }, 
        userId: collection.userId 
      });
      if (items.length !== updateData.itemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more items do not belong to the user'
        });
      }
    }

    const collection = await Collection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('itemIds', 'imageUrl fileName metadata');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete collection
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Soft delete by archiving
    collection.isArchived = true;
    await collection.save();

    // Update user's total collections count
    await User.findByIdAndUpdate(collection.userId, { $inc: { totalCollections: -1 } });

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add item to collection
export const addItemToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Verify item belongs to the user
    const item = await ClothingItem.findOne({ _id: itemId, userId: collection.userId });
    if (!item) {
      return res.status(400).json({
        success: false,
        message: 'Item not found or does not belong to the user'
      });
    }

    // Add item if not already in collection
    if (!collection.itemIds.includes(itemId)) {
      collection.itemIds.push(itemId);
      await collection.save();
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error adding item to collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove item from collection
export const removeItemFromCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    const collection = await Collection.findByIdAndUpdate(
      id,
      { $pull: { itemIds: itemId } },
      { new: true }
    ).populate('itemIds', 'imageUrl fileName metadata');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error removing item from collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Share collection with username
export const shareCollectionWithUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, permission = 'view' } = req.body;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Verify the target user exists
    const User = (await import('../models/user.model.js')).default;
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already shared with this user
    const existingShare = collection.sharedWith.find(share => share.username === username);
    if (existingShare) {
      existingShare.permission = permission;
    } else {
      collection.sharedWith.push({ username, permission });
    }

    await collection.save();

    res.status(200).json({
      success: true,
      data: collection,
      message: `Collection shared with @${username}`
    });
  } catch (error) {
    console.error('Error sharing collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get collections shared with current user
export const getSharedCollections = async (req, res) => {
  try {
    const { username } = req.params;

    const collections = await Collection.find({ 'sharedWith.username': username })
      .populate('itemIds', 'imageUrl fileName metadata')
      .populate('userId', 'name email username')
      .sort({ 'sharedWith.sharedAt': -1 });

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections
    });
  } catch (error) {
    console.error('Error fetching shared collections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get shared collection by share link (public access)
export const getSharedCollection = async (req, res) => {
  try {
    const { shareLink } = req.params;

    const collection = await Collection.findOne({ shareLink })
      .populate('itemIds', 'imageUrl fileName metadata')
      .populate('userId', 'name email');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found or link is invalid'
      });
    }

    // Check if collection is public
    if (!collection.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This collection is not shared publicly'
      });
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error fetching shared collection:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};