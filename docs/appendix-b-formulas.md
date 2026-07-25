# Appendix B — Formulas & Algorithms

Справочник алгоритмов компилятора и раскладки дерева. Реализации — в `domain/compiler/**` согласно [04-compiler-engine.md](04-compiler-engine.md) и [05-ast-visuals.md](05-ast-visuals.md).

---

## B.1 Обозначения

| Symbol | Meaning |
|--------|---------|
| \(S\) | исходная строка |
| \(i\) | текущий индекс лексера (0-based offset) |
| \(T\) | массив токенов |
| \(p\) | индекс текущего токена парсера |
| \(\mathrm{prec}(op)\) | приоритет оператора |
| \(n\) | узел AST |
| \(w(n)\) | ширина поддерева \(n\) в layout-space |
| \((x_n, y_n)\) | координаты центра (или top-left — зафиксируй top-left узла) узла \(n\) |

**Канон координат:** `x,y` — **верхний левый угол** прямоугольника узла в layout-space; SVG `transform` применяет pan/zoom поверх.

---

## B.2 Lexer — посимвольный обход

### Инварианты
1. Пробельные символы пропускаются с обновлением `line`/`column`.
2. Longest match: перед `=` проверить `==`.
3. Keyword vs Identifier: после match идентификатора — lookup в множестве keywords.
4. При неизвестном символе: добавить `CompilerError` с `offset=i`, `line`, `column`, `code='E_UNEXPECTED_CHAR'`; **продвинуть** `i += 1` (recovery) и продолжить, либо остановить токенизацию — **канон: продолжить** после ошибки, чтобы telemetry оставалась полезной.
5. В конец массива токенов **не** обязан EOF-токен; парсер использует `p >= tokens.length` как EOF. Если удобнее — добавь `EOF` токен; тогда документируй в types и используй последовательно.

### Псевдокод

```
tokenize(S):
  tokens = []
  errors = []
  i = 0; line = 1; column = 1
  while i < S.length:
    ch = S[i]
    if isWhitespace(ch):
      advance whitespace; continue
    start = { offset: i, line, column }
    if isAlpha(ch) or ch == '_':
      lexeme = readWhile(isIdentContinue)
      type = KEYWORDS.has(lexeme) ? Keyword : Identifier
      push Token(type, lexeme, start, end)
      continue
    if isDigit(ch):
      lexeme = readNumber()  // digits, optional . digits
      push Token(Number, lexeme, ...)
      continue
    if ch == '=' and peek == '=':
      push Operator '=='; advance 2; continue
    if ch in singleOperators:  // = + - * / > <
      push Operator; advance 1; continue
    if ch in punctuation:      // ; { } ( )
      push Punctuation; advance 1; continue
    errors.push(unexpectedChar(ch, start))
    advance 1
  return { tokens, errors }
```

### Number edge cases
- `12.34` — один Number.
- `12.` — **канон:** ошибка или Number `12` + unexpected `.` — выбери: **ошибка `E_UNEXPECTED_CHAR` на `.` после целой части без дробных цифр**, либо не потребляй `.` без цифр. Зафиксируй в коде: **требуй хотя бы одну цифру после `.`**.
- Ведущая точка `.5` — не число; `.` → unexpected (нет оператора `.` в языке).

---

## B.3 Таблица приоритетов операторов

Чем **больше** число — тем **сильнее** связность (как в Pratt / precedence climbing).

| Operator | Precedence | Associativity | Роль |
|----------|------------|---------------|------|
| `*` `/` | 30 | left | multiplicative |
| `+` `-` (binary) | 20 | left | additive |
| `>` `<` `==` | 10 | left | comparison |
| `=` (assignment) | 5 | right | только в statement/assignment form |

**Унарный `-`:** приоритет **35** (выше multiplicative); парсится в `parseUnary` / primary prefix.

**Не путать:** assignment `=` не является частью `parseBinaryExpression` общего expression-climbing для условий — в TinyScript:
- В `let`/`const` init и в правой части assignment — expression **без** top-level `=`.
- Assignment statement: `Identifier = Expression`.

---

## B.4 Recursive Descent — структура методов

Обязательный набор (имена могут совпадать 1:1):

```
parse(tokens) -> { program: Program, errors: CompilerError[] }

parseProgram()
parseStatement()
parseVariableDeclaration()
parseIfStatement()
parseWhileStatement()
parseBlockStatement()
parseAssignmentOrExpressionStatement()
parseExpression()          // entry → parseBinaryExpression(0) или parsePrecedence(0)
parseBinaryExpression(minPrec)
parseUnary()
parsePrimary()
```

### Грамматика (упрощённый EBNF)

```
program        = { statement }
statement      = variableDecl | ifStmt | whileStmt | block | assignStmt | exprStmt
variableDecl   = ("let" | "const") IDENT "=" expression ";"
ifStmt         = "if" "(" expression ")" statement [ "else" statement ]
whileStmt      = "while" "(" expression ")" statement
block          = "{" { statement } "}"
assignStmt     = IDENT "=" expression ";"
exprStmt       = expression ";"
expression     = binary
binary         = unary { (binaryOp) unary }   // с учётом precedence
unary          = "-" unary | primary
primary        = NUMBER | IDENT | "(" expression ")"
```

`statement` после `if`/`while` может быть `block` или одиночный statement (канон C-like).

---

## B.5 Precedence climbing (канон для binary)

```
parseBinaryExpression(minPrec):
  left = parseUnary()
  while true:
    op = current operator token if any
    if !op or prec(op) < minPrec: break
    nextMin = prec(op) + (assoc(op) == left ? 1 : 0)
    consume op
    right = parseBinaryExpression(nextMin)
    left = BinaryExpression(op, left, right, range=span(left,right))
  return left
```

### Тест-оракулы структуры

| Source | Ожидаемый корень expression |
|--------|-----------------------------|
| `2 + 3 * 4` | `+(2, *(3,4))` |
| `(2 + 3) * 4` | `*(+(2,3), 4)` |
| `1 + 2 + 3` | `+(+(1,2), 3)` left-assoc |
| `-2 * 3` | `*(-(2), 3)` |
| `a > 1 + 2` | `>(a, +(1,2))` |

---

## B.6 Error recovery (парсер)

1. Любая `expect(type/lexeme)` при mismatch → push `CompilerError`, **не throw наружу UI**.
2. Внутренне допустим throw `ParseError` внутри сервиса, пойманный в `parse()` → errors[].
3. Recovery: `synchronize()` — advance tokens until `;` или keyword из `ERROR_RECOVERY_SYNC_KEYWORDS` или EOF; затем продолжить `parseStatement` в `parseProgram`.
4. При ошибке всё равно верни **частичный** `Program` (уже распознанные statements) + `errors`. Layout строится только если `errors` пуст **или** по канону: layout для partial AST **разрешён** — **канон: layout для partial Program**, visualizer показывает что есть; errors panel красная.

---

## B.7 Source ranges

Каждый узел:

\[
\mathrm{range} = [\mathrm{startOffset},\, \mathrm{endOffset})
\]

- Листья: offsets из токенов.
- Внутренние: `start = leftmost child/token`, `end = rightmost`.
- Подсветка редактора: `substring(start, end)` / CSS highlight overlay по offsets.

---

## B.8 Tree Layout — subtree width (канон)

Упрощённый алгоритм без наложений (достаточен и обязателен; полный Reingold–Tilford допустим как улучшение **поверх** тех же констант).

### Шаг 1 — назначить `id` и детей

`children(n)` зависит от `kind`:

| kind | children order |
|------|----------------|
| Program | body[] |
| VariableDeclaration | [id, init] |
| AssignmentExpression | [left, right] |
| BinaryExpression | [left, right] |
| UnaryExpression | [argument] |
| IfStatement | [test, consequent] + optional alternate |
| WhileStatement | [test, body] |
| BlockStatement | body[] |
| ExpressionStatement | [expression] |
| Identifier / NumericLiteral | [] |

### Шаг 2 — ширина поддерева

```
leafWidth = LAYOUT_NODE_WIDTH

width(n):
  kids = children(n)
  if kids empty: return leafWidth
  return sum(width(k) for k in kids) + LAYOUT_HORIZONTAL_GAP * (kids.length - 1)
```

Мемоизируй в Map.

### Шаг 3 — назначить координаты (левый→правый pre-order по уровням)

```
layout(n, leftX, depth):
  kids = children(n)
  y = LAYOUT_ROOT_MARGIN_Y + depth * (LAYOUT_NODE_HEIGHT + LAYOUT_VERTICAL_GAP)
  if kids empty:
    x = leftX
    assign n -> (x, y)
    return leftX + LAYOUT_NODE_WIDTH
  // разместить детей подряд начиная с leftX
  cursor = leftX
  childCenters = []
  for k in kids:
    cursor = layout(k, cursor, depth + 1)
    childCenters.push(centerX(k))
    cursor += LAYOUT_HORIZONTAL_GAP  // между детьми; последний gap не нужен — аккуратно
  // поправить: gap только между детьми
  x = midpoint(firstChild.left, lastChild.right) - LAYOUT_NODE_WIDTH/2
  // или: x = average(childCenters) - LAYOUT_NODE_WIDTH/2
  assign n -> (x, y)
  return max(right edge of n, right edge of kids)
```

Уточнённый канон (реализуй **этот**):

```
place(n, depth, leftBoundary) -> rightBoundary:
  y = MARGIN_Y + depth * (H + VGAP)
  kids = children(n)
  if no kids:
    x = leftBoundary
    set(n, x, y)
    return x + NODE_W

  childLeft = leftBoundary
  rights = []
  for i, k in kids:
    childLeft = place(k, depth+1, childLeft)
    rights.push(childLeft)
    if i < kids.length - 1:
      childLeft += HGAP

  firstX = get(kids[0]).x
  lastRight = get(kids[last]).x + NODE_W
  x = (firstX + lastRight) / 2 - NODE_W / 2
  set(n, x, y)
  return max(x + NODE_W, lastRight)
```

После полного обхода: если минимальный `x < MARGIN_X`, сдвинь **все** узлы на `MARGIN_X - minX` (нормализация).

### Инвариант приёмки
Для любых двух узлов на одном `depth`: интервалы `[x, x+NODE_W]` не пересекаются (допуск 0.5 px).

---

## B.9 SVG рёбра (кубическая Безье)

От низа родителя к верху ребёнка:

```
x1 = parent.x + NODE_W/2
y1 = parent.y + NODE_H
x2 = child.x + NODE_W/2
y2 = child.y
dy = (y2 - y1) * EDGE_CURVE_RATIO
path = M x1 y1 C x1 (y1+dy), x2 (y2-dy), x2 y2
```

---

## B.10 Zoom / Pan (экранные координаты)

```
screen = layout * zoom + pan

// wheel at cursor (cx, cy) in SVG client space:
zoom' = clamp(zoom * exp(-deltaY * ZOOM_WHEEL_FACTOR), ZOOM_MIN, ZOOM_MAX)
pan' = cx - (cx - pan) * (zoom' / zoom)   // аналогично для y
// точнее:
panX' = cx - (cx - panX) * (zoom' / zoom)
panY' = cy - (cy - panY) * (zoom' / zoom)

// drag:
panX += dx; panY += dy
```

Храни `zoom`, `panX`, `panY` в Signals (`ui.store` или `visualizer` local signals, синхронизируемые с store).

---

## B.11 Hit-test узел

Клик в SVG (с учётом CTM / inverse transform pan-zoom):

```
lx = (clientX - panX) / zoom
ly = (clientY - panY) / zoom
hit = nodes.find(n => lx in [n.x, n.x+W] && ly in [n.y, n.y+H])
```

---

## B.12 Selection mapping код ↔ AST

1. Узел → код: highlight `[node.range.start, node.range.end)`.
2. Каретка/выделение в редакторе с offset `o` → найти **наименьший** узел, чей range содержит `o` (или пересекается с selection). При равном размере — более глубокий.
3. Алгоритм: обход дерева, собрать кандидатов `start <= o < end`, выбрать с минимальным `(end-start)`, tie-break max depth.

---

## B.13 Pipeline компиляции (единый)

```
source$ (signal)
  → debounce COMPILE_DEBOUNCE_MS (effect / explicit)
  → lexer.tokenize(source)
  → parser.parse(tokens)
  → if program: layout.compute(program)
  → store.update({ tokens, ast, positions, errors })
```

UI подписан только на store signals.
