export type DictionaryLookup = {
  normalizedSource: string;
  displaySource: string;
  translations: DictionaryTranslation[];
};

export type DictionaryTranslation = {
  normalizedTarget: string;
  displayTarget: string;
  posTag: string;
  confidence: number;
  prefixWord: string;
  backTranslations: BackTranslation[];
  examples?: DictionaryExample[];
};

export type BackTranslation = {
  normalizedText: string;
  displayText: string;
  numExamples: number;
  frequencyCount: number;
};

export type DictionaryExample = {
  sourcePrefix: string;
  sourceTerm: string;
  sourceSuffix: string;
  targetPrefix: string;
  targetTerm: string;
  targetSuffix: string;
};
