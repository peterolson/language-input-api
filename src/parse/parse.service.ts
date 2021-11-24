import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { PythonShell } from 'python-shell';
import {
  LanguageCode,
  ParsedText,
  Sentence,
  TextLine,
  Token,
} from './parse.types';
import { decode } from 'html-entities';
import { stripHtml } from 'string-strip-html';

const PORT = 4310;

@Injectable()
export class ParseService {
  constructor() {
    new PythonShell('./python/parse.py', {
      mode: 'text',
      args: ['--port', PORT.toString()],
    });
  }
  async parseText(lang: LanguageCode, text: string): Promise<ParsedText> {
    const sanitizedText = stripReferences(stripHtml(decode(text)).result);
    const result = await fetch(`http://localhost:${PORT}/parse`, {
      method: 'POST',
      body: JSON.stringify({ lang, text: sanitizedText }),
    }).then((res) => res.json());
    return divideLines(result.text, result.tokens, result.sents);
  }
}

function divideLines(
  text: string,
  tokens: {
    start: number;
    end: number;
    tag: string;
    pos: string;
    morph: string;
    lemma: string;
  }[],
  sentences: { start: number; end: number }[],
): ParsedText {
  const outputTokens: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const nextToken = tokens[i + 1];
    const t = text.slice(token.start, token.end);
    let suffix = '';
    if (nextToken) {
      suffix = text.slice(token.end, nextToken.start);
    }
    const { tag, pos, morph, lemma, start, end } = token;
    const isWord = /\p{Letter}/u.test(t);
    const currentToken: Token = {
      text: t,
      tag,
      pos,
      morph,
      lemma,
      isWord,
      suffix,
      start,
      end,
    };
    outputTokens.push(currentToken);
  }
  const lineBreaks: number[] = [];
  for (const token of tokens) {
    const t = text.slice(token.start, token.end);
    if (/\n/.test(t)) {
      lineBreaks.push(token.end);
    }
  }
  if (!lineBreaks.includes(text.length)) {
    lineBreaks.push(text.length);
  }
  const lines: { start: number; end: number }[] = [];
  let start = 0;
  for (let i = 0; i < lineBreaks.length; i++) {
    const end = lineBreaks[i];
    lines.push({ start, end: end });
    start = end;
  }

  const sentenceSegments: TextLine[] = lines.map((line) => {
    const s: { start: number; end: number; text: string }[] = [];
    let start = line.start;
    const ends = sentences
      .filter((x) => x.end >= start && x.end <= line.end)
      .map((x) => x.end);
    for (let i = 0; i < ends.length; i++) {
      const end = ends[i];
      s.push({ start, end, text: text.slice(start, end) });
      start = end;
    }
    if (start < line.end) {
      s.push({ start, end: line.end, text: text.slice(start, line.end) });
    }
    const sentencesWithTokens = s.map((sentence) => {
      return outputTokens.filter(
        (token) => token.start >= sentence.start && token.end <= sentence.end,
      );
    });
    const lastSentence = sentencesWithTokens.slice(-1)[0];
    if (
      sentencesWithTokens.length > 1 &&
      lastSentence.length === 1 &&
      /\n/.test(lastSentence[0].text)
    ) {
      const lastToken = lastSentence[0];
      sentencesWithTokens.pop();
      sentencesWithTokens[sentencesWithTokens.length - 1].push(lastToken);
    }
    const outputSentences: Sentence[] = sentencesWithTokens.map((tokens) => {
      return { tokens };
    });
    return {
      sentences: outputSentences,
    };
  });

  const textLines: ParsedText = {
    rawText: text,
    lines: sentenceSegments,
  };
  return textLines;
}

function stripReferences(text: string): string {
  return text.replace(/\[\d+\]/g, '');
}
