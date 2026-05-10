import mongoose from 'mongoose';

let connectPromise: Promise<typeof mongoose> | null = null;

export function getMongoUri(): string {
  const raw = process.env.MONGODB_URI?.trim();
  if (raw) return raw;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI must be set in production');
  }
  return 'mongodb://localhost:27017/diploma';
}

export async function connectMongo(): Promise<typeof mongoose> {
  if (connectPromise) return connectPromise;
  connectPromise = mongoose.connect(getMongoUri(), {
    serverSelectionTimeoutMS: 5_000,
  });
  return connectPromise;
}

