# Appendix A — Defaults, Ranges & Seed Data

Справочник чисел, грамматики TinyScript и seed-данных. Реализации копируют значения в `core/constants/*` **без округления «на глаз»**.

---

## A.1 Компилятор / pipeline

| Константа | Значение |
|-----------|----------|
| `COMPILE_DEBOUNCE_MS` | 80 |
| `MAX_SOURCE_LENGTH` | 50_000 |
| `MAX_TOKENS` | 20_000 |
| `MAX_AST_NODES` | 10_000 |
| `MAX_ERRORS_SHOWN` | 32 |
| `ERROR_RECOVERY_SYNC_KEYWORDS` | `['let','const','if','while','}']` |
| Default `locale` | `'ru'` |
| Default `theme` | `'dark'` |

---

## A.2 Layout / SVG viewport

| Константа | Значение | Смысл |
|-----------|----------|--------|
| `LAYOUT_NODE_WIDTH` | 168 | ширина узла (px, layout-space) |
| `LAYOUT_NODE_HEIGHT` | 56 | высота узла |
| `LAYOUT_HORIZONTAL_GAP` | 28 | зазор между соседними поддеревьями |
| `LAYOUT_VERTICAL_GAP` | 72 | зазор между уровнями |
| `LAYOUT_ROOT_MARGIN_X` | 48 | отступ слева/справа после нормализации |
| `LAYOUT_ROOT_MARGIN_Y` | 40 | отступ сверху |
| `ZOOM_MIN` | 0.25 |
| `ZOOM_MAX` | 3.0 |
| `ZOOM_DEFAULT` | 1.0 |
| `ZOOM_WHEEL_FACTOR` | 0.0015 | множитель `deltaY` |
| `PAN_DEFAULT_X` | 0 |
| `PAN_DEFAULT_Y` | 0 |
| `EDGE_CURVE_RATIO` | 0.45 | доля вертикали для контрольных точек Безье |
| `NODE_CORNER_RADIUS` | 8 |
| `SELECTION_STROKE_WIDTH` | 2.5 |

---

## A.3 Editor UI

| Константа | Значение |
|-----------|----------|
| `EDITOR_MIN_HEIGHT_PX` | 280 |
| `LINE_NUMBER_GUTTER_WIDTH_PX` | 48 |
| `EDITOR_TAB_SIZE` | 2 |
| `EDITOR_FONT` | `'JetBrains Mono', 'Fira Code', 'Consolas', monospace` |
| `EDITOR_FONT_SIZE_PX` | 14 |
| `EDITOR_LINE_HEIGHT` | 1.55 |
| `HIGHLIGHT_SCROLL_PADDING_PX` | 24 |
| `SPLIT_DEFAULT_LEFT_PERCENT` | 42 |
| `SPLIT_MIN_LEFT_PERCENT` | 28 |
| `SPLIT_MAX_LEFT_PERCENT` | 62 |
| `TELEMETRY_MAX_VISIBLE_TOKENS` | 500 |

---

## A.4 TinyScript — ключевые слова и операторы

### Keywords (зарезервированы)

| Lexeme | TokenType |
|--------|-----------|
| `let` | `Keyword` |
| `const` | `Keyword` |
| `if` | `Keyword` |
| `else` | `Keyword` |
| `while` | `Keyword` |

### Operators (лексика; longest-match для `==`)

| Lexeme | TokenType | Примечание |
|--------|-----------|------------|
| `==` | `Operator` | двухсимвольный, приоритет над `=` |
| `=` | `Operator` | присваивание |
| `+` | `Operator` | |
| `-` | `Operator` | бинарный / унарный минус (парсер различает) |
| `*` | `Operator` | |
| `/` | `Operator` | |
| `>` | `Operator` | |
| `<` | `Operator` | |

### Punctuation

| Lexeme | TokenType |
|--------|-----------|
| `;` | `Punctuation` |
| `{` | `Punctuation` |
| `}` | `Punctuation` |
| `(` | `Punctuation` |
| `)` | `Punctuation` |

### Идентификаторы и числа

- Identifier: `[A-Za-z_][A-Za-z0-9_]*` (после match — проверка, не keyword ли).
- Number: десятичные целые и с дробной частью: `[0-9]+(\.[0-9]+)?` (без экспоненты в v1).
- Whitespace: пробел, `\t`, `\r`, `\n` — пропускаются, но обновляют `line`/`column`.
- Комментарии в v1 **не** поддерживаются (символ `/` только как оператор деления).

---

## A.5 AST Node kinds (канон)

| `kind` | Описание |
|--------|----------|
| `Program` | корень: список statements |
| `VariableDeclaration` | `let` / `const` + id + init |
| `AssignmentExpression` | `id = expr` |
| `BinaryExpression` | `left op right` |
| `UnaryExpression` | `-expr` (унарный минус) |
| `Identifier` | имя переменной |
| `NumericLiteral` | числовое значение |
| `IfStatement` | `if (test) consequent [else alternate]` |
| `WhileStatement` | `while (test) body` |
| `BlockStatement` | `{ statements... }` |
| `ExpressionStatement` | expression + `;` |

Каждый узел несёт `id` (стабильный строковый, напр. `n0`, `n1`…), `range: SourceRange` (`start`/`end` offset), опционально `loc: SourceLocation` (line/column).

---

## A.6 Дефолтный исходник (предзагрузка редактора)

Скопируй **буквально** в `DEFAULT_SOURCE` / `appendix` seed:

```tinyscript
let x = 10;
const y = 5;
let total = (x + y) * 2;

if (x > 5) {
  let z = 1;
  while (z < 3) {
    z = z + 1;
    total = total + z;
  }
} else {
  let z = 0;
  total = total - y;
}

let result = total / 2;
```

Пресеты (кнопки / select) — см. A.7.

---

## A.7 Sample presets

| Id | Label RU | Label EN | Содержание (кратко) |
|----|----------|----------|----------------------|
| `default` | Полный пример | Full sample | A.6 целиком |
| `arith` | Арифметика | Arithmetic | `let a = 1 + 2 * 3 - 4 / 2;` |
| `ifelse` | Условия | Conditionals | `if/else` с блоками, без while |
| `while` | Цикл | Loop | `let i = 3; while (i > 0) { i = i - 1; }` |
| `nested` | Вложенность | Nested | if внутри while и наоборот |
| `errors` | Ошибки (демо) | Errors demo | намеренно битый код: `let x = ;` и незакрытая `{` |

Тексты пресетов — полные строки в `core/constants/sample-presets.constants.ts`.

---

## A.8 Цвета токенов / узлов (Monokai-adjacent)

Используй CSS variables из [01-product-vision.md](01-product-vision.md). Семантическая карта:

| Сущность | Variable / цвет |
|----------|-----------------|
| Keyword | `--af-syn-keyword` (#F92672) |
| Identifier | `--af-syn-ident` (#F8F8F2) |
| Number | `--af-syn-number` (#AE81FF) |
| Operator | `--af-syn-operator` (#F92672) |
| Punctuation | `--af-syn-punct` (#75715E) |
| AST Program | `--af-node-program` |
| AST Statement | `--af-node-stmt` |
| AST Expression | `--af-node-expr` |
| AST Literal | `--af-node-literal` |
| Selection | `--af-selection` (#66D9EF) |
| Error | `--af-error` (#FF5555) |

---

## A.9 Сообщения ошибок (ключи i18n + шаблоны)

Храни **ключи**; параметры подставляй в `I18nService.t`.

| Code | Key | Params |
|------|-----|--------|
| `E_UNEXPECTED_CHAR` | `error.unexpectedChar` | `{char}`, `{line}`, `{column}` |
| `E_UNEXPECTED_TOKEN` | `error.unexpectedToken` | `{found}`, `{expected}`, `{line}`, `{column}` |
| `E_EXPECTED` | `error.expected` | `{expected}`, `{line}`, `{column}` |
| `E_UNTERMINATED` | `error.unterminated` | `{what}`, `{line}`, `{column}` |
| `E_SOURCE_TOO_LONG` | `error.sourceTooLong` | `{max}` |
| `E_TOO_MANY_TOKENS` | `error.tooManyTokens` | `{max}` |

---

## A.10 Hotkeys (канон)

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + Enter` | Force recompile (без debounce) |
| `Ctrl/Cmd + S` | Prevent default; no-op save toast optional |
| `Ctrl/Cmd + 1` | Focus editor |
| `Ctrl/Cmd + 2` | Focus AST canvas |
| `Ctrl/Cmd + 0` | Reset zoom/pan |
| `Ctrl/Cmd + =` / `-` | Zoom in / out |
| `G` | Toggle locale RU/EN (не в textarea) |
| `T` | Toggle theme (не в textarea) |
| `?` | Help drawer |
| `Escape` | Clear selection / close help |

---

## A.11 Селектор префикс и имена

| Поле | Значение |
|------|----------|
| App name | `ast-forge` |
| Title | `AST-Forge` |
| Selector prefix | `af` |
| Root component host | `af-root` → thin shell → `af-compiler-workbench` |
