import mongoose from 'mongoose';

export async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error('dbUrl is not defined');
  }
  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || undefined,
    });
    const { host, port, name } = connection.connection;
    console.log(`✅ MongoDB connected: ${host}:${port}/${name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}
