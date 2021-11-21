import { Controller, Post, Body } from '@nestjs/common';
import {
  validateLanguageCode,
  validateNotEmpty,
} from '../validate/validations';
import { LanguageCode } from '../parse/parse.types';
import { DictionaryService } from './dictionary.service';
import { DictionaryExample, DictionaryLookup } from './dictionary.types';

@Controller('dictionary')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Post()
  async lookupWord(
    @Body('from') from: LanguageCode,
    @Body('to') to: LanguageCode,
    @Body('word') word: string,
  ): Promise<DictionaryLookup> {
    validateLanguageCode(from, 'from');
    validateLanguageCode(to, 'to');
    validateNotEmpty(word, 'word');
    return await this.dictionaryService.lookupWord(word, from, to);
  }

  @Post('examples')
  async getExamples(
    @Body('from') from: LanguageCode,
    @Body('to') to: LanguageCode,
    @Body('word') word: string,
    @Body('translation') translation: string,
  ): Promise<DictionaryExample[]> {
    validateLanguageCode(from, 'from');
    validateLanguageCode(to, 'to');
    validateNotEmpty(word, 'word');
    validateNotEmpty(translation, 'translation');
    return await this.dictionaryService.getExamples(
      word,
      translation,
      from,
      to,
    );
  }
}
