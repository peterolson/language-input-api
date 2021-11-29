import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParseModule } from './parse/parse.module';
import { DictionaryModule } from './dictionary/dictionary.module';
import { ContentModule } from './content/content.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [ParseModule, DictionaryModule, ContentModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
