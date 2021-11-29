import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { ParseService } from 'src/parse/parse.service';
import { LanguageCode } from 'src/parse/parse.types';
import { validateNotEmpty } from 'src/validate/validations';
import { ContentService } from './content.service';
import { ContentItem, ContentItemSummary } from './content.types';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly parseService: ParseService,
  ) {}
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

  @Post('ids')
  async getContentByIds(
    @Body('ids') ids: string[],
  ): Promise<ContentItemSummary[]> {
    validateNotEmpty(ids, 'ids');
    return await this.contentService.getContentByIds(ids);
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

  @Get('yt-subtitles')
  async getYoutubeSubtitles(@Query('id') youtubeId: string) {
    validateNotEmpty(youtubeId, 'id');
    const res = await this.contentService.getYoutubeSubtitleData(youtubeId);
    if (!res) {
      throw new HttpException(
        `No captions for video '${youtubeId}' found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return res;
  }

  @Post('youtube')
  async addYouTubeContent(
    @Body('lang') lang: LanguageCode,
    @Body('youtubeId') youtubeId: string,
    @Body('vtt') vtt: string,
    @Body('duration') duration: number,
  ) {
    validateNotEmpty(lang, 'lang');
    validateNotEmpty(youtubeId, 'youtubeId');
    validateNotEmpty(vtt, 'vtt');
    validateNotEmpty(duration, 'duration');
    return await this.contentService.uploadYoutubeVideo(
      lang,
      youtubeId,
      vtt,
      duration,
      this.parseService,
    );
  }
}
