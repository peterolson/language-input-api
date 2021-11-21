import { Test, TestingModule } from '@nestjs/testing';
import { LanguageCode } from '../parse/parse.types';
import { DictionaryController } from './dictionary.controller';
import { DictionaryService } from './dictionary.service';

describe('DictionaryController', () => {
  let controller: DictionaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DictionaryController],
      providers: [DictionaryService],
    }).compile();

    controller = module.get<DictionaryController>(DictionaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should validate input', async () => {
    await expect(() =>
      controller.lookupWord(
        LanguageCode.English,
        LanguageCode.Spanish,
        undefined,
      ),
    ).rejects.toThrow('is required');
    await expect(() =>
      controller.lookupWord(undefined, LanguageCode.Spanish, 'tomorrow'),
    ).rejects.toThrow('is required');
    await expect(() =>
      controller.lookupWord(LanguageCode.Catalan, undefined, 'tomorrow'),
    ).rejects.toThrow('is required');

    await expect(() =>
      controller.lookupWord(LanguageCode.English, 'fff' as any, 'tomorrow'),
    ).rejects.toThrow('language code');
  });

  it('should find examples', async () => {
    await expect(
      controller.getExamples(
        LanguageCode.English,
        LanguageCode.Chinese,
        'today',
        '今天',
      ),
    ).resolves.toBeDefined();
  });
});
