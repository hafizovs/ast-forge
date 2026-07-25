import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {
  countNodes,
} from '../../domain/compiler/source-map';
import { I18nService } from '../../services/i18n.service';
import { CompilerStore } from '../../state/compiler.store';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'af-status-bar',
  standalone: true,
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  readonly i18n = inject(I18nService);
  private readonly compiler = inject(CompilerStore);
  private readonly ui = inject(UiStore);

  readonly tokenCount = computed(() => this.compiler.tokens().length);
  readonly nodeCount = computed(() => countNodes(this.compiler.ast()));
  readonly errorCount = computed(() => this.compiler.errors().length);
  readonly zoomPct = computed(() => Math.round(this.ui.zoom() * 100));
  readonly duration = computed(() =>
    Math.round(this.compiler.compileDurationMs() * 100) / 100,
  );
  readonly phase = computed(() =>
    this.errorCount() > 0
      ? this.i18n.t('status.hasErrors')
      : this.i18n.t('status.ok'),
  );
}
