import { Test, TestingModule } from '@nestjs/testing';
import { LanguageCode } from '../parse/parse.types';
import { DictionaryService } from './dictionary.service';

describe('DictionaryService', () => {
  let service: DictionaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DictionaryService],
    }).compile();

    service = module.get<DictionaryService>(DictionaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should give a response', () => {
    return service
      .lookupWord('tomorrow', LanguageCode.English, LanguageCode.Spanish)
      .then((response) => {
        expect(response?.translations.length).toBeGreaterThan(0);
      });
  });

  it('should fall back to translate when not in dictionary', () => {
    return service
      .lookupWord('how are you', LanguageCode.English, LanguageCode.Spanish)
      .then((response) => {
        expect(response?.translations.length).toBeGreaterThan(0);
      });
  });
});
