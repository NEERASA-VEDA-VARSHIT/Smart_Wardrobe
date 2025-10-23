import { v2 as cloudinary } from 'cloudinary';
import { upload, handleUploadError } from '../middlewares/multer.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Cloudinary
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
});

// Configure Cloudinary with explicit options
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 120000, // 2 minutes timeout
  chunk_size: 6000000 // 6MB chunk size for large files
});

// Test Cloudinary connection
cloudinary.api.ping()
  .then(result => console.log('✅ Cloudinary connection successful:', result))
  .catch(err => {
    console.error('❌ Cloudinary connection failed:', err);
    console.error('This will cause uploads to fail!');
  });

// Multer configuration is now handled in ../middlewares/multer.js

// Utility function to delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Utility function to get image URL with transformations
const getImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true
  });
};

// Utility function to get optimized image URL for clothing items
const getOptimizedClothingImageUrl = (publicId, options = {}) => {
  const defaultTransformations = {
    width: 400,
    height: 400,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
    gravity: 'auto'
  };
  
  return cloudinary.url(publicId, {
    ...defaultTransformations,
    ...options,
    secure: true
  });
};

// Utility function to get thumbnail URL
const getThumbnailUrl = (publicId, size = 150) => {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
    secure: true
  });
};

export { 
  cloudinary, 
  upload, 
  handleUploadError, 
  deleteImage, 
  getImageUrl,
  getOptimizedClothingImageUrl,
  getThumbnailUrl
};
