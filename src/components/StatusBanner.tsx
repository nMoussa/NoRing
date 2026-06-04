import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';

interface Props {
  message: string;
  onPress?: () => void;
}

export default function StatusBanner({message, onPress}: Props) {
  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}>
      <Text style={styles.text}>⚠ {message}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
});
