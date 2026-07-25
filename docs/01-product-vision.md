# 01 — Product Vision & UX

Документ обязателен к исполнению целиком. Генератор кода не имеет права упрощать сценарии или выкидывать панели.

---

## 1.1 Продукт

| Поле | Значение |
|------|----------|
| Название | **AST-Forge** |
| Подзаголовок (RU) | Визуализатор компилятора и Абстрактного Синтаксического Дерева |
| Подзаголовок (EN) | Compiler & Abstract Syntax Tree Visualizer |
| Тип | SPA, интерактивная IDE / DevTools-лаборатория компилятора |
| Платформа | Современный desktop Chrome/Firefox/Edge; mobile — usable (панели stacked), desktop — primary |
| Рендер AST | Pure SVG (zoom/pan) |
| Язык объекта | TinyScript (мини-язык: let/const, arith, if/else, while) |

**Ценность:** дать прозрачный, академически точный frontend-компилятор: от символов исходника через токены и Recursive Descent AST к интерактивному дереву на SVG — с телеметрией и подсветкой связей код↔узел.

**Аудитория:** студенты компиляторов, разработчики Angular Signals, инженеры, которым нужен нетривиальный stateful demo с реальной CS-механикой (lexer/parser/layout).

---

## 1.2 Информационная архитектура экрана

Один главный экран (без роутинга страниц), композиция через `CompilerWorkbenchComponent`:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Toolbar: AST-Forge | presets | theme | lang | help | reset view          │
├───────────────────────────────┬──────────────────────────────────────────┤
│                               │                                          │
│  CODE EDITOR                  │   AST VISUALIZER (SVG)                   │
│  line gutter | TinyScript     │   nodes + Bezier edges                   │
│  syntax tint / highlight      │   zoom wheel | pan drag                  │
│                               │   selection glow                         │
│                               │                                          │
├───────────────────────────────┴──────────────────────────────────────────┤
│ Compiler Telemetry (tabs or split):                                      │
│  [ Tokens table ]  [ Errors ]  [ AST summary (node count / depth) ]      │
└──────────────────────────────────────────────────────────────────────────┘
│ Status: tokens N | nodes M | errors E | zoom Z% | compile ms             │
```

- Левая панель: редактор (~42% ширины по умолчанию, см. Appendix A); правая: SVG на оставшееся пространство.
- Нижняя полоса telemetry: высота ~28–36% viewport на desktop; collapsible.
- На `width < 900px`: вертикальный стек Editor → Visualizer → Telemetry.
- Z-index: workbench (0) < panels (10) < selection overlays (20) < drawers/help (30).

---

## 1.3 Визуальный язык — Cyberpunk Hacker / Monokai

Тема по умолчанию: **dark** (Monokai IDE). Светлая тема панелей — переключатель (холст AST остаётся тёмным).

CSS variables (обязательные имена в `styles.scss` или `@theme` / `:root` при Tailwind):

```scss
:root,
[data-theme='dark'] {
  --af-bg-deep: #1e1e1e;
  --af-bg-panel: #272822;
  --af-bg-panel-elevated: #2f3128;
  --af-bg-editor: #1e1f1c;
  --af-bg-canvas: #141511;
  --af-border: #3e3d32;
  --af-text: #f8f8f2;
  --af-text-muted: #75715e;
  --af-accent: #a6e22e;       /* monokai green — не purple-theme */
  --af-accent-2: #66d9ef;     /* cyan selection */
  --af-syn-keyword: #f92672;
  --af-syn-ident: #f8f8f2;
  --af-syn-number: #ae81ff;
  --af-syn-operator: #f92672;
  --af-syn-punct: #75715e;
  --af-node-program: #fd971f;
  --af-node-stmt: #a6e22e;
  --af-node-expr: #66d9ef;
  --af-node-literal: #ae81ff;
  --af-selection: #66d9ef;
  --af-error: #ff5555;
  --af-error-bg: rgba(255, 85, 85, 0.12);
  --af-edge: #75715e;
  --af-gutter: #3e3d32;
  --af-focus-ring: #a6e22e;
}

[data-theme='light'] {
  --af-bg-deep: #f5f5f0;
  --af-bg-panel: #ffffff;
  --af-bg-panel-elevated: #f0f0e8;
  --af-bg-editor: #fafaf5;
  --af-border: #d0cfc4;
  --af-text: #272822;
  --af-text-muted: #756e5c;
  /* canvas остаётся тёмным: не переопределяй --af-bg-canvas / node colors */
}
```

**Шрифты (подключи в `index.html`):**
- UI: **Rajdhani** или **Exo 2** (геометричный tech) — не Inter/Roboto/Arial.
- Code / tokens: **JetBrains Mono** или **Fira Code**.

**Motion (минимум 2–3):**
1. Плавное появление/обновление узлов AST (`opacity` + лёгкий `translateY`, 150–200ms) при успешном parse.
2. Pulsing / stroke glow на selected node.
3. Slide-in красной error panel при появлении ошибок.

**Запреты визуала:** purple-on-white градиентные «AI-кластеры», cream+#terracotta broadsheet, emoji в UI, multi-layer drop shadows, rounded-full pill-кластеры статистики в hero (здесь hero нет — IDE chrome).

---

## 1.4 User journeys (обязательные сценарии)

### J1 — Первый взгляд
1. Пользователь открывает приложение.
2. Видит предзагруженный пример с `if` и `while`.
3. Справа — полное AST-дерево; внизу — таблица токенов без ошибок.

### J2 — Редактирование и live compile
1. Меняет `10` на `20` в `let x = 10`.
2. В течение ~80ms debounce pipeline пересобирает tokens/AST/layout.
3. Поддерево NumericLiteral и зависимые узлы обновляются; selection сбрасывается или сохраняется по id если range ещё валиден (канон: **сброс selection** при любом изменении source — проще и предсказуемее).

### J3 — Исследование дерева
1. Клик по узлу `BinaryExpression` (`*`).
2. В редакторе подсвечивается `(x + y) * 2` (или точный range узла).
3. Zoom колесом к курсору; pan drag фона.

### J4 — Ошибка
1. Удаляет `;` или пишет `let x = ;`.
2. Приложение не падает; красная панель показывает сообщение с line/column.
3. Partial AST / последние успешные токены отображаются согласно [appendix-b-formulas.md](appendix-b-formulas.md) §B.6.

### J5 — Preset / i18n / theme
1. Выбирает preset «Арифметика».
2. Переключает язык `G`, тему `T`.
3. Reset view (`Ctrl+0`) возвращает zoom/pan.

---

## 1.5 Hotkeys

См. [appendix-a-defaults.md](appendix-a-defaults.md) §A.10. Реализуй все строки таблицы. Игнорируй, если `event.target` — `textarea` / `input` / `contenteditable`, **кроме** Ctrl/Cmd+Enter (force compile) и Escape.

---

## 1.6 Accessibility

1. Toolbar кнопки — focusable, `aria-label` через i18n.
2. Таблица токенов: семантическая `<table>` или grid с заголовками.
3. Ошибки: `role="alert"` на error banner.
4. SVG узлы: `tabindex`, `role="button"`, Enter/Space выбирает узел.
5. Контраст текста на панелях ≥ WCAG AA для основного текста.
6. Не полагайся только на цвет для ошибки — иконка/префикс «Error».

---

## 1.7 Нефункциональные требования

1. Compile pipeline на типичном примере (&lt; 50 строк) &lt; 16ms CPU (ориентир; не блокируй UI долгим sync без необходимости).
2. Debounce ввода 80ms.
3. Без роутера и без SSR.
4. Без внешних layout/graph библиотек.
5. README с install/start/test и кратким описанием TinyScript.
