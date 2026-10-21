## Live demo

https://hafizovs.github.io/ast-forge/

# AST-Forge

Визуализатор компилятора и Абстрактного Синтаксического Дерева (Compiler & AST Visualizer) на Angular 22+ (standalone, Signals, zoneless).

## Запуск

```bash
npm install
npm start
npm test
npm run build
```

Откройте `http://localhost:4200/`.

## TinyScript

Мини-язык для демонстрации frontend-компилятора:

- Keywords: `let`, `const`, `if`, `else`, `while`
- Operators: `=`, `+`, `-`, `*`, `/`, `>`, `<`, `==`
- Punctuation: `; { } ( )`
- Приоритет: unary `-` > `*` `/` > `+` `-` > сравнения

Pipeline: **Lexer → Recursive Descent Parser → Tree Layout → SVG**.

## Hotkeys

| Клавиша | Действие |
|---------|----------|
| Ctrl/Cmd+Enter | Force compile |
| Ctrl/Cmd+1 / 2 | Focus editor / AST |
| Ctrl/Cmd+0 | Reset zoom/pan |
| Ctrl/Cmd+= / - | Zoom in / out |
| G | Locale RU/EN |
| T | Theme |
| ? | Help |
| Escape | Clear selection / close help |
