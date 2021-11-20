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
  backTranslations;
};

export type BackTranslation = {
  normalizedText: string;
  displayText: string;
  numExamples: number;
  frequencyCount: number;
};
