import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import {
  countByKind,
  countNodes,
  maxDepth,
} from '../../../../domain/compiler/source-map';
import type { TelemetryTab } from '../../compiler.types';
import { CompilePipelineService } from '../../compile-pipeline.service';
import { HotkeysService } from '../../../../core/hotkeys.service';
import { I18nService } from '../../../../core/i18n.service';
import { CompilerStore } from '../../compiler.store';
import { UiStore } from '../../../../core/ui/ui.store';
import { AstVisualizerComponent } from '../ast-visualizer/ast-visualizer.component';
import { CodeEditorComponent } from '../code-editor/code-editor.component';
import { ErrorPanelComponent } from '../error-panel/error-panel.component';
import { HelpDrawerComponent } from '../../../../shared/help-drawer/help-drawer.component';
import { StatusBarComponent } from '../../../../core/layout/status-bar/status-bar.component';
import { TokenTableComponent } from '../token-table/token-table.component';
import { ToolbarComponent } from '../../../../core/layout/toolbar/toolbar.component';

@Component({
  selector: 'af-compiler-workbench',
  standalone: true,
  imports: [
    ToolbarComponent,
    CodeEditorComponent,
    AstVisualizerComponent,
    TokenTableComponent,
    ErrorPanelComponent,
    StatusBarComponent,
    HelpDrawerComponent,
  ],
  templateUrl: './compiler-workbench.component.html',
  styleUrl: './compiler-workbench.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompilerWorkbenchComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly compiler = inject(CompilerStore);
  readonly ui = inject(UiStore);
  private readonly pipeline = inject(CompilePipelineService);
  private readonly hotkeys = inject(HotkeysService);

  private resizing = false;

  readonly tab = this.ui.telemetryTab;
  readonly helpOpen = this.ui.helpOpen;
  readonly splitLeft = this.ui.splitLeftPercent;
  readonly telemetryCollapsed = this.ui.telemetryCollapsed;
  readonly errorCount = computed(() => this.compiler.errors().length);

  readonly summary = computed(() => {
    const ast = this.compiler.ast();
    const layout = this.compiler.layout();
    const kinds = countByKind(ast);
    return {
      nodeCount: countNodes(ast),
      maxDepth: maxDepth(ast),
      bboxW: layout ? Math.round(layout.width) : 0,
      bboxH: layout ? Math.round(layout.height) : 0,
      duration: Math.round(this.compiler.compileDurationMs() * 100) / 100,
      kinds: Object.entries(kinds).sort((a, b) => a[0].localeCompare(b[0])),
    };
  });

  ngOnInit(): void {
    void this.pipeline;
    this.hotkeys.attach();
  }

  setTab(tab: TelemetryTab): void {
    this.ui.setTelemetryTab(tab);
  }

  onSplitPointerDown(event: PointerEvent): void {
    this.resizing = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onSplitPointerMove(event: PointerEvent): void {
    if (!this.resizing) {
      return;
    }
    const split = document.querySelector('.af-split') as HTMLElement | null;
    if (!split) {
      return;
    }
    const rect = split.getBoundingClientRect();
    const pct = ((event.clientX - rect.left) / rect.width) * 100;
    this.ui.setSplitLeftPercent(pct);
  }

  onSplitPointerUp(event: PointerEvent): void {
    if (!this.resizing) {
      return;
    }
    this.resizing = false;
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  }

  toggleTelemetry(): void {
    this.ui.toggleTelemetryCollapsed();
  }
}
