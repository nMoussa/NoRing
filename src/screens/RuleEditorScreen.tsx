import React, {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type {StackScreenProps} from '@react-navigation/stack';
import type {RootStackParamList} from '../navigation/RootNavigator';
import {useRulesStore} from '../store/rulesStore';
import type {MatchType, RuleAction} from '../types/Rule';
import NumberPreview from '../components/NumberPreview';
import ActionBadge from '../components/ActionBadge';

type Props = StackScreenProps<RootStackParamList, 'RuleEditor'>;

const ACTIONS: {value: RuleAction; label: string}[] = [
  {value: 'block_voicemail', label: 'Send to voicemail'},
  {value: 'reject', label: 'Reject call'},
  {value: 'silent', label: 'Silence ring'},
  {value: 'allow', label: 'Always allow'},
];

export default function RuleEditorScreen({route, navigation}: Props) {
  const {ruleId} = route.params ?? {};
  const {rules, addRule, updateRule, deleteRule} = useRulesStore();
  const existing = ruleId ? rules.find(r => r.id === ruleId) : undefined;

  const [pattern, setPattern] = useState(existing?.patternRaw ?? '');
  const [matchType, setMatchType] = useState<MatchType>(
    existing?.matchType ?? 'prefix',
  );
  const [action, setAction] = useState<RuleAction>(
    existing?.action ?? 'block_voicemail',
  );

  const showIosWarning = Platform.OS === 'ios' && matchType === 'prefix';

  const handleSave = () => {
    if (!pattern.trim()) {
      Alert.alert('Required', 'Please enter a number pattern.');
      return;
    }
    if (existing) {
      updateRule(existing.id, {patternRaw: pattern, matchType, action});
    } else {
      const result = addRule({
        enabled: true,
        country: 'FR',
        matchType,
        patternRaw: pattern,
        action,
        priority: 100,
        scope: 'incoming' as any,
      });
      if (!result) {
        Alert.alert(
          'Invalid Pattern',
          'Could not recognise this as a valid French number or prefix. Try formats like "03", "+333", or "+33312345678".',
        );
        return;
      }
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Delete Rule', 'Are you sure you want to delete this rule?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRule(existing.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Country (locked to FR) */}
          <Text style={styles.sectionLabel}>Country</Text>
          <View style={styles.lockedField}>
            <Text style={styles.lockedText}>🇫🇷 France</Text>
          </View>

          {/* Pattern input */}
          <Text style={styles.sectionLabel}>Number pattern</Text>
          <TextInput
            style={styles.input}
            value={pattern}
            onChangeText={setPattern}
            placeholder="e.g. 03 or +33312345678"
            keyboardType="phone-pad"
            autoFocus={!existing}
            returnKeyType="done"
          />
          <NumberPreview raw={pattern} country="FR" matchType={matchType} />

          {/* Match type */}
          <Text style={[styles.sectionLabel, styles.mt]}>Match type</Text>
          <View style={styles.segmented}>
            {(['prefix', 'exact'] as MatchType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.segment,
                  matchType === t && styles.segmentActive,
                ]}
                onPress={() => setMatchType(t)}>
                <Text
                  style={[
                    styles.segmentText,
                    matchType === t && styles.segmentTextActive,
                  ]}>
                  {t === 'prefix' ? 'Prefix' : 'Exact number'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showIosWarning && (
            <View style={styles.iosWarningBox}>
              <Text style={styles.iosWarningText}>
                ⚠ iOS only supports exact numbers. This prefix rule will only be active on Android.
              </Text>
            </View>
          )}

          {/* Action */}
          <Text style={[styles.sectionLabel, styles.mt]}>Action</Text>
          {ACTIONS.map(a => (
            <TouchableOpacity
              key={a.value}
              style={[
                styles.actionRow,
                action === a.value && styles.actionRowActive,
              ]}
              onPress={() => setAction(a.value)}>
              <Text style={styles.actionLabel}>{a.label}</Text>
              {action === a.value && <ActionBadge action={a.value} />}
            </TouchableOpacity>
          ))}

          {/* Save / Delete */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>

          {existing && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Rule</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F2F2F7'},
  flex: {flex: 1},
  content: {padding: 20, paddingBottom: 60},
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  mt: {marginTop: 20},
  lockedField: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  lockedText: {fontSize: 16, color: '#000'},
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 2,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {backgroundColor: '#fff'},
  segmentText: {fontSize: 14, color: '#6C6C70'},
  segmentTextActive: {color: '#000', fontWeight: '600'},
  iosWarningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  iosWarningText: {fontSize: 13, color: '#8A5000'},
  actionRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionRowActive: {borderColor: '#007AFF'},
  actionLabel: {fontSize: 15, color: '#000'},
  saveBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: {color: '#FF3B30', fontSize: 16},
});
