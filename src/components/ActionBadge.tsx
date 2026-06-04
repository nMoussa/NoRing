import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {RuleAction} from '../types/Rule';

const COLORS: Record<RuleAction, {bg: string; text: string}> = {
  block_voicemail: {bg: '#FF3B30', text: '#fff'},
  reject: {bg: '#FF9500', text: '#fff'},
  silent: {bg: '#5856D6', text: '#fff'},
  allow: {bg: '#34C759', text: '#fff'},
};

const LABELS: Record<RuleAction, string> = {
  block_voicemail: 'Voicemail',
  reject: 'Reject',
  silent: 'Silent',
  allow: 'Allow',
};

interface Props {
  action: RuleAction;
}

export default function ActionBadge({action}: Props) {
  const {bg, text} = COLORS[action];
  return (
    <View style={[styles.badge, {backgroundColor: bg}]}>
      <Text style={[styles.label, {color: text}]}>{LABELS[action]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
