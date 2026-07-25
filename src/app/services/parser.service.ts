import { Injectable } from '@angular/core';
import { parse } from '../domain/compiler/parser';
import type { Token } from '../models/compiler.types';

@Injectable({ providedIn: 'root' })
export class ParserService {
  parse(tokens: Token[]) {
    return parse(tokens);
  }
}
