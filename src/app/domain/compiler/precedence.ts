import type {
  BinaryOperator,
} from '../../models/compiler.types';

const BINARY_PRECEDENCE: Record<BinaryOperator, number> = {
  '*': 30,
  '/': 30,
  '+': 20,
  '-': 20,
  '>': 10,
  '<': 10,
  '==': 10,
};

export const UNARY_PRECEDENCE = 35;
export const ASSIGNMENT_PRECEDENCE = 5;

export function isBinaryOperator(value: string): value is BinaryOperator {
  return (
    value === '+' ||
    value === '-' ||
    value === '*' ||
    value === '/' ||
    value === '>' ||
    value === '<' ||
    value === '=='
  );
}

export function getPrecedence(op: BinaryOperator): number {
  return BINARY_PRECEDENCE[op];
}

export function isLeftAssociative(op: BinaryOperator): boolean {
  return op !== undefined;
}

export function nextMinPrecedence(op: BinaryOperator): number {
  const prec = getPrecedence(op);
  return isLeftAssociative(op) ? prec + 1 : prec;
}
