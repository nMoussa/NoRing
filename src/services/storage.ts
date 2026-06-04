import {createMMKV} from 'react-native-mmkv';
import type {Rule} from '../types/Rule';

const storage = createMMKV({id: 'noring-storage'});

const RULES_KEY = 'rules';
const PLATFORM_STATUS_KEY = 'platformStatus';

export interface PlatformStatus {
  androidRoleGranted: boolean;
  iosExtensionEnabled: boolean;
  iosLastReloadTime: string | null;
  iosLastReloadError: string | null;
}

const DEFAULT_STATUS: PlatformStatus = {
  androidRoleGranted: false,
  iosExtensionEnabled: false,
  iosLastReloadTime: null,
  iosLastReloadError: null,
};

export function loadRules(): Rule[] {
  const json = storage.getString(RULES_KEY);
  if (!json) {
    return [];
  }
  try {
    return JSON.parse(json) as Rule[];
  } catch {
    return [];
  }
}

export function saveRules(rules: Rule[]): void {
  storage.set(RULES_KEY, JSON.stringify(rules));
  triggerPlatformSync(rules);
}

export function loadPlatformStatus(): PlatformStatus {
  const json = storage.getString(PLATFORM_STATUS_KEY);
  if (!json) {
    return DEFAULT_STATUS;
  }
  try {
    return {...DEFAULT_STATUS, ...(JSON.parse(json) as Partial<PlatformStatus>)};
  } catch {
    return DEFAULT_STATUS;
  }
}

export function savePlatformStatus(status: Partial<PlatformStatus>): void {
  const current = loadPlatformStatus();
  storage.set(PLATFORM_STATUS_KEY, JSON.stringify({...current, ...status}));
}

// Called after every rule write. Native bridges override this on each platform.
// In JS-only environments (tests, web preview) this is a no-op.
export let triggerPlatformSync: (rules: Rule[]) => void = () => {};

export function setPlatformSyncCallback(cb: (rules: Rule[]) => void): void {
  triggerPlatformSync = cb;
}
