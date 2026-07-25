# 03 — Data Model & Units

Все интерфейсы ниже реализуй **буквально**. Числовые диапазоны и дефолты — в [appendix-a-defaults.md](appendix-a-defaults.md); скопируй значения в `*.constants.ts` без «примерно».

Канонический файл агрегата типов: `src/app/models/compiler.types.ts` (обязан существовать и экспортировать публичные типы компилятора).

---

## 3.1 Единицы и понятия

| Величина | Единица | Пояснение |
|----------|---------|-----------|
| Source offset | UTF-16 code unit index (JS string index) | 0-based, half-open ranges |
| Line / column | 1-based | для сообщений об ошибках |
| Layout x/y | CSS px в layout-space | до zoom/pan |
| Zoom | multiplier | 0.25…3.0 |
| Pan | px screen-space | translation после scale |
| Token index | integer ≥ 0 | позиция в массиве tokens |
| AST node id | string | стабильный в пределах одного compile (`n0`…) |
| Compile duration | ms | измерить `performance.now()` вокруг pipeline |

---

## 3.2 Идентификаторы и enum/union типы

```ts
export type TokenType =
  | 'Keyword'
  | 'Identifier'
  | 'Number'
  | 'Operator'
  | 'Punctuation';

export type AstKind =
  | 'Program'
  | 'VariableDeclaration'
  | 'AssignmentExpression'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'Identifier'
  | 'NumericLiteral'
  | 'IfStatement'
  | 'WhileStatement'
  | 'BlockStatement'
  | 'ExpressionStatement';

export type BinaryOperator = '+' | '-' | '*' | '/' | '>' | '<' | '==';

export type UnaryOperator = '-';

export type VariableKind = 'let' | 'const';

export type CompilerErrorCode =
  | 'E_UNEXPECTED_CHAR'
  | 'E_UNEXPECTED_TOKEN'
  | 'E_EXPECTED'
  | 'E_UNTERMINATED'
  | 'E_SOURCE_TOO_LONG'
  | 'E_TOO_MANY_TOKENS';

export type TelemetryTab = 'tokens' | 'errors' | 'summary';

export type ThemeId = 'dark' | 'light';

export type LocaleId = 'ru' | 'en';

export type SamplePresetId =
  | 'default'
  | 'arith'
  | 'ifelse'
  | 'while'
  | 'nested'
  | 'errors';
```

---

## 3.3 Source positions

```ts
export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceRange {
  start: number; // inclusive offset
  end: number;   // exclusive offset
}

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}
```

---

## 3.4 Token

```ts
export interface Token {
  type: TokenType;
  value: string;
  range: SourceRange;
  loc: SourceLocation;
}
```

---

## 3.5 CompilerError

```ts
export interface CompilerError {
  code: CompilerErrorCode;
  messageKey: string;      // i18n key
  messageParams?: Record<string, string | number>;
  range?: SourceRange;
  loc?: SourceLocation;
  phase: 'lex' | 'parse' | 'layout';
}
```

UI показывает `i18n.t(messageKey, messageParams)`; дополнительно можно хранить уже отформатированный `message` на момент compile — **канон: key + params**, форматирование при рендере.

---

## 3.6 AST nodes

Базовый хвост:

```ts
export interface AstNodeBase {
  id: string;
  kind: AstKind;
  range: SourceRange;
  loc: SourceLocation;
}

export interface Program extends AstNodeBase {
  kind: 'Program';
  body: Statement[];
}

export type Statement =
  | VariableDeclaration
  | IfStatement
  | WhileStatement
  | BlockStatement
  | ExpressionStatement
  | AssignmentExpressionStatement;

/** Assignment as statement wrapper OR dedicated kind — канон ниже */
export interface ExpressionStatement extends AstNodeBase {
  kind: 'ExpressionStatement';
  expression: Expression;
}

export interface VariableDeclaration extends AstNodeBase {
  kind: 'VariableDeclaration';
  variableKind: VariableKind;
  id: Identifier;
  init: Expression;
}

export interface IfStatement extends AstNodeBase {
  kind: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface WhileStatement extends AstNodeBase {
  kind: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface BlockStatement extends AstNodeBase {
  kind: 'BlockStatement';
  body: Statement[];
}

export interface AssignmentExpression extends AstNodeBase {
  kind: 'AssignmentExpression';
  left: Identifier;
  right: Expression;
}

/** Для `x = 1;` используй ExpressionStatement { expression: AssignmentExpression } */
/** Альтернатива запрещена: не плоди два способа. */

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | Identifier
  | NumericLiteral;

export interface BinaryExpression extends AstNodeBase {
  kind: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends AstNodeBase {
  kind: 'UnaryExpression';
  operator: UnaryOperator;
  argument: Expression;
}

export interface Identifier extends AstNodeBase {
  kind: 'Identifier';
  name: string;
}

export interface NumericLiteral extends AstNodeBase {
  kind: 'NumericLiteral';
  value: number;
  raw: string;
}

export type AstNode =
  | Program
  | Statement
  | Expression;
```

Уточнение Statement: `AssignmentExpression` **не** входит в `Statement` напрямую — только через `ExpressionStatement`. Обнови union:

```ts
export type Statement =
  | VariableDeclaration
  | IfStatement
  | WhileStatement
  | BlockStatement
  | ExpressionStatement;
```

В `compiler.types.ts` экспортируй type guards: `isProgram`, `isExpression`, `isStatement`.

---

## 3.7 Layout coordinates

```ts
export interface NodeCoordinates {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface LayoutResult {
  positions: NodeCoordinates[];
  width: number;   // bounding box
  height: number;
}
```

Store может держать `Map<string, NodeCoordinates>` для O(1) lookup.

---

## 3.8 Compile result

```ts
export interface CompileResult {
  tokens: Token[];
  ast: Program | null;
  layout: LayoutResult | null;
  errors: CompilerError[];
  durationMs: number;
}
```

---

## 3.9 Selection state

```ts
export interface SelectionState {
  nodeId: string | null;
  highlightRange: SourceRange | null;
  origin: 'editor' | 'graph' | null;
}
```

---

## 3.10 Invariants

1. Для каждого Token: `range.end > range.start`, `loc` согласован с offsets.
2. Для каждого AstNode: `range` покрывает все дочерние ranges.
3. `NumericLiteral.value === Number(raw)` для валидных чисел.
4. `Program.body` может быть `[]` на пустом вводе без ошибок.
5. Пустой source → tokens `[]`, ast `Program` с `body: []`, errors `[]`.
6. При `E_SOURCE_TOO_LONG` — не токенизировать дальше; верни ошибку.
