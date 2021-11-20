import { Test, TestingModule } from '@nestjs/testing';
import { ParseController } from './parse.controller';
import { ParseService } from './parse.service';
import { LanguageCode } from './parse.types';

describe('ParseController', () => {
  let controller: ParseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParseService],
      controllers: [ParseController],
    }).compile();

    controller = module.get<ParseController>(ParseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should error on invalid language code', () => {
    expect(
      async () => await controller.parseText('esp' as any, 'Hello there!'),
    ).rejects.toThrow();
  });

  it('should error on text missing', () => {
    expect(
      async () => await controller.parseText(LanguageCode.Chinese, undefined),
    ).rejects.toThrow('is required');
  });

  it('should error on lang missing', () => {
    expect(
      async () => await controller.parseText(undefined, 'Hello, how are you?'),
    ).rejects.toThrow('is required');
  });

  it('should return proper response', () => {
    return controller
      .parseText(
        LanguageCode.English,
        "What is John Peter Smith doing today? I don't know.",
      )
      .then((res) => {
        expect(res?.tokens?.length).toBeGreaterThanOrEqual(10);
        expect(res?.sents?.length).toBeGreaterThanOrEqual(2);
        expect(res?.ents?.length).toBeGreaterThanOrEqual(2);
      });
  });
});
