import mongoose from "mongoose";

const outfitRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendedItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem',
    required: true
  }],
  context: {
    weather: {
      temperature: String, // 'hot', 'warm', 'cool', 'cold'
      condition: String, // 'sunny', 'rainy', 'cloudy', 'snowy'
      humidity: String // 'low', 'moderate', 'high'
    },
    occasion: {
      type: String,
      enum: ['work', 'casual', 'formal', 'party', 'date', 'gym', 'travel', 'other']
    },
    timeOfDay: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night']
    },
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter']
    },
    formality: {
      type: String,
      enum: ['casual', 'business-casual', 'business', 'formal', 'semi-formal']
    },
    notes: String // Additional context or requirements
  },
  generatedBy: {
    type: String,
    enum: ['AI', 'manual'],
    default: 'AI'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  reasoning: String, // AI explanation for the recommendation
  tags: [String], // e.g., ['summer', 'work', 'comfortable']
  isFavorited: {
    type: Boolean,
    default: false
  },
  isWorn: {
    type: Boolean,
    default: false
  },
  wornDate: Date,
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
outfitRecommendationSchema.index({ userId: 1, isArchived: 1 });
outfitRecommendationSchema.index({ userId: 1, 'context.occasion': 1 });
outfitRecommendationSchema.index({ userId: 1, 'context.formality': 1 });
outfitRecommendationSchema.index({ userId: 1, generatedBy: 1 });
outfitRecommendationSchema.index({ userId: 1, isFavorited: 1 });
outfitRecommendationSchema.index({ userId: 1, isWorn: 1 });

const OutfitRecommendation = mongoose.model('OutfitRecommendation', outfitRecommendationSchema);

export default OutfitRecommendation;
