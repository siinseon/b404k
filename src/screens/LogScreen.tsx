import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LcdPanel } from '../components/LcdPanel';
import { Colors, Typography, Spacing, Border, Shadows } from '../constants/theme';
import { useSessions } from '../store/sessionStore';
import { ReadingSession } from '../types/session';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(min: number) {
  if (min <= 0) return '--:--';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${m}m`;
}

function fmtDate(dateStr: string) {
  // YYYY-MM-DD → MM/DD
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
  return dateStr;
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({
  session,
  onRemove,
}: {
  session: ReadingSession;
  onRemove: () => void;
}) {
  const pages = Math.max(0, session.endPage - session.startPage);

  const handleRemove = () => {
    Alert.alert('DELETE LOG', '이 세션 로그를 삭제합니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: onRemove },
    ]);
  };

  return (
    <View style={sr.root}>
      {/* Left: date */}
      <View style={sr.dateCol}>
        <Text style={sr.date}>{fmtDate(session.date)}</Text>
      </View>

      <View style={sr.divV} />

      {/* Center: info */}
      <View style={sr.center}>
        <Text style={sr.title} numberOfLines={1}>{session.bookTitle}</Text>
        <View style={sr.metaRow}>
          <Text style={sr.meta}>p.{session.startPage}→{session.endPage}</Text>
          <Text style={sr.metaDot}>·</Text>
          <Text style={sr.meta}>{pages} pp</Text>
          <Text style={sr.metaDot}>·</Text>
          <Text style={sr.meta}>{fmtTime(session.readingTimeMin)}</Text>
        </View>
        {session.memo ? (
          <Text style={sr.memo} numberOfLines={1}>"{session.memo}"</Text>
        ) : null}
      </View>

      {/* Right: delete */}
      <TouchableOpacity onPress={handleRemove} activeOpacity={0.75} style={sr.delBtn}>
        <Text style={sr.delBtnLabel}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const sr = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dateCol: {
    width: 36,
    alignItems: 'center',
  },
  date: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  divV: {
    width: 1,
    height: '100%',
    minHeight: 32,
    backgroundColor: Colors.border,
  },
  center: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Typography.fontMono,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  meta: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  metaDot: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textDisabled,
  },
  memo: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textDisabled,
    fontStyle: 'italic',
    marginTop: 1,
  },
  delBtn: {
    width: 26,
    height: 26,
    borderWidth: Border.thin,
    borderTopColor: Colors.metalHighlight,
    borderLeftColor: Colors.metalHighlight,
    borderBottomColor: Colors.metalShadow,
    borderRightColor: Colors.metalShadow,
    borderRadius: 2,
    backgroundColor: Colors.metalMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delBtnLabel: {
    fontFamily: Typography.fontMono,
    fontSize: 9,
    color: Colors.textMuted,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export function LogScreen() {
  const { sessions, stats, removeSession } = useSessions();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>LOG</Text>
        <View style={[styles.led, sessions.length > 0 && styles.ledOn]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* LCD header */}
        <LcdPanel padding={Spacing.md}>
          <View style={styles.lcdRow}>
            <Text style={styles.lcdCap}>LOG</Text>
            <Text style={styles.lcdValue}>
              {String(sessions.length).padStart(3, '0')} ENTRIES
            </Text>
          </View>
          <Text style={styles.lcdSub}>
            {sessions.length === 0 ? 'NO ENTRIES' : `TODAY: ${stats.todaySessions} SESSIONS`}
          </Text>
        </LcdPanel>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statKey}>TOTAL PP</Text>
            <Text style={styles.statVal}>{stats.totalPages}</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={styles.statKey}>TODAY PP</Text>
            <Text style={styles.statVal}>{stats.todayPages}</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statItem}>
            <Text style={styles.statKey}>TODAY TIME</Text>
            <Text style={styles.statVal}>{fmtTime(stats.todayTimeMin)}</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>SESSION HISTORY</Text>
          <View style={styles.sectionRule} />
        </View>

        {/* Session list */}
        <View style={styles.listPanel}>
          {/* Column header */}
          <View style={styles.colHeader}>
            <Text style={[styles.colText, { width: 36 + Spacing.sm }]}>DATE</Text>
            <View style={{ width: 1 + Spacing.sm }} />
            <Text style={[styles.colText, { flex: 1 }]}>BOOK / DETAILS</Text>
          </View>
          <View style={styles.listDivider} />

          {sessions.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>≡</Text>
              <Text style={styles.emptyText}>NO SESSION LOGS</Text>
              <Text style={styles.emptyHint}>USE START SESSION TO RECORD</Text>
            </View>
          )}

          {sessions.map((session, i) => (
            <React.Fragment key={session.id}>
              {i > 0 && <View style={styles.listDivider} />}
              <SessionRow session={session} onRemove={() => removeSession(session.id)} />
            </React.Fragment>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ENTRIES: {sessions.length}</Text>
          <Text style={styles.footerText}>
            TOTAL: {fmtTime(stats.totalTimeMin)}
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.body },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.panel,
    borderBottomWidth: Border.thin,
    borderBottomColor: Colors.border,
  },
  topBarTitle: {
    fontFamily: Typography.fontMono,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 4,
    color: Colors.text,
  },
  led: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: Colors.statusInactive,
    borderWidth: 1, borderColor: Colors.metalShadow,
  },
  ledOn: { backgroundColor: Colors.accentGreen },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  bottomPad: { height: Spacing.lg },

  lcdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  lcdCap: {
    fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1.5, color: Colors.lcdTextDim,
  },
  lcdValue: {
    fontFamily: Typography.fontMono, fontSize: 13, fontWeight: '700', letterSpacing: 1, color: Colors.lcdText,
  },
  lcdSub: {
    fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1, color: Colors.lcdTextDim, marginTop: Spacing.xs,
  },

  statsStrip: {
    flexDirection: 'row',
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    paddingVertical: Spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDiv: { width: 1, backgroundColor: Colors.border },
  statKey: {
    fontFamily: Typography.fontMono, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted,
  },
  statVal: {
    fontFamily: Typography.fontMono, fontSize: 12, fontWeight: '700', color: Colors.text,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Typography.fontMono, fontSize: 9, fontWeight: '700', letterSpacing: 2, color: Colors.textMuted,
  },
  sectionRule: { flex: 1, height: 1, backgroundColor: Colors.border },

  listPanel: {
    borderWidth: Border.regular,
    ...Shadows.inset,
    borderRadius: 2,
    backgroundColor: Colors.panel,
    overflow: 'hidden',
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.metalMid,
    gap: Spacing.sm,
  },
  colText: {
    fontFamily: Typography.fontMono, fontSize: 8, letterSpacing: 1.5, color: Colors.textMuted,
  },
  listDivider: { height: Border.thin, backgroundColor: Colors.border },

  emptyState: {
    paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 24, color: Colors.textDisabled, lineHeight: 32 },
  emptyText: {
    fontFamily: Typography.fontMono, fontSize: 11, fontWeight: '700', letterSpacing: 2, color: Colors.textDisabled,
  },
  emptyHint: {
    fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1, color: Colors.textDisabled,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.panel,
    borderWidth: Border.thin,
    borderColor: Colors.border,
    borderRadius: 2,
  },
  footerText: {
    fontFamily: Typography.fontMono, fontSize: 9, letterSpacing: 1, color: Colors.textMuted,
  },
});
