import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Collection } from 'mongodb';
import { getDb } from 'src/data/connect';
import { validateNotEmpty } from 'src/validate/validations';
import { User } from './user.types';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

@Controller('user')
export class UserController {
  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    const normalizedUserName = username.toLowerCase().trim();
    validateNotEmpty(normalizedUserName, 'username');
    validateNotEmpty(password, 'password');

    const db = await getDb();
    const collection: Collection<User> = db.collection('user');

    const existingUser = await collection.findOne({
      username: normalizedUserName,
    });
    if (!existingUser) {
      throw new HttpException(`User does not exist.`, HttpStatus.FORBIDDEN);
    }
    const isPasswordCorrect: boolean = await bcrypt.compare(
      password,
      existingUser.passwordHash,
    );
    if (!isPasswordCorrect) {
      throw new HttpException(`Password incorrect.`, HttpStatus.FORBIDDEN);
    }
    const JWS_SECRET = process.env.JWT_SECRET;
    const payload = {
      username: normalizedUserName,
      id: existingUser._id.toString(),
      createdAt: existingUser.createdAt,
    };

    return {
      ...payload,
      authToken: jwt.sign(payload, JWS_SECRET, { expiresIn: '365d' }),
    };
  }

  @Post('create')
  async create(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    const normalizedUserName = username?.toLowerCase().trim();
    validateNotEmpty(normalizedUserName, 'username');
    validateNotEmpty(password, 'password');
    const passwordHash = await bcrypt.hash(password, 10);
    const db = await getDb();
    const collection: Collection<User> = db.collection('user');

    const existingUser = await collection.findOne({
      username: normalizedUserName,
    });
    if (existingUser) {
      throw new HttpException(`User already exists.`, HttpStatus.FORBIDDEN);
    }
    const createdAt = new Date();
    const insertInfo = await collection.insertOne({
      username: normalizedUserName,
      passwordHash,
      createdAt,
    });

    const JWS_SECRET = process.env.JWT_SECRET;
    const payload = {
      username: normalizedUserName,
      id: insertInfo.insertedId.toString(),
      createdAt,
    };

    return {
      ...payload,
      authToken: jwt.sign(payload, JWS_SECRET, { expiresIn: '365d' }),
    };
  }

  @Post('data')
  async updateData(
    @Headers('authToken') authToken: string,
    @Body() data: Record<string, unknown>,
  ) {
    validateNotEmpty(authToken, 'authToken');
    validateNotEmpty(data, 'data');
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

    const userDataCollection: Collection = db.collection('user.data');
    const result = userDataCollection.updateOne(
      {
        userId: _id,
      },
      {
        $set: data,
      },
      { upsert: true },
    );
    return result;
  }

  @Get('data')
  async getUserData(@Headers('authToken') authToken: string) {
    validateNotEmpty(authToken, 'authToken');
    const JWS_SECRET = process.env.JWT_SECRET;
    const sessionData = jwt.verify(authToken, JWS_SECRET);
    const db = await getDb();
    const _id = new ObjectId(sessionData.id);
    const userDataCollection: Collection = db.collection('user.data');
    const userData = await userDataCollection.findOne({
      userId: _id,
    });
    return userData;
  }
}
