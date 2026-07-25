export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceRange {
  start: number;
  end: number;
}

export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
}
