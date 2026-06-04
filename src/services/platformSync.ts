import { Platform } from 'react-native';
import type { Rule } from '../types/Rule';
import { setPlatformSyncCallback } from './storage';
import { syncIOSNumbers } from './nativeBridge';
import { extractBlockedE164Numbers } from './ruleEngine';

// Called once at app startup to wire the platform sync callback.
export function initPlatformSync(): void {
  if (Platform.OS !== 'ios') {
    return;
  }
  setPlatformSyncCallback((rules: Rule[]) => {
    const numbers = extractBlockedE164Numbers(rules);
    syncIOSNumbers(numbers).catch(() => {
      // Error surfaced in DiagnosticsScreen via App Group lastReloadError key.
    });
  });
}
