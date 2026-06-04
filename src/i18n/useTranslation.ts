import {NativeModules, Platform} from 'react-native';
import en from './en.json';
import fr from './fr.json';

type Strings = typeof en;

const translations: Record<string, Strings> = {en, fr};

function getLocale(): string {
  try {
    if (Platform.OS === 'ios') {
      const mgr = NativeModules.SettingsManager;
      return (
        mgr?.settings?.AppleLocale ||
        mgr?.settings?.AppleLanguages?.[0] ||
        'en'
      );
    }
    return NativeModules.I18nManager?.localeIdentifier || 'en';
  } catch {
    return 'en';
  }
}

export function useTranslation(): Strings {
  const tag = getLocale();
  const key = tag.startsWith('fr') ? 'fr' : 'en';
  return translations[key] ?? translations.en;
}
