import fetch from 'node-fetch';
import { getHeaders } from 'src/data/azure';
import { LanguageCode } from './parse.types';
import { traditionalize } from 'hanzi-tools';

export async function transliterate(
  texts: string[],
  language: LanguageCode,
  fromScript: string,
  toScript: string,
): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.cognitive.microsofttranslator.com/transliterate?api-version=3.0&language=${language}&fromScript=${fromScript}&toScript=${toScript}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(texts.map((text) => ({ Text: text }))),
      },
    ).then((res) => res.json());
    return response.map((x) => x.text);
  } catch (error) {
    if (toScript === 'Hant') {
      return texts.map((text) => traditionalize(text));
    }
    throw error;
  }
}
