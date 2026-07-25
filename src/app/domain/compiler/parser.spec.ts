import { describe, expect, it } from 'vitest';
import { DEFAULT_SOURCE } from '../../core/constants/sample-presets.constants';
import type {
  BinaryExpression,
  Expression,
  ExpressionStatement,
  Program,
} from '../../models/compiler.types';
import { tokenize } from './lexer';
import { parse } from './parser';

function parseSource(source: string) {
  const { tokens } = tokenize(source);
  return parse(tokens);
}

function exprOf(program: Program): Expression {
  const stmt = program.body[0] as ExpressionStatement;
  return stmt.expression;
}

describe('parse', () => {
  it('parses default sample without errors', () => {
    const { program, errors } = parseSource(DEFAULT_SOURCE);
    expect(errors).toEqual([]);
    expect(program.kind).toBe('Program');
    expect(program.body.length).toBeGreaterThan(0);
    expect(program.id).toMatch(/^n\d+$/);
  });

  it('gives + over * for 2 + 3 * 4', () => {
    const { program, errors } = parseSource('2 + 3 * 4;');
    expect(errors).toEqual([]);
    const root = exprOf(program) as BinaryExpression;
    expect(root.kind).toBe('BinaryExpression');
    expect(root.operator).toBe('+');
    expect(root.right.kind).toBe('BinaryExpression');
    expect((root.right as BinaryExpression).operator).toBe('*');
  });

  it('respects parentheses in (2 + 3) * 4', () => {
    const { program } = parseSource('(2 + 3) * 4;');
    const root = exprOf(program) as BinaryExpression;
    expect(root.operator).toBe('*');
    expect(root.left.kind).toBe('BinaryExpression');
    expect((root.left as BinaryExpression).operator).toBe('+');
  });

  it('is left-associative for 1 + 2 + 3', () => {
    const { program } = parseSource('1 + 2 + 3;');
    const root = exprOf(program) as BinaryExpression;
    expect(root.operator).toBe('+');
    expect(root.left.kind).toBe('BinaryExpression');
    expect((root.left as BinaryExpression).operator).toBe('+');
  });

  it('parses unary minus before mul', () => {
    const { program } = parseSource('-2 * 3;');
    const root = exprOf(program) as BinaryExpression;
    expect(root.operator).toBe('*');
    expect(root.left.kind).toBe('UnaryExpression');
  });

  it('parses comparison over additive', () => {
    const { program } = parseSource('a > 1 + 2;');
    const root = exprOf(program) as BinaryExpression;
    expect(root.operator).toBe('>');
    expect(root.right.kind).toBe('BinaryExpression');
    expect((root.right as BinaryExpression).operator).toBe('+');
  });

  it('builds if/else and while shapes', () => {
    const { program, errors } = parseSource(
      'if (x > 1) { let a = 1; } else { while (a > 0) { a = a - 1; } }',
    );
    expect(errors).toEqual([]);
    const ifStmt = program.body[0]!;
    expect(ifStmt.kind).toBe('IfStatement');
    if (ifStmt.kind === 'IfStatement') {
      expect(ifStmt.consequent.kind).toBe('BlockStatement');
      expect(ifStmt.alternate?.kind).toBe('BlockStatement');
      if (ifStmt.alternate && ifStmt.alternate.kind === 'BlockStatement') {
        expect(ifStmt.alternate.body[0]?.kind).toBe('WhileStatement');
      }
    }
  });

  it('wraps assignment in ExpressionStatement', () => {
    const { program, errors } = parseSource('x = 1;');
    expect(errors).toEqual([]);
    const stmt = program.body[0]!;
    expect(stmt.kind).toBe('ExpressionStatement');
    if (stmt.kind === 'ExpressionStatement') {
      expect(stmt.expression.kind).toBe('AssignmentExpression');
    }
  });

  it('yields error and partial program when semicolon missing', () => {
    const { program, errors } = parseSource('let x = 1 let y = 2;');
    expect(errors.length).toBeGreaterThan(0);
    expect(program.kind).toBe('Program');
  });
});
