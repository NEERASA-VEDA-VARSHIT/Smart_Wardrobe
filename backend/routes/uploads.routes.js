import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { isAuth } from '../middlewares/isAuth.js';

const uploadsRouter = express.Router();

uploadsRouter.use(isAuth);

// POST /api/uploads/signature - returns signed params for client-side upload
uploadsRouter.post('/signature', (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'smart-wardrobe';
    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret);
    return res.status(200).json({
      success: true,
      data: {
        timestamp,
        folder,
        signature,
        cloudName: cloudinary.config().cloud_name,
        apiKey: cloudinary.config().api_key
      }
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create upload signature', error: error.message });
  }
});

export default uploadsRouter;


