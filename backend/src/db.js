import mongoose from 'mongoose';
import dns from 'dns';

export async function connectDB() {
  // Set DNS servers to Google DNS to prevent querySrv ECONNREFUSED error on local environments
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {
    console.warn('Could not set custom DNS servers:', err.message);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI missing');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
