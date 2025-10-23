import express from "express";
import { 
  getClothingItems, 
  getClothingItem, 
  createClothingItem, 
  updateClothingItem, 
  deleteClothingItem,
  markAsWorn,
  toggleFavorite
} from "../controllers/clothingItem.controllers.js";
import { isAuth } from "../middlewares/isAuth.js";
import { uploadSingleImage, processImageUpload } from "../middlewares/uploadImage.js";

const clothingItemRouter = express.Router();

// All routes require authentication
clothingItemRouter.use(isAuth);

// GET /api/clothing-items/user/:userId - Get all clothing items for a user
clothingItemRouter.get("/user/:userId", getClothingItems);

// GET /api/clothing-items/:id - Get single clothing item
clothingItemRouter.get("/:id", getClothingItem);

// POST /api/clothing-items - Create new clothing item with image upload
clothingItemRouter.post("/", uploadSingleImage('image'), processImageUpload, createClothingItem);

// PUT /api/clothing-items/:id - Update clothing item
clothingItemRouter.put("/:id", updateClothingItem);

// DELETE /api/clothing-items/:id - Delete clothing item (soft delete)
clothingItemRouter.delete("/:id", deleteClothingItem);

// PATCH /api/clothing-items/:id/worn - Mark item as worn
clothingItemRouter.patch("/:id/worn", markAsWorn);

// PATCH /api/clothing-items/:id/favorite - Toggle favorite status
clothingItemRouter.patch("/:id/favorite", toggleFavorite);

export default clothingItemRouter;
