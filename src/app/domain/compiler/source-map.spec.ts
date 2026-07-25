import { describe, expect, it } from 'vitest';
import type { BinaryExpression, ExpressionStatement } from '../../models/compiler.types';
import { tokenize } from './lexer';
import { parse } from './parser';
import { findSmallestNode } from './source-map';

describe('findSmallestNode', () => {
  it('finds nested binary expression for inner offset', () => {
    const source = 'let t = (x + y) * 2;';
    const { tokens } = tokenize(source);
    const { program } = parse(tokens);
    const decl = program.body[0]!;
    expect(decl.kind).toBe('VariableDeclaration');
    if (decl.kind !== 'VariableDeclaration') {
      return;
    }
    const mul = decl.init as BinaryExpression;
    expect(mul.operator).toBe('*');
    const add = mul.left as BinaryExpression;
    expect(add.operator).toBe('+');

    const offsetInsidePlus = add.range.start + 1;
    const found = findSmallestNode(program, offsetInsidePlus);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(add.id);
  });

  it('selects identifier leaf inside assignment', () => {
    const source = 'x = 10;';
    const { tokens } = tokenize(source);
    const { program } = parse(tokens);
    const stmt = program.body[0] as ExpressionStatement;
    const assign = stmt.expression;
    expect(assign.kind).toBe('AssignmentExpression');
    if (assign.kind !== 'AssignmentExpression') {
      return;
    }
    const offset = assign.left.range.start;
    const found = findSmallestNode(program, offset);
    expect(found?.kind).toBe('Identifier');
    expect(found?.id).toBe(assign.left.id);
  });
});
