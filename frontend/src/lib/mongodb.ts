import { MongoClient } from 'mongodb';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI is not defined in the environment variables');
}

const uri = process.env.MONGODB_URI || '';
const options = {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  tls: true,
  family: 4, // Force IPv4 to avoid some networking issues in container environments
};

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('MONGODB_URI is missing. Please add it in the Settings menu.');
  }

  if (clientPromise) {
    return clientPromise;
  }

  console.log('Attempting to connect to MongoDB...');
  client = new MongoClient(uri, options);
  
  clientPromise = client.connect().then(mClient => {
    console.log('Successfully connected to MongoDB');
    return mClient;
  }).catch(err => {
    clientPromise = null; // Reset promise so it can retry
    const errorMsg = err.message || '';
    if (errorMsg.includes('SSL routines') || errorMsg.includes('alert internal error') || errorMsg.includes('SSL alert number 80')) {
      throw new Error(`MongoDB SSL/Connection Error: This usually happens if your IP is not whitelisted in MongoDB Atlas or if the connection string is malformed. 
      
1. Go to your MongoDB Atlas Dashboard.
2. Navigate to "Network Access" in the left sidebar.
3. Click "Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0) for development.
4. Ensure your password doesn't contain special characters that need URL encoding (like @, :, /).

Technical details: ${errorMsg}`);
    }
    throw err;
  });
  
  return clientPromise;
}

export async function getDb(dbName?: string) {
  const client = await getMongoClient();
  return client.db(dbName);
}
