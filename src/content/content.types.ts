import { ObjectId } from 'mongodb';
import { ParsedText } from 'src/parse/parse.types';

export type MediaType = 'youtube' | 'video' | 'audio' | 'none';
export type Media =
  | {
      type: 'youtube';
      youtubeId: string;
    }
  | {
      type: 'video';
      url: string;
    }
  | {
      type: 'audio';
      url: string;
    }
  | {
      type: 'none';
    };

export type ContentItem = {
  lang: string;
  title: string;
  thumb: string;
  parsedText: ParsedText;
  timings: [number, number][];
  media: Media;
  lemmas: string[];
  tradLemmas?: string[];
  wordCount: number;
  url: string;
  publishedDate: Date;
  channel: string;
  duration: number;
  likes: number;
  dislikes: number;
  neutral: number;
  views: number;
};

export type ContentItemSummary = {
  _id: ObjectId;
  lang: string;
  title: string;
  thumb: string;
  lemmas: string[];
  tradLemmas?: string[];
  wordCount: number;
  channel: string;
  duration: number;
  publishedDate: Date;
  likes: number;
  dislikes: number;
  neutral: number;
  views: number;
};
