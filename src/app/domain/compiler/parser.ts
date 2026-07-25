import { ERROR_RECOVERY_SYNC_KEYWORDS } from '../../core/constants/compiler.constants';
import { assignIds } from './ast-ids';
import {
  getPrecedence,
  isBinaryOperator,
  nextMinPrecedence,
} from './precedence';
import type {
  AssignmentExpression,
  BinaryExpression,
  BinaryOperator,
  BlockStatement,
  CompilerError,
  Expression,
  ExpressionStatement,
  Identifier,
  IfStatement,
  NumericLiteral,
  Program,
  SourceLocation,
  SourcePosition,
  Statement,
  Token,
  UnaryExpression,
  VariableDeclaration,
  VariableKind,
  WhileStatement,
} from '../../models/compiler.types';

export interface ParseResult {
  program: Program;
  errors: CompilerError[];
}

class ParseError extends Error {
  constructor(readonly compilerError: CompilerError) {
    super(compilerError.messageKey);
  }
}

function spanLoc(start: SourceLocation, end: SourceLocation): SourceLocation {
  return {
    start: { ...start.start },
    end: { ...end.end },
  };
}

function spanRange(
  start: { range: { start: number } },
  end: { range: { end: number } },
): { start: number; end: number } {
  return { start: start.range.start, end: end.range.end };
}

class Parser {
  private p = 0;
  private readonly errors: CompilerError[] = [];

  constructor(private readonly tokens: Token[]) {}

  parse(): ParseResult {
    const program = this.parseProgram();
    assignIds(program);
    return { program, errors: this.errors };
  }

  parseProgram(): Program {
    const body: Statement[] = [];
    const startPos: SourcePosition =
      this.tokens[0]?.loc.start ?? { offset: 0, line: 1, column: 1 };
    const startLoc: SourceLocation = {
      start: { ...startPos },
      end: { ...startPos },
    };

    while (!this.isAtEnd()) {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        } else {
          this.synchronize();
        }
      } catch (err) {
        if (err instanceof ParseError) {
          this.errors.push(err.compilerError);
          this.synchronize();
        } else {
          throw err;
        }
      }
    }

    const endToken = this.tokens[this.tokens.length - 1];
    const endLoc = endToken?.loc ?? startLoc;
    return {
      id: '',
      kind: 'Program',
      body,
      range: {
        start: startLoc.start.offset,
        end: endLoc.end.offset,
      },
      loc: spanLoc(startLoc, endLoc),
    };
  }

  parseStatement(): Statement | null {
    if (this.isAtEnd()) {
      return null;
    }

    if (this.checkKeyword('let') || this.checkKeyword('const')) {
      return this.parseVariableDeclaration();
    }
    if (this.checkKeyword('if')) {
      return this.parseIfStatement();
    }
    if (this.checkKeyword('while')) {
      return this.parseWhileStatement();
    }
    if (this.checkPunctuation('{')) {
      return this.parseBlockStatement();
    }
    if (this.checkType('Identifier') && this.peek(1)?.value === '=') {
      return this.parseAssignmentStatement();
    }
    return this.parseExpressionStatement();
  }

  parseVariableDeclaration(): VariableDeclaration {
    const kindTok = this.consume();
    const variableKind = kindTok.value as VariableKind;
    const name = this.parseIdentifierRequired();
    this.expectOperator('=');
    const init = this.parseExpression();
    const semi = this.expectPunctuation(';');
    const endLoc = semi?.loc ?? init.loc;
    return {
      id: '',
      kind: 'VariableDeclaration',
      variableKind,
      name,
      init,
      range: spanRange(kindTok, { range: { end: endLoc.end.offset } }),
      loc: spanLoc(kindTok.loc, endLoc),
    };
  }

  parseIfStatement(): IfStatement {
    const ifTok = this.consume();
    this.expectPunctuation('(');
    const test = this.parseExpression();
    this.expectPunctuation(')');
    const consequent = this.requireStatement();
    let alternate: Statement | null = null;
    if (this.checkKeyword('else')) {
      this.consume();
      alternate = this.requireStatement();
    }
    const endNode = alternate ?? consequent;
    return {
      id: '',
      kind: 'IfStatement',
      test,
      consequent,
      alternate,
      range: spanRange(ifTok, endNode),
      loc: spanLoc(ifTok.loc, endNode.loc),
    };
  }

  parseWhileStatement(): WhileStatement {
    const whileTok = this.consume();
    this.expectPunctuation('(');
    const test = this.parseExpression();
    this.expectPunctuation(')');
    const body = this.requireStatement();
    return {
      id: '',
      kind: 'WhileStatement',
      test,
      body,
      range: spanRange(whileTok, body),
      loc: spanLoc(whileTok.loc, body.loc),
    };
  }

  parseBlockStatement(): BlockStatement {
    const open = this.consume();
    const body: Statement[] = [];
    while (!this.isAtEnd() && !this.checkPunctuation('}')) {
      try {
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        } else {
          this.synchronize();
        }
      } catch (err) {
        if (err instanceof ParseError) {
          this.errors.push(err.compilerError);
          this.synchronize();
        } else {
          throw err;
        }
      }
    }
    const close = this.expectPunctuation('}');
    const endLoc = close?.loc ?? open.loc;
    return {
      id: '',
      kind: 'BlockStatement',
      body,
      range: {
        start: open.range.start,
        end: endLoc.end.offset,
      },
      loc: spanLoc(open.loc, endLoc),
    };
  }

  parseAssignmentStatement(): ExpressionStatement {
    const left = this.parseIdentifierRequired();
    const assign = this.parseAssignmentExpressionFromIdentifier(left);
    const semi = this.expectPunctuation(';');
    const endLoc = semi?.loc ?? assign.loc;
    return {
      id: '',
      kind: 'ExpressionStatement',
      expression: assign,
      range: spanRange(left, { range: { end: endLoc.end.offset } }),
      loc: spanLoc(left.loc, endLoc),
    };
  }

  parseExpressionStatement(): ExpressionStatement {
    const expr = this.parseExpression();
    const semi = this.expectPunctuation(';');
    const endLoc = semi?.loc ?? expr.loc;
    return {
      id: '',
      kind: 'ExpressionStatement',
      expression: expr,
      range: spanRange(expr, { range: { end: endLoc.end.offset } }),
      loc: spanLoc(expr.loc, endLoc),
    };
  }

  parseExpression(): Expression {
    return this.parseBinaryExpression(0);
  }

  parseBinaryExpression(minPrec: number): Expression {
    let left = this.parseUnary();
    while (true) {
      const tok = this.current();
      if (!tok || tok.type !== 'Operator' || !isBinaryOperator(tok.value)) {
        break;
      }
      const op = tok.value;
      const prec = getPrecedence(op);
      if (prec < minPrec) {
        break;
      }
      this.consume();
      const right = this.parseBinaryExpression(nextMinPrecedence(op));
      left = this.makeBinary(op, left, right);
    }
    return left;
  }

  parseUnary(): Expression {
    if (this.checkOperator('-')) {
      const opTok = this.consume();
      const argument = this.parseUnary();
      const node: UnaryExpression = {
        id: '',
        kind: 'UnaryExpression',
        operator: '-',
        argument,
        range: spanRange(opTok, argument),
        loc: spanLoc(opTok.loc, argument.loc),
      };
      return node;
    }
    return this.parsePrimary();
  }

  parsePrimary(): Expression {
    const tok = this.current();
    if (!tok) {
      throw this.makeExpectedError('expression');
    }

    if (tok.type === 'Number') {
      this.consume();
      const node: NumericLiteral = {
        id: '',
        kind: 'NumericLiteral',
        value: Number(tok.value),
        raw: tok.value,
        range: { ...tok.range },
        loc: {
          start: { ...tok.loc.start },
          end: { ...tok.loc.end },
        },
      };
      return node;
    }

    if (tok.type === 'Identifier') {
      return this.parseIdentifierRequired();
    }

    if (tok.type === 'Punctuation' && tok.value === '(') {
      this.consume();
      const expr = this.parseExpression();
      this.expectPunctuation(')');
      return expr;
    }

    throw this.makeUnexpectedTokenError(tok, 'expression');
  }

  parseAssignmentExpressionFromIdentifier(
    id: Identifier,
  ): AssignmentExpression {
    this.expectOperator('=');
    const right = this.parseExpression();
    return {
      id: '',
      kind: 'AssignmentExpression',
      left: id,
      right,
      range: spanRange(id, right),
      loc: spanLoc(id.loc, right.loc),
    };
  }

  private makeBinary(
    operator: BinaryOperator,
    left: Expression,
    right: Expression,
  ): BinaryExpression {
    return {
      id: '',
      kind: 'BinaryExpression',
      operator,
      left,
      right,
      range: spanRange(left, right),
      loc: spanLoc(left.loc, right.loc),
    };
  }

  private parseIdentifierRequired(): Identifier {
    const tok = this.current();
    if (!tok || tok.type !== 'Identifier') {
      throw this.makeExpectedError('identifier');
    }
    this.consume();
    return {
      id: '',
      kind: 'Identifier',
      name: tok.value,
      range: { ...tok.range },
      loc: {
        start: { ...tok.loc.start },
        end: { ...tok.loc.end },
      },
    };
  }

  private requireStatement(): Statement {
    const stmt = this.parseStatement();
    if (!stmt) {
      throw this.makeExpectedError('statement');
    }
    return stmt;
  }

  current(): Token | null {
    return this.tokens[this.p] ?? null;
  }

  peek(n = 1): Token | null {
    return this.tokens[this.p + n] ?? null;
  }

  consume(): Token {
    const tok = this.current();
    if (!tok) {
      throw this.makeExpectedError('token');
    }
    this.p += 1;
    return tok;
  }

  private checkKeyword(value: string): boolean {
    const tok = this.current();
    return !!tok && tok.type === 'Keyword' && tok.value === value;
  }

  private checkOperator(value: string): boolean {
    const tok = this.current();
    return !!tok && tok.type === 'Operator' && tok.value === value;
  }

  private checkPunctuation(value: string): boolean {
    const tok = this.current();
    return !!tok && tok.type === 'Punctuation' && tok.value === value;
  }

  private checkType(type: Token['type']): boolean {
    const tok = this.current();
    return !!tok && tok.type === type;
  }

  private expectOperator(value: string): Token | null {
    if (this.checkOperator(value)) {
      return this.consume();
    }
    this.pushExpected(value);
    return null;
  }

  private expectPunctuation(value: string): Token | null {
    if (this.checkPunctuation(value)) {
      return this.consume();
    }
    this.pushExpected(value);
    return null;
  }

  private pushExpected(expected: string): void {
    const tok = this.current();
    const loc = tok?.loc ?? {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    };
    this.errors.push({
      code: 'E_EXPECTED',
      messageKey: 'error.expected',
      messageParams: {
        expected,
        line: loc.start.line,
        column: loc.start.column,
      },
      phase: 'parse',
      range: tok?.range,
      loc,
    });
  }

  private makeExpectedError(expected: string): ParseError {
    const tok = this.current();
    const loc = tok?.loc ?? {
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 0, line: 1, column: 1 },
    };
    return new ParseError({
      code: 'E_EXPECTED',
      messageKey: 'error.expected',
      messageParams: {
        expected,
        line: loc.start.line,
        column: loc.start.column,
      },
      phase: 'parse',
      range: tok?.range,
      loc,
    });
  }

  private makeUnexpectedTokenError(tok: Token, expected: string): ParseError {
    return new ParseError({
      code: 'E_UNEXPECTED_TOKEN',
      messageKey: 'error.unexpectedToken',
      messageParams: {
        found: tok.value,
        expected,
        line: tok.loc.start.line,
        column: tok.loc.start.column,
      },
      phase: 'parse',
      range: tok.range,
      loc: tok.loc,
    });
  }

  synchronize(): void {
    while (!this.isAtEnd()) {
      const tok = this.current();
      if (!tok) {
        return;
      }
      if (tok.type === 'Punctuation' && tok.value === ';') {
        this.consume();
        return;
      }
      if (
        (tok.type === 'Keyword' &&
          (ERROR_RECOVERY_SYNC_KEYWORDS as readonly string[]).includes(
            tok.value,
          )) ||
        (tok.type === 'Punctuation' && tok.value === '}')
      ) {
        return;
      }
      this.consume();
    }
  }

  private isAtEnd(): boolean {
    return this.p >= this.tokens.length;
  }
}

export function parse(tokens: Token[]): ParseResult {
  const parser = new Parser(tokens);
  return parser.parse();
}
