import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { ParseService } from 'src/parse/parse.service';

@Module({
  providers: [ContentService, ParseService],
  controllers: [ContentController],
})
export class ContentModule {}
