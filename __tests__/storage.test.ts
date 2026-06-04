// Storage tests run in a Jest environment where react-native-mmkv is not
// available as a native module. We mock createMMKV so we can test the
// serialization, deserialization, and callback logic in isolation.
//
// The store and __clear helper are defined INSIDE the jest.mock factory so
// they are always initialized before any require() call, regardless of Jest's
// jest.mock hoisting behaviour (which runs the factory before outer const
// declarations are initialised).

jest.mock('react-native-mmkv', () => {
  const _store: Record<string, string> = {};
  const _instance = {
    getString: (key: string) => _store[key],
    set: (key: string, value: string) => { _store[key] = value; },
  };
  return {
    createMMKV: () => _instance,
    // Expose helpers for test setup/teardown
    __clear: () => { Object.keys(_store).forEach(k => delete _store[k]); },
    __inject: (key: string, value: string) => { _store[key] = value; },
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

function mmkv() {
  return jest.requireMock('react-native-mmkv') as {
    __clear: () => void;
    __inject: (key: string, value: string) => void;
  };
}

// Reset MMKV store between tests
beforeEach(() => {
  mmkv().__clear();
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
    mmkv().__inject('rules', '{{{invalid json');
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
