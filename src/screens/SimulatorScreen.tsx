import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useRulesStore} from '../store/rulesStore';
import {evaluate} from '../services/ruleEngine';
import {toE164} from '../services/phoneNumber';
import ActionBadge from '../components/ActionBadge';
import type {RuleAction} from '../types/Rule';

export default function SimulatorScreen() {
  const {rules} = useRulesStore();
  const [input, setInput] = useState('');
  const [tested, setTested] = useState(false);

  const result = tested ? evaluate(input, rules) : null;

  const e164 = input.trim() ? toE164(input) : null;

  // On iOS, only exact-match blocking works; prefix rules are Android-only
  const iosEffectiveAction = (): RuleAction => {
    if (!result?.match) return 'allow';
    if (result.match.rule.matchType === 'exact') return result.action;
    return 'allow';
  };

  const handleTest = () => {
    setTested(true);
  };

  const handleClear = () => {
    setInput('');
    setTested(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <Text style={styles.instruction}>
            Enter a phone number to see which rule would apply.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={v => {
                setInput(v);
                setTested(false);
              }}
              placeholder="e.g. 03 12 34 56 78"
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={handleTest}
            />
            {input.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {e164 && (
            <Text style={styles.e164}>E.164: {e164}</Text>
          )}

          <TouchableOpacity
            style={[styles.testBtn, !input.trim() && styles.testBtnDisabled]}
            onPress={handleTest}
            disabled={!input.trim()}>
            <Text style={styles.testBtnText}>Test</Text>
          </TouchableOpacity>

          {tested && result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Result</Text>

              {result.match ? (
                <>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Matched rule</Text>
                    <Text style={styles.resultValue}>
                      {result.match.rule.patternRaw}
                    </Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>Android action</Text>
                    <ActionBadge action={result.action} />
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultLabel}>iOS outcome</Text>
                    <ActionBadge action={iosEffectiveAction()} />
                  </View>
                  {result.match.rule.matchType === 'prefix' && (
                    <Text style={styles.iosNote}>
                      ⚠ This is a prefix rule — iOS allows the call (exact numbers only).
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.noMatch}>
                  No rule matches — call would be allowed on both platforms.
                </Text>
              )}
            </View>
          )}

          {tested && !result && (
            <View style={styles.resultCard}>
              <Text style={styles.noMatch}>
                Enter a valid French number to simulate.
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#F2F2F7'},
  flex: {flex: 1},
  container: {padding: 20},
  instruction: {fontSize: 15, color: '#555', marginBottom: 16},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#C6C6C8',
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  clearBtn: {padding: 8},
  clearBtnText: {color: '#8E8E93', fontSize: 16},
  e164: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'Menlo',
    marginTop: 6,
    marginLeft: 4,
  },
  testBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  testBtnDisabled: {opacity: 0.4},
  testBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  resultTitle: {fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4},
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultLabel: {fontSize: 14, color: '#555'},
  resultValue: {fontSize: 14, fontWeight: '600', color: '#000'},
  noMatch: {fontSize: 14, color: '#555', fontStyle: 'italic'},
  iosNote: {fontSize: 12, color: '#FF9500', marginTop: 4},
});
