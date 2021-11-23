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

  it('should error on invalid language code', async () => {
    await expect(() =>
      controller.parseText('esp' as any, 'Hello there!'),
    ).rejects.toThrow('language code');
  });

  it('should error on text missing', async () => {
    await expect(() =>
      controller.parseText(LanguageCode.Chinese, undefined),
    ).rejects.toThrow('is required');
  });

  it('should error on lang missing', async () => {
    await expect(() =>
      controller.parseText(undefined, 'Hello, how are you?'),
    ).rejects.toThrow('is required');
  });

  jest.setTimeout(10000);
  it('should return proper response', () => {
    return controller
      .parseText(
        LanguageCode.English,
        "What is John Peter Smith doing today?\n I don't know.",
      )
      .then((res) => {
        expect(res?.lines?.length).toBeGreaterThanOrEqual(2);
      });
  });
});
