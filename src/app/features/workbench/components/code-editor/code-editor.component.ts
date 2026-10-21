import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import {
  EDITOR_FONT,
  EDITOR_FONT_SIZE_PX,
  EDITOR_LINE_HEIGHT,
  EDITOR_TAB_SIZE,
  HIGHLIGHT_SCROLL_PADDING_PX,
  LINE_NUMBER_GUTTER_WIDTH_PX,
} from '../../../../core/constants/ui.constants';
import { I18nService } from '../../../../core/i18n.service';
import { CompilerStore } from '../../compiler.store';

@Component({
  selector: 'af-code-editor',
  standalone: true,
  templateUrl: './code-editor.component.html',
  styleUrl: './code-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeEditorComponent {
  readonly i18n = inject(I18nService);
  private readonly compiler = inject(CompilerStore);

  private readonly textareaRef =
    viewChild<ElementRef<HTMLTextAreaElement>>('textarea');
  private readonly mirrorRef =
    viewChild<ElementRef<HTMLPreElement>>('mirror');
  private readonly scrollRef =
    viewChild<ElementRef<HTMLDivElement>>('scroll');

  readonly source = this.compiler.source;
  readonly highlightRange = this.compiler.highlightRange;
  readonly gutterWidth = LINE_NUMBER_GUTTER_WIDTH_PX;
  readonly fontFamily = EDITOR_FONT;
  readonly fontSize = EDITOR_FONT_SIZE_PX;
  readonly lineHeight = EDITOR_LINE_HEIGHT;
  readonly tabSize = EDITOR_TAB_SIZE;

  readonly lineNumbers = computed(() => {
    const text = this.source();
    const count = Math.max(1, text.split('\n').length);
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  readonly mirrorParts = computed(() => {
    const text = this.source();
    const range = this.highlightRange();
    if (!range || range.start >= text.length) {
      return { before: text, mark: '', after: '' };
    }
    const start = Math.max(0, Math.min(range.start, text.length));
    const end = Math.max(start, Math.min(range.end, text.length));
    return {
      before: text.slice(0, start),
      mark: text.slice(start, end) || ' ',
      after: text.slice(end),
    };
  });

  constructor() {
    effect(() => {
      const range = this.highlightRange();
      const origin = this.compiler.selectionOrigin();
      if (!range || origin !== 'graph') {
        return;
      }
      queueMicrotask(() => this.scrollToHighlight(range.start));
    });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.compiler.setSource(value);
  }

  onScroll(): void {
    const ta = this.textareaRef()?.nativeElement;
    const mirror = this.mirrorRef()?.nativeElement;
    const scroll = this.scrollRef()?.nativeElement;
    if (!ta || !mirror || !scroll) {
      return;
    }
    mirror.scrollTop = ta.scrollTop;
    mirror.scrollLeft = ta.scrollLeft;
    scroll.scrollTop = ta.scrollTop;
  }

  onCaretChange(): void {
    const ta = this.textareaRef()?.nativeElement;
    if (!ta) {
      return;
    }
    const offset = ta.selectionStart ?? 0;
    this.compiler.selectOffset(offset);
  }

  private scrollToHighlight(offset: number): void {
    const ta = this.textareaRef()?.nativeElement;
    if (!ta) {
      return;
    }
    const text = this.source();
    const before = text.slice(0, offset);
    const line = before.split('\n').length - 1;
    const linePx = this.fontSize * this.lineHeight;
    const target = line * linePx - HIGHLIGHT_SCROLL_PADDING_PX;
    ta.scrollTop = Math.max(0, target);
    this.onScroll();
  }
}
