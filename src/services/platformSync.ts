import {Platform} from 'react-native';
import type {Rule} from '../types/Rule';
import {setPlatformSyncCallback} from './storage';
import {syncIOSNumbers} from './nativeBridge';

function extractExactBlockedNumbers(rules: Rule[]): string[] {
  return rules
    .filter(r => r.enabled && r.matchType === 'exact' && r.action !== 'allow')
    .map(r => r.patternNormalized);
}

// Called once at app startup to wire the platform sync callback.
export function initPlatformSync(): void {
  if (Platform.OS !== 'ios') {
    return;
  }
  setPlatformSyncCallback((rules: Rule[]) => {
    const numbers = extractExactBlockedNumbers(rules);
    syncIOSNumbers(numbers).catch(() => {
      // Error surfaced in DiagnosticsScreen via App Group lastReloadError key.
    });
  });
}
