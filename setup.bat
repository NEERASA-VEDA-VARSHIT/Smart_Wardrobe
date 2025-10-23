@echo off
echo 🚀 Setting up Smart Wardrobe...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo    Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install dependencies
echo 📦 Installing dependencies...

REM Install root dependencies
npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
npm install

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd ..\frontend
npm install

REM Go back to root
cd ..

REM Create .env file from example
if not exist "backend\.env" (
    echo 📝 Creating .env file from example...
    copy env.example backend\.env
    echo ✅ Created backend\.env file
    echo ⚠️  Please edit backend\.env with your actual API keys
) else (
    echo ✅ .env file already exists
)

echo.
echo 🎉 Setup complete!
echo.
echo 📋 Next steps:
echo 1. Edit backend\.env with your API keys
echo 2. Run 'npm run dev' to start development
echo 3. Visit http://localhost:5173 for frontend
echo 4. Backend will run on http://localhost:8000
echo.
echo 📚 For deployment, see DEPLOYMENT.md
pause
