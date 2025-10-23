import mongoose from "mongoose";

const laundryItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clothingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClothingItem',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  expectedReturn: {
    type: Date,
    default: function() {
      // Default to 2 days from now
      return new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    }
  },
  status: {
    type: String,
    enum: ['in_laundry', 'washed', 'ready_to_wear'],
    default: 'in_laundry'
  },
  notes: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
laundryItemSchema.index({ userId: 1, status: 1 });
laundryItemSchema.index({ clothingId: 1 });
laundryItemSchema.index({ addedAt: -1 });

// Virtual for days in laundry
laundryItemSchema.virtual('daysInLaundry').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.addedAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for isOverdue
laundryItemSchema.virtual('isOverdue').get(function() {
  if (this.status === 'in_laundry') {
    return new Date() > this.expectedReturn;
  }
  return false;
});

// Ensure virtual fields are serialized
laundryItemSchema.set('toJSON', { virtuals: true });

const LaundryItem = mongoose.model('LaundryItem', laundryItemSchema);

export default LaundryItem;
