import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useRulesStore } from '../store/rulesStore';
import {
  getAndroidRoleStatus,
  getIOSExtensionStatus,
} from '../services/nativeBridge';
import { savePlatformStatus } from '../services/storage';

export function usePlatformStatusSync(): void {
  const { refreshPlatformStatus } = useRulesStore();

  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state !== 'active') return;
      if (Platform.OS === 'android') {
        const s = await getAndroidRoleStatus();
        savePlatformStatus({ androidRoleGranted: s === 'granted' });
      } else {
        const s = await getIOSExtensionStatus();
        savePlatformStatus({ iosExtensionEnabled: s === 'enabled' });
      }
      refreshPlatformStatus();
    });
    return () => sub.remove();
  }, [refreshPlatformStatus]);
}
