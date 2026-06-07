export const Colors = {
  // Base surfaces
  body: '#E9E9E4',
  panel: '#F5F5F0',
  border: '#BEBEB8',

  // Text
  text: '#222222',
  textMuted: '#666660',
  textDisabled: '#AEAEA8',

  // LCD
  lcdBackground: '#C8D5B3',
  lcdText: '#38452F',
  lcdTextDim: '#5A6E48',
  lcdShadow: '#A8B890',
  lcdHighlight: '#D8E8BE',

  // Accent
  accentGreen: '#8DFF57',
  accentGreenDim: '#5ACC2A',
  accentGreenGlow: 'rgba(141, 255, 87, 0.3)',

  // Metal / chrome
  metalLight: '#F0F0EC',
  metalMid: '#D8D8D2',
  metalDark: '#B0B0A8',
  metalShadow: '#888884',
  metalHighlight: '#FFFFFF',

  // Status
  statusActive: '#8DFF57',
  statusInactive: '#5A6E48',
  statusWarning: '#FFD057',
  statusError: '#FF5757',

  // Transparent
  transparent: 'transparent',
  overlayDark: 'rgba(34, 34, 34, 0.4)',
} as const;

export type ColorKey = keyof typeof Colors;
