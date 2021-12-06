import { User } from 'src/user/user.types';
import { getDb } from './connect';
import * as jwt from 'jsonwebtoken';
import { Collection, ObjectId, WithId } from 'mongodb';
import { HttpException, HttpStatus } from '@nestjs/common';

export async function getUserFromAuthToken(
  authToken: string,
): Promise<WithId<User>> {
  const JWS_SECRET = process.env.JWT_SECRET;
  const sessionData = jwt.verify(authToken, JWS_SECRET);
  const db = await getDb();
  const collection: Collection<User> = db.collection('user');
  const _id = new ObjectId(sessionData.id);
  const user = await collection.findOne({
    _id,
  });
  if (!user) {
    throw new HttpException(`User does not exist.`, HttpStatus.FORBIDDEN);
  }
  return user;
}
