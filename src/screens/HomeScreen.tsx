import React, { useCallback } from 'react';
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useRulesStore } from '../store/rulesStore';
import RuleCard from '../components/RuleCard';
import StatusBanner from '../components/StatusBanner';
import { openIOSSettings } from '../services/nativeBridge';
import { useTranslation } from '../i18n/useTranslation';
import { usePlatformStatusSync } from '../hooks/usePlatformStatusSync';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const s = useTranslation();
  const {
    rules,
    conflicts,
    platformStatus,
    loadFromStorage,
    toggleRule,
    refreshPlatformStatus,
  } = useRulesStore();

  useFocusEffect(
    useCallback(() => {
      loadFromStorage();
      refreshPlatformStatus();
    }, [loadFromStorage, refreshPlatformStatus]),
  );

  usePlatformStatusSync();

  const showAndroidBanner =
    Platform.OS === 'android' && !platformStatus.androidRoleGranted;
  const showIosBanner =
    Platform.OS === 'ios' && !platformStatus.iosExtensionEnabled;

  const conflictMessage =
    conflicts.length === 1
      ? s.home.conflictsWarning.replace('{n}', '1')
      : s.home.conflictsWarningPlural.replace('{n}', String(conflicts.length));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {s.home.title}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Simulator')}
            accessibilityLabel={s.home.menuSimulator}
            accessibilityRole="button"
          >
            <Text style={styles.headerBtnText}>{s.home.menuSimulator}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Diagnostics')}
            accessibilityLabel={s.home.menuDiagnostics}
            accessibilityRole="button"
          >
            <Text style={styles.headerBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Permission banners */}
      {showAndroidBanner && (
        <StatusBanner
          message={s.home.bannerAndroidDenied}
          onPress={() => navigation.navigate('Onboarding')}
        />
      )}
      {showIosBanner && (
        <StatusBanner
          message={s.home.bannerIosDisabled}
          onPress={() => openIOSSettings()}
        />
      )}

      {/* Conflict warning */}
      {conflicts.length > 0 && (
        <View
          style={styles.conflictBanner}
          accessibilityLiveRegion="polite"
          accessibilityLabel={conflictMessage}
        >
          <Text style={styles.conflictText}>⚠ {conflictMessage}</Text>
        </View>
      )}

      {/* Rule list */}
      <FlatList
        data={rules}
        keyExtractor={r => r.id}
        renderItem={({ item }) => (
          <RuleCard
            rule={item}
            onToggle={() => toggleRule(item.id)}
            onPress={() =>
              navigation.navigate('RuleEditor', { ruleId: item.id })
            }
          />
        )}
        contentContainerStyle={
          rules.length === 0 ? styles.emptyContent : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{s.home.noRules}</Text>
            <Text style={styles.emptyHint}>{s.home.noRulesHint}</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RuleEditor', {})}
        accessibilityLabel={s.home.addRule}
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#000' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  headerBtnText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  conflictBanner: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FFB74D',
  },
  conflictText: { fontSize: 13, color: '#8A5000', fontWeight: '500' },
  listContent: { paddingVertical: 12 },
  emptyContent: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingBottom: 60 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },
  emptyHint: { fontSize: 15, color: '#8E8E93' },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
