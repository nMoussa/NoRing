import React, { useState } from 'react';
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
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { useRulesStore } from '../store/rulesStore';
import type { MatchType, RuleAction } from '../types/Rule';
import NumberPreview from '../components/NumberPreview';
import ActionBadge from '../components/ActionBadge';
import { useTranslation } from '../i18n/useTranslation';
import {
  PRIORITY_DEFAULT,
  PRIORITY_MIN,
  PRIORITY_MAX,
  PRIORITY_STEP,
} from '../constants/ruleConstraints';

type Props = StackScreenProps<RootStackParamList, 'RuleEditor'>;

export default function RuleEditorScreen({ route, navigation }: Props) {
  const s = useTranslation();
  const { ruleId } = route.params ?? {};
  const { rules, addRule, updateRule, deleteRule } = useRulesStore();
  const existing = ruleId ? rules.find(r => r.id === ruleId) : undefined;

  const [pattern, setPattern] = useState(existing?.patternRaw ?? '');
  const [matchType, setMatchType] = useState<MatchType>(
    existing?.matchType ?? 'prefix',
  );
  const [action, setAction] = useState<RuleAction>(
    existing?.action ?? 'block_voicemail',
  );
  const [priority, setPriority] = useState(
    existing?.priority ?? PRIORITY_DEFAULT,
  );

  const actions: { value: RuleAction; label: string }[] = [
    { value: 'block_voicemail', label: s.ruleEditor.actionBlockVoicemail },
    { value: 'reject', label: s.ruleEditor.actionReject },
    { value: 'silent', label: s.ruleEditor.actionSilent },
    { value: 'allow', label: s.ruleEditor.actionAllow },
  ];

  const showIosWarning = Platform.OS === 'ios' && matchType === 'prefix';

  const handleSave = () => {
    if (!pattern.trim()) {
      Alert.alert(s.ruleEditor.required, s.ruleEditor.requiredMessage);
      return;
    }
    if (existing) {
      updateRule(existing.id, {
        patternRaw: pattern,
        matchType,
        action,
        priority,
      });
      navigation.goBack();
    } else {
      const result = addRule({
        enabled: true,
        country: 'FR',
        matchType,
        patternRaw: pattern,
        action,
        priority,
      });
      if (!result) {
        Alert.alert(s.ruleEditor.required, s.ruleEditor.invalidPattern);
        return;
      }
      navigation.goBack();
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      s.ruleEditor.deleteConfirmTitle,
      s.ruleEditor.deleteConfirmMessage,
      [
        { text: s.ruleEditor.cancel, style: 'cancel' },
        {
          text: s.ruleEditor.delete,
          style: 'destructive',
          onPress: () => {
            deleteRule(existing.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Country — locked */}
          <Text style={styles.sectionLabel}>{s.ruleEditor.country}</Text>
          <View
            style={styles.lockedField}
            accessibilityLabel={`${s.ruleEditor.country}: France`}
          >
            <Text style={styles.lockedText}>🇫🇷 France</Text>
          </View>

          {/* Pattern input */}
          <Text style={styles.sectionLabel}>{s.ruleEditor.pattern}</Text>
          <TextInput
            style={styles.input}
            value={pattern}
            onChangeText={setPattern}
            placeholder={s.ruleEditor.patternPlaceholder}
            keyboardType="phone-pad"
            autoFocus={!existing}
            returnKeyType="done"
            accessibilityLabel={s.ruleEditor.pattern}
            accessibilityHint={s.ruleEditor.patternPlaceholder}
          />
          <NumberPreview raw={pattern} country="FR" matchType={matchType} />

          {/* Match type */}
          <Text style={[styles.sectionLabel, styles.mt]}>
            {s.ruleEditor.matchType}
          </Text>
          <View style={styles.segmented} accessibilityRole="tablist">
            {(['prefix', 'exact'] as MatchType[]).map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.segment,
                  matchType === t && styles.segmentActive,
                ]}
                onPress={() => setMatchType(t)}
                accessibilityLabel={
                  t === 'prefix'
                    ? s.ruleEditor.matchPrefix
                    : s.ruleEditor.matchExact
                }
                accessibilityRole="tab"
                accessibilityState={{ selected: matchType === t }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    matchType === t && styles.segmentTextActive,
                  ]}
                >
                  {t === 'prefix'
                    ? s.ruleEditor.matchPrefix
                    : s.ruleEditor.matchExact}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showIosWarning && (
            <View style={styles.iosWarningBox} accessibilityLiveRegion="polite">
              <Text style={styles.iosWarningText}>
                ⚠ {s.ruleEditor.iosPrefixWarning}
              </Text>
            </View>
          )}

          {/* Action */}
          <Text style={[styles.sectionLabel, styles.mt]}>
            {s.ruleEditor.action}
          </Text>
          {actions.map(a => (
            <TouchableOpacity
              key={a.value}
              style={[
                styles.actionRow,
                action === a.value && styles.actionRowActive,
              ]}
              onPress={() => setAction(a.value)}
              accessibilityLabel={a.label}
              accessibilityRole="radio"
              accessibilityState={{ selected: action === a.value }}
            >
              <Text style={styles.actionLabel}>{a.label}</Text>
              {action === a.value && <ActionBadge action={a.value} />}
            </TouchableOpacity>
          ))}

          {/* Priority */}
          <Text style={[styles.sectionLabel, styles.mt]}>
            {s.ruleEditor.priority}
          </Text>
          <View style={styles.priorityRow}>
            <TouchableOpacity
              style={styles.priorityBtn}
              onPress={() =>
                setPriority(p => Math.max(PRIORITY_MIN, p - PRIORITY_STEP))
              }
              accessibilityLabel={s.a11y.decreasePriority}
              accessibilityRole="button"
            >
              <Text style={styles.priorityBtnText}>−</Text>
            </TouchableOpacity>
            <Text
              style={styles.priorityValue}
              accessibilityLabel={`Priority: ${priority}`}
            >
              {priority}
            </Text>
            <TouchableOpacity
              style={styles.priorityBtn}
              onPress={() =>
                setPriority(p => Math.min(PRIORITY_MAX, p + PRIORITY_STEP))
              }
              accessibilityLabel={s.a11y.increasePriority}
              accessibilityRole="button"
            >
              <Text style={styles.priorityBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.priorityHint}>{s.ruleEditor.priorityHint}</Text>

          {/* Save */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            accessibilityLabel={s.ruleEditor.save}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>{s.ruleEditor.save}</Text>
          </TouchableOpacity>

          {existing && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              accessibilityLabel={s.ruleEditor.delete}
              accessibilityRole="button"
            >
              <Text style={styles.deleteBtnText}>{s.ruleEditor.delete}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  mt: { marginTop: 20 },
  lockedField: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
  },
  lockedText: { fontSize: 16, color: '#000' },
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
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 14, color: '#6C6C70' },
  segmentTextActive: { color: '#000', fontWeight: '600' },
  iosWarningBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  iosWarningText: { fontSize: 13, color: '#8A5000' },
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
  actionRowActive: { borderColor: '#007AFF' },
  actionLabel: { fontSize: 15, color: '#000' },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    overflow: 'hidden',
  },
  priorityBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F2F2F7',
  },
  priorityBtnText: { fontSize: 22, color: '#007AFF', fontWeight: '500' },
  priorityValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  priorityHint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 6,
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: { color: '#FF3B30', fontSize: 16 },
});
