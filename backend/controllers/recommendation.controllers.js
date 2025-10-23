import ClothingItem from "../models/clothingItem.model.js";
import OutfitRecommendation from "../models/outfitRecommendation.model.js";
import LaundryItem from "../models/laundryItem.model.js";
import { findSimilarItemsByText, findComplementaryItems, getOutfitRecommendations } from "../services/vectorSearch.js";
import { geminiModel } from "../services/geminiService.js";
import { cacheService } from "../services/cacheService.js";

/**
 * Generate outfit recommendations using RAG
 * POST /api/recommendations/outfit
 */
export const recommendOutfits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      query, 
      occasion, 
      weather, 
      season, 
      formality, 
      timeOfDay,
      temperature,
      latitude,
      longitude,
      notes 
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Weather data will be handled by the weather recommendation service
    // This controller focuses on general outfit recommendations

    // Build context object
    const context = {
      occasion,
      weather: weather || 'moderate',
      season,
      formality,
      timeOfDay,
      temperature
    };

    // Check cache first
    const cacheKey = cacheService.generateKey(userId, { query, occasion, weather, season, formality });
    const cachedResult = cacheService.get(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Returning cached recommendation');
      return res.status(200).json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get items currently in laundry to exclude from recommendations
    const laundryItems = await LaundryItem.find({ 
      userId, 
      status: { $in: ['in_laundry', 'washed'] } 
    }).select('clothingId');
    
    const excludeIds = laundryItems.map(item => item.clothingId.toString());
    console.log(`🚫 Excluding ${excludeIds.length} items from laundry from recommendations`);

    // Get outfit recommendations using vector search (excluding laundry items)
    const recommendations = await getOutfitRecommendations(userId, context, excludeIds);

    // Generate AI-powered outfit suggestion using Gemini

    const outfitPrompt = `Based on the user's wardrobe items, create a stylish outfit recommendation.

Context:
- Occasion: ${occasion || 'casual'}
- Weather: ${weather || 'normal'}
- Season: ${season || 'all-season'}
- Formality: ${formality || 'casual'}
- Time of Day: ${timeOfDay || 'any'}
- Additional Notes: ${notes || 'none'}

Available Items by Category:
${Object.entries(recommendations.itemsByCategory).map(([category, items]) => 
  `${category}: ${items.slice(0, 3).map(item => item.metadata.description).join(', ')}`
).join('\n')}

Please recommend a complete outfit combination that:
1. Matches the occasion and formality level
2. Is appropriate for the current weather conditions
3. Creates a cohesive, stylish look
4. Uses items from the user's wardrobe
5. Considers temperature, humidity, and weather conditions

Format your response as:
OUTFIT: [Brief outfit description]
REASONING: [Why this combination works, especially for current weather]
STYLING_TIPS: [Additional styling advice for the weather conditions]`;

    let aiSuggestion = null;
    try {
      const result = await geminiModel.generateContent(outfitPrompt);
      const response = await result.response;
      aiSuggestion = response.text();
    } catch (geminiError) {
      console.error('Gemini outfit generation failed:', geminiError);
      // Continue without AI suggestion
    }

    // Create outfit recommendation record
    const outfitRecommendation = new OutfitRecommendation({
      userId,
      recommendedItems: recommendations.topItems.slice(0, 5).map(item => item._id),
      context: {
        weather: {
          temperature: temperature || 'moderate',
          condition: weather || 'clear'
        },
        occasion: occasion === 'general' ? 'casual' : (occasion || 'casual'),
        timeOfDay: timeOfDay === 'day' ? 'morning' : (timeOfDay || 'morning'),
        season: season === 'all-season' ? 'summer' : (season || 'summer'),
        formality: formality || 'casual',
        notes: notes || ''
      },
      generatedBy: 'AI',
      confidence: 0.8,
      reasoning: aiSuggestion || 'Generated based on wardrobe analysis',
      tags: [occasion, weather, season, formality].filter(Boolean)
    });

    await outfitRecommendation.save();

    const responseData = {
      recommendation: outfitRecommendation,
      items: recommendations.topItems,
      itemsByCategory: recommendations.itemsByCategory,
      aiSuggestion,
      totalItems: recommendations.totalItems
    };

    // Cache the result
    cacheService.set(cacheKey, responseData);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error generating outfit recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate outfit recommendations',
      error: error.message
    });
  }
};

/**
 * Find similar items to a specific clothing item
 * GET /api/recommendations/similar/:itemId
 */
export const findSimilarItems = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { limit = 5 } = req.query;

    // Get the base item
    const baseItem = await ClothingItem.findById(itemId);
    if (!baseItem) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    // Find similar items
    const similarItems = await findSimilarItemsByText(
      baseItem.metadata.description,
      baseItem.userId.toString(),
      {},
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        baseItem: {
          _id: baseItem._id,
          metadata: baseItem.metadata,
          imageUrl: baseItem.imageUrl
        },
        similarItems: similarItems.map(item => ({
          _id: item._id,
          metadata: item.metadata,
          imageUrl: item.imageUrl,
          similarity: item.similarity
        }))
      }
    });

  } catch (error) {
    console.error('Error finding similar items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find similar items',
      error: error.message
    });
  }
};

/**
 * Get complementary items for an outfit
 * GET /api/recommendations/complementary/:itemId
 */
export const getComplementaryItems = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { occasion, weather, season } = req.query;

    // Get the base item
    const baseItem = await ClothingItem.findById(itemId);
    if (!baseItem) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    // Find complementary items
    const complementaryItems = await findComplementaryItems(
      itemId,
      baseItem.userId.toString(),
      { occasion, weather, season }
    );

    res.status(200).json({
      success: true,
      data: {
        baseItem: {
          _id: baseItem._id,
          metadata: baseItem.metadata,
          imageUrl: baseItem.imageUrl
        },
        complementaryItems
      }
    });

  } catch (error) {
    console.error('Error getting complementary items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get complementary items',
      error: error.message
    });
  }
};

/**
 * Get user's outfit recommendation history
 * GET /api/recommendations/history/:userId
 */
export const getRecommendationHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const recommendations = await OutfitRecommendation.find({ 
      userId,
      isArchived: false 
    })
    .populate('recommendedItems', 'metadata imageUrl')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) * parseInt(page))
    .skip((parseInt(page) - 1) * parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        recommendations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: recommendations.length
        }
      }
    });

  } catch (error) {
    console.error('Error getting recommendation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendation history',
      error: error.message
    });
  }
};

/**
 * Provide feedback on an outfit recommendation
 * POST /api/recommendations/:recommendationId/feedback
 */
export const provideFeedback = async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const recommendation = await OutfitRecommendation.findById(recommendationId);
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    recommendation.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await recommendation.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: recommendation
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

/**
 * Mark a recommendation as worn
 * POST /api/recommendations/:recommendationId/worn
 */
export const markAsWorn = async (req, res) => {
  try {
    const { recommendationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const recommendation = await OutfitRecommendation.findById(recommendationId);
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation not found'
      });
    }

    recommendation.isWorn = true;
    recommendation.wornDate = new Date();

    await recommendation.save();

    // Update wear count and cleanliness status for each recommended item
    const wearUpdatePromises = recommendation.recommendedItems.map(async (clothingId) => {
      const item = await ClothingItem.findById(clothingId);
      if (item) {
        item.wearCount += 1;
        item.lastWorn = new Date();
        
        // Determine cleanliness status based on user preference
        let newStatus = 'worn_wearable'; // Default to wearable
        
        switch (item.userWashPreference) {
          case 'afterEachWear':
            newStatus = 'needs_wash';
            break;
          case 'afterFewWears':
            if (item.wearCount >= 2) {
              newStatus = 'needs_wash';
            }
            break;
          case 'manual':
          default:
            // Keep as worn_wearable unless manually flagged
            break;
        }
        
        item.cleanlinessStatus = newStatus;
        item.updateFreshnessScore();
        return item.save();
      }
    });

    try {
      await Promise.all(wearUpdatePromises);
      console.log(`✅ Updated wear count for ${recommendation.recommendedItems.length} items`);
    } catch (wearError) {
      console.error('Error updating wear count:', wearError);
      // Don't fail the request if wear update fails
    }

    res.status(200).json({
      success: true,
      message: 'Recommendation marked as worn successfully',
      data: {
        ...recommendation.toObject(),
        itemsWorn: recommendation.recommendedItems.length,
        note: 'Items wear count updated. Check laundry suggestions for items that may need washing.'
      }
    });

  } catch (error) {
    console.error('Error marking as worn:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark as worn',
      error: error.message
    });
  }
};
