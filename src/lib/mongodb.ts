import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
if (!uri || !dbName) throw new Error('MONGODB_URI and MONGODB_DB are required');

type GlobalWithMongo = typeof globalThis & { _mongoClientPromise?: Promise<MongoClient> };
const globalWithMongo = globalThis as GlobalWithMongo;

const clientPromise = globalWithMongo._mongoClientPromise ?? new MongoClient(uri).connect();
if (process.env.NODE_ENV !== 'production') globalWithMongo._mongoClientPromise = clientPromise;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}
