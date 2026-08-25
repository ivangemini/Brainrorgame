import { describe, expect, it } from 'vitest';
import { getDictionary, normalizeLocale, resolveLocale, translate } from './index';

describe('i18n', () => {
  it('normalizes supported language tags and rejects unsupported locales', () => {
    expect(normalizeLocale('ru-RU')).toBe('ru');
    expect(normalizeLocale('en_GB')).toBe('en');
    expect(normalizeLocale('de-DE')).toBeNull();
  });

  it('prefers explicit query locale over browser languages', () => {
    expect(resolveLocale('?lang=ru', ['en-GB'])).toBe('ru');
    expect(resolveLocale('?lang=en', ['ru-RU'])).toBe('en');
  });

  it('falls back to browser preference and then English', () => {
    expect(resolveLocale('', ['de-DE', 'ru-RU'])).toBe('ru');
    expect(resolveLocale('', ['de-DE'])).toBe('en');
  });

  it('interpolates bounded parameters without free-form evaluation', () => {
    expect(translate('hud.wave', { current: 3, total: 5 }, 'en')).toBe('WAVE 3 / 5');
    expect(translate('hud.wave', { current: 3, total: 5 }, 'ru')).toBe('ВОЛНА 3 / 5');
  });

  it('keeps all supported dictionaries key-complete', () => {
    expect(Object.keys(getDictionary('ru'))).toEqual(Object.keys(getDictionary('en')));
  });
});
