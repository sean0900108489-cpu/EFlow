import {
  DEFAULT_LOCALE,
  type Locale,
  type TranslationKey,
  type TranslationValues,
} from "./types";
import { translations } from "./translations";

export function translate(
  locale: Locale,
  key: TranslationKey,
  values?: TranslationValues,
): string {
  const template = translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
  if (!values) return template;

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, valueKey: string) =>
    Object.hasOwn(values, valueKey) ? String(values[valueKey]) : match,
  );
}
