import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { TELEMETRY_MAX_VISIBLE_TOKENS } from '../../core/constants/ui.constants';
import { I18nService } from '../../services/i18n.service';
import { CompilerStore } from '../../state/compiler.store';

@Component({
  selector: 'af-token-table',
  standalone: true,
  templateUrl: './token-table.component.html',
  styleUrl: './token-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenTableComponent {
  readonly i18n = inject(I18nService);
  private readonly compiler = inject(CompilerStore);

  readonly maxVisible = TELEMETRY_MAX_VISIBLE_TOKENS;

  readonly visibleTokens = computed(() =>
    this.compiler.tokens().slice(0, TELEMETRY_MAX_VISIBLE_TOKENS),
  );

  readonly truncated = computed(
    () => this.compiler.tokens().length > TELEMETRY_MAX_VISIBLE_TOKENS,
  );

  readonly total = computed(() => this.compiler.tokens().length);

  onRowClick(index: number): void {
    const token = this.visibleTokens()[index];
    if (!token) {
      return;
    }
    this.compiler.selectRange(token.range, token.range.start);
  }
}
