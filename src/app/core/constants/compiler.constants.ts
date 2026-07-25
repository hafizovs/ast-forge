export const COMPILE_DEBOUNCE_MS = 80;
export const MAX_SOURCE_LENGTH = 50_000;
export const MAX_TOKENS = 20_000;
export const MAX_AST_NODES = 10_000;
export const MAX_ERRORS_SHOWN = 32;
export const ERROR_RECOVERY_SYNC_KEYWORDS = [
  'let',
  'const',
  'if',
  'while',
  '}',
] as const;
