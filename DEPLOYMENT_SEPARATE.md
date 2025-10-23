# Separate Frontend and Backend Deployment

## 🚀 Deployment Strategy

Deploy frontend and backend as separate Vercel projects for better performance and scalability.

## 📁 Project Structure

```
project/
├── backend/           # Backend API (Node.js/Express)
│   ├── vercel.json   # Backend Vercel config
│   └── ...
├── frontend/         # Frontend (React/Vite)
│   ├── vercel.json   # Frontend Vercel config
│   └── ...
└── DEPLOYMENT_SEPARATE.md
```

## 🔧 Backend Deployment

1. **Deploy Backend:**
   - Go to Vercel Dashboard
   - Import project from GitHub
   - Set **Root Directory** to `backend`
   - Deploy

2. **Backend URL:** `https://smart-wardrobe-backend.vercel.app`

## 🎨 Frontend Deployment

1. **Deploy Frontend:**
   - Go to Vercel Dashboard
   - Import project from GitHub
   - Set **Root Directory** to `frontend`
   - Deploy

2. **Frontend URL:** `https://smart-wardrobe-frontend.vercel.app`

## 🔗 Environment Variables

### Backend Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GEMINI_API_KEY=your-gemini-key
OPENWEATHER_API_KEY=your-weather-key
FRONTEND_URL=https://smart-wardrobe-frontend.vercel.app
ALLOWED_ORIGINS=https://smart-wardrobe-frontend.vercel.app
```

### Frontend Environment Variables
Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://smart-wardrobe-backend.vercel.app/api
```

## ✅ Benefits of Separate Deployments

- **Better Performance:** Each service optimized independently
- **Easier Scaling:** Scale frontend and backend separately
- **Cleaner Logs:** Separate build and deployment logs
- **Independent Updates:** Update frontend without affecting backend
- **Better Caching:** Static frontend with CDN, API with serverless functions

## 🔄 Development Workflow

1. **Local Development:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend
   cd frontend && npm run dev
   ```

2. **Production:**
   - Frontend: `https://smart-wardrobe-frontend.vercel.app`
   - Backend: `https://smart-wardrobe-backend.vercel.app/api`

## 🎯 Next Steps

1. Deploy backend first
2. Update frontend API URL
3. Deploy frontend
4. Test the complete application
