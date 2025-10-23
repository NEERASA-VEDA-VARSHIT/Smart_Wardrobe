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
