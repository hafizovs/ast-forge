# AST-Forge — Главный промпт генерации проекта

> **Как использовать этот пакет:** вставь содержимое этого файла (INDEX.md) в начало диалога с кодовым агентом, затем укажи: «Прочитай и строго выполни документы `docs/01` → `docs/09` и оба appendix в указанном порядке. Генерируй полный код приложения без сокращений.»

---

## 0. Роль и миссия

Ты — **Senior Software Architect** и **Специалист по Теории Компиляторов**. Твоя задача — **с нуля** создать полноценное, расширенное, академически точное веб-приложение:

**«AST-Forge: Визуализатор компилятора и Абстрактного Синтаксического Дерева»**

на **последнем стабильном Angular (22+ на момент генерации)**.

Не спрашивай разрешения «начать с MVP». Выдай **полный рабочий проект**: все файлы, полный лексера TinyScript, полный Recursive Descent Parser, алгоритм раскладки дерева (subtree-width / упрощённый Reingold–Tilford), интерактивный SVG-холст с zoom/pan, двустороннюю подсветку код↔AST, панель телеметрии токенов и ошибок, i18n, тесты из пакета документов. Выжми максимум из контекста. Не жалей токенов. Пиши шедевр.

Этот INDEX — точка входа. Детальные требования — в связанных документах ниже. При конфликте: **более специфичный документ побеждает**; жёсткие правила из §1 этого файла **неотменяемы**.

---

## 1. ЖЁСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ КОДА (БЕЗ ИСКЛЮЧЕНИЙ)

1. **ПИШИ КОД ПОЛНОСТЬЮ.** Любые сокращения, комментарии вида `// ...`, `// TODO`, `// аналогично`, `// логика аналогична`, `/* rest of file */`, `...existing code...` **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ**. Напиши каждую строчку лексера, парсера и алгоритма обхода/раскладки дерева от начала до конца. Если файлы получаются гигантскими — пиши их целиком, не жалей токены.
2. **Только современный Angular:**
   - Standalone-компоненты (`standalone: true` явно, если CLI ещё требует).
   - **Angular Signals** для реактивного состояния компилятора (`signal`, `computed`, `effect`, `linkedSignal`). **Запрещены** `BehaviorSubject` / `Subject` для UI/компиляторного состояния.
   - Новый Control Flow: `@if`, `@for` (с обязательным `track`), `@switch`, `@let`. **Запрещены** `*ngIf`, `*ngFor`, `*ngSwitch`.
   - `input()`, `output()`, `model()` вместо `@Input` / `@Output` декораторов.
   - `inject()` для DI.
   - **Zoneless** change detection (как в новых приложениях Angular 21+/22+). Не опирайся на Zone.js для обновления UI.
   - `ChangeDetectionStrategy.OnPush` (дефолт новых приложений — не отключай).
3. **Разделяй логику:** интерфейсы/модели отдельно, чистый lexer/parser/layout math в `domain/compiler/`, Angular-сервисы-обёртки отдельно, UI-компоненты отдельно, stores (signals) отдельно. UI **не** токенизирует, не парсит и не считает координаты узлов.
4. **Рендер AST — чистый SVG.** Интерактивный SVG-холст для дерева. **Запрещены** Three.js, Babylon, WebGL-фреймворки, сырой WebGL, Chart.js, D3, Plotly, Cytoscape, dagre как npm-зависимости (layout пишешь сам).
5. **Компиляторная механика обязательна:** Lexer → Recursive Descent Parser → Tree Layout Engine. Язык **TinyScript** с `let`/`const`, арифметикой, `if/else`, `while`, приоритетом операторов. Числа и дефолты — из [appendix-a-defaults.md](appendix-a-defaults.md). Алгоритмы — из [appendix-b-formulas.md](appendix-b-formulas.md) и [04-compiler-engine.md](04-compiler-engine.md).
6. **Запрещены заглушки:** пустые методы, `return []`, fake AST, Lorem Ipsum в UI, `console.log` вместо логики, «потом допишем».
7. **Тесты обязательны** минимум для: lexer tokenization, parser AST shapes / operator precedence, layout non-overlap / coordinate sanity — см. [07-features-extended.md](07-features-extended.md), [09-acceptance-criteria.md](09-acceptance-criteria.md).
8. **i18n RU/EN** через signal-словарь (не `@angular/localize` build-time), см. [07-features-extended.md](07-features-extended.md).
9. **Структура файлов** должна соответствовать [08-file-checklist.md](08-file-checklist.md). Не пропускай файлы из чеклиста. Минимальный каркас из брифа **обязан** присутствовать:
   - `src/app/models/compiler.types.ts`
   - `src/app/services/lexer.service.ts`
   - `src/app/services/parser.service.ts`
   - `src/app/services/layout.service.ts`
   - `src/app/components/code-editor/code-editor.component.ts`
   - `src/app/components/ast-visualizer/ast-visualizer.component.ts`
   - `src/app/components/compiler-workbench/compiler-workbench.component.ts`
   Дополнительные файлы из чеклиста (`domain/`, `state/`, `i18n/`, specs) — тоже обязательны.
10. **Стили:** тема **Cyberpunk Hacker / Monokai**. Допустимы **Tailwind CSS** *или* чистый SCSS + CSS variables. Если выбираешь Tailwind — настрой его полностью (конфиг, content paths, утилиты) без TODO. Если SCSS — используй CSS variables из [01-product-vision.md](01-product-vision.md). Не смешивай хаотично оба подхода в одном компоненте.
11. **Интерфейс** оформляй как продвинутую IDE / DevTools среду: тёмная тема, split-screen редактор + SVG AST, панель Compiler Telemetry. Ошибки компиляции ловятся и показываются красиво — приложение **не падает**.

---

## 2. Порядок чтения и выполнения документов

Выполняй **строго по порядку**. Не начинай UI, пока не зафиксированы модели и компиляторный pipeline.

| Шаг | Документ | Что сделать |
|-----|----------|-------------|
| 1 | [01-product-vision.md](01-product-vision.md) | Понять продукт, IDE UX, journeys, хоткеи, a11y, визуальный язык |
| 2 | [02-architecture.md](02-architecture.md) | Создать скелет Angular-проекта и папок |
| 3 | [03-data-model.md](03-data-model.md) + [appendix-a-defaults.md](appendix-a-defaults.md) | Token, ASTNode, CompilerError, NodeCoordinates, selection |
| 4 | [04-compiler-engine.md](04-compiler-engine.md) + [appendix-b-formulas.md](appendix-b-formulas.md) | Lexer, Recursive Descent Parser, precedence |
| 5 | [05-ast-visuals.md](05-ast-visuals.md) | Layout engine + SVG visualizer (zoom/pan, edges, nodes) |
| 6 | [06-ui-panels.md](06-ui-panels.md) | Workbench, code editor, telemetry, errors |
| 7 | [07-features-extended.md](07-features-extended.md) | Bidirectional highlight, presets, i18n, тесты |
| 8 | [08-file-checklist.md](08-file-checklist.md) | Сверка: все файлы существуют и полны |
| 9 | [09-acceptance-criteria.md](09-acceptance-criteria.md) | Прогнать DoD / приёмку |

---

## 3. Краткий функциональный объём (обязателен целиком)

### Ядро компилятора (TinyScript)
- Лексический анализ: Keywords (`let`, `const`, `if`, `else`, `while`), Identifier, Number, Operator (`=`, `+`, `-`, `*`, `/`, `>`, `<`, `==`), Punctuation (`;`, `{`, `}`, `(`, `)`); пробелы/переводы строк пропускаются; неизвестный символ → ошибка с позицией.
- Синтаксический анализ: Recursive Descent Parser → иерархический AST (`Program`, `VariableDeclaration`, `AssignmentExpression`, `BinaryExpression`, `UnaryExpression`, `Identifier`, `NumericLiteral`, `IfStatement`, `WhileStatement`, `BlockStatement`, `ExpressionStatement`).
- Приоритет операторов: `*` `/` выше `+` `-`; сравнения ниже арифметики; см. Appendix B.
- Tree Layout Engine: рекурсивный расчёт `(x, y)` для каждого узла без наложений (subtree-width или упрощённый Reingold–Tilford).

### Интерфейс IDE / DevTools
- **Split Screen:** слева редактор TinyScript (номера строк, предзагруженный сложный пример с `if` и `while`); справа огромный SVG-холст AST с Zoom (колесо) и Pan (drag) через Signals.
- **Интерактивный SVG-граф:** узлы-блоки с типом и значением; рёбра — кривые Безье; клик по узлу подсвечивает участок кода; клик/выбор в редакторе подсвечивает узел AST.
- **Compiler Telemetry:** таблица токенов (Тип, Значение, Позиция) в реальном времени; панель ошибок (красный banner) при синтаксических сбоях без краша.

### Расширения (обязательны)
- Hotkeys, theme toggle, i18n RU/EN, sample presets, unit-тесты lexer/parser/layout.

---

## 4. Технологический стек (зафиксировано)

| Область | Выбор |
|---------|--------|
| Framework | Angular **latest stable ≥ 22** |
| Components | Standalone only |
| State | Signals stores (`providedIn: 'root'` или feature) |
| CD | Zoneless + OnPush |
| AST rendering | Pure SVG |
| Forms controls | native + signals / `model()` |
| Styling | Tailwind CSS **или** SCSS + CSS variables (Cyberpunk Hacker / Monokai) |
| i18n | Signal-словари `ru.ts` / `en.ts` + `I18nService.t(key)` |
| Tests | Стандартный test runner CLI проекта (Vitest или Jest) |
| Package manager | npm |
| Language UI default | `ru` |

**Команда старта проекта (ориентир):**

```bash
npx @angular/cli@latest new ast-forge --routing=false --style=scss --ssr=false
cd ast-forge
```

Имя приложения в `package.json` / title: **AST-Forge**. Селектор префикс: `af`.

---

## 5. Definition of Done (кратко)

Приложение **готово**, только если:

1. `ng serve` / `npm start` запускает IDE без ошибок.
2. В редакторе предзагружен пример TinyScript с `if` и `while`; правка кода мгновенно пересобирает токены / AST / layout через Signals.
3. Lexer выдаёт полный список токенов; неизвестный символ → `CompilerError` с offset/line/column.
4. Parser строит корректный AST; `2 + 3 * 4` даёт `BinaryExpression(+)` с правым `BinaryExpression(*)`.
5. SVG показывает дерево без наложений узлов; Zoom колесом и Pan drag работают.
6. Клик по узлу AST подсвечивает соответствующий span в редакторе; выбор в редакторе подсвечивает узел(ы) AST.
7. Таблица токенов и панель ошибок живые; синтаксическая ошибка не роняет приложение.
8. i18n RU↔EN, theme toggle, hotkeys — работают.
9. Unit-тесты lexer / parser / layout проходят.
10. В исходниках **нет** `// TODO`, `// ...`, `*ngIf`, `*ngFor`, BehaviorSubject-state, Three.js, D3, Chart.js.
11. Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%.
12. Все пункты [09-acceptance-criteria.md](09-acceptance-criteria.md) отмечены как выполненные.

Полный текст приёмки — в документе 09.

---

## 6. Стиль ответа генератора

1. Сначала создай структуру проекта и доменный слой (модели → lexer → parser → layout → stores → services).
2. Затем UI (Workbench → Editor → Visualizer → Telemetry), затем i18n и тесты.
3. Каждый файл выводи **целиком** с путём.
4. После завершения — кратко перечисли, как запустить и как проверить ключевые сценарии из §5.
5. Не предлагай «упростить парсер». Не заменяй Recursive Descent на `eval` / regex-хаки. Не пропускай layout-алгоритм или двустороннюю подсветку.

---

## 7. Начни сейчас

Прочитай [01-product-vision.md](01-product-vision.md) и приступай к генерации полного проекта **AST-Forge** согласно всему пакету `docs/`.

**Начинай генерацию. Напиши этот проект как Senior Software Architect и Специалист по Теории Компиляторов.**
