import { Injectable, inject } from '@angular/core';
import type { I18nKey } from './i18n/i18n.keys';
import { EN_DICT } from './i18n/en';
import { RU_DICT } from './i18n/ru';
import { UiStore } from './ui/ui.store';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly ui = inject(UiStore);

  t(key: I18nKey | string, params?: Record<string, string | number>): string {
    const locale = this.ui.locale();
    const dict = locale === 'ru' ? RU_DICT : EN_DICT;
    let text = (dict as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  }
}
