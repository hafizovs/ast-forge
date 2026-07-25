# 07 — Extended Features

Все фичи этого документа **обязательны**. Не помечай их optional в коде.

---

## 7.1 Bidirectional highlight (код ↔ AST)

### Graph → Editor
1. Click node → `selectedNodeId`, `highlightRange = node.range`, `origin = 'graph'`.
2. Editor mirror подсвечивает диапазон и скроллит к нему.

### Editor → Graph
1. Caret/selection offset `o` → `source-map.findSmallestNode(ast, o)`.
2. `selectedNodeId = node.id`, `highlightRange = node.range`, `origin = 'editor'`.
3. Visualizer добавляет selected class; опционально soft-pan к узлу, если вне viewport (желательно; если реализуешь — полностью).

### Token table → оба
Клик по токену подсвечивает range токена и nearest AST node.

Алгоритм поиска узла — [appendix-b-formulas.md](appendix-b-formulas.md) §B.12 в `domain/compiler/source-map.ts`.

---

## 7.2 Sample presets

`compilerStore.loadPreset(id)`:
1. Ставит `source` из `sample-presets.constants.ts`.
2. Clear selection.
3. Reset view optional (канон: **reset zoom/pan** при смене preset).
4. Pipeline перекомпилирует.

Preset `errors` обязан демонстрировать error panel без краша.

---

## 7.3 i18n (signal-словари)

### Файлы
- `i18n/locale.type.ts` — `LocaleId = 'ru' | 'en'`
- `i18n/i18n.keys.ts` — union всех ключей **или** const object
- `i18n/ru.ts` / `i18n/en.ts` — словари
- `services/i18n.service.ts` — `locale = signal`, `t(key, params?)`

### Требования
1. Default locale: `ru`.
2. Все видимые строки UI через `t()`.
3. Сообщения ошибок — keys из Appendix A §A.9.
4. Переключение `G` мгновенно обновляет UI.

Минимальные группы ключей: `toolbar.*`, `editor.*`, `visualizer.*`, `telemetry.*`, `status.*`, `error.*`, `help.*`, `theme.*`, `preset.*`.

---

## 7.4 Hotkeys

`HotkeysService` слушает `window:keydown` (host listener в workbench или injectable с `DestroyRef`).

Таблица — из [01-product-vision.md](01-product-vision.md) / Appendix A §A.10. Игнорируй, если target — input/select/textarea/contenteditable, кроме исключений из 01.

---

## 7.5 Theme toggle

- `ui.theme: 'dark' | 'light'`
- Пиши `data-theme` на `document.documentElement`.
- SVG canvas остаётся тёмным; панели следуют теме.

---

## 7.6 Unit tests (обязательные)

Создай и добейся зелёного прогона:

| Файл | Что покрыть |
|------|-------------|
| `domain/compiler/lexer.spec.ts` | keywords vs idents; `==` vs `=`; numbers; whitespace/newlines; unexpected char + position; source too long |
| `domain/compiler/parser.spec.ts` | default sample no errors; precedence oracles из Appendix B; if/else/while shapes; missing `;` yields error + partial program |
| `domain/compiler/layout-engine.spec.ts` | non-overlap same depth; depths; all ids present; empty program |
| `domain/compiler/source-map.spec.ts` | smallest covering node for offsets inside nested binary expr |
| `services/compile-pipeline.service.spec.ts` | run produces tokens+ast; lex error surfaces; forceCompile works |

---

## 7.7 README проекта

В корне приложения `README.md`:
- Описание AST-Forge
- `npm install` / `npm start` / `npm test`
- Кратко: TinyScript features, hotkeys, ссылка на `docs/` пакета промпта (`../docs` относительно app folder)

---

## 7.8 Quality gates

Перед завершением генерации:
1. Нет `TODO` / `...` / `as any` без нужды (допустим точечный cast с комментарием-обоснованием, не заглушкой).
2. Нет `*ngIf` / `*ngFor` / `BehaviorSubject` для state.
3. Все файлы из [08-file-checklist.md](08-file-checklist.md) существуют.
4. Сценарии [09-acceptance-criteria.md](09-acceptance-criteria.md) выполнимы вручную.
5. Нет D3 / Three / Monaco / eval-парсера.
