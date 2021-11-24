import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { validateNotEmpty } from 'src/validate/validations';
import { ContentService } from './content.service';
import { ContentItem, ContentItemSummary } from './content.types';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}
  @Get()
  async getContent(@Query('id') id: string): Promise<ContentItem> {
    try {
      const content = await this.contentService.getContent(id);
      if (!content) {
        throw content;
      }
      return content;
    } catch (error) {
      throw new HttpException(
        `No content with id '${id}'`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Get('newest')
  async getNewestContent(
    @Query('limit') limit = '25',
    @Query('skip') skip = '0',
    @Query('langs') langs: string,
  ): Promise<ContentItemSummary[]> {
    validateNotEmpty(langs, 'langs');
    return await this.contentService.getNewestContent(
      +limit,
      +skip,
      langs.split('|'),
    );
  }

  @Get('channel')
  async getChannelContent(
    @Query('name') channel: string,
    @Query('limit') limit = '25',
    @Query('skip') skip = '0',
  ): Promise<ContentItemSummary[]> {
    validateNotEmpty(channel, 'name');
    return await this.contentService.getContentByChannel(
      channel,
      +limit,
      +skip,
    );
  }
}
