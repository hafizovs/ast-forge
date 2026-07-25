# 08 — File Checklist

Генератор **обязан** создать каждый файл из списка. Отмечай мысленно ☑. Пропуск файла = провал DoD.

Рядом с путём — краткое содержание (1–2 предложения). Код внутри файла — **полный**, без сокращений.

---

## 8.1 Project root / Angular scaffold

| # | Path | Content |
|---|------|---------|
| 1 | `package.json` | Имя `ast-forge`, scripts start/build/test; tailwind deps если выбран Tailwind |
| 2 | `angular.json` | project config, styles `src/styles.scss` |
| 3 | `tsconfig.json` | base TS config |
| 4 | `tsconfig.app.json` | app TS config |
| 5 | `tsconfig.spec.json` | spec TS config |
| 6 | `src/index.html` | title AST-Forge, fonts Exo2/Rajdhani + JetBrains Mono, root element |
| 7 | `src/main.ts` | bootstrapApplication |
| 8 | `src/styles.scss` | CSS variables Cyberpunk/Monokai, reset, full viewport |
| 9 | `README.md` | install, start, test, hotkeys, TinyScript overview |
| 10 | `tailwind.config.js` / эквивалент | **только если** выбран Tailwind — полный конфиг content/theme |

---

## 8.2 App shell

| # | Path | Content |
|---|------|---------|
| 11 | `src/app/app.config.ts` | zoneless providers |
| 12 | `src/app/app.component.ts` | thin host → compiler-workbench |
| 13 | `src/app/app.component.html` | `<af-compiler-workbench />` |
| 14 | `src/app/app.component.scss` | full-height host |

---

## 8.3 Models (канон брифа)

| # | Path | Content |
|---|------|---------|
| 15 | `src/app/models/compiler.types.ts` | Token, AST unions, CompilerError, NodeCoordinates, CompileResult, guards |

---

## 8.4 Core constants

| # | Path | Content |
|---|------|---------|
| 16 | `src/app/core/constants/compiler.constants.ts` | debounce, max source/tokens, error sync keywords |
| 17 | `src/app/core/constants/layout.constants.ts` | node size, gaps, zoom limits, edge curve |
| 18 | `src/app/core/constants/ui.constants.ts` | editor/split/telemetry numbers |
| 19 | `src/app/core/constants/keywords.constants.ts` | KEYWORDS set |
| 20 | `src/app/core/constants/sample-presets.constants.ts` | all presets full source strings + DEFAULT_SOURCE |

---

## 8.5 Core models (модульные)

| # | Path | Content |
|---|------|---------|
| 21 | `src/app/core/models/token-type.model.ts` | TokenType |
| 22 | `src/app/core/models/ast-kind.model.ts` | AstKind |
| 23 | `src/app/core/models/source-range.model.ts` | SourceRange / Position / Location |
| 24 | `src/app/core/models/theme.model.ts` | ThemeId |
| 25 | `src/app/core/models/locale.model.ts` | LocaleId |

---

## 8.6 Domain compiler / math

| # | Path | Content |
|---|------|---------|
| 26 | `src/app/domain/compiler/lexer.ts` | full tokenize |
| 27 | `src/app/domain/compiler/lexer.spec.ts` | lexer tests |
| 28 | `src/app/domain/compiler/precedence.ts` | precedence table helpers |
| 29 | `src/app/domain/compiler/parser.ts` | full Recursive Descent |
| 30 | `src/app/domain/compiler/parser.spec.ts` | parser tests |
| 31 | `src/app/domain/compiler/ast-ids.ts` | assignIds |
| 32 | `src/app/domain/compiler/source-map.ts` | findSmallestNode |
| 33 | `src/app/domain/compiler/source-map.spec.ts` | source-map tests |
| 34 | `src/app/domain/compiler/layout-engine.ts` | computeLayout |
| 35 | `src/app/domain/compiler/layout-engine.spec.ts` | layout tests |
| 36 | `src/app/domain/math/clamp.ts` | clamp helper |

---

## 8.7 State stores

| # | Path | Content |
|---|------|---------|
| 37 | `src/app/state/compiler.store.ts` | source/tokens/ast/errors/selection signals |
| 38 | `src/app/state/ui.store.ts` | theme/locale/split/tabs/zoom/pan/help |

---

## 8.8 Services

| # | Path | Content |
|---|------|---------|
| 39 | `src/app/services/lexer.service.ts` | wrapper |
| 40 | `src/app/services/parser.service.ts` | wrapper |
| 41 | `src/app/services/layout.service.ts` | wrapper |
| 42 | `src/app/services/compile-pipeline.service.ts` | debounce + orchestrate |
| 43 | `src/app/services/compile-pipeline.service.spec.ts` | pipeline tests |
| 44 | `src/app/services/hotkeys.service.ts` | keyboard shortcuts |
| 45 | `src/app/services/i18n.service.ts` | t() + locale signal |

---

## 8.9 Components (канон брифа + UI)

| # | Path | Content |
|---|------|---------|
| 46 | `src/app/components/compiler-workbench/compiler-workbench.component.ts` | shell |
| 47 | `src/app/components/compiler-workbench/compiler-workbench.component.html` | layout |
| 48 | `src/app/components/compiler-workbench/compiler-workbench.component.scss` | split/telemetry styles |
| 49 | `src/app/components/code-editor/code-editor.component.ts` | editor logic |
| 50 | `src/app/components/code-editor/code-editor.component.html` | gutter+textarea+mirror |
| 51 | `src/app/components/code-editor/code-editor.component.scss` | editor chrome |
| 52 | `src/app/components/ast-visualizer/ast-visualizer.component.ts` | svg zoom/pan/select |
| 53 | `src/app/components/ast-visualizer/ast-visualizer.component.html` | svg template |
| 54 | `src/app/components/ast-visualizer/ast-visualizer.component.scss` | node/edge styles |
| 55 | `src/app/components/token-table/token-table.component.ts` | table |
| 56 | `src/app/components/token-table/token-table.component.html` | table markup |
| 57 | `src/app/components/token-table/token-table.component.scss` | table styles |
| 58 | `src/app/components/error-panel/error-panel.component.ts` | errors |
| 59 | `src/app/components/error-panel/error-panel.component.html` | alert list |
| 60 | `src/app/components/error-panel/error-panel.component.scss` | error styles |
| 61 | `src/app/components/toolbar/toolbar.component.ts` | toolbar |
| 62 | `src/app/components/toolbar/toolbar.component.html` | controls |
| 63 | `src/app/components/toolbar/toolbar.component.scss` | toolbar styles |
| 64 | `src/app/components/status-bar/status-bar.component.ts` | status |
| 65 | `src/app/components/status-bar/status-bar.component.html` | counters |
| 66 | `src/app/components/status-bar/status-bar.component.scss` | status styles |
| 67 | `src/app/components/help-drawer/help-drawer.component.ts` | help |
| 68 | `src/app/components/help-drawer/help-drawer.component.html` | hotkeys/cheatsheet |
| 69 | `src/app/components/help-drawer/help-drawer.component.scss` | drawer styles |

---

## 8.10 i18n

| # | Path | Content |
|---|------|---------|
| 70 | `src/app/i18n/locale.type.ts` | LocaleId |
| 71 | `src/app/i18n/i18n.keys.ts` | keys |
| 72 | `src/app/i18n/ru.ts` | Russian dictionary complete |
| 73 | `src/app/i18n/en.ts` | English dictionary complete |

---

## 8.11 Итого

Минимум **73** файла из таблиц (+ tailwind config при выборе Tailwind). Канонические 7 путей из брифа пользователя входят в список и **не могут** быть переименованы:

- `models/compiler.types.ts`
- `services/lexer.service.ts`
- `services/parser.service.ts`
- `services/layout.service.ts`
- `components/code-editor/code-editor.component.ts`
- `components/ast-visualizer/ast-visualizer.component.ts`
- `components/compiler-workbench/compiler-workbench.component.ts`
