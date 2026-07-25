import {
  LAYOUT_HORIZONTAL_GAP,
  LAYOUT_NODE_HEIGHT,
  LAYOUT_NODE_WIDTH,
  LAYOUT_ROOT_MARGIN_X,
  LAYOUT_ROOT_MARGIN_Y,
  LAYOUT_VERTICAL_GAP,
} from '../../core/constants/layout.constants';
import type {
  AstNode,
  LayoutResult,
  NodeCoordinates,
  Program,
} from '../../models/compiler.types';
import { getChildren } from './source-map';

interface MutablePos {
  x: number;
  y: number;
  depth: number;
}

export function computeLayout(program: Program): LayoutResult {
  const positions = new Map<string, MutablePos>();

  const place = (node: AstNode, depth: number, leftBoundary: number): number => {
    const y =
      LAYOUT_ROOT_MARGIN_Y +
      depth * (LAYOUT_NODE_HEIGHT + LAYOUT_VERTICAL_GAP);
    const kids = getChildren(node);

    if (kids.length === 0) {
      const x = leftBoundary;
      positions.set(node.id, { x, y, depth });
      return x + LAYOUT_NODE_WIDTH;
    }

    let childLeft = leftBoundary;
    let subtreeRight = leftBoundary;
    for (let i = 0; i < kids.length; i++) {
      childLeft = place(kids[i]!, depth + 1, childLeft);
      subtreeRight = childLeft;
      if (i < kids.length - 1) {
        childLeft += LAYOUT_HORIZONTAL_GAP;
      }
    }

    const first = positions.get(kids[0]!.id)!;
    const last = positions.get(kids[kids.length - 1]!.id)!;
    const lastNodeRight = last.x + LAYOUT_NODE_WIDTH;
    const x = (first.x + lastNodeRight) / 2 - LAYOUT_NODE_WIDTH / 2;
    positions.set(node.id, { x, y, depth });
    return Math.max(x + LAYOUT_NODE_WIDTH, subtreeRight);
  };

  place(program, 0, LAYOUT_ROOT_MARGIN_X);

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x + LAYOUT_NODE_WIDTH);
    maxY = Math.max(maxY, pos.y + LAYOUT_NODE_HEIGHT);
  }

  if (!Number.isFinite(minX)) {
    positions.set(program.id, {
      x: LAYOUT_ROOT_MARGIN_X,
      y: LAYOUT_ROOT_MARGIN_Y,
      depth: 0,
    });
    minX = LAYOUT_ROOT_MARGIN_X;
    maxX = LAYOUT_ROOT_MARGIN_X + LAYOUT_NODE_WIDTH;
    maxY = LAYOUT_ROOT_MARGIN_Y + LAYOUT_NODE_HEIGHT;
  }

  const shift = LAYOUT_ROOT_MARGIN_X - minX;
  const result: NodeCoordinates[] = [];

  for (const [nodeId, pos] of positions) {
    const x = pos.x + shift;
    result.push({
      nodeId,
      x,
      y: pos.y,
      width: LAYOUT_NODE_WIDTH,
      height: LAYOUT_NODE_HEIGHT,
      depth: pos.depth,
    });
  }

  const width =
    Math.max(...result.map((p) => p.x + p.width)) + LAYOUT_ROOT_MARGIN_X;
  const height = maxY + LAYOUT_ROOT_MARGIN_Y;

  return { positions: result, width, height };
}
