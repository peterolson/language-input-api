export enum LanguageCode {
  Chinese = 'zh',
  Catalan = 'ca',
  Danish = 'da',
  Dutch = 'nl',
  English = 'en',
  French = 'fr',
  German = 'de',
  Greek = 'el',
  Italian = 'it',
  Japanese = 'ja',
  Lithuanian = 'lt',
  Macedonain = 'mk',
  MultiLanguage = 'xx',
  NorweiganBokmål = 'nb',
  Polish = 'pl',
  Portuguese = 'pt',
  Romanian = 'ro',
  Russian = 'ru',
  Spanish = 'es',
}

export type ParsedText = {
  rawText: string;
  lines: TextLine[];
};

export type TextLine = {
  sentences: Sentence[];
};

export type Sentence = {
  tokens: Token[];
};

export type Token = {
  text: string;
  tradText?: string;
  transliterations?: string[];
  suffix: string;
  tag: string;
  pos: string;
  morph: string;
  lemma: string;
  isWord: boolean;
  start: number;
  end: number;
};
