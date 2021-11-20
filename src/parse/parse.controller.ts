import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
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
    if (!language) {
      throw new HttpException(
        `'lang' property is required`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!text) {
      throw new HttpException(
        `'text' property is required`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!Object.values(LanguageCode).includes(language)) {
      throw new HttpException(
        `Invalid language code. '${language}'. Supported language codes: ${Object.entries(
          LanguageCode,
        )
          .map(([name, code]) => `'${code}' (${name})`)
          .join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.parseService.parseText(language, text);
  }
}
