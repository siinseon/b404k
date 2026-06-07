import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Border } from '../constants/theme';

interface BootScreenProps {
  onComplete: () => void;
}

const DURATION_MS = 2000;
const TICK_MS = 40;
const TOTAL_TICKS = DURATION_MS / TICK_MS; // 50
const SEGMENTS = 16;

export function BootScreen({ onComplete }: BootScreenProps) {
  const [pct, setPct] = useState(0);
  const tick = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      tick.current += 1;
      const next = Math.min(Math.round((tick.current / TOTAL_TICKS) * 100), 100);
      setPct(next);

      if (tick.current >= TOTAL_TICKS) {
        clearInterval(timer.current!);
        setTimeout(onComplete, 500);
      }
    }, TICK_MS);

    return () => { if (timer.current) clearInterval(timer.current); };
  }, [onComplete]);

  const filledSegments = Math.round((pct / 100) * SEGMENTS);

  return (
    <SafeAreaView style={styles.root}>

      {/* Main content */}
      <View style={styles.body}>
        <Text style={styles.title}>B404K</Text>
        <View style={styles.divider} />
        <Text style={styles.subtitle}>Reading Not Found</Text>
        <Text style={styles.status}>Initializing Reading System...</Text>
      </View>

      {/* LCD progress panel */}
      <View style={styles.progressPanel}>
        <View style={styles.lcdOuter}>
          <View style={styles.lcdInner}>
            <View style={styles.topRow}>
              <Text style={styles.loadingLabel}>LOADING</Text>
              <Text style={styles.pctLabel}>{String(pct).padStart(3, '\u2007')}%</Text>
            </View>
            <View style={styles.track}>
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.segment,
                    i < filledSegments && styles.segmentOn,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
        <Text style={styles.footer}>B404K CORP  ·  ALL RIGHTS RESERVED</Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.lcdBackground,
    justifyContent: 'space-between',
  },

  // ── Body ──────────────────────────────────────────────
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl + Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontMono,
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: 10,
    color: Colors.lcdText,
    lineHeight: 60,
  },
  divider: {
    width: 140,
    height: 2,
    backgroundColor: Colors.lcdText,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.lcdText,
    lineHeight: 18,
  },
  status: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 1,
    color: Colors.lcdTextDim,
    lineHeight: 16,
    marginTop: Spacing.xs,
  },

  // ── Progress panel ────────────────────────────────────
  progressPanel: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  lcdOuter: {
    borderWidth: Border.regular,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 2,
    padding: 2,
  },
  lcdInner: {
    borderWidth: Border.thin,
    borderTopColor: Colors.lcdShadow,
    borderLeftColor: Colors.lcdShadow,
    borderBottomColor: Colors.lcdHighlight,
    borderRightColor: Colors.lcdHighlight,
    borderRadius: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.lcdBackground,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadingLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 2,
    color: Colors.lcdTextDim,
  },
  pctLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    color: Colors.lcdText,
  },
  track: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.lcdShadow,
    borderRadius: 1,
  },
  segmentOn: {
    backgroundColor: Colors.lcdText,
  },
  footer: {
    fontFamily: Typography.fontMono,
    fontSize: 8,
    letterSpacing: 1.5,
    color: Colors.lcdTextDim,
    textAlign: 'center',
  },
});
