import { HttpException, HttpStatus } from '@nestjs/common';
import { LanguageCode } from '../parse/parse.types';

export function validateLanguageCode(
  language: LanguageCode,
  propertyName: string,
): void {
  validateNotEmpty(language, propertyName);
  if (!Object.values(LanguageCode).includes(language)) {
    throw new HttpException(
      `Invalid language code '${language}' for '${propertyName}'. Supported language codes: ${Object.entries(
        LanguageCode,
      )
        .map(([name, code]) => `'${code}' (${name})`)
        .join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function validateNotEmpty(value: any, propertyName: string): void {
  if (!value) {
    throw new HttpException(
      `'${propertyName}' property is required`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
