import React from 'react';
import {Platform, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import type {Rule} from '../types/Rule';
import ActionBadge from './ActionBadge';

interface Props {
  rule: Rule;
  onToggle: () => void;
  onPress: () => void;
}

export default function RuleCard({rule, onToggle, onPress}: Props) {
  const showIosWarning =
    Platform.OS === 'ios' && rule.matchType === 'prefix';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={[styles.pattern, !rule.enabled && styles.dimmed]}>
            {rule.patternRaw}
          </Text>
          <Text style={styles.normalized}>{rule.patternNormalized}</Text>
          {showIosWarning && (
            <Text style={styles.iosWarning}>Android only (iOS: exact numbers only)</Text>
          )}
        </View>
        <View style={styles.right}>
          <ActionBadge action={rule.action} />
          <Switch
            value={rule.enabled}
            onValueChange={onToggle}
            style={styles.toggle}
            trackColor={{true: '#34C759'}}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  pattern: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  normalized: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Menlo',
    marginTop: 2,
  },
  iosWarning: {
    fontSize: 11,
    color: '#FF9500',
    marginTop: 3,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  toggle: {
    marginTop: 4,
  },
  dimmed: {
    opacity: 0.4,
  },
});
