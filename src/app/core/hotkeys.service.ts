import { DestroyRef, Injectable, inject } from '@angular/core';
import { CompilerStore } from '../features/workbench/compiler.store';
import { UiStore } from './ui/ui.store';
import { CompilePipelineService } from '../features/workbench/compile-pipeline.service';

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private readonly ui = inject(UiStore);
  private readonly compiler = inject(CompilerStore);
  private readonly pipeline = inject(CompilePipelineService);
  private readonly destroyRef = inject(DestroyRef);
  private attached = false;

  attach(): void {
    if (this.attached || typeof window === 'undefined') {
      return;
    }
    this.attached = true;
    const handler = (event: KeyboardEvent) => this.onKeyDown(event);
    window.addEventListener('keydown', handler);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', handler);
    });
  }

  private onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase() ?? '';
    const isEditable =
      tag === 'textarea' ||
      tag === 'input' ||
      tag === 'select' ||
      target?.isContentEditable === true;
    const mod = event.ctrlKey || event.metaKey;

    if (mod && event.key === 'Enter') {
      event.preventDefault();
      this.pipeline.forceCompile();
      return;
    }

    if (mod && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Escape') {
      if (this.ui.helpOpen()) {
        this.ui.setHelpOpen(false);
      } else {
        this.compiler.clearSelection();
      }
      return;
    }

    if (isEditable) {
      return;
    }

    if (mod && event.key === '1') {
      event.preventDefault();
      document.getElementById('af-code-editor')?.focus();
      return;
    }

    if (mod && event.key === '2') {
      event.preventDefault();
      document.getElementById('af-ast-visualizer')?.focus();
      return;
    }

    if (mod && event.key === '0') {
      event.preventDefault();
      this.ui.resetView();
      return;
    }

    if (mod && (event.key === '=' || event.key === '+')) {
      event.preventDefault();
      this.ui.zoomBy(1.1);
      return;
    }

    if (mod && event.key === '-') {
      event.preventDefault();
      this.ui.zoomBy(1 / 1.1);
      return;
    }

    if (event.key === 'g' || event.key === 'G') {
      event.preventDefault();
      this.ui.toggleLocale();
      return;
    }

    if (event.key === 't' || event.key === 'T') {
      event.preventDefault();
      this.ui.toggleTheme();
      return;
    }

    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      this.ui.toggleHelp();
    }
  }
}
