# 09 — Acceptance Criteria & Definition of Done

Чеклист приёмки. Генератор после завершения работ **обязан** пройти каждый пункт. Пункт провален → доработать код, не оправдываться.

---

## 9.1 Build & Run

- [ ] `npm install` завершается без ошибок
- [ ] `npm start` / `ng serve` поднимает приложение
- [ ] Консоль браузера без ошибок runtime при старте
- [ ] Нет красных ошибок Angular (NG0xxx) в консоли
- [ ] Zoneless: ввод в редактор обновляет токены/AST без Zone.js hacks
- [ ] В зависимостях нет three / ngrx / chart.js / d3 / monaco-editor / cytoscape / dagre
- [ ] Если Tailwind не подключён — SCSS variables тема работает; если подключён — конфиг полный

---

## 9.2 Editor & presets

- [ ] На старте загружен default sample с `if` и `while` (текст из Appendix A §A.6)
- [ ] Номера строк отображаются и обновляются
- [ ] Изменение кода пересобирает pipeline после debounce
- [ ] Ctrl/Cmd+Enter форсирует compile без ожидания debounce
- [ ] Presets переключают исходник; preset `errors` показывает ошибки без краша
- [ ] Split-handle меняет долю ширины editor/visualizer в допустимых пределах

---

## 9.3 Lexer

- [ ] Keywords распознаются отдельно от Identifier
- [ ] `==` токенизируется как один Operator, не два `=`
- [ ] Числа целые и дробные корректны
- [ ] Пробелы и переводы строк не попадают в tokens, но позиции line/column верны
- [ ] Неизвестный символ даёт `E_UNEXPECTED_CHAR` с line/column и не роняет UI
- [ ] Таблица токенов показывает Type, Value, Position в реальном времени

---

## 9.4 Parser / AST

- [ ] Default sample парсится без ошибок в Program
- [ ] `2 + 3 * 4` → BinaryExpression `+` с правым `*`
- [ ] `(2 + 3) * 4` → корректные скобки
- [ ] `1 + 2 + 3` left-associative
- [ ] Unary `-` работает (`-2 * 3`)
- [ ] `if / else` и `while` строят IfStatement / WhileStatement / BlockStatement
- [ ] `let` / `const` строят VariableDeclaration
- [ ] Assignment `x = expr;` через ExpressionStatement + AssignmentExpression
- [ ] Синтаксическая ошибка (нет `;`, нет `)`) → errors panel, приложение живо, partial AST допустим
- [ ] Каждый узел имеет `id` и `range`

---

## 9.5 Layout & SVG

- [ ] Узлы не накладываются на одном уровне
- [ ] Рёбра — кривые Безье (или аккуратные кривые) parent→child
- [ ] В узле видны kind и detail (operator/name/value)
- [ ] Zoom колесом к курсору в пределах min/max
- [ ] Pan перетаскиванием фона
- [ ] Reset view возвращает zoom=1, pan=0
- [ ] Цвета узлов различимы по семействам (program/stmt/expr/literal)

---

## 9.6 Bidirectional selection

- [ ] Клик по узлу AST подсвечивает соответствующий участок в редакторе
- [ ] Клик/каретка в редакторе подсвечивает наименьший покрывающий узел AST
- [ ] Клик по строке таблицы токенов подсвечивает range
- [ ] Escape сбрасывает selection

---

## 9.7 Telemetry & errors

- [ ] Вкладка Tokens / Errors / Summary работает
- [ ] Errors: `role="alert"`, красный стиль, line:column, клик ведёт в editor
- [ ] Summary: counts by kind, max depth, duration
- [ ] Status bar показывает tokens/nodes/errors/zoom/ms

---

## 9.8 i18n / theme / hotkeys

- [ ] i18n RU↔EN переключает видимые строки (`G` вне textarea)
- [ ] Theme toggle пишет `data-theme` (`T` вне textarea)
- [ ] Help drawer открывается `?` и закрывается Escape
- [ ] Hotkeys zoom (`Ctrl+=/-`, `Ctrl+0`) работают
- [ ] Focus shortcuts Ctrl+1 / Ctrl+2 работают

---

## 9.9 Tests

- [ ] `npm test` (или эквивалент) проходит для обязательных specs из документа 07
- [ ] lexer.spec / parser.spec / layout-engine.spec / source-map.spec / compile-pipeline.service.spec зелёные

---

## 9.10 Code quality

- [ ] Нет `// TODO`, `// ...`, `// аналогично`, `// логика аналогична`
- [ ] Нет `*ngIf`, `*ngFor`, `*ngSwitch`
- [ ] Нет BehaviorSubject/Subject для compiler/UI state
- [ ] Нет eval / new Function / стороннего JS-парсера для TinyScript
- [ ] UI не содержит tokenize/parse/layout алгоритмов — только domain/services
- [ ] Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%
- [ ] Канонические пути брифа существуют под точными именами

---

## 9.11 Финальная декларация

После выполнения всех пунктов генератор кратко сообщает:

1. Как запустить (`npm install`, `npm start`, `npm test`).
2. Как проверить J1–J5 из документа 01.
3. Что пакет `docs/` считается исполненным.

Приложение **не готово**, пока любой чекбокс §9.1–§9.10 остаётся ложным.
