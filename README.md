# Smart Wardrobe - AI-Powered Fashion Assistant

A full-stack web application that uses AI to help users manage their wardrobe, get outfit recommendations, and track laundry. Built with React, Node.js, MongoDB, and integrated with Gemini AI and Cloudinary.

## 🚀 Features

### Core Functionality
- **AI-Powered Clothing Recognition**: Upload clothing items with automatic metadata generation using Gemini AI
- **Smart Outfit Recommendations**: Get weather-based and occasion-specific outfit suggestions
- **Wardrobe Management**: Organize and categorize your clothing items
- **Collection Sharing**: Create and share clothing collections with friends
- **Laundry Tracking**: Track when items were last washed
- **Collaborative Styling**: Get suggestions from friends and family

### Technical Features
- **Multiple Image Upload**: Upload up to 20 clothing items at once
- **Image Compression**: Automatic image optimization with Sharp
- **Rate Limiting**: Intelligent API rate limiting for better performance
- **Real-time Updates**: Live data updates with Redux state management
- **Responsive Design**: Modern UI with Tailwind CSS and Framer Motion
- **Authentication**: Secure JWT-based authentication with HTTP-only cookies

## 🛠️ Tech Stack

### Frontend
- **React 18** with Vite
- **Redux Toolkit** for state management
- **Redux Persist** for data persistence
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Axios** for API calls

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **JWT** for authentication
- **Multer** for file uploads
- **Sharp** for image compression
- **Cloudinary** for image storage
- **Google Gemini AI** for metadata generation

### External Services
- **Google Gemini AI** - Clothing metadata generation
- **Cloudinary** - Image storage and optimization
- **OpenWeather API** - Weather data for outfit recommendations

## 📁 Project Structure

```
Smart_Wardrobe/
├── backend/                 # Node.js backend
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middlewares/       # Custom middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── services/         # External service integrations
│   └── utils/            # Utility functions
├── frontend/              # React frontend
│   ├── src/
│   │   ├── api/          # API integration
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── pages/        # Page components
│   │   ├── redux/        # Redux store and slices
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
└── backup/               # Legacy code backup
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Google AI Studio API key
- OpenWeather API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NEERASA-VEDA-VARSHIT/Smart_Wardrobe.git
   cd Smart_Wardrobe
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in the backend directory:
   ```env
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   OPENWEATHER_API_KEY=your_openweather_api_key
   ```

5. **Run the application**
   
   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## 📱 Usage

### Adding Clothing Items
1. Navigate to "Add Clothing" from the bottom navigation
2. Upload single or multiple images (up to 20)
3. AI automatically generates metadata (category, color, fabric, etc.)
4. Review and edit metadata if needed
5. Save to your wardrobe

### Getting Outfit Recommendations
1. Go to Dashboard to see weather-based recommendations
2. Use the Stylist page for manual outfit creation
3. Get AI-powered suggestions based on your wardrobe

### Managing Collections
1. Create collections for different occasions or seasons
2. Add clothing items to collections
3. Share collections with friends via username or public links
4. Collaborate on styling decisions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Clothing Items
- `GET /api/clothing` - Get user's clothing items
- `POST /api/clothing` - Add new clothing item
- `PUT /api/clothing/:id` - Update clothing item
- `DELETE /api/clothing/:id` - Delete clothing item

### Collections
- `GET /api/collections` - Get user's collections
- `POST /api/collections` - Create new collection
- `GET /api/collections/:id` - Get specific collection
- `PATCH /api/collections/:id/add-item` - Add item to collection
- `PATCH /api/collections/:id/remove-item` - Remove item from collection

### Metadata Generation
- `POST /api/metadata/generate` - Generate metadata for single image
- `POST /api/batch-metadata/generate` - Generate metadata for multiple images

### Recommendations (AI Stylist)
- `POST /api/recommendations/outfit/:userId` - Legacy single recommendation + reasoning
- `POST /api/recommendations/outfits/:userId` - Generate 2–4 visual outfits from wardrobe (Gemini-driven)
- `POST /api/recommendations/hybrid/:userId` - Mix My Wardrobe + AI suggestions
- `POST /api/recommendations/ai-suggestions` - AI-only suggestions with `image_prompt` + curated shopping links
- `POST /api/recommendations/outfits/:userId/accept` - Mark items in an outfit as worn

Notes:
- Outfits are generated by Gemini using up to 15 of your recent wardrobe items as context (RAG).
- We aggressively sanitize LLM JSON and add fallbacks if the model returns malformed JSON.
- If Gemini returns fewer than 3 outfits, the backend synthesizes additional top+bottom combos from available items.

## 🎨 Key Features Explained

### AI-Powered Metadata Generation
- Uses Google Gemini AI to analyze clothing images
- Generates detailed metadata including category, color, fabric, brand, etc.
- Supports batch processing for multiple images
- Includes retry logic for network reliability

### Smart Image Processing
- Automatic image compression using Sharp
- Cloudinary integration for optimized storage
- Support for multiple image formats
- Batch upload processing with progress tracking

### Rate Limiting & Performance
### Wardrobe (Digital Closet)
- Category-based grid (Tops, Bottoms, Outerwear, Footwear, Accessories)
- Rich item cards: image, color badge, subcategory, fabric, season, formality, occasion, wear stats
- Filters: search, category, color, season, formality, weather, cleanliness status
- Actions: View Details modal, Mark as Worn, batch actions (collections, laundry)

### Recommendation Modes (on Recommendations page)
- 👕 My Wardrobe: 2–4 outfits using your items only (Gemini picks the combos)
- 🤖 AI Suggestions: 2–3 outfits with `image_prompt` + curated links (shopping inspiration)
- ⚡ Mix Both: combines your items with AI suggestions

### Outfit Cards
- Visual card with Top + Bottom (and optional layers) side-by-side
- Shows title, match score, occasion, weather, reasoning, style tips
- Actions: View Details, Regenerate, Mark as Worn

### Background Processing (Uploads)
- Client-direct Cloudinary uploads for batches; backend processes metadata from URLs
- Background job endpoints allow the user to continue using the app during processing

## ⚙️ Configuration

### Backend `.env`
Mandatory:
- `PORT=8000`
- `MONGODB_URI=`
- `JWT_SECRET=`
- `CLOUDINARY_CLOUD_NAME=`, `CLOUDINARY_API_KEY=`, `CLOUDINARY_API_SECRET=`
- `GEMINI_API_KEY=`
- `OPENWEATHER_API_KEY=`
- `ALLOWED_ORIGINS=` (comma-separated; e.g. `http://localhost:5173,https://smart-wardrobe-five.vercel.app`)

Production hardening:
- CORS allow-list aligned with your frontend URL(s)
- `trust proxy` enabled only in production

### Frontend `.env`
- `VITE_API_URL` (optional; defaults to local dev or deployed backend URL)

## 🧪 Local Development
1) Start backend: `cd backend && npm run dev`
2) Start frontend: `cd frontend && npm run dev`
3) Visit `http://localhost:5173`

## 🚀 Deployment
- Backend: Vercel/Serverless supported. Ensure body size/timeouts are adequate. Client-direct uploads recommended for images.
- Frontend: Vercel/Netlify. Set `VITE_API_URL` to backend URL.
- Cloudinary: Verify credentials; increase SDK timeout to 60s for stability.

## 🧰 Troubleshooting

### 401 No token / Authorization denied
- Ensure HTTP-only cookie auth is set. Verify `/api/auth/me` works. Cookie `sameSite` is `none` in production; CORS must allow credentials.

### 404 Not Found (collections, background routes)
- Confirm frontend uses `API_BASE_URL`. Avoid hardcoded `localhost` in production.

### 502 Bad Gateway on recommendations
- Gemini may return malformed JSON or time out. We sanitize JSON, add a 30s timeout, and synthesize extra outfits if needed. Check backend logs for:
  - `Gemini raw response` preview
  - `Processing X outfit(s) from Gemini`
  - Matching diagnostics (`✓ Matched`, `FAILED to match`)

### Cloudinary upload hangs / timeouts
- Use direct `cloudinary.uploader.upload` with base64 + 60s SDK timeout. Ping Cloudinary before upload. Prefer client-direct uploads for batches.

### 413 Content Too Large
- Body parser limits increased (`50mb` JSON, `8-10mb` per file via Multer). For batch, use client-direct upload then send URLs.

### CORS errors
- Verify `ALLOWED_ORIGINS` and backend CORS `origin` function. In production, set exact frontend URL(s) and `credentials: true`.

### Rate limiting / trust proxy warnings
- Only enable `app.set('trust proxy', 1)` in production. Use default IP detection.

### Only one outfit returns
- Model may return a single outfit. Backend now:
  - Prompts for 3–4 outfits explicitly
  - Repairs malformed JSON
  - Generates extra outfits from available tops/bottoms if needed
  - Logs matching diagnostics to help identify ID mismatches

## 🧭 Key Flows

1) Add Clothing → Uploads to Cloudinary → Gemini generates metadata → Item saved → Appears in Wardrobe
2) Wardrobe → Filter → “Send to AI” → Recommendations page pre-filled → Generate 2–4 outfit cards
3) Accept Outfit → Marks items worn → Updates wear counters and cleanliness

## 🧱 Architecture

### High-level
- Frontend (React/Vite) communicates with Backend (Express) via REST over HTTPS
- MongoDB stores users, clothing items, collections, suggestions, and recommendation history
- Cloudinary stores images; references to URLs are saved in MongoDB
- Gemini (Google Generative AI) generates metadata and outfit combinations
- OpenWeather provides current weather, which informs the recommendation context

```
Frontend (React/Vite) → API Gateway (Express) → Services (Gemini/Cloudinary/OpenWeather)
                               ↓
                           MongoDB
```

### Backend layers
- Routes: define HTTP endpoints, handle validation
- Controllers: orchestrate requests, call services/models
- Models: Mongoose schemas and domain logic
- Middlewares: auth, rate limiting, multer, CORS
- Services: Cloudinary, Gemini, Weather, Cache
- Utils: image compression, JSON repair, env validation

## 🧬 Data Models (simplified)

### User
```json
{
  "_id": "68e3a7...",
  "name": "Veda Varshit",
  "email": "user@example.com",
  "username": "veda",
  "preferences": {
    "style": "casual",
    "weatherPreference": "moderate",
    "colors": { "prefer": ["blue"], "avoid": ["neon"] }
  },
  "totalItems": 42,
  "totalCollections": 7,
  "totalOutfits": 15,
  "createdAt": "2025-10-01T00:00:00.000Z"
}
```

### ClothingItem
```json
{
  "_id": "64ab...",
  "userId": "68e3a7...",
  "name": "Casual blue denim jeans",
  "imageUrl": "https://res.cloudinary.com/.../jeans.jpg",
  "metadata": {
    "category": "bottom",
    "subcategory": "jeans",
    "color": { "primary": "blue" },
    "pattern": "plain",
    "fabric": "denim",
    "season": "all-season",
    "formality": "casual",
    "occasion": ["casual", "weekend"],
    "description": "A comfortable pair of blue jeans"
  },
  "wearCount": 5,
  "lastWorn": "2025-10-21T00:00:00.000Z",
  "cleanlinessStatus": "fresh",
  "createdAt": "2025-09-10T00:00:00.000Z"
}
```

### OutfitRecommendation (history)
```json
{
  "_id": "rec_123",
  "userId": "68e3a7...",
  "recommendedItems": ["64ab...top", "64ab...bottom"],
  "reasoning": "Light breathable fabrics for warm weather",
  "context": { "weather": "warm", "occasion": "casual" },
  "isWorn": false,
  "createdAt": "2025-10-22T12:00:00.000Z"
}
```

## 🔌 API Reference (Detailed)

### Auth
- POST `/api/auth/signup` { name, email, password }
- POST `/api/auth/signin` { email, password }
- POST `/api/auth/logout`
- GET `/api/auth/me` (cookie)

### Wardrobe
- GET `/api/clothing-items/user/:userId` → list items
- POST `/api/clothing-items` → add item (server-upload or via URL in batch mode)
- PUT `/api/clothing-items/:id`
- DELETE `/api/clothing-items/:id`

### Uploads & Background
- POST `/api/uploads/signature` → Cloudinary signed params
- POST `/api/background/upload-and-process` → run batch in background
- GET `/api/background/status/:processingId`

### Metadata
- POST `/api/metadata/generate` → single file
- POST `/api/batch-metadata/generate-from-urls` → [{ imageUrl, publicId, fileName }]

### Recommendations
- POST `/api/recommendations/outfit/:userId` → text reasoning + suggestions
- POST `/api/recommendations/outfits/:userId` → 2–4 outfits (Gemini over wardrobe)
- POST `/api/recommendations/ai-suggestions` → AI-only outfits (with `image_prompt`, curated links)
- POST `/api/recommendations/hybrid/:userId` → wardrobe + AI
- POST `/api/recommendations/outfits/:userId/accept` → wear count + last worn update

Request example:
```http
POST /api/recommendations/outfits/68e3a7...
Content-Type: application/json

{
  "occasion": "casual",
  "timeOfDay": "day",
  "weather": "moderate",
  "temperature": 28
}
```

Response example:
```json
{
  "success": true,
  "data": {
    "summary": "Comfortable summer-ready looks",
    "outfits": [
      {
        "title": "Classic Casual",
        "match_score": 90,
        "occasion": "casual",
        "weather": "moderate",
        "style_tips": "Consider adding a belt or simple accessories to complete the look.",
        "reasoning": "Breathable cotton top with light jeans",
        "items": [
          { "id": "64ab...top", "imageUrl": "...", "metadata": { "category": "top" } },
          { "id": "64ab...bottom", "imageUrl": "...", "metadata": { "category": "bottom" } }
        ]
      }
    ],
    "source": "gemini",
    "totalCandidates": 12
  }
}
```

## 🔐 Security
- JWT in HTTP-only cookies; no tokens in localStorage
- CORS strict allow-list for production
- Rate limiting on sensitive endpoints (recommendations, metadata)
- Trust proxy enabled only in production
- Never log secrets; redact Cloudinary/Gemini keys

## ⚡ Performance & Reliability
- Image compression with Sharp + Cloudinary transformations (client-direct recommended)
- JSON body limits at 50MB; Multer limits 8–10MB per file
- Aggressive JSON repair and timeouts for LLM output
- Batch processing with concurrency control (and backoff/retry)
- Cache layer for repeated recommendation inputs (optional)

## 🧾 Logging & Observability
- Request timing logs with slow request warnings
- Cloudinary connectivity ping before upload
- Gemini raw response preview (first 300–500 chars)
- Outfit matching diagnostics (ID match success/fail)
- Rate limiter skip logs for health/test endpoints

## 🧪 Testing Strategy (suggested)
- Unit tests for utils (JSON repair, compression settings)
- Service tests for Gemini prompt builders and parsers
- Integration tests for recommendation flows (mocked Gemini)
- E2E tests: wardrobe → recommendations → accept

## 🛡️ Error Handling Patterns
- Return `success: true` with empty data instead of 5xx for LLM failures when possible (to keep UI responsive)
- Provide `summary` and `error` fields for user-readable fallback messages
- Distinguish between client errors (4xx), server operational errors (5xx), and AI timeouts

## 🧭 UX Guidelines
- Outfit cards show Top + Bottom side-by-side with consistent aspect ratios
- Always provide a visible state change on “Regenerate”, “Mark as Worn”
- Use skeleton loaders and spinners during AI calls
- Persist user mode selection (wardrobe / AI / mix)

## 🛠️ Developer Tips
- Set `VITE_API_URL` in frontend `.env` during local dev to avoid CORS surprises
- When deploying to Vercel, prefer client-direct Cloudinary uploads to bypass serverless body limits
- Enable detailed logging temporarily when debugging Gemini output; disable verbose logs for production

## 🧩 FAQ
**Q: Why do I sometimes see only one outfit?**
A: The model may return fewer than requested or produce malformed JSON. We repair JSON and synthesize additional outfits from available tops/bottoms. Ensure your wardrobe has at least a few tops and bottoms, and try loosening filters.

**Q: Images fail to upload on Vercel.**
A: Use client-direct uploads with signatures. The serverless function body size can be restrictive.

**Q: “No token” errors in production.**
A: Check that the frontend is using `credentials: 'include'` and backend CORS allows credentials with the correct origin.

**Q: Weather seems off.**
A: The system uses OpenWeather; ensure API key and region are configured, and that geolocation is permitted.

## 🗺️ Roadmap
- AI-rendered composite outfit images (flat-lays) from `image_prompt`
- “Shop Similar” integration with fashion APIs
- Cross-wardrobe collaborative recommendations (friends/family)
- Wear-pattern analytics and smart reminders
- i18n and accessibility improvements

## 🧑‍💻 Contributing Guidelines
- Use feature branches; keep commits atomic and descriptive
- Match existing code style; avoid unrelated formatting changes
- Include tests for new logic
- Update this README when introducing new endpoints or flows

## 🧰 Code Style Notes
- Prefer descriptive variable names (no 1–2 char names)
- Early returns over deep nesting
- Only catch exceptions you can handle meaningfully
- Keep comments concise and high-signal; avoid obvious commentary

## 🧱 CI/CD (suggested)
- Lint and test on PRs
- Build frontend and backend with environment validation
- Deploy main branch to staging; tag releases for production
- Smoke tests after deploy: auth, uploads, recommendations

## 📊 Monitoring (suggested)
- Error tracking (Sentry/LogRocket)
- Performance tracing on AI calls
- Uptime checks on critical endpoints

## 📚 Appendix: Prompt Design Highlights
- Outfit prompt enforces 3–4 outfits and JSON-only output
- Schema includes title, items[], reasoning; wardrobe context limited to 15 items
- AI suggestions prompt returns `image_prompt` + curated links
- JSON extractor removes code fences, repairs trailing commas, and extracts minimal viable data when necessary

## 📚 Appendix: Environment Examples

### `.env` (backend)
```
PORT=8000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=supersecret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
GEMINI_API_KEY=...
OPENWEATHER_API_KEY=...
ALLOWED_ORIGINS=http://localhost:5173,https://smart-wardrobe-five.vercel.app
```

### `.env` (frontend)
```
VITE_API_URL=http://localhost:8000/api
```

## 🧾 License
MIT

- Intelligent batch processing (3 images per batch)
- 3-second delays between batches to respect API limits
- Retry logic for failed requests
- Fallback to manual mode when AI services are unavailable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent clothing analysis
- Cloudinary for image storage and optimization
- OpenWeather API for weather data
- The React and Node.js communities for excellent tools and libraries

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ by NEERASA-VEDA-VARSHIT**
