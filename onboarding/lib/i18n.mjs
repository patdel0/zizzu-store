/**
 * Locales, and the rule that English is always the floor.
 *
 * A translation is never all-or-nothing here. Every lookup falls back to
 * English, so a half-finished locale shows translated cards where they exist
 * and English where they do not — which is a usable tutorial, whereas a missing
 * key that renders as `steps.welcome.title` is not.
 *
 * That also means adding a locale can never break the English course, and a
 * translator can ship one step at a time.
 */

export const DEFAULT_LOCALE = 'en';

export const LOCALES = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'pt-BR', label: 'Português (Brasil)', short: 'PT', flag: '🇧🇷' },
];

export function isLocale(code) {
  return LOCALES.some((locale) => locale.code === code);
}

/** Normalises anything a query string or `Accept-Language` header offers. */
export function resolveLocale(requested) {
  if (typeof requested !== 'string') return DEFAULT_LOCALE;

  const wanted = requested.trim();

  if (isLocale(wanted)) return wanted;

  // `pt-br`, `pt_BR`, `pt-BR,pt;q=0.9` all mean the same thing to a reader.
  const normalised = wanted.replace('_', '-').split(',')[0].split(';')[0].trim();
  const exact = LOCALES.find(
    (locale) => locale.code.toLowerCase() === normalised.toLowerCase(),
  );

  if (exact) return exact.code;

  // Bare `pt` picks the first locale in that language.
  const [language] = normalised.toLowerCase().split('-');
  const byLanguage = LOCALES.find(
    (locale) => locale.code.toLowerCase().split('-')[0] === language,
  );

  return byLanguage ? byLanguage.code : DEFAULT_LOCALE;
}

/**
 * Looks `key` up in `catalog`, falling back to English, then to the key itself.
 *
 * `{name}` placeholders are filled from `params`. A placeholder with no value
 * is left as it is rather than printed as `undefined`, so a translation that
 * drops a placeholder degrades visibly instead of lying.
 */
export function translator(catalogs, locale) {
  const active = catalogs[locale] ?? {};
  const fallback = catalogs[DEFAULT_LOCALE] ?? {};

  return function t(key, params) {
    const template = active[key] ?? fallback[key] ?? key;

    if (params === undefined) return template;

    return String(template).replace(/\{(\w+)\}/g, (whole, name) =>
      Object.prototype.hasOwnProperty.call(params, name)
        ? String(params[name])
        : whole,
    );
  };
}
