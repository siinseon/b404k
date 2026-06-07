import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Border, Spacing } from '../constants/theme';

interface LcdPanelProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function LcdPanel({ children, style, padding = Spacing.md }: LcdPanelProps) {
  return (
    <View style={[styles.outerBevel, style]}>
      <View style={styles.innerBevel}>
        <View style={[styles.screen, { padding }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerBevel: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
    borderRadius: Radius.sm,
    backgroundColor: Colors.lcdBackground,
  },
  innerBevel: {
    borderWidth: Border.thin,
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.lcdShadow,
    borderRightColor: Colors.lcdShadow,
    borderRadius: Radius.sm - 1,
    backgroundColor: Colors.lcdBackground,
  },
  screen: {
    backgroundColor: Colors.lcdBackground,
    borderRadius: Radius.sm - 1,
  },
});
