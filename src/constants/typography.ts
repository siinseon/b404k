import { Platform } from 'react-native';

const monoFont = Platform.select({
  ios: 'Courier New',
  android: 'monospace',
  default: 'monospace',
});

const sansFont = Platform.select({
  ios: 'Helvetica Neue',
  android: 'sans-serif-condensed',
  default: 'sans-serif',
});

export const Typography = {
  // Font families
  fontMono: monoFont,
  fontSans: sansFont,

  // LCD display (monospace, Discman-style)
  lcdLarge: {
    fontFamily: monoFont,
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 2,
    lineHeight: 36,
  },
  lcdMedium: {
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: 1.5,
    lineHeight: 24,
  },
  lcdSmall: {
    fontFamily: monoFont,
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 1,
    lineHeight: 16,
  },
  lcdTiny: {
    fontFamily: monoFont,
    fontSize: 10,
    fontWeight: '400' as const,
    letterSpacing: 0.8,
    lineHeight: 14,
  },

  // UI labels (clean, Mac System 7 style)
  labelLarge: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  labelMedium: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: sansFont,
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 0.6,
    lineHeight: 14,
  },

  // Body text
  bodyMedium: {
    fontFamily: sansFont,
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: sansFont,
    fontSize: 11,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 16,
  },

  // Tab bar
  tabLabel: {
    fontFamily: monoFont,
    fontSize: 9,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    lineHeight: 12,
    textTransform: 'uppercase' as const,
  },
} as const;
