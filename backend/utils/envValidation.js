// Environment variable validation for production
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'GEMINI_API_KEY',
    'OPENWEATHER_API_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please check your .env file or Vercel environment variables.');
    process.exit(1);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long for security.');
    process.exit(1);
  }

  // Validate MongoDB URI format
  if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
    console.error('❌ MONGODB_URI must be a valid MongoDB connection string.');
    process.exit(1);
  }

  console.log('✅ All required environment variables are set.');
  
  // Log API key status (without exposing keys)
  console.log('🔑 API Keys Status:');
  console.log(`   - MongoDB: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - OpenWeather: ${process.env.OPENWEATHER_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
};
