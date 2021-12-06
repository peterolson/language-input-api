import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Collection, Sort, WithId } from 'mongodb';
import { getDb } from '../data/connect';
import {
  ContentFeedback,
  ContentItem,
  ContentItemSummary,
  Media,
} from './content.types';
import { ObjectId } from 'mongodb';
import { exec } from 'youtube-dl-exec';
import { getYoutubeVideo } from './youtube';
import { LanguageCode } from 'src/parse/parse.types';
import { ParseService } from 'src/parse/parse.service';
import { addTextContent, Timing } from './uploadText';
import { User } from 'src/user/user.types';

const summaryProjection = {
  _id: 1,
  lang: 1,
  title: 1,
  thumb: 1,
  lemmas: 1,
  tradLemmas: 1,
  wordCount: 1,
  channel: 1,
  duration: 1,
  publishedDate: 1,
  likes: 1,
  dislikes: 1,
  neutral: 1,
  views: 1,
};

const sorts: Record<string, (isTraditional: boolean) => Sort> = {
  newest: () => ({ publishedDate: -1 }),
  bestLevel: (isTraditional: boolean) => ({
    [isTraditional ? 'tradDifficulty' : 'difficulty']: 1,
  }),
  popular: () => ({ popularity: -1, publishedDate: -1 }),
};

@Injectable()
export class ContentService {
  async getContent(id: string): Promise<ContentItem> {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const _id = new ObjectId(id);
    return await collection.findOne({ _id });
  }
  async getContentList(
    limit: number,
    skip: number,
    sortBy: 'newest' | 'bestLevel' | 'popular',
    minDuration: number,
    maxDuration: number,
    languages: string[],
    viewedIds: string[] = [],
    isTraditional: boolean,
  ): Promise<ContentItemSummary[]> {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const allResults: ContentItemSummary[][] = [];
    const dividedLimit = Math.ceil(limit / languages.length);
    const dividedSkip = Math.floor(dividedLimit * (skip / limit));
    for (const lang of languages) {
      const results: ContentItemSummary[] = (await collection
        .find(
          {
            lang,
            _id: { $nin: viewedIds.map((x) => new ObjectId(x)) },
            duration: {
              ...(minDuration !== null ? { $gte: minDuration } : {}),
              ...(maxDuration !== null ? { $lte: maxDuration } : {}),
            },
            isPrivate: { $ne: true },
          },
          {
            projection: summaryProjection,
            sort: sorts[sortBy](isTraditional),
          },
        )
        .skip(dividedSkip)
        .limit(Math.min(dividedLimit, 50) || 25)
        .toArray()) as ContentItemSummary[];
      allResults.push(results);
    }
    return zip(allResults);
  }

  async getContentByChannel(
    channel: string,
    limit: number,
    skip: number,
    viewedIds: string[],
  ) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    return await collection
      .find(
        {
          channel,
          _id: { $nin: viewedIds.map((x) => new ObjectId(x)) },
          isPrivate: { $ne: true },
        },
        {
          projection: summaryProjection,
          sort: {
            publishedDate: -1,
          },
        },
      )
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async getContentRecommendations(
    limit: number,
    skip: number,
    viewedIds: string[],
    lang: string,
    channel: string,
    difficulty: number,
    id: string,
  ) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const dividedLimit = Math.ceil(limit / 2);
    const dividedSkip = Math.floor(dividedLimit * (skip / limit));
    const inChannel = await collection
      .find(
        {
          lang,
          _id: {
            $nin: viewedIds
              .map((x) => new ObjectId(x))
              .concat(new ObjectId(id)),
          },
          difficulty: { $gte: difficulty * 0.75, $lte: difficulty * 2 },
          channel,
          isPrivate: { $ne: true },
        },
        {
          projection: summaryProjection,
          sort: { popularity: -1 },
        },
      )
      .skip(dividedSkip)
      .limit(dividedLimit)
      .toArray();
    const notInChannel = await collection
      .find(
        {
          lang,
          _id: {
            $nin: viewedIds
              .map((x) => new ObjectId(x))
              .concat(new ObjectId(id)),
          },
          difficulty: { $gte: difficulty * 0.75, $lte: difficulty * 2 },
          channel: { $ne: channel },
          isPrivate: { $ne: true },
        },
        {
          projection: summaryProjection,
          sort: { popularity: -1 },
        },
      )
      .skip(dividedSkip)
      .limit(dividedLimit)
      .toArray();
    return zip([inChannel, notInChannel]);
  }

  async getContentByIds(ids: string[]) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const items = await collection
      .find({
        _id: { $in: ids.map((x) => new ObjectId(x)) },
      })
      .toArray();
    return items.sort(
      (a, b) => ids.indexOf(a._id.toString()) - ids.indexOf(b._id.toString()),
    );
  }

  async viewContent(id) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const _id = new ObjectId(id);
    const popularity = await this.getPopularity(collection, _id);
    return await collection.updateOne(
      { _id },
      { $inc: { views: 1 }, $set: { popularity } },
    );
  }

  async likeContent(id) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const _id = new ObjectId(id);
    const popularity = await this.getPopularity(collection, _id);
    return await collection.updateOne(
      { _id },
      { $inc: { likes: 1 }, $set: { popularity } },
    );
  }

  async dislikeContent(id) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const _id = new ObjectId(id);
    const popularity = await this.getPopularity(collection, _id);
    return await collection.updateOne(
      { _id },
      { $inc: { dislikes: 1 }, $set: { popularity } },
    );
  }

  async neutralContent(id) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const _id = new ObjectId(id);
    const popularity = await this.getPopularity(collection, _id);
    return await collection.updateOne(
      { _id },
      { $inc: { neutral: 1 }, $set: { popularity } },
    );
  }

  async deleteContent(id: string, user: WithId<User>) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const _id = new ObjectId(id);
    let isAllowed = user.isAdmin;
    if (!isAllowed) {
      const content = await collection.findOne({ _id });
      isAllowed = content.userId.toString() === user._id.toString();
    }
    if (!isAllowed) {
      throw new HttpException(
        `Not authorized to delete this content.`,
        HttpStatus.NOT_FOUND,
      );
    }

    return await collection.deleteOne({ _id });
  }

  async reportContent(contentId: string, contentTitle: string, reason: string) {
    const db = await getDb();
    const collection: Collection<ContentFeedback> =
      db.collection('content.feedback');
    return await collection.insertOne({
      reportedAt: new Date(),
      reason,
      contentId,
      contentTitle,
    });
  }

  async getPopularity(collection: Collection<ContentItem>, _id: ObjectId) {
    const item = await collection.findOne(
      { _id },
      { projection: { views: 1, likes: 1, dislikes: 1, neutral: 1 } },
    );
    if (!item) return 0;
    const likes = item.likes || 0;
    const dislikes = item.dislikes || 0;
    const neutral = item.neutral || 0;
    const views = item.views || 0;
    const bounceRate = 1 - (likes + dislikes + neutral) / (views + 1);
    const sentiment = likes - dislikes + neutral / 5;
    const reactions = likes + dislikes + neutral + views / 50;
    return (reactions * (sentiment + 1)) / bounceRate;
  }

  async getYoutubeSubtitleData(youtubeId: string) {
    const ytResponse = await exec(
      `https://www.youtube.com/watch?v=${youtubeId}`,
      {
        dumpSingleJson: true,
      },
    );
    const ytData = JSON.parse(ytResponse.stdout);
    if (!ytData) return null;
    const { duration, subtitles } = ytData;
    return { duration, subtitles };
  }

  async uploadYoutubeVideo(
    lang: LanguageCode,
    youtubeId: string,
    vtt: string,
    duration: number,
    parseService: ParseService,
  ) {
    const item = await getYoutubeVideo(
      lang,
      youtubeId,
      vtt,
      duration,
      parseService,
    );
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const updateResult = await collection.updateOne(
      {
        url: item.url,
      },
      {
        $set: item,
      },
      {
        upsert: true,
      },
    );
    return { id: updateResult.upsertedId.toString() };
  }

  async importText(
    lang: LanguageCode,
    text: string,
    title: string,
    media: Media,
    thumb: string,
    duration: number,
    timings: Timing[],
    isPrivate: boolean,
    url: string,
    userId: ObjectId,
    username: string,
    parseService: ParseService,
  ) {
    const db = await getDb();
    const collection: Collection<ContentItem> = db.collection('content');
    const item = await addTextContent(
      {
        title,
        text,
        media,
        thumb,
        duration,
        timings,
        isPrivate,
        url,
        userId,
        username,
        lang,
      },
      parseService,
    );
    const insertResult = await collection.insertOne(item);
    return { id: insertResult.insertedId.toString() };
  }
}

function zip<T>(a: T[][]): T[] {
  const zipped: T[] = [];
  const maxLength = Math.max(...a.map((x) => x.length));
  for (let i = 0; i < maxLength; i++) {
    const row: T[] = [];
    for (const arr of a) {
      row.push(arr[i]);
    }
    for (const item of row) {
      if (item) {
        zipped.push(item);
      }
    }
  }
  return zipped;
}
