import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParseModule } from './parse/parse.module';
import { DictionaryModule } from './dictionary/dictionary.module';

@Module({
  imports: [ParseModule, DictionaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
