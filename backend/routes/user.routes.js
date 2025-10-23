import express from "express";
import { getCurrentUser, getUserByUsername, updateProfile, uploadProfilePicture } from "../controllers/user.controllers.js";
import { isAuth } from "../middlewares/isAuth.js";
import { uploadSingleImage, processImageUpload } from "../middlewares/uploadImage.js";

const userRouter = express.Router();

// Protected routes - require authentication
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.put("/update", isAuth, updateProfile);

// Test route for debugging
userRouter.post("/test-upload", isAuth, (req, res) => {
    console.log('Test upload route hit');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    res.json({ message: 'Test route working' });
});

userRouter.post("/upload-profile-pic", isAuth, ...uploadSingleImage('image'), processImageUpload, uploadProfilePicture);

// Public route - no authentication required
userRouter.get("/username/:username", getUserByUsername);

export default userRouter;