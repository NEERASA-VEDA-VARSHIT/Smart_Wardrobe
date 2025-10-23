import { upload, batchUpload, handleUploadError } from './multer.js';
import { cloudinary } from '../config/cloudinary.js';
import { compressImage, getCompressionSettings } from '../utils/imageCompression.js';
import multer from 'multer';

// Single image upload middleware
export const uploadSingleImage = (fieldName = 'image') => {
  if (!upload) {
    throw new Error('Multer upload middleware not properly configured');
  }
  
  return [
    upload.single(fieldName),
    handleUploadError
  ];
};

// Multiple images upload middleware
export const uploadMultipleImages = (fieldName = 'images', maxCount = 10) => {
  if (!batchUpload) {
    throw new Error('Multer batch upload middleware not properly configured');
  }
  
  return [
    batchUpload.array(fieldName, maxCount),
    handleUploadError
  ];
};

// Process multiple image uploads to Cloudinary
export const processMultipleImageUploads = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  console.log(`Processing ${req.files.length} images for Cloudinary upload`);

  try {
    // Process all images in parallel
    const uploadPromises = req.files.map(async (file, index) => {
      try {
        console.log(`Uploading image ${index + 1}/${req.files.length}: ${file.originalname}`);
        
        // Compress image before upload
        const compressionSettings = getCompressionSettings(file.size);
        const compressedBuffer = await compressImage(file.buffer, compressionSettings);
        
        // Upload to Cloudinary - let Cloudinary handle its own timeouts
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'smart-wardrobe',
              public_id: `clothing-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
              transformation: [
                { width: 800, height: 800, crop: 'limit', quality: 'auto' },
                { fetch_format: 'auto' }
              ],
              resource_type: 'auto',
              eager_async: true,
              timeout: 120000, // 2 minutes - let Cloudinary decide
              chunk_size: 6000000 // 6MB chunks
            },
            (error, result) => {
              if (error) {
                console.error(`Cloudinary upload error for image ${index + 1}:`, error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          ).end(compressedBuffer);
        });

        // Add Cloudinary data to file object
        file.cloudinaryUrl = result.secure_url;
        file.publicId = result.public_id;
        
        console.log(`✅ Image ${index + 1} uploaded successfully`);
        return file;
        
      } catch (error) {
        console.error(`❌ Failed to upload image ${index + 1}:`, error);
        
        // If it's a timeout or network issue, provide a fallback
        if (error.message.includes('timeout') || 
            error.message.includes('Request Timeout') ||
            error.message.includes('ENOTFOUND') ||
            error.message.includes('ECONNRESET')) {
          console.log(`🔄 Cloudinary timeout for image ${index + 1}, will retry later`);
          file.uploadError = 'Cloudinary timeout - will retry';
        } else {
          file.uploadError = error.message;
        }
        return file;
      }
    });

    // Wait for all uploads to complete
    const uploadResults = await Promise.all(uploadPromises);
    
    // Filter out failed uploads
    const successfulUploads = uploadResults.filter(file => !file.uploadError);
    const failedUploads = uploadResults.filter(file => file.uploadError);
    
    console.log(`Upload complete: ${successfulUploads.length} successful, ${failedUploads.length} failed`);
    
    // Update req.files with results
    req.files = successfulUploads;
    req.uploadErrors = failedUploads;
    
    next();
    
  } catch (error) {
    console.error('Error in batch image upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

// Handle image upload and upload to Cloudinary with retry logic
export const processImageUpload = async (req, res, next) => {
  console.log('processImageUpload middleware hit');
  console.log('req.file:', req.file);
  console.log('req.body:', req.body);
  
  if (!req.file) {
    console.log('No file found in request');
    return res.status(400).json({
      success: false,
      message: 'No image file provided'
    });
  }

  const maxRetries = 3;
  const retryDelay = 2000; // 2 seconds

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Cloudinary upload attempt ${attempt}/${maxRetries}`);
      
      // Compress image before upload
      const compressionSettings = getCompressionSettings(req.file.size);
      const compressedBuffer = await compressImage(req.file.buffer, compressionSettings);
      
      // Upload to Cloudinary with timeout
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'smart-wardrobe',
            public_id: `clothing-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
            transformation: [
              { width: 800, height: 800, crop: 'limit', quality: 'auto' },
              { fetch_format: 'auto' }
            ],
            resource_type: 'auto', // Automatically detect file type
            eager_async: true, // Process transformations asynchronously
            timeout: 120000, // 2 minutes timeout
            chunk_size: 6000000 // 6MB chunk size
          },
          (error, result) => {
            if (error) {
              console.error(`Cloudinary upload error (attempt ${attempt}):`, error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(compressedBuffer);
      });

      // Add Cloudinary data to request body
      req.body.imageUrl = result.secure_url;
      req.body.fileName = req.file.originalname;
      req.body.publicId = result.public_id;

      console.log('Cloudinary upload successful:', {
        imageUrl: req.body.imageUrl,
        fileName: req.body.fileName,
        publicId: req.body.publicId
      });

      return next();
    } catch (error) {
      console.error(`Error uploading to Cloudinary (attempt ${attempt}):`, error);
      
      // Check if it's a network connectivity issue
      if (error.message.includes('ENOTFOUND') || 
          error.message.includes('timeout') || 
          error.message.includes('Timeout') ||
          error.message.includes('getaddrinfo') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ECONNREFUSED') ||
          error.code === 'ENOTFOUND' ||
          error.code === 'ECONNRESET' ||
          error.code === 'ECONNREFUSED' ||
          error.http_code === 499 ||
          error.http_code === 502 ||
          error.http_code === 503) {
        
        if (attempt < maxRetries) {
          console.log(`Network issue detected (${error.code || error.message}), retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        } else {
          console.error('Max retries reached, giving up on Cloudinary upload');
          console.error('Final error details:', {
            code: error.code,
            message: error.message,
            syscall: error.syscall,
            hostname: error.hostname
          });
          
          // Provide a fallback option - suggest manual mode
          return res.status(503).json({
            success: false,
            message: 'Image upload service is temporarily unavailable. Please use Manual mode to add clothing items without image upload.',
            error: 'Network connectivity issue with image upload service',
            retryable: true,
            fallback: 'Use manual mode to add clothing without images',
            details: {
              issue: 'DNS resolution failed for Cloudinary servers',
              suggestion: 'Check your internet connection or try again later'
            }
          });
        }
      } else {
        // Non-network error, don't retry
        console.error('Non-network error, not retrying:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary',
          error: error.message
        });
      }
    }
  }
};
