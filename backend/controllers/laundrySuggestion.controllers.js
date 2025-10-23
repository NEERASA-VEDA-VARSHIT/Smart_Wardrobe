import ClothingItem from "../models/clothingItem.model.js";
import LaundryItem from "../models/laundryItem.model.js";

/**
 * Check if clothing item should suggest laundry based on user preferences
 * @param {Object} clothingItem - The clothing item
 * @returns {Object} - Suggestion result
 */
export const checkLaundrySuggestion = (clothingItem) => {
  const { userWashPreference, wearCount, lastWorn, cleanlinessStatus } = clothingItem;
  
  // Don't suggest if already in laundry or needs wash
  if (cleanlinessStatus === 'in_laundry' || cleanlinessStatus === 'needs_wash') {
    return {
      shouldSuggest: false,
      reason: 'Already flagged for laundry',
      wearCount,
      lastWorn,
      preference: userWashPreference,
      status: cleanlinessStatus
    };
  }
  
  let shouldSuggest = false;
  let reason = '';
  
  switch (userWashPreference) {
    case 'afterEachWear':
      if (wearCount > 0) {
        shouldSuggest = true;
        reason = 'You prefer to wash after each wear';
      }
      break;
      
    case 'afterFewWears':
      if (wearCount >= 2) {
        shouldSuggest = true;
        reason = `You've worn this ${wearCount} times`;
      }
      break;
      
    case 'manual':
    default:
      // Only suggest if it's been worn multiple times or been a while
      if (wearCount >= 3) {
        shouldSuggest = true;
        reason = `You've worn this ${wearCount} times`;
      } else if (lastWorn && (Date.now() - lastWorn.getTime()) > (7 * 24 * 60 * 60 * 1000)) {
        shouldSuggest = true;
        reason = 'You last wore this over a week ago';
      }
      break;
  }
  
  return {
    shouldSuggest,
    reason,
    wearCount,
    lastWorn,
    preference: userWashPreference,
    status: cleanlinessStatus
  };
};

/**
 * Mark clothing item as worn and check for laundry suggestions
 * POST /api/clothing-items/:id/mark-worn
 */
export const markAsWorn = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Find the clothing item first
    const clothingItem = await ClothingItem.findOne({ _id: id, userId });
    
    if (!clothingItem) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    // Update wear count and last worn
    clothingItem.wearCount += 1;
    clothingItem.lastWorn = new Date();
    
    // Determine cleanliness status based on user preference
    let newCleanlinessStatus = 'worn_wearable'; // Default to wearable
    
    switch (clothingItem.userWashPreference) {
      case 'afterEachWear':
        newCleanlinessStatus = 'needs_wash';
        break;
      case 'afterFewWears':
        if (clothingItem.wearCount >= 2) {
          newCleanlinessStatus = 'needs_wash';
        }
        break;
      case 'manual':
      default:
        // Keep as worn_wearable unless manually flagged
        break;
    }
    
    clothingItem.cleanlinessStatus = newCleanlinessStatus;
    
    // Update freshness score
    clothingItem.updateFreshnessScore();
    
    await clothingItem.save();

    // Check if we should suggest laundry
    const suggestion = checkLaundrySuggestion(clothingItem);

    res.status(200).json({
      success: true,
      message: 'Item marked as worn successfully',
      data: {
        clothingItem,
        laundrySuggestion: suggestion,
        statusChange: {
          from: 'fresh',
          to: newCleanlinessStatus,
          reason: `Based on ${clothingItem.userWashPreference} preference`
        }
      }
    });

  } catch (error) {
    console.error('Error marking item as worn:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get laundry suggestions for a user
 * GET /api/laundry-suggestions/:userId
 */
export const getLaundrySuggestions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Get all clothing items that are not in laundry bag
    const clothingItems = await ClothingItem.find({
      userId,
      inLaundryBag: false,
      isArchived: false
    });

    // Check each item for laundry suggestions
    const suggestions = clothingItems
      .map(item => {
        const suggestion = checkLaundrySuggestion(item);
        if (suggestion.shouldSuggest) {
          return {
            clothingItem: item,
            suggestion
          };
        }
        return null;
      })
      .filter(Boolean);

    // Sort by urgency (more wears = more urgent)
    suggestions.sort((a, b) => b.suggestion.wearCount - a.suggestion.wearCount);

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        totalSuggestions: suggestions.length,
        summary: {
          afterEachWear: suggestions.filter(s => s.suggestion.preference === 'afterEachWear').length,
          afterFewWears: suggestions.filter(s => s.suggestion.preference === 'afterFewWears').length,
          manual: suggestions.filter(s => s.suggestion.preference === 'manual').length
        }
      }
    });

  } catch (error) {
    console.error('Error getting laundry suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Update user's wash preference for a clothing item
 * PUT /api/clothing-items/:id/wash-preference
 */
export const updateWashPreference = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, preference } = req.body;

    if (!userId || !preference) {
      return res.status(400).json({
        success: false,
        message: 'User ID and preference are required'
      });
    }

    if (!['afterEachWear', 'afterFewWears', 'manual'].includes(preference)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preference. Must be: afterEachWear, afterFewWears, or manual'
      });
    }

    const clothingItem = await ClothingItem.findOneAndUpdate(
      { _id: id, userId },
      { userWashPreference: preference },
      { new: true }
    );

    if (!clothingItem) {
      return res.status(404).json({
        success: false,
        message: 'Clothing item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Wash preference updated successfully',
      data: clothingItem
    });

  } catch (error) {
    console.error('Error updating wash preference:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Learn from user's laundry decisions to improve suggestions
 * POST /api/laundry-suggestions/learn
 */
export const learnFromUserDecision = async (req, res) => {
  try {
    const { userId, clothingId, decision, itemType } = req.body;
    // decision: 'moved_to_laundry' | 'kept_wearing'
    // itemType: 'shirt', 'pants', 'dress', etc.

    if (!userId || !clothingId || !decision) {
      return res.status(400).json({
        success: false,
        message: 'User ID, clothing ID, and decision are required'
      });
    }

    // This is where we could implement machine learning
    // For now, we'll just log the decision for future analysis
    console.log(`Learning: User ${userId} ${decision} for ${itemType} (${clothingId})`);

    // Future enhancement: Update user's general preferences based on patterns
    // For example, if they always move shirts to laundry after 1 wear,
    // suggest "afterEachWear" for new shirts

    res.status(200).json({
      success: true,
      message: 'Decision recorded for learning',
      data: {
        userId,
        clothingId,
        decision,
        itemType,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Error learning from user decision:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
