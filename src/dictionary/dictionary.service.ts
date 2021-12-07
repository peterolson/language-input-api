import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { getHeaders } from 'src/data/azure';
import { LanguageCode } from 'src/parse/parse.types';
import {
  DictionaryExample,
  DictionaryLookup,
  DictionaryTranslation,
} from './dictionary.types';
import { traditionalize } from 'hanzi-tools';
import { v2 } from '@google-cloud/translate';
const { Translate } = v2;

@Injectable()
export class DictionaryService {
  private translate: v2.Translate;
  constructor() {
    const projectId = process.env.GOOGLE_PROJECT_ID;
    this.translate = new Translate({ projectId });
  }
  async lookupWord(
    word: string,
    sentence: string,
    from: LanguageCode,
    to: LanguageCode,
  ): Promise<DictionaryLookup> {
    const headers = getHeaders();
    const response: DictionaryLookup[] = await fetch(
      `https://api.cognitive.microsofttranslator.com/dictionary/lookup?api-version=3.0&from=${from}&to=${to}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify([{ Text: word }]),
      },
    ).then((res) => res.json());

    const result = response?.[0] || {
      normalizedSource: word,
      displaySource: word,
      translations: [],
    };

    if (!result.translations.length) {
      const translationResponse = await fetch(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${to}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify([{ Text: word }]),
        },
      ).then((res) => res.json());
      const translations: DictionaryTranslation[] =
        translationResponse[0].translations.map((x) => {
          const translation: DictionaryTranslation = {
            normalizedTarget: x.text,
            displayTarget: x.text,
            posTag: '',
            confidence: 1,
            prefixWord: '',
            backTranslations: [],
          };
          return translation;
        });
      result.translations = translations;
    }

    const [googleTranslate] = await this.translate.translate(word, {
      to,
      from,
    });

    if (
      !result.translations.find(
        (x) =>
          x.normalizedTarget.toLowerCase() === googleTranslate.toLowerCase(),
      )
    ) {
      result.translations.push({
        normalizedTarget: googleTranslate,
        displayTarget: googleTranslate,
        posTag: '',
        confidence: 1,
        prefixWord: '',
        backTranslations: [],
      });
    }

    if (sentence) {
      const [googleTranslate2] = await this.translate.translate(sentence, {
        to,
        from,
      });
      result.originalSentence = sentence;
      result.translatedSentence = googleTranslate2;
    }

    addTradVariantsToLookup(result, from, to);
    return result;
  }

  async getExamples(
    word: string,
    translation: string,
    from: LanguageCode,
    to: LanguageCode,
  ): Promise<DictionaryExample[]> {
    const headers = getHeaders();
    const response = await fetch(
      `https://api.cognitive.microsofttranslator.com/dictionary/examples?api-version=3.0&from=${from}&to=${to}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify([{ Text: word, Translation: translation }]),
      },
    ).then((res) => res.json());
    const examples = response[0]?.examples || [];
    for (const example of examples) {
      addTradVariantsToExample(example, from, to);
    }
    return examples;
  }
}

function addTradVariantsToLookup(
  result: DictionaryLookup,
  from: LanguageCode,
  to: LanguageCode,
) {
  if (from === LanguageCode.Chinese) {
    result.normalizedSourceTrad = traditionalize(result.normalizedSource);
    result.displaySourceTrad = traditionalize(result.displaySource);
    for (const translation of result.translations) {
      for (const backTranslation of translation.backTranslations) {
        backTranslation.normalizedTextTrad = traditionalize(
          backTranslation.normalizedText,
        );
        backTranslation.displayTextTrad = traditionalize(
          backTranslation.displayText,
        );
      }
      for (const example of translation.examples || []) {
        addTradVariantsToExample(example, from, to);
      }
    }
    if (result.originalSentence) {
      result.originalSentenceTrad = traditionalize(result.originalSentence);
    }
  }
  if (to === LanguageCode.Chinese) {
    for (const translation of result.translations) {
      translation.normalizedTargetTrad = traditionalize(
        translation.normalizedTarget,
      );
      translation.displayTargetTrad = traditionalize(translation.displayTarget);
      for (const example of translation.examples || []) {
        addTradVariantsToExample(example, from, to);
      }
    }
    if (result.translatedSentence) {
      result.translatedSentenceTrad = traditionalize(result.translatedSentence);
    }
  }
}

function addTradVariantsToExample(
  example: DictionaryExample,
  from: LanguageCode,
  to: LanguageCode,
) {
  if (from === LanguageCode.Chinese) {
    example.sourcePrefixTrad = traditionalize(example.sourcePrefix);
    example.sourceTermTrad = traditionalize(example.sourceTerm);
    example.sourceSuffixTrad = traditionalize(example.sourceSuffix);
  }
  if (to === LanguageCode.Chinese) {
    example.targetPrefixTrad = traditionalize(example.targetPrefix);
    example.targetTermTrad = traditionalize(example.targetTerm);
    example.targetSuffixTrad = traditionalize(example.targetSuffix);
  }
}
