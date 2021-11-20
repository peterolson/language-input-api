import { Body, Controller, Post } from '@nestjs/common';
import {
  validateLanguageCode,
  validateNotEmpty,
} from '../validate/validations';
import { ParseService } from './parse.service';
import { LanguageCode } from './parse.types';

@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}

  @Post()
  async parseText(
    @Body('lang') language: LanguageCode,
    @Body('text') text: string,
  ): Promise<any> {
    validateLanguageCode(language, 'lang');
    validateNotEmpty(text, 'text');

    return await this.parseService.parseText(language, text);
  }
}
