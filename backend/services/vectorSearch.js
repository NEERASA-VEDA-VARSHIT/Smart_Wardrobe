import ClothingItem from "../models/clothingItem.model.js";
import { generateTextEmbedding } from "./geminiService.js";

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vectorA - First vector
 * @param {Array} vectorB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
export function calculateCosineSimilarity(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find similar clothing items using vector similarity
 * @param {Array} queryEmbedding - The query vector
 * @param {string} userId - User ID to filter items
 * @param {Object} filters - Additional filters (category, color, etc.)
 * @param {number} limit - Maximum number of results
 * @returns {Array} - Array of similar items with similarity scores
 */
export async function findSimilarItems(queryEmbedding, userId, filters = {}, limit = 10) {
  try {
    // Build filter query - only include fresh and worn_wearable items
    const filterQuery = { 
      userId,
      isArchived: false,
      cleanlinessStatus: { $in: ["fresh", "worn_wearable"] }, // Smart filtering
      vectorEmbedding: { $exists: true, $ne: [] }
    };

    // Add additional filters
    if (filters.category) {
      filterQuery['metadata.category'] = filters.category;
    }
    if (filters.color) {
      filterQuery['metadata.color.primary'] = new RegExp(filters.color, 'i');
    }
    if (filters.formality) {
      filterQuery['metadata.formality'] = filters.formality;
    }
    if (filters.season) {
      filterQuery['metadata.season'] = filters.season;
    }

    // Exclude specific items (e.g., from laundry)
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      filterQuery._id = { $nin: filters.excludeIds };
    }

    // Get all matching clothing items
    const items = await ClothingItem.find(filterQuery)
      .populate('userId', 'name email')
      .lean();

    if (items.length === 0) {
      return [];
    }

    // Calculate similarities
    const itemsWithSimilarity = items.map(item => {
      const similarity = calculateCosineSimilarity(queryEmbedding, item.vectorEmbedding);
      return {
        ...item,
        similarity
      };
    });

    // Sort by similarity and return top results
    return itemsWithSimilarity
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding similar items:', error);
    throw error;
  }
}

/**
 * Find similar items by text query (converts text to embedding first)
 * @param {string} queryText - Text query
 * @param {string} userId - User ID
 * @param {Object} filters - Additional filters
 * @param {number} limit - Maximum results
 * @returns {Array} - Similar items
 */
export async function findSimilarItemsByText(queryText, userId, filters = {}, limit = 10) {
  try {
    // Generate embedding for the text query
    const embeddingResult = await generateTextEmbedding(queryText);
    
    if (!embeddingResult.success) {
      throw new Error('Failed to generate embedding for query');
    }

    // Find similar items using the generated embedding
    return await findSimilarItems(embeddingResult.embedding, userId, filters, limit);
  } catch (error) {
    console.error('Error finding similar items by text:', error);
    throw error;
  }
}

/**
 * Find complementary items for an outfit
 * @param {string} baseItemId - The base clothing item
 * @param {string} userId - User ID
 * @param {Object} context - Context (occasion, weather, etc.)
 * @returns {Object} - Complementary items by category
 */
export async function findComplementaryItems(baseItemId, userId, context = {}) {
  try {
    // Get the base item
    const baseItem = await ClothingItem.findById(baseItemId);
    if (!baseItem) {
      throw new Error('Base item not found');
    }

    const baseCategory = baseItem.metadata.category;
    const baseColor = baseItem.metadata.color?.primary;
    const baseFormality = baseItem.metadata.formality;

    // Define complementary categories
    const complementaryCategories = {
      'top': ['bottom', 'outerwear', 'shoes', 'accessories'],
      'bottom': ['top', 'shoes', 'accessories'],
      'dress': ['shoes', 'accessories', 'outerwear'],
      'outerwear': ['top', 'bottom', 'shoes'],
      'shoes': ['top', 'bottom', 'dress', 'accessories'],
      'accessories': ['top', 'bottom', 'dress', 'shoes']
    };

    const targetCategories = complementaryCategories[baseCategory] || ['top', 'bottom', 'shoes'];

    const results = {};

    // Find complementary items for each category
    for (const category of targetCategories) {
      const filters = {
        category,
        formality: baseFormality,
        season: context.season || baseItem.metadata.season
      };

      // Use base item's embedding to find similar items in complementary categories
      const similarItems = await findSimilarItems(
        baseItem.vectorEmbedding,
        userId,
        filters,
        3
      );

      results[category] = similarItems;
    }

    return results;
  } catch (error) {
    console.error('Error finding complementary items:', error);
    throw error;
  }
}

/**
 * Get outfit recommendations based on context
 * @param {string} userId - User ID
 * @param {Object} context - Context (occasion, weather, season, etc.)
 * @param {Array} excludeIds - Array of clothing item IDs to exclude (e.g., from laundry)
 * @returns {Object} - Outfit recommendations
 */
export async function getOutfitRecommendations(userId, context = {}, excludeIds = []) {
  try {
    const { occasion, weather, season, formality } = context;

    // Build query text based on context
    let queryText = '';
    if (occasion) queryText += `for ${occasion} `;
    if (weather) queryText += `in ${weather} weather `;
    if (season) queryText += `for ${season} `;
    if (formality) queryText += `with ${formality} style `;

    if (!queryText.trim()) {
      queryText = 'stylish outfit';
    }

    // Add exclusion filter to context
    const filters = { ...context };
    if (excludeIds.length > 0) {
      filters.excludeIds = excludeIds;
    }

    // Find similar items (excluding laundry items)
    const similarItems = await findSimilarItemsByText(queryText, userId, filters, 20);

    // Group items by category
    const itemsByCategory = {};
    similarItems.forEach(item => {
      const category = item.metadata.category;
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    });

    return {
      queryText,
      totalItems: similarItems.length,
      itemsByCategory,
      topItems: similarItems.slice(0, 10),
      excludedCount: excludeIds.length
    };
  } catch (error) {
    console.error('Error getting outfit recommendations:', error);
    throw error;
  }
}
