import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Export models for easy access
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
export const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Test connection
export const testGeminiConnection = async () => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    const result = await geminiModel.generateContent("Hello, this is a test.");
    console.log('✅ Gemini connection successful');
    return { success: true, message: 'Gemini connected successfully' };
  } catch (error) {
    console.error('❌ Gemini connection failed:', error.message);
    return { success: false, error: error.message };
  }
};
