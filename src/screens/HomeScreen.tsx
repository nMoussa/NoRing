import React, {useCallback, useEffect} from 'react';
import {
  AppState,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type {StackScreenProps} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/RootNavigator';
import {useRulesStore} from '../store/rulesStore';
import RuleCard from '../components/RuleCard';
import StatusBanner from '../components/StatusBanner';
import {
  getAndroidRoleStatus,
  getIOSExtensionStatus,
  openIOSSettings,
} from '../services/nativeBridge';
import {savePlatformStatus} from '../services/storage';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({navigation}: Props) {
  const {rules, platformStatus, loadFromStorage, toggleRule, refreshPlatformStatus} =
    useRulesStore();

  useFocusEffect(
    useCallback(() => {
      loadFromStorage();
      refreshPlatformStatus();
    }, [loadFromStorage, refreshPlatformStatus]),
  );

  // Re-check platform status when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', async state => {
      if (state !== 'active') return;
      if (Platform.OS === 'android') {
        const s = await getAndroidRoleStatus();
        savePlatformStatus({androidRoleGranted: s === 'granted'});
      } else {
        const s = await getIOSExtensionStatus();
        savePlatformStatus({iosExtensionEnabled: s === 'enabled'});
      }
      refreshPlatformStatus();
    });
    return () => sub.remove();
  }, [refreshPlatformStatus]);

  const showAndroidBanner =
    Platform.OS === 'android' && !platformStatus.androidRoleGranted;
  const showIosBanner =
    Platform.OS === 'ios' && !platformStatus.iosExtensionEnabled;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Rules</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Simulator')}>
            <Text style={styles.headerBtnText}>Simulator</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Diagnostics')}>
            <Text style={styles.headerBtnText}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Permission banner */}
      {showAndroidBanner && (
        <StatusBanner
          message="NoRing is not active — tap to enable as call screener"
          onPress={() => navigation.navigate('Onboarding')}
        />
      )}
      {showIosBanner && (
        <StatusBanner
          message="Extension not enabled — tap to open Settings"
          onPress={() => openIOSSettings()}
        />
      )}

      {/* Rule list */}
      <FlatList
        data={rules}
        keyExtractor={r => r.id}
        renderItem={({item}) => (
          <RuleCard
            rule={item}
            onToggle={() => toggleRule(item.id)}
            onPress={() =>
              navigation.navigate('RuleEditor', {ruleId: item.id})
            }
          />
        )}
        contentContainerStyle={
          rules.length === 0 ? styles.emptyContent : styles.listContent
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No rules yet</Text>
            <Text style={styles.emptyHint}>
              Tap + to add your first rule
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('RuleEditor', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F2F2F7'},
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
  title: {fontSize: 22, fontWeight: '700', color: '#000'},
  headerActions: {flexDirection: 'row', gap: 8},
  headerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  headerBtnText: {color: '#007AFF', fontSize: 14, fontWeight: '500'},
  listContent: {paddingVertical: 12},
  emptyContent: {flex: 1, justifyContent: 'center'},
  empty: {alignItems: 'center', paddingBottom: 60},
  emptyTitle: {fontSize: 20, fontWeight: '600', color: '#3C3C43', marginBottom: 8},
  emptyHint: {fontSize: 15, color: '#8E8E93'},
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
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {fontSize: 28, color: '#fff', lineHeight: 32},
});
