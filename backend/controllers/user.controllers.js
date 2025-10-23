import User from '../models/user.model.js';
import ClothingItem from '../models/clothingItem.model.js';
import Collection from '../models/collection.model.js';
import OutfitRecommendation from '../models/outfitRecommendation.model.js';
import { deleteImage } from '../config/cloudinary.js';

export const getCurrentUser = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        // If user doesn't have a username, generate one
        if (!user.username) {
            let username = user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
            
            // Check if username already exists, if so, add a number
            let counter = 1;
            let originalUsername = username;
            while (await User.findOne({ username })) {
                username = `${originalUsername}${counter}`;
                counter++;
            }
            
            // Update user with generated username
            user.username = username;
            await user.save();
            console.log(`Generated username for user ${user.email}: ${username}`);
        }
        
        res.json(user);
    } catch (err) {
        console.error('Error in getCurrentUser:', err);
        res.status(500).json({ message: "Server error" });
    }
}

export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        
        // Get user by username (public profile data only)
        const user = await User.findOne({ username }).select('-password -email');
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Get user's public statistics
        const [clothingItemsCount, collectionsCount, outfitsCount] = await Promise.all([
            ClothingItem.countDocuments({ userId: user._id, isArchived: false }),
            Collection.countDocuments({ userId: user._id, isArchived: false, isPublic: true }),
            OutfitRecommendation.countDocuments({ userId: user._id, isArchived: false })
        ]);

        // Get recent public collections
        const recentCollections = await Collection.find({ 
            userId: user._id, 
            isArchived: false, 
            isPublic: true 
        })
        .populate('itemIds', 'imageUrl metadata')
        .sort({ createdAt: -1 })
        .limit(3);

        // Get recent clothing items (public view)
        const recentItems = await ClothingItem.find({ 
            userId: user._id, 
            isArchived: false 
        })
        .select('imageUrl metadata createdAt')
        .sort({ createdAt: -1 })
        .limit(6);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    username: user.username,
                    profilePic: user.profilePic,
                    preferences: user.preferences,
                    createdAt: user.createdAt
                },
                statistics: {
                    clothingItems: clothingItemsCount,
                    collections: collectionsCount,
                    outfits: outfitsCount
                },
                recentCollections,
                recentItems
            }
        });
    } catch (error) {
        console.error('Error fetching user by username:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, preferences } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        // Check if email is already taken by another user
        const existingUser = await User.findOne({ 
            email: email, 
            _id: { $ne: userId } 
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email is already taken by another user'
            });
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                email,
                preferences: preferences || {}
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        console.log('Upload profile picture request body:', req.body);
        console.log('Upload profile picture request file:', req.file);
        
        const userId = req.user.id;
        const { imageUrl, fileName, publicId } = req.body;

        // Validate required fields
        if (!imageUrl || !publicId) {
            console.log('Missing image data:', { imageUrl, publicId });
            return res.status(400).json({
                success: false,
                message: 'Image data is required'
            });
        }

        // Get current user to check for existing profile picture
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old profile picture from Cloudinary if it exists
        if (user.profilePicPublicId) {
            try {
                await deleteImage(user.profilePicPublicId);
                console.log('Old profile picture deleted from Cloudinary:', user.profilePicPublicId);
            } catch (cloudinaryError) {
                console.error('Error deleting old profile picture from Cloudinary:', cloudinaryError);
                // Continue with update even if deletion fails
            }
        }

        // Update user's profile picture
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profilePic: imageUrl,
                profilePicPublicId: publicId
            },
            { new: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            data: {
                profilePic: updatedUser.profilePic,
                profilePicPublicId: updatedUser.profilePicPublicId
            }
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

