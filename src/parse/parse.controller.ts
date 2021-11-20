import { Body, Controller, Get, Post } from '@nestjs/common';
import { ParseService } from './parse.service';

@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}
  @Get()
  getHello(): string {
    return 'Hello Parse!!';
  }

  @Post()
  async postBack(@Body('lang') language: string): Promise<any> {
    return await this.parseService.parseText(language, 'Hello!');
  }
}
