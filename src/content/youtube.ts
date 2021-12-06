import { ParsedText, LanguageCode } from '../parse/parse.types';
import { ParseService } from '../parse/parse.service';
import { ContentItem, Media } from './content.types';
import fetch from 'node-fetch';
import { simplify } from 'hanzi-tools';
import { getContentDifficulty } from './difficulty';

export async function getYoutubeVideo(
  lang: LanguageCode,
  youtubeId: string,
  vtt: string,
  duration: number,
  parseService: ParseService,
): Promise<ContentItem> {
  const captions = parseVTT(vtt);
  const text = captions.map((c) => c.text).join('\n');
  const timings: [number, number][] = captions.map((c) => [c.start, c.end]);

  let t = text;
  if (lang === 'zh') {
    t = simplify(text);
  }

  const parsedText: ParsedText = await parseService.parseText(lang, t);

  if (timings.length !== parsedText.lines.length) {
    throw new Error("Timings and parsed text don't match");
  }

  const { lemmas, tradLemmas, wordCount } = getTextDetails(parsedText, lang);

  const details = await getVideoDetails(youtubeId);
  const detail = details.items[0];

  const summary = {
    title: detail.snippet.title,
    url: `https://www.youtube.com/watch?v=${youtubeId}`,
    media: {
      type: 'youtube',
      youtubeId,
    } as Media,
    thumb: detail.snippet.thumbnails.medium.url,
    publishedDate: new Date(detail.snippet.publishedAt),
    channel: detail.snippet.channelTitle,
  };

  let item: ContentItem = {
    lang,
    ...summary,
    duration,
    parsedText,
    timings,
    lemmas,
    wordCount,
    likes: 0,
    dislikes: 0,
    neutral: 0,
    views: 0,
    popularity: 0,
  };

  if (lang === LanguageCode.Chinese) {
    item.tradLemmas = tradLemmas;
  }
  item = {
    ...item,
    ...(await getContentDifficulty(lang, lemmas, tradLemmas)),
  };
  return item;
}

export function getTextDetails(parsedText: ParsedText, lang: LanguageCode) {
  const lemmaSet = new Set<string>();
  const tradLemmaSet = new Set<string>();
  let wordCount = 0;
  for (const line of parsedText.lines) {
    for (const sentence of line.sentences) {
      for (const token of sentence.tokens) {
        if (token.isWord) {
          wordCount++;
          if (token.lemma) lemmaSet.add(token.lemma.toLowerCase());
          if (lang === LanguageCode.Chinese) {
            const chars = [...token.text].filter(charInCJK);
            const tradChars = [...(token.tradText || token.text)].filter(
              charInCJK,
            );
            for (const char of chars) {
              lemmaSet.add(char);
            }
            for (const char of tradChars) {
              tradLemmaSet.add(char);
            }
          }
        }
      }
    }
  }

  return {
    lemmas: Array.from(lemmaSet),
    tradLemmas: Array.from(tradLemmaSet),
    wordCount,
  };
}

export async function getVideoDetails(youtubeId) {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  return await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${youtubeId}&part=contentDetails,snippet,status&key=${API_KEY}`,
  ).then((res) => res.json());
}

function parseVTT(vtt: string) {
  const parts = vtt.split('\n\n').slice(1);
  const parsed = parts
    .filter(Boolean)
    .map((part) => {
      let lines = part.split('\n');
      if (lines[1].includes('-->') && lines[1].includes(':')) {
        lines = lines.slice(1);
      }
      const time = lines[0].split(' --> ');
      const start = time[0].split(':').map((x) => +x);
      const end = time[1].split(':').map((x) => +x.replace(/[^0-9.]/g, ''));
      if (start.some(isNaN) || end.some(isNaN))
        throw new Error('Invalid subtitle timing');
      const text = lines.slice(1).join(' ');
      return {
        start: start.reduce((a, b) => a * 60 + b, 0),
        end: end.reduce((a, b) => a * 60 + b, 0),
        text,
      };
    })
    .filter((x) => x.text.trim().replace(/\n/g, ' ').length > 0);
  return parsed;
}

function charInCJK(char) {
  const codePoint = char.codePointAt(0);
  return (
    (0x3400 <= codePoint && codePoint <= 0x4dbf) || // 	CJK Unified Ideographs Extension A
    (0x4e00 <= codePoint && codePoint <= 0x9ffc) || //	CJK Unified Ideographs
    (0xf900 <= codePoint && codePoint <= 0xfa6d) || // 	CJK Compatibility Ideographs
    (0xfa70 <= codePoint && codePoint <= 0xfad9) ||
    (0x20000 <= codePoint && codePoint <= 0x2a6dd) || // CJK Unified Ideographs Extension B
    (0x2a700 <= codePoint && codePoint <= 0x2b734) || // CJK Unified Ideographs Extension C
    (0x2b740 <= codePoint && codePoint <= 0x2b81d) || // JK Unified Ideographs Extension D
    (0x2b820 <= codePoint && codePoint <= 0x2cea1) || // CJK Unified Ideographs Extension E
    (0x2ceb0 <= codePoint && codePoint <= 0x2ebe0) || // CJK Unified Ideographs Extension F
    (0x30000 <= codePoint && codePoint <= 0x3134a) || // CJK Unified Ideographs Extension G
    (0x2f800 <= codePoint && codePoint <= 0x2fa1d)
  ); // 	CJK Compatibility Supplement
}
