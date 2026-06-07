import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Radius, Border, Spacing } from '../constants/theme';

type ButtonVariant = 'round' | 'rect' | 'pill';
type ButtonSize = 'sm' | 'md' | 'lg';

interface MetalButtonProps {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  children?: React.ReactNode;
  disabled?: boolean;
}

const sizeMap = {
  sm: { width: 32, height: 32, fontSize: 10 },
  md: { width: 44, height: 44, fontSize: 12 },
  lg: { width: 56, height: 56, fontSize: 14 },
};

export function MetalButton({
  label,
  onPress,
  variant = 'rect',
  size = 'md',
  active = false,
  style,
  labelStyle,
  children,
  disabled = false,
}: MetalButtonProps) {
  const dim = sizeMap[size];
  const borderRadius =
    variant === 'round'
      ? dim.width / 2
      : variant === 'pill'
      ? Radius.pill
      : Radius.md;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.outerBevel,
        {
          width: variant === 'pill' ? undefined : dim.width,
          height: dim.height,
          borderRadius,
          opacity: disabled ? 0.4 : 1,
        },
        active && styles.activeOuter,
        style,
      ]}
    >
      <View
        style={[
          styles.face,
          { borderRadius: borderRadius - 1 },
          active && styles.activeFace,
        ]}
      >
        {children ?? (
          <Text
            style={[
              styles.label,
              { fontSize: dim.fontSize },
              active && styles.activeLabel,
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Pill-shaped wide button
export function MetalPillButton({
  label,
  onPress,
  active = false,
  disabled = false,
  style,
}: Omit<MetalButtonProps, 'variant' | 'size'>) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        styles.outerBevel,
        styles.pillOuter,
        active && styles.activeOuter,
        { opacity: disabled ? 0.4 : 1 },
        style,
      ]}
    >
      <View style={[styles.face, styles.pillFace, active && styles.activeFace]}>
        <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerBevel: {
    borderWidth: Border.regular,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    backgroundColor: Colors.metalMid,
  },
  activeOuter: {
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
  },
  face: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.metalMid,
    margin: 1,
    paddingHorizontal: Spacing.sm,
  },
  activeFace: {
    backgroundColor: Colors.metalDark,
  },
  label: {
    ...Typography.labelSmall,
    color: Colors.text,
    textAlign: 'center',
  },
  activeLabel: {
    color: Colors.accentGreen,
  },
  pillOuter: {
    borderRadius: Radius.pill,
    height: 36,
    paddingHorizontal: 0,
  },
  pillFace: {
    borderRadius: Radius.pill - 1,
    paddingHorizontal: Spacing.lg,
  },
});
