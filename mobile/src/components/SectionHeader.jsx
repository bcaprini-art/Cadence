import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {COLORS, SPACING, FONT} from '../lib/colors';

export default function SectionHeader({title, actionLabel, onAction}) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '700',
  },
  action: {
    color: COLORS.green,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
});
