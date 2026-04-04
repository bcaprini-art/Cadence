/**
 * CARABar — horizontal progress bar showing CARA hours used/limit
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS, SPACING, RADIUS, FONT} from '../lib/colors';

const CARA_WEEKLY_LIMIT = 20;

export default function CARABar({
  used = 0,
  limit = CARA_WEEKLY_LIMIT,
  accentColor,
  showLabel = true,
  style,
}) {
  const pct = Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 75 && pct < 90;
  const isDanger = pct >= 90;

  const barColor = isDanger
    ? COLORS.danger
    : isWarning
    ? COLORS.warning
    : accentColor || COLORS.green;

  return (
    <View style={[styles.wrapper, style]}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>CARA Hours</Text>
          <Text style={[styles.value, {color: barColor}]}>
            {used.toFixed(1)} / {limit}h
          </Text>
        </View>
      )}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {width: `${pct}%`, backgroundColor: barColor},
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT.xs,
  },
  value: {
    fontSize: FONT.xs,
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
});
