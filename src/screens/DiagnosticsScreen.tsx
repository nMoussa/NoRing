import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {
  getAndroidRoleStatus,
  getIOSExtensionStatus,
  getLastBlockedTimestamp,
  openIOSSettings,
  syncIOSNumbers,
  type ExtensionStatus,
  type RoleStatus,
} from '../services/nativeBridge';
import {loadPlatformStatus, loadRules} from '../services/storage';

function Row({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function DiagnosticsScreen() {
  const [androidRole, setAndroidRole] = useState<RoleStatus>('unavailable');
  const [lastBlocked, setLastBlocked] = useState<number | null>(null);
  const [iosStatus, setIosStatus] = useState<ExtensionStatus>('unknown');
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [lastReload, setLastReload] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'android') {
      const [role, ts] = await Promise.all([
        getAndroidRoleStatus(),
        getLastBlockedTimestamp(),
      ]);
      setAndroidRole(role);
      setLastBlocked(ts);
    } else {
      const status = await getIOSExtensionStatus();
      setIosStatus(status);
      const ps = loadPlatformStatus();
      setLastReload(ps.iosLastReloadTime);
      setReloadError(ps.iosLastReloadError);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleForceReload = async () => {
    setReloading(true);
    setReloadError(null);
    try {
      const rules = loadRules();
      const exactNumbers = rules
        .filter(r => r.enabled && r.matchType === 'exact' && r.action !== 'allow')
        .map(r => r.patternNormalized);
      await syncIOSNumbers(exactNumbers);
      await refresh();
    } catch (e: any) {
      setReloadError(e?.message ?? 'Unknown error');
    } finally {
      setReloading(false);
    }
  };

  const formatTs = (ts: number | null | string): string => {
    if (ts == null) return 'Never';
    const ms = typeof ts === 'string' ? parseFloat(ts) * 1000 : ts;
    return new Date(ms).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {Platform.OS === 'android' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Android</Text>
            <View style={styles.card}>
              <Row
                label="Call screener role"
                value={androidRole === 'granted' ? '✓ Granted' : '✗ ' + androidRole}
              />
              <Row
                label="Last blocked call"
                value={formatTs(lastBlocked)}
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>iOS</Text>
            <View style={styles.card}>
              <Row
                label="Extension status"
                value={iosStatus === 'enabled' ? '✓ Enabled' : '✗ ' + iosStatus}
              />
              <Row label="Last reload" value={lastReload ? formatTs(lastReload) : 'Never'} />
              {reloadError && (
                <Row label="Reload error" value={reloadError} />
              )}
            </View>
            {iosStatus !== 'enabled' && (
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => openIOSSettings()}>
                <Text style={styles.settingsBtnText}>Open Settings</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.reloadBtn, reloading && styles.btnDisabled]}
              onPress={handleForceReload}
              disabled={reloading}>
              {reloading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.reloadBtnText}>Force Reload Extension</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F2F2F7'},
  content: {padding: 20},
  section: {marginBottom: 24},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLabel: {fontSize: 14, color: '#555', flex: 1},
  rowValue: {fontSize: 14, color: '#000', fontWeight: '500', flex: 1, textAlign: 'right'},
  settingsBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  settingsBtnText: {color: '#007AFF', fontSize: 15, fontWeight: '600'},
  reloadBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  reloadBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  btnDisabled: {opacity: 0.5},
});
