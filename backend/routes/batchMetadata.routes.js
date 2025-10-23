import express from 'express';
import { generateClothingMetadata } from '../services/geminiService.js';
import { isAuth } from '../middlewares/isAuth.js';
import { uploadMultipleImages, processMultipleImageUploads } from '../middlewares/uploadImage.js';

const batchMetadataRouter = express.Router();

// All routes require authentication
batchMetadataRouter.use(isAuth);

/**
 * POST /api/batch-metadata/generate
 * Generate metadata for multiple images in parallel
 */
batchMetadataRouter.post('/generate', uploadMultipleImages('images', 20), processMultipleImageUploads, async (req, res) => {
  try {
    console.log('Batch metadata route hit');
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    console.log(`Processing ${req.files.length} images with rate limiting`);

    // Process images in batches of 3 to avoid rate limiting
    const batchSize = 3;
    const results = [];
    
    for (let i = 0; i < req.files.length; i += batchSize) {
      const batch = req.files.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(req.files.length / batchSize)} (${batch.length} images)`);
      
      const batchPromises = batch.map(async (file, batchIndex) => {
        const globalIndex = i + batchIndex;
        try {
          const imageBuffer = Buffer.from(file.buffer);
          const mimeType = file.mimetype;
          
          console.log(`Processing image ${globalIndex + 1}/${req.files.length}: ${file.originalname}`);
          
          const result = await generateClothingMetadata(imageBuffer, mimeType);
          
          if (result.success) {
            return {
              success: true,
              data: result.metadata,
              imageUrl: file.cloudinaryUrl,
              fileName: file.originalname,
              publicId: file.publicId
            };
          } else {
            return {
              success: false,
              error: result.error,
              fileName: file.originalname
            };
          }
        } catch (error) {
          console.error(`Error processing image ${globalIndex + 1}:`, error);
          return {
            success: false,
            error: error.message,
            fileName: file.originalname
          };
        }
      });
      
      // Wait for current batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < req.files.length) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Separate successful and failed results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Batch processing complete: ${successful.length} successful, ${failed.length} failed`);

    // If all requests failed, provide fallback response
    if (successful.length === 0 && failed.length > 0) {
      return res.status(503).json({
        success: false,
        message: 'Gemini API is currently unavailable. Please try manual mode or try again later.',
        suggestion: 'Switch to manual mode to add clothing without AI metadata generation',
        data: {
          successful: [],
          failed,
          total: req.files.length,
          successCount: 0,
          failureCount: failed.length
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        successful,
        failed,
        total: req.files.length,
        successCount: successful.length,
        failureCount: failed.length
      },
      message: `Processed ${req.files.length} images: ${successful.length} successful, ${failed.length} failed`
    });

  } catch (error) {
    console.error('Error in batch metadata generation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

export default batchMetadataRouter;
