import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  outfitItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem',
    required: true
  }],
  note: {
    type: String,
    trim: true,
    maxlength: 500
  },
  aiEnhanced: {
    type: Boolean,
    default: false
  },
  aiEnhancement: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'ignored', 'worn'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date
  },
  wornAt: {
    type: Date
  },
  ownerFeedback: {
    type: String,
    trim: true
  },
  // Track which items were actually worn from the suggestion
  wornItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem'
  }],
  // AI confidence score for the suggestion
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  // Tags for categorization
  tags: [{
    type: String,
    trim: true
  }],
  // Weather context when suggestion was made
  weatherContext: {
    temperature: Number,
    weatherType: String,
    location: String
  },
  // Occasion context
  occasion: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
suggestionSchema.index({ collectionId: 1, status: 1 });
suggestionSchema.index({ suggestedBy: 1, createdAt: -1 });
suggestionSchema.index({ collectionId: 1, suggestedBy: 1 });
suggestionSchema.index({ status: 1, createdAt: -1 });

// Virtual for suggestion age
suggestionSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for owner (from collection)
suggestionSchema.virtual('owner', {
  ref: 'Collection',
  localField: 'collectionId',
  foreignField: '_id',
  justOne: true,
  options: { select: 'userId' }
});

// Method to mark as accepted
suggestionSchema.methods.accept = function(wornItems = []) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.wornItems = wornItems;
  return this.save();
};

// Method to mark as worn
suggestionSchema.methods.markAsWorn = function() {
  this.status = 'worn';
  this.wornAt = new Date();
  return this.save();
};

// Method to ignore
suggestionSchema.methods.ignore = function(feedback = '') {
  this.status = 'ignored';
  this.ownerFeedback = feedback;
  return this.save();
};

// Static method to get suggestions for a collection
suggestionSchema.statics.getSuggestionsForCollection = function(collectionId, status = null) {
  const query = { collectionId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('suggestedBy', 'name email profilePicture')
    .populate('outfitItems', 'name imageUrl metadata')
    .populate('wornItems', 'name imageUrl metadata')
    .sort({ createdAt: -1 });
};

// Static method to get user's suggestions
suggestionSchema.statics.getUserSuggestions = function(userId, status = null) {
  const query = { suggestedBy: userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('collectionId', 'name description')
    .populate('outfitItems', 'name imageUrl metadata')
    .sort({ createdAt: -1 });
};

// Ensure virtuals are included when converting to JSON
suggestionSchema.set('toObject', { virtuals: true });
suggestionSchema.set('toJSON', { virtuals: true });

const Suggestion = mongoose.model('Suggestion', suggestionSchema);

export default Suggestion;