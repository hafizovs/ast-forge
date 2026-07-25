import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { PRESET_IDS } from '../../core/constants/sample-presets.constants';
import type { SamplePresetId } from '../../models/compiler.types';
import { CompilePipelineService } from '../../services/compile-pipeline.service';
import { I18nService } from '../../services/i18n.service';
import { CompilerStore } from '../../state/compiler.store';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'af-toolbar',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  readonly i18n = inject(I18nService);
  private readonly compiler = inject(CompilerStore);
  private readonly ui = inject(UiStore);
  private readonly pipeline = inject(CompilePipelineService);

  readonly presets = PRESET_IDS;
  readonly locale = this.ui.locale;
  readonly theme = this.ui.theme;

  readonly subtitle = computed(() => this.i18n.t('app.subtitle'));

  presetLabel(id: SamplePresetId): string {
    return this.i18n.t(`preset.${id}`);
  }

  onPresetChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SamplePresetId;
    this.compiler.loadPreset(value);
    this.ui.resetView();
  }

  forceCompile(): void {
    this.pipeline.forceCompile();
  }

  resetView(): void {
    this.ui.resetView();
  }

  toggleTheme(): void {
    this.ui.toggleTheme();
  }

  toggleLocale(): void {
    this.ui.toggleLocale();
  }

  openHelp(): void {
    this.ui.setHelpOpen(true);
  }
}
