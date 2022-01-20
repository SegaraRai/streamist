import { lookup } from 'bcp-47-match';
import {
  LanguageCode,
  PREFERENCE_LANGUAGE_CODES,
  PREFERENCE_LANGUAGE_CODE_DEFAULT,
} from '~/config';

function getUserLanguages(): string[] {
  return Array.from(navigator.languages || [navigator.language]);
}

function lookupLanguage<T extends string = string>(
  availableLanguages: readonly T[],
  userLanguages: readonly string[]
): T | undefined {
  return lookup(availableLanguages as T[], userLanguages as string[]) as
    | T
    | undefined;
}

const cacheMap = new Map<string, LanguageCode>();

export function getLanguageFromNavigator(): LanguageCode {
  const userLanguages = getUserLanguages();
  const cacheKey = userLanguages.join('\n');
  let language = cacheMap.get(cacheKey);
  if (!language) {
    language =
      lookupLanguage(PREFERENCE_LANGUAGE_CODES, userLanguages) ||
      PREFERENCE_LANGUAGE_CODE_DEFAULT;
    cacheMap.set(cacheKey, language);
  }
  return language;
}
