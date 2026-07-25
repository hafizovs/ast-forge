# 06 — UI Panels (Workbench, Editor, Telemetry)

Реализуй IDE-shell и панели. Все строки UI — через i18n. Константы размеров — Appendix A.

---

## 6.1 Файлы

| Компонент | Назначение |
|-----------|------------|
| `compiler-workbench` | Главный экран: toolbar + split + telemetry + status + help |
| `toolbar` | Title, presets, theme, lang, help, reset view, force compile |
| `code-editor` | Textarea + gutter + highlight overlay |
| `ast-visualizer` | см. документ 05 |
| `token-table` | Таблица токенов |
| `error-panel` | Красные ошибки |
| `status-bar` | Счётчики / zoom |
| `help-drawer` | Hotkeys + краткий язык TinyScript |

---

## 6.2 CompilerWorkbenchComponent

### Layout
1. CSS grid / flex: строки `[toolbar | main-split | telemetry | status]`.
2. `main-split`: две колонки; ширина левой = `uiStore.splitLeftPercent`.
3. Опциональный drag-handle между панелями (pointer events) с clamp `[SPLIT_MIN, SPLIT_MAX]` — **обязателен**.
4. Telemetry: tabs `tokens | errors | summary` из `uiStore.telemetryTab`.
5. При наличии ошибок — badge на вкладке Errors с count.

### Composition

```html
<af-toolbar />
<div class="af-split">
  <af-code-editor class="af-split__left" />
  <div class="af-split__handle" ...></div>
  <af-ast-visualizer class="af-split__right" />
</div>
<section class="af-telemetry">
  <!-- tab headers -->
  @switch (tab()) {
    @case ('tokens') { <af-token-table /> }
    @case ('errors') { <af-error-panel /> }
    @case ('summary') { <!-- node count, depth, timing --> }
  }
</section>
<af-status-bar />
@if (helpOpen()) { <af-help-drawer /> }
```

---

## 6.3 CodeEditorComponent

### Обязательные элементы
1. Кастомный редактор на `<textarea>` (канон) с синхронным gutter номеров строк.
2. Номера строк = `source.split(/\n/).length` (минимум 1).
3. `spellcheck="false"`, monospace font из constants.
4. Двусторонняя связь: `textarea` input → `compilerStore.setSource`.
5. Предзагрузка `DEFAULT_SOURCE` при старте store.
6. **Highlight overlay:** полупрозрачный слой или `mark`/backdrop, который подсвечивает `highlightRange` (из selection). Реализация:
   - Зеркальный pre/code под textarea (transparent textarea поверх styled pre) **или**
   - Measurement через mirror element.
   - Канон: **mirror `<pre aria-hidden>` + transparent textarea** stacked; подсветка через разбиение текста на before/mark/after.
7. При `origin==='graph'` и смене highlight — scrollIntoView к подсвеченному фрагменту (`HIGHLIGHT_SCROLL_PADDING_PX`).
8. Selection/caret → offset mapping: при `select`/`keyup`/`click` вычислить offset и вызвать `compilerStore.selectOffset(offset)` (debounce 0–16ms).

### Синтаксическая окраска (базовая)
Не обязателен полноценный highlighter-engine: достаточно нейтрального текста + selection mark. **Опционально усилить:** раскраска токенов в mirror по `tokens` store (keyword/number/…). Если делаешь — полная, без TODO.

### Запрещено
Monaco / CodeMirror как зависимость (см. 02).

---

## 6.4 TokenTableComponent

| Колонка | Поле |
|---------|------|
| # | index |
| Type | `token.type` |
| Value | `token.value` |
| Line | `token.loc.start.line` |
| Column | `token.loc.start.column` |
| Offset | `token.range.start` |

1. Обновление в реальном времени из `tokens` signal.
2. Клик по строке → selectOffset / highlight range токена + попытка найти AST node.
3. Виртуализация не обязательна; если tokens &gt; `TELEMETRY_MAX_VISIBLE_TOKENS`, покажи первые N + i18n notice.
4. Пустое состояние: i18n `telemetry.noTokens`.

---

## 6.5 ErrorPanelComponent

1. Список `errors` с `role="alert"` на контейнере при non-empty.
2. Каждая ошибка: severity icon, phase badge (`lex`/`parse`), formatted message, line:column.
3. Клик → установить caret/highlight на `error.range` в редакторе.
4. Стили: `--af-error`, `--af-error-bg`.
5. Пусто: muted success text `telemetry.noErrors`.

---

## 6.6 ToolbarComponent

Элементы:
1. Brand **AST-Forge** (заметный, не только мелкий nav text).
2. Preset `<select>` / button group — ids из Appendix A §A.7.
3. Force Compile button.
4. Reset View (zoom/pan).
5. Theme toggle.
6. Locale toggle.
7. Help (`?`).

---

## 6.7 StatusBarComponent

Показывает:
- `tokens.length`
- node count (обход AST)
- `errors.length`
- `zoom` %
- `compileDurationMs`
- phase hint: `OK` / `ERRORS`

Все подписи — i18n.

---

## 6.8 HelpDrawerComponent

1. Overlay/drawer справа или modal.
2. Список hotkeys из A.10.
3. Краткая шпаргалка TinyScript (keywords, example one-liner).
4. Escape / backdrop click закрывает.

---

## 6.9 Summary tab

Покажи:
- Node count by kind (таблица kind → count)
- Max depth
- Layout bbox W×H
- Last compile duration

Вычисляй через `computed()` от ast/layout.

---

## 6.10 Responsive

`< 900px`: column stack; split handle скрыт; visualizer min-height 280px; editor min-height из constants.
