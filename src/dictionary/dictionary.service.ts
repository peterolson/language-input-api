import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { LanguageCode } from 'src/parse/parse.types';
import {
  DictionaryExample,
  DictionaryLookup,
  DictionaryTranslation,
} from './dictionary.types';

function getHeaders() {
  const subscriptionKey = process.env.AZURE_COGNITIVE_SERVICES_KEY;
  const subscriptionRegion = process.env.AZURE_COGNITIVE_SERVICES_REGION;

  return {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Ocp-Apim-Subscription-Region': subscriptionRegion,
  };
}

@Injectable()
export class DictionaryService {
  async lookupWord(
    word: string,
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
    return response[0]?.examples || [];
  }
}
