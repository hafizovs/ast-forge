# 04 — Compiler Engine (Lexer + Parser)

Реализуй компиляторный frontend **точно** по этому документу и [appendix-b-formulas.md](appendix-b-formulas.md). Не заменяй Recursive Descent на `eval`, PEG-библиотеки или regex-парсер всего языка. Не пропускай приоритет операторов.

Главные оркестраторы сервисов: `lexer.service.ts`, `parser.service.ts`; чистая логика — в `domain/compiler/lexer.ts`, `domain/compiler/parser.ts`.

---

## 4.1 Файлы

| Файл | Назначение |
|------|------------|
| `domain/compiler/lexer.ts` | `tokenize(source): { tokens, errors }` |
| `domain/compiler/lexer.spec.ts` | кейсы токенизации и ошибок |
| `domain/compiler/precedence.ts` | `getPrecedence`, `isLeftAssociative`, lookup ops |
| `domain/compiler/parser.ts` | Recursive Descent + precedence climbing |
| `domain/compiler/parser.spec.ts` | AST shapes, precedence oracles |
| `domain/compiler/ast-ids.ts` | post-pass или on-create id assignment |
| `domain/compiler/source-map.ts` | offset → smallest covering node |
| `services/lexer.service.ts` | inject-обёртка |
| `services/parser.service.ts` | inject-обёртка |
| `services/compile-pipeline.service.ts` | debounce + full pipeline |
| `core/constants/keywords.constants.ts` | `KEYWORDS` Set |
| `core/constants/compiler.constants.ts` | лимиты, debounce |

Layout — в документе 05 / `layout-engine.ts` (вызывается pipeline после parse).

---

## 4.2 Lexer — требования

### API

```ts
export function tokenize(source: string): {
  tokens: Token[];
  errors: CompilerError[];
}
```

### Обязательное поведение
1. Посимвольный обход с `line`/`column` (см. Appendix B §B.2).
2. Типы токенов строго из модели 03.
3. Keywords: `let`, `const`, `if`, `else`, `while`.
4. Operators: `==` (longest), `=`, `+`, `-`, `*`, `/`, `>`, `<`.
5. Punctuation: `; { } ( )`.
6. Numbers: целые и дробные с цифрой после точки.
7. Unknown char → `E_UNEXPECTED_CHAR`, continue.
8. `source.length > MAX_SOURCE_LENGTH` → одна ошибка `E_SOURCE_TOO_LONG`, tokens `[]`.
9. Если tokens превысили `MAX_TOKENS` — `E_TOO_MANY_TOKENS`, stop.

### Запрещено
- Игнорировать позицию в ошибках.
- Склеивать операторы неправильно (`=>` нет в языке; `=` + `=` → `==` только подряд).

---

## 4.3 Parser — требования

### API

```ts
export function parse(tokens: Token[]): {
  program: Program;
  errors: CompilerError[];
}
```

Всегда возвращай `Program` (хотя бы `body: []`), даже при ошибках.

### Методы (все реализуй полностью)

```ts
class Parser {
  parseProgram(): Program
  parseStatement(): Statement | null
  parseVariableDeclaration(): VariableDeclaration
  parseIfStatement(): IfStatement
  parseWhileStatement(): WhileStatement
  parseBlockStatement(): BlockStatement
  parseExpressionStatement(): ExpressionStatement
  parseExpression(): Expression
  parseBinaryExpression(minPrec: number): Expression
  parseUnary(): Expression
  parsePrimary(): Expression
  parseAssignmentExpressionFromIdentifier(id: Identifier): AssignmentExpression
  // helpers:
  current(): Token | null
  peek(n?: number): Token | null
  consume(): Token
  match(...lexemesOrTypes): boolean
  expect(...): Token | null
  synchronize(): void
  finishNode<T>(partial, startToken/startPos): T
}
```

Имена могут слегка отличаться, но **покрытие грамматики** — полное.

### Variable declaration

```
let IDENT = expression ;
const IDENT = expression ;
```

Создай `VariableDeclaration` с `variableKind`, `id`, `init`.

### If / While

```
if ( expression ) statement [ else statement ]
while ( expression ) statement
```

`statement` включает `BlockStatement`.

### Assignment

Если statement начинается с `IDENT` и следующий токен `=`:
→ parse assignment expression, ожидай `;`, оберни в `ExpressionStatement`.

Если `IDENT` без `=` — это expression statement (редко полезно, но грамматически: `parseExpression` начиная с identifier).

### Blocks

```
{ { statement } }
```

Пустой блок `{}` валиден.

---

## 4.4 Precedence climbing

Реализуй строго Appendix B §B.3–B.5.

Минимальные тесты (должны быть в `parser.spec.ts`):
1. `2 + 3 * 4` → `+` над `*`.
2. `(2 + 3) * 4` → `*` над `+`.
3. `1 + 2 + 3` → left-assoc.
4. `-2 * 3` → unary then mul.
5. `a > 1 + 2` → comparison над additive.
6. Полный default sample из Appendix A парсится без ошибок.

---

## 4.5 Ranges и ids

1. При создании каждого узла выставляй `range`/`loc` из токенов.
2. После построения дерева (или на лету) назначь `id`: `n0`, `n1`, … обходом preorder.
3. `ast-ids.ts` может быть отдельным `assignIds(program): Program`.

---

## 4.6 Error recovery

1. Не бросай ошибки наружу из `ParserService.parse` / `parse()` public API.
2. Внутри — `ParseError` catch → `errors.push`.
3. `synchronize()` как в Appendix B §B.6.
4. Примеры сообщений:
   - ожидали `;` после declaration;
   - ожидали `)` после condition;
   - ожидали `{` или statement;
   - unexpected token `else` без if (если встретится orphan — error).

---

## 4.7 CompilePipelineService

```ts
// псевдоповедение
onSourceChange(source):
  clear pending timer
  timer COMPILE_DEBOUNCE_MS → run(source)

run(source):
  t0 = performance.now()
  if source.length > MAX: apply errors only; return
  { tokens, errors: lexErr } = tokenize(source)
  { program, errors: parseErr } = parse(tokens)
  layout = layoutEngine.compute(program)  // даже при parseErr (partial)
  applyCompileResult({ tokens, ast: program, layout, errors: [...lexErr, ...parseErr], durationMs })
```

`forceCompile()` вызывает `run` немедленно.

---

## 4.8 Сервис-обёртки

```ts
@Injectable({ providedIn: 'root' })
export class LexerService {
  tokenize(source: string) { return tokenize(source); }
}

@Injectable({ providedIn: 'root' })
export class ParserService {
  parse(tokens: Token[]) { return parse(tokens); }
}
```

Не дублируй алгоритм в сервисе — только делегирование.

---

## 4.9 Запреты

1. Нет `new Function`, `eval`, `esprima`, `acorn`, `babel` для TinyScript.
2. Нет пропуска unary / parentheses.
3. Нет «упрощённого» парсера без `else` или без `while`.
4. Нет TODO в recursive methods.
