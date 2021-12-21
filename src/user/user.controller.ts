import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Collection, WithId } from 'mongodb';
import { getDb } from 'src/data/connect';
import { validateNotEmpty } from 'src/validate/validations';
import { User } from './user.types';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { mungeEmail, sendEmail } from 'src/data/email';

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
      isAdmin: existingUser.isAdmin,
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
    @Body('email') email: string,
  ) {
    const normalizedUserName = username?.toLowerCase().trim();
    const normalizedEmail = email?.toLowerCase().trim();
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
      email: normalizedEmail,
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

  @Post('forgot-password')
  async forgotPassword(
    @Body('usernameOrEmail') usernameOrEmail: string,
    @Body('resetURL') resetURL: string,
  ) {
    validateNotEmpty(usernameOrEmail, 'usernameOrEmail');
    const normalized = usernameOrEmail.toLowerCase().trim();
    const db = await getDb();
    const collection: Collection<User> = db.collection('user');
    let existingUsers: WithId<User>[];
    let toEmail: string;

    const withUsername = await collection.findOne({
      username: normalized,
    });
    if (withUsername) {
      existingUsers = [withUsername];
      toEmail = withUsername.email;
    } else {
      existingUsers = await collection
        .find({
          email: normalized,
        })
        .toArray();
      toEmail = normalized;
    }
    if (!existingUsers.length) {
      throw new HttpException(`User does not exist.`, HttpStatus.FORBIDDEN);
    }
    if (!toEmail) {
      throw new HttpException(
        `No user found with username or email '${normalized}'.`,
        HttpStatus.FORBIDDEN,
      );
    }
    const JWS_SECRET = process.env.JWT_SECRET;
    const subject = 'Reset password';
    const text =
      `If you did not request a password reset, ignore this e-mail.\n\n` +
      existingUsers
        .map((user) => {
          const resetCode = jwt.sign(
            { userId: user._id.toString() },
            JWS_SECRET,
            {
              expiresIn: '24h',
            },
          );
          const resetLink = `${resetURL}/${resetCode}`;
          return `Username: ${user.username}
      Link to reset your password: ${resetLink}
      Link expires in 24 hours.`;
        })
        .join('\n\n');
    await sendEmail({ to: toEmail, subject, text });
    return {
      email: mungeEmail(toEmail),
      message: `Reset password e-mail sent.`,
    };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('resetCode') resetCode: string,
    @Body('password') password: string,
  ) {
    validateNotEmpty(resetCode, 'resetCode');
    validateNotEmpty(password, 'password');
    const JWS_SECRET = process.env.JWT_SECRET;
    const { userId, exp } = jwt.verify(resetCode, JWS_SECRET) as {
      userId: string;
      exp: number;
    };
    const now = +new Date() / 1000;
    if (now > exp) {
      throw new HttpException(`Reset code expired.`, HttpStatus.FORBIDDEN);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const db = await getDb();
    const collection: Collection<User> = db.collection('user');
    collection.updateOne(
      {
        _id: new ObjectId(userId),
      },
      {
        $set: {
          passwordHash,
        },
      },
    );
    return { message: 'Password reset.' };
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
