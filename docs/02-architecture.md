# 02 — Architecture (Angular 22+)

Создай приложение строго по этой архитектуре. Не сваливай lexer/parser/layout в компоненты. Не используй NgRx/Akita — только Signals stores.

---

## 2.1 Стек и bootstrap

1. Создай проект Angular **latest stable ≥ 22**, standalone, SCSS, **без SSR**, без routing (предпочтительно **без** `@angular/router`).
2. Включи **zoneless** (дефолт новых приложений). Не добавляй `zone.js` обратно.
3. Prefix: `af`.
4. Точка входа: `main.ts` → `bootstrapApplication(AppComponent, appConfig)`.
5. `app.config.ts`: `provideZonelessChangeDetection()` (или эквивалент актуального API).
6. Если используешь Tailwind — добавь официальную интеграцию для Angular/PostCSS полностью (конфиг, content globs, base styles). Если SCSS — глобальные CSS variables из документа 01.

---

## 2.2 Дерево каталогов (обязательное)

Минимальный каркас из брифа **обязан** существовать. Доменный слой расширяет его до продакшен-структуры:

```
src/
  index.html
  main.ts
  styles.scss
  app/
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts

    models/
      compiler.types.ts          # Token, ASTNode union, CompilerError, NodeCoordinates (+ реэкспорт)

    core/
      constants/
        compiler.constants.ts
        layout.constants.ts
        ui.constants.ts
        sample-presets.constants.ts
        keywords.constants.ts
      models/
        token-type.model.ts
        ast-kind.model.ts
        source-range.model.ts
        theme.model.ts
        locale.model.ts

    domain/
      compiler/
        lexer.ts                 # чистая функция tokenize
        lexer.spec.ts
        parser.ts                # Recursive Descent
        parser.spec.ts
        precedence.ts            # таблица приоритетов
        ast-ids.ts               # назначение id узлам
        source-map.ts            # offset → smallest node
        layout-engine.ts         # subtree width layout
        layout-engine.spec.ts
      math/
        clamp.ts

    state/
      compiler.store.ts          # source, tokens, ast, errors, positions, selection
      ui.store.ts                # theme, locale, split %, telemetry tab, help

    services/
      lexer.service.ts           # обёртка над domain/lexer
      parser.service.ts
      layout.service.ts
      compile-pipeline.service.ts
      hotkeys.service.ts
      i18n.service.ts

    components/
      compiler-workbench/
        compiler-workbench.component.ts
        compiler-workbench.component.html
        compiler-workbench.component.scss
      code-editor/
        code-editor.component.ts
        code-editor.component.html
        code-editor.component.scss
      ast-visualizer/
        ast-visualizer.component.ts
        ast-visualizer.component.html
        ast-visualizer.component.scss
      token-table/
        token-table.component.ts
        token-table.component.html
        token-table.component.scss
      error-panel/
        error-panel.component.ts
        error-panel.component.html
        error-panel.component.scss
      toolbar/
        toolbar.component.ts
        toolbar.component.html
        toolbar.component.scss
      status-bar/
        status-bar.component.ts
        status-bar.component.html
        status-bar.component.scss
      help-drawer/
        help-drawer.component.ts
        help-drawer.component.html
        help-drawer.component.scss

    i18n/
      locale.type.ts
      i18n.keys.ts
      ru.ts
      en.ts
```

Допускается объединить мелкие presentational куски, **но** файлы канона брифа и domain/specs из [08-file-checklist.md](08-file-checklist.md) должны существовать.

---

## 2.3 Слои и зависимости

```
components → services / stores → domain/compiler (pure)
                ↑
         models / core/constants
```

Правила:
1. `domain/compiler/*` — **чистые** функции/классы без Angular DI, без DOM.
2. `*.service.ts` (lexer/parser/layout) — тонкие `@Injectable` обёртки, делегирующие в domain (удобно мокать в component tests при необходимости).
3. `CompilePipelineService` — единственный оркестратор: source → tokenize → parse → layout → patch store.
4. Компоненты читают `compiler.store` / `ui.store` через `inject()`, не вызывают lexer напрямую.
5. Запрещён circular import store ↔ component.

---

## 2.4 Signals stores

### `CompilerStore`
```ts
source: WritableSignal<string>
tokens: Signal<Token[]>
ast: Signal<Program | null>
positions: Signal<Map<string, NodeCoordinates>> // или Record
errors: Signal<CompilerError[]>
selectedNodeId: WritableSignal<string | null>
highlightRange: WritableSignal<SourceRange | null>
compileDurationMs: Signal<number>
isCompiling: Signal<boolean>
```

Методы: `setSource`, `selectNode`, `selectOffset`, `clearSelection`, `loadPreset`, `applyCompileResult`.

### `UiStore`
```ts
theme: WritableSignal<'dark' | 'light'>
locale: WritableSignal<'ru' | 'en'>
splitLeftPercent: WritableSignal<number>
telemetryTab: WritableSignal<'tokens' | 'errors' | 'summary'>
helpOpen: WritableSignal<boolean>
zoom: WritableSignal<number>
panX: WritableSignal<number>
panY: WritableSignal<number>
```

Методы: `toggleTheme`, `toggleLocale`, `resetView`, `setZoomPan`, …

Либо zoom/pan живут локально в `AstVisualizerComponent` **и** синхронизируются в store для status-bar / hotkeys — **канон: в `UiStore`**, чтобы hotkeys и status-bar читали одно место.

---

## 2.5 Compile pipeline

`CompilePipelineService`:
1. `effect` или явная подписка на `compilerStore.source` с debounce `COMPILE_DEBOUNCE_MS`.
2. Вызов `lexer.tokenize` → `parser.parse` → `layout.compute`.
3. Обновление store атомарно одним методом `applyCompileResult`.
4. Ошибки не пробрасываются в UI как exceptions; только `errors[]`.
5. `forceCompile()` для Ctrl+Enter без ожидания debounce.

---

## 2.6 App shell

- `AppComponent` — тонкий хост: только `<af-compiler-workbench />`.
- `CompilerWorkbenchComponent` — собирает toolbar, split (editor | visualizer), telemetry, status-bar, help-drawer.

---

## 2.7 Тестирование

Unit-тесты domain обязательны (см. 07). Component tests — по желанию; не блокируют DoD, если domain зелёный и ручные сценарии 09 проходят.

---

## 2.8 Запрещённые зависимости

Не добавляй: `three`, `@ngrx/*`, `chart.js`, `d3`, `plotly`, `cytoscape`, `dagre`, `monaco-editor` (кастомный textarea достаточен), `codemirror` (опционально запрещён — **канон: textarea + overlays**, без тяжёлых редакторов).
