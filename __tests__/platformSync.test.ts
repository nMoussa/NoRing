let mockPlatformOS = 'ios';

jest.mock('react-native', () => ({
  get Platform() {
    return { OS: mockPlatformOS };
  },
}));

const mockSyncIOSNumbers = jest.fn().mockResolvedValue(undefined);
jest.mock('../src/services/nativeBridge', () => ({
  syncIOSNumbers: (...args: any[]) => mockSyncIOSNumbers(...args),
}));

let storedCallback: ((rules: any[]) => void) | null = null;
jest.mock('../src/services/storage', () => ({
  setPlatformSyncCallback: jest.fn(cb => {
    storedCallback = cb;
  }),
  saveRules: jest.fn(),
}));

import { initPlatformSync } from '../src/services/platformSync';

function setPlatform(os: string) {
  mockPlatformOS = os;
}

beforeEach(() => {
  storedCallback = null;
  mockSyncIOSNumbers.mockClear();
  setPlatform('ios');
});

const makeRule = (overrides = {}) => ({
  id: 'r1',
  enabled: true,
  country: 'FR',
  matchType: 'exact',
  patternRaw: '+33312345678',
  patternNormalized: '+33312345678',
  action: 'block_voicemail',
  priority: 100,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

describe('initPlatformSync', () => {
  test('is a no-op on Android — no callback registered', () => {
    setPlatform('android');
    const { setPlatformSyncCallback } = require('../src/services/storage');
    initPlatformSync();
    expect(setPlatformSyncCallback).not.toHaveBeenCalled();
  });

  test('registers a callback on iOS', () => {
    const { setPlatformSyncCallback } = require('../src/services/storage');
    initPlatformSync();
    expect(setPlatformSyncCallback).toHaveBeenCalled();
    expect(storedCallback).not.toBeNull();
  });

  test('callback syncs only enabled exact non-allow rules', async () => {
    initPlatformSync();
    const rules = [
      makeRule({
        matchType: 'exact',
        action: 'block_voicemail',
        patternNormalized: '+33312345678',
      }),
      makeRule({ id: 'r2', matchType: 'prefix', patternNormalized: '+333' }), // excluded: prefix
      makeRule({
        id: 'r3',
        matchType: 'exact',
        action: 'allow',
        patternNormalized: '+33387654321',
      }), // excluded: allow
      makeRule({
        id: 'r4',
        matchType: 'exact',
        enabled: false,
        patternNormalized: '+33398765432',
      }), // excluded: disabled
    ];
    await storedCallback!(rules);
    await Promise.resolve(); // flush async
    expect(mockSyncIOSNumbers).toHaveBeenCalledWith(['+33312345678']);
  });

  test('callback swallows sync errors without throwing', () => {
    initPlatformSync();
    mockSyncIOSNumbers.mockRejectedValueOnce(
      new Error('extension reload failed'),
    );
    // The callback is void — errors are caught internally via .catch()
    expect(() => storedCallback!([makeRule()])).not.toThrow();
  });

  test('empty rules list syncs empty array', async () => {
    initPlatformSync();
    await storedCallback!([]);
    await Promise.resolve();
    expect(mockSyncIOSNumbers).toHaveBeenCalledWith([]);
  });
});
