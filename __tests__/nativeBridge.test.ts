let mockPlatformOS = 'android';

jest.mock('react-native', () => ({
  NativeModules: {
    CallScreeningModule: {
      getRoleStatus: jest.fn().mockResolvedValue('granted'),
      requestRole: jest.fn().mockResolvedValue(true),
      getLastBlockedCallTimestamp: jest.fn().mockResolvedValue(1234567890),
    },
    CallDirectoryBridge: {
      syncAndReload: jest.fn().mockResolvedValue(true),
      getEnabledStatus: jest.fn().mockResolvedValue('enabled'),
      openSettings: jest.fn().mockResolvedValue(true),
    },
  },
  get Platform() {
    return { OS: mockPlatformOS };
  },
}));

import {
  getAndroidRoleStatus,
  requestAndroidRole,
  getLastBlockedTimestamp,
  syncIOSNumbers,
  getIOSExtensionStatus,
  openIOSSettings,
} from '../src/services/nativeBridge';

function setPlatform(os: string) {
  mockPlatformOS = os;
}

beforeEach(() => {
  setPlatform('android');
  jest.clearAllMocks();
});

describe('getAndroidRoleStatus', () => {
  test('returns unavailable on iOS', async () => {
    setPlatform('ios');
    expect(await getAndroidRoleStatus()).toBe('unavailable');
  });

  test('returns granted on Android when module reports held', async () => {
    expect(await getAndroidRoleStatus()).toBe('granted');
  });
});

describe('requestAndroidRole', () => {
  test('returns false on iOS', async () => {
    setPlatform('ios');
    expect(await requestAndroidRole()).toBe(false);
  });

  test('returns true on Android when module grants role', async () => {
    expect(await requestAndroidRole()).toBe(true);
  });
});

describe('getLastBlockedTimestamp', () => {
  test('returns null on iOS', async () => {
    setPlatform('ios');
    expect(await getLastBlockedTimestamp()).toBeNull();
  });

  test('delegates on Android', async () => {
    expect(await getLastBlockedTimestamp()).toBe(1234567890);
  });
});

describe('syncIOSNumbers', () => {
  test('is a no-op on Android', async () => {
    await syncIOSNumbers(['+33312345678']);
    const { NativeModules } = require('react-native');
    expect(
      NativeModules.CallDirectoryBridge.syncAndReload,
    ).not.toHaveBeenCalled();
  });

  test('delegates on iOS', async () => {
    setPlatform('ios');
    await syncIOSNumbers(['+33312345678']);
    const { NativeModules } = require('react-native');
    expect(
      NativeModules.CallDirectoryBridge.syncAndReload,
    ).toHaveBeenCalledWith(['+33312345678']);
  });
});

describe('getIOSExtensionStatus', () => {
  test('returns unknown on Android', async () => {
    expect(await getIOSExtensionStatus()).toBe('unknown');
  });

  test('delegates on iOS', async () => {
    setPlatform('ios');
    expect(await getIOSExtensionStatus()).toBe('enabled');
  });
});

describe('openIOSSettings', () => {
  test('is a no-op on Android', async () => {
    await openIOSSettings();
    const { NativeModules } = require('react-native');
    expect(
      NativeModules.CallDirectoryBridge.openSettings,
    ).not.toHaveBeenCalled();
  });

  test('delegates on iOS', async () => {
    setPlatform('ios');
    await openIOSSettings();
    const { NativeModules } = require('react-native');
    expect(NativeModules.CallDirectoryBridge.openSettings).toHaveBeenCalled();
  });
});
