import { Injectable } from '@nestjs/common';
import { Collection, Sort } from 'mongodb';
import { getDb } from '../data/connect';
import { ContentItem, ContentItemSummary } from './content.types';
import { ObjectId } from 'mongodb';
import { exec } from 'youtube-dl-exec';
import { getYoutubeVideo } from './youtube';
import { LanguageCode } from 'src/parse/parse.types';
import { ParseService } from 'src/parse/parse.service';

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
