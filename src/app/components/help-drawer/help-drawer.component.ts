import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'af-help-drawer',
  standalone: true,
  templateUrl: './help-drawer.component.html',
  styleUrl: './help-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDrawerComponent {
  readonly i18n = inject(I18nService);
  private readonly ui = inject(UiStore);

  readonly hotkeys = [
    'help.hk.compile',
    'help.hk.save',
    'help.hk.focusEditor',
    'help.hk.focusAst',
    'help.hk.resetView',
    'help.hk.zoomIn',
    'help.hk.zoomOut',
    'help.hk.locale',
    'help.hk.theme',
    'help.hk.help',
    'help.hk.escape',
  ] as const;

  close(): void {
    this.ui.setHelpOpen(false);
  }
}
