import { Colors } from './colors';
import { Typography } from './typography';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 8,
  pill: 999,
} as const;

export const Border = {
  thin: 1,
  regular: 2,
  thick: 3,
} as const;

// Shared panel / inset shadow style (Mac System 7 inset look)
export const Shadows = {
  inset: {
    // Simulated via border on react-native
    borderTopColor: Colors.metalShadow,
    borderLeftColor: Colors.metalShadow,
    borderBottomColor: Colors.metalHighlight,
    borderRightColor: Colors.metalHighlight,
  },
  raised: {
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
  },
} as const;

export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  border: Border,
  shadows: Shadows,
} as const;

export { Colors, Typography };
