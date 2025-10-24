import multer from 'multer';

// Configure multer with memory storage
const storage = multer.memoryStorage();

// Create multer instance for single uploads
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Allow only 1 file for single uploads
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Create multer instance for batch uploads
const batchUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file (reduced for batch)
    files: 10, // Allow up to 10 files (reduced for better performance)
    fieldSize: 50 * 1024 * 1024 // 50MB total field size
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  console.log('Multer error:', error);
  console.log('Error code:', error.code);
  console.log('Error field:', error.field);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB per file for batch uploads.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files for batch uploads.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected field: ${error.field}. Expected 'images' field.`,
        expectedField: 'images',
        receivedField: error.field,
        error: error
      });
    }
  }
  
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      message: 'Only image files are allowed!'
    });
  }
  
  next(error);
};

export { upload, batchUpload, handleUploadError };
