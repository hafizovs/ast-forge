import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { DEFAULT_SOURCE } from '../core/constants/sample-presets.constants';
import { CompilerStore } from '../state/compiler.store';
import { CompilePipelineService } from './compile-pipeline.service';
import { LexerService } from './lexer.service';
import { ParserService } from './parser.service';
import { LayoutService } from './layout.service';

describe('CompilePipelineService', () => {
  let pipeline: CompilePipelineService;
  let store: CompilerStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CompilePipelineService,
        CompilerStore,
        LexerService,
        ParserService,
        LayoutService,
      ],
    });
    pipeline = TestBed.inject(CompilePipelineService);
    store = TestBed.inject(CompilerStore);
  });

  it('run produces tokens and ast', () => {
    const result = pipeline.run(DEFAULT_SOURCE);
    expect(result.tokens.length).toBeGreaterThan(0);
    expect(result.ast).not.toBeNull();
    expect(result.layout).not.toBeNull();
    expect(result.errors).toEqual([]);
    expect(store.tokens().length).toBe(result.tokens.length);
  });

  it('surfaces lex errors', () => {
    const result = pipeline.run('let @ = 1;');
    expect(result.errors.some((e) => e.code === 'E_UNEXPECTED_CHAR')).toBe(
      true,
    );
    expect(store.errors().length).toBeGreaterThan(0);
  });

  it('forceCompile works immediately', () => {
    store.setSource('let a = 2;');
    const result = pipeline.forceCompile();
    expect(result.ast?.body.length).toBe(1);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
