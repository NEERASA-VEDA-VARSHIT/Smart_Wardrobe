# 🚀 Smart Wardrobe - Production Deployment Guide

## 📋 Prerequisites

### Required API Keys & Services:

#### 1. **MongoDB Atlas** (Database)
- Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
- Create a free cluster
- Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/smart-wardrobe`

#### 2. **Cloudinary** (Image Storage)
- Sign up at [cloudinary.com](https://cloudinary.com)
- Get from Dashboard:
  - Cloud Name
  - API Key
  - API Secret

#### 3. **Google Gemini AI** (Clothing Analysis)
- Go to [Google AI Studio](https://aistudio.google.com)
- Create API key
- Enable Gemini API

#### 4. **OpenWeather API** (Weather Data)
- Sign up at [openweathermap.org](https://openweathermap.org)
- Get free API key
- No credit card required for basic plan

## 🔧 Vercel Deployment

### Step 1: Prepare Repository
```bash
git clone https://github.com/NEERASA-VEDA-VARSHIT/Smart_Wardrobe.git
cd Smart_Wardrobe
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

### Step 3: Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection string |
| `JWT_SECRET` | `your_32_char_secret_key` | JWT signing secret |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | Cloudinary API secret |
| `GEMINI_API_KEY` | `your_gemini_key` | Google Gemini API key |
| `OPENWEATHER_API_KEY` | `your_weather_key` | OpenWeather API key |
| `NODE_ENV` | `production` | Environment mode |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Frontend URL |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | CORS origins |

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-app.vercel.app`

## 🔑 API Key Setup Guide

### MongoDB Atlas Setup:
1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create new project
3. Build a cluster (free tier available)
4. Create database user
5. Whitelist IP addresses (0.0.0.0/0 for Vercel)
6. Get connection string

### Cloudinary Setup:
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, API Secret
4. No additional configuration needed

### Google Gemini AI Setup:
1. Go to [Google AI Studio](https://aistudio.google.com)
2. Sign in with Google account
3. Click "Get API Key"
4. Create new API key
5. Copy the key (starts with "AIza...")

### OpenWeather API Setup:
1. Sign up at [openweathermap.org](https://openweathermap.org)
2. Go to "API Keys" tab
3. Copy your API key
4. Free tier: 1,000 calls/day

## 🛠️ Local Development

### Backend Setup:
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your API keys
npm run dev
```

### Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

## 🔍 Troubleshooting

### Common Issues:

#### 1. **"Missing environment variables" error**
- Check all API keys are set in Vercel
- Ensure no typos in variable names
- Redeploy after adding variables

#### 2. **CORS errors**
- Check `FRONTEND_URL` is set correctly
- Ensure `ALLOWED_ORIGINS` includes your domain

#### 3. **Database connection failed**
- Verify MongoDB URI format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

#### 4. **Image upload fails**
- Verify Cloudinary credentials
- Check file size limits
- Ensure Cloudinary account is active

#### 5. **AI metadata generation fails**
- Check Gemini API key is valid
- Verify API key has proper permissions
- Check rate limits

## 📊 Monitoring

### Vercel Analytics:
- View deployment logs
- Monitor API usage
- Check error rates

### Application Monitoring:
- Check browser console for errors
- Monitor API response times
- Track user interactions

## 🔒 Security Checklist

- ✅ Strong JWT secret (32+ characters)
- ✅ Secure MongoDB connection
- ✅ HTTPS enabled (automatic with Vercel)
- ✅ CORS properly configured
- ✅ API keys not exposed in frontend
- ✅ Rate limiting enabled
- ✅ Input validation on all endpoints

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test API endpoints individually
4. Check browser console for errors

---

**Happy Deploying! 🚀**
