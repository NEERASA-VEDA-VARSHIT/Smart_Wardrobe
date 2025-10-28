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

      // Use faster model with stricter config
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 150, // Further reduced
          topP: 0.5,
          topK: 5,
          candidateCount: 1,
        }
      });
      
      // Convert buffer to base64 (resize image for faster processing)
      const base64Image = imageBuffer.toString('base64');
      
      // Log image size for debugging
      console.log(`Image size for Gemini: ${Math.round(base64Image.length / 1024)}KB`);
      
      // If image is too large, compress it further for Gemini
      let processedImage = base64Image;
      if (base64Image.length > 500000) { // If larger than ~500KB
        console.log('Image too large for Gemini, compressing further...');
        const sharp = await import('sharp');
        const compressedBuffer = await sharp.default(imageBuffer)
          .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 60 })
          .toBuffer();
        processedImage = compressedBuffer.toString('base64');
        console.log(`Compressed for Gemini: ${Math.round(processedImage.length / 1024)}KB`);
      }
      
      const prompt = `Analyze clothing image. Return ONLY valid JSON:
      {
        "category": "top|bottom|dress|outerwear|shoes|accessories",
        "subcategory": "specific type",
        "color": {"primary": "main color"},
        "fabric": "material",
        "brand": "brand if visible",
        "size": "size if visible", 
        "pattern": "solid|striped|floral|other",
        "season": "spring|summer|fall|winter|all-season",
        "formality": "casual|business|formal",
        "occasion": ["casual", "work", "party"],
        "tags": ["descriptive"],
        "description": "brief"
      }
      No markdown, no extra text, just JSON.`;

      // Add timeout wrapper for Gemini API call
      const geminiTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout')), 20000); // 20 second timeout
      });

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

      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini raw response:', text.substring(0, 200) + '...');
      
      // Extract JSON from markdown code blocks if present
      let jsonText = text;
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1];
      } else {
        // Try to find JSON object in the text
        const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonText = jsonObjectMatch[0];
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
