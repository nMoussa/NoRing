// Storage tests run in a Jest environment where react-native-mmkv is not
// available as a native module. We mock the MMKV class so we can test the
// serialization, deserialization, and callback logic in isolation.

jest.mock('react-native-mmkv', () => {
  const store: Record<string, string> = {};
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      getString: (key: string) => store[key],
      set: (key: string, value: string) => {
        store[key] = value;
      },
      clearAll: () => Object.keys(store).forEach(k => delete store[k]),
    })),
  };
});

import {
  loadRules,
  saveRules,
  loadPlatformStatus,
  savePlatformStatus,
  setPlatformSyncCallback,
} from '../src/services/storage';
import type {Rule} from '../src/types/Rule';

function makeRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'test-uuid',
    enabled: true,
    country: 'FR',
    matchType: 'prefix',
    patternRaw: '03',
    patternNormalized: '+333',
    action: 'block_voicemail',
    priority: 100,
    createdAt: '2026-06-03T00:00:00.000Z',
    ...overrides,
  };
}

// Reset MMKV store between tests
beforeEach(() => {
  const {MMKV} = require('react-native-mmkv');
  MMKV.mock.results[0]?.value?.clearAll?.();
  saveRules([]);
  setPlatformSyncCallback(() => {});
});

describe('loadRules / saveRules', () => {
  test('returns empty array when no rules stored', () => {
    expect(loadRules()).toEqual([]);
  });

  test('round-trips a single rule', () => {
    const rule = makeRule();
    saveRules([rule]);
    const loaded = loadRules();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(rule);
  });

  test('round-trips multiple rules preserving order', () => {
    const rules = [
      makeRule({id: 'a', priority: 200}),
      makeRule({id: 'b', priority: 100}),
    ];
    saveRules(rules);
    const loaded = loadRules();
    expect(loaded.map(r => r.id)).toEqual(['a', 'b']);
  });

  test('round-trips disabled rule correctly', () => {
    const rule = makeRule({enabled: false});
    saveRules([rule]);
    expect(loadRules()[0].enabled).toBe(false);
  });

  test('returns empty array on malformed JSON', () => {
    // Inject bad JSON directly via MMKV mock
    const {MMKV} = require('react-native-mmkv');
    const instance = MMKV.mock.results[0].value;
    instance.set('rules', '{{{invalid json');
    expect(loadRules()).toEqual([]);
  });
});

describe('loadPlatformStatus / savePlatformStatus', () => {
  test('returns default status when nothing stored', () => {
    const status = loadPlatformStatus();
    expect(status.androidRoleGranted).toBe(false);
    expect(status.iosExtensionEnabled).toBe(false);
    expect(status.iosLastReloadTime).toBeNull();
    expect(status.iosLastReloadError).toBeNull();
  });

  test('persists androidRoleGranted', () => {
    savePlatformStatus({androidRoleGranted: true});
    expect(loadPlatformStatus().androidRoleGranted).toBe(true);
  });

  test('persists iosExtensionEnabled', () => {
    savePlatformStatus({iosExtensionEnabled: true});
    expect(loadPlatformStatus().iosExtensionEnabled).toBe(true);
  });

  test('persists iosLastReloadTime', () => {
    savePlatformStatus({iosLastReloadTime: '2026-06-03T12:00:00.000Z'});
    expect(loadPlatformStatus().iosLastReloadTime).toBe('2026-06-03T12:00:00.000Z');
  });

  test('persists iosLastReloadError', () => {
    savePlatformStatus({iosLastReloadError: 'Extension timed out'});
    expect(loadPlatformStatus().iosLastReloadError).toBe('Extension timed out');
  });

  test('partial update merges with existing values', () => {
    savePlatformStatus({androidRoleGranted: true, iosExtensionEnabled: true});
    savePlatformStatus({androidRoleGranted: false});
    const status = loadPlatformStatus();
    expect(status.androidRoleGranted).toBe(false);
    expect(status.iosExtensionEnabled).toBe(true); // preserved
  });
});

describe('triggerPlatformSync callback', () => {
  test('callback is called with current rules on saveRules', () => {
    const cb = jest.fn();
    setPlatformSyncCallback(cb);
    const rule = makeRule();
    saveRules([rule]);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith([rule]);
  });

  test('callback is called with empty array when rules cleared', () => {
    const cb = jest.fn();
    setPlatformSyncCallback(cb);
    saveRules([]);
    expect(cb).toHaveBeenCalledWith([]);
  });

  test('replacing callback stops calls to old one', () => {
    const old = jest.fn();
    const next = jest.fn();
    setPlatformSyncCallback(old);
    setPlatformSyncCallback(next);
    saveRules([makeRule()]);
    expect(old).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
