import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Headers,
  Delete,
} from '@nestjs/common';
import { ParseService } from 'src/parse/parse.service';
import { LanguageCode } from 'src/parse/parse.types';
import { validateNotEmpty } from 'src/validate/validations';
import { ContentService } from './content.service';
import { ContentItem, ContentItemSummary, Media } from './content.types';
import { Timing } from './uploadText';
import { getUserFromAuthToken } from 'src/data/user';

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

  @Post('list')
  async getContentList(
    @Query('limit') limit = '25',
    @Query('skip') skip = '0',
    @Query('langs') langs: string,
    @Body('viewedIds') viewedIds: string[],
    @Body('sortBy') sortBy: 'newest' | 'recommended' | 'popular',
    @Body('minDuration') minDuration: number,
    @Body('maxDuration') maxDuration: number,
    @Body('isTraditional') isTraditional: boolean,
    @Body('ignore') ignore: string[],
    @Body('recommend') recommend: string[],
  ): Promise<ContentItemSummary[]> {
    validateNotEmpty(langs, 'langs');
    validateNotEmpty(viewedIds, 'viewedIds');
    validateNotEmpty(sortBy, 'sortBy');
    validateNotEmpty(isTraditional, 'isTraditional');
    return await this.contentService.getContentList(
      +limit,
      +skip,
      sortBy,
      minDuration,
      maxDuration,
      langs.split('|'),
      viewedIds || [],
      ignore || [],
      recommend || [],
      isTraditional,
    );
  }

  @Post('recommend')
  async recommendContent(
    @Query('channel') channel: string,
    @Query('limit') limit = '25',
    @Query('skip') skip = '0',
    @Query('lang') lang: string,
    @Query('difficulty') difficulty: string,
    @Query('id') id: string,
    @Body('viewedIds') viewedIds: string[],
  ) {
    validateNotEmpty(channel, 'channel');
    validateNotEmpty(lang, 'lang');
    validateNotEmpty(difficulty, 'difficulty');
    return await this.contentService.getContentRecommendations(
      +limit,
      +skip,
      viewedIds || [],
      lang,
      decodeURIComponent(channel),
      +difficulty,
      id,
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

  @Delete('delete')
  async deleteContent(
    @Headers('authToken') authToken: string,
    @Body('id') id: string,
  ) {
    validateNotEmpty(authToken, 'authToken');
    validateNotEmpty(id, 'id');
    const user = await getUserFromAuthToken(authToken);
    return await this.contentService.deleteContent(id, user);
  }

  @Post('report')
  async reportContent(
    @Body('id') id: string,
    @Body('title') title: string,
    @Body('reason') reason: string,
  ) {
    validateNotEmpty(id, 'id');
    validateNotEmpty(reason, 'reason');
    validateNotEmpty(title, 'title');
    return await this.contentService.reportContent(id, title, reason);
  }

  @Get('report')
  async getReportedContent(@Headers('authToken') authToken: string) {
    validateNotEmpty(authToken, 'authToken');
    const user = await getUserFromAuthToken(authToken);
    if (!user.isAdmin) {
      throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
    }
    return await this.contentService.getReportedContent();
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

  @Post('text')
  async addTextContent(
    @Headers('authToken') authToken: string,
    @Body('lang') lang: LanguageCode,
    @Body('text') text: string,
    @Body('duration') duration: number,
    @Body('media') media: Media,
    @Body('timings') timings: Timing[],
    @Body('isPrivate') isPrivate: boolean,
    @Body('url') url: string,
    @Body('title') title: string,
    @Body('thumb') thumb: string,
  ) {
    validateNotEmpty(authToken, 'authToken');
    validateNotEmpty(lang, 'lang');
    validateNotEmpty(text, 'text');
    validateNotEmpty(duration, 'duration');
    validateNotEmpty(media, 'media');
    validateNotEmpty(timings, 'timings');
    validateNotEmpty(isPrivate, 'isPrivate');
    validateNotEmpty(url, 'url');
    validateNotEmpty(title, 'title');
    validateNotEmpty(thumb, 'thumb');

    const user = await getUserFromAuthToken(authToken);

    return await this.contentService.importText(
      lang,
      text,
      title,
      media,
      thumb,
      duration,
      timings,
      isPrivate,
      url,
      user._id,
      user.username,
      this.parseService,
    );
  }
}
