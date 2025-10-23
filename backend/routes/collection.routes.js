import express from "express";
import { 
  getCollections, 
  getCollection, 
  createCollection, 
  updateCollection, 
  deleteCollection,
  addItemToCollection,
  removeItemFromCollection,
  shareCollectionWithUser,
  getSharedCollections,
  getSharedCollection
} from "../controllers/collection.controllers.js";
import { isAuth } from "../middlewares/isAuth.js";

const collectionRouter = express.Router();

// Public route for shared collections (no auth required)
collectionRouter.get("/shared/:shareLink", getSharedCollection);

// All other routes require authentication
collectionRouter.use(isAuth);

// GET /api/collections/user/:userId - Get all collections for a user
collectionRouter.get("/user/:userId", getCollections);

// GET /api/collections/:id - Get single collection
collectionRouter.get("/:id", getCollection);

// POST /api/collections - Create new collection
collectionRouter.post("/", createCollection);

// PUT /api/collections/:id - Update collection
collectionRouter.put("/:id", updateCollection);

// DELETE /api/collections/:id - Delete collection (soft delete)
collectionRouter.delete("/:id", deleteCollection);

// PATCH /api/collections/:id/add-item - Add item to collection
collectionRouter.patch("/:id/add-item", addItemToCollection);

// PATCH /api/collections/:id/remove-item - Remove item from collection
collectionRouter.patch("/:id/remove-item", removeItemFromCollection);

// PATCH /api/collections/:id/share - Share collection with username
collectionRouter.patch("/:id/share", shareCollectionWithUser);

// GET /api/collections/shared/:username - Get collections shared with user
collectionRouter.get("/shared/:username", getSharedCollections);

export default collectionRouter;
