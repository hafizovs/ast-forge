import { DestroyRef, Injectable, effect, inject } from '@angular/core';
import { COMPILE_DEBOUNCE_MS } from '../../core/constants/compiler.constants';
import type { CompileResult } from './compiler.types';
import { CompilerStore } from './compiler.store';
import { LexerService } from './lexer.service';
import { ParserService } from './parser.service';
import { LayoutService } from '../../core/layout.service';

@Injectable({ providedIn: 'root' })
export class CompilePipelineService {
  private readonly compiler = inject(CompilerStore);
  private readonly lexer = inject(LexerService);
  private readonly parser = inject(ParserService);
  private readonly layout = inject(LayoutService);
  private readonly destroyRef = inject(DestroyRef);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private bootstrapped = false;

  constructor() {
    effect(() => {
      const source = this.compiler.source();
      if (!this.bootstrapped) {
        this.bootstrapped = true;
        this.run(source);
        return;
      }
      this.schedule(source);
    });

    this.destroyRef.onDestroy(() => {
      if (this.timer) {
        clearTimeout(this.timer);
      }
    });
  }

  private schedule(source: string): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.timer = null;
      this.run(source);
    }, COMPILE_DEBOUNCE_MS);
  }

  forceCompile(): CompileResult {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return this.run(this.compiler.source());
  }

  run(source: string): CompileResult {
    this.compiler.isCompiling.set(true);
    const t0 = performance.now();
    const { tokens, errors: lexErrors } = this.lexer.tokenize(source);
    const { program, errors: parseErrors } = this.parser.parse(tokens);
    let layoutResult = null;
    try {
      layoutResult = this.layout.compute(program);
    } catch {
      layoutResult = null;
    }
    const durationMs = performance.now() - t0;
    const result: CompileResult = {
      tokens,
      ast: program,
      layout: layoutResult,
      errors: [...lexErrors, ...parseErrors],
      durationMs,
    };
    this.compiler.applyCompileResult(result);
    return result;
  }
}
