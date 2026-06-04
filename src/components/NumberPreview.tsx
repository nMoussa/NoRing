import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {Country, MatchType} from '../types/Rule';
import {toE164, normalizePrefixPattern} from '../services/phoneNumber';

interface Props {
  raw: string;
  country: Country;
  matchType: MatchType;
}

export default function NumberPreview({raw, country, matchType}: Props) {
  if (!raw.trim()) {
    return null;
  }

  const normalized =
    matchType === 'exact'
      ? toE164(raw, country)
      : normalizePrefixPattern(raw, country);

  if (!normalized) {
    return (
      <View style={styles.container}>
        <Text style={styles.invalid}>Invalid pattern</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {matchType === 'prefix' ? 'Matches numbers starting with ' : 'Matches '}
        <Text style={styles.value}>{normalized}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 13,
    color: '#555',
  },
  value: {
    fontFamily: 'Menlo',
    color: '#007AFF',
    fontWeight: '600',
  },
  invalid: {
    fontSize: 13,
    color: '#FF3B30',
  },
});
