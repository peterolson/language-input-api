import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
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

  @Post('newest')
  async getNewestContent(
    @Query('limit') limit = '25',
    @Query('skip') skip = '0',
    @Query('langs') langs: string,
    @Body('viewedIds') viewedIds: string[],
  ): Promise<ContentItemSummary[]> {
    validateNotEmpty(langs, 'langs');
    return await this.contentService.getNewestContent(
      +limit,
      +skip,
      langs.split('|'),
      viewedIds || [],
    );
  }

  @Post('channel')
  async getChannelContent(
    @Query('name') channel: string,
    @Query('limit') limit = '25',
    @Query('skip') skip = '0',
    @Body('viewedIds') viewedIds: string[],
  ): Promise<ContentItemSummary[]> {
    validateNotEmpty(channel, 'name');
    return await this.contentService.getContentByChannel(
      channel,
      +limit,
      +skip,
      viewedIds || [],
    );
  }

  @Post('view')
  async viewContent(@Query('id') id: string) {
    validateNotEmpty(id, 'id');
    return await this.contentService.viewContent(id);
  }

  @Post('like')
  async likeContent(@Query('id') id: string) {
    validateNotEmpty(id, 'id');
    return await this.contentService.likeContent(id);
  }

  @Post('dislike')
  async dislikeContent(@Query('id') id: string) {
    validateNotEmpty(id, 'id');
    return await this.contentService.dislikeContent(id);
  }

  @Post('neutral')
  async neutralContent(@Query('id') id: string) {
    validateNotEmpty(id, 'id');
    return await this.contentService.neutralContent(id);
  }
}
