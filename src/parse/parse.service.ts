import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { PythonShell } from 'python-shell';

const PORT = 4310;

@Injectable()
export class ParseService {
  private pyshell: PythonShell;
  constructor() {
    this.pyshell = new PythonShell('./python/parse.py', {
      mode: 'text',
      args: ['--port', PORT.toString()],
    });
  }
  async parseText(lang: string, text: string) {
    const result = await fetch(`http://localhost:${PORT}/parse`, {
      method: 'POST',
      body: JSON.stringify({ lang, text }),
    }).then((res) => res.json());
    return result;
  }
}
