import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  outfitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OutfitRecommendation',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxLength: 500
  },
  feedbackType: {
    type: String,
    enum: ['outfit', 'item', 'recommendation'],
    default: 'outfit'
  },
  specificAspects: {
    style: Number, // 1-5 rating for style
    comfort: Number, // 1-5 rating for comfort
    appropriateness: Number, // 1-5 rating for appropriateness
    creativity: Number // 1-5 rating for creativity
  },
  wouldWearAgain: {
    type: Boolean,
    default: null
  },
  improvements: [String], // Suggestions for improvement
  isAnonymous: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
feedbackSchema.index({ userId: 1 });
feedbackSchema.index({ outfitId: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ feedbackType: 1 });
feedbackSchema.index({ createdAt: -1 });

// Ensure one feedback per user per outfit
feedbackSchema.index({ userId: 1, outfitId: 1 }, { unique: true });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
