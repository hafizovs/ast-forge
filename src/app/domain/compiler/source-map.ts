import type {
  AstNode,
  Expression,
  Program,
  Statement,
} from '../../features/workbench/compiler.types';

export function getChildren(node: AstNode): AstNode[] {
  switch (node.kind) {
    case 'Program':
      return [...node.body];
    case 'VariableDeclaration':
      return [node.name, node.init];
    case 'AssignmentExpression':
      return [node.left, node.right];
    case 'BinaryExpression':
      return [node.left, node.right];
    case 'UnaryExpression':
      return [node.argument];
    case 'IfStatement': {
      const kids: AstNode[] = [node.test, node.consequent];
      if (node.alternate) {
        kids.push(node.alternate);
      }
      return kids;
    }
    case 'WhileStatement':
      return [node.test, node.body];
    case 'BlockStatement':
      return [...node.body];
    case 'ExpressionStatement':
      return [node.expression];
    case 'Identifier':
    case 'NumericLiteral':
      return [];
  }
}

export function findSmallestNode(
  program: Program | null,
  offset: number,
): AstNode | null {
  if (!program) {
    return null;
  }

  let best: AstNode | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  let bestDepth = -1;

  const visit = (node: AstNode, depth: number): void => {
    const { start, end } = node.range;
    const covers =
      (start <= offset && offset < end) || (start === end && offset === start);

    if (covers) {
      const size = Math.max(0, end - start);
      if (size < bestSize || (size === bestSize && depth > bestDepth)) {
        best = node;
        bestSize = size;
        bestDepth = depth;
      }
    }

    for (const child of getChildren(node)) {
      visit(child, depth + 1);
    }
  };

  visit(program, 0);
  return best;
}

export function findNodeById(
  program: Program | null,
  nodeId: string,
): AstNode | null {
  if (!program) {
    return null;
  }
  const visit = (node: AstNode): AstNode | null => {
    if (node.id === nodeId) {
      return node;
    }
    for (const child of getChildren(node)) {
      const found = visit(child);
      if (found) {
        return found;
      }
    }
    return null;
  };
  return visit(program);
}

export function countNodes(program: Program | null): number {
  if (!program) {
    return 0;
  }
  let count = 0;
  const visit = (node: AstNode): void => {
    count += 1;
    for (const child of getChildren(node)) {
      visit(child);
    }
  };
  visit(program);
  return count;
}

export function maxDepth(program: Program | null): number {
  if (!program) {
    return 0;
  }
  const visit = (node: AstNode, depth: number): number => {
    const kids = getChildren(node);
    if (kids.length === 0) {
      return depth;
    }
    let max = depth;
    for (const child of kids) {
      max = Math.max(max, visit(child, depth + 1));
    }
    return max;
  };
  return visit(program, 0);
}

export function countByKind(program: Program | null): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!program) {
    return counts;
  }
  const visit = (node: AstNode): void => {
    counts[node.kind] = (counts[node.kind] ?? 0) + 1;
    for (const child of getChildren(node)) {
      visit(child);
    }
  };
  visit(program);
  return counts;
}

export type { Expression, Statement };
