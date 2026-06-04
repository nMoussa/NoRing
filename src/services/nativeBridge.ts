import {NativeModules, Platform} from 'react-native';

export type RoleStatus = 'granted' | 'denied' | 'unavailable';
export type ExtensionStatus = 'enabled' | 'disabled' | 'unknown';

const AndroidBridge: {
  getRoleStatus(): Promise<RoleStatus>;
  requestRole(): Promise<boolean>;
  getLastBlockedCallTimestamp(): Promise<number | null>;
} | null = NativeModules.CallScreeningModule ?? null;

const IOSBridge: {
  syncAndReload(numbers: string[]): Promise<boolean>;
  getEnabledStatus(): Promise<ExtensionStatus>;
  openSettings(): Promise<boolean>;
} | null = NativeModules.CallDirectoryBridge ?? null;

// ── Android ──────────────────────────────────────────────────────────────────

export async function getAndroidRoleStatus(): Promise<RoleStatus> {
  if (Platform.OS !== 'android' || !AndroidBridge) {
    return 'unavailable';
  }
  return AndroidBridge.getRoleStatus();
}

export async function requestAndroidRole(): Promise<boolean> {
  if (Platform.OS !== 'android' || !AndroidBridge) {
    return false;
  }
  return AndroidBridge.requestRole();
}

export async function getLastBlockedTimestamp(): Promise<number | null> {
  if (Platform.OS !== 'android' || !AndroidBridge) {
    return null;
  }
  return AndroidBridge.getLastBlockedCallTimestamp();
}

// ── iOS ──────────────────────────────────────────────────────────────────────

export async function syncIOSNumbers(e164Numbers: string[]): Promise<void> {
  if (Platform.OS !== 'ios' || !IOSBridge) {
    return;
  }
  await IOSBridge.syncAndReload(e164Numbers);
}

export async function getIOSExtensionStatus(): Promise<ExtensionStatus> {
  if (Platform.OS !== 'ios' || !IOSBridge) {
    return 'unknown';
  }
  return IOSBridge.getEnabledStatus();
}

export async function openIOSSettings(): Promise<void> {
  if (Platform.OS !== 'ios' || !IOSBridge) {
    return;
  }
  await IOSBridge.openSettings();
}
