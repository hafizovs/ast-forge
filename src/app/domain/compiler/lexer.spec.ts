import { describe, expect, it } from 'vitest';
import { MAX_SOURCE_LENGTH } from '../../core/constants/compiler.constants';
import { tokenize } from './lexer';

describe('tokenize', () => {
  it('distinguishes keywords from identifiers', () => {
    const { tokens, errors } = tokenize('let x = 1;');
    expect(errors).toEqual([]);
    expect(tokens.map((t) => t.type)).toEqual([
      'Keyword',
      'Identifier',
      'Operator',
      'Number',
      'Punctuation',
    ]);
    expect(tokens[0]!.value).toBe('let');
    expect(tokens[1]!.value).toBe('x');
  });

  it('tokenizes == as a single operator', () => {
    const { tokens } = tokenize('a == b');
    expect(tokens.map((t) => t.value)).toEqual(['a', '==', 'b']);
    expect(tokens[1]!.type).toBe('Operator');
  });

  it('parses integer and fractional numbers', () => {
    const { tokens, errors } = tokenize('12 3.14');
    expect(errors).toEqual([]);
    expect(tokens.map((t) => t.value)).toEqual(['12', '3.14']);
  });

  it('skips whitespace but tracks line/column', () => {
    const { tokens } = tokenize('a\n  b');
    expect(tokens[0]!.loc.start).toEqual({ offset: 0, line: 1, column: 1 });
    expect(tokens[1]!.loc.start.line).toBe(2);
    expect(tokens[1]!.loc.start.column).toBe(3);
  });

  it('reports unexpected char with position and continues', () => {
    const { tokens, errors } = tokenize('let @ x');
    expect(errors.length).toBe(1);
    expect(errors[0]!.code).toBe('E_UNEXPECTED_CHAR');
    expect(errors[0]!.messageParams?.['line']).toBe(1);
    expect(tokens.map((t) => t.value)).toEqual(['let', 'x']);
  });

  it('rejects source that is too long', () => {
    const source = 'a'.repeat(MAX_SOURCE_LENGTH + 1);
    const { tokens, errors } = tokenize(source);
    expect(tokens).toEqual([]);
    expect(errors[0]!.code).toBe('E_SOURCE_TOO_LONG');
  });

  it('errors on trailing dot without fraction digits', () => {
    const { errors } = tokenize('12.');
    expect(errors.some((e) => e.code === 'E_UNEXPECTED_CHAR')).toBe(true);
  });
});
