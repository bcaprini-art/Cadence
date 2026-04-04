import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {COLORS, RADIUS, SPACING, FONT} from '../lib/colors';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  style,
  ...rest
}) {
  return (
    <View style={[styles.wrapper, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  error: {
    color: COLORS.danger,
    fontSize: FONT.xs,
    marginTop: 4,
  },
});
