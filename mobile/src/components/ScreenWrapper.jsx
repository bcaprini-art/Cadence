/**
 * ScreenWrapper — safe area + dark background container for all screens
 */
import React from 'react';
import {StyleSheet, ScrollView, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS, SPACING} from '../lib/colors';

export default function ScreenWrapper({
  children,
  scrollable = true,
  style,
  contentStyle,
}) {
  const insets = useSafeAreaInsets();

  const container = [
    styles.base,
    {paddingTop: insets.top},
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={container}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    );
  }

  return <View style={[container, styles.content, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
});
