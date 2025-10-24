import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  itemIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem'
  }],
  sharedWith: [{
    username: {
      type: String,
      required: true
    },
    permission: {
      type: String,
      enum: ['view', 'edit'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  shareLink: {
    type: String,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String], // e.g., ['work', 'summer', 'formal']
  coverImage: {
    type: String, // URL to cover image (could be first item's image)
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
collectionSchema.index({ userId: 1, isArchived: 1 });
collectionSchema.index({ shareLink: 1 });
collectionSchema.index({ isPublic: 1 });
collectionSchema.index({ 'sharedWith.username': 1 });

// Generate unique share link before saving
collectionSchema.pre('save', async function(next) {
  if (this.isNew && !this.shareLink) {
    // Generate a unique share link
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    this.shareLink = `collection_${randomString}`;
  }
  next();
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;
