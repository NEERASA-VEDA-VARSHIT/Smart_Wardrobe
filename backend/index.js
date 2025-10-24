import express from "express";
import dotenv from "dotenv";
dotenv.config();
import { validateEnvironment } from "./utils/envValidation.js";
import { connectDB } from "./config/db.js";

// Validate environment variables before starting
validateEnvironment();
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import clothingItemRouter from "./routes/clothingItem.routes.js";
import collectionRouter from "./routes/collection.routes.js";
import metadataRouter from "./routes/metadata.routes.js";
import batchMetadataRouter from "./routes/batchMetadata.routes.js";
import recommendationRouter from "./routes/recommendation.routes.js";
import laundryRouter from "./routes/laundry.routes.js";
import laundrySuggestionRouter from "./routes/laundrySuggestion.routes.js";
import weatherRecommendationRouter from "./routes/weatherRecommendation.routes.js";
import collaborativeSuggestionRouter from "./routes/collaborativeSuggestion.routes.js";
import suggestionRouter from "./routes/suggestion.routes.js";
import performanceMonitor from "./middlewares/performanceMonitor.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8000;

// CORS configuration for production
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.NODE_ENV === 'production' 
            ? [
                'https://smart-wardrobe-five.vercel.app',
                'https://smart-wardrobe-frontend.vercel.app',
                'https://smart-wardrobe-eta.vercel.app',
                process.env.FRONTEND_URL, 
                process.env.ALLOWED_ORIGINS?.split(',')
              ].flat().filter(Boolean)
            : ['http://localhost:5173', 'http://localhost:3000'];
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma']
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Additional CORS headers for all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [
          'https://smart-wardrobe-five.vercel.app',
          'https://smart-wardrobe-frontend.vercel.app',
          'https://smart-wardrobe-eta.vercel.app',
          process.env.FRONTEND_URL, 
          process.env.ALLOWED_ORIGINS?.split(',')
        ].flat().filter(Boolean)
      : ['http://localhost:5173', 'http://localhost:3000'];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
  } else {
    next();
  }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Add performance monitoring
app.use(performanceMonitor);

// Debug middleware to log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

// Auth routes
app.use("/api/auth", authRouter);

// User routes
app.use("/api/users", userRouter);

// Clothing Item routes
app.use("/api/clothing-items", clothingItemRouter);

// Collection routes
app.use("/api/collections", collectionRouter);

// Metadata routes
app.use("/api/metadata", metadataRouter);

// Batch metadata routes
app.use("/api/batch-metadata", batchMetadataRouter);

// Recommendation routes
app.use("/api/recommendations", recommendationRouter);

// Laundry routes
app.use("/api/laundry", laundryRouter);

// Laundry suggestion routes
app.use("/api/laundry-suggestions", laundrySuggestionRouter);

// Weather recommendation routes
app.use("/api/weather-recommendations", weatherRecommendationRouter);

// Collaborative suggestion routes
app.use("/api/suggestions", collaborativeSuggestionRouter);

// Outfit suggestion routes
app.use("/api/outfit-suggestions", suggestionRouter);

connectDB(process.env.MONGODB_URI);


app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        message: "Smart Wardrobe API is running"
    });
});

// Cloudinary connectivity test endpoint
app.get("/api/test-cloudinary", async (req, res) => {
    try {
        const { cloudinary } = await import('./config/cloudinary.js');
        const result = await cloudinary.api.ping();
        res.json({
            status: "ok",
            cloudinary: "connected",
            result: result
        });
    } catch (error) {
        console.error('Cloudinary test failed:', error);
        res.status(500).json({
            status: "error",
            cloudinary: "failed",
            error: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
});

// For Vercel deployment
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}