import ClothingItem from "../models/clothingItem.model.js";
import OutfitRecommendation from "../models/outfitRecommendation.model.js";
import LaundryItem from "../models/laundryItem.model.js";
import { findSimilarItemsByText, findComplementaryItems, getOutfitRecommendations } from "../services/vectorSearch.js";
import { geminiModel, generateOutfitSets, generateAISuggestions } from "../services/geminiService.js";
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
 * Generate multiple visual outfit sets from user's wardrobe (RAG over own items)
 * POST /api/recommendations/outfits/:userId
 */
export const recommendOutfitSets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { occasion = 'casual', timeOfDay = 'day', weather = 'moderate', temperature } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    // Exclude items in laundry
    const laundryItems = await LaundryItem.find({ userId, status: { $in: ['in_laundry', 'washed'] } }).select('clothingId');
    const excludeIds = new Set(laundryItems.map(i => i.clothingId.toString()));

    // Fetch user's items and filter by season/formality/occasion if present
    const all = await ClothingItem.find({ userId, isArchived: { $ne: true } })
      .select('metadata imageUrl createdAt')
      .lean();

    const filtered = all.filter(it => !excludeIds.has(it._id.toString()))
      .filter(it => {
        const m = it.metadata || {};
        const okSeason = !m.season || m.season === 'all-season' || (weather?.toLowerCase?.().includes('cold') ? m.season !== 'summer' : true);
        const okFormality = !m.formality || occasion === 'general' || m.formality.includes?.(occasion) || true;
        return okSeason && okFormality;
      })
      .sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))
      .slice(0, 15);

    // Check if user has enough items
    if (filtered.length < 2) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          summary: 'Not enough wardrobe items to generate outfits. Please add at least 2 clothing items.',
          outfits: [],
          source: 'gemini',
          totalCandidates: filtered.length 
        } 
      });
    }

    // Ask Gemini to build 2-4 outfit sets from these items (Gemini-driven selection)
    console.log(`Generating outfits from ${filtered.length} items for user ${userId}`);
    const ai = await generateOutfitSets(filtered, { occasion, timeOfDay, weather, temperature });
    if (!ai.success) {
      console.error('AI generation failed:', ai.error);
      // Return 200 with empty outfits instead of 502 to avoid frontend errors
      return res.status(200).json({ 
        success: true, 
        data: { 
          summary: `Unable to generate outfits: ${ai.error}. Please try again.`,
          outfits: [],
          source: 'gemini',
          totalCandidates: filtered.length,
          error: ai.error
        } 
      });
    }

    if (!ai.data?.outfits || !Array.isArray(ai.data.outfits) || ai.data.outfits.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: { 
          summary: 'No outfits could be generated from your wardrobe.',
          outfits: [],
          source: 'gemini',
          totalCandidates: filtered.length 
        } 
      });
    }

    // Map item ids to full items with imageUrl for rendering (support both string and ObjectId formats)
    const idToItem = new Map();
    filtered.forEach(i => {
      const idStr = i._id.toString();
      idToItem.set(idStr, i);
      // Also store without toString in case Gemini returns different format
      idToItem.set(idStr.replace(/^.*:/, ''), i);
    });

    const scoreFor = (m) => {
      if (!m) return 70;
      let s = 70;
      const formality = (m.formality || '').toString().toLowerCase();
      if (formality && (occasion || '').toLowerCase().includes(formality)) s += 8;
      const occs = Array.isArray(m.occasion) ? m.occasion.map(x=>x.toString().toLowerCase()) : [];
      if (occs.includes((occasion || '').toLowerCase())) s += 6;
      const season = (m.season || '').toString().toLowerCase();
      if (season === 'all-season') s += 6;
      if (weather && ((weather.toLowerCase().includes('cool') && season !== 'summer') || (weather.toLowerCase().includes('hot') && season !== 'winter'))) s += 6;
      return Math.max(50, Math.min(96, s));
    };

    console.log(`Processing ${ai.data.outfits.length} outfit(s) from Gemini`);
    console.log(`Available items for matching: ${filtered.length} items`);
    console.log(`Sample item IDs:`, filtered.slice(0, 3).map(i => i._id.toString()));
    
    const outfits = ai.data.outfits
      .slice(0, 4)
      .map((o, idx) => {
        console.log(`\n--- Processing outfit ${idx + 1}: "${o.title}" ---`);
        console.log(`Gemini item IDs:`, o.items);
        
        // Try multiple ID formats to match items - be more flexible
        const items = (o.items || []).map(id => {
          const idStr = String(id).trim();
          // Try exact match first
          let item = idToItem.get(idStr);
          // Try without ObjectId prefix
          if (!item) item = idToItem.get(idStr.replace(/^.*:/, ''));
          // Try finding by partial match
          if (!item) item = filtered.find(f => f._id.toString() === idStr || f._id.toString().endsWith(idStr) || idStr.endsWith(f._id.toString()));
          // Try finding by last 8 characters (common ObjectId pattern)
          if (!item && idStr.length >= 8) {
            const last8 = idStr.slice(-8);
            item = filtered.find(f => f._id.toString().endsWith(last8));
          }
          // Try finding by first 8 characters
          if (!item && idStr.length >= 8) {
            const first8 = idStr.slice(0, 8);
            item = filtered.find(f => f._id.toString().startsWith(first8));
          }
          if (item) {
            console.log(`  ✓ Matched: ${idStr} → ${item._id.toString()}`);
          } else {
            console.warn(`  ✗ FAILED to match: ${idStr}`);
          }
          return item ? {
            id: item._id.toString(),
            imageUrl: item.imageUrl,
            metadata: item.metadata
          } : null;
        }).filter(Boolean);
        
        console.log(`Matched ${items.length}/${o.items?.length || 0} items`);
        
        // Log if items are missing imageUrl (but still include them)
        const itemsWithImages = items.filter(x => x.imageUrl);
        if (items.length > itemsWithImages.length) {
          console.warn(`Outfit ${idx + 1} has ${items.length - itemsWithImages.length} items without images`);
        }
        
        // Use items with images if available, otherwise use all items
        const finalItems = itemsWithImages.length >= 2 ? itemsWithImages : items;
        
        if (finalItems.length < 2) {
          console.warn(`Outfit ${idx + 1} "${o.title}" only has ${finalItems.length} valid item(s), expected at least 2`);
        }
        
        const match_score = finalItems.length ? Math.round(finalItems.reduce((a,c)=>a+scoreFor(c.metadata),0)/finalItems.length) : 70;
        return {
          title: o.title || `Recommended Outfit ${idx + 1}`,
          reasoning: o.reasoning || 'AI-generated outfit recommendation',
          match_score,
          occasion,
          weather,
          style_tips: 'Consider adding a belt or simple accessories to complete the look.',
          items: finalItems
        };
      })
      .filter(o => (o.items?.length || 0) >= 2); // Still filter out outfits with less than 2 items
    
    console.log(`After processing: ${outfits.length} valid outfit(s) with at least 2 items each`);
    
    // If we have less than 3 outfits after filtering, try to keep all valid ones (even with 1 item temporarily)
    if (outfits.length < 3 && ai.data.outfits.length >= 3) {
      console.warn(`Lost ${ai.data.outfits.length - outfits.length} outfit(s) during item matching. Checking alternatives...`);
      // Re-process to include outfits with at least 1 item if they have images
      const relaxedOutfits = ai.data.outfits.slice(0, 4).map((o, idx) => {
        const items = (o.items || []).map(id => {
          const idStr = String(id).trim();
          let item = idToItem.get(idStr) || idToItem.get(idStr.replace(/^.*:/, '')) || filtered.find(f => f._id.toString() === idStr || f._id.toString().endsWith(idStr) || idStr.endsWith(f._id.toString()));
          return item ? { id: item._id.toString(), imageUrl: item.imageUrl, metadata: item.metadata } : null;
        }).filter(Boolean).filter(x => x.imageUrl);
        
        if (items.length >= 1) {
          return {
            title: o.title || `Recommended Outfit ${idx + 1}`,
            reasoning: o.reasoning || 'AI-generated outfit recommendation',
            match_score: items.length ? Math.round(items.reduce((a,c)=>a+scoreFor(c.metadata),0)/items.length) : 70,
            occasion,
            weather,
            style_tips: 'Consider adding a belt or simple accessories to complete the look.',
            items
          };
        }
        return null;
      }).filter(Boolean);
      
      if (relaxedOutfits.length > outfits.length) {
        console.log(`Using ${relaxedOutfits.length} outfit(s) with relaxed matching`);
        // Take top 3 outfits sorted by number of items
        return res.status(200).json({ 
          success: true, 
          data: { 
            summary: ai.data.summary || '', 
            outfits: relaxedOutfits.sort((a,b) => b.items.length - a.items.length).slice(0, 3),
            source: 'gemini', 
            totalCandidates: filtered.length 
          } 
        });
      }
    }

    // If we have less than 3 outfits, generate additional combinations from available items
    if (outfits.length < 3 && filtered.length >= 4) {
      console.log(`\n=== Generating ${3 - outfits.length} additional outfit(s) from available items ===`);
      
      // Get items already used in valid outfits
      const usedItemIds = new Set();
      outfits.forEach(o => {
        (o.items || []).forEach(item => usedItemIds.add(item.id));
      });
      
      // Get unused items
      const unusedItems = filtered.filter(item => !usedItemIds.has(item._id.toString()));
      console.log(`Using ${unusedItems.length} unused items to create additional outfits`);
      
      // Categorize items
      const topItems = unusedItems.filter(item => {
        const cat = (item.metadata?.category || item.metadata?.subcategory || '').toLowerCase();
        return ['top', 'shirt', 't-shirt', 'tee', 'blouse', 'sweater', 'hoodie', 'kurta', 'polo'].some(c => cat.includes(c));
      });
      const bottomItems = unusedItems.filter(item => {
        const cat = (item.metadata?.category || item.metadata?.subcategory || '').toLowerCase();
        return ['bottom', 'pants', 'jeans', 'trouser', 'trousers', 'skirt', 'shorts', 'chinos', 'cargo'].some(c => cat.includes(c));
      });
      
      console.log(`Available: ${topItems.length} tops, ${bottomItems.length} bottoms`);
      
      // Create outfit combinations
      let additionalCount = 0;
      while (outfits.length < 3 && topItems.length > 0 && bottomItems.length > 0 && additionalCount < 10) {
        const top = topItems[additionalCount % topItems.length];
        const bottom = bottomItems[additionalCount % bottomItems.length];
        
        if (top && bottom && top._id.toString() !== bottom._id.toString()) {
          const topItem = {
            id: top._id.toString(),
            imageUrl: top.imageUrl,
            metadata: top.metadata
          };
          const bottomItem = {
            id: bottom._id.toString(),
            imageUrl: bottom.imageUrl,
            metadata: bottom.metadata
          };
          
          if (topItem.imageUrl && bottomItem.imageUrl) {
            outfits.push({
              title: `Outfit ${outfits.length + 1}`,
              reasoning: `A stylish combination of ${top.metadata?.subcategory || top.metadata?.category || 'top'} and ${bottom.metadata?.subcategory || bottom.metadata?.category || 'bottom'} perfect for ${occasion || 'casual'} occasions.`,
              match_score: Math.round((scoreFor(top.metadata) + scoreFor(bottom.metadata)) / 2),
              occasion,
              weather,
              style_tips: 'Consider adding a belt or simple accessories to complete the look.',
              items: [topItem, bottomItem]
            });
            console.log(`✓ Created outfit ${outfits.length}: ${top.metadata?.category || 'top'} + ${bottom.metadata?.category || 'bottom'}`);
            additionalCount++;
            
            // Remove used items
            topItems.splice(topItems.indexOf(top), 1);
            bottomItems.splice(bottomItems.indexOf(bottom), 1);
          } else {
            additionalCount++;
          }
        } else {
          additionalCount++;
        }
      }
      
      console.log(`\nFinal count: ${outfits.length} outfit(s)`);
    }
    
    // Ensure we return at least 3 outfits if we have them (up to 4 max)
    const finalOutfits = outfits.length >= 3 ? outfits.slice(0, 4) : outfits;
    
    if (finalOutfits.length < 3) {
      console.warn(`⚠ Warning: Only ${finalOutfits.length} outfit(s) will be returned (requested at least 3)`);
      console.warn(`  Available items: ${filtered.length}, Valid outfits from Gemini: ${ai.data.outfits.length}, After matching: ${outfits.length}`);
    } else {
      console.log(`✅ Successfully returning ${finalOutfits.length} outfit(s)`);
    }
    
    return res.status(200).json({ success: true, data: { summary: ai.data.summary || '', outfits: finalOutfits, source: 'gemini', totalCandidates: filtered.length } });
  } catch (error) {
    console.error('recommendOutfitSets error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate outfit sets', error: error.message });
  }
};

/**
 * Accept an outfit (list of itemIds) and update wear counts without a recommendation record
 * POST /api/recommendations/outfits/:userId/accept
 */
export const acceptOutfitItems = async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemIds } = req.body || {};
    if (!userId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userId and itemIds[] are required' });
    }

    // Ensure items belong to user
    const items = await ClothingItem.find({ _id: { $in: itemIds }, userId });
    const updatePromises = items.map(async (item) => {
      item.wearCount = (item.wearCount || 0) + 1;
      item.lastWorn = new Date();
      item.cleanlinessStatus = item.userWashPreference === 'afterEachWear' ? 'needs_wash' : (item.cleanlinessStatus || 'worn_wearable');
      item.updateFreshnessScore?.();
      return item.save();
    });
    await Promise.all(updatePromises);

    return res.status(200).json({ success: true, data: { updated: items.length } });
  } catch (error) {
    console.error('acceptOutfitItems error:', error);
    return res.status(500).json({ success: false, message: 'Failed to accept outfit', error: error.message });
  }
};

/**
 * Hybrid: return both wardrobe outfits (Gemini over wardrobe) and AI suggestions
 * POST /api/recommendations/hybrid/:userId
 */
export const recommendHybrid = async (req, res) => {
  try {
    const { userId } = req.params;
    const { occasion = 'casual', timeOfDay = 'day', weather = 'moderate', temperature, region = 'IN' } = req.body || {};
    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    // Exclude items in laundry
    const laundryItems = await LaundryItem.find({ userId, status: { $in: ['in_laundry', 'washed'] } }).select('clothingId');
    const excludeIds = new Set(laundryItems.map(i => i.clothingId.toString()));

    // Fetch user's items
    const all = await ClothingItem.find({ userId, isArchived: { $ne: true } })
      .select('metadata imageUrl createdAt')
      .lean();

    const filtered = all.filter(it => !excludeIds.has(it._id.toString()))
      .sort((a,b)=> new Date(b.createdAt)-new Date(a.createdAt))
      .slice(0, 15);

    // Wardrobe outfits
    const ward = await generateOutfitSets(filtered, { occasion, timeOfDay, weather, temperature });
    const idToItem = new Map(filtered.map(i => [i._id.toString(), i]));
    const wardrobeOutfits = (ward.success ? ward.data.outfits : [])
      .slice(0, 4)
      .map((o, idx) => ({
        title: o.title || `Recommended Outfit ${idx + 1}`,
        reasoning: o.reasoning,
        items: (o.items || []).map(id => ({ id, imageUrl: idToItem.get(id)?.imageUrl, metadata: idToItem.get(id)?.metadata })).filter(x => x.imageUrl)
      }));

    // AI suggestions
    const ai = await generateAISuggestions({ occasion, timeOfDay, weather, temperature, region });

    return res.status(200).json({
      success: true,
      data: {
        wardrobe: { summary: ward.data?.summary || '', outfits: wardrobeOutfits },
        ai: ai.success ? ai.data : { outfits: [] }
      }
    });
  } catch (error) {
    console.error('recommendHybrid error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate hybrid suggestions', error: error.message });
  }
};

/**
 * AI Suggestions (not limited to wardrobe) with image_prompt + curated_links
 * POST /api/recommendations/ai-suggestions
 */
export const recommendAISuggestions = async (req, res) => {
  try {
    const { occasion = 'casual', timeOfDay = 'day', weather = 'moderate', temperature, region = 'IN' } = req.body || {};
    console.log(`Generating AI suggestions for occasion: ${occasion}, weather: ${weather}`);
    const ai = await generateAISuggestions({ occasion, timeOfDay, weather, temperature, region });
    if (!ai.success) {
      console.error('AI suggestions failed:', ai.error);
      // Return 200 with empty outfits instead of 502 to avoid frontend errors
      return res.status(200).json({ 
        success: true, 
        data: { 
          outfits: [],
          summary: `Unable to generate AI suggestions: ${ai.error}. Please try again.`,
          error: ai.error
        } 
      });
    }
    return res.status(200).json({ success: true, data: ai.data });
  } catch (error) {
    console.error('recommendAISuggestions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate AI suggestions', error: error.message });
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
