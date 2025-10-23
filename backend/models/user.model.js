import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    username: {
      type: String,
      required: false, // Make optional initially for existing users
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    avatar: { 
      type: String, 
      default: null 
    },
    profilePic: {
      type: String,
      default: null
    },
    profilePicPublicId: {
      type: String,
      default: null
    },
    preferences: {
      favoriteColors: [String],
      style: {
        type: String,
        enum: ['casual', 'business', 'formal', 'sporty', 'vintage', 'bohemian', 'minimalist'],
        default: 'casual'
      },
      weatherPreference: {
        type: String,
        enum: ['cold', 'moderate', 'warm', 'hot'],
        default: 'moderate'
      },
      size: {
        top: String,
        bottom: String,
        shoes: String
      },
      brands: [String],
      budget: {
        min: Number,
        max: Number
      },
      occasions: [String], // e.g., ['work', 'party', 'gym']
      colors: {
        avoid: [String],
        prefer: [String]
      }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    lastLogin: {
      type: Date,
      default: null
    },
    totalItems: {
      type: Number,
      default: 0
    },
    totalCollections: {
      type: Number,
      default: 0
    },
    totalOutfits: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }
    }
  }
);

const User = mongoose.model('User', userSchema);

export default User;