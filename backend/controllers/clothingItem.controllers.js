import ClothingItem from "../models/clothingItem.model.js";
import User from "../models/user.model.js";
import { deleteImage, getOptimizedClothingImageUrl, getThumbnailUrl } from "../config/cloudinary.js";
import { generateClothingMetadata, generateClothingEmbedding } from "../services/geminiService.js";

// Get all clothing items for a user
export const getClothingItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const { category, color, formality, season, isArchived = false } = req.query;

    // Build filter object
    const filter = { userId, isArchived };
    
    if (category) filter['metadata.category'] = category;
    if (color) filter['metadata.color.primary'] = new RegExp(color, 'i');
    if (formality) filter['metadata.formality'] = formality;
    if (season) filter['metadata.season'] = season;

    const items = await ClothingItem.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    // Add optimized URLs to each item
    const itemsWithOptimizedUrls = items.map(item => ({
      ...item.toObject(),
      optimizedImageUrl: item.publicId ? getOptimizedClothingImageUrl(item.publicId) : item.imageUrl,
      thumbnailUrl: item.publicId ? getThumbnailUrl(item.publicId) : item.imageUrl
    }));

    res.status(200).json({
      success: true,
      count: itemsWithOptimizedUrls.length,
      data: itemsWithOptimizedUrls
    });
  } catch (error) {
    console.error('Error fetching clothing items:', error);
    
    // Handle MongoDB connection errors specifically
    if (error.name === 'MongoServerSelectionError' || error.name === 'MongoNetworkError') {
      return res.status(503).json({
        success: false,
        message: 'Database temporarily unavailable. Please try again in a moment.',
        error: 'Database connection issue'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get single clothing item
export const getClothingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ClothingItem.findById(id).populate('userId', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    // Add optimized URLs to the item
    const itemWithOptimizedUrls = {
      ...item.toObject(),
      optimizedImageUrl: item.publicId ? getOptimizedClothingImageUrl(item.publicId) : item.imageUrl,
      thumbnailUrl: item.publicId ? getThumbnailUrl(item.publicId) : item.imageUrl
    };

    res.status(200).json({
      success: true,
      data: itemWithOptimizedUrls
    });
  } catch (error) {
    console.error('Error fetching clothing item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Create new clothing item
export const createClothingItem = async (req, res) => {
  try {
    const { userId, imageUrl, fileName, publicId, metadata, metadataSource = 'manual', generateEmbedding = false } = req.body;

    // Validate required fields
    if (!userId || !imageUrl || !fileName || !metadata) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, imageUrl, fileName, metadata'
      });
    }

    // Parse metadata if it's a string
    let parsedMetadata;
    try {
      parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch (parseError) {
      console.error('Error parsing metadata:', parseError);
      return res.status(400).json({
        success: false,
        message: 'Invalid metadata format'
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

    // Generate embedding if requested
    let vectorEmbedding = [];
    let embeddingModel = null;
    
    if (generateEmbedding) {
      const embeddingResult = await generateClothingEmbedding(metadata);
      if (embeddingResult.success) {
        vectorEmbedding = embeddingResult.embedding;
        embeddingModel = embeddingResult.model;
      } else {
        console.warn('Failed to generate embedding:', embeddingResult.error);
      }
    }

    const clothingItem = await ClothingItem.create({
      userId,
      imageUrl,
      fileName,
      publicId, // Store Cloudinary public_id for future operations
      metadata: parsedMetadata,
      metadataSource,
      vectorEmbedding,
      embeddingModel
    });

    // Update user's total items count
    await User.findByIdAndUpdate(userId, { $inc: { totalItems: 1 } });

    // Add optimized URLs to the response
    const itemWithOptimizedUrls = {
      ...clothingItem.toObject(),
      optimizedImageUrl: clothingItem.publicId ? getOptimizedClothingImageUrl(clothingItem.publicId) : clothingItem.imageUrl,
      thumbnailUrl: clothingItem.publicId ? getThumbnailUrl(clothingItem.publicId) : clothingItem.imageUrl
    };

    res.status(201).json({
      success: true,
      data: itemWithOptimizedUrls
    });
  } catch (error) {
    console.error('Error creating clothing item:', error);
    
    // Clean up Cloudinary image if it was uploaded but database save failed
    if (req.body.publicId) {
      try {
        console.log('Cleaning up Cloudinary image:', req.body.publicId);
        await deleteImage(req.body.publicId);
        console.log('Successfully deleted image from Cloudinary');
      } catch (cleanupError) {
        console.error('Failed to delete image from Cloudinary:', cleanupError);
        // Don't fail the response if cleanup fails
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update clothing item
export const updateClothingItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const item = await ClothingItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error updating clothing item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete clothing item
export const deleteClothingItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ClothingItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    // Delete image from Cloudinary if publicId exists
    if (item.publicId) {
      try {
        await deleteImage(item.publicId);
        console.log('Image deleted from Cloudinary:', item.publicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    // Soft delete by archiving
    item.isArchived = true;
    await item.save();

    // Update user's total items count
    await User.findByIdAndUpdate(item.userId, { $inc: { totalItems: -1 } });

    res.status(200).json({
      success: true,
      message: 'Clothing item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting clothing item:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark item as worn
export const markAsWorn = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ClothingItem.findByIdAndUpdate(
      id,
      { 
        lastWornDate: new Date(),
        $inc: { wearCount: 1 }
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error marking item as worn:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle favorite status
export const toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ClothingItem.findById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    item.isFavorite = !item.isFavorite;
    await item.save();

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Error toggling favorite status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
