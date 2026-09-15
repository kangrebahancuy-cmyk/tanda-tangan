import { MongoClient, Db } from 'mongodb';
const uri=process.env.MONGODB_URI; const dbName=process.env.MONGODB_DB; if(!uri||!dbName) throw new Error('MONGODB_URI and MONGODB_DB are required');
type GlobalWithMongo=typeof globalThis & {_mongoClientPromise?:Promise<MongoClient>;_mongoIndexesPromise?:Promise<void>}; const g=globalThis as GlobalWithMongo;
const clientPromise=g._mongoClientPromise ?? new MongoClient(uri).connect(); if(process.env.NODE_ENV!=='production') g._mongoClientPromise=clientPromise;
export async function getDb():Promise<Db>{const db=(await clientPromise).db(dbName); if(!g._mongoIndexesPromise){g._mongoIndexesPromise=Promise.all([db.collection('santri').createIndex({nama:1}),db.collection('santri').createIndex({createdAt:-1})]).then(()=>undefined);} await g._mongoIndexesPromise; return db;}
