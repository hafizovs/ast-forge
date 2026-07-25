import type { AstKind } from '../core/models/ast-kind.model';
import type {
  SourceLocation,
  SourcePosition,
  SourceRange,
} from '../core/models/source-range.model';
import type { TokenType } from '../core/models/token-type.model';

export type { AstKind } from '../core/models/ast-kind.model';
export type {
  SourceLocation,
  SourcePosition,
  SourceRange,
} from '../core/models/source-range.model';
export type { TokenType } from '../core/models/token-type.model';
export type { ThemeId } from '../core/models/theme.model';
export type { LocaleId } from '../core/models/locale.model';

export type BinaryOperator = '+' | '-' | '*' | '/' | '>' | '<' | '==';
export type UnaryOperator = '-';
export type VariableKind = 'let' | 'const';

export type CompilerErrorCode =
  | 'E_UNEXPECTED_CHAR'
  | 'E_UNEXPECTED_TOKEN'
  | 'E_EXPECTED'
  | 'E_UNTERMINATED'
  | 'E_SOURCE_TOO_LONG'
  | 'E_TOO_MANY_TOKENS';

export type TelemetryTab = 'tokens' | 'errors' | 'summary';

export type SamplePresetId =
  | 'default'
  | 'arith'
  | 'ifelse'
  | 'while'
  | 'nested'
  | 'errors';

export interface Token {
  type: TokenType;
  value: string;
  range: SourceRange;
  loc: SourceLocation;
}

export interface CompilerError {
  code: CompilerErrorCode;
  messageKey: string;
  messageParams?: Record<string, string | number>;
  range?: SourceRange;
  loc?: SourceLocation;
  phase: 'lex' | 'parse' | 'layout';
}

export interface AstNodeBase {
  id: string;
  kind: AstKind;
  range: SourceRange;
  loc: SourceLocation;
}

export interface Program extends AstNodeBase {
  kind: 'Program';
  body: Statement[];
}

export type Statement =
  | VariableDeclaration
  | IfStatement
  | WhileStatement
  | BlockStatement
  | ExpressionStatement;

export interface ExpressionStatement extends AstNodeBase {
  kind: 'ExpressionStatement';
  expression: Expression;
}

/**
 * Binding identifier lives in `name` so AstNodeBase.id stays the stable node id string.
 * children(VariableDeclaration) = [name, init].
 */
export interface VariableDeclaration extends AstNodeBase {
  kind: 'VariableDeclaration';
  variableKind: VariableKind;
  name: Identifier;
  init: Expression;
}

export interface IfStatement extends AstNodeBase {
  kind: 'IfStatement';
  test: Expression;
  consequent: Statement;
  alternate: Statement | null;
}

export interface WhileStatement extends AstNodeBase {
  kind: 'WhileStatement';
  test: Expression;
  body: Statement;
}

export interface BlockStatement extends AstNodeBase {
  kind: 'BlockStatement';
  body: Statement[];
}

export interface AssignmentExpression extends AstNodeBase {
  kind: 'AssignmentExpression';
  left: Identifier;
  right: Expression;
}

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | AssignmentExpression
  | Identifier
  | NumericLiteral;

export interface BinaryExpression extends AstNodeBase {
  kind: 'BinaryExpression';
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends AstNodeBase {
  kind: 'UnaryExpression';
  operator: UnaryOperator;
  argument: Expression;
}

export interface Identifier extends AstNodeBase {
  kind: 'Identifier';
  name: string;
}

export interface NumericLiteral extends AstNodeBase {
  kind: 'NumericLiteral';
  value: number;
  raw: string;
}

export type AstNode = Program | Statement | Expression;

export interface NodeCoordinates {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface LayoutResult {
  positions: NodeCoordinates[];
  width: number;
  height: number;
}

export interface CompileResult {
  tokens: Token[];
  ast: Program | null;
  layout: LayoutResult | null;
  errors: CompilerError[];
  durationMs: number;
}

export interface SelectionState {
  nodeId: string | null;
  highlightRange: SourceRange | null;
  origin: 'editor' | 'graph' | null;
}

export function isProgram(node: AstNode): node is Program {
  return node.kind === 'Program';
}

export function isExpression(node: AstNode): node is Expression {
  return (
    node.kind === 'BinaryExpression' ||
    node.kind === 'UnaryExpression' ||
    node.kind === 'AssignmentExpression' ||
    node.kind === 'Identifier' ||
    node.kind === 'NumericLiteral'
  );
}

export function isStatement(node: AstNode): node is Statement {
  return (
    node.kind === 'VariableDeclaration' ||
    node.kind === 'IfStatement' ||
    node.kind === 'WhileStatement' ||
    node.kind === 'BlockStatement' ||
    node.kind === 'ExpressionStatement'
  );
}

export function emptyLoc(offset = 0): SourceLocation {
  const pos: SourcePosition = { offset, line: 1, column: 1 };
  return { start: pos, end: { ...pos } };
}

export function emptyRange(offset = 0): SourceRange {
  return { start: offset, end: offset };
}
