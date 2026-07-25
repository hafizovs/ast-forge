import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MAX_ERRORS_SHOWN } from '../../core/constants/compiler.constants';
import type { CompilerError } from '../../models/compiler.types';
import { I18nService } from '../../services/i18n.service';
import { CompilerStore } from '../../state/compiler.store';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'af-error-panel',
  standalone: true,
  templateUrl: './error-panel.component.html',
  styleUrl: './error-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPanelComponent {
  readonly i18n = inject(I18nService);
  private readonly compiler = inject(CompilerStore);
  private readonly ui = inject(UiStore);

  readonly errors = computed(() =>
    this.compiler.errors().slice(0, MAX_ERRORS_SHOWN),
  );

  readonly hasErrors = computed(() => this.errors().length > 0);

  format(error: CompilerError): string {
    return this.i18n.t(error.messageKey, error.messageParams);
  }

  phaseLabel(phase: CompilerError['phase']): string {
    return this.i18n.t(`error.phase.${phase}`);
  }

  onErrorClick(error: CompilerError): void {
    if (error.range) {
      this.compiler.selectRange(error.range, error.range.start);
      this.ui.setTelemetryTab('errors');
      document.getElementById('af-code-editor')?.focus();
    }
  }
}
