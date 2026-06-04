import React, { useCallback, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import {
  getAndroidRoleStatus,
  getIOSExtensionStatus,
  getLastBlockedTimestamp,
  openIOSSettings,
  syncIOSNumbers,
  type ExtensionStatus,
  type RoleStatus,
} from '../services/nativeBridge';
import { loadPlatformStatus, loadRules } from '../services/storage';
import { useTranslation } from '../i18n/useTranslation';
import { extractBlockedE164Numbers } from '../services/ruleEngine';
import { formatTimestamp, statusCheckLabel } from '../utils/formatters';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function DiagnosticsScreen() {
  const s = useTranslation();
  const [androidRole, setAndroidRole] = useState<RoleStatus>('unavailable');
  const [lastBlocked, setLastBlocked] = useState<number | null>(null);
  const [iosStatus, setIosStatus] = useState<ExtensionStatus>('unknown');
  const [reloading, setReloading] = useState(false);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [lastReload, setLastReload] = useState<string | null>(null);
  const [entryCount, setEntryCount] = useState(0);

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
    const count = extractBlockedE164Numbers(loadRules()).length;
    setEntryCount(count);
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
      await syncIOSNumbers(extractBlockedE164Numbers(loadRules()));
      await refresh();
    } catch (e: any) {
      setReloadError(e?.message ?? s.common.error);
    } finally {
      setReloading(false);
    }
  };

  const ts = (v: number | null | string) =>
    formatTimestamp(v, s.diagnostics.never);

  const roleLabel = statusCheckLabel(
    androidRole === 'granted',
    s.common.granted,
    androidRole,
  );

  const extLabel = statusCheckLabel(
    iosStatus === 'enabled',
    s.common.enabled_status,
    iosStatus,
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {Platform.OS === 'android' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {s.diagnostics.android}
            </Text>
            <View style={styles.card}>
              <Row label={s.diagnostics.roleStatus} value={roleLabel} />
              <Row label={s.diagnostics.lastBlocked} value={ts(lastBlocked)} />
              <Row
                label={s.diagnostics.extensionEntryCount}
                value={String(entryCount)}
              />
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {s.diagnostics.ios}
            </Text>
            <View style={styles.card}>
              <Row label={s.diagnostics.extensionStatus} value={extLabel} />
              <Row label={s.diagnostics.lastReload} value={ts(lastReload)} />
              <Row
                label={s.diagnostics.extensionEntryCount}
                value={String(entryCount)}
              />
              {reloadError && (
                <Row label={s.diagnostics.reloadError} value={reloadError} />
              )}
            </View>

            {iosStatus !== 'enabled' && (
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => openIOSSettings()}
                accessibilityLabel={s.diagnostics.openSettings}
                accessibilityRole="button"
              >
                <Text style={styles.settingsBtnText}>
                  {s.diagnostics.openSettings}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.reloadBtn, reloading && styles.btnDisabled]}
              onPress={handleForceReload}
              disabled={reloading}
              accessibilityLabel={s.diagnostics.forceReload}
              accessibilityRole="button"
              accessibilityState={{ disabled: reloading }}
            >
              {reloading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.reloadBtnText}>
                  {s.diagnostics.forceReload}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLabel: { fontSize: 14, color: '#555', flex: 1 },
  rowValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  settingsBtn: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  settingsBtnText: { color: '#007AFF', fontSize: 15, fontWeight: '600' },
  reloadBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  reloadBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});
