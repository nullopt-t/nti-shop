import { Injectable, signal, effect } from '@angular/core';

export type Language = 'en' | 'ar';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly storageKey = 'rock_app_language';

  readonly currentLanguage = signal<Language>(this.getInitialLanguage());

  constructor() {
    effect(() => {
      const lang = this.currentLanguage();
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(this.storageKey, lang);
          document.documentElement.lang = lang;
          document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        } catch {
          // ignore localStorage access issues
        }
      }
    });
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
  }

  toggleLanguage(): void {
    this.currentLanguage.update((lang) => (lang === 'en' ? 'ar' : 'en'));
  }

  private getInitialLanguage(): Language {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(this.storageKey) as Language | null;
        if (saved === 'en' || saved === 'ar') {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return 'en';
  }
}
