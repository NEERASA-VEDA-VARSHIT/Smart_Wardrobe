import Suggestion from "../models/suggestion.model.js";
import Collection from "../models/collection.model.js";
import ClothingItem from "../models/clothingItem.model.js";
import User from "../models/user.model.js";
import { geminiModel } from "../services/geminiService.js";

/**
 * Create a new outfit suggestion
 * POST /api/suggestions/:collectionId
 */
export const createSuggestion = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { suggestedBy, outfitItems, note, styleTags, priority = 3 } = req.body;

    if (!suggestedBy || !outfitItems || outfitItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Suggested by, outfit items are required'
      });
    }

    // Verify collection exists and user has access
    const collection = await Collection.findById(collectionId)
      .populate('collaborators', 'name email');

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Check if user is a collaborator
    const isCollaborator = collection.collaborators.some(collab => 
      collab._id.toString() === suggestedBy
    );

    if (!isCollaborator) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to suggest for this collection'
      });
    }

    // Verify all outfit items exist and belong to the collection
    const items = await ClothingItem.find({
      _id: { $in: outfitItems },
      userId: collection.userId
    });

    if (items.length !== outfitItems.length) {
      return res.status(400).json({
        success: false,
        message: 'Some outfit items not found or do not belong to this collection'
      });
    }

    // Create the suggestion
    const suggestion = await Suggestion.create({
      collectionId,
      suggestedBy,
      outfitItems,
      note,
      styleTags,
      priority
    });

    // Populate the suggestion with full details
    await suggestion.populate([
      { path: 'suggestedBy', select: 'name email profilePicture' },
      { path: 'outfitItems', select: 'imageUrl metadata fileName' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Suggestion created successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error creating suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all suggestions for a collection
 * GET /api/suggestions/:collectionId
 */
export const getSuggestions = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build filter
    const filter = { collectionId };
    if (status) {
      filter.status = status;
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const suggestions = await Suggestion.find(filter)
      .populate([
        { path: 'suggestedBy', select: 'name email profilePicture' },
        { path: 'outfitItems', select: 'imageUrl metadata fileName publicId' },
        { path: 'votes.userId', select: 'name' },
        { path: 'comments.userId', select: 'name' }
      ])
      .sort(sort);

    res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get suggestions for a specific user (owner view)
 * GET /api/suggestions/user/:userId
 */
export const getUserSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status = 'pending' } = req.query;

    // Get collections owned by user
    const collections = await Collection.find({ userId }).select('_id');
    const collectionIds = collections.map(c => c._id);

    // Get suggestions for these collections
    const suggestions = await Suggestion.find({
      collectionId: { $in: collectionIds },
      status
    })
      .populate([
        { path: 'collectionId', select: 'name' },
        { path: 'suggestedBy', select: 'name email profilePicture' },
        { path: 'outfitItems', select: 'imageUrl metadata fileName' },
        { path: 'votes.userId', select: 'name' },
        { path: 'comments.userId', select: 'name' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Accept a suggestion
 * POST /api/suggestions/:suggestionId/accept
 */
export const acceptSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { userId } = req.body;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to accept this suggestion'
      });
    }

    await suggestion.accept();

    res.status(200).json({
      success: true,
      message: 'Suggestion accepted successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Mark suggestion as worn
 * POST /api/suggestions/:suggestionId/worn
 */
export const markSuggestionAsWorn = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { userId } = req.body;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to mark this suggestion as worn'
      });
    }

    await suggestion.markAsWorn();

    // Update wear count for clothing items
    await ClothingItem.updateMany(
      { _id: { $in: suggestion.outfitItems } },
      {
        $inc: { wearCount: 1 },
        lastWorn: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Suggestion marked as worn successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error marking suggestion as worn:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Reject a suggestion
 * POST /api/suggestions/:suggestionId/reject
 */
export const rejectSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { userId } = req.body;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject this suggestion'
      });
    }

    await suggestion.reject();

    res.status(200).json({
      success: true,
      message: 'Suggestion rejected successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error rejecting suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Vote on a suggestion
 * POST /api/suggestions/:suggestionId/vote
 */
export const voteOnSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { userId, vote } = req.body;

    if (!['like', 'dislike'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be either "like" or "dislike"'
      });
    }

    const suggestion = await Suggestion.findById(suggestionId);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    await suggestion.addVote(userId, vote);

    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        voteCount: suggestion.voteCount,
        likeRatio: suggestion.likeRatio
      }
    });

  } catch (error) {
    console.error('Error voting on suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Add comment to suggestion
 * POST /api/suggestions/:suggestionId/comment
 */
export const addCommentToSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { userId, comment } = req.body;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const suggestion = await Suggestion.findById(suggestionId);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    await suggestion.addComment(userId, comment.trim());

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get AI enhancement for a suggestion
 * POST /api/suggestions/:suggestionId/ai-enhance
 */
export const getAIEnhancement = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { weatherContext } = req.body;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate([
        { path: 'outfitItems', select: 'imageUrl metadata fileName' },
        { path: 'collectionId', select: 'name' }
      ]);

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Create AI prompt for enhancement
    const outfitDescription = suggestion.outfitItems.map(item => 
      `${item.metadata?.description || item.fileName} (${item.metadata?.category})`
    ).join(', ');

    const weatherContextText = weatherContext ? 
      `Current weather: ${weatherContext.temperature}°C, ${weatherContext.weatherType}` : 
      'No weather context provided';

    const prompt = `
A friend suggested this outfit for the collection "${suggestion.collectionId.name}":
${outfitDescription}

${weatherContextText}

Please provide:
1. A brief assessment of the outfit combination
2. Any improvements or alternatives you'd suggest
3. Why this works (or doesn't work) for the occasion
4. Any additional styling tips

Keep it friendly and constructive, like a helpful stylist friend.
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const aiSuggestion = response.text();

      // Update suggestion with AI enhancement
      suggestion.aiEnhanced = true;
      suggestion.aiSuggestion = aiSuggestion;
      await suggestion.save();

      res.status(200).json({
        success: true,
        message: 'AI enhancement generated successfully',
        data: {
          aiSuggestion,
          suggestion
        }
      });

    } catch (aiError) {
      console.error('AI enhancement error:', aiError);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI enhancement',
        error: aiError.message
      });
    }

  } catch (error) {
    console.error('Error getting AI enhancement:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
