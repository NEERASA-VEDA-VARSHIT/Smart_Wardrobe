import express from 'express';
import { isAuth } from '../middlewares/isAuth.js';
import { uploadSingleImage, processImageUpload } from '../middlewares/uploadImage.js';
import { generateClothingMetadata } from '../services/geminiService.js';
import ClothingItem from '../models/clothingItem.model.js';

const backgroundRouter = express.Router();

// All routes require authentication
backgroundRouter.use(isAuth);

/**
 * POST /api/background/upload-and-process
 * Upload image and start background metadata generation
 */
backgroundRouter.post('/upload-and-process', uploadSingleImage('image'), processImageUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Return immediately with upload success and processing status
    res.status(202).json({
      success: true,
      message: 'Image uploaded successfully. Metadata generation started in background.',
      data: {
        imageUrl: req.body.imageUrl,
        fileName: req.body.fileName,
        publicId: req.body.publicId,
        processingId: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        status: 'processing'
      }
    });

    // Start background processing (don't await)
    processMetadataInBackground(req.body, req.user.id, req.file);

  } catch (error) {
    console.error('Error in background upload route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/background/status/:processingId
 * Check processing status
 */
backgroundRouter.get('/status/:processingId', async (req, res) => {
  try {
    const { processingId } = req.params;
    
    // For now, return a simple status
    // In a real implementation, you'd store this in Redis or database
    res.status(200).json({
      success: true,
      data: {
        processingId,
        status: 'completed', // or 'processing', 'failed'
        progress: 100,
        message: 'Processing completed'
      }
    });
  } catch (error) {
    console.error('Error checking processing status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * Background processing function
 */
async function processMetadataInBackground(uploadData, userId, file) {
  try {
    console.log('🔄 Starting background metadata generation...');
    
    // Convert image buffer to the format expected by Gemini
    const imageBuffer = Buffer.from(file.buffer);
    const mimeType = file.mimetype;

    // Generate metadata
    const result = await generateClothingMetadata(imageBuffer, mimeType);

    if (result.success) {
      // Create clothing item in database
      const clothingItem = new ClothingItem({
        userId,
        name: result.metadata.subcategory || 'Unknown Item',
        category: result.metadata.category,
        subcategory: result.metadata.subcategory,
        color: result.metadata.color,
        fabric: result.metadata.fabric,
        brand: result.metadata.brand,
        size: result.metadata.size,
        pattern: result.metadata.pattern,
        season: result.metadata.season,
        formality: result.metadata.formality,
        occasion: result.metadata.occasion,
        tags: result.metadata.tags,
        description: result.metadata.description,
        imageUrl: uploadData.imageUrl,
        publicId: uploadData.publicId,
        metadataSource: result.metadata.metadataSource || 'gemini'
      });

      await clothingItem.save();
      console.log('✅ Background processing completed successfully');
    } else {
      console.error('❌ Background metadata generation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Background processing error:', error);
  }
}

export default backgroundRouter;
