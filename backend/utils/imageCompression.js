import sharp from 'sharp';

/**
 * Compress image to reduce file size while maintaining quality
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @returns {Promise<Buffer>} Compressed image buffer
 */
export const compressImage = async (imageBuffer, options = {}) => {
  try {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 85,
      maxSizeKB = 1500 // 1.5MB max
    } = options;

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`Original image: ${metadata.width}x${metadata.height}, ${Math.round(imageBuffer.length / 1024)}KB`);

    // Calculate new dimensions maintaining aspect ratio
    let { width, height } = metadata;
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Compress the image
    let compressedBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ 
        quality,
        progressive: true,
        mozjpeg: true // Better compression
      })
      .toBuffer();

    // If still too large, reduce quality further
    let currentQuality = quality;
    while (compressedBuffer.length > maxSizeKB * 1024 && currentQuality > 60) {
      currentQuality -= 10;
      compressedBuffer = await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: currentQuality,
          progressive: true,
          mozjpeg: true
        })
        .toBuffer();
    }

    console.log(`Compressed image: ${width}x${height}, ${Math.round(compressedBuffer.length / 1024)}KB, quality: ${currentQuality}`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('Image compression error:', error);
    // Return original buffer if compression fails
    return imageBuffer;
  }
};

/**
 * Get optimal compression settings based on file size
 * @param {number} fileSizeBytes - Original file size in bytes
 * @returns {Object} Compression options
 */
export const getCompressionSettings = (fileSizeBytes) => {
  const fileSizeKB = fileSizeBytes / 1024;
  
  if (fileSizeKB > 5000) { // > 5MB
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
      maxSizeKB: 800 // Better quality for display
    };
  } else if (fileSizeKB > 2000) { // > 2MB
    return {
      maxWidth: 1400,
      maxHeight: 1400,
      quality: 88,
      maxSizeKB: 1000
    };
  } else if (fileSizeKB > 1000) { // > 1MB
    return {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 90,
      maxSizeKB: 1200
    };
  } else {
    return {
      maxWidth: 1800,
      maxHeight: 1800,
      quality: 92,
      maxSizeKB: 1500
    };
  }
};
