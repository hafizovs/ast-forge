## Live demo

https://hafizovs.github.io/ast-forge/

# AST-Forge

Compiler and abstract syntax tree visualizer (Compiler & AST Visualizer) on Angular 22+ (standalone, Signals, zoneless).

## About

AST-Forge is a compiler and abstract syntax tree visualizer for the TinyScript mini-language, built with Angular 22+ standalone components, Signals, and zoneless change detection. The page runs a front-end pipeline: lexer, recursive-descent parser, tree layout, and SVG. You edit a short program and inspect the tree it produces.

## Capabilities

- TinyScript keywords `let`, `const`, `if`, `else`, and `while`
- Operators `=`, `+`, `-`, `*`, `/`, `>`, `<`, `==`, and punctuation `; { } ( )`
- Precedence: unary `-`, then `*` `/`, then `+` `-`, then comparisons
- Pipeline: lexer → recursive-descent parser → tree layout → SVG
- Zoom and pan, RU/EN locale, theme toggle, and a help overlay

## Functionality

- Edit TinyScript and force a compile with Ctrl/Cmd+Enter
- Move focus between the editor and the AST with Ctrl/Cmd+1 and Ctrl/Cmd+2
- Zoom with Ctrl/Cmd+= and Ctrl/Cmd+-, and reset zoom and pan with Ctrl/Cmd+0
- Switch locale (`G`) and theme (`T`), open help (`?`), and clear the selection or close help with Escape

## Start

```bash
npm install
npm start
npm test
npm run build
```

Open `http://localhost:4200/`.

## TinyScript

A mini-language for demonstrating a front-end compiler:

- Keywords: `let`, `const`, `if`, `else`, `while`
- Operators: `=`, `+`, `-`, `*`, `/`, `>`, `<`, `==`
- Punctuation: `; { } ( )`
- Precedence: unary `-` > `*` `/` > `+` `-` > comparisons

Pipeline: **Lexer → Recursive Descent Parser → Tree Layout → SVG**.

## Hotkeys

| Key | Action |
|-----|--------|
| Ctrl/Cmd+Enter | Force compile |
| Ctrl/Cmd+1 / 2 | Focus editor / AST |
| Ctrl/Cmd+0 | Reset zoom/pan |
| Ctrl/Cmd+= / - | Zoom in / out |
| G | Locale RU/EN |
| T | Theme |
| ? | Help |
| Escape | Clear selection / close help |
