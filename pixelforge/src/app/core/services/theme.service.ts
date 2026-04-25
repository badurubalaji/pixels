import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'pixelforge_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>(this.loadTheme());

  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const t = this._theme();
      this.applyTheme(t);
      try {
        localStorage.setItem(THEME_KEY, t);
      } catch {}
    });
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  toggleTheme(): void {
    this._theme.update(t => t === 'dark' ? 'light' : 'dark');
  }

  private loadTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}

    // PX-079: brand identity is the light violet/cyan aesthetic across
    // /auth, /hub, /gallery, /profile, /dashboard, /editor. Default to
    // light unless the user has an explicit `prefers-color-scheme: dark`
    // OS setting — opt-in dark, not opt-out.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    body.classList.remove('theme-light', 'theme-dark');
    body.classList.add(`theme-${theme}`);

    // Update color-scheme to switch native widgets
    body.style.colorScheme = theme;
  }
}
