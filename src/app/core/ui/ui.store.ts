import { Injectable, effect, signal } from '@angular/core';
import {
  PAN_DEFAULT_X,
  PAN_DEFAULT_Y,
  ZOOM_DEFAULT,
  ZOOM_MAX,
  ZOOM_MIN,
} from '../constants/layout.constants';
import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  SPLIT_DEFAULT_LEFT_PERCENT,
  SPLIT_MAX_LEFT_PERCENT,
  SPLIT_MIN_LEFT_PERCENT,
} from '../constants/ui.constants';
import { clamp } from '../../domain/math/clamp';
import type { LocaleId } from '../models/locale.model';
import type { ThemeId } from '../models/theme.model';
import type { TelemetryTab } from '../../features/workbench/compiler.types';

@Injectable({ providedIn: 'root' })
export class UiStore {
  readonly theme = signal<ThemeId>(DEFAULT_THEME);
  readonly locale = signal<LocaleId>(DEFAULT_LOCALE);
  readonly splitLeftPercent = signal(SPLIT_DEFAULT_LEFT_PERCENT);
  readonly telemetryTab = signal<TelemetryTab>('tokens');
  readonly helpOpen = signal(false);
  readonly zoom = signal(ZOOM_DEFAULT);
  readonly panX = signal(PAN_DEFAULT_X);
  readonly panY = signal(PAN_DEFAULT_Y);
  readonly telemetryCollapsed = signal(false);

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: ThemeId): void {
    this.theme.set(theme);
  }

  toggleLocale(): void {
    this.locale.update((l) => (l === 'ru' ? 'en' : 'ru'));
  }

  setLocale(locale: LocaleId): void {
    this.locale.set(locale);
  }

  setSplitLeftPercent(value: number): void {
    this.splitLeftPercent.set(
      clamp(value, SPLIT_MIN_LEFT_PERCENT, SPLIT_MAX_LEFT_PERCENT),
    );
  }

  setTelemetryTab(tab: TelemetryTab): void {
    this.telemetryTab.set(tab);
  }

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  setHelpOpen(open: boolean): void {
    this.helpOpen.set(open);
  }

  setZoomPan(zoom: number, panX: number, panY: number): void {
    this.zoom.set(clamp(zoom, ZOOM_MIN, ZOOM_MAX));
    this.panX.set(panX);
    this.panY.set(panY);
  }

  setZoom(zoom: number): void {
    this.zoom.set(clamp(zoom, ZOOM_MIN, ZOOM_MAX));
  }

  zoomBy(factor: number): void {
    this.zoom.update((z) => clamp(z * factor, ZOOM_MIN, ZOOM_MAX));
  }

  resetView(): void {
    this.zoom.set(ZOOM_DEFAULT);
    this.panX.set(PAN_DEFAULT_X);
    this.panY.set(PAN_DEFAULT_Y);
  }

  toggleTelemetryCollapsed(): void {
    this.telemetryCollapsed.update((v) => !v);
  }
}
