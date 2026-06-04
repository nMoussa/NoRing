let mockSettingsManager: any = { settings: { AppleLocale: 'en_US' } };
let mockI18nManager: any = { localeIdentifier: 'en_US' };
let mockPlatformOS = 'ios';

jest.mock('react-native', () => ({
  get NativeModules() {
    return {
      SettingsManager: mockSettingsManager,
      I18nManager: mockI18nManager,
    };
  },
  get Platform() {
    return { OS: mockPlatformOS };
  },
}));

import { useTranslation } from '../src/i18n/useTranslation';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';

function setPlatform(os: string) {
  mockPlatformOS = os;
}

beforeEach(() => {
  setPlatform('ios');
  mockSettingsManager = { settings: { AppleLocale: 'en_US' } };
  mockI18nManager = { localeIdentifier: 'en_US' };
});

describe('useTranslation — iOS locale detection', () => {
  test('returns French strings when AppleLocale starts with "fr"', () => {
    mockSettingsManager.settings.AppleLocale = 'fr_FR';
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(fr.onboarding.title);
  });

  test('returns English strings for en-US locale', () => {
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(en.onboarding.title);
  });

  test('returns English strings when SettingsManager is null', () => {
    mockSettingsManager = null;
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(en.onboarding.title);
  });

  test('returns English for unrecognised locale', () => {
    mockSettingsManager.settings.AppleLocale = 'de_DE';
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(en.onboarding.title);
  });

  test('uses AppleLanguages[0] as fallback when AppleLocale is absent', () => {
    mockSettingsManager.settings = { AppleLanguages: ['fr-FR'] };
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(fr.onboarding.title);
  });
});

describe('useTranslation — Android locale detection', () => {
  test('returns French when I18nManager returns fr locale', () => {
    setPlatform('android');
    mockI18nManager.localeIdentifier = 'fr_FR';
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(fr.onboarding.title);
  });

  test('returns English when I18nManager returns en locale', () => {
    setPlatform('android');
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(en.onboarding.title);
  });

  test('returns English when I18nManager is null', () => {
    setPlatform('android');
    mockI18nManager = null;
    const strings = useTranslation();
    expect(strings.onboarding.title).toBe(en.onboarding.title);
  });
});
