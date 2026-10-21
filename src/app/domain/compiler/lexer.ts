import {
  MAX_SOURCE_LENGTH,
  MAX_TOKENS,
} from '../../core/constants/compiler.constants';
import { KEYWORDS } from '../../core/constants/keywords.constants';
import type {
  CompilerError,
  SourceLocation,
  SourcePosition,
  Token,
} from '../../features/workbench/compiler.types';

export interface TokenizeResult {
  tokens: Token[];
  errors: CompilerError[];
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentContinue(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

function makeLoc(start: SourcePosition, end: SourcePosition): SourceLocation {
  return { start: { ...start }, end: { ...end } };
}

export function tokenize(source: string): TokenizeResult {
  if (source.length > MAX_SOURCE_LENGTH) {
    return {
      tokens: [],
      errors: [
        {
          code: 'E_SOURCE_TOO_LONG',
          messageKey: 'error.sourceTooLong',
          messageParams: { max: MAX_SOURCE_LENGTH },
          phase: 'lex',
          range: { start: 0, end: 0 },
          loc: makeLoc(
            { offset: 0, line: 1, column: 1 },
            { offset: 0, line: 1, column: 1 },
          ),
        },
      ],
    };
  }

  const tokens: Token[] = [];
  const errors: CompilerError[] = [];
  let i = 0;
  let line = 1;
  let column = 1;

  const advance = (count = 1): void => {
    for (let n = 0; n < count; n++) {
      if (i >= source.length) {
        return;
      }
      if (source[i] === '\n') {
        line += 1;
        column = 1;
      } else {
        column += 1;
      }
      i += 1;
    }
  };

  const peek = (offset = 0): string => {
    return source[i + offset] ?? '';
  };

  while (i < source.length) {
    if (tokens.length >= MAX_TOKENS) {
      errors.push({
        code: 'E_TOO_MANY_TOKENS',
        messageKey: 'error.tooManyTokens',
        messageParams: { max: MAX_TOKENS },
        phase: 'lex',
        range: { start: i, end: i },
        loc: makeLoc(
          { offset: i, line, column },
          { offset: i, line, column },
        ),
      });
      break;
    }

    const ch = source[i]!;

    if (isWhitespace(ch)) {
      advance(1);
      continue;
    }

    const start: SourcePosition = { offset: i, line, column };

    if (isAlpha(ch)) {
      let lexeme = '';
      while (i < source.length && isIdentContinue(source[i]!)) {
        lexeme += source[i]!;
        advance(1);
      }
      const end: SourcePosition = { offset: i, line, column };
      const type = KEYWORDS.has(lexeme) ? 'Keyword' : 'Identifier';
      tokens.push({
        type,
        value: lexeme,
        range: { start: start.offset, end: end.offset },
        loc: makeLoc(start, end),
      });
      continue;
    }

    if (isDigit(ch)) {
      let lexeme = '';
      while (i < source.length && isDigit(source[i]!)) {
        lexeme += source[i]!;
        advance(1);
      }
      if (peek() === '.') {
        if (isDigit(peek(1))) {
          lexeme += '.';
          advance(1);
          while (i < source.length && isDigit(source[i]!)) {
            lexeme += source[i]!;
            advance(1);
          }
        } else {
          const end: SourcePosition = { offset: i, line, column };
          tokens.push({
            type: 'Number',
            value: lexeme,
            range: { start: start.offset, end: end.offset },
            loc: makeLoc(start, end),
          });
          const dotStart: SourcePosition = { offset: i, line, column };
          errors.push({
            code: 'E_UNEXPECTED_CHAR',
            messageKey: 'error.unexpectedChar',
            messageParams: {
              char: '.',
              line: dotStart.line,
              column: dotStart.column,
            },
            phase: 'lex',
            range: { start: i, end: i + 1 },
            loc: makeLoc(dotStart, {
              offset: i + 1,
              line,
              column: column + 1,
            }),
          });
          advance(1);
          continue;
        }
      }
      const end: SourcePosition = { offset: i, line, column };
      tokens.push({
        type: 'Number',
        value: lexeme,
        range: { start: start.offset, end: end.offset },
        loc: makeLoc(start, end),
      });
      continue;
    }

    if (ch === '=' && peek(1) === '=') {
      advance(2);
      const end: SourcePosition = { offset: i, line, column };
      tokens.push({
        type: 'Operator',
        value: '==',
        range: { start: start.offset, end: end.offset },
        loc: makeLoc(start, end),
      });
      continue;
    }

    if (
      ch === '=' ||
      ch === '+' ||
      ch === '-' ||
      ch === '*' ||
      ch === '/' ||
      ch === '>' ||
      ch === '<'
    ) {
      advance(1);
      const end: SourcePosition = { offset: i, line, column };
      tokens.push({
        type: 'Operator',
        value: ch,
        range: { start: start.offset, end: end.offset },
        loc: makeLoc(start, end),
      });
      continue;
    }

    if (
      ch === ';' ||
      ch === '{' ||
      ch === '}' ||
      ch === '(' ||
      ch === ')'
    ) {
      advance(1);
      const end: SourcePosition = { offset: i, line, column };
      tokens.push({
        type: 'Punctuation',
        value: ch,
        range: { start: start.offset, end: end.offset },
        loc: makeLoc(start, end),
      });
      continue;
    }

    errors.push({
      code: 'E_UNEXPECTED_CHAR',
      messageKey: 'error.unexpectedChar',
      messageParams: { char: ch, line, column },
      phase: 'lex',
      range: { start: i, end: i + 1 },
      loc: makeLoc(start, { offset: i + 1, line, column: column + 1 }),
    });
    advance(1);
  }

  return { tokens, errors };
}
