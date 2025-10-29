import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Export models for easy access - using flash lite model for speed
export const geminiModel = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.1, // Lower temperature for more consistent results
    maxOutputTokens: 200, // Further reduced for faster processing
    topP: 0.6, // Further reduce randomness
    topK: 8, // Further limit vocabulary
    candidateCount: 1, // Only generate one response
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_NONE"
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH", 
      threshold: "BLOCK_NONE"
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_NONE"
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_NONE"
    }
  ]
});
export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Robust JSON extractor for Gemini responses (handles code fences, stray text, CRLF)
const extractJsonObject = (rawText) => {
  if (!rawText) throw new Error('Empty response');
  let text = String(rawText).trim();
  
  // Remove ```json ... ``` or ``` ... ``` blocks
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) text = fence[1].trim();
  
  // Remove all backticks
  text = text.replace(/```/g, '').trim();
  
  // Remove markdown code indicators
  text = text.replace(/^json\s*/i, '').trim();
  
  // Try to isolate the first JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  
  // Aggressive JSON cleanup
  // Remove trailing commas before } or ]
  text = text.replace(/,(\s*[}\]])/g, '$1');
  // Remove trailing commas after string values before ]
  text = text.replace(/("(?:[^"\\]|\\.)*")\s*,\s*(\])/g, '$1$2');
  // Fix unclosed strings in arrays
  text = text.replace(/,(\s*"[^"]*$)/gm, '');
  // Remove incomplete array elements
  text = text.replace(/,\s*"[^"]*"[^"]*"\s*\]/g, ']');
  // Fix double commas
  text = text.replace(/,\s*,/g, ',');
  // Remove commas after last array element
  text = text.replace(/,\s*(\])/g, '$1');
  // Remove commas before closing braces in objects
  text = text.replace(/,\s*(\})/g, '$1');
  
  // Ensure ends with }
  if (!text.trim().endsWith('}')) {
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) text = text.slice(0, lastBrace + 1);
  }
  
  // Try parsing with error recovery
  try {
    return JSON.parse(text);
  } catch (parseError) {
    console.error('JSON parse error, attempting repair...', parseError.message);
    console.error('Problematic text snippet:', text.substring(Math.max(0, parseError.message.match(/position (\d+)/)?.[1] - 50 || 0), 100));
    
    // Additional repair attempts
    // Try to fix incomplete arrays
    text = text.replace(/\[\s*("[^"]*")\s*,\s*$/, '[$1]');
    // Remove malformed items array entries
    text = text.replace(/("items"\s*:\s*\[[^\]]*),("[^"]*"),?\s*\]/g, '$1$2]');
    
    try {
      return JSON.parse(text);
    } catch (secondError) {
      // Last resort: try to extract a minimal valid structure
      const outfitsMatch = text.match(/"outfits"\s*:\s*\[([^\]]*)\]/);
      if (outfitsMatch) {
        const outfits = outfitsMatch[1].split(/},\s*\{/).map((o, i) => {
          const titleMatch = o.match(/"title"\s*:\s*"([^"]*)"/);
          const itemsMatch = o.match(/"items"\s*:\s*\[([^\]]*)\]/);
          const reasoningMatch = o.match(/"reasoning"\s*:\s*"([^"]*)"/);
          return {
            title: titleMatch ? titleMatch[1] : `Outfit ${i + 1}`,
            items: itemsMatch ? itemsMatch[1].match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || [] : [],
            reasoning: reasoningMatch ? reasoningMatch[1] : 'AI-generated outfit recommendation'
          };
        }).filter(o => o.items.length > 0);
        
        if (outfits.length > 0) {
          return { summary: 'AI outfit recommendations', outfits };
        }
      }
      throw parseError; // Re-throw original error if all fails
    }
  }
};

/**
 * Generate clothing metadata from image using Gemini Vision
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Object} Generated metadata
 */
export const generateClothingMetadata = async (imageBuffer, mimeType) => {
  const maxRetries = 1; // Reduced to 1 retry for faster failure
  const retryDelay = 500; // 500ms delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      console.log(`Gemini API attempt ${attempt}/${maxRetries}`);

      // Use optimized model for better accuracy
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.1, // Lower temperature for more consistent results
          maxOutputTokens: 500, // More tokens for detailed analysis
          topP: 0.8,
          topK: 20,
          candidateCount: 1,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }
        ]
      });
      
      // Convert buffer to base64 (resize image for faster processing)
      const base64Image = imageBuffer.toString('base64');
      
      // Log image size for debugging
      console.log(`Image size for Gemini: ${Math.round(base64Image.length / 1024)}KB`);
      console.log(`Base64 starts with: ${base64Image.substring(0, 50)}...`);
      
      // Optimize image for Gemini analysis (balance between size and accuracy)
      let processedImage = base64Image;
      if (base64Image.length > 2000000) { // If larger than ~2MB
        console.log('Image too large for Gemini, optimizing for analysis...');
        const sharp = await import('sharp');
        const compressedBuffer = await sharp.default(imageBuffer)
          .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 }) // Higher quality for better accuracy
          .toBuffer();
        processedImage = compressedBuffer.toString('base64');
        console.log(`Optimized for Gemini: ${Math.round(processedImage.length / 1024)}KB`);
        console.log(`Optimized base64 starts with: ${processedImage.substring(0, 50)}...`);
      }
      
      const prompt = `Analyze this clothing image and return a JSON object with these exact fields:

{
  "category": "top",
  "subcategory": "t-shirt",
  "color": {"primary": "blue"},
  "fabric": "cotton",
  "brand": null,
  "size": null,
  "pattern": "solid",
  "season": "all-season",
  "formality": "casual",
  "occasion": ["casual"],
  "tags": ["comfortable", "everyday"],
  "description": "A casual blue t-shirt"
}

Return only the JSON object, no other text.`;

      // Add timeout wrapper for Gemini API call (increased to 30 seconds)
      const geminiTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout')), 30000); // 30 second timeout
      });

      console.log('Sending request to Gemini with processed image size:', Math.round(processedImage.length / 1024), 'KB');
      
      const result = await Promise.race([
        model.generateContent([
          prompt,
          {
            inlineData: {
              data: processedImage,
              mimeType: mimeType
            }
          }
        ]),
        geminiTimeout
      ]);

      console.log('Gemini API call completed successfully');

      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response length:', text.length);
      console.log('Gemini raw response:', text);
      
      // Check if response is empty
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      // Extract JSON from markdown code blocks if present
      let jsonText = text.trim();
      
      // Remove markdown code blocks
      const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1].trim();
      } else {
        // Try to find JSON object in the text
        const jsonObjectMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
        }
      }
      
      // If we still don't have valid JSON, try to extract from the beginning
      if (!jsonText.startsWith('{')) {
        const startIndex = jsonText.indexOf('{');
        if (startIndex !== -1) {
          jsonText = jsonText.substring(startIndex);
        }
      }
      
      // Clean up incomplete JSON more aggressively
      jsonText = jsonText.replace(/,\s*"[^"]*$/, ''); // Remove incomplete property at end
      jsonText = jsonText.replace(/,\s*"[^"]*"[^"]*$/, ''); // Remove incomplete property with quotes
      jsonText = jsonText.replace(/,\s*$/, ''); // Remove trailing comma
      jsonText = jsonText.replace(/,\s*"[^"]*":\s*"[^"]*$/, ''); // Remove incomplete key-value pair
      
      // Ensure JSON is properly closed
      if (!jsonText.trim().endsWith('}')) {
        jsonText = jsonText.trim() + '}';
      }
      
      console.log('Cleaned JSON text:', jsonText.substring(0, 200) + '...');
      
      // Validate that we have actual JSON content
      if (jsonText.length < 10 || jsonText === '{}' || jsonText === '}') {
        throw new Error('Invalid or empty JSON response from Gemini');
      }
      
      // Parse JSON response
      let metadata;
      try {
        metadata = JSON.parse(jsonText);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw text:', text);
        console.error('Extracted JSON text:', jsonText);
        
        // Try to create a fallback metadata object
        console.log('Creating fallback metadata due to parsing error');
        
        // Try to extract what we can from the partial JSON
        let partialMetadata = {};
        try {
          // Extract basic info from the raw text
          const categoryMatch = text.match(/"category":\s*"([^"]+)"/);
          const colorMatch = text.match(/"primary":\s*"([^"]+)"/);
          const fabricMatch = text.match(/"fabric":\s*"([^"]+)"/);
          const patternMatch = text.match(/"pattern":\s*"([^"]+)"/);
          
          partialMetadata = {
            category: categoryMatch ? categoryMatch[1] : "other",
            subcategory: "unknown",
            color: { primary: colorMatch ? colorMatch[1] : "unknown" },
            fabric: fabricMatch ? fabricMatch[1] : "unknown",
            brand: null,
            size: null,
            pattern: patternMatch ? patternMatch[1] : "solid",
            season: "all-season",
            formality: "casual",
            occasion: ["casual"],
            tags: ["unknown"],
            description: "Unable to fully analyze image"
          };
        } catch (extractError) {
          // If extraction fails, use default fallback
          partialMetadata = {
            category: "other",
            subcategory: "unknown",
            color: { primary: "unknown" },
            fabric: "unknown",
            brand: null,
            size: null,
            pattern: "solid",
            season: "all-season",
            formality: "casual",
            occasion: ["casual"],
            tags: ["unknown"],
            description: "Unable to analyze image"
          };
        }
        
        metadata = partialMetadata;
      }
      
      console.log(`✅ Gemini API successful on attempt ${attempt}`);
      return {
        success: true,
        metadata: {
          ...metadata,
          metadataSource: 'gemini'
        }
      };

    } catch (error) {
      console.error(`Gemini API attempt ${attempt} failed:`, error.message);
      
      // Check if it's a network error that we should retry
      if (error.message.includes('fetch failed') || 
          error.message.includes('ENOTFOUND') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('timeout')) {
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying Gemini API in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // If it's not a retryable error or we've exhausted retries
      console.error('Error generating clothing metadata:', error);
      return {
        success: false,
        error: error.message,
        metadata: null
      };
    }
  }
  
  // If we get here, all retries failed
  return {
    success: false,
    error: 'All retry attempts failed',
    metadata: null
  };
};

/**
 * Generate a text description from metadata
 * @param {Object} metadata - Clothing metadata
 * @returns {string} Generated description
 */
export const generateDescription = (metadata) => {
  const {
    category,
    subcategory,
    color,
    fabric,
    brand,
    pattern,
    season,
    formality,
    occasion
  } = metadata;

  let description = '';
  
  // Color and pattern
  if (color?.primary) {
    description += color.primary;
    if (color?.secondary) {
      description += ` and ${color.secondary}`;
    }
    description += ' ';
  }
  
  // Pattern
  if (pattern && pattern !== 'solid') {
    description += `${pattern} `;
  }
  
  // Fabric
  if (fabric) {
    description += `${fabric} `;
  }
  
  // Category and subcategory
  if (subcategory) {
    description += subcategory;
  } else if (category) {
    description += category;
  }
  
  // Brand
  if (brand) {
    description += ` by ${brand}`;
  }
  
  // Occasion and formality
  if (occasion && occasion.length > 0) {
    description += `, perfect for ${occasion.join(', ')}`;
  }
  
  if (formality) {
    description += ` (${formality})`;
  }
  
  // Season
  if (season) {
    description += `, ideal for ${season}`;
  }
  
  return description.trim();
};

/**
 * Generate text embedding using Gemini Embedding API
 * @param {string} text - Text to embed
 * @returns {Object} Embedding result
 */
export const generateTextEmbedding = async (text) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    // Clean and prepare text
    const cleanText = text.trim().substring(0, 8000); // Limit to 8000 chars
    
    const result = await embeddingModel.embedContent(cleanText);
    const embedding = result.embedding.values;

    return {
      success: true,
      embedding: embedding,
      model: 'text-embedding-004',
      usage: {
        total_tokens: cleanText.length
      }
    };
  } catch (error) {
    console.error('Error generating text embedding:', error);
    return {
      success: false,
      error: error.message,
      embedding: null
    };
  }
};

/**
 * Generate embedding from clothing metadata
 * @param {Object} metadata - Clothing metadata
 * @returns {Object} Embedding result
 */
export const generateClothingEmbedding = async (metadata) => {
  try {
    // Create a comprehensive text description for embedding
    const textDescription = createEmbeddingText(metadata);
    
    return await generateTextEmbedding(textDescription);
  } catch (error) {
    console.error('Error generating clothing embedding:', error);
    return {
      success: false,
      error: error.message,
      embedding: null
    };
  }
};

/**
 * Create a comprehensive text description for embedding
 * @param {Object} metadata - Clothing metadata
 * @returns {string} Text description
 */
const createEmbeddingText = (metadata) => {
  const parts = [];
  
  // Basic info
  if (metadata.category) parts.push(metadata.category);
  if (metadata.subcategory) parts.push(metadata.subcategory);
  
  // Colors
  if (metadata.color?.primary) {
    parts.push(metadata.color.primary);
    if (metadata.color?.secondary) {
      parts.push(metadata.color.secondary);
    }
  }
  
  // Fabric and material
  if (metadata.fabric) parts.push(metadata.fabric);
  
  // Brand
  if (metadata.brand) parts.push(metadata.brand);
  
  // Pattern
  if (metadata.pattern && metadata.pattern !== 'solid') {
    parts.push(metadata.pattern);
  }
  
  // Season
  if (metadata.season) parts.push(metadata.season);
  
  // Formality
  if (metadata.formality) parts.push(metadata.formality);
  
  // Occasions
  if (metadata.occasion && metadata.occasion.length > 0) {
    parts.push(...metadata.occasion);
  }
  
  // Tags
  if (metadata.tags && metadata.tags.length > 0) {
    parts.push(...metadata.tags);
  }
  
  // Description
  if (metadata.description) {
    parts.push(metadata.description);
  }
  
  return parts.join(' ').toLowerCase();
};

/**
 * Generate outfit recommendations using Gemini AI
 * @param {string} prompt - The outfit generation prompt
 * @returns {Object} Outfit generation result
 */
export const generateOutfitRecommendation = async (prompt) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      recommendation: text,
      model: 'gemini-2.5-flash-lite'
    };
  } catch (error) {
    console.error('Error generating outfit recommendation:', error);
    return {
      success: false,
      error: error.message,
      recommendation: null
    };
  }
};

/**
 * Generate 2-5 outfit sets from provided items using constraints
 * @param {Array} items - Array of items with {id,_id,metadata:{category,subcategory,color,formality,season,occasion}, imageUrl}
 * @param {Object} context - {weather, temperature, occasion, timeOfDay}
 */
export const generateOutfitSets = async (items, context = {}) => {
  try {
    const compactItems = items.map(it => ({
      id: it._id?.toString?.() || it.id,
      type: it.metadata?.subcategory || it.metadata?.category || 'item',
      category: it.metadata?.category,
      color: it.metadata?.color?.primary,
      season: it.metadata?.season,
      formality: it.metadata?.formality,
      occasion: it.metadata?.occasion,
    }));

    if (!compactItems || compactItems.length === 0) {
      throw new Error('No items provided for outfit generation');
    }

    // Pre-call diagnostic logging (do not log full prompt to avoid noise)
    console.log('[OutfitSets] items:', compactItems.length, 'context:', {
      occasion: context.occasion, timeOfDay: context.timeOfDay, weather: context.weather, temperature: context.temperature
    });
    console.log('[OutfitSets] sample item ids:', compactItems.slice(0, 5).map(i => i.id));

    const prompt = `You are a professional stylist. Your task is to create MULTIPLE outfit combinations from the user's wardrobe.

REQUIREMENTS:
- You MUST generate AT LEAST 3 different outfit combinations (preferably 3-4 outfits)
- Each outfit must use DIFFERENT items from the wardrobe (vary the combinations)
- Each outfit should have: 1 top + 1 bottom + optional shoes/accessories
- Match weather: ${context.weather || 'moderate'} and temperature: ${context.temperature ?? 'moderate'}
- Occasion: ${context.occasion || 'casual'}; Time: ${context.timeOfDay || 'day'}
- Use ONLY the item IDs provided below - DO NOT make up IDs

Wardrobe Items (${compactItems.length} items available):
${JSON.stringify(compactItems).slice(0, 12000)}

CRITICAL: You MUST return 3-4 different outfits in the outfits array. Each outfit should use different item combinations to give variety.

Return ONLY valid JSON, no markdown, no code blocks, no extra text. Exact schema:
{
  "summary": "Brief overall recommendation (1-2 sentences)",
  "outfits": [
    {
      "title": "Outfit name (e.g., 'Casual Weekend', 'Smart Casual', 'Relaxed Style')",
      "items": ["item_id_1", "item_id_2", "item_id_3"],
      "reasoning": "Why this specific combination works (1-2 sentences)"
    },
    {
      "title": "Different outfit name",
      "items": ["item_id_4", "item_id_5"],
      "reasoning": "Why this combination works"
    },
    {
      "title": "Another different outfit name",
      "items": ["item_id_6", "item_id_7"],
      "reasoning": "Why this combination works"
    }
  ]
}

REMEMBER: You MUST generate at least 3 outfits in the array. Use different item combinations for variety.`;

    // Add timeout wrapper for Gemini API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000);
    });

    let result, text;
    try {
      console.log('[OutfitSets] prompt length:', prompt.length);
      const geminiPromise = geminiModel.generateContent(prompt);
      result = await Promise.race([geminiPromise, timeoutPromise]);
      text = (await result.response).text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      // Log raw response for debugging (first 500 chars)
      console.log('Gemini raw response (first 500 chars):', text.substring(0, 500));
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError.message);
      throw new Error(`AI service unavailable: ${apiError.message}`);
    }
    
    let data;
    try {
      data = extractJsonObject(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid response structure');
      if (!Array.isArray(data.outfits)) throw new Error('Outfits must be an array');
      if (data.outfits.length === 0) throw new Error('No outfits generated');
      
      // Validate we got at least 3 outfits
      if (data.outfits.length < 3 && compactItems.length >= 6) {
        console.warn(`Only got ${data.outfits.length} outfit(s), expected at least 3. Available items: ${compactItems.length}`);
        // Try to generate additional outfit variations from remaining items
        const usedItemIds = new Set();
        data.outfits.forEach(o => {
          (o.items || []).forEach(id => usedItemIds.add(String(id)));
        });
        
        const unusedItems = compactItems.filter(item => !usedItemIds.has(String(item.id)));
        if (unusedItems.length >= 4 && data.outfits.length < 3) {
          console.log(`Attempting to generate ${3 - data.outfits.length} additional outfit(s) from unused items`);
          // Add a simple outfit variation using unused items
          const topItems = unusedItems.filter(i => ['top', 'shirt', 't-shirt', 'tee', 'blouse'].some(c => 
            (i.type || i.category || '').toLowerCase().includes(c)
          ));
          const bottomItems = unusedItems.filter(i => ['bottom', 'pants', 'jeans', 'trouser', 'shorts'].some(c => 
            (i.type || i.category || '').toLowerCase().includes(c)
          ));
          
          while (data.outfits.length < 3 && topItems.length > 0 && bottomItems.length > 0) {
            const top = topItems.pop();
            const bottom = bottomItems.pop();
            if (top && bottom) {
              data.outfits.push({
                title: `Style Variation ${data.outfits.length + 1}`,
                items: [top.id, bottom.id],
                reasoning: `A fresh combination of ${top.type || top.category} and ${bottom.type || bottom.category} for ${context.occasion || 'casual'} occasions.`
              });
            }
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError.message);
      console.error('Full response length:', text.length);
      console.error('Response preview:', text.substring(0, 200));
      
      // Try to salvage at least one outfit from partial response
      const titleMatch = text.match(/"title"\s*:\s*"([^"]*)"/);
      const itemsMatch = text.match(/"items"\s*:\s*\[([^\]]*)\]/);
      
      if (titleMatch && itemsMatch) {
        const salvagedItems = itemsMatch[1].match(/"([^"]+)"/g)?.map(s => s.slice(1, -1)) || [];
        if (salvagedItems.length >= 2) {
          console.log('Salvaged partial outfit from malformed JSON');
          data = {
            summary: 'AI-generated outfit recommendation',
            outfits: [{
              title: titleMatch[1],
              items: salvagedItems,
              reasoning: 'AI-generated outfit combination'
            }]
          };
        } else {
          throw new Error(`Failed to parse AI response: ${parseError.message}`);
        }
      } else {
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    }
    
    return { success: true, data: { summary: data.summary || '', outfits: data.outfits } };
  } catch (error) {
    console.error('generateOutfitSets error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message || 'Unknown error in outfit generation' };
  }
};

/**
 * Generate 2–3 AI outfit suggestions (not limited to wardrobe)
 * Returns image_prompt and curated link suggestions per outfit
 */
export const generateAISuggestions = async (context = {}) => {
  try {
    const prompt = `You are a professional fashion stylist. Create between 2 and 3 complete outfit suggestions for the following context.

Context:
- Weather: ${context.weather || 'moderate'}
- Temperature: ${context.temperature ?? 'moderate'}
- Occasion: ${context.occasion || 'casual'}
- Time of Day: ${context.timeOfDay || 'day'}
- Style: ${context.style || 'modern minimal'}
- Region: ${context.region || 'India'}

REQUIREMENT: You MUST generate at least 2-3 different outfit suggestions. Each outfit should be unique.

For each outfit, return STRICT JSON with:
- title: short descriptive name (e.g., "Casual Weekend Look", "Smart Office Style")
- items: array of clothing piece names (top, bottom, shoes, optional outerwear/accessories)
- reasoning: brief explanation why it fits the weather/occasion (1-2 sentences)
- image_prompt: a detailed realistic flat-lay prompt for generating an image (describe colors, fabrics, style)
- curated: array of up to 3 shopping links with label and url

Return ONLY valid JSON, no markdown, no code blocks. Exact schema:
{
  "outfits": [
    {
      "title": "Outfit name",
      "items": ["Top name", "Bottom name", "Shoes name"],
      "reasoning": "Why this works",
      "image_prompt": "Detailed description for image generation",
      "curated": [
        {"label": "Store name", "url": "https://store.com/outfit"}
      ]
    },
    {
      "title": "Different outfit name",
      "items": ["Different top", "Different bottom", "Different shoes"],
      "reasoning": "Why this works",
      "image_prompt": "Detailed description",
      "curated": [
        {"label": "Store name", "url": "https://store.com/outfit"}
      ]
    }
  ]
}`;

    // Add timeout wrapper for Gemini API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout after 30 seconds')), 30000);
    });

    let result, text;
    try {
      const geminiPromise = geminiModel.generateContent(prompt);
      result = await Promise.race([geminiPromise, timeoutPromise]);
      text = (await result.response).text();
      
      if (!text || text.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }
      
      console.log('AI suggestions raw response (first 300 chars):', text.substring(0, 300));
    } catch (apiError) {
      console.error('Gemini API call failed:', apiError.message);
      throw new Error(`AI service unavailable: ${apiError.message}`);
    }

    let data;
    try {
      data = extractJsonObject(text);
      if (!data || typeof data !== 'object') throw new Error('Invalid response structure');
      if (!Array.isArray(data.outfits)) throw new Error('Outfits must be an array');
      if (data.outfits.length === 0) throw new Error('No outfits generated');
      
      // Ensure we have at least 2 outfits
      if (data.outfits.length < 2) {
        console.warn(`Only got ${data.outfits.length} outfit(s), expected at least 2`);
      }
    } catch (parseError) {
      console.error('Failed to parse AI suggestions response:', parseError.message);
      console.error('Response preview:', text.substring(0, 300));
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Best-effort curated links if missing
    const withLinks = data.outfits.slice(0, 3).map(o => ({
      title: o.title || 'AI Suggested Outfit',
      items: o.items || [],
      reasoning: o.reasoning || 'AI-generated outfit recommendation',
      image_prompt: o.image_prompt || `A ${context.occasion || 'casual'} outfit suitable for ${context.weather || 'moderate'} weather`,
      curated: (o.curated && Array.isArray(o.curated) && o.curated.length ? o.curated : [
        { label: 'Myntra - Similar Styles', url: 'https://www.myntra.com/men-clothing' },
        { label: 'AJIO - Shop the look', url: 'https://www.ajio.com/men' },
        { label: 'Amazon Fashion', url: 'https://www.amazon.in/s?k=men+outfit' }
      ])
    }));

    return { success: true, data: { outfits: withLinks } };
  } catch (error) {
    console.error('generateAISuggestions error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, error: error.message || 'Unknown error in AI suggestions generation' };
  }
};

 
