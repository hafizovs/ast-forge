import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  EDGE_CURVE_RATIO,
  LAYOUT_NODE_HEIGHT,
  LAYOUT_NODE_WIDTH,
  NODE_CORNER_RADIUS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_WHEEL_FACTOR,
} from '../../core/constants/layout.constants';
import { clamp } from '../../domain/math/clamp';
import { getChildren } from '../../domain/compiler/source-map';
import type { AstNode, NodeCoordinates } from '../../models/compiler.types';
import { I18nService } from '../../services/i18n.service';
import { CompilerStore } from '../../state/compiler.store';
import { UiStore } from '../../state/ui.store';

interface PositionedNode {
  id: string;
  kind: string;
  detail: string;
  x: number;
  y: number;
  family: 'program' | 'stmt' | 'expr' | 'literal';
}

interface EdgeView {
  id: string;
  d: string;
}

@Component({
  selector: 'af-ast-visualizer',
  standalone: true,
  templateUrl: './ast-visualizer.component.html',
  styleUrl: './ast-visualizer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AstVisualizerComponent {
  readonly i18n = inject(I18nService);
  private readonly compiler = inject(CompilerStore);
  private readonly ui = inject(UiStore);

  readonly nodeW = LAYOUT_NODE_WIDTH;
  readonly nodeH = LAYOUT_NODE_HEIGHT;
  readonly corner = NODE_CORNER_RADIUS;

  readonly selectedId = this.compiler.selectedNodeId;
  readonly zoom = this.ui.zoom;
  readonly panX = this.ui.panX;
  readonly panY = this.ui.panY;
  readonly errors = this.compiler.errors;
  readonly ast = this.compiler.ast;

  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  readonly worldTransform = computed(
    () =>
      `translate(${this.ui.panX()} ${this.ui.panY()}) scale(${this.ui.zoom()})`,
  );

  readonly positionedNodes = computed((): PositionedNode[] => {
    const ast = this.compiler.ast();
    const layout = this.compiler.layout();
    if (!ast || !layout) {
      return [];
    }
    const byId = new Map(layout.positions.map((p) => [p.nodeId, p]));
    const out: PositionedNode[] = [];
    const visit = (node: AstNode): void => {
      const pos = byId.get(node.id);
      if (pos) {
        out.push({
          id: node.id,
          kind: node.kind,
          detail: this.nodeDetail(node),
          x: pos.x,
          y: pos.y,
          family: this.nodeFamily(node.kind),
        });
      }
      for (const child of getChildren(node)) {
        visit(child);
      }
    };
    visit(ast);
    return out;
  });

  readonly edges = computed((): EdgeView[] => {
    const ast = this.compiler.ast();
    const layout = this.compiler.layout();
    if (!ast || !layout) {
      return [];
    }
    const byId = new Map(layout.positions.map((p) => [p.nodeId, p]));
    const edges: EdgeView[] = [];
    const visit = (node: AstNode): void => {
      const parent = byId.get(node.id);
      for (const child of getChildren(node)) {
        const cpos = byId.get(child.id);
        if (parent && cpos) {
          edges.push({
            id: `${node.id}->${child.id}`,
            d: this.bezier(parent, cpos),
          });
        }
        visit(child);
      }
    };
    visit(ast);
    return edges;
  });

  readonly showPlaceholder = computed(() => {
    const ast = this.compiler.ast();
    return !ast && this.compiler.errors().length > 0;
  });

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const cx = event.clientX - rect.left;
    const cy = event.clientY - rect.top;
    const zoom = this.ui.zoom();
    const panX = this.ui.panX();
    const panY = this.ui.panY();
    const zoomNext = clamp(
      zoom * Math.exp(-event.deltaY * ZOOM_WHEEL_FACTOR),
      ZOOM_MIN,
      ZOOM_MAX,
    );
    const panXNext = cx - ((cx - panX) * zoomNext) / zoom;
    const panYNext = cy - ((cy - panY) * zoomNext) / zoom;
    this.ui.setZoomPan(zoomNext, panXNext, panYNext);
  }

  onPointerDown(event: PointerEvent): void {
    const target = event.target as Element;
    if (target.closest('.af-node')) {
      return;
    }
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.ui.setZoomPan(
      this.ui.zoom(),
      this.ui.panX() + dx,
      this.ui.panY() + dy,
    );
  }

  onPointerUp(event: PointerEvent): void {
    if (this.dragging) {
      this.dragging = false;
      (event.currentTarget as Element).releasePointerCapture?.(event.pointerId);
    }
  }

  onBackgroundClick(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target.closest('.af-node')) {
      this.compiler.clearSelection();
    }
  }

  onNodeClick(nodeId: string, event: Event): void {
    event.stopPropagation();
    this.compiler.selectNode(nodeId, 'graph');
  }

  onNodeKeydown(nodeId: string, event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.compiler.selectNode(nodeId, 'graph');
    }
  }

  private bezier(parent: NodeCoordinates, child: NodeCoordinates): string {
    const x1 = parent.x + LAYOUT_NODE_WIDTH / 2;
    const y1 = parent.y + LAYOUT_NODE_HEIGHT;
    const x2 = child.x + LAYOUT_NODE_WIDTH / 2;
    const y2 = child.y;
    const dy = (y2 - y1) * EDGE_CURVE_RATIO;
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  }

  private nodeDetail(node: AstNode): string {
    switch (node.kind) {
      case 'VariableDeclaration':
        return node.variableKind;
      case 'BinaryExpression':
        return `op: '${node.operator}'`;
      case 'UnaryExpression':
        return `op: '${node.operator}'`;
      case 'Identifier':
        return node.name;
      case 'NumericLiteral':
        return node.raw;
      case 'IfStatement':
        return 'if';
      case 'WhileStatement':
        return 'while';
      case 'BlockStatement':
        return `{${node.body.length}}`;
      case 'Program':
        return 'Program';
      case 'ExpressionStatement':
        return 'expr;';
      case 'AssignmentExpression':
        return '=';
    }
  }

  private nodeFamily(
    kind: string,
  ): 'program' | 'stmt' | 'expr' | 'literal' {
    if (kind === 'Program') {
      return 'program';
    }
    if (
      kind === 'VariableDeclaration' ||
      kind === 'IfStatement' ||
      kind === 'WhileStatement' ||
      kind === 'BlockStatement' ||
      kind === 'ExpressionStatement'
    ) {
      return 'stmt';
    }
    if (kind === 'NumericLiteral') {
      return 'literal';
    }
    return 'expr';
  }
}
