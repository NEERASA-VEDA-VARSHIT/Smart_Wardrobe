#!/bin/bash

# Smart Wardrobe - Quick Setup Script
echo "🚀 Setting up Smart Wardrobe..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

# Go back to root
cd ..

# Create .env file from example
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file from example..."
    cp env.example backend/.env
    echo "✅ Created backend/.env file"
    echo "⚠️  Please edit backend/.env with your actual API keys"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backend/.env with your API keys"
echo "2. Run 'npm run dev' to start development"
echo "3. Visit http://localhost:5173 for frontend"
echo "4. Backend will run on http://localhost:8000"
echo ""
echo "📚 For deployment, see DEPLOYMENT.md"
