import { describe, expect, it } from 'vitest';
import { LAYOUT_NODE_WIDTH } from '../../core/constants/layout.constants';
import { DEFAULT_SOURCE } from '../../core/constants/sample-presets.constants';
import { tokenize } from './lexer';
import { computeLayout } from './layout-engine';
import { parse } from './parser';
import { getChildren } from './source-map';

describe('computeLayout', () => {
  it('places empty program with margins', () => {
    const { program } = parse([]);
    const layout = computeLayout(program);
    expect(layout.positions.length).toBe(1);
    expect(layout.positions[0]!.depth).toBe(0);
    expect(layout.positions[0]!.nodeId).toBe(program.id);
  });

  it('includes all node ids', () => {
    const { tokens } = tokenize(DEFAULT_SOURCE);
    const { program } = parse(tokens);
    const layout = computeLayout(program);
    const ids = new Set<string>();
    const visit = (n: typeof program): void => {
      ids.add(n.id);
      for (const c of getChildren(n)) {
        visit(c as typeof program);
      }
    };
    visit(program);
    expect(layout.positions.length).toBe(ids.size);
    for (const id of ids) {
      expect(layout.positions.some((p) => p.nodeId === id)).toBe(true);
    }
  });

  it('does not overlap nodes on the same depth', () => {
    const { tokens } = tokenize(DEFAULT_SOURCE);
    const { program } = parse(tokens);
    const layout = computeLayout(program);
    const byDepth = new Map<number, typeof layout.positions>();
    for (const pos of layout.positions) {
      const list = byDepth.get(pos.depth) ?? [];
      list.push(pos);
      byDepth.set(pos.depth, list);
    }
    for (const [, nodes] of byDepth) {
      const sorted = [...nodes].sort((a, b) => a.x - b.x);
      for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i]!;
        const b = sorted[i + 1]!;
        expect(a.x + LAYOUT_NODE_WIDTH).toBeLessThanOrEqual(b.x + 0.5);
      }
    }
  });

  it('assigns child depth = parent depth + 1', () => {
    const { tokens } = tokenize('let x = 1 + 2;');
    const { program } = parse(tokens);
    const layout = computeLayout(program);
    const map = new Map(layout.positions.map((p) => [p.nodeId, p]));
    const visit = (node: typeof program, parentDepth: number | null): void => {
      const pos = map.get(node.id)!;
      if (parentDepth === null) {
        expect(pos.depth).toBe(0);
      } else {
        expect(pos.depth).toBe(parentDepth + 1);
      }
      for (const child of getChildren(node)) {
        visit(child as typeof program, pos.depth);
      }
    };
    visit(program, null);
  });
});
