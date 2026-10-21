import type {
  AstNode,
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  Expression,
  ExpressionStatement,
  Identifier,
  IfStatement,
  NumericLiteral,
  Program,
  Statement,
  UnaryExpression,
  VariableDeclaration,
  WhileStatement,
} from '../../features/workbench/compiler.types';

let nextId = 0;

function resetIds(): void {
  nextId = 0;
}

function takeId(): string {
  const id = `n${nextId}`;
  nextId += 1;
  return id;
}

function walk(node: AstNode): void {
  node.id = takeId();
  switch (node.kind) {
    case 'Program':
      for (const stmt of node.body) {
        walk(stmt);
      }
      break;
    case 'VariableDeclaration':
      walk(node.name);
      walk(node.init);
      break;
    case 'AssignmentExpression':
      walk(node.left);
      walk(node.right);
      break;
    case 'BinaryExpression':
      walk(node.left);
      walk(node.right);
      break;
    case 'UnaryExpression':
      walk(node.argument);
      break;
    case 'IfStatement':
      walk(node.test);
      walk(node.consequent);
      if (node.alternate) {
        walk(node.alternate);
      }
      break;
    case 'WhileStatement':
      walk(node.test);
      walk(node.body);
      break;
    case 'BlockStatement':
      for (const stmt of node.body) {
        walk(stmt);
      }
      break;
    case 'ExpressionStatement':
      walk(node.expression);
      break;
    case 'Identifier':
    case 'NumericLiteral':
      break;
  }
}

export function assignIds(program: Program): Program {
  resetIds();
  walk(program);
  return program;
}

export type {
  AssignmentExpression,
  BinaryExpression,
  BlockStatement,
  Expression,
  ExpressionStatement,
  Identifier,
  IfStatement,
  NumericLiteral,
  Statement,
  UnaryExpression,
  VariableDeclaration,
  WhileStatement,
};
