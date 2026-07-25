# 05 — AST Visuals (Layout Engine + SVG)

Реализуй раскладку дерева и интерактивный SVG-холст. **Только чистый SVG** (не Canvas, не D3). Константы — из [appendix-a-defaults.md](appendix-a-defaults.md). Алгоритмы — из [appendix-b-formulas.md](appendix-b-formulas.md) §B.8–B.11.

---

## 5.1 Файлы

| Файл | Назначение |
|------|------------|
| `domain/compiler/layout-engine.ts` | `computeLayout(program): LayoutResult` |
| `domain/compiler/layout-engine.spec.ts` | non-overlap, bounding box, depths |
| `services/layout.service.ts` | DI-обёртка |
| `components/ast-visualizer/ast-visualizer.component.*` | SVG, zoom/pan, hit-test, selection |

---

## 5.2 Layout Engine

### API

```ts
export function computeLayout(program: Program): LayoutResult
```

### Требования
1. Реализуй subtree-width placement из Appendix B §B.8 (канон). Полный Reingold–Tilford допустим, если даёт те же инварианты и использует те же константы размеров/зазоров.
2. Для каждого узла дерева — запись `NodeCoordinates` с `nodeId`, `x`, `y`, `width=LAYOUT_NODE_WIDTH`, `height=LAYOUT_NODE_HEIGHT`, `depth`.
3. Порядок детей — канонический из §B.8 таблицы `children(n)`.
4. После размещения — нормализация `minX` → сдвиг к `LAYOUT_ROOT_MARGIN_X`.
5. `LayoutResult.width/height` = bounding box всех узлов + margins.
6. Пустой `Program.body` → один узел Program в origin с margins.
7. Не мутируй AST (или мутируй только если явно копируешь — **канон: не мутируй**, верни отдельный positions массив).

### Инварианты тестов
- На одном depth интервалы `[x, x+W]` не пересекаются.
- `depth(root)=0`; child depth = parent+1.
- Все `nodeId` из AST присутствуют в positions.

---

## 5.3 AstVisualizerComponent

### Входы / выходы (signals API)

```ts
// читает из stores через inject — input() необязателен
// либо:
ast = input<Program | null>()
positions = input<NodeCoordinates[]>()
selectedNodeId = input<string | null>()
nodeSelect = output<string>()
```

**Канон:** inject `CompilerStore` + `UiStore` напрямую (как workbench children), чтобы не прокидывать всё через дерево — допустимо.

### SVG структура

```html
<svg class="af-ast-svg" (wheel)="onWheel($event)" (pointerdown)="..." ...>
  <g [attr.transform]="worldTransform()">
    @for (edge of edges(); track edge.id) {
      <path [attr.d]="edge.d" class="af-edge" />
    }
    @for (node of positionedNodes(); track node.id) {
      <g class="af-node"
         [class.af-node--selected]="node.id === selectedId()"
         [attr.transform]="'translate(' + node.x + ',' + node.y + ')'"
         (click)="onNodeClick(node.id, $event)">
        <rect [attr.width]="W" [attr.height]="H" rx="8" />
        <text class="af-node__kind">{{ node.kind }}</text>
        <text class="af-node__detail">{{ node.detail }}</text>
      </g>
    }
  </g>
</svg>
```

### Подписи узлов (`detail`)
| kind | detail |
|------|--------|
| VariableDeclaration | `let` / `const` |
| BinaryExpression | `op: '+'` и т.п. |
| UnaryExpression | `op: '-'` |
| Identifier | `name` |
| NumericLiteral | raw/value |
| IfStatement | `if` |
| WhileStatement | `while` |
| BlockStatement | `{…}` / `N stmts` |
| Program | `Program` |
| ExpressionStatement | `expr;` |
| AssignmentExpression | `=` |

### Рёбра
Построй список edges из parent→child по `children()`; path — кубическая Безье §B.9.

### Цвет узла
Класс по семейству: Program / Statement / Expression / Literal — CSS variables из 01.

---

## 5.4 Zoom & Pan (Signals)

Состояние в `UiStore`: `zoom`, `panX`, `panY`.

1. **Wheel:** `preventDefault`, zoom к курсору (§B.10), clamp `[ZOOM_MIN, ZOOM_MAX]`.
2. **Pan:** pointerdown на фоне SVG (не на узле) → pointermove → pointerup/cancel; используй `setPointerCapture`.
3. **Reset:** hotkey / toolbar → `zoom=1`, `pan=0`.
4. `worldTransform = translate(panX, panY) scale(zoom)`.

Не используй native SVG `viewBox` zoom как единственный механизм — допустим комбинированный подход, но pan/zoom signals обязательны.

---

## 5.5 Selection & hit-test

1. Click по узлу → `compilerStore.selectNode(id)` → `highlightRange = node.range`, `origin='graph'`.
2. Click по пустому SVG → `clearSelection`.
3. Selected node: обводка `--af-selection`, лёгкий glow (motion из 01).
4. Hit-test с учётом inverse zoom/pan (§B.11).

---

## 5.6 Empty / error states

1. `ast === null` и есть errors → показать placeholder текст i18n `visualizer.noAst` поверх тёмного canvas (не ломай SVG shell).
2. Partial AST при errors — **рисовать** (канон Appendix B).
3. Пока source пуст — рисуй пустой Program.

---

## 5.7 Performance

1. Не пересоздавай SVG path строки без необходимости — `computed()` от ast+positions.
2. `@for` с `track node.id`.
3. На огромных деревьях (&gt; 500 узлов) всё ещё работай корректно; виртуализация не обязательна.

---

## 5.8 Запреты

1. Нет D3, Cytoscape, dagre, Konva.
2. Нет Canvas 2D для дерева.
3. Нет фиксированных «ручных» координат для демо-дерева — только engine.
4. Нет карточек-оверлеев поверх узлов с badge-спамом.
