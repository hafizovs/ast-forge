import { Injectable } from '@angular/core';
import { tokenize } from '../domain/compiler/lexer';

@Injectable({ providedIn: 'root' })
export class LexerService {
  tokenize(source: string) {
    return tokenize(source);
  }
}
