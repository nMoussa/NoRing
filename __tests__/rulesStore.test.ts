jest.mock('../src/services/storage', () => {
  const store: Record<string, string> = {};
  return {
    loadRules: jest.fn(() => {
      const json = store.rules;
      return json ? JSON.parse(json) : [];
    }),
    saveRules: jest.fn(rules => {
      store.rules = JSON.stringify(rules);
    }),
    loadPlatformStatus: jest.fn(() => ({
      androidRoleGranted: false,
      iosExtensionEnabled: false,
      iosLastReloadTime: null,
      iosLastReloadError: null,
    })),
    savePlatformStatus: jest.fn(),
    setPlatformSyncCallback: jest.fn(),
    triggerPlatformSync: jest.fn(),
  };
});

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({}) }));
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { useRulesStore } from '../src/store/rulesStore';

beforeEach(() => {
  useRulesStore.setState({
    rules: [],
    conflicts: [],
    platformStatus: {
      androidRoleGranted: false,
      iosExtensionEnabled: false,
      iosLastReloadTime: null,
      iosLastReloadError: null,
    },
  });
  jest.clearAllMocks();
});

describe('addRule', () => {
  test('returns null for an unrecognisable pattern', () => {
    const result = useRulesStore.getState().addRule({
      enabled: true,
      country: 'FR',
      matchType: 'prefix',
      patternRaw: 'NOT_A_PHONE_NUMBER',
      action: 'block_voicemail',
      priority: 100,
    });
    expect(result).toBeNull();
    expect(useRulesStore.getState().rules).toHaveLength(0);
  });

  test('adds a rule with correct normalised pattern for a valid prefix', () => {
    const result = useRulesStore.getState().addRule({
      enabled: true,
      country: 'FR',
      matchType: 'prefix',
      patternRaw: '03',
      action: 'block_voicemail',
      priority: 100,
    });
    expect(result).not.toBeNull();
    expect(result?.patternNormalized).toBe('+333');
    expect(useRulesStore.getState().rules).toHaveLength(1);
  });

  test('persists rules to storage on add', () => {
    const { saveRules } = require('../src/services/storage');
    useRulesStore.getState().addRule({
      enabled: true,
      country: 'FR',
      matchType: 'prefix',
      patternRaw: '03',
      action: 'reject',
      priority: 100,
    });
    expect(saveRules).toHaveBeenCalled();
  });
});

describe('deleteRule', () => {
  test('removes the rule and persists', () => {
    const { saveRules } = require('../src/services/storage');
    useRulesStore.setState({
      rules: [
        {
          id: 'to-delete',
          enabled: true,
          country: 'FR',
          matchType: 'prefix',
          patternRaw: '03',
          patternNormalized: '+333',
          action: 'block_voicemail',
          priority: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      conflicts: [],
    });
    useRulesStore.getState().deleteRule('to-delete');
    expect(useRulesStore.getState().rules).toHaveLength(0);
    expect(saveRules).toHaveBeenCalledWith([]);
  });
});

describe('toggleRule', () => {
  test('flips enabled and persists', () => {
    useRulesStore.setState({
      rules: [
        {
          id: 'r1',
          enabled: true,
          country: 'FR',
          matchType: 'prefix',
          patternRaw: '03',
          patternNormalized: '+333',
          action: 'block_voicemail',
          priority: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      conflicts: [],
    });
    useRulesStore.getState().toggleRule('r1');
    expect(useRulesStore.getState().rules[0].enabled).toBe(false);
    useRulesStore.getState().toggleRule('r1');
    expect(useRulesStore.getState().rules[0].enabled).toBe(true);
  });
});

describe('updateRule', () => {
  const baseRule = {
    id: 'r1',
    enabled: true,
    country: 'FR' as const,
    matchType: 'prefix' as const,
    patternRaw: '03',
    patternNormalized: '+333',
    action: 'block_voicemail' as const,
    priority: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    useRulesStore.setState({ rules: [baseRule], conflicts: [] });
  });

  test('re-normalizes patternNormalized when patternRaw changes', () => {
    useRulesStore
      .getState()
      .updateRule('r1', { patternRaw: '06', matchType: 'prefix' });
    expect(useRulesStore.getState().rules[0].patternNormalized).toBe('+336');
  });

  test('keeps old patternNormalized when new patternRaw is invalid', () => {
    useRulesStore
      .getState()
      .updateRule('r1', { patternRaw: 'INVALID', matchType: 'prefix' });
    expect(useRulesStore.getState().rules[0].patternNormalized).toBe('+333');
  });
});

describe('loadFromStorage — conflict detection', () => {
  test('populates conflicts when loaded rules conflict', () => {
    const { loadRules } = require('../src/services/storage');
    loadRules.mockReturnValueOnce([
      {
        id: 'a',
        enabled: true,
        country: 'FR',
        matchType: 'prefix',
        patternRaw: '03',
        patternNormalized: '+333',
        action: 'block_voicemail',
        priority: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        enabled: true,
        country: 'FR',
        matchType: 'exact',
        patternRaw: '0312345678',
        patternNormalized: '+33312345678',
        action: 'allow',
        priority: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    useRulesStore.getState().loadFromStorage();
    expect(useRulesStore.getState().conflicts.length).toBeGreaterThan(0);
  });
});
