import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { PythonShell } from 'python-shell';
import { LanguageCode } from './parse.types';

const PORT = 4310;

@Injectable()
export class ParseService {
  constructor() {
    new PythonShell('./python/parse.py', {
      mode: 'text',
      args: ['--port', PORT.toString()],
    });
  }
  async parseText(lang: LanguageCode, text: string) {
    const result = await fetch(`http://localhost:${PORT}/parse`, {
      method: 'POST',
      body: JSON.stringify({ lang, text }),
    }).then((res) => res.json());
    return result;
  }
}
