import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {COLORS, RADIUS, SPACING, FONT} from '../lib/colors';

export default function Button({
  title,
  onPress,
  color,
  variant = 'primary', // 'primary' | 'outline' | 'ghost'
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const bg = color || COLORS.green;

  const containerStyle = [
    styles.base,
    variant === 'primary' && {backgroundColor: bg},
    variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: bg,
    },
    variant === 'ghost' && {backgroundColor: 'transparent'},
    (disabled || loading) && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variant === 'primary' && {color: '#fff'},
    variant === 'outline' && {color: bg},
    variant === 'ghost' && {color: bg},
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? '#fff' : bg}
          size="small"
        />
      ) : (
        <Text style={labelStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  label: {
    fontSize: FONT.md,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
