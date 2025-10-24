import express from 'express';
import { generateClothingMetadata, generateClothingEmbedding } from '../services/geminiService.js';
import { isAuth } from '../middlewares/isAuth.js';
import { uploadSingleImage, processImageUpload } from '../middlewares/uploadImage.js';
import { deleteImage } from '../config/cloudinary.js';
import { metadataLimiter } from '../middlewares/rateLimiter.js';

const metadataRouter = express.Router();

// All routes require authentication
metadataRouter.use(isAuth);

/**
 * POST /api/metadata/generate
 * Generate clothing metadata from image using Gemini Vision
 */
metadataRouter.post('/generate', metadataLimiter, uploadSingleImage('image'), processImageUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Convert image buffer to the format expected by Gemini
    const imageBuffer = Buffer.from(req.file.buffer || req.file.path);
    const mimeType = req.file.mimetype;

    // Add timeout wrapper for Vercel compatibility (reduced to 5 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
    });

    const result = await Promise.race([
      generateClothingMetadata(imageBuffer, mimeType),
      timeoutPromise
    ]);

    if (!result.success) {
      // Clean up Cloudinary image if metadata generation failed
      if (req.body.publicId) {
        try {
          console.log('Cleaning up Cloudinary image after metadata generation failure:', req.body.publicId);
          await deleteImage(req.body.publicId);
          console.log('Successfully deleted image from Cloudinary');
        } catch (cleanupError) {
          console.error('Failed to delete image from Cloudinary:', cleanupError);
        }
      }
      
      // Check if it's a network error and suggest manual mode
      if (result.error.includes('fetch failed') || 
          result.error.includes('ENOTFOUND') ||
          result.error.includes('ECONNRESET')) {
        return res.status(503).json({
          success: false,
          message: 'AI service temporarily unavailable. Please use Manual mode to add clothing items without AI metadata generation.',
          error: 'Network connectivity issue with AI service',
          retryable: true,
          fallback: 'Use manual mode to add clothing without AI metadata'
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Failed to generate metadata',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: result.metadata,
      message: 'Metadata generated successfully'
    });
  } catch (error) {
    console.error('Error in metadata generation route:', error);
    
    // Handle timeout specifically
    if (error.message === 'Request timeout') {
      return res.status(408).json({
        success: false,
        message: 'Metadata generation timed out. Please try again with a smaller image or use manual mode.',
        error: 'Request timeout',
        retryable: true,
        fallback: 'Use manual mode to add clothing without AI metadata',
        manualMode: {
          available: true,
          message: 'You can add clothing items manually without AI metadata',
          fields: ['name', 'category', 'color', 'brand', 'size', 'season', 'occasion']
        }
      });
    }
    
    // Clean up Cloudinary image if any error occurred
    if (req.body.publicId) {
      try {
        console.log('Cleaning up Cloudinary image after error:', req.body.publicId);
        await deleteImage(req.body.publicId);
        console.log('Successfully deleted image from Cloudinary');
      } catch (cleanupError) {
        console.error('Failed to delete image from Cloudinary:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/metadata/manual
 * Create clothing item with manual metadata (no AI)
 */
metadataRouter.post('/manual', async (req, res) => {
  try {
    const { 
      name, 
      category, 
      color, 
      brand, 
      size, 
      season, 
      occasion, 
      description,
      imageUrl,
      publicId,
      fileName
    } = req.body;

    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required for manual clothing creation'
      });
    }

    // Create manual metadata object
    const manualMetadata = {
      color: {
        primary: color || 'unknown',
        secondary: null
      },
      category: category,
      subcategory: category, // Use category as subcategory for manual entries
      fabric: 'unknown',
      brand: brand || 'unknown',
      size: size || 'unknown',
      pattern: 'unknown',
      season: season || 'all-season',
      formality: 'casual',
      occasion: occasion ? [occasion] : ['casual'],
      tags: ['manual-entry'],
      description: description || `Manual entry: ${name}`
    };

    res.status(200).json({
      success: true,
      data: {
        metadata: manualMetadata,
        imageUrl: imageUrl,
        fileName: fileName,
        publicId: publicId,
        metadataSource: 'manual'
      },
      message: 'Manual metadata created successfully'
    });

  } catch (error) {
    console.error('Error in manual metadata creation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * POST /api/metadata/embedding
 * Generate vector embedding from metadata
 */
metadataRouter.post('/embedding', async (req, res) => {
  try {
    const { metadata } = req.body;

    if (!metadata) {
      return res.status(400).json({
        success: false,
        message: 'Metadata is required'
      });
    }

    const result = await generateClothingEmbedding(metadata);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate embedding',
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      data: {
        embedding: result.embedding,
        model: result.model,
        usage: result.usage
      },
      message: 'Embedding generated successfully'
    });
  } catch (error) {
    console.error('Error in embedding generation route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * DELETE /api/metadata/delete-image
 * Delete image from Cloudinary
 */
metadataRouter.delete('/delete-image', async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await deleteImage(publicId);
    
    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default metadataRouter;
