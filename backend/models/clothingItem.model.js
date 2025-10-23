import mongoose from "mongoose";

const clothingItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  metadata: {
    category: {
      type: String,
      enum: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessories', 'underwear', 'other'],
      required: true
    },
    subcategory: String, // e.g., 't-shirt', 'jeans', 'sneakers'
    color: {
      primary: String,
      secondary: String
    },
    fabric: String,
    brand: String,
    size: String,
    pattern: String, // e.g., 'solid', 'striped', 'polka-dot'
    season: {
      type: String,
      enum: ['spring', 'summer', 'fall', 'winter', 'all-season']
    },
    formality: {
      type: String,
      enum: ['casual', 'business-casual', 'business', 'formal', 'semi-formal']
    },
    occasion: [String], // e.g., ['work', 'party', 'gym', 'date']
    tags: [String], // Additional descriptive tags
    description: String // AI-generated or manual description
  },
  metadataSource: {
    type: String,
    enum: ['manual', 'gemini'],
    default: 'manual'
  },
  vectorEmbedding: {
    type: [Number],
    default: [],
    sparse: true // Optimize for sparse vectors
  },
  embeddingModel: {
    type: String,
    default: 'text-embedding-ada-002' // Track which model was used
  },
  lastWornDate: {
    type: Date,
    default: null
  },
  wearCount: {
    type: Number,
    default: 0
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
        isArchived: {
            type: Boolean,
            default: false
        },
        // Wear tracking
        lastWorn: {
            type: Date,
            default: null
        },
        wearCount: {
            type: Number,
            default: 0
        },
        // Cleanliness status - the key differentiator
        cleanlinessStatus: {
            type: String,
            enum: ["fresh", "worn_wearable", "needs_wash", "in_laundry"],
            default: "fresh"
        },
        // User wash preferences
        userWashPreference: {
            type: String,
            enum: ["afterEachWear", "afterFewWears", "manual"],
            default: "manual"
        },
        // Freshness score (0-100) for smart recommendations
        freshnessScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100
        }
}, {
  timestamps: true
});

// Method to calculate freshness score
clothingItemSchema.methods.calculateFreshnessScore = function() {
  const now = new Date();
  const daysSinceLastWorn = this.lastWorn ? Math.floor((now - this.lastWorn) / (1000 * 60 * 60 * 24)) : 0;
  
  // Base score starts at 100
  let score = 100;
  
  // Reduce score based on wear count
  score -= (this.wearCount * 15); // -15 points per wear
  
  // Reduce score based on days since last worn (if worn)
  if (this.lastWorn) {
    score -= (daysSinceLastWorn * 5); // -5 points per day
  }
  
  // Category-specific adjustments
  const category = this.metadata?.category?.toLowerCase();
  if (category === 'underwear' || category === 'socks') {
    score -= 20; // Underwear/socks lose freshness faster
  } else if (category === 'outerwear' || category === 'jacket') {
    score += 10; // Outerwear can be worn more
  }
  
  // Ensure score stays within bounds
  return Math.max(0, Math.min(100, Math.round(score)));
};

// Method to update freshness score
clothingItemSchema.methods.updateFreshnessScore = function() {
  this.freshnessScore = this.calculateFreshnessScore();
  return this.freshnessScore;
};

// Performance-optimized indexes for fast queries
clothingItemSchema.index({ userId: 1, isArchived: 1, cleanlinessStatus: 1 });
clothingItemSchema.index({ userId: 1, 'metadata.category': 1, cleanlinessStatus: 1 });
clothingItemSchema.index({ userId: 1, freshnessScore: -1, cleanlinessStatus: 1 });
clothingItemSchema.index({ userId: 1, 'metadata.weatherSuitability': 1, cleanlinessStatus: 1 });
clothingItemSchema.index({ userId: 1, 'metadata.formality': 1, cleanlinessStatus: 1 });
clothingItemSchema.index({ userId: 1, 'metadata.season': 1, cleanlinessStatus: 1 });
clothingItemSchema.index({ userId: 1, 'metadata.color.primary': 1, cleanlinessStatus: 1 });

// Compound index for weather recommendations (most common query)
clothingItemSchema.index({ 
  userId: 1, 
  isArchived: 1, 
  cleanlinessStatus: 1, 
  freshnessScore: -1 
});

const ClothingItem = mongoose.model('ClothingItem', clothingItemSchema);

export default ClothingItem;
