import Suggestion from '../models/suggestion.model.js';
import Collection from '../models/collection.model.js';
import ClothingItem from '../models/clothingItem.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';
import { geminiModel } from '../services/geminiService.js';
import { getWeatherData } from '../services/weatherService.js';

/**
 * Submit a new outfit suggestion
 * POST /api/suggestions/:collectionId
 */
export const submitSuggestion = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { outfitItems, note, occasion, aiEnhancement = false } = req.body;
    const suggestedBy = req.user.id;

    // Validate required fields
    if (!outfitItems || !Array.isArray(outfitItems) || outfitItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one clothing item must be selected'
      });
    }

    // Check if collection exists and user has access
    const collection = await Collection.findById(collectionId)
      .populate('userId', 'name email');
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Verify all clothing items belong to the user who owns the collection
    const validItems = await ClothingItem.find({
      _id: { $in: outfitItems },
      userId: collection.userId._id
    });

    if (validItems.length !== outfitItems.length) {
      return res.status(400).json({
        success: false,
        message: 'Some clothing items do not belong to this collection'
      });
    }

    // Get weather context if available
    let weatherContext = null;
    if (collection.location && collection.location.lat && collection.location.lon) {
      try {
        const weather = await getWeatherData(collection.location.lat, collection.location.lon);
        if (weather) {
          weatherContext = {
            temperature: weather.temperature,
            weatherType: weather.weatherType,
            location: `${collection.location.city}, ${collection.location.country}`
          };
        }
      } catch (error) {
        console.warn('Could not fetch weather context:', error.message);
      }
    }

    // Create suggestion
    const suggestion = new Suggestion({
      collectionId,
      suggestedBy,
      outfitItems,
      note,
      occasion,
      weatherContext,
      aiEnhanced: false
    });

    // AI Enhancement if requested
    if (aiEnhancement) {
      try {
        const aiEnhancementResult = await enhanceSuggestionWithAIHelper(suggestion, validItems);
        suggestion.aiEnhanced = true;
        suggestion.aiEnhancement = aiEnhancementResult.enhancement;
        suggestion.aiConfidence = aiEnhancementResult.confidence;
        suggestion.tags = aiEnhancementResult.tags;
      } catch (error) {
        console.warn('AI enhancement failed:', error.message);
        // Continue without AI enhancement
      }
    }

    await suggestion.save();

    // Populate the response
    await suggestion.populate([
      { path: 'suggestedBy', select: 'name email profilePicture' },
      { path: 'outfitItems', select: 'name imageUrl metadata' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Suggestion submitted successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error submitting suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit suggestion',
      error: error.message
    });
  }
};

/**
 * Get all suggestions for a collection
 * GET /api/suggestions/:collectionId
 */
export const getCollectionSuggestions = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { status } = req.query;
    const userId = req.user.id;

    // Check if user owns the collection
    const collection = await Collection.findById(collectionId);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    if (collection.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view suggestions for your own collections'
      });
    }

    const suggestions = await Suggestion.getSuggestionsForCollection(collectionId, status);

    // Group suggestions by status
    const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
      const stat = suggestion.status;
      if (!acc[stat]) {
        acc[stat] = [];
      }
      acc[stat].push(suggestion);
      return acc;
    }, {});

    // Get statistics
    const stats = {
      total: suggestions.length,
      pending: groupedSuggestions.pending?.length || 0,
      accepted: groupedSuggestions.accepted?.length || 0,
      ignored: groupedSuggestions.ignored?.length || 0,
      worn: groupedSuggestions.worn?.length || 0
    };

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        groupedSuggestions,
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching collection suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions',
      error: error.message
    });
  }
};

/**
 * Get user's own suggestions
 * GET /api/suggestions/user/:userId
 */
export const getUserSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    // Check if user is requesting their own suggestions
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own suggestions'
      });
    }

    const suggestions = await Suggestion.getUserSuggestions(userId, status);

    res.status(200).json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user suggestions',
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
    const { wornItems = [] } = req.body;
    const userId = req.user.id;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId', 'userId')
      .populate('outfitItems', 'name imageUrl metadata');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (!suggestion.collectionId || suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only accept suggestions for your own collections'
      });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Suggestion has already been processed'
      });
    }

    // Accept the suggestion
    await suggestion.accept(wornItems);

    // Update clothing items wear count
    if (wornItems.length > 0) {
      await ClothingItem.updateMany(
        { _id: { $in: wornItems } },
        { 
          $inc: { wearCount: 1 },
          $set: { lastWorn: new Date() }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Suggestion accepted successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept suggestion',
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
    const userId = req.user.id;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId', 'userId');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (!suggestion.collectionId || suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (suggestion.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Suggestion must be accepted before marking as worn'
      });
    }

    await suggestion.markAsWorn();

    res.status(200).json({
      success: true,
      message: 'Suggestion marked as worn successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error marking suggestion as worn:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark suggestion as worn',
      error: error.message
    });
  }
};

/**
 * Ignore a suggestion
 * POST /api/suggestions/:suggestionId/ignore
 */
export const ignoreSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const { feedback = '' } = req.body;
    const userId = req.user.id;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId', 'userId');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (!suggestion.collectionId || suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Suggestion has already been processed'
      });
    }

    await suggestion.ignore(feedback);

    res.status(200).json({
      success: true,
      message: 'Suggestion ignored successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error ignoring suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ignore suggestion',
      error: error.message
    });
  }
};

/**
 * Enhance suggestion with AI
 * POST /api/suggestions/:suggestionId/enhance
 */
export const enhanceSuggestionWithAI = async (req, res) => {
  try {
    const { suggestionId } = req.params;
    const userId = req.user.id;

    const suggestion = await Suggestion.findById(suggestionId)
      .populate('collectionId', 'userId')
      .populate('outfitItems', 'name imageUrl metadata')
      .populate('suggestedBy', 'name');

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      });
    }

    // Check if user owns the collection
    if (!suggestion.collectionId || suggestion.collectionId.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Enhance with AI
    const enhancementResult = await enhanceSuggestionWithAIHelper(suggestion, suggestion.outfitItems);
    
    suggestion.aiEnhanced = true;
    suggestion.aiEnhancement = enhancementResult.enhancement;
    suggestion.aiConfidence = enhancementResult.confidence;
    suggestion.tags = enhancementResult.tags;
    
    await suggestion.save();

    res.status(200).json({
      success: true,
      message: 'Suggestion enhanced with AI successfully',
      data: suggestion
    });

  } catch (error) {
    console.error('Error enhancing suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance suggestion',
      error: error.message
    });
  }
};

/**
 * Helper function to enhance suggestion with AI
 */
async function enhanceSuggestionWithAIHelper(suggestion, clothingItems) {
  const prompt = `
As a fashion AI assistant, enhance this outfit suggestion:

Original Suggestion by ${suggestion.suggestedBy?.name || 'a friend'}:
${suggestion.note || 'No note provided'}

Clothing Items:
${clothingItems.map(item => `- ${item.name}: ${item.metadata?.description || 'No description'}`).join('\n')}

Context:
- Occasion: ${suggestion.occasion || 'General'}
- Weather: ${suggestion.weatherContext ? `${suggestion.weatherContext.temperature}°C, ${suggestion.weatherContext.weatherType}` : 'Unknown'}

Please provide:
1. An enhanced description of why this outfit works
2. Any styling tips or improvements
3. Confidence score (0-1)
4. Relevant tags

Respond in JSON format:
{
  "enhancement": "Your enhanced description and tips",
  "confidence": 0.8,
  "tags": ["casual", "summer", "dinner"]
}
`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('AI enhancement error:', error);
    return {
      enhancement: "AI enhancement unavailable at the moment",
      confidence: 0.5,
      tags: []
    };
  }
}

/**
 * Get suggestion statistics
 * GET /api/suggestions/stats/:userId
 */
export const getSuggestionStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is requesting their own stats
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = await Suggestion.aggregate([
      { $match: { suggestedBy: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {
      total: 0,
      pending: 0,
      accepted: 0,
      ignored: 0,
      worn: 0
    });

    formattedStats.total = Object.values(formattedStats).reduce((sum, count) => sum + count, 0);

    res.status(200).json({
      success: true,
      data: formattedStats
    });

  } catch (error) {
    console.error('Error fetching suggestion stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestion statistics',
      error: error.message
    });
  }
};