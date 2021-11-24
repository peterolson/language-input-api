import { MongoClient, Db } from 'mongodb';

let client: MongoClient;
let db: Db;

export async function getDb(): Promise<Db> {
  if (client && db) {
    return db;
  }
  const connectionString = process.env.MONGO_CONNECTION_STRING;
  client = await MongoClient.connect(connectionString);
  db = client.db('language-input');
  ensureIndices(db);
  return db;
}

function ensureIndices(db: Db) {
  const content = db.collection('content');
  content.createIndex({ lang: 1, publishedDate: -1 });
  content.createIndex({ channel: 1, publishedDate: -1 });
  content.createIndex({ publishedDate: -1 });
}
