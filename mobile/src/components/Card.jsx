import React from 'react';
import {View, StyleSheet} from 'react-native';
import {COLORS, RADIUS, SPACING} from '../lib/colors';

export default function Card({children, style}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
});
