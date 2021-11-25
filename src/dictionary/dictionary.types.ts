export type DictionaryLookup = {
  normalizedSource: string;
  displaySource: string;
  normalizedSourceTrad?: string;
  displaySourceTrad?: string;
  translations: DictionaryTranslation[];
};

export type DictionaryTranslation = {
  normalizedTarget: string;
  displayTarget: string;
  normalizedTargetTrad?: string;
  displayTargetTrad?: string;
  posTag: string;
  confidence: number;
  prefixWord: string;
  backTranslations: BackTranslation[];
  examples?: DictionaryExample[];
};

export type BackTranslation = {
  normalizedText: string;
  displayText: string;
  normalizedTextTrad?: string;
  displayTextTrad?: string;
  numExamples: number;
  frequencyCount: number;
};

export type DictionaryExample = {
  sourcePrefix: string;
  sourceTerm: string;
  sourceSuffix: string;
  sourcePrefixTrad?: string;
  sourceTermTrad?: string;
  sourceSuffixTrad?: string;
  targetPrefix: string;
  targetTerm: string;
  targetSuffix: string;
  targetPrefixTrad?: string;
  targetTermTrad?: string;
  targetSuffixTrad?: string;
};
