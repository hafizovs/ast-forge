import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_SOURCE,
  SAMPLE_PRESETS,
} from '../core/constants/sample-presets.constants';
import type {
  CompileResult,
  LayoutResult,
  NodeCoordinates,
  Program,
  SamplePresetId,
  SourceRange,
  Token,
  CompilerError,
} from '../models/compiler.types';
import { findNodeById, findSmallestNode } from '../domain/compiler/source-map';

@Injectable({ providedIn: 'root' })
export class CompilerStore {
  readonly source = signal<string>(DEFAULT_SOURCE);
  readonly tokens = signal<Token[]>([]);
  readonly ast = signal<Program | null>(null);
  readonly layout = signal<LayoutResult | null>(null);
  readonly errors = signal<CompilerError[]>([]);
  readonly selectedNodeId = signal<string | null>(null);
  readonly highlightRange = signal<SourceRange | null>(null);
  readonly selectionOrigin = signal<'editor' | 'graph' | null>(null);
  readonly compileDurationMs = signal(0);
  readonly isCompiling = signal(false);

  readonly positionsMap = computed(() => {
    const map = new Map<string, NodeCoordinates>();
    const layout = this.layout();
    if (!layout) {
      return map;
    }
    for (const pos of layout.positions) {
      map.set(pos.nodeId, pos);
    }
    return map;
  });

  setSource(value: string): void {
    this.source.set(value);
    this.clearSelection();
  }

  loadPreset(id: SamplePresetId): void {
    const text = SAMPLE_PRESETS[id] ?? DEFAULT_SOURCE;
    this.source.set(text);
    this.clearSelection();
  }

  applyCompileResult(result: CompileResult): void {
    this.tokens.set(result.tokens);
    this.ast.set(result.ast);
    this.layout.set(result.layout);
    this.errors.set(result.errors);
    this.compileDurationMs.set(result.durationMs);
    this.isCompiling.set(false);
  }

  selectNode(nodeId: string, origin: 'editor' | 'graph' = 'graph'): void {
    const node = findNodeById(this.ast(), nodeId);
    if (!node) {
      return;
    }
    this.selectedNodeId.set(nodeId);
    this.highlightRange.set({ ...node.range });
    this.selectionOrigin.set(origin);
  }

  selectOffset(offset: number): void {
    const node = findSmallestNode(this.ast(), offset);
    if (!node) {
      this.clearSelection();
      return;
    }
    this.selectedNodeId.set(node.id);
    this.highlightRange.set({ ...node.range });
    this.selectionOrigin.set('editor');
  }

  selectRange(range: SourceRange, preferOffset?: number): void {
    const offset =
      preferOffset ?? Math.floor((range.start + Math.max(range.end - 1, range.start)) / 2);
    const node = findSmallestNode(this.ast(), offset);
    this.highlightRange.set({ ...range });
    this.selectionOrigin.set('editor');
    this.selectedNodeId.set(node?.id ?? null);
  }

  clearSelection(): void {
    this.selectedNodeId.set(null);
    this.highlightRange.set(null);
    this.selectionOrigin.set(null);
  }
}
