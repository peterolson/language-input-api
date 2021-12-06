import { ParseService } from 'src/parse/parse.service';
import { LanguageCode, ParsedText } from 'src/parse/parse.types';
import { ContentItem, Media } from './content.types';
import { ObjectId } from 'mongodb';
import { getTextDetails } from './youtube';
import { simplify } from 'hanzi-tools';
import { getContentDifficulty } from './difficulty';

export type Timing = {
  audioOffset: number;
  text: string;
  start: number;
  end: number;
};

export async function addTextContent(
  details: {
    title: string;
    text: string;
    username: string;
    lang: LanguageCode;
    media: Media;
    thumb: string;
    duration: number;
    timings: Timing[];
    isPrivate: boolean;
    url: string;
    userId: ObjectId;
  },
  parseService: ParseService,
) {
  let text = details.text;
  if (details.lang === LanguageCode.Chinese) {
    text = simplify(text);
  }
  const parsedText = await parseService.parseText(details.lang, text);

  const { lemmas, tradLemmas, wordCount } = getTextDetails(
    parsedText,
    details.lang,
  );

  const timings = alignTimings(parsedText, details.timings, details.duration);

  const contentItem: ContentItem = {
    lang: details.lang,
    media: details.media,
    thumb: details.thumb,
    title: details.title,
    duration: details.duration,
    url: details.url,
    parsedText,
    lemmas,
    ...(tradLemmas ? { tradLemmas } : {}),
    ...(await getContentDifficulty(details.lang, lemmas, tradLemmas)),
    wordCount,
    publishedDate: new Date(),
    isPrivate: details.isPrivate,
    userId: details.userId,
    channel: '@' + details.username,
    likes: 0,
    dislikes: 0,
    views: 0,
    neutral: 0,
    popularity: 0,
    timings,
  };

  return contentItem;
}

function alignTimings(
  parsedText: ParsedText,
  timings: Timing[],
  duration: number,
): [number, number][] {
  const withEnds = timings.map((t, i) => ({
    ...t,
    endOffset: timings[i + 1]?.audioOffset || duration,
  }));

  const allTimes: [number, number][] = [];

  for (const line of parsedText.lines) {
    let earliestTime: number;
    let latestTime: number;
    for (const sentence of line.sentences) {
      for (const token of sentence.tokens) {
        const intersectingOffsets = withEnds.filter(
          (t) =>
            (token.start <= t.start && t.start <= token.end) ||
            (token.start <= t.end && t.end <= token.end),
        );
        if (!intersectingOffsets.length) {
          continue;
        }
        const timing: [number, number] = [
          intersectingOffsets[0].audioOffset,
          intersectingOffsets[intersectingOffsets.length - 1].endOffset,
        ];
        if (!earliestTime || timing[0] < earliestTime) {
          earliestTime = timing[0];
        }
        if (!latestTime || timing[1] > latestTime) {
          latestTime = timing[1];
        }
        token.timing = timing;
      }
    }
    allTimes.push([earliestTime, latestTime]);
  }
  return allTimes;
}
